/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getActiveUserId } from "../utils/apiClient";

const NotificationContext = createContext(null);

const STORAGE_PREFIX = "habitrix_notifications_v1";
const PREFS_PREFIX = "habitrix_notification_prefs";

function buildStorageKey(userId) {
  return `${STORAGE_PREFIX}_${userId || "guest"}`;
}

function buildPrefsKey(userId) {
  return `${PREFS_PREFIX}_${userId || "guest"}`;
}

function normalisePrefs(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    habitReminders:
      typeof raw.habitReminders === "boolean" ? raw.habitReminders : true,
    moodTrackerReminders:
      typeof raw.moodTrackerReminders === "boolean"
        ? raw.moodTrackerReminders
        : false,
    weeklySummaryEmail:
      typeof raw.weeklySummaryEmail === "boolean"
        ? raw.weeklySummaryEmail
        : true,
  };
}

function loadPreferences(userId) {
  if (typeof window === "undefined") return null;
  try {
    const key = buildPrefsKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalisePrefs(parsed);
  } catch (error) {
    console.error("Failed to read notification preferences", error);
    return null;
  }
}

function isNotificationAllowedForPrefs(type, prefs) {
  if (!prefs) return true;
  switch (type) {
    case "habit":
      return prefs.habitReminders !== false;
    case "mood":
      return !!prefs.moodTrackerReminders;
    case "summary":
      return prefs.weeklySummaryEmail !== false;
    default:
      return true; // system and any other types are always allowed
  }
}

function filterNotificationsByPrefs(list, prefs) {
  if (!prefs) return list;
  return list.filter((notification) =>
    isNotificationAllowedForPrefs(notification.type, prefs),
  );
}

function createSeedNotifications(prefs) {
  const baseTime = Date.now();
  let offset = 0;

  const items = [];

  const push = ({ type, title, body }) => {
    const createdAt = new Date(baseTime - offset).toISOString();
    items.push({
      id: `${type}-${baseTime - offset}`,
      type,
      title,
      body,
      createdAt,
      read: false,
    });
    offset += 60_000;
  };

  push({
    type: "system",
    title: "Welcome back to Habitrix",
    body: "We'll drop gentle reminders here to help you stay on track.",
  });

  if (!prefs || prefs.habitReminders) {
    push({
      type: "habit",
      title: "Daily habit check-in",
      body: "Review today's habits and mark what you've completed.",
    });
  }

  if (prefs && prefs.moodTrackerReminders) {
    push({
      type: "mood",
      title: "How are you feeling today?",
      body: "Open the mood tracker to quickly log today's mood.",
    });
  }

  if (!prefs || prefs.weeklySummaryEmail) {
    push({
      type: "summary",
      title: "Weekly summary",
      body: "See a snapshot of your streaks and completions in Analytics.",
    });
  }

  return items;
}

export function NotificationProvider({ children }) {
  const userKey =
    typeof window !== "undefined" ? getActiveUserId() || "guest" : "guest";

  const [notifications, setNotifications] = useState(() => {
    if (typeof window === "undefined") return [];
    const storageKey = buildStorageKey(userKey);
    const prefs = loadPreferences(userKey);

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return filterNotificationsByPrefs(parsed, prefs);
        }
      }
    } catch (error) {
      console.error("Failed to read notifications from storage", error);
    }

    return filterNotificationsByPrefs(createSeedNotifications(prefs), prefs);
  });

  // Persist changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = buildStorageKey(userKey);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to write notifications to storage", error);
    }
  }, [notifications, userKey]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addNotification = (payload) => {
    const type = payload.type || "system";

    // Respect the latest notification preferences before adding.
    if (typeof window !== "undefined") {
      const prefs = loadPreferences(userKey);
      if (!isNotificationAllowedForPrefs(type, prefs)) {
        return;
      }
    }

    setNotifications((prev) => [
      {
        id:
          payload.id ||
          `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title: payload.title,
        body: payload.body,
        type,
        createdAt: payload.createdAt || new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
    }),
    // 'addNotification' is stable for the lifetime of this provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, unreadCount]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
