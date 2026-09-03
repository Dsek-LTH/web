package links

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// client is a small direct HTTP wrapper around Shlink's REST API v3
// (https://shlink.io), replacing the SvelteKit app's
// @shlinkio/shlink-js-sdk dependency - verified against that SDK's actual
// request shapes (dist/index.js in the pnpm store) rather than assumed,
// since this endpoint can't be exercised live here (see Service's doc
// comment). Auth is a single "X-Api-Key" header, same as the JS SDK.
type client struct {
	http    *http.Client
	baseURL string // e.g. "https://link.dsek.se/rest/v3"
	apiKey  string
}

func newClient(endpoint, apiKey string) *client {
	return &client{
		http:    http.DefaultClient,
		baseURL: strings.TrimRight(endpoint, "/") + "/rest/v3",
		apiKey:  apiKey,
	}
}

// problemDetails mirrors Shlink's RFC 7807 error body (and the JS SDK's
// ProblemDetailsError) - {type, title, detail, status}.
type problemDetails struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
	Status int    `json:"status"`
}

func (c *client) do(
	ctx context.Context,
	method, path string,
	query url.Values,
	body any,
) (json.RawMessage, error) {
	reqURL := c.baseURL + path
	if len(query) > 0 {
		reqURL += "?" + query.Encode()
	}

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("links: marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, reqURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("links: build request: %w", err)
	}
	req.Header.Set("X-Api-Key", c.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("links: request %s %s: %w", method, path, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("links: read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		var problem problemDetails
		_ = json.Unmarshal(respBody, &problem)
		if problem.Detail != "" {
			return nil, invalidf("shlink error: %s", problem.Detail)
		}
		if problem.Title != "" {
			return nil, invalidf("shlink error: %s", problem.Title)
		}
		return nil, invalidf("shlink error: status %d", resp.StatusCode)
	}

	if len(respBody) == 0 {
		return nil, nil
	}
	return json.RawMessage(respBody), nil
}

func (c *client) get(ctx context.Context, path string, query url.Values) (json.RawMessage, error) {
	return c.do(ctx, http.MethodGet, path, query, nil)
}

func (c *client) post(ctx context.Context, path string, body any) (json.RawMessage, error) {
	return c.do(ctx, http.MethodPost, path, nil, body)
}

func (c *client) patch(ctx context.Context, path string, body any) (json.RawMessage, error) {
	return c.do(ctx, http.MethodPatch, path, nil, body)
}

func (c *client) delete(ctx context.Context, path string, query url.Values) error {
	_, err := c.do(ctx, http.MethodDelete, path, query, nil)
	return err
}
