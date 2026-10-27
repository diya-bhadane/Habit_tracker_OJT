import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#020617] text-white mt-24 pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Logo size={40} />
              <h2 className="text-xl font-semibold">Habitrix</h2>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Track your daily routines, stay consistent, and turn goals into habits — all in one
              beautiful app.
            </p>
            <div className="mt-6 flex gap-4 text-gray-400 text-lg">
              <span>◎</span>
              <span>◆</span>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
              Product
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Features</li>
              <li>Pricing</li>
              <li>FAQ</li>
              <li>Blog</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>About</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
              Newsletter
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Get tips & updates in your inbox.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full bg-[#020617] px-4 py-2 text-sm text-white placeholder:text-gray-500 border border-gray-700"
              />
              <button className="inline-flex items-center justify-center rounded-full bg-[#f97316] px-6 py-2 text-sm font-semibold text-white">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          © 2025 Habitrix. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
