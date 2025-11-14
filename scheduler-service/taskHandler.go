package main

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"time"

	"gorm.io/gorm"
)

type ScheduledTask struct {
	gorm.Model
	RunTimestamp string
	EndpointURL  string
	Body         string
	HasExecuted  bool
	CreatedBy    *string
}

func scheduleTaskExecution(ctx context.Context, task ScheduledTask) {
	runTime, err := time.Parse(time.RFC3339, task.RunTimestamp)
	if err != nil {
		log.Printf("Failed to parse RunTimestamp for task ID %d: %v", task.ID, err)

		return
	}

	delay := time.Until(runTime)

	if delay <= 0 {
		log.Printf("RunTimestamp for task ID %d is in the past. Executing immediately.", task.ID)
		go executeTask(ctx, task)

		return
	}

	log.Printf("Scheduling task ID %d to run at %s", task.ID, runTime.Format(time.RFC1123))

	time.AfterFunc(delay, func() {
		executeTask(ctx, task)
	})
}

// TODO: Decide how to handle failures/retries
func executeTask(ctx context.Context, task ScheduledTask) {
	log.Printf("Executing task ID: %d to %s", task.ID, task.EndpointURL)

	req, err := http.NewRequest(http.MethodPost, task.EndpointURL, bytes.NewBuffer([]byte(task.Body)))
	if err != nil {
		log.Printf("Error creating request for task ID %d: %v", task.ID, err)

		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error executing request for task ID %d: %v", task.ID, err)

		return
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("Task ID %d executed successfully. Status: %d", task.ID, resp.StatusCode)
	} else {
		log.Printf("Task ID %d executed with non-success status: %d", task.ID, resp.StatusCode)
	}

	setTaskExecuted(ctx, task.ID)
}

// TODO: Decide how to handle failures/retries
func setTaskExecuted(ctx context.Context, taskID uint) {
	if _, err := gorm.G[ScheduledTask](db).Where("id = ?", taskID).Update(ctx, "has_executed", true); err != nil {
		log.Printf("Failed to update database for task ID %d: %v", taskID, err)
	}
}
