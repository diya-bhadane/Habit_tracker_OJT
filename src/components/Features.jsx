export default function Features() {
  const data = [
    {
      title: "Smart Reminders",
      desc: "Never miss a habit again. Set daily notifications or let the app suggest the best time.",
    },
    {
      title: "Progress Analytics",
      desc: "See your growth with weekly reports, streaks, and visual heatmaps.",
    },
    {
      title: "Streak Tracking",
      desc: "Stay motivated by building unbreakable streaks and unlocking milestones.",
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0f172a]">
            Why you’ll love it
          </h2>
          <p className="max-w-md text-sm text-gray-500">
            Designed to help you stay on track, effortlessly.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data.map((f, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white shadow-sm shadow-slate-200 px-7 py-8 border border-slate-100"
            >
              <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0f172a] text-white text-xs">
                {i === 0 && "★"}
                {i === 1 && "∞"}
                {i === 2 && "🔥"}
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a]">{f.title}</h3>
              <p className="mt-3 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
