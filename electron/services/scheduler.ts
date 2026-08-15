import cron from "node-cron";

/**
 * Central place for every recurring job in the app. Keeping these in one
 * file makes it easy to see (and pause) everything that runs on a timer.
 */
export function startScheduler() {
  // Daily rank checks - 3 AM local time
  cron.schedule("0 3 * * *", async () => {
    // TODO: iterate tracked keywords and run rank checks
  });

  // Every 15 minutes - publish any social posts whose scheduled_at has passed
  cron.schedule("*/15 * * * *", async () => {
    // TODO: query social_posts where status = 'scheduled' and scheduledAt <= now
  });
}
