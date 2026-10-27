/**  ------------------------------
  FINAL MOODTRACKER.JSX (Unified Green Heatmap)
  ------------------------------ */

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  getActiveUserId,
  fetchUserState,
  apiUpsertMoodDay,
  apiDeleteMoodDay,
} from "../../utils/apiClient";

const ACTIVE_USER_KEY = "habitrix_activeUser";

const moodOptions = [
  { emoji: "😀", value: "happy", label: "Happy" },
  { emoji: "🙂", value: "good", label: "Good" },
  { emoji: "😐", value: "neutral", label: "Neutral" },
  { emoji: "☹️", value: "low", label: "Low" },
  { emoji: "😢", value: "sad", label: "Sad" },
];

/* ------------------------------------------
   Unified GREEN Intensity Scale
------------------------------------------ */
const HEAT_COLORS = {
  1: "bg-emerald-900",
  2: "bg-emerald-800",
  3: "bg-emerald-700",
  4: "bg-emerald-500",
  5: "bg-emerald-300",
};

const MOOD_SCORE = {
  sad: 1,
  low: 2,
  neutral: 3,
  good: 4,
  happy: 5,
};

const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/* ----------------------------------------------------------
   BUILD MONTHLY GRID
---------------------------------------------------------- */
function buildMonthlyGrid(moodsMap) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();

  const weeks = [];
  let currentWeek = [];

  for (let i = 0; i < firstWeekday; i++) {
    currentWeek.push({ key: `empty-start-${i}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const entry = moodsMap[key] || null;

    currentWeek.push({
      key,
      empty: false,
      dateKey: key,
      day,
      mood: entry?.mood || null,
      score: entry?.mood ? MOOD_SCORE[entry.mood] : 0,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7)
      currentWeek.push({ key: `empty-end-${currentWeek.length}`, empty: true });
    weeks.push(currentWeek);
  }

  return weeks;
}

/* ----------------------------------------------------------
   HEATMAP TOOLTIP
---------------------------------------------------------- */
function HeatTooltip({ visible, x, y, cellData }) {
  if (!visible || !cellData) return null;

  const moodOption = moodOptions.find((m) => m.value === cellData.mood);

  return (
    <div
      className="fixed z-50 pointer-events-none transform -translate-y-2"
      style={{ left: x + 12, top: y + 12 }}
    >
      <div className="rounded-lg bg-slate-900/95 border border-slate-800 p-3 text-sm shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{moodOption?.emoji ?? "–"}</div>
          <div>
            <div className="font-semibold">
              {moodOption?.label ?? "No mood logged"}
            </div>
            <div className="text-[12px] text-slate-400">
              {cellData.dateKey &&
                new Date(cellData.dateKey + "T00:00:00").toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="mt-2 text-[13px] text-slate-300">
          {cellData.mood ? (
            <>
              <div>{`Mood: ${cellData.mood}`}</div>
              <div className="text-slate-400 text-[12px] mt-1">
                {cellData.notesCount
                  ? `${cellData.notesCount} note(s)`
                  : "No notes"}
              </div>
            </>
          ) : (
            <div className="text-slate-400">No mood data for this day</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   DAY DRAWER COMPONENT
---------------------------------------------------------- */
function DayDrawer({ open, onClose, dayKey, dayObj, onSaveDay }) {
  const [localMood, setLocalMood] = useState(dayObj?.mood || null);
  const [localNotes, setLocalNotes] = useState(dayObj?.notes || []);
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    setLocalNotes([...localNotes, { id: Date.now(), text: newNote }]);
    setNewNote("");
  };

  const deleteNoteLocal = (id) =>
    setLocalNotes(localNotes.filter((n) => n.id !== id));

  const saveAll = () => {
    onSaveDay(dayKey, { mood: localMood, notes: localNotes });
    onClose();
  };

  const clearDay = () => {
    onSaveDay(dayKey, null);
    onClose();
  };

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 z-40 ${
          open ? "opacity-60" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-full bg-slate-950 shadow-2xl border-l border-slate-800 transition-transform duration-300"
        style={{
          width: open ? 520 : 0,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800/30 flex justify-between">
            <div>
              <div className="text-lg font-semibold">
                {dayKey &&
                  new Date(dayKey + "T00:00:00").toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-400">
                View & edit mood + notes
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearDay}
                className="px-3 py-1 border border-slate-700 rounded-md text-slate-300"
              >
                Clear
              </button>
              <button
                onClick={saveAll}
                className="bg-emerald-600 px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </div>

          {/* mood + notes */}
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">Choose Mood</div>

              <div className="flex gap-3">
                {moodOptions.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setLocalMood(m.value)}
                    className={`text-3xl p-3 rounded-xl ${
                      localMood === m.value
                        ? "bg-sky-900/60 border border-sky-500"
                        : "bg-slate-800"
                    }`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Notes</div>

              <div className="space-y-3 mb-3">
                {localNotes.length ? (
                  localNotes.map((n) => (
                    <div
                      key={n.id}
                      className="bg-slate-800 p-3 rounded-md flex justify-between"
                    >
                      <div className="text-sm">{n.text}</div>
                      <button
                        onClick={() => deleteNoteLocal(n.id)}
                        className="text-red-400 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">
                    No notes yet.
                  </p>
                )}
              </div>

              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add note..."
                className="w-full h-28 p-3 bg-slate-800 rounded-md"
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={addNote}
                  className="px-3 py-2 bg-sky-600 rounded-md text-sm"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-800/30 text-xs text-slate-400">
            Press Save to apply changes.
          </div>
        </div>
      </div>
    </>
  );
}

/* ----------------------------------------------------------
   MAIN PAGE
---------------------------------------------------------- */
export default function MoodTracker() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState("");

  const [moods, setMoods] = useState({});
  const [todayMood, setTodayMood] = useState(null);
  const [note, setNote] = useState("");

  const [isReady, setIsReady] = useState(false);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    cell: null,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState(null);

  /* LOAD USER + MOODS */
  useEffect(() => {
    const activeUsername = localStorage.getItem(ACTIVE_USER_KEY);
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
        setDisplayName(user.name || activeUsername);
        setAvatar(user.avatarDataUrl || "");
        const moodData = user.moodLogs || {};
        setMoods(moodData);
        const key = new Date().toISOString().slice(0, 10);
        setTodayMood(moodData[key] || null);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load mood data", error);
        navigate("/login");
      }
    }

    load();
  }, [navigate]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const persistDay = async (dateKey, payload) => {
    if (!userId) return null;
    const saved = await apiUpsertMoodDay(userId, dateKey, payload);
    setMoods((prev) => ({ ...prev, [dateKey]: saved }));
    return saved;
  };

  /* Log mood */
  const handleLogMood = async (value) => {
    if (!userId) return;
    try {
      const payload = {
        mood: value,
        notes: moods[todayKey]?.notes || [],
      };
      const saved = await persistDay(todayKey, payload);
      setTodayMood(saved);
    } catch (error) {
      console.error("Failed to log mood", error);
    }
  };

  /* Today notes */
  const addNote = async () => {
    if (!note.trim() || !userId) return;
    try {
      const payload = {
        mood: todayMood?.mood || null,
        notes: [
          ...(todayMood?.notes || []),
          { id: String(Date.now()), text: note },
        ],
      };
      const saved = await persistDay(todayKey, payload);
      setTodayMood(saved);
      setNote("");
    } catch (error) {
      console.error("Failed to add mood note", error);
    }
  };

  const deleteNote = async (id) => {
    if (!todayMood || !userId) return;
    try {
      const payload = {
        mood: todayMood.mood,
        notes: (todayMood.notes || []).filter((n) => n.id !== id),
      };
      const saved = await persistDay(todayKey, payload);
      setTodayMood(saved);
    } catch (error) {
      console.error("Failed to delete mood note", error);
    }
  };

  /* Weekly intensity */
  const weeklySquares = useMemo(() => {
    const today = new Date();
    const weekday = today.getDay();

    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + (idx - weekday));
      const key = d.toISOString().slice(0, 10);

      return { key, date: d, mood: moods[key]?.mood || null };
    });
  }, [moods]);

  /* Last 7 days chart */
  const last7 = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        score: MOOD_SCORE[moods[key]?.mood] ?? null,
      };
    });
  }, [moods]);

  const monthGrid = useMemo(() => buildMonthlyGrid(moods), [moods]);

  /* MONTH SUMMARY — ALL 5 MOODS */
  const countsThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    let happy = 0,
      good = 0,
      neutral = 0,
      low = 0,
      sad = 0;

    Object.entries(moods).forEach(([dateKey, obj]) => {
      const d = new Date(dateKey + "T00:00:00");
      if (d.getFullYear() === y && d.getMonth() === m) {
        if (obj.mood === "happy") happy++;
        if (obj.mood === "good") good++;
        if (obj.mood === "neutral") neutral++;
        if (obj.mood === "low") low++;
        if (obj.mood === "sad") sad++;
      }
    });

    return { happy, good, neutral, low, sad };
  }, [moods]);

  /* Tooltip handlers */
  const handleCellMouseEnter = (e, cell) => {
    const notesCount = moods[cell.key]?.notes?.length || 0;

    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      cell: { dateKey: cell.key, mood: cell.mood, notesCount },
    });
  };

  const handleCellMouseMove = (e) =>
    setTooltip((t) => (t.visible ? { ...t, x: e.clientX, y: e.clientY } : t));

  const handleCellMouseLeave = () =>
    setTooltip({ visible: false, x: 0, y: 0, cell: null });

  /* Drawer */
  const openDrawerFor = (dateKey) => {
    setDrawerDate(dateKey);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const saveDayFromDrawer = async (dateKey, payload) => {
    if (!userId) return;
    try {
      if (!payload) {
        await apiDeleteMoodDay(userId, dateKey);
        setMoods((prev) => {
          const next = { ...prev };
          delete next[dateKey];
          return next;
        });
        if (dateKey === todayKey) setTodayMood(null);
      } else {
        const saved = await persistDay(dateKey, {
          mood: payload.mood,
          notes: payload.notes,
        });
        if (dateKey === todayKey) setTodayMood(saved);
      }
    } catch (error) {
      console.error("Failed to save day from drawer", error);
    }
  };

  if (!isReady) return null;

  /* ----------------------------------------------------------
     RENDER STARTS HERE
  ---------------------------------------------------------- */
  return (
    <div className="h-screen bg-slate-950 text-slate-50">
      <div className="flex h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto"
          onMouseMove={handleCellMouseMove}
        >
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-10 flex flex-col gap-6">
            {/* Topbar */}
            <Topbar
              username={displayName}
              handle={username}
              avatar={avatar}
              completion={0}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
              onNewHabit={() => navigate("/dashboard")}
              onManageProfile={() => navigate("/settings")}
              onLogout={() => {
                localStorage.removeItem(ACTIVE_USER_KEY);
                localStorage.removeItem("habitrix_activeUserId");
                navigate("/login");
              }}
            />

            {/* HEADER */}
            <div className="space-y-1">
              <p className="text-sm text-slate-400">
                Welcome back, {displayName || username}!
              </p>
              <h1 className="text-2xl font-semibold">Track Your Mood</h1>
              <p className="text-slate-400 text-sm">
                Log how you feel and visualize emotional patterns.
              </p>
            </div>

            {/* TOP ROW */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* FEELINGS PICKER */}
              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-5 py-4 shadow-sm">
                <h2 className="font-semibold text-sm mb-3">
                  How are you feeling?
                </h2>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {moodOptions.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => handleLogMood(m.value)}
                      className={`text-3xl p-3 rounded-xl ${
                        todayMood?.mood === m.value
                          ? "bg-sky-900/60 border border-sky-500"
                          : "bg-slate-800"
                      }`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* TODAY’S MOOD */}
              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-5 py-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Today's Mood</h2>
                  <p className="text-[11px] text-slate-500">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {todayMood ? (
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">
                      {
                        moodOptions.find(
                          (m) => m.value === todayMood.mood
                        )?.emoji
                      }
                    </div>
                    <div>
                      <p className="text-lg font-semibold capitalize">
                        {todayMood.mood}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {todayMood.mood === "happy" &&
                          "You're feeling bright and positive today!"}
                        {todayMood.mood === "good" &&
                          "A good day so far — keep it up."}
                        {todayMood.mood === "neutral" &&
                          "A calm and balanced day."}
                        {todayMood.mood === "low" &&
                          "Feeling low — be kind to yourself today."}
                        {todayMood.mood === "sad" &&
                          "It's okay to have tough days — reach out if needed."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">
                    No mood logged yet for today.
                  </p>
                )}
              </div>

              {/* WEEKLY INTENSITY */}
              <div className="rounded-2xl border border-slate-800/40 bg-slate-900/90 px-5 py-5 shadow-sm">
                <h2 className="font-semibold text-sm mb-3">Weekly Intensity</h2>

                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-slate-400 mb-2">
                  {WEEK_LABELS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {weeklySquares.map((sq) => {
                    const score = MOOD_SCORE[sq.mood] ?? 0;
                    const cls = score ? HEAT_COLORS[score] : "bg-slate-800";

                    return (
                      <div
                        key={sq.key}
                        className={`h-6 w-full rounded-md ${cls}`}
                      />
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 mt-3">
                  Each square shows mood intensity.
                </p>
              </div>
            </section>

            {/* TREND CHART */}
            <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 shadow-sm">
              <h2 className="text-base font-semibold">
                Mood Trend (Last 7 Days)
              </h2>

              <div className="mt-3 h-64 w-full">
                <ResponsiveContainer>
                  <LineChart data={last7}>
                    <CartesianGrid
                      vertical={false}
                      stroke="#1f2937"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={[0, 5]} />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1f2937",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#38bdf8"
                      strokeWidth={2.4}
                      dot={{ r: 3, fill: "#38bdf8" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* NOTES + MONTHLY HEATMAP + SUMMARY */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
              <div className="space-y-6">
                {/* NOTES SECTION */}
                <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 shadow-sm">
                  <h2 className="font-semibold text-sm mb-2">
                    Notes & Reflections
                  </h2>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write something about your day..."
                    className="w-full h-28 p-3 bg-slate-800 rounded-xl text-sm"
                  />

                  <button
                    onClick={addNote}
                    className="mt-3 px-4 py-2 bg-emerald-600 rounded-lg text-sm"
                  >
                    Save Note
                  </button>

                  <div className="mt-5 space-y-3">
                    {todayMood?.notes?.length ? (
                      todayMood.notes.map((n) => (
                        <div
                          key={n.id}
                          className="flex justify-between items-center bg-slate-800 p-3 rounded-xl text-sm"
                        >
                          <span>{n.text}</span>
                          <button
                            onClick={() => deleteNote(n.id)}
                            className="text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No notes for today.
                      </p>
                    )}
                  </div>
                </section>

                {/* MONTHLY HEATMAP */}
                <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 shadow-sm">
                  <h2 className="text-base font-semibold">Monthly Heatmap</h2>
                  <p className="text-[11px] text-slate-400">
                    Click a day to edit mood + notes.
                  </p>

                  <div className="mt-4 overflow-x-auto">
                    <div className="inline-block min-w-full">
                      <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500 mb-1">
                        {WEEK_LABELS.map((d) => (
                          <div key={d} className="text-center">
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1">
                        {monthGrid.map((week, wi) => (
                          <div key={wi} className="grid grid-cols-7 gap-1">
                            {week.map((cell) => {
                              if (cell.empty)
                                return (
                                  <div
                                    key={cell.key}
                                    className="h-6 rounded-md"
                                  />
                                );

                              const cls =
                                cell.score > 0
                                  ? HEAT_COLORS[cell.score]
                                  : "bg-slate-800/40";

                              return (
                                <button
                                  key={cell.key}
                                  onMouseEnter={(e) =>
                                    handleCellMouseEnter(e, {
                                      key: cell.dateKey,
                                      mood: cell.mood,
                                    })
                                  }
                                  onMouseLeave={handleCellMouseLeave}
                                  onClick={() => openDrawerFor(cell.dateKey)}
                                  className={`h-6 rounded-md ${cls}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* MONTH SUMMARY */}
              <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-6 shadow-sm text-sm">
                <h2 className="text-lg font-semibold mb-4">This Month</h2>

                <div className="space-y-5">
                  <SummaryRow
                    emoji="😀"
                    label="Happy Days"
                    sub="Positive days"
                    count={countsThisMonth.happy}
                    color="bg-emerald-300 text-black"
                  />

                  <SummaryRow
                    emoji="🙂"
                    label="Good Days"
                    sub="Above-average days"
                    count={countsThisMonth.good}
                    color="bg-emerald-600"
                  />

                  <SummaryRow
                    emoji="😐"
                    label="Neutral Days"
                    sub="Balanced days"
                    count={countsThisMonth.neutral}
                    color="bg-emerald-700"
                  />

                  <SummaryRow
                    emoji="☹️"
                    label="Low Days"
                    sub="Below average"
                    count={countsThisMonth.low}
                    color="bg-emerald-800"
                  />

                  <SummaryRow
                    emoji="😢"
                    label="Sad Days"
                    sub="Difficult days"
                    count={countsThisMonth.sad}
                    color="bg-emerald-900"
                  />
                </div>

                <p className="mt-6 text-[12px] text-slate-400">
                  Counts update automatically as you log moods.  
                  Click a date in the heatmap to view or edit details.
                </p>
              </section>
            </div>
          </div>

          {/* Tooltip */}
          <HeatTooltip
            visible={tooltip.visible}
            x={tooltip.x}
            y={tooltip.y}
            cellData={tooltip.cell}
          />

          {/* Drawer */}
          <DayDrawer
            key={drawerDate || "drawer"}
            open={drawerOpen}
            onClose={closeDrawer}
            dayKey={drawerDate}
            dayObj={drawerDate ? moods[drawerDate] : null}
            onSaveDay={saveDayFromDrawer}
          />
        </main>
      </div>
    </div>
  );
}

/* Summary Row component */
function SummaryRow({ emoji, label, sub, count, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`h-8 w-8 rounded-md flex items-center justify-center text-xl ${color}`}
        >
          {emoji}
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-slate-400">{sub}</div>
        </div>
      </div>
      <div className="text-sm font-semibold">{count}</div>
    </div>
  );
}