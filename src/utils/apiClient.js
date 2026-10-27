const API_BASE_URL = import.meta.env.VITE_API_URL || "http://${import.meta.env.VITE_API_URL}";

const ACTIVE_USER_ID_KEY = "habitrix_activeUserId";

export function getActiveUserId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_USER_ID_KEY);
}

export function setActiveUserId(id) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_USER_ID_KEY, id);
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      // If the server returned non‑JSON (e.g. HTML error page), surface a cleaner error
      if (!res.ok) {
        const message = `Request failed with status ${res.status}`;
        const error = new Error(message);
        error.status = res.status;
        error.rawBody = text;
        throw error;
      }
      throw err;
    }
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

// === User state & profile ===

export async function fetchUserState(userId) {
  const data = await request(`/api/users/${userId}/state`);
  return data.user;
}

export async function apiUpdateUserProfile(userId, payload) {
  const data = await request(`/api/users/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function apiUpdateUserSettings(userId, settings) {
  const data = await request(`/api/users/${userId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  return data.user;
}

export async function apiExportUserData(userId) {
  // Use fetch directly to preserve the response body as text for download
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/export`);
  if (!res.ok) {
    const message = `Export failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  const blob = await res.blob();
  return blob;
}

export async function apiClearUserHistory(userId) {
  const data = await request(`/api/users/${userId}/clear-history`, {
    method: "POST",
  });
  return data.user;
}

export async function apiDeleteAccount(userId) {
  const data = await request(`/api/users/${userId}`, {
    method: "DELETE",
  });
  return data;
}

export async function apiCreateHabit(userId, payload) {
  const data = await request(`/api/users/${userId}/habits`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.habits;
}

export async function apiToggleHabitToday(userId, habitId, dateKey) {
  const data = await request(`/api/users/${userId}/habits/${habitId}/toggle`, {
    method: "PATCH",
    body: JSON.stringify({ dateKey }),
  });
  return data.habits;
}

export async function apiDeleteHabit(userId, habitId) {
  const data = await request(`/api/users/${userId}/habits/${habitId}`, {
    method: "DELETE",
  });
  return data.habits;
}

export async function apiCreateNote(userId, text) {
  const data = await request(`/api/users/${userId}/notes`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return data.notes;
}

export async function apiUpdateNote(userId, noteId, text) {
  const data = await request(`/api/users/${userId}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify({ text }),
  });
  return data.notes;
}

export async function apiDeleteNote(userId, noteId) {
  const data = await request(`/api/users/${userId}/notes/${noteId}`, {
    method: "DELETE",
  });
  return data.notes;
}

// Mood tracker

export async function apiUpsertMoodDay(userId, dateKey, day) {
  const data = await request(`/api/users/${userId}/moods/${dateKey}`, {
    method: "PUT",
    body: JSON.stringify(day),
  });
  return data.day;
}

export async function apiDeleteMoodDay(userId, dateKey) {
  await request(`/api/users/${userId}/moods/${dateKey}`, {
    method: "DELETE",
  });
}

// Community

export async function apiFetchCommunityFeed(userId) {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const data = await request(`/api/community/feed${params}`);
  return data.feed || [];
}

export async function apiCreateCommunityPost(payload) {
  const data = await request("/api/community/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.post;
}

export async function apiUpdateCommunityPost(postId, payload) {
  const data = await request(`/api/community/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.post;
}

export async function apiDeleteCommunityPost(postId, userId) {
  const data = await request(`/api/community/posts/${postId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
  return data;
}

export async function apiLikeCommunityPost(postId, userId) {
  const data = await request(`/api/community/posts/${postId}/like`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return data; // { likes, likedByCurrentUser }
}

export async function apiAddCommunityComment(postId, payload) {
  const data = await request(`/api/community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function apiDeleteCommunityComment(postId, commentId, userId) {
  const data = await request(`/api/community/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
  return data;
}

export async function apiFetchChallenges(userId) {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const data = await request(`/api/community/challenges${params}`);
  return data.challenges || [];
}

export async function apiToggleJoinChallenge(challengeId, userId) {
  const data = await request(`/api/community/challenges/${challengeId}/toggle-join`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return data;
}

export async function apiFetchLeaderboard(userId) {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const data = await request(`/api/community/leaderboard${params}`);
  return {
    leaderboard: data.leaderboard || [],
    currentUserRank: data.currentUserRank ?? null,
    communitySize: data.communitySize ?? 0,
  };
}
