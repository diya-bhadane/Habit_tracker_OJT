// LocalStorage utils for moods
export const saveMood = (moodEntry) => {
  const existing = JSON.parse(localStorage.getItem("moodLogs") || "[]");
  existing.unshift(moodEntry); // latest first
  localStorage.setItem("moodLogs", JSON.stringify(existing));
};

export const getMoods = () => {
  return JSON.parse(localStorage.getItem("moodLogs") || "[]");
};