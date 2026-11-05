package search

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// meiliClient is a small client for the handful of Meilisearch endpoints
// search needs, rather than an SDK dependency - same reasoning as
// internal/notifications' Expo client.
type meiliClient struct {
	host   string
	apiKey string
	http   *http.Client
}

func newMeiliClient(host, apiKey string) *meiliClient {
	return &meiliClient{
		host:   strings.TrimSuffix(host, "/"),
		apiKey: apiKey,
		http:   &http.Client{Timeout: 30 * time.Second},
	}
}

type meiliError struct {
	Status  int
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *meiliError) Error() string {
	return fmt.Sprintf("meilisearch: %d %s: %s", e.Status, e.Code, e.Message)
}

func (c *meiliClient) do(ctx context.Context, method, path string, body, out any) error {
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encode meilisearch request: %w", err)
		}
		reader = bytes.NewReader(data)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.host+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("meilisearch %s %s: %w", method, path, err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		merr := &meiliError{Status: res.StatusCode}
		_ = json.NewDecoder(res.Body).Decode(merr)
		return merr
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(res.Body).Decode(out)
}

type enqueuedTask struct {
	TaskUID int64 `json:"taskUid"`
}

type task struct {
	Status string      `json:"status"`
	Error  *meiliError `json:"error"`
}

// enqueue runs a request that answers with an enqueued task and waits for
// that task to finish, like the old syncHelpers.ts waitForTask (60s
// timeout).
func (c *meiliClient) enqueue(ctx context.Context, method, path string, body any) error {
	var enq enqueuedTask
	if err := c.do(ctx, method, path, body, &enq); err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	for {
		var t task
		if err := c.do(
			ctx,
			http.MethodGet,
			fmt.Sprintf("/tasks/%d", enq.TaskUID),
			nil,
			&t,
		); err != nil {
			return err
		}
		switch t.Status {
		case "succeeded":
			return nil
		case "failed", "canceled":
			if t.Error != nil {
				return t.Error
			}
			return fmt.Errorf("meilisearch task %d %s", enq.TaskUID, t.Status)
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("meilisearch task %d: %w", enq.TaskUID, ctx.Err())
		case <-time.After(100 * time.Millisecond):
		}
	}
}

// ensureIndex creates uid if it doesn't exist yet.
func (c *meiliClient) ensureIndex(ctx context.Context, uid string) error {
	err := c.enqueue(ctx, http.MethodPost, "/indexes", map[string]string{
		"uid":        uid,
		"primaryKey": "id",
	})
	if merr, ok := err.(*meiliError); ok && merr.Code == "index_already_exists" {
		return nil
	}
	return err
}

func (c *meiliClient) deleteAllDocuments(ctx context.Context, uid string) error {
	return c.enqueue(ctx, http.MethodDelete, "/indexes/"+url.PathEscape(uid)+"/documents", nil)
}

func (c *meiliClient) updateSettings(
	ctx context.Context,
	uid string,
	settings indexSettings,
) error {
	return c.enqueue(ctx, http.MethodPatch, "/indexes/"+url.PathEscape(uid)+"/settings", settings)
}

func (c *meiliClient) addDocuments(ctx context.Context, uid string, docs any) error {
	return c.enqueue(
		ctx,
		http.MethodPost,
		"/indexes/"+url.PathEscape(uid)+"/documents?primaryKey=id",
		docs,
	)
}

type federatedQuery struct {
	IndexUID             string            `json:"indexUid"`
	Q                    string            `json:"q"`
	AttributesToSearchOn []string          `json:"attributesToSearchOn"`
	FederationOptions    federationOptions `json:"federationOptions"`
}

type federationOptions struct {
	Weight float64 `json:"weight"`
}

type multiSearchRequest struct {
	Federation struct {
		Limit  int `json:"limit"`
		Offset int `json:"offset"`
	} `json:"federation"`
	Queries []federatedQuery `json:"queries"`
}

type multiSearchResponse struct {
	Hits []map[string]any `json:"hits"`
}

func (c *meiliClient) multiSearch(
	ctx context.Context,
	req multiSearchRequest,
) (*multiSearchResponse, error) {
	var res multiSearchResponse
	if err := c.do(ctx, http.MethodPost, "/multi-search", req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}
