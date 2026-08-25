import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Sends each user a daily digest push of their open tasks due today or tomorrow. */
export async function sendDailyTaskReminders() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const [tasks, subtasks] = await Promise.all([
    prisma.task.findMany({
      where: { status: "OPEN", dueDate: { gte: today, lt: dayAfter }, createdById: { not: null } },
      select: { dueDate: true, createdById: true },
    }),
    prisma.subtask.findMany({
      where: { status: "OPEN", dueDate: { gte: today, lt: dayAfter }, createdById: { not: null } },
      select: { dueDate: true, createdById: true },
    }),
  ]);

  const counts = new Map<string, { today: number; tomorrow: number }>();
  for (const item of [...tasks, ...subtasks]) {
    if (!item.createdById || !item.dueDate) continue;
    const bucket = item.dueDate < tomorrow ? "today" : "tomorrow";
    const entry = counts.get(item.createdById) ?? { today: 0, tomorrow: 0 };
    entry[bucket]++;
    counts.set(item.createdById, entry);
  }

  await Promise.all(
    [...counts.entries()].map(([userId, { today: todayCount, tomorrow: tomorrowCount }]) => {
      const parts: string[] = [];
      if (todayCount) parts.push(`${todayCount} due today`);
      if (tomorrowCount) parts.push(`${tomorrowCount} due tomorrow`);
      if (parts.length === 0) return null;

      return sendPushToUser(userId, {
        title: "Task reminders",
        body: `You have ${parts.join(" and ")}.`,
        url: "/my-tasks",
      });
    })
  );
}
