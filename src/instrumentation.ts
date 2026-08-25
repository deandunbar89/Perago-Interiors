export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");
  const { sendDailyTaskReminders } = await import("@/lib/reminders");

  // 7am Dubai time, every day — one digest push per user of what's due today/tomorrow.
  cron.schedule("0 7 * * *", () => {
    sendDailyTaskReminders().catch((err) => console.error("Daily reminder job failed:", err));
  }, { timezone: "Asia/Dubai" });
}
