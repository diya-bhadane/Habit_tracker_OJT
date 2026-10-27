export default function HabitCard({ habit, onToggleToday, onDelete }) {
  const { name, description, icon, iconBg, completedToday, currentStreak } = habit;

  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-base shadow-sm ${iconBg}`}
        >
          <span>{icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Streak: {currentStreak} day{currentStreak === 1 ? "" : "s"}
          </p>
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleToday}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm shadow-sm transition-colors ${
            completedToday
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/60 dark:bg-emerald-950"
              : "border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
          }`}
          aria-label={completedToday ? "Mark habit incomplete" : "Mark habit complete"}
        >
          {completedToday ? "✓" : ""}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-xs text-slate-400 hover:text-red-500 hover:border-red-500/40 dark:text-slate-500"
          aria-label="Delete habit"
        >
          🗑
        </button>
      </div>
    </article>
  );
}
