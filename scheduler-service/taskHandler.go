package main

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
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

var retryDelays = []time.Duration{time.Minute, 5 * time.Minute, 15 * time.Minute}

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

	stopTaskTimer(task.ID)

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

func stopTaskTimer(taskID uint) {
	timerManager.timersMu.Lock()
	defer timerManager.timersMu.Unlock()

	if timer, ok := timerManager.timers[taskID]; ok {
		timer.Stop()
		delete(timerManager.timers, taskID)
	}
}

// cancelTaskExecution stops the timer of a task deleted through the API, so that it doesn't fire.
func cancelTaskExecution(taskID string) {
	id, err := strconv.ParseUint(taskID, 10, 64)
	if err != nil {
		log.Printf("Invalid task ID %q: %v", taskID, err)

		return
	}

	stopTaskTimer(uint(id))
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

// executeTask retries failed requests, e.g. when the target is restarting during a deploy.
// A task that still hasn't succeeded afterwards is tried again the next time this service starts.
func executeTask(ctx context.Context, task scheduledTask) {
	retryAttempts(retryDelays, time.Sleep, func() bool {
		// Reload the task, as it may have been edited or deleted since it was scheduled
		current, err := gorm.G[scheduledTask](db).
			Where("id = ? AND has_executed = ?", task.ID, false).
			First(ctx)
		if err != nil {
			log.Printf("Not executing task ID %d: %v", task.ID, err)

			return true
		}

		if !sendTaskRequest(current) {
			return false
		}

		setTaskExecuted(ctx, task.ID)

		return true
	})
}

// retryAttempts calls attempt until it reports being done, waiting for each delay in between.
func retryAttempts(delays []time.Duration, sleep func(time.Duration), attempt func() bool) {
	for _, delay := range delays {
		if attempt() {
			return
		}

		sleep(delay)
	}

	attempt()
}

func sendTaskRequest(task scheduledTask) bool {
	log.Printf("Executing task ID: %d to %s", task.ID, task.EndpointURL)

	req, err := http.NewRequest(http.MethodPost, task.EndpointURL, bytes.NewBufferString(task.Body))
	if err != nil {
		log.Printf("Error creating request for task ID %d: %v", task.ID, err)

		return false
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(sharedSecretHeader, os.Getenv("PASSWORD"))

	client := &http.Client{
		Timeout: 2 * time.Minute,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error executing request for task ID %d: %v", task.ID, err)

		return false
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("Task ID %d executed with non-success status: %d", task.ID, resp.StatusCode)

		return false
	}

	log.Printf("Task ID %d executed successfully. Status: %d", task.ID, resp.StatusCode)

	return true
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
