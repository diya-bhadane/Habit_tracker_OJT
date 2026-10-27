import { Link } from "react-router-dom";
import Navbar from "./Navbar";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-[#6558f5] to-[#7b4df4] text-white overflow-hidden rounded-b-[48px]">
      {/* Floating circles */}
      <div className="pointer-events-none absolute -left-8 top-28 h-24 w-24 rounded-full bg-white/20 blur-xl" />
      <div className="pointer-events-none absolute left-20 top-44 h-16 w-16 rounded-full bg-white/10 blur-lg" />
      <div className="pointer-events-none absolute right-10 top-24 h-20 w-20 rounded-full bg-white/20 blur-xl" />
      <div className="pointer-events-none absolute right-32 top-52 h-14 w-14 rounded-full bg-white/10 blur-lg" />
      <div className="pointer-events-none absolute right-40 bottom-8 h-10 w-10 rounded-full bg-black/30 blur" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-4 pb-24 lg:pb-32">
        <Navbar />

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              Build Better Habits.
              <br className="hidden sm:block" /> One Day at a Time.
            </h1>

            <p className="mt-5 max-w-xl text-sm md:text-base text-white/90 mx-auto lg:mx-0">
              Track your daily routines, stay consistent, and turn goals into habits —
              all in one beautiful app.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
              <Link to="/signup">
                <button className="px-8 py-3 rounded-full bg-white text-[#111827] font-semibold shadow-lg">
                  Get Started Free
                </button>
              </Link>

              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs md:text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span>Loved by 1M+ users worldwide</span>
              </div>
            </div>
          </div>

          {/* Phone mockups */}
          <div className="relative hidden h-[320px] md:block lg:h-[360px]">
            <div className="absolute -left-4 bottom-0 h-72 w-40 rotate-[-15deg] rounded-[32px] bg-white shadow-2xl shadow-black/30">
              <div className="h-10 w-full rounded-t-[32px] bg-gradient-to-r from-[#f97316] to-[#fb923c]" />
              <div className="mt-4 space-y-2 px-4 text-[10px] text-gray-500">
                <div className="h-2 w-16 rounded-full bg-gray-200" />
                <div className="h-2 w-20 rounded-full bg-gray-200" />
                <div className="mt-3 h-28 w-full rounded-2xl bg-[#fef3c7]" />
              </div>
            </div>

            <div className="absolute left-24 -bottom-6 h-80 w-44 rotate-[-4deg] rounded-[32px] bg-white shadow-2xl shadow-black/30">
              <div className="h-10 w-full rounded-t-[32px] bg-gradient-to-r from-[#22c55e] to-[#4ade80]" />
              <div className="mt-4 space-y-3 px-4 text-[10px] text-gray-500">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-16 rounded-full bg-gray-200" />
                  <div className="h-2 w-10 rounded-full bg-gray-200" />
                </div>
                <div className="h-24 w-full rounded-2xl bg-[#e0f2fe]" />
                <div className="h-2 w-20 rounded-full bg-gray-200" />
              </div>
            </div>

            <div className="absolute -right-6 -bottom-4 h-80 w-40 rotate-[12deg] rounded-[32px] bg-white shadow-2xl shadow-black/30">
              <div className="h-10 w-full rounded-t-[32px] bg-gradient-to-r from-[#6366f1] to-[#a855f7]" />
              <div className="mt-4 space-y-2 px-4 text-[10px] text-gray-500">
                <div className="h-2 w-14 rounded-full bg-gray-200" />
                <div className="h-2 w-24 rounded-full bg-gray-200" />
                <div className="mt-3 h-24 w-full rounded-2xl bg-[#fee2e2]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
