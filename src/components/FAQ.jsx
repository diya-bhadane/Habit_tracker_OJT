import { useState } from "react";

const faqs = [
  {
    question: "What do I get with Premium?",
    answer:
      "Unlimited habits, advanced analytics, cloud backup, and priority support to keep you on track.",
    icon: "?",
  },
  {
    question: "What happens if I miss a day?",
    answer:
      "Nothing breaks permanently — we just reset that habit's streak so you can start fresh the next day.",
    icon: "!",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can change or cancel your plan anytime from your account settings with no extra fees.",
    icon: "?",
  },
  {
    question: "How does streak tracking work?",
    answer:
      "We count the number of days in a row you complete a habit and highlight your longest streaks.",
    icon: "!",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(-1);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className="py-20 text-center">
      <div className="max-w-4xl mx-auto px-6 md:px-0">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#0f172a]">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          Everything you need to know before getting started
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <button
                type="button"
                key={item.question}
                onClick={() => handleToggle(index)}
                className={`w-full rounded-full bg-[#c7e9ff] px-6 py-4 text-left text-sm font-medium text-[#0f172a] shadow-sm shadow-slate-200 border transition-colors ${
                  isOpen ? "border-[#1d4ed8] bg-[#c0e3ff]" : "border-slate-100"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs">
                      {item.icon}
                    </span>
                    <span>{item.question}</span>
                  </span>
                  <span
                    className={`text-lg transform transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ⌄
                  </span>
                </div>

                {isOpen && (
                  <p className="mt-3 ml-11 text-xs md:text-sm text-[#0f172a]/80">
                    {item.answer}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-[#0f172a] underline cursor-pointer">View All FAQs</p>
      </div>
    </section>
  );
}
