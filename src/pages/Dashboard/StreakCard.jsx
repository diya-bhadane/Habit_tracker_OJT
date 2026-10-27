export default function StreakCard({ streak }) {
  const { value, label, icon, iconBg } = streak;

  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-base shadow-sm ${iconBg}`}
        >
          <span>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {value}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </article>
  );
}
