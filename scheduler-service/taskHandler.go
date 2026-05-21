package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"gorm.io/gorm"
)

type scheduledTask struct {
	gorm.Model
	RunTimestamp string
	EndpointURL  string
	Body         string
	HasExecuted  bool
	CreatedBy    *string
}

type createScheduledTaskResponse struct {
	ScheduledTaskID uint `json:"scheduledTaskID"`
}

var timerManager = struct {
	timers   map[uint]*time.Timer
	timersMu sync.Mutex
}{
	timers: make(map[uint]*time.Timer),
}

func scheduleTaskExecution(ctx context.Context, task scheduledTask) {
	runTime, err := time.Parse(time.RFC3339, task.RunTimestamp)
	if err != nil {
		log.Printf("Failed to parse RunTimestamp for task ID %d: %v", task.ID, err)

		return
	}

	delay := time.Until(runTime)

	if timer, ok := timerManager.timers[task.ID]; ok {
		timer.Stop()
		timerManager.timersMu.Lock()
		delete(timerManager.timers, task.ID)
		timerManager.timersMu.Unlock()
	}

	if delay <= 0 {
		log.Printf("RunTimestamp for task ID %d is in the past. Executing immediately.", task.ID)
		go executeTask(ctx, task)

		return
	}

	log.Printf("Scheduling task ID %d to run at %s", task.ID, runTime.Format(time.RFC1123))

	timer := time.AfterFunc(delay, func() {
		executeTask(ctx, task)

		timerManager.timersMu.Lock()
		delete(timerManager.timers, task.ID)
		timerManager.timersMu.Unlock()
	})

	timerManager.timersMu.Lock()
	timerManager.timers[task.ID] = timer
	timerManager.timersMu.Unlock()
}

func rescheduleTaskExecution(ctx context.Context, taskID uint) {
	log.Printf("Rescheduling task ID %d", taskID)
	task, err := gorm.G[scheduledTask](db).
		Where("id = ? AND has_executed = ?", taskID, false).
		First(ctx)
	if err != nil {
		log.Printf("Failed to load task %d for reschedule: %v", taskID, err)

		return
	}

	scheduleTaskExecution(ctx, task)
}

// TODO: Decide how to handle failures/retries
func executeTask(ctx context.Context, task scheduledTask) {
	log.Printf("Executing task ID: %d to %s", task.ID, task.EndpointURL)

	var bodyMap map[string]any
	if err := json.Unmarshal([]byte(task.Body), &bodyMap); err != nil {
		log.Printf("Error unmarshalling body for task ID %d: %v", task.ID, err)

		return
	}
	bodyMap["password"] = os.Getenv("PASSWORD")
	bodyBytes, err := json.Marshal(bodyMap)
	if err != nil {
		log.Printf("Error marshalling body for task ID %d: %v", task.ID, err)

		return
	}
	req, err := http.NewRequest(http.MethodPost, task.EndpointURL, bytes.NewBuffer(bodyBytes))
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

		return
	}

	setTaskExecuted(ctx, task.ID)
}

// TODO: Decide how to handle failures/retries
func setTaskExecuted(ctx context.Context, taskID uint) {
	if _, err := gorm.G[scheduledTask](
		db,
	).Where("id = ?", taskID).
		Update(ctx, "has_executed", true); err != nil {
		log.Printf("Failed to update database for task ID %d: %v", taskID, err)
	}
}
