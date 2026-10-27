import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import MyHabits from "./pages/Dashboard/MyHabits";
import Analytics from "./pages/Dashboard/Analytics";
import MoodTracker from "./pages/Dashboard/MoodTracker";
import Community from "./pages/Dashboard/Community";
import Settings from "./pages/Dashboard/Settings";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habits" element={<MyHabits />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/community" element={<Community />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
