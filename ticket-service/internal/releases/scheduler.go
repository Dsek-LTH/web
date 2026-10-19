package releases

import (
	"context"
	"errors"
	"log"
	"time"
)

// Scheduler drives the two time-based steps of a release's lifecycle
// in-process: running the grace-window lottery at opens_at+grace_window, and
// periodically sweeping expired offers so the waitlist keeps advancing.
// Kept in-process (rather than delegating to an external scheduler over
// HTTP) since ticket-service itself owns all the time-sensitive data, and a
// live per-release timer plus a cheap periodic sweep needs no durable
// cross-service scheduling.
type Scheduler struct {
	svc *Service
}

func NewScheduler(svc *Service) *Scheduler {
	return &Scheduler{svc: svc}
}

// lotteryRetryDelay is how long to wait before retrying a lottery run that
// failed, e.g. on a transient database error.
const lotteryRetryDelay = 30 * time.Second

// ArmLottery schedules RunLottery to fire when the grace window for this
// release ends, or immediately if that moment has already passed. A failed
// run is retried every lotteryRetryDelay until it succeeds (RunLottery is a
// no-op once the lottery has run, so a retry can never run it twice).
func (s *Scheduler) ArmLottery(release Release) {
	fireAt := release.OpensAt.Add(time.Duration(release.GraceWindowSeconds) * time.Second)
	s.armLotteryAfter(release.ID, time.Until(fireAt))
}

func (s *Scheduler) armLotteryAfter(releaseID string, delay time.Duration) {
	run := func() {
		err := s.svc.RunLottery(context.Background(), releaseID)
		if err != nil && !errors.Is(err, ErrNotFound) {
			log.Printf("lottery run failed for release %s, retrying in %s: %v", releaseID, lotteryRetryDelay, err)
			s.armLotteryAfter(releaseID, lotteryRetryDelay)
			return
		}
		if err != nil {
			log.Printf("lottery run failed for release %s: %v", releaseID, err)
		}
	}

	if delay <= 0 {
		go run()
		return
	}

	time.AfterFunc(delay, run)
}

// RestoreOnStartup re-arms lottery timers for every release whose lottery
// hasn't run yet - necessary because in-process timers don't survive a
// restart.
func (s *Scheduler) RestoreOnStartup(ctx context.Context) error {
	pending, err := s.svc.ListScheduledReleases(ctx)
	if err != nil {
		return err
	}
	for _, r := range pending {
		s.ArmLottery(r)
	}
	return nil
}

// RunSweepLoop periodically sweeps expired offers for every release that
// currently has one, until ctx is cancelled.
func (s *Scheduler) RunSweepLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.sweepOnce(ctx)
		}
	}
}

func (s *Scheduler) sweepOnce(ctx context.Context) {
	ids, err := s.svc.ListReleaseIDsWithActiveOffers(ctx)
	if err != nil {
		log.Printf("failed to list releases with active offers: %v", err)
		return
	}
	for _, id := range ids {
		if err := s.svc.SweepExpiredOffers(ctx, id); err != nil {
			log.Printf("offer sweep failed for release %s: %v", id, err)
		}
	}
}
