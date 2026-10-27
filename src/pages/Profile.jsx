/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const USERS_KEY = "habitrix_users";
const ACTIVE_USER_KEY = "habitrix_activeUser";

function loadUsersFromStorage() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsersToStorage(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export default function Profile() {
  const navigate = useNavigate();
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // This effect only runs once on mount to hydrate local state from localStorage.
  // It is safe in this app even though it initializes React state.
  useEffect(() => {
    const active =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_USER_KEY)
        : null;

    if (!active) {
      navigate("/login");
      return;
    }

    const users = loadUsersFromStorage();
    const stored = users[active];

    if (!stored) {
      navigate("/login");
      return;
    }

    setOriginalUsername(active);
    setForm({
      name: stored.name || "",
      email: stored.email || "",
      username: stored.username || active,
      dob: stored.dob || "",
      gender: stored.gender || "",
      bio: stored.bio || "",
      avatarDataUrl: stored.avatarDataUrl || "",
    });
  }, [navigate]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, avatarDataUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedUsername = form.username.trim();

    if (!trimmedName || !trimmedEmail || !trimmedUsername) {
      alert("Name, email and username are required.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    const users = loadUsersFromStorage();
    const current = users[originalUsername];

    if (!current) {
      alert("Unable to load your account. Please log in again.");
      navigate("/login");
      return;
    }

    const lowerEmail = trimmedEmail.toLowerCase();
    const lowerUsername = trimmedUsername.toLowerCase();

    for (const [key, user] of Object.entries(users)) {
      if (!user) continue;
      const effectiveUsername = (user.username || key).toLowerCase();
      const userEmail = user.email ? user.email.toLowerCase() : null;

      if (key !== originalUsername && effectiveUsername === lowerUsername) {
        alert("That username is already taken.");
        return;
      }

      if (key !== originalUsername && userEmail === lowerEmail) {
        alert("That email is already in use.");
        return;
      }
    }

    let finalPassword = current.password;
    const isChangingPassword =
      currentPassword || newPassword || confirmNewPassword;

    if (isChangingPassword) {
      if (!currentPassword) {
        alert("Please enter your current password to change it.");
        return;
      }
      if (currentPassword !== current.password) {
        alert("Current password is incorrect.");
        return;
      }
      if (!newPassword) {
        alert("Please enter a new password.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        alert("New passwords do not match.");
        return;
      }
      finalPassword = newPassword;
    }

    const updatedUser = {
      ...current,
      name: trimmedName,
      email: trimmedEmail,
      username: trimmedUsername,
      dob: form.dob,
      gender: form.gender,
      bio: form.bio,
      avatarDataUrl: form.avatarDataUrl,
      password: finalPassword,
    };

    const usernameChanged = trimmedUsername !== originalUsername;

    if (usernameChanged) {
      delete users[originalUsername];
    }

    users[trimmedUsername] = updatedUser;
    saveUsersToStorage(users);
    window.localStorage.setItem(ACTIVE_USER_KEY, trimmedUsername);
    setOriginalUsername(trimmedUsername);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");

    alert("Profile updated successfully.");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-slate-300 hover:text-white"
          >
            ← Back to dashboard
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Logo size={28} />
            <span className="font-semibold">Habitrix</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <h1 className="text-2xl font-semibold">Profile settings</h1>
        <p className="text-sm text-slate-400">
          Manage your account information, profile details and password.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm shadow-lg md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]"
        >
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Basic info</h2>
              <p className="text-xs text-slate-400">
                This information is used across your dashboard.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
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
                  onChange={handleChange("username")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Personal details
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={handleChange("dob")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={handleChange("gender")}
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
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  About you
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={handleChange("bio")}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="A short bio or anything you want to remember about your goals."
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Profile photo
              </h2>
              <p className="text-xs text-slate-400">
                This photo appears in the sidebar and other places.
              </p>
              <div className="mt-4 flex items-center gap-4">
                {form.avatarDataUrl ? (
                  <img
                    src={form.avatarDataUrl}
                    alt="Profile avatar preview"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold text-slate-100">
                    {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div className="space-y-2 text-xs text-slate-400">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    Upload photo
                  </label>
                  <p>JPG, PNG, or GIF. A small square image works best.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Reset password
              </h2>
              <p className="text-xs text-slate-400">
                To change your password, confirm your current one first.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-600"
              >
                Save changes
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
