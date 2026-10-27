import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const USERS_KEY = "habitrix_users";
const ACTIVE_USER_KEY = "habitrix_activeUser";
const ACTIVE_USER_ID_KEY = "habitrix_activeUserId";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://${import.meta.env.VITE_API_URL}";

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleBackHome = () => {
    navigate("/");
  };

  const handleSignup = async () => {
    if (!fullName || !email || !username || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: trimmedEmail,
          username: trimmedUsername,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message || "Unable to sign up. Please try again later.";
        alert(message);
        return;
      }

      const createdUser = data?.user;
      const safeUsername =
        (createdUser && createdUser.username) || trimmedUsername;

      const raw = window.localStorage.getItem(USERS_KEY);
      const users = raw ? JSON.parse(raw) : {};
      const existing = users[safeUsername] || {};

      users[safeUsername] = {
        ...existing,
        username: safeUsername,
        name: fullName.trim(),
        email: trimmedEmail,
        password,
        habits: Array.isArray(existing.habits) ? existing.habits : [],
        notes: Array.isArray(existing.notes) ? existing.notes : [],
        dob: existing.dob || "",
        gender: existing.gender || "",
        bio: existing.bio || "",
        avatarDataUrl: existing.avatarDataUrl || "",
      };

      window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
      window.localStorage.setItem(ACTIVE_USER_KEY, safeUsername);
      if (createdUser && createdUser.id) {
        window.localStorage.setItem(ACTIVE_USER_ID_KEY, createdUser.id);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong while signing up. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#6558F5] flex flex-col items-center justify-center text-white px-4 relative">
      <button
        type="button"
        onClick={handleBackHome}
        className="absolute top-6 right-6 text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full border border-white/30"
      >
        {"<- Back to Home page"}
      </button>

      <h1 className="text-5xl font-bold mb-12 flex items-center gap-3">
        <Logo size={48} />
        Habitrix
      </h1>

      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />
        <button
          className="w-full bg-white text-gray-800 font-semibold py-4 rounded-xl shadow-md"
          onClick={handleSignup}
        >
          Sign Up
        </button>

        <p className="text-sm mt-2 text-white/90">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
}
