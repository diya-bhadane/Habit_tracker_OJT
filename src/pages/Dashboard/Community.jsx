import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  getActiveUserId,
  fetchUserState,
  apiFetchCommunityFeed,
  apiCreateCommunityPost,
  apiUpdateCommunityPost,
  apiDeleteCommunityPost,
  apiLikeCommunityPost,
  apiAddCommunityComment,
  apiDeleteCommunityComment,
  apiFetchChallenges,
  apiToggleJoinChallenge,
  apiFetchLeaderboard,
} from "../../utils/apiClient";

const ACTIVE_USER_KEY = "habitrix_activeUser";

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildTodayStats(habits, todayKey) {
  if (!Array.isArray(habits) || habits.length === 0) {
    return {
      completionPercent: 0,
      completedTodayCount: 0,
      totalHabits: 0,
      totalCompletions: 0,
    };
  }

  let completedTodayCount = 0;
  let totalCompletions = 0;

  habits.forEach((habit) => {
    const completions = Array.isArray(habit.completions)
      ? habit.completions
      : [];
    totalCompletions += completions.length;

    const hasToday = completions
      .map((d) => d.slice(0, 10))
      .includes(todayKey);

    if (hasToday) completedTodayCount += 1;
  });

  const totalHabits = habits.length;
  const completionPercent =
    totalHabits > 0
      ? Math.round((completedTodayCount / totalHabits) * 100)
      : 0;

  return {
    completionPercent,
    completedTodayCount,
    totalHabits,
    totalCompletions,
  };
}

function normalizeFeedPost(post, currentUserId) {
  if (!post) return null;

  const createdAt = post.createdAt ? new Date(post.createdAt) : null;
  const diffMs = createdAt ? Date.now() - createdAt.getTime() : 0;
  const diffMinutes = Math.floor(diffMs / 60000);
  let timeAgo = "";
  if (createdAt) {
    if (diffMinutes < 60) timeAgo = `${diffMinutes || 1}m ago`;
    else if (diffMinutes < 60 * 24)
      timeAgo = `${Math.floor(diffMinutes / 60)}h ago`;
    else timeAgo = `${Math.floor(diffMinutes / (60 * 24))}d ago`;
  }

  const rawComments = Array.isArray(post.comments) ? post.comments : [];
  const comments = rawComments.map((c) => {
    const commentCreatedAt = c.createdAt ? new Date(c.createdAt) : null;
    const commentDiffMs = commentCreatedAt
      ? Date.now() - commentCreatedAt.getTime()
      : 0;
    const commentDiffMinutes = Math.floor(commentDiffMs / 60000);
    let commentTimeAgo = "";
    if (commentCreatedAt) {
      if (commentDiffMinutes < 60)
        commentTimeAgo = `${commentDiffMinutes || 1}m ago`;
      else if (commentDiffMinutes < 60 * 24)
        commentTimeAgo = `${Math.floor(commentDiffMinutes / 60)}h ago`;
      else
        commentTimeAgo = `${Math.floor(
          commentDiffMinutes / (60 * 24)
        )}d ago`;
    }

    return {
      id: c.id,
      userId: c.userId || null,
      author: c.authorName || "Unknown",
      handle: c.username ? `@${c.username}` : "",
      text: c.text,
      timeAgo: commentTimeAgo,
    };
  });

  const hasNumericProgress =
    typeof post.progressPercent === "number" &&
    !Number.isNaN(post.progressPercent);

  const clampedProgress = hasNumericProgress
    ? Math.max(0, Math.min(post.progressPercent, 100))
    : 0;

  const hasProgress = hasNumericProgress && clampedProgress > 0;

  const authorId = post.userId ? String(post.userId) : null;
  const isOwnPost =
    currentUserId && authorId && String(currentUserId) === authorId;

  return {
    id: post.id,
    author: post.authorName || "Unknown",
    handle: post.username ? `@${post.username}` : "",
    text: post.text,
    challenge:
      hasProgress && post.challengeName && String(post.challengeName).trim()
        ? String(post.challengeName).trim()
        : hasProgress
        ? "Daily habit check-in"
        : "",
    progressLabel: hasProgress ? `${clampedProgress}% complete` : "",
    progress: hasProgress ? clampedProgress : 0,
    badge: hasProgress ? post.badgeLabel || "" : "",
    likes: post.likes ?? 0,
    likedByCurrentUser: !!post.likedByCurrentUser,
    commentsCount:
      typeof post.commentsCount === "number"
        ? post.commentsCount
        : comments.length,
    comments,
    timeAgo,
    isOwnPost,
  };
}

