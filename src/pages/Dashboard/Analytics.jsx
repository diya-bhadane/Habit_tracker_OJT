import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { getActiveUserId, fetchUserState } from "../../utils/apiClient";

const ACTIVE_USER_KEY = "habitrix_activeUser";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getLastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayIndex = d.getDay();
    days.push({ dateKey, dayLabel: DAY_LABELS[dayIndex] });
  }
  return days;
}

function buildDailyCompletionCounts(habits, daysBack) {
  const today = new Date();
  const keys = [];
  const counts = new Map();

  for (let i = daysBack - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    counts.set(key, 0);
  }

  habits.forEach((habit) => {
    const completions = Array.isArray(habit.completions) ? habit.completions : [];
    completions.forEach((raw) => {
      const key = raw.slice(0, 10);
      if (counts.has(key)) {
        counts.set(key, counts.get(key) + 1);
      }
    });
  });

  return keys.map((key) => ({ dateKey: key, count: counts.get(key) || 0 }));
}

function calculateCurrentStreak(completions, todayKey) {
  if (!Array.isArray(completions) || completions.length === 0) return 0;
  const set = new Set(completions.map((d) => d.slice(0, 10)));
  let streak = 0;
  let cursor = todayKey;
  while (set.has(cursor)) {
    streak += 1;
    const d = new Date(cursor + "T00:00:00");
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
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

function buildWeeklyPerformance(habits) {
  const days = getLastNDays(7);
  const totalHabits = habits.length;

  const dailyCounts = buildDailyCompletionCounts(habits, 7);
  const byDate = new Map(dailyCounts.map((d) => [d.dateKey, d.count]));

  return days.map(({ dateKey, dayLabel }) => {
    const completed = byDate.get(dateKey) || 0;
    const possible = totalHabits;
    const missed = possible > 0 ? Math.max(possible - completed, 0) : 0;
    return {
      day: dayLabel,
      completed,
      missed,
    };
  });
}

function buildStreakHistory(habits) {
  const totalHabits = habits.length;
  if (!totalHabits) {
    return [1, 2, 3, 4].map((i) => ({
      label: `Week ${i}`,
      completionRate: 0,
    }));
  }

  const dailyCounts = buildDailyCompletionCounts(habits, 28); // last 4 weeks

  const weeks = [];
  for (let i = 0; i < 4; i += 1) {
    const slice = dailyCounts.slice(i * 7, (i + 1) * 7);
    const completed = slice.reduce((sum, d) => sum + d.count, 0);
    const possible = totalHabits * slice.length;
    const completionRate = possible > 0 ? Math.round((completed / possible) * 100) : 0;
    weeks.push({
      label: `Week ${i + 1}`,
      completionRate,
    });
  }

  return weeks;
}

function buildMonthlyHeatmap(habits) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay(); // 0-6 (Sun-Sat)

  const totalHabits = habits.length;

  const completionsByDate = new Map();
  habits.forEach((habit) => {
    const completions = Array.isArray(habit.completions) ? habit.completions : [];
    completions.forEach((raw) => {
      const key = raw.slice(0, 10);
      const d = new Date(key + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month) {
        completionsByDate.set(key, (completionsByDate.get(key) || 0) + 1);
      }
    });
  });

  const weeks = [];
  let currentWeek = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    currentWeek.push({ key: `empty-start-${i}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const completed = completionsByDate.get(key) || 0;
    const ratio = totalHabits > 0 ? completed / totalHabits : 0;
    let level = 0;
    if (ratio >= 0.8) level = 4;
    else if (ratio >= 0.6) level = 3;
    else if (ratio >= 0.35) level = 2;
    else if (ratio > 0) level = 1;

    currentWeek.push({
      key,
      empty: false,
      level,
      day,
      completed,
      totalHabits,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        key: `empty-end-${currentWeek.length}`,
        empty: true,
      });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function buildDayDetail(habits, dateKey) {
  if (!dateKey || !habits.length) return null;

  const completedHabits = [];
  const missedHabits = [];

  habits.forEach((habit) => {
    const completions = Array.isArray(habit.completions) ? habit.completions : [];
    const hasCompletion = completions
      .map((d) => d.slice(0, 10))
      .includes(dateKey);
    if (hasCompletion) {
      completedHabits.push(habit);
    } else {
      missedHabits.push(habit);
    }
  });

  const total = habits.length;
  const completed = completedHabits.length;
  const missed = Math.max(total - completed, 0);
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    dateKey,
    total,
    completed,
    missed,
    rate,
    completedHabits,
    missedHabits,
  };
}

function formatDateLabel(dateKey) {
  if (!dateKey) return "";
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function computeInsights(habits) {
  const todayKey = getTodayKey();
  const totalHabits = habits.length;
  if (!totalHabits) {
    return {
      streakSummary: "Create a habit to start seeing insights.",
      weekendPattern: null,
      improvement: null,
      consistency: null,
    };
  }

  const dailyCountsLast30 = buildDailyCompletionCounts(habits, 30);
  const dailyCountsLast14 = dailyCountsLast30.slice(-14);
  const dailyCountsPrev7 = dailyCountsLast14.slice(0, 7);
  const dailyCountsLast7 = dailyCountsLast14.slice(7);

  const sum = (items) => items.reduce((acc, d) => acc + d.count, 0);

  const last7Completed = sum(dailyCountsLast7);
  const prev7Completed = sum(dailyCountsPrev7);
  const possiblePerDay = totalHabits;
  const last7Possible = possiblePerDay * dailyCountsLast7.length;
  const prev7Possible = possiblePerDay * dailyCountsPrev7.length;

  const last7Rate = last7Possible ? (last7Completed / last7Possible) * 100 : 0;
  const prev7Rate = prev7Possible ? (prev7Completed / prev7Possible) * 100 : 0;
  const change = last7Rate - prev7Rate;

  // Weekend vs weekday pattern over last 30 days
  let weekendCompleted = 0;
  let weekendPossible = 0;
  let weekdayCompleted = 0;
  let weekdayPossible = 0;

  dailyCountsLast30.forEach(({ dateKey, count }) => {
    const d = new Date(dateKey + "T00:00:00");
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekend) {
      weekendCompleted += count;
      weekendPossible += totalHabits;
    } else {
      weekdayCompleted += count;
      weekdayPossible += totalHabits;
    }
  });

  const weekendRate = weekendPossible ? (weekendCompleted / weekendPossible) * 100 : 0;
  const weekdayRate = weekdayPossible ? (weekdayCompleted / weekdayPossible) * 100 : 0;

  const weekendPattern =
    weekendPossible && weekdayPossible
      ? weekendRate >= weekdayRate + 5
        ? `You complete more habits on weekends (${weekendRate.toFixed(0)}%) than weekdays (${weekdayRate.toFixed(0)}%).`
        : weekendRate + 5 <= weekdayRate
        ? `You are more consistent on weekdays (${weekdayRate.toFixed(0)}%) than weekends (${weekendRate.toFixed(0)}%).`
        : "Your weekend and weekday consistency are about the same."
      : null;

  let improvement = null;
  if (last7Possible && prev7Possible) {
    if (change > 3) {
      improvement = `Your completion rate improved by ${change.toFixed(1)} percentage points in the last week.`;
    } else if (change < -3) {
      improvement = `Your completion rate dropped by ${Math.abs(change).toFixed(1)} percentage points in the last week.`;
    } else {
      improvement = "Your weekly completion rate is steady compared to the previous week.";
    }
  }

  const activeDays = dailyCountsLast30.filter((d) => d.count > 0).length;
  const consistency = `You completed at least one habit on ${activeDays} of the last 30 days.`;

  // Streak summary: best habit
  let bestHabit = null;
  let bestStreak = 0;
  habits.forEach((habit) => {
    const streak = calculateCurrentStreak(habit.completions || [], todayKey);
    if (streak > bestStreak) {
      bestStreak = streak;
      bestHabit = habit;
    }
  });

  const streakSummary =
    bestHabit && bestStreak > 0
      ? `Your best current streak is ${bestStreak} day${bestStreak === 1 ? "" : "s"} on "${bestHabit.name}".`
      : "You dont have an active streak yet. Try completing a habit today.";

  return { streakSummary, weekendPattern, improvement, consistency };
}

export default function Analytics() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [habits, setHabits] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

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
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load analytics data", error);
        navigate("/login");
      }
    }

    load();
  }, [navigate]);

  const todayKey = getTodayKey();

  const habitsWithMeta = useMemo(
    () =>
      habits.map((habit) => {
        const completions = Array.isArray(habit.completions)
          ? habit.completions
          : [];
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
      }),
    [habits, todayKey]
  );

  const totalHabits = habitsWithMeta.length;
  const completedTodayCount = habitsWithMeta.filter((h) => h.completedToday).length;
  const todayCompletionRate =
    totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  const weeklyPerformance = useMemo(
    () => buildWeeklyPerformance(habitsWithMeta),
    [habitsWithMeta]
  );

  const thisWeekCompleted = weeklyPerformance.reduce(
    (sum, d) => sum + d.completed,
    0
  );
  const thisWeekPossible = totalHabits * weeklyPerformance.length;
  const weeklyCompletionRate =
    thisWeekPossible > 0 ? Math.round((thisWeekCompleted / thisWeekPossible) * 100) : 0;

  const longestStreakOverall = habitsWithMeta.reduce(
    (max, h) => (h.longestStreak > max ? h.longestStreak : max),
    0
  );

  const streakHistory = useMemo(
    () => buildStreakHistory(habitsWithMeta),
    [habitsWithMeta]
  );

  const monthlyHeatmap = useMemo(
    () => buildMonthlyHeatmap(habitsWithMeta),
    [habitsWithMeta]
  );

  const selectedDayDetail = useMemo(
    () => (selectedDay ? buildDayDetail(habitsWithMeta, selectedDay.dateKey) : null),
    [selectedDay, habitsWithMeta]
  );

  const insights = useMemo(
    () => computeInsights(habitsWithMeta),
    [habitsWithMeta]
  );

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
          Loading your analytics...
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
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10 pb-8 sm:px-6 lg:px-10">
            <Topbar
              username={displayName}
              handle={username}
              avatar={avatar}
              completion={todayCompletionRate}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onNewHabit={() => navigate("/dashboard")}
              onManageProfile={handleManageProfile}
              onLogout={handleLogout}
            />

            <section className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Total habits</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{totalHabits}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Number of habits you are currently tracking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">This week</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {thisWeekCompleted}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Total habit completions in the last 7 days.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Weekly completion rate</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  {weeklyCompletionRate}%
                </p>
                <p className="mt-1 text-[11px] text-emerald-400">
                  {thisWeekPossible > 0
                    ? `${thisWeekCompleted} of ${thisWeekPossible} possible check-ins completed.`
                    : "Add a habit to start tracking your week."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-medium text-slate-400">Longest streak</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  {longestStreakOverall} day{longestStreakOverall === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Best streak across all habits.
                </p>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
              <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 shadow-sm">
                <header className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-50">
                      Weekly performance
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Completed vs missed check-ins for the last 7 days.
                    </p>
                  </div>
                </header>
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyPerformance}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1f2937"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#1f2937",
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#22c55e"
                        strokeWidth={2.4}
                        dot={{ r: 3, strokeWidth: 2, stroke: "#020617", fill: "#22c55e" }}
                        name="Completed"
                      />
                      <Line
                        type="monotone"
                        dataKey="missed"
                        stroke="#f97316"
                        strokeWidth={2.4}
                        dot={{ r: 3, strokeWidth: 2, stroke: "#020617", fill: "#f97316" }}
                        name="Missed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-50">
                  Monthly heatmap
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Each square shows how many habits you completed on that day.
                </p>
                <div className="mt-3">
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
                    {DAY_LABELS.map((d) => (
                      <span key={d} className="text-center">
                        {d.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {monthlyHeatmap.map((week) => (
                      <div
                        key={week.map((c) => c.key).join("-")}
                        className="grid grid-cols-7 gap-1.5"
                      >
                        {week.map((cell) => {
                          if (cell.empty) {
                            return (
                              <div
                                key={cell.key}
                                className="h-4 w-4 rounded-md bg-transparent"
                              />
                            );
                          }

                          const completed = cell.completed ?? 0;
                          const totalForCell = cell.totalHabits ?? totalHabits;
                          const missed = Math.max(totalForCell - completed, 0);
                          const ratio = totalForCell > 0 ? completed / totalForCell : 0;

                          let intensityClass = "bg-slate-800/60";
                          if (ratio > 0 && ratio < 0.25) intensityClass = "bg-emerald-900/70";
                          else if (ratio >= 0.25 && ratio < 0.5)
                            intensityClass = "bg-emerald-700";
                          else if (ratio >= 0.5 && ratio < 0.75)
                            intensityClass = "bg-emerald-500";
                          else if (ratio >= 0.75) intensityClass = "bg-emerald-300";

                          const isSelected =
                            selectedDay && selectedDay.dateKey === cell.key;

                          return (
                            <button
                              key={cell.key}
                              type="button"
                              onClick={() =>
                                setSelectedDay((current) =>
                                  current && current.dateKey === cell.key
                                    ? null
                                    : { dateKey: cell.key }
                                )
                              }
                              onMouseEnter={() =>
                                setHoveredCell({
                                  dateKey: cell.key,
                                  completed,
                                  missed,
                                  total: totalForCell,
                                })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`flex h-4 w-4 items-center justify-center rounded-md text-[9px] text-emerald-50 ${intensityClass} ${
                                isSelected ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900" : ""
                              }`}
                              title={
                                totalForCell
                                  ? `${completed}/${totalForCell} habits completed, ${missed} missed`
                                  : "No habits tracked yet"
                              }
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-[11px] text-slate-300">
                    {totalHabits === 0 ? (
                      <span>Add a habit to start seeing monthly activity.</span>
                    ) : hoveredCell ? (
                      <span>
                        {formatDateLabel(hoveredCell.dateKey)}: {hoveredCell.completed}/
                        {hoveredCell.total} habits completed, {hoveredCell.missed} missed.
                      </span>
                    ) : selectedDayDetail ? (
                      <span>
                        {formatDateLabel(selectedDayDetail.dateKey)}: {selectedDayDetail.completed}/
                        {selectedDayDetail.total} habits completed, {selectedDayDetail.missed} missed.
                      </span>
                    ) : (
                      <span>Hover over or click a day to see detailed stats.</span>
                    )}
                  </div>

                  {selectedDayDetail && (
                    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-xs text-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                        Day analytics
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDateLabel(selectedDayDetail.dateKey)} —
                        {" "}
                        {selectedDayDetail.completed}/{selectedDayDetail.total} habits
                        completed ({selectedDayDetail.rate}%).
                      </p>

                      {selectedDayDetail.completedHabits.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[11px] font-semibold text-emerald-300">
                            Completed habits
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                            {selectedDayDetail.completedHabits.map((habit) => (
                              <li
                                key={habit.id}
                                className="rounded-full bg-emerald-900/60 px-2 py-0.5"
                              >
                                {habit.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedDayDetail.missedHabits.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[11px] font-semibold text-slate-300">
                            Missed habits
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                            {selectedDayDetail.missedHabits.map((habit) => (
                              <li
                                key={habit.id}
                                className="rounded-full bg-slate-800 px-2 py-0.5"
                              >
                                {habit.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
              <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 shadow-sm">
                <header className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-50">
                      Streak history (last 4 weeks)
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Weekly completion rate across all habits.
                    </p>
                  </div>
                </header>
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={streakHistory}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1f2937"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Completion rate"]}
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#1f2937",
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Bar
                        dataKey="completionRate"
                        fill="#38bdf8"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 text-sm shadow-sm">
                <h2 className="text-base font-semibold text-slate-50">
                  Insights & recommendations
                </h2>
                <p className="text-[11px] text-slate-400">
                  These insights are calculated directly from your habit history.
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl border border-sky-500/40 bg-sky-900/40 px-4 py-3 text-xs text-slate-50">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                      Streaks
                    </p>
                    <p className="mt-2 leading-relaxed">{insights.streakSummary}</p>
                  </div>

                  {insights.weekendPattern && (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-4 py-3 text-xs text-slate-50">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                        Weekend pattern
                      </p>
                      <p className="mt-2 leading-relaxed">{insights.weekendPattern}</p>
                    </div>
                  )}

                  {insights.improvement && (
                    <div className="rounded-xl border border-indigo-500/40 bg-indigo-900/40 px-4 py-3 text-xs text-slate-50">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">
                        Trend
                      </p>
                      <p className="mt-2 leading-relaxed">{insights.improvement}</p>
                    </div>
                  )}

                  {insights.consistency && (
                    <div className="rounded-xl border border-violet-500/40 bg-violet-900/40 px-4 py-3 text-xs text-slate-50">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">
                        Consistency
                      </p>
                      <p className="mt-2 leading-relaxed">{insights.consistency}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
