import Link from "next/link";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { Calendar, Flag } from "lucide-react";
import type { TaskRow } from "./types";

export default function GridView({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        Nothing here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tasks.map((task) => {
        const due = task.dueDate ? startOfDay(task.dueDate) : null;
        const overdue = due && task.status === "OPEN" && isPast(due) && !isToday(due);
        const dueToday = due && isToday(due);

        return (
          <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p
              className={`mb-2 line-clamp-2 text-sm font-medium ${
                task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"
              }`}
            >
              {task.title}
            </p>
            {(task.task || task.pmProject) && (
              <div className="mb-3 space-y-1 text-xs text-slate-500">
                {task.task && (
                  <Link href={`/pm/deadlines/${task.task.id}`} className="flex items-center gap-1 hover:underline">
                    <Flag size={11} />
                    {task.task.title}
                  </Link>
                )}
                {task.pmProject && (
                  <Link href={`/pm/projects/${task.pmProject.id}`} className="block truncate hover:underline">
                    {task.pmProject.title}
                  </Link>
                )}
              </div>
            )}
            {due && (
              <span
                className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  overdue
                    ? "bg-red-50 text-red-700"
                    : dueToday
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                <Calendar size={11} />
                {format(due, "MMM d")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
