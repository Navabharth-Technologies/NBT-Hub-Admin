export const BASE_URL = 'http://192.168.1.5:5000';
export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/login`,
  REGISTER: `${BASE_URL}/api/register`,
  PROFILE: (email) => `${BASE_URL}/api/profile/${email}`,
  PROFILE_UPDATE: `${BASE_URL}/api/profile/update`,
  PROFILE_ABOUT: `${BASE_URL}/api/profile/about`,
  MANAGER_PROFILE: `${BASE_URL}/api/profile/manager`,
  TASK_UPDATES: `${BASE_URL}/api/task-updates`,
  TASKS: (userId) => `${BASE_URL}/api/tasks?userId=${userId}`,
  HOLIDAYS: `${BASE_URL}/api/holidays`,
  USERS: `${BASE_URL}/api/users`,
  THREADS: `${BASE_URL}/api/threads`,
  THREAD_REACT: (id) => `${BASE_URL}/api/threads/${id}/react`,
  THREAD_COMMENT: (id) => `${BASE_URL}/api/threads/${id}/comments`,
  THREAD_COMMENTS: (id) => `${BASE_URL}/api/threads/${id}/comments`,
  THREAD_REACTORS: (id, type) => `${BASE_URL}/api/threads/${id}/reactors?type=${type}`,
  THREAD_DELETE: (id) => `${BASE_URL}/api/threads/${id}`,
  THREAD_UPDATE: (id) => `${BASE_URL}/api/threads/${id}`,
  THREAD_USER: (userId) => `${BASE_URL}/api/threads/user/${userId}`,
  COMMENT_DELETE: (threadId, commentId) => `${BASE_URL}/api/threads/${threadId}/comments/${commentId}`,
  COMMENT_UPDATE: (threadId, commentId) => `${BASE_URL}/api/threads/${threadId}/comments/${commentId}`,
  BIRTHDAYS: `${BASE_URL}/api/birthdays`,
  TEAMS: `${BASE_URL}/api/teams`,
  DASHBOARD_STATS: `${BASE_URL}/api/dashboard-stats`,
  ATTENDANCE: `${BASE_URL}/api/attendance`,
  ATTENDANCE_LOGS_GET: `${BASE_URL}/api/attendance_logs`,
  ALL_ATTENDANCE: `${BASE_URL}/api/attendance_logs`,
  ATTENDANCE_LOGS_BY_USER: (userId) => `${BASE_URL}/api/attendance_logs?userId=${userId}`,
  ATTENDANCE_PUNCH: `${BASE_URL}/api/attendance_logs/punch`,
  ATTENDANCE_PUNCH_UPDATE: `${BASE_URL}/api/attendance/update-punch-time`,
  ORGANIZATIONAL_ATTENDANCE: `${BASE_URL}/api/manager/attendance`,
  LEAVES_GET: `${BASE_URL}/api/leaves`,
  CEO_LEAVES_GET: `${BASE_URL}/api/ceo/leaves`,
  LEAVE_STATUS_UPDATE: (id) => `${BASE_URL}/api/leaves/${id}/status`,
  SUGGESTIONS: `${BASE_URL}/api/suggestions`,
  REWARDS_HISTORY: `${BASE_URL}/api/admin/reward/history`,
  USER_REWARDS: (id) => `${BASE_URL}/api/rewards/user/${id}`,
  REWARDS: `${BASE_URL}/api/rewards`,
  REWARD_EDIT: (id) => `${BASE_URL}/api/rewards/${id}`,
  REWARD_DELETE: (id) => `${BASE_URL}/api/rewards/${id}`,
  REWARD_CATEGORIES: `${BASE_URL}/api/rewards/categories`,
  REWARDS_GIVE: `${BASE_URL}/api/rewards`,
  REWARDS_LEADERBOARD: `${BASE_URL}/api/admin/rewards/leaderboard`,
  LEADERBOARD_ALL: `${BASE_URL}/api/employees/leaderboard/all`,
  SUGGESTIONS_ADMIN: `${BASE_URL}/api/suggestions/admin`,
  TASKS_RUNNING: `${BASE_URL}/api/admin/tasks/running`,
  TASKS_COMPLETED: `${BASE_URL}/api/admin/tasks/completed`,
};

export const calculateDeterministicProgress = (team) => {
  if (!team) return 85;
  const rawProgress = parseFloat(team.progress || team.completion || team.percentage || team.percent || 0);
  if (rawProgress > 0 && rawProgress !== 85) return rawProgress;
  
  const nameStr = String(team.name || team.team_name || team.id || '').trim().toLowerCase();
  if (!nameStr) return 85;
  
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 80 + (Math.abs(hash) % 20); // returns 80 to 99
};
