import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from './config';
import { useAuth } from './AuthContext';

const ThreadContext = createContext();

export const ThreadProvider = ({ children }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalThreads, setTotalThreads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastEventSum, setLastEventSum] = useState(0);
  const mutationInFlight = useRef(false);

  const sanitizeId = (id) => String(id || '').split(':')[0];

  useEffect(() => {
    if (user) {
      fetchThreads(user.id);
      const interval = setInterval(() => fetchThreads(user.id, true), 5000); // Fast 5s polling for real-time notifications
      return () => clearInterval(interval);
    } else {
      fetchThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchThreads = async (uId, isPolling = false) => {
    // Skip polling fetches while a like/comment/badge mutation is in progress
    if (isPolling && mutationInFlight.current) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const sid = sanitizeId(uId);
      const url = `${API_ENDPOINTS.THREADS}${sid ? `?userId=${sid}` : ''}`;

      // Aggressive cache-busting to ensure we always get live data during polling
      const finalUrl = url + (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;

      const res = await fetch(finalUrl, {
        headers,
        cache: 'no-store'
      });

      let rawThreads = [];
      if (res.ok) {
        const data = await res.json();
        rawThreads = Array.isArray(data) ? data : (Array.isArray(data.value) ? data.value : (Array.isArray(data.data) ? data.data : []));
      } else {
        // DEMO SAFETY FALLBACK: Use empty array if backend is unreachable
        rawThreads = [];
      }

      // Standardized Normalization Layer: Absolute isolation of endorsements from emotional reactions
      const normalized = rawThreads.map(t => {
        const rawReactions = t.reactions || {};
        const rawUserReactions = t.user_reactions || t.userReactions || {};

        const nameToEmoji = {
          'heart': '❤️', 'thumbsup': '👍', 'cake': '🎂', 'fire': '🔥', 'clap': '👏',
          'thumbs_up': '👍', 'heart_eyes': '😍', 'laughing': '😂', 'shocked': '😮'
        };

        const reactions = {};
        const userReactions = {};

        Object.entries(rawReactions).forEach(([key, val]) => {
          const emojiKey = nameToEmoji[key.toLowerCase()] || key;
          reactions[emojiKey] = (reactions[emojiKey] || 0) + val;
        });

        Object.entries(rawUserReactions).forEach(([key, val]) => {
          const emojiKey = nameToEmoji[key.toLowerCase()] || key;
          if (val === true || val === 1 || val === '1') {
            userReactions[emojiKey] = true;
          }
        });

        // Absolute Decoupling: Prioritize 'like' key from reactions object for official endorsements
        const officialLikeCount = rawReactions['like'] !== undefined ? rawReactions['like'] : (t.like_count !== undefined ? t.like_count : (t.likeCount || 0));
        const officialUserLiked = rawUserReactions['like'] === true || (t.user_has_liked !== undefined ? t.user_has_liked : (t.userHasLiked || false));

        let finalContent = t.content || '';
        let finalTagline = t.tagline || '';
        
        // Decode legacy posts that had tagline injected into content
        if (!finalTagline && finalContent.startsWith('TAGLINE:')) {
            const newlineIdx = finalContent.indexOf('\n');
            if (newlineIdx !== -1) {
                finalTagline = finalContent.substring(8, newlineIdx).trim();
                finalContent = finalContent.substring(newlineIdx + 1).trim();
            } else {
                finalTagline = finalContent.substring(8).trim();
                finalContent = '';
            }
        }

        return {
          ...t,
          tagline: finalTagline,
          content: finalContent,
          userId: t.user_id || t.userId,
          likeCount: officialLikeCount,
          badgeCount: t.badge_count !== undefined ? t.badge_count : (t.badgeCount || 0),
          commentCount: t.comment_count !== undefined ? t.comment_count : (t.comments || t.commentCount || 0),
          userHasLiked: officialUserLiked,
          userHasBadged: t.user_has_badged !== undefined ? t.user_has_badged : (t.userHasBadged || false),
          reactions: reactions,
          userReactions: userReactions,
          reactionUsers: t.reaction_users || t.reactionUsers || t.reactionDetails || {}
        };
      });

      // Priority Sorting: Ensure new threads show at the top (1st)
      const sorted = normalized.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at);
        const dateB = new Date(b.createdAt || b.created_at);
        return dateB - dateA;
      });

      // Standardized Activity Tracking: sum of all posts + all comments
      const currentActivitySum = sorted.reduce((acc, t) => {
        const cCount = t.commentCount || 0;
        return acc + 1 + cCount;
      }, 0);
      
      setTotalThreads(sorted.length);

      const cachedSum = parseInt(localStorage.getItem('nbt_admin_thread_watermark'), 10);

      // If local storage is empty, pretend storedSum is 0 so the user sees all current activity as unread.
      // It should ONLY update when they click the Thread tab.
      const storedSum = isNaN(cachedSum) ? 0 : cachedSum;
      const diff = currentActivitySum - storedSum;

      setUnreadCount(diff > 0 ? diff : 0);

      setThreads(sorted);
      setLastEventSum(currentActivitySum);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const clearNotifications = () => {
    setUnreadCount(0);
    // Calculate current total activity sum
    const currentActivitySum = threads.reduce((acc, t) => {
      const cCount = t.commentCount || 0;
      return acc + 1 + cCount;
    }, 0);

    if (currentActivitySum > 0) {
      localStorage.setItem('nbt_admin_thread_watermark', currentActivitySum.toString());
    }
  };

  const addPost = async (post) => {
    try {
      let mediaData = null;
      if (post.file) {
        mediaData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(post.file);
        });
      }

      let payloadContent = post.content || ' ';

      // OPTIMISTIC UPDATE: Instantly display the thread on the screen before the database responds!
      const optimisticPost = {
        id: 'temp-' + Date.now(),
        userId: Number(post.userId),
        user_id: Number(post.userId),
        userName: post.user,
        role: post.role || 'EMPLOYEE',
        tagline: post.tagline || '',
        content: payloadContent,
        mediaUrl: mediaData,
        mediaType: post.mediaType,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        badgeCount: 0
      };

      setThreads(prev => [optimisticPost, ...prev]);

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      // Fire and forget database storage (handled by teammate's backend)
      const res = await fetch(API_ENDPOINTS.THREADS, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: Number(post.userId),
          user_id: Number(post.userId),
          userName: post.user,
          role: post.role || 'EMPLOYEE',
          tagline: post.tagline || '',
          content: payloadContent,
          media: mediaData,
          mediaType: post.mediaType
        })
      });

      if (res.ok) {
        // Silently sync the real database IDs in the background
        fetchThreads();
      } else {
        const err = await res.text();
        console.error("API Error (Post):", err);
      }
    } catch (err) {
      console.error("AddPost JSON Error:", err);
    }
  };

  const toggleReaction = async (threadId, userId, type = 'like') => {
    mutationInFlight.current = true;
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const reactions = { ...(t.reactions || {}) };
        const currentCount = reactions[type] || (type === 'like' ? t.likeCount : 0) || 0;

        // Normalization: Ensure symbols and names are treated consistently
        const emojiMap = { 'heart': '❤️', 'thumbsup': '👍', 'cake': '🎂', 'fire': '🔥', 'clap': '👏' };
        const normType = emojiMap[type.toLowerCase()] || type;

        // Dynamic Toggle Logic: Decrement if current state is already active
        const userState = type === 'like' ? t.userHasLiked : (t.userReactions?.[normType] || t.userReactions?.[type] || false);
        const newCount = userState ? Math.max(0, currentCount - 1) : currentCount + 1;

        return {
          ...t,
          userHasLiked: type === 'like' ? !userState : t.userHasLiked,
          userReactions: { ...(t.userReactions || {}), [normType]: !userState, [type]: !userState },
          likeCount: type === 'like' ? newCount : (t.likeCount || 0),
          reactions: { ...reactions, [normType]: newCount, [type]: newCount }
        };
      }
      return t;
    }));

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const emojiToName = { '❤️': 'heart', '👍': 'thumbsup', '🎂': 'cake', '🔥': 'fire', '👏': 'clap', '😂': 'laughing', '😮': 'shocked' };
      const apiType = emojiToName[type] || type;

      const numId = Number(userId);
      const safeId = isNaN(numId) ? userId : numId;

      const res = await fetch(API_ENDPOINTS.THREAD_REACT(threadId), {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: safeId, user_id: safeId, reactionType: apiType, reaction_type: apiType })
      });
      // Wait a moment before syncing so the backend has time to persist
      await new Promise(r => setTimeout(r, 1500));
      await fetchThreads(userId);
    } catch (err) {
      console.error('toggleReaction error:', err);
      // Don't revert optimistic update on error — keep the UI state
    } finally {
      mutationInFlight.current = false;
    }
  };

  const toggleBadge = async (threadId, userId) => {
    mutationInFlight.current = true;
    // Optimistic Update
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const badged = !t.userHasBadged;
        const newCount = badged ? (t.badgeCount || 0) + 1 : Math.max(0, (t.badgeCount || 0) - 1);
        return {
          ...t,
          userHasBadged: badged,
          badgeCount: newCount,
          reactions: { ...(t.reactions || {}), badge: newCount }
        };
      }
      return t;
    }));

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const numId = Number(userId);
      const safeId = isNaN(numId) ? userId : numId;

      const res = await fetch(API_ENDPOINTS.THREAD_REACT(threadId), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: safeId,
          user_id: safeId,
          reactionType: 'badge',
          reaction_type: 'badge'
        })
      });
      await new Promise(r => setTimeout(r, 1500));
      await fetchThreads(userId);
    } catch (err) {
      console.error('toggleBadge error:', err);
    } finally {
      mutationInFlight.current = false;
    }
  };

  const addComment = async (threadId, userId, userName, content) => {
    mutationInFlight.current = true;
    // 1. Optimistic Comment Object
    const numId = Number(userId);
    const safeId = isNaN(numId) ? userId : numId;

    const newComment = {
      id: 'temp-' + Date.now(),
      userId: safeId,
      user_id: safeId,
      userName,
      content,
      createdAt: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const res = await fetch(API_ENDPOINTS.THREAD_COMMENT(threadId), {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: safeId, user_id: safeId, userName, content })
      });

      if (res.ok) {
        // Try to get the real comment from backend if possible
        const realComment = await res.json().catch(() => newComment);
        // Refresh threads keeping the user context so comment counts stay in sync
        await fetchThreads(userId);
        return realComment;
      }

      // If backend rejects, still return optimistic comment so UI stays intact
      return newComment;
    } catch (err) {
      console.error('addComment error:', err);
      return newComment;
    } finally {
      mutationInFlight.current = false;
    }
  };

  const fetchComments = async (threadId) => {
    try {
      // 1. Try minimal fetch
      const url = API_ENDPOINTS.THREAD_COMMENTS(threadId);
      const finalUrl = url + (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
      const res = await fetch(finalUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.comments || data.data || []);
      }

      // 2. Try with userId query param if the first attempt was NOT found (404)
      if (res.status === 404) {
        const sid = sanitizeId(user?.id);
        const urlWithId = `${url}${sid ? `?userId=${sid}` : ''}`;
        const finalUrl2 = urlWithId + (urlWithId.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
        const res2 = await fetch(finalUrl2, { cache: 'no-store' });
        if (res2.ok) {
          const data2 = await res2.json();
          return Array.isArray(data2) ? data2 : (data2.comments || data2.data || []);
        }
      }

      return [];
    } catch (e) {
      return [];
    }
  };

  const fetchReactors = async (threadId, reactionType) => {
    try {
      const res = await fetch(API_ENDPOINTS.THREAD_REACTORS(threadId, reactionType));
      if (res.ok) {
        const data = await res.json();
        // Normalize: backend may return array of users or { users: [] }
        return Array.isArray(data) ? data : (data.users || data.reactors || data.value || []);
      }
    } catch { }
    return [];
  };

  const deletePost = async (id) => {
    if (String(id).startsWith('temp-')) {
      setThreads(prev => prev.filter(t => t.id !== id));
      return true;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const sid = sanitizeId(user?.id);
      const url = `${API_ENDPOINTS.THREAD_DELETE(id)}?userId=${sid}&user_id=${sid}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ userId: user?.id, user_id: user?.id })
      });
      if (res.ok) {
        await fetchThreads();
        return true;
      }
      return false;
    } catch { return false; }
  };

  const fetchSingleThread = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const sid = sanitizeId(user?.id);
      const url = `${API_ENDPOINTS.THREAD_UPDATE(id)}?userId=${sid}&user_id=${sid}`;
      const res = await fetch(url, { headers });
      if (res.ok) return await res.json();
    } catch { }
    return null;
  };

  const fetchUserThreads = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const sid = sanitizeId(userId);
      const viewerId = sanitizeId(user?.id);
      const url = `${API_ENDPOINTS.THREAD_USER(sid)}${viewerId ? `?viewerId=${viewerId}&viewer_id=${viewerId}` : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) return await res.json();
    } catch { }
    return [];
  };

  const deleteComment = async (threadId, commentId) => {
    if (String(commentId).startsWith('temp-')) {
      return true;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const sid = sanitizeId(user?.id);
      const url = `${API_ENDPOINTS.COMMENT_DELETE(threadId, commentId)}?userId=${sid}&user_id=${sid}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ userId: user?.id, user_id: user?.id })
      });
      if (res.ok) {
        await fetchThreads();
        return true;
      }
      return false;
    } catch { return false; }
  };

  const updateComment = async (threadId, commentId, content) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const res = await fetch(API_ENDPOINTS.COMMENT_UPDATE(threadId, commentId), {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: user?.id,
          user_id: user?.id,
          content,
          text: content,
          comment: content,
          message: content
        })
      });
      if (res.ok) await fetchThreads();
    } catch { }
  };

  const updatePost = async (id, content) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const res = await fetch(API_ENDPOINTS.THREAD_UPDATE(id), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content })
      });
      if (res.ok) setThreads(threads.map(t => t.id === id ? { ...t, content } : t));
    } catch { }
  };

  return (
    <ThreadContext.Provider value={{
      threads, unreadCount, totalThreads, loading, fetchThreads, addPost, deletePost, updatePost,
      fetchSingleThread, fetchUserThreads,
      deleteComment, updateComment,
      toggleReaction, toggleBadge, addComment, fetchComments, fetchReactors, clearNotifications
    }}>
      {children}
    </ThreadContext.Provider>
  );
};

export const useThread = () => useContext(ThreadContext);
