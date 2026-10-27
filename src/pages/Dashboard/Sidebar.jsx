import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";

const navItems = [
  { label: "Dashboard", icon: "▢", path: "/dashboard" },
  { label: "My Habits", icon: "☰", path: "/habits" },
  { label: "Analytics", icon: "〆", path: "/analytics" },
  { label: "Mood Tracker", icon: "⽱", path: "/mood-tracker" },
  { label: "Community", icon: "👥", path: "/community" },
  { label: "Settings", icon: "⚙", path: "/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`
        fixed top-0 left-0 z-30
        w-64 h-screen
        bg-slate-900/95 backdrop-blur
        border-r border-slate-800
        transform transition-transform duration-200 ease-out

        md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-lg font-semibold text-slate-50">
            Habitrix
          </span>
        </div>

        {/* Close button in mobile */}
        <button
          onClick={onClose}
          className="md:hidden rounded-md p-1 text-slate-400 hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col flex-1 px-3 py-4 space-y-1 overflow-y-auto text-sm">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={
                "flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition " +
                (isActive
                  ? "bg-sky-900/60 text-sky-100"
                  : "text-slate-300 hover:bg-slate-800")
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-slate-200 shadow-sm">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}