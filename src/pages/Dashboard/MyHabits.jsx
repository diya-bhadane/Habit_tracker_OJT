import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import HabitCard from "./HabitCard";
import WeeklyChart from "./WeeklyChart";
import {
  getActiveUserId,
  fetchUserState,
  apiCreateHabit,
  apiToggleHabitToday,
  apiDeleteHabit,
} from "../../utils/apiClient";

const ACTIVE_USER_KEY = "habitrix_activeUser";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DAILY_QUOTES = [
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
  },
  {
    text: "Motivation is what gets you started. Habit is what keeps you going.",
    author: "Jim Ryun",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "The secret to getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Losing is a habit. So is winning. Decide which you want to practice today.",
    author: "Anonymous",
  },
];

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getPreviousDateKey(dateKey) {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function calculateCurrentStreak(completions, todayKey) {
  if (!Array.isArray(completions) || completions.length === 0) return 0;
  const set = new Set(completions.map((d) => d.slice(0, 10)));
  let streak = 0;
  let cursor = todayKey;
  while (set.has(cursor)) {
    streak += 1;
    cursor = getPreviousDateKey(cursor);
  }
  return streak;
}

function calculateLongestStreak(completions) {
  if (!Array.isArray(completions) || completions.length === 0) return 0;
  const unique = Array.from(new Set(completions.map((d) => d.slice(0, 10))));
  unique.sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const prev = new Date(unique[i - 1] + "T00:00:00");
    const cur = new Date(unique[i] + "T00:00:00");
    const diffDays = (cur - prev) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function computeHabitsWithMeta(habits, todayKey) {
  return habits.map((habit) => {
    const completions = Array.isArray(habit.completions) ? habit.completions : [];
    const completedToday = completions
      .map((d) => d.slice(0, 10))
      .includes(todayKey);
    const currentStreak = calculateCurrentStreak(completions, todayKey);
    const longestStreak = calculateLongestStreak(completions);
    return {
      ...habit,
      completions,
      completedToday,
      currentStreak,
      longestStreak,
    };
  });
}

function getLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const day = DAY_LABELS[d.getDay()];
    days.push({ dateKey, day, value: 0 });
  }
  return days;
}

function buildWeeklyData(habits) {
  const days = getLast7Days();
  const byDate = {};
  days.forEach((d) => {
    byDate[d.dateKey] = d;
  });

  habits.forEach((habit) => {
    const completions = Array.isArray(habit.completions) ? habit.completions : [];
    completions.forEach((dateKey) => {
      const key = dateKey.slice(0, 10);
      if (byDate[key]) {
        byDate[key].value += 1;
      }
    });
  });

  return days.map((d) => ({ day: d.day, value: d.value }));
}

function countPerfectDaysThisMonth(habits) {
  if (!habits.length) return 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const completionsByDate = new Map();
  habits.forEach((habit) => {
    const completions = Array.isArray(habit.completions) ? habit.completions : [];
    completions.forEach((raw) => {
      const key = raw.slice(0, 10);
      const d = new Date(key + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month) {
        const prev = completionsByDate.get(key) || 0;
        completionsByDate.set(key, prev + 1);
      }
    });
  });

  const totalHabits = habits.length;
  let perfectDays = 0;
  completionsByDate.forEach((count) => {
    if (count >= totalHabits) perfectDays += 1;
  });
  return perfectDays;
}

