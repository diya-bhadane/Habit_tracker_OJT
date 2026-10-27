import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const USERS_KEY = "habitrix_users";
const ACTIVE_USER_KEY = "habitrix_activeUser";
const ACTIVE_USER_ID_KEY = "habitrix_activeUserId";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://${import.meta.env.VITE_API_URL}";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleBackHome = () => {
    navigate("/");
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Please enter your email/username and password.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 404) {
          alert("User does not exist, please sign up.");
        } else if (response.status === 401) {
          alert("Incorrect password.");
        } else {
          const message =
            data?.message ||
            "Unable to log in. Please check your details and try again.";
          alert(message);
        }
        return;
      }

      const user = data?.user;
      const safeUsername = user?.username || identifier.trim();

      const raw = window.localStorage.getItem(USERS_KEY);
      const users = raw ? JSON.parse(raw) : {};
      const existing = users[safeUsername] || {};

      users[safeUsername] = {
        ...existing,
        username: safeUsername,
        name: user?.name || existing.name || safeUsername,
        email: user?.email || existing.email || identifier.trim(),
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
      if (user && user.id) {
        window.localStorage.setItem(ACTIVE_USER_ID_KEY, user.id);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong while logging in. Please try again.");
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
          placeholder="Email or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white text-gray-700 py-4 rounded-xl shadow-md text-center"
        />

        <button
          className="w-full bg-white text-gray-800 font-semibold py-4 rounded-xl shadow-md"
          onClick={handleLogin}
        >
          Login
        </button>

        <p className="text-sm mt-2 text-white/90">
          Dont have an account?{" "}
          <Link to="/signup" className="underline">
            Sign Up Here
          </Link>
        </p>
      </div>
    </div>
  );
}