export default function Community() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState("");
  const [habits, setHabits] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [feed, setFeed] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [communityRank, setCommunityRank] = useState(null);
  const [communitySize, setCommunitySize] = useState(0);
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});

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
        const [user, feedData, challengesPayload, leaderboardPayload] =
          await Promise.all([
            fetchUserState(activeUserId),
            apiFetchCommunityFeed(activeUserId),
            apiFetchChallenges(activeUserId),
            apiFetchLeaderboard(activeUserId),
          ]);

        setUserId(activeUserId);
        setUsername(user.username || activeUsername);
        const resolvedName =
          typeof user.name === "string" && user.name.trim()
            ? user.name
            : activeUsername;
        setDisplayName(resolvedName);
        setAvatar(
          typeof user.avatarDataUrl === "string" ? user.avatarDataUrl : ""
        );
        const userHabits = Array.isArray(user.habits) ? user.habits : [];
        setHabits(userHabits);

        const normalizedFeed = (feedData || [])
          .map((post) => normalizeFeedPost(post, activeUserId))
          .filter(Boolean);

        const leaderboardData = leaderboardPayload.leaderboard || [];
        const normalizedLeaderboard = leaderboardData.map(
          (entry, index) => ({
            id: entry.rank ?? index + 1,
            name: entry.name,
            subtitle: `${entry.totalCompletions} habits completed`,
            score: `${entry.completionRate}%`,
            accent: (entry.rank ?? index + 1) === 1 ? "bg-amber-500" : "bg-slate-700",
          })
        );

        setFeed(normalizedFeed);
        setChallenges(challengesPayload || []);
        setLeaderboard(normalizedLeaderboard);
        setCommunityRank(leaderboardPayload.currentUserRank ?? null);
        setCommunitySize(leaderboardPayload.communitySize ?? 0);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load community data", error);
        navigate("/login");
      }
    }

    load();
  }, [navigate]);

  const todayKey = getTodayKey();

  const todayStats = useMemo(
    () => buildTodayStats(habits, todayKey),
    [habits, todayKey]
  );

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

  const handleNewPost = async () => {
    if (!userId) return;
    const text = window.prompt("Share something with the community");
    if (!text || !text.trim()) return;

    try {
      const createdPost = await apiCreateCommunityPost({
        userId,
        text: text.trim(),
        challengeName: "",
        progressPercent: todayStats.completionPercent,
        badgeLabel:
          todayStats.completionPercent >= 100 ? "Perfect day" : "Daily update",
      });
      const normalized = normalizeFeedPost(createdPost, userId);
      if (normalized) {
        setFeed((prev) => [normalized, ...prev]);
      }
    } catch (error) {
      console.error("Failed to create community post", error);
    }
  };

  const handleLikePost = async (postId) => {
    if (!userId) return;
    try {
      const { likes, likedByCurrentUser } = await apiLikeCommunityPost(
        postId,
        userId
      );
      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes, likedByCurrentUser } : p
        )
      );
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleEditPost = async (post) => {
    if (!userId) return;
    const nextText = window.prompt("Edit your post", post.text);
    if (!nextText || !nextText.trim() || nextText.trim() === post.text) {
      setActivePostMenuId(null);
      return;
    }

    try {
      const updated = await apiUpdateCommunityPost(post.id, {
        userId,
        text: nextText.trim(),
      });
      const normalized = normalizeFeedPost(updated, userId);
      if (normalized) {
        setFeed((prev) =>
          prev.map((p) => (p.id === post.id ? normalized : p))
        );
      }
    } catch (error) {
      console.error("Failed to update community post", error);
    } finally {
      setActivePostMenuId(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmed) return;

    try {
      await apiDeleteCommunityPost(postId, userId);
      setFeed((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete community post", error);
    } finally {
      setActivePostMenuId(null);
    }
  };

  const handleToggleComments = (postId) => {
    setActiveCommentsPostId((current) => (current === postId ? null : postId));
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleAddComment = async (postId) => {
    if (!userId) return;
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;

    try {
      const { comment, commentsCount } = await apiAddCommunityComment(postId, {
        userId,
        text,
      });

      setFeed((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const newComment = {
            id: comment.id,
            userId: comment.userId || userId,
            author: comment.authorName || "Unknown",
            handle: comment.username ? `@${comment.username}` : "",
            text: comment.text,
            timeAgo: "Just now",
          };
          return {
            ...p,
            comments: [...(p.comments || []), newComment],
            commentsCount:
              typeof commentsCount === "number"
                ? commentsCount
                : (p.commentsCount || 0) + 1,
          };
        })
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Failed to add comment", error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!userId) return;
    try {
      const { success, commentsCount } = await apiDeleteCommunityComment(
        postId,
        commentId,
        userId
      );
      if (!success) return;

      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: (p.comments || []).filter(
                  (c) => c.id !== commentId
                ),
                commentsCount:
                  typeof commentsCount === "number"
                    ? commentsCount
                    : Math.max(0, (p.commentsCount || 1) - 1),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const handleToggleChallenge = async (challengeId) => {
    if (!userId) return;
    try {
      const result = await apiToggleJoinChallenge(challengeId, userId);
      setChallenges((prev) =>
        prev.map((ch) =>
          ch.id === challengeId
            ? {
                ...ch,
                joined: result.joined,
                participantsCount: result.participantsCount,
              }
            : ch
        )
      );
    } catch (error) {
      console.error("Failed to toggle challenge join", error);
    }
  };

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-50">
        <p className="text-sm text-slate-400">Loading your community...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
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
              completion={todayStats.completionPercent}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onNewHabit={() => navigate("/dashboard")}
              onManageProfile={handleManageProfile}
              onLogout={handleLogout}
            />

            <section className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <header className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-50">
                      Community feed
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      See how others in Habitrix are progressing with their habits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewPost}
                    className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-600"
                  >
                    New post
                  </button>
                </header>

                <div className="space-y-4">
                  {feed.length === 0 && (
                    <p className="text-xs text-slate-400">
                      No posts yet. Share an update to get the community started.
                    </p>
                  )}
                  {feed.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-slate-800/40 bg-slate-900/90 p-4 text-sm shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-100">
                            {post.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-50">
                                {post.author}
                              </h3>
                              <span className="text-[11px] text-slate-400">
                                {post.handle}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {post.timeAgo}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          {post.isOwnPost && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePostMenuId((current) =>
                                    current === post.id ? null : post.id
                                  )
                                }
                                className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
                              >
                                ···
                              </button>
                              {activePostMenuId === post.id && (
                                <div className="absolute right-0 mt-1 w-32 rounded-md border border-slate-800 bg-slate-900 py-1 text-xs text-slate-100 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => handleEditPost(post)}
                                    className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-800"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePost(post.id)}
                                    className="flex w-full items-center px-3 py-1.5 text-left text-red-400 hover:bg-red-900/40"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-100">
                        {post.text}
                      </p>

                      {post.challenge && post.progressLabel && (
                        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="font-medium text-slate-100">
                              {post.challenge}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                              <span>{post.progressLabel}</span>
                              {post.badge && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  {post.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${post.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleLikePost(post.id)}
                          className={`inline-flex items-center gap-1 hover:text-slate-200 ${
                            post.likedByCurrentUser ? "text-rose-400" : ""
                          }`}
                        >
                          <span>{post.likedByCurrentUser ? "❤️" : "🤍"}</span>
                          <span>{post.likes} likes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleComments(post.id)}
                          className="inline-flex items-center gap-1 hover:text-slate-200"
                        >
                          <span>💬</span>
                          <span>{post.commentsCount} comments</span>
                        </button>
                        <span className="ml-auto text-[11px] text-slate-500">
                          Shared {post.timeAgo}
                        </span>
                      </div>

                      {activeCommentsPostId === post.id && (
                        <div className="mt-3 border-t border-slate-800 pt-3 text-xs">
                          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                            {(post.comments || []).length === 0 && (
                              <p className="text-[11px] text-slate-500">
                                Be the first to comment.
                              </p>
                            )}
                            {(post.comments || []).map((comment) => {
                              const canDeleteComment =
                                userId &&
                                (comment.userId === userId || post.isOwnPost);
                              return (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-2"
                                >
                                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-100">
                                    {comment.author
                                      ? comment.author.charAt(0).toUpperCase()
                                      : "?"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-semibold text-slate-50">
                                        {comment.author}
                                      </span>
                                      {comment.handle && (
                                        <span className="text-[10px] text-slate-400">
                                          {comment.handle}
                                        </span>
                                      )}
                                      {comment.timeAgo && (
                                        <span className="ml-auto text-[10px] text-slate-500">
                                          {comment.timeAgo}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-200">
                                      {comment.text}
                                    </p>
                                  </div>
                                  {canDeleteComment && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(post.id, comment.id)
                                      }
                                      className="ml-1 text-[11px] text-slate-500 hover:text-red-400"
                                      aria-label="Delete comment"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) =>
                                handleCommentInputChange(post.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                              placeholder="Add a comment..."
                              className="flex-1 rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post.id)}
                              className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 text-sm shadow-sm">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-50">
                        Your community stats
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-400">
                        How you are doing compared to the Habitrix community.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      Live
                    </span>
                  </header>

                  <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="rounded-xl bg-slate-950/60 px-3 py-3">
                      <dt className="text-[11px] text-slate-400">
                        Habits today
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-50">
                        {todayStats.completedTodayCount}
                      </dd>
                      <p className="mt-1 text-[10px] text-slate-500">
                        of {todayStats.totalHabits || 0} active habits
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 px-3 py-3">
                      <dt className="text-[11px] text-slate-400">
                        Total check-ins
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-50">
                        {todayStats.totalCompletions}
                      </dd>
                      <p className="mt-1 text-[10px] text-slate-500">
                        all-time completions
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 px-3 py-3">
                      <dt className="text-[11px] text-slate-400">
                        Community rank
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-amber-400">
                        {communityRank ? `#${communityRank}` : "--"}
                      </dd>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {communityRank && communitySize > 0
                          ? `out of ${communitySize} active members`
                          : "Complete some habits to enter the rankings"}
                      </p>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-slate-800/40 bg-slate-900 px-5 py-4 text-sm shadow-sm">
                  <header className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-50">
                      Weekly leaderboard
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Top habit streaks
                    </span>
                  </header>

                  <ol className="mt-4 space-y-3 text-sm">
                    {leaderboard.length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        No leaderboard data yet. Complete some habits to appear here.
                      </p>
                    )}
                    {leaderboard.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-100">
                            {entry.id}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-50">
                              {entry.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {entry.subtitle}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold text-slate-950 ${entry.accent}`}
                        >
                          {entry.score}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </section>

            <section className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-50">
                  Active challenges
                </h2>
                <button
                  type="button"
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  View all
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {challenges.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No active challenges yet. Check back later.
                  </p>
                )}
                {challenges.map((challenge) => (
                  <article
                    key={challenge.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800/40 bg-slate-900/90 p-4 text-sm shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-50">
                          {challenge.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {challenge.description}
                        </p>
                      </div>
                        <span className="rounded-full bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300">
                        {challenge.durationLabel}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{challenge.participantsCount} joined</span>
                        <span>{challenge.baseProgressPercent}% complete</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${challenge.accent}`}
                          style={{ width: `${challenge.baseProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleChallenge(challenge.id)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          challenge.joined
                            ? "bg-slate-800 text-slate-200"
                            : "bg-sky-500 text-white hover:bg-sky-600"
                        }`}
                      >
                        {challenge.joined ? "Joined" : "Join challenge"}
                      </button>
                      <span className="text-[11px] text-slate-500">
                        Demo challenge only
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
