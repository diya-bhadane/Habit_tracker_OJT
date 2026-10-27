import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="py-20">
      <div className="rounded-[32px] bg-[#bfe0ff] px-8 py-14 md:px-12 md:py-16 lg:px-16 flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md text-left">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-sm bg-[#0f172a] text-white text-xl font-semibold">
            ⌘
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f172a] leading-tight">
            Ready to build
            <br /> better habits?
          </h2>
        </div>

        <div className="max-w-md text-sm text-[#1f2937]">
          <p>
            Take control of your daily routines, stay consistent with the goals that matter,
            and build meaningful progress — one habit at a time. With Habitrix, you’re just a
            step away from creating a better version of yourself.
          </p>

          <Link to="/signup">
            <button className="mt-8 inline-flex items-center justify-center rounded-full bg-[#f97316] px-7 py-3 text-sm font-semibold text-white shadow-md">
              Start Tracking — It’s Free
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