export default function MyHabits() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState("");
  const [habits, setHabits] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [quote, setQuote] = useState(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");

  useEffect(() => {
    const activeUsername =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_USER_KEY)
        : null;
    const activeUserId = getActiveUserId();

    if (!activeUsername || !activeUserId) {
      navigate("/login");
      return;
    }

    async function load() {
      try {
        const user = await fetchUserState(activeUserId);
        setUserId(activeUserId);
        setUsername(user.username || activeUsername);
        const resolvedName =
          typeof user.name === "string" && user.name.trim()
            ? user.name
            : activeUsername;
        setDisplayName(resolvedName);
        setAvatar(
          typeof user.avatarDataUrl === "string" ? user.avatarDataUrl : ""
        );

        setHabits(Array.isArray(user.habits) ? user.habits : []);
        const random = DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
        setQuote(random);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load habits", error);
        navigate("/login");
      }
    }

    load();
  }, [navigate]);

  const todayKey = getTodayKey();

  const habitsWithMeta = useMemo(
    () => computeHabitsWithMeta(habits, todayKey),
    [habits, todayKey]
  );

  const completedTodayCount = habitsWithMeta.filter((h) => h.completedToday).length;
  const totalHabits = habitsWithMeta.length;
  const completionPercent =
    totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  const topStreak = habitsWithMeta.reduce(
    (best, h) => (h.currentStreak > best ? h.currentStreak : best),
    0
  );
  const weeklyData = useMemo(() => buildWeeklyData(habits), [habits]);
  const perfectDays = countPerfectDaysThisMonth(habitsWithMeta);

  const handleToggleHabitToday = async (habitId) => {
    if (!userId) return;
    try {
      const updatedHabits = await apiToggleHabitToday(userId, habitId, todayKey);
      setHabits(updatedHabits);
    } catch (error) {
      console.error("Failed to toggle habit", error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!userId) return;
    try {
      const updatedHabits = await apiDeleteHabit(userId, habitId);
      setHabits(updatedHabits);
    } catch (error) {
      console.error("Failed to delete habit", error);
    }
  };

  const handleCreateHabit = async (event) => {
    event.preventDefault();
    if (!newHabitName.trim() || !userId) return;

    try {
      const updatedHabits = await apiCreateHabit(userId, {
        name: newHabitName.trim(),
        description: newHabitDescription.trim() || "New habit",
      });
      setHabits(updatedHabits);
      setIsAddingHabit(false);
      setNewHabitName("");
      setNewHabitDescription("");
    } catch (error) {
      console.error("Failed to create habit", error);
    }
  };

  const handleManageProfile = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVE_USER_KEY);
      window.localStorage.removeItem("habitrix_activeUserId");
    }
    navigate("/login");
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading your habits...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10 pb-6 sm:px-6 lg:px-10">
            <Topbar
              username={displayName}
              handle={username}
              avatar={avatar}
              completion={completionPercent}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onNewHabit={() => setIsAddingHabit(true)}
              onManageProfile={handleManageProfile}
              onLogout={handleLogout}
            />

            <section className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/80 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Completion rate</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{completionPercent}%</p>
                <p className="mt-1 text-[11px] text-emerald-400">
                  {totalHabits > 0
                    ? `${completedTodayCount} of ${totalHabits} habits completed today`
                    : "Add a habit to get started"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/80 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Best streak</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{topStreak} days</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Longest active streak across your habits.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/80 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Active habits</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{totalHabits}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Track as many habits as you like.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/80 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Perfect days (this month)</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{perfectDays}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Days when you completed every habit.
                </p>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-50">My habits</h2>
                  <span className="text-xs text-slate-400">
                    {totalHabits === 0
                      ? "No habits yet"
                      : `${totalHabits} habit${totalHabits === 1 ? "" : "s"}`}
                  </span>
                </div>

                <div className="space-y-3">
                  {habitsWithMeta.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggleToday={() => handleToggleHabitToday(habit.id)}
                      onDelete={() => handleDeleteHabit(habit.id)}
                    />
                  ))}
                  {habitsWithMeta.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      You don&apos;t have any habits yet. Create one from the dashboard.
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <WeeklyChart data={weeklyData} />

                <div className="mt-2 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 px-5 py-4 text-sm text-slate-50 shadow-lg shadow-indigo-900/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                    Daily quote
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">
                    {quote ? `"${quote.text}"` : "Keep going. Your future self will thank you."}
                  </p>
                  <p className="mt-3 text-xs text-indigo-100/80">
                    {quote && quote.author ? `— ${quote.author}` : ""}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {isAddingHabit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleCreateHabit}
            className="w-full max-w-md rounded-2xl bg-white px-6 py-5 shadow-lg dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              New Habit
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Give your habit a short, clear name and optional description.
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Habit name (e.g., Read 20 mins)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
              <input
                type="text"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingHabit(false);
                  setNewHabitName("");
                  setNewHabitDescription("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Add Habit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
