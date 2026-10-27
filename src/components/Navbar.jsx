import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <span className="text-xl font-semibold text-white">Habitrix</span>
      </div>

      {/* <ul className="hidden md:flex gap-8 text-sm font-medium text-white/90">
        <li>Home</li>
        <li>Features</li>
        <li>How it works</li>
        <li>Blog</li>
        <li>Resources</li>
        <li>About Us</li>
      </ul> */}

      <div className="flex items-center gap-3">
        <Link to="/signup">
          <button className="px-5 py-2 text-sm bg-white text-[#111827] rounded-full font-semibold shadow-sm">
            Sign Up
          </button>
        </Link>
        <Link to="/login">
          <button className="px-5 py-2 text-sm border border-white text-white rounded-full font-medium bg-white/5">
            Log In
          </button>
        </Link>
      </div>
    </nav>
  );
}
