export default function Testimonials() {
  const users = [
    {
      name: "Sarah T.",
      role: "Writer",
      text: "I’ve finally stayed consistent with journaling for 90 days. This app made it effortless.",
    },
    {
      name: "James K.",
      role: "Software Engineer",
      text: "Seeing my progress visually keeps me motivated every day. The reminders are just perfect!",
    },
    {
      name: "Priya R.",
      role: "Wellness Coach",
      text: "I’ve tried several habit trackers, but this is the only one I actually stuck with.",
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f172a]">
            What our users say
          </h2>
          <p className="max-w-md text-sm text-gray-500">
            Real stories from people who turned their goals into habits.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {users.map((u, i) => (
            <article
              key={i}
              className="rounded-3xl bg-white px-7 py-8 shadow-sm shadow-slate-200 border border-slate-100"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm text-white">
                  {u.name.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-[#0f172a]">{u.name}</h4>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">“{u.text}”</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
