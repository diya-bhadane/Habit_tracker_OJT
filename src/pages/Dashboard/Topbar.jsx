import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../components/NotificationCenter";

function formatNotificationTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Topbar({ username, handle, avatar, completion, onToggleSidebar, onNewHabit, onManageProfile, onLogout }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const notificationsRef = useRef(null);

  // Close notifications when clicking outside the bell / popup area.
  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleClickOutside = (event) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // Only show unread notifications in the popup.
  const visibleNotifications = notifications.filter((notification) => !notification.read);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((open) => !open);
    setIsNotificationsOpen(false);
  };

  const handleManageClick = () => {
    setIsProfileMenuOpen(false);
    if (onManageProfile) onManageProfile();
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            Welcome back, {username}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You&apos;ve completed {completion}% of your habits today. Keep it up!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((open) => !open);
              setIsProfileMenuOpen(false);
            }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-emerald-500 px-1 text-center text-[10px] font-semibold text-slate-950 ring-2 ring-slate-950">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              className="absolute z-30 mt-3 max-h-96 w-[calc(100vw-2rem)] max-w-sm left-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-xs text-slate-100 shadow-xl shadow-slate-900/80 sm:left-auto sm:right-0 sm:w-80"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Notifications</span>
                  <span className="text-[11px] text-slate-400">
                    {visibleNotifications.length
                      ? `${visibleNotifications.length} unread`
                      : "You're all caught up."}
                  </span>
                </div>
                {visibleNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => unreadCount > 0 && markAllAsRead()}
                    className="rounded-full px-2 py-1 text-[11px] font-medium text-sky-400 hover:bg-slate-900 hover:text-sky-300"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {visibleNotifications.length === 0 && (
                  <p className="px-4 py-6 text-center text-[11px] text-slate-400">
                    No notifications yet. Enable reminders from Settings to see
                    habit tips and summaries here.
                  </p>
                )}

                {visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-900/80 ${
                      notification.read ? "opacity-70" : ""
                    }`}
                  >
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        notification.read ? "bg-slate-600" : "bg-emerald-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-slate-50">
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {notification.body}
                        </p>
                      )}
                      {notification.createdAt && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onNewHabit && onNewHabit()}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
        >
          + New Habit
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={toggleProfileMenu}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-50 shadow-sm hover:bg-slate-800 dark:border-slate-700"
          >
            {avatar ? (
              <img
                src={avatar}
                alt={username || "Profile avatar"}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-50">
                {username ? username.charAt(0).toUpperCase() : "?"}
              </span>
            )}
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-slate-50">
                {username || "Profile"}
              </span>
              {handle && (
                <span className="text-[10px] text-slate-300">@{handle}</span>
              )}
            </div>
            <span className="text-xs text-slate-300">▾</span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
              <button
                type="button"
                onClick={handleManageClick}
                className="flex w-full items-center px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Manage / edit profile
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
