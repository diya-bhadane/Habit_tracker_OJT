import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  getActiveUserId,
  fetchUserState,
  apiUpdateUserProfile,
  apiUpdateUserSettings,
  apiExportUserData,
  apiClearUserHistory,
  apiDeleteAccount,
} from "../../utils/apiClient";

const ACTIVE_USER_KEY = "habitrix_activeUser";
const USERS_KEY = "habitrix_users";
const NOTIFICATION_PREFS_PREFIX = "habitrix_notification_prefs";

export default function Settings() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    dob: "",
    gender: "",
    bio: "",
    avatarDataUrl: "",
  });

  const [notifications, setNotifications] = useState({
    habitReminders: true,
    moodTrackerReminders: false,
    weeklySummaryEmail: true,
  });

  const [isReady, setIsReady] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

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
        setAvatar(typeof user.avatarDataUrl === "string" ? user.avatarDataUrl : "");
        setOriginalUsername(user.username || activeUsername);

        setForm({
          name: resolvedName,
          email: user.email || "",
          username: user.username || activeUsername,
          dob: user.dob || "",
          gender: user.gender || "",
          bio: user.bio || "",
          avatarDataUrl: user.avatarDataUrl || "",
        });

        const initialNotifications = {
          habitReminders:
            typeof user.notifications?.habitReminders === "boolean"
              ? user.notifications.habitReminders
              : true,
          moodTrackerReminders:
            typeof user.notifications?.moodTrackerReminders === "boolean"
              ? user.notifications.moodTrackerReminders
              : false,
          weeklySummaryEmail:
            typeof user.notifications?.weeklySummaryEmail === "boolean"
              ? user.notifications.weeklySummaryEmail
              : true,
        };

        setNotifications(initialNotifications);

        if (typeof window !== "undefined") {
          try {
            const prefsKey = `${NOTIFICATION_PREFS_PREFIX}_${activeUserId}`;
            window.localStorage.setItem(
              prefsKey,
              JSON.stringify(initialNotifications)
            );
          } catch (err) {
            console.error("Failed to cache notification preferences", err);
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error("Failed to load settings", error);
        navigate("/login");
      }
    }

    load();
  }, [navigate]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic client-side size check to avoid hitting server payload limits
    // Limit to ~3MB file size (before base64 expansion)
    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("Please choose an image smaller than 3MB for your avatar.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, avatarDataUrl: result }));
      setAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const syncLocalProfile = (updatedUser) => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(USERS_KEY);
      const users = raw ? JSON.parse(raw) : {};
      const current = users[originalUsername] || {};

      const newUsername = updatedUser.username || originalUsername;

      if (newUsername !== originalUsername) {
        delete users[originalUsername];
      }

      users[newUsername] = {
        ...current,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        dob: updatedUser.dob || "",
        gender: updatedUser.gender || "",
        bio: updatedUser.bio || "",
        avatarDataUrl: updatedUser.avatarDataUrl || "",
      };

      window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
      window.localStorage.setItem(ACTIVE_USER_KEY, newUsername);
      setOriginalUsername(newUsername);
    } catch (error) {
      console.error("Failed to sync local profile store", error);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!userId) return;

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedUsername = form.username.trim();

    if (!trimmedName || !trimmedEmail || !trimmedUsername) {
      // basic validation only; UI stays minimal
      alert("Name, email and username are required.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const updatedUser = await apiUpdateUserProfile(userId, {
        name: trimmedName,
        email: trimmedEmail,
        username: trimmedUsername,
        dob: form.dob,
        gender: form.gender,
        bio: form.bio,
        avatarDataUrl: form.avatarDataUrl,
      });

      setDisplayName(updatedUser.name || trimmedName);
      setUsername(updatedUser.username || trimmedUsername);
      setAvatar(updatedUser.avatarDataUrl || "");
      setForm((prev) => ({
        ...prev,
        name: updatedUser.name || trimmedName,
        email: updatedUser.email || trimmedEmail,
        username: updatedUser.username || trimmedUsername,
        dob: updatedUser.dob || prev.dob,
        gender: updatedUser.gender || prev.gender,
        bio: typeof updatedUser.bio === "string" ? updatedUser.bio : prev.bio,
        avatarDataUrl: updatedUser.avatarDataUrl || prev.avatarDataUrl,
      }));

      syncLocalProfile(updatedUser);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert(error.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleNotification = (field) => () => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveNotifications = async () => {
    if (!userId) return;
    setSavingNotifications(true);
    setNotifSaved(false);
    try {
      const updatedUser = await apiUpdateUserSettings(userId, notifications);
      const normalized = {
        habitReminders: updatedUser.notifications?.habitReminders ?? true,
        moodTrackerReminders:
          updatedUser.notifications?.moodTrackerReminders ?? false,
        weeklySummaryEmail:
          updatedUser.notifications?.weeklySummaryEmail ?? true,
      };

      setNotifications(normalized);

      if (typeof window !== "undefined") {
        try {
          const prefsKey = `${NOTIFICATION_PREFS_PREFIX}_${userId}`;
          window.localStorage.setItem(prefsKey, JSON.stringify(normalized));
        } catch (err) {
          console.error("Failed to cache notification preferences after save", err);
        }
      }

      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } catch (error) {
      console.error("Failed to update notifications", error);
      alert(error.message || "Failed to update notification settings.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleExportData = async () => {
    if (!userId) return;
    try {
      const blob = await apiExportUserData(userId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `habitrix-export-${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data", error);
      alert(error.message || "Failed to export data.");
    }
  };

  const handleClearHistory = async () => {
    if (!userId) return;
    const ok = window.confirm(
      "This will clear all habit completions, mood logs and notes. Continue?"
    );
    if (!ok) return;

    try {
      await apiClearUserHistory(userId);
      alert("Your habit history has been cleared.");
    } catch (error) {
      console.error("Failed to clear history", error);
      alert(error.message || "Failed to clear history.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    const ok = window.confirm(
      "This will permanently delete your account and all data. This cannot be undone. Continue?"
    );
    if (!ok) return;

    try {
      await apiDeleteAccount(userId);
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(USERS_KEY);
        if (raw) {
          try {
            const users = JSON.parse(raw);
            delete users[originalUsername];
            window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
          } catch (err) {
            console.error("Failed to update local users after delete", err);
          }
        }
        window.localStorage.removeItem(ACTIVE_USER_KEY);
        window.localStorage.removeItem("habitrix_activeUserId");
      }
      navigate("/signup");
    } catch (error) {
      console.error("Failed to delete account", error);
      alert(error.message || "Failed to delete account.");
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
    return null;
  }

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

        <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10 pb-8 sm:px-6 lg:px-10">
            <Topbar
              username={displayName}
              handle={username}
              avatar={avatar}
              completion={0}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onNewHabit={() => navigate("/dashboard")} // reuse button to go to dashboard
              onManageProfile={handleManageProfile}
              onLogout={handleLogout}
            />

            {/* Account settings */}
            <section className="rounded-2xl border border-slate-800/60 bg-slate-900/90 px-6 py-5 shadow-sm">
              <header className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">Account Settings</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Update your personal information and profile.
                  </p>
                </div>
                {profileSaved && (
                  <span className="text-[11px] text-emerald-400">Saved</span>
                )}
              </header>

              <form
                onSubmit={handleSaveProfile}
                className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {form.avatarDataUrl ? (
                      <img
                        src={form.avatarDataUrl}
                        alt="Profile avatar preview"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold">
                        {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <div className="space-y-2 text-xs text-slate-400">
                      <p className="text-sm font-medium text-slate-100">
                        Profile photo
                      </p>
                      <p>This is shown across your dashboard and community.</p>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-200">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                          Change
                        </label>
                        {form.avatarDataUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                avatarDataUrl: "",
                              }));
                              setAvatar("");
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={handleInputChange("name")}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Username
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={handleInputChange("username")}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleInputChange("email")}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Date of birth
                      </label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={handleInputChange("dob")}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={handleInputChange("gender")}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">Select</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      About you
                    </label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={handleInputChange("bio")}
                      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="A short bio or anything you want to remember about your goals."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                    >
                      {savingProfile ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Notifications */}
            <section className="rounded-2xl border border-slate-800/60 bg-slate-900/90 px-6 py-5 shadow-sm">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Notifications</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose what you want to be notified about.
                  </p>
                </div>
                {notifSaved && (
                  <span className="text-[11px] text-emerald-400">Saved</span>
                )}
              </header>

              <div className="space-y-4 text-sm">
                <NotificationRow
                  title="Habit reminders"
                  description="Get nudges to complete your daily habits."
                  enabled={notifications.habitReminders}
                  onToggle={handleToggleNotification("habitReminders")}
                />
                <NotificationRow
                  title="Mood tracker reminders"
                  description="Daily prompt to log how you are feeling."
                  enabled={notifications.moodTrackerReminders}
                  onToggle={handleToggleNotification("moodTrackerReminders")}
                />
                <NotificationRow
                  title="Weekly summary email"
                  description="Receive a weekly report of your progress."
                  enabled={notifications.weeklySummaryEmail}
                  onToggle={handleToggleNotification("weeklySummaryEmail")}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                >
                  {savingNotifications ? "Saving..." : "Save preferences"}
                </button>
              </div>
            </section>

            {/* Data & privacy */}
            <section className="mb-4 rounded-2xl border border-slate-800/60 bg-slate-900/90 px-6 py-5 text-sm shadow-sm">
              <header className="mb-4">
                <h2 className="text-base font-semibold">Data & privacy</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Manage your data and account security.
                </p>
              </header>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 rounded-xl bg-slate-950/60 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      Export data (JSON)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Download a copy of your habits, notes and mood logs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-200 md:mt-0"
                  >
                    ⬇ Export
                  </button>
                </div>

                <div className="flex flex-col gap-2 rounded-xl bg-slate-950/60 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      Clear habit history
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Remove past completions, mood logs and notes. Habits stay. 
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-500/60 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10 md:mt-0"
                  >
                    Clear history
                  </button>
                </div>

                <div className="rounded-xl bg-red-950/40 px-4 py-4 border border-red-700/60">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-100">
                        Delete account
                      </p>
                      <p className="text-[11px] text-red-200/80">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 md:mt-0"
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationRow({ title, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-100">{title}</p>
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
          enabled
            ? "border-emerald-400 bg-emerald-500/80"
            : "border-slate-600 bg-slate-800"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
