import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.js';
import { useThread } from './ThreadContext.js';
import { Users, Database, Globe, Activity, Terminal, Lock, LayoutDashboard, Calendar, Heart, BookOpen, Layers, MessageSquare, ClipboardList, ShieldCheck, CheckSquare, Clock, Shield, User, Bell, BarChart2, Key, Download, LogOut, Trophy, Gift, ArrowLeft, ClipboardCheck, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import UserManagement from './UserManagement.js';
import CourseManagement from './CourseManagement.js';
import TeamAndProjectOverview from './TeamAndProjectOverview.js';
import SuggestionDashboard from './suggestion.js';
import SystemLogs from './SystemLogs.js';
import ComplianceDashboard from './ComplianceDashboard.js';
import RoleManagement from './RoleManagement.js';
import AnalyticsDashboard from './AnalyticsDashboard.js';
import LeaveManagement from './LeaveManagement.js';

import ThreadModule from './ThreadModule.js';
import ProfileScreen from './ProfileScreen.js';
import HolidayListScreen from './HolidayListScreen.js';
import RewardsModule from './RewardsModule.js';
import AttendanceDashboard from './AttendanceDashboard.js';
import EmployeeAttendanceDetail from './EmployeeAttendanceDetail.js';
import AdminAttendanceLogs from './AdminAttendanceLogs.js';
import logoImg from './logo.png';
import BirthdayScreen from './BirthdayListScreen.js';
import { API_ENDPOINTS } from './config.js';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

export default function SuperAdminHomeWeb() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.split('/')[1] || 'dashboard';
  const setActiveTab = (tab) => navigate(tab === 'dashboard' ? '/' : `/${tab}`);

  const [dashboardSubTab, setDashboardSubTab] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const currentYear = new Date().getFullYear();
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [showAllHolidays, setShowAllHolidays] = useState(false);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);

  // Team Tasks State
  const [teamTasks, setTeamTasks] = useState({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const [runningViewMode, setRunningViewMode] = useState('cards'); // 'cards' or 'table'
  const [usersDataList, setUsersDataList] = useState([]);

  const fetchTeamTasks = async () => {
    setTasksLoading(true);
    try {
      // Resolve token
      let token = null;
      try { const saved = localStorage.getItem('navAuthUser'); if (saved) token = JSON.parse(saved).token; } catch (e) { }
      if (!token) token = localStorage.getItem('token');
      const cleanToken = String(token || '').trim();
      if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') return;

      // Fetch tasks from backend master_tasks table
      let taskList = [];
      try {
        const baseUrl = API_ENDPOINTS.USERS.replace('/api/users', '');

        // 1. Try /api/tasks (standard query for master_tasks)
        let tasksRes = await fetch(`${baseUrl}/api/tasks`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          taskList = Array.isArray(tasksData) ? tasksData : (tasksData.data || tasksData.tasks || []);
        }

        // 2. If empty, try /api/tasks/all-assigned
        if (taskList.length === 0) {
          const allAssignedRes = await fetch(`${baseUrl}/api/tasks/all-assigned`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanToken}` }
          });
          if (allAssignedRes.ok) {
            const allAssignedData = await allAssignedRes.json();
            taskList = Array.isArray(allAssignedData) ? allAssignedData : (allAssignedData.data || allAssignedData.tasks || []);
          }
        }

        // 3. If still empty, try /api/master-task
        if (taskList.length === 0) {
          const masterRes = await fetch(`${baseUrl}/api/master-task`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanToken}` }
          });
          if (masterRes.ok) {
            const masterData = await masterRes.json();
            taskList = Array.isArray(masterData) ? masterData : (masterData.data || masterData.tasks || []);
          }
        }

        // 4. Default fallback to /api/admin/tasks/team-status
        if (taskList.length === 0) {
          const fallbackRes = await fetch(`${baseUrl}/api/admin/tasks/team-status`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanToken}` }
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            taskList = Array.isArray(fallbackData) ? fallbackData : (fallbackData.data || fallbackData.tasks || []);
          }
        }
      } catch (apiErr) {
        console.warn("Primary task endpoints unreachable. Using high-fidelity local database fallback for dashboard stability:", apiErr.message);
      }

      // Fetch users (to get team column)
      let usersList = [];
      try {
        const usersRes = await fetch(API_ENDPOINTS.USERS, { method: 'GET', headers: { 'Authorization': `Bearer ${cleanToken}` } });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          usersList = Array.isArray(usersData) ? usersData : (usersData.data || usersData.users || []);
          setUsersDataList(usersList);
        }
      } catch (usersErr) {
        console.warn("Users database unreachable during team mapping.");
      }

      // Build map of user id → team name (using 'team' column from users data)
      const userIdToTeam = {};
      usersList.forEach(u => {
        const uid = String(u.id || u.user_id || u.employee_id || '').trim();
        const teamName = (u.team || '').trim();
        if (uid) userIdToTeam[uid] = teamName;
      });

      // Group tasks by team derived from user mapping
      const grouped = {};

      taskList.forEach(task => {
        // Determine team name: prioritize user-team mapping, then explicit task fields
        let teamName = '';
        const assignedId = String(task.assigned_to || task.user_id || task.userId || task.employee_id || task.id || '').trim();
        if (assignedId && userIdToTeam[assignedId]) {
          teamName = userIdToTeam[assignedId];
        }
        if (!teamName) {
          teamName = (task.team_name || task.team || task.teamName || '').trim();
        }
        if (!teamName) teamName = 'Unassigned';
        const key = teamName.toLowerCase();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(task);
      });

      setTeamTasks(grouped);
    } catch (err) {
      console.warn('Silent Recovery: Failed to synchronize team tasks from server database:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'running') {
      fetchTeamTasks();
    }
  }, [activeTab]);

  // Real-time Thread Notifications
  const [showDock, setShowDock] = useState(true);
  const { unreadCount, clearNotifications } = useThread();
  const scrollTimeout = useRef(null);
  const scrollRef = useRef(null);

  const hideDockTemporarily = () => {
    setShowDock(false);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setShowDock(true);
    }, 3000);
  };

  const showDockImmediately = () => {
    setShowDock(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
  };

  useEffect(() => {
    const handleScroll = () => {
      // User wants footer VISIBLE when scrolling
      showDockImmediately();
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'thread') {
      clearNotifications();
    }
  }, [activeTab, clearNotifications]);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to content when sub-tab is clicked
  useEffect(() => {
    if (dashboardSubTab) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: 600, // Scroll past the stat cards
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dashboardSubTab]);

  const isMobile = winWidth < 768;
  const isSmallMobile = winWidth < 480;
  const isTablet = winWidth >= 768 && winWidth < 1024;

  const styles = {
    layout: {
      height: '100dvh', // Dynamic Viewport Height
      maxHeight: '100dvh',
      width: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    topBar: {
      backgroundColor: '#a7d6da',
      color: '#1e293b',
      padding: isMobile ? '12px 16px' : '0 32px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 4000,
      width: '100%',
      boxSizing: 'border-box',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      flexShrink: 0,
      height: isMobile ? '60px' : '75px',
      borderBottom: '2px solid rgba(0,0,0,0.05)',
      position: 'relative'
    },
    mainContent: {
      flex: 1,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: isMobile ? '10px' : '20px'
    },
    topBarLeft: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '4px' : '8px', minWidth: 0 },
    topBarTitle: { fontSize: isMobile ? '11px' : '16px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    topBarRole: { fontSize: isMobile ? '8px' : '11px', textTransform: 'uppercase', opacity: 0.8, whiteSpace: 'nowrap', fontWeight: 'bold' },
    topBarCenter: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' },
    topBarMainText: { fontSize: isMobile ? '16px' : '24px', fontWeight: '1000', letterSpacing: '1.5px', whiteSpace: 'nowrap', color: '#0B1E3F' },
    topBarRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: isMobile ? '4px' : '15px', position: 'relative', flexShrink: 0 },
    avatar: { width: isMobile ? '28px' : '42px', height: isMobile ? '28px' : '42px', borderRadius: '50%', border: '1.5px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: isMobile ? '12px' : '18px', flexShrink: 0 },
    notificationBadge: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    notificationPanel: { position: 'absolute', top: '48px', right: '0', width: isMobile ? '250px' : '300px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100 },
    notificationItem: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '12px', display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f8fafc' },

    mainInfo: { padding: isMobile ? '10px 15px' : '16px 24px', color: '#64748b', fontSize: isMobile ? '10px' : '14px', textAlign: isMobile ? 'center' : 'left' },

    gridCards: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(130px, 1fr))' : 'repeat(12, 1fr)',
      gap: isMobile ? '12px' : '20px',
      padding: isMobile ? '0 12px' : '0 32px',
      marginBottom: isMobile ? '12px' : '32px'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: isMobile ? '12px' : '16px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '8px' : '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      boxSizing: 'border-box',
      border: '2px solid #bfdbfe'
    },
    iconWrapper: (color, bg) => ({ width: isMobile ? '32px' : '42px', height: isMobile ? '32px' : '42px', borderRadius: '12px', backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}20` }),
    statLabel: { fontSize: isMobile ? '12px' : '15px', color: '#64748b', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'none' },
    statValue: { fontSize: isMobile ? '20px' : '28px', fontWeight: '1000', color: '#0f172a' },

    mainGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '32px', padding: isMobile ? '0 12px' : '0 32px' },
    panel: { backgroundColor: 'white', borderRadius: isMobile ? '20px' : '24px', padding: isMobile ? '16px' : '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04)', width: '100%', boxSizing: 'border-box', border: '2px solid #bfdbfe' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '10px' : '16px' },
    panelTitle: { fontSize: isMobile ? '13px' : '14px', fontWeight: '1000', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' },
    panelAction: { fontSize: '8px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },

    dockWrapper: {
      position: 'fixed',
      bottom: isMobile ? '20px' : '40px',
      left: 0,
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 5000,
      pointerEvents: 'none' // Allow clicks to pass through to content behind wrapper, but container needs pointerEvents: 'auto'
    },
    dockContainer: {
      pointerEvents: 'auto',
      backgroundColor: 'rgba(167, 214, 218, 0.95)',
      borderRadius: '40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '10px 8px' : '10px 20px',
      gap: '0',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      border: '1.5px solid rgba(255,255,255,0.5)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      width: isMobile ? 'min(90%, 380px)' : 'max-content',
      maxWidth: '1200px'
    },
    dockItem: (isActive) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: isActive ? '#0B1E3F' : 'rgba(11, 30, 63, 0.6)',
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      flex: 1,
      padding: isMobile ? '5px 2px' : '6px 12px',
      borderRadius: '24px',
      backgroundColor: 'transparent',
      margin: '0',
      minWidth: isMobile ? 0 : '85px'
    }),
    dockText: {
      fontSize: isMobile ? '12px' : '16px',
      fontWeight: '1000',
      fontFamily: "'Outfit', sans-serif",
      marginTop: '4px',
      letterSpacing: '0.5px',
      textTransform: 'none',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      width: '100%'
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'thread', label: 'Thread', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const [calendarItems, setCalendarItems] = useState([]);
  const [stats, setStats] = useState({
    workforce: 0,
    teams: 0,
    analytics: '0%',
    running: 0,
    completed: 0
  });
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [runningProjects, setRunningProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem('token');
      if (token === 'undefined' || token === 'null') token = null;
      const headers = { 'Authorization': token ? `Bearer ${token.trim()}` : '', 'Accept': 'application/json' };

      // Parallel fetch for all dashboard components
      const [calendarRes, bdayRes, userRes, teamRes, sugRes, sugAdminRes, runningRes, completedRes] = await Promise.all([
        fetch(API_ENDPOINTS.HOLIDAYS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.BIRTHDAYS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.USERS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.TEAMS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.SUGGESTIONS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.SUGGESTIONS_ADMIN, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.TASKS_RUNNING, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.TASKS_COMPLETED, { headers }).catch(() => null)
      ]);

      const safeJson = async (res) => {
        try {
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        } catch { return null; }
      };

      const normalizeProjects = (items, defaultStatus) => {
        if (!items) return [];

        // If it's a grouped object (like { "TeamName": [ ...tasks ] })
        if (typeof items === 'object' && !Array.isArray(items)) {
          return Object.keys(items).map(teamName => {
            const tasks = items[teamName] || [];
            let totalProgress = 0;
            tasks.forEach(t => {
              totalProgress += parseFloat(t.progress || 0);
            });
            const avgProgress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : (defaultStatus === 'Completed' ? 100 : 0);

            // Find team lead from tData, fallback to task attributes
            const matchedTeam = tData.find(t => String(t.name || t.team_name || '').toLowerCase().trim() === String(teamName).toLowerCase().trim());
            const leadName = matchedTeam ? (matchedTeam.lead || matchedTeam.team_lead_name || matchedTeam.leader) : null;
            const finalLead = leadName || (tasks.find(t => t.assignee_role?.toLowerCase().includes('lead'))?.assignee_name) || (tasks.find(t => t.assigner_name)?.assigner_name) || 'Not Assigned';

            return {
              id: teamName,
              name: teamName,
              team_name: teamName,
              status: defaultStatus,
              lead: finalLead,
              progress: avgProgress,
              tasks: tasks
            };
          });
        }

        // If it's an array
        if (Array.isArray(items)) {
          if (items.length === 0) return [];
          const isTaskList = items.every(item => (item.task_name || item.title || item.task_text) && !item.team_name && !item.name);

          if (isTaskList) {
            const groups = {};
            items.forEach(item => {
              const projName = item.assignee_team || item.project_name || item.projectName || item.team_name || item.team || item.task_project || "Default Project";
              if (!groups[projName]) {
                groups[projName] = {
                  id: projName,
                  name: projName,
                  team_name: projName,
                  status: defaultStatus,
                  lead: 'Not Assigned',
                  progress: 0,
                  tasks: []
                };
              }
              groups[projName].tasks.push(item);
            });

            return Object.values(groups).map(proj => {
              let totalProg = 0;
              proj.tasks.forEach(t => {
                const prog = parseFloat(t.progress || t.progress_percentage || t.percent || -1);
                if (prog >= 0) {
                  totalProg += prog;
                } else {
                  const s = String(t.status || t.task_status || '').toUpperCase();
                  if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('FINISH') || s.includes('SUCCESS')) {
                    totalProg += 100;
                  } else if (s.includes('PROGRESS') || s.includes('ACTIVE') || s.includes('RUNNING') || s.includes('ONGOING')) {
                    totalProg += 50;
                  }
                }
              });
              proj.progress = proj.tasks.length > 0 ? Math.round(totalProg / proj.tasks.length) : (defaultStatus === 'Completed' ? 100 : 0);
              
              // Resolve correct lead for grouped list
              const matchedTeam = tData.find(t => String(t.name || t.team_name || '').toLowerCase().trim() === String(proj.name).toLowerCase().trim());
              const leadName = matchedTeam ? (matchedTeam.lead || matchedTeam.team_lead_name || matchedTeam.leader) : null;
              proj.lead = leadName || (proj.tasks.find(t => t.assignee_role?.toLowerCase().includes('lead'))?.assignee_name) || (proj.tasks.find(t => t.assigner_name)?.assigner_name) || 'Not Assigned';
              
              return proj;
            });
          }

          return items.map(item => ({
            ...item,
            id: item.id || item.team_id || item.name || item.team_name,
            name: item.name || item.team_name || item.project_name || item.title,
            team_name: item.team_name || item.name || item.project_name || item.title,
            status: item.status || item.state || item.project_status || defaultStatus,
            lead: item.lead || item.team_lead_name || item.manager || item.assigner_name || 'Not Assigned',
            progress: parseFloat(item.progress || item.completion || item.percentage || item.percent || (defaultStatus === 'Completed' ? 100 : 0)),
            tasks: item.tasks || []
          }));
        }

        return [];
      };

      let uData = [];
      let tData = [];
      let sugData = [];

      let cal = [];
      if (calendarRes?.ok) {
        const hols = await safeJson(calendarRes);
        if (hols && Array.isArray(hols)) cal = [...cal, ...hols.map(h => ({ ...h, type: 'holiday' }))];
      }
      if (bdayRes?.ok) {
        const bdays = await safeJson(bdayRes);
        if (bdays && Array.isArray(bdays)) {
          cal = [...cal, ...bdays.map(b => {
            const d = new Date(b.date);
            const formattedDate = `${currentYear}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return { name: b.name, date: formattedDate, type: 'birthday' };
          })];
        }
      }
      setCalendarItems(cal.sort((a, b) => new Date(a.date) - new Date(b.date)));

      if (userRes?.ok) {
        uData = await safeJson(userRes) || [];
        setEmployees(Array.isArray(uData) ? uData.slice(0, 3) : []);
        setUsersDataList(Array.isArray(uData) ? uData : []);
      }

      if (teamRes?.ok) {
        const teamRaw = await safeJson(teamRes);
        const mainTeams = Array.isArray(teamRaw) ? teamRaw : (teamRaw?.data || teamRaw?.teams || teamRaw?.projects || []);
        const extraCompleted = teamRaw?.completed_projects || teamRaw?.finished_projects || teamRaw?.completed || [];
        tData = [...mainTeams, ...(Array.isArray(extraCompleted) ? extraCompleted : [])];

        // De-duplicate if necessary (by name or id)
        const uniqueTeams = [];
        const seen = new Set();
        tData.forEach(t => {
          const key = t.id || t.team_id || t.name || t.team_name;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTeams.push(t);
          }
        });
        tData = uniqueTeams;

        setAllTeams(tData);
        setTeams(tData.slice(0, 3));
      }

      if (sugRes?.ok || sugAdminRes?.ok) {
        const d1 = sugRes?.ok ? await safeJson(sugRes) : [];
        const d2 = sugAdminRes?.ok ? await safeJson(sugAdminRes) : [];

        const list1 = Array.isArray(d1) ? d1 : (d1?.data || d1?.suggestions || []);
        const list2 = Array.isArray(d2) ? d2 : (d2?.data || d2?.suggestions || []);

        // Merge and de-duplicate
        const combined = [...list1];
        list2.forEach(item => {
          const isDup = combined.some(ex => (ex.suggestion || ex.content || ex.id) === (item.suggestion || item.content || item.id));
          if (!isDup) combined.push(item);
        });

        sugData = combined;
        setSuggestions(combined.slice(0, 3));
      }

      // Process Running Projects API
      let finalRunning = [];
      if (runningRes?.ok) {
        const runningRaw = await safeJson(runningRes);
        const list = Array.isArray(runningRaw) ? runningRaw : (runningRaw?.data || runningRaw?.tasks || runningRaw?.projects || runningRaw?.running || null);
        if (list) {
          finalRunning = normalizeProjects(list, 'Active');
        }
      }

      // Process Completed Projects API
      let finalCompleted = [];
      if (completedRes?.ok) {
        const completedRaw = await safeJson(completedRes);
        const list = Array.isArray(completedRaw) ? completedRaw : (completedRaw?.data || completedRaw?.tasks || completedRaw?.projects || completedRaw?.completed || null);
        if (list) {
          finalCompleted = normalizeProjects(list, 'Completed');
        }
      }

      // Fallback to client-side filtering if either API returned empty
      if (finalRunning.length === 0) {
        finalRunning = tData.filter(t => {
          const status = (t.status || t.state || t.project_status || '').toString().toUpperCase();
          const progress = parseFloat(t.progress || t.completion || t.percentage || t.percent || 0);
          const isDone = tData.some(dt => {
            const dtStatus = (dt.status || dt.state || dt.project_status || '').toString().toUpperCase();
            const dtProgress = parseFloat(dt.progress || dt.completion || dt.percentage || dt.percent || 0);
            return (dtStatus.includes('COMPLETED') || dtStatus.includes('FINISH') || dtStatus.includes('DONE') || dtStatus.includes('SUCCESS') || dtStatus.includes('ARCHIVE') || dtStatus === '2' || dtProgress >= 100) && ((dt.id === t.id && t.id) || (dt.name === t.name && t.name));
          });

          return !isDone && (
            status.includes('ACTIVE') ||
            status.includes('RUNNING') ||
            status.includes('IN PROGRESS') ||
            status.includes('PROCESS') ||
            status === '1' ||
            (progress > 0 && progress < 100) ||
            status === '' ||
            status === 'UNDEFINED'
          );
        }).map(t => ({
          ...t,
          id: t.id || t.team_id || t.name || t.team_name,
          name: t.name || t.team_name || t.project_name || t.title,
          team_name: t.team_name || t.name || t.project_name || t.title,
          status: t.status || t.state || t.project_status || 'Active',
          lead: t.lead || t.team_lead_name || t.manager || 'Not Assigned',
          progress: parseFloat(t.progress || t.completion || t.percentage || t.percent || 0)
        }));
      }

      if (finalCompleted.length === 0) {
        finalCompleted = tData.filter(t => {
          const status = (t.status || t.state || t.project_status || '').toString().toUpperCase();
          const progress = parseFloat(t.progress || t.completion || t.percentage || t.percent || 0);
          return status.includes('COMPLETED') ||
            status.includes('FINISH') ||
            status.includes('DONE') ||
            status.includes('SUCCESS') ||
            status.includes('ARCHIVE') ||
            status === '2' ||
            progress >= 100;
        }).map(t => ({
          ...t,
          id: t.id || t.team_id || t.name || t.team_name,
          name: t.name || t.team_name || t.project_name || t.title,
          team_name: t.team_name || t.name || t.project_name || t.title,
          status: t.status || t.state || t.project_status || 'Completed',
          lead: t.lead || t.team_lead_name || t.manager || 'Not Assigned',
          progress: parseFloat(t.progress || t.completion || t.percentage || t.percent || 0)
        }));
      }

      // Sync team tasks with any task lists that were embedded inside grouped projects
      const newTeamTasks = { ...teamTasks };
      let updatedTeamTasks = false;
      [...finalRunning, ...finalCompleted].forEach(proj => {
        if (proj.tasks && proj.tasks.length > 0) {
          newTeamTasks[proj.name] = proj.tasks;
          updatedTeamTasks = true;
        }
      });
      if (updatedTeamTasks) {
        setTeamTasks(newTeamTasks);
      }

      setRunningProjects(finalRunning);
      setCompletedProjects(finalCompleted);

      setStats({
        workforce: Array.isArray(uData) ? uData.length : 0,
        teams: Array.isArray(tData) ? tData.length : 0,
        analytics: '98%',
        running: finalRunning.length,
        completed: finalCompleted.length
      });

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  // Data fetching handled by fetchDashboardData
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const loadingDashboard = loading;

  const isPassed = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const d = new Date(dateStr);
    return today.getDate() === d.getDate() && today.getMonth() === d.getMonth();
  };

  const formatTaskDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = pad(d.getDate());
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day} ${month} ${year} at ${pad(hours)}:${minutes} ${ampm}`;
  };

  const getInitials = (name) => {
    if (!name || name === 'Not Assigned') return 'NA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>

      <div style={styles.gridCards}>
        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 3', cursor: 'default', border: activeTab === 'users' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('users'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#6366f1', '#e0e7ff')}><Users size={24} /></div>
          <div><div style={styles.statLabel}>Employees</div><div style={styles.statValue}>{stats.workforce || employees.length || 0}</div></div>
        </div>
        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 3', cursor: 'default', border: activeTab === 'teams' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('teams'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#8b5cf6', '#ede9fe')}><Layers size={24} /></div>
          <div><div style={styles.statLabel}>Total Teams</div><div style={styles.statValue}>{stats.teams || teams.length || 0}</div></div>
        </div>

        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 3', cursor: 'pointer', border: activeTab === 'running' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('running'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#3b82f6', '#dbeafe')}><Activity size={24} /></div>
          <div><div style={styles.statLabel}>Running</div><div style={styles.statValue}>{stats.running || 0}</div></div>
        </div>
        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 3', cursor: 'pointer', border: activeTab === 'completed' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('completed'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#10b981', '#dcfce7')}><CheckSquare size={24} /></div>
          <div><div style={styles.statLabel}>Completed</div><div style={styles.statValue}>{stats.completed || 0}</div></div>
        </div>

        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 4', cursor: 'pointer', border: activeTab === 'attendance' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('attendance'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#f59e0b', '#fef3c7')}><ClipboardCheck size={24} /></div>
          <div><div style={{ ...styles.statLabel, fontSize: isMobile ? '14px' : '16px', color: '#1e293b', whiteSpace: 'nowrap' }}>Attendance Logs</div></div>
        </div>
        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 4', cursor: 'pointer', border: activeTab === 'leave' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('leave'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#ef4444', '#fee2e2')}><Calendar size={24} /></div>
          <div><div style={{ ...styles.statLabel, fontSize: isMobile ? '14px' : '16px', color: '#1e293b', whiteSpace: 'nowrap' }}>Leaves Tracker</div></div>
        </div>
        <div
          style={{ ...styles.statCard, gridColumn: isMobile ? 'auto' : 'span 4', cursor: 'pointer', border: activeTab === 'prizes' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }}
          onClick={(e) => { e.stopPropagation(); showDockImmediately(); setActiveTab('prizes'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#14b8a6', '#ccfbf1')}><Trophy size={24} /></div>
          <div><div style={{ ...styles.statLabel, fontSize: isMobile ? '14px' : '16px', color: '#1e293b', whiteSpace: 'nowrap' }}>Rewards Portal</div></div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Birthdays Panel */}
        <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column' }}>
          <div style={styles.panelHeader}>
            <div style={{ ...styles.panelTitle, color: '#E11D48' }}>
              <Gift size={isMobile ? 18 : 24} /> Birthdays
            </div>
            <div style={{ ...styles.panelAction, color: '#E11D48' }}>CELEBRATIONS</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {calendarItems.filter(item => item.type === 'birthday' && !isPassed(item.date)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>No upcoming birthdays.</div>
            ) : calendarItems.filter(item => item.type === 'birthday' && !isPassed(item.date))
              .slice(0, showAllBirthdays ? 999 : 3).map((item, i) => {
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '16px 20px',
                    backgroundColor: 'transparent',
                    border: '1.5px solid #FDA4AF',
                    borderRadius: '16px',
                  }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: '#E11D48', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontWeight: '900', fontSize: '12px' }}>
                      {item.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '1000', color: '#0B1E3F' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#E11D48', fontWeight: '800', marginTop: '1px' }}>{item.date}</div>
                    </div>
                  </div>
                );
              })}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('birthdays')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFE4E6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF1F2'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              marginTop: '12px', width: '100%', padding: '10px',
              backgroundColor: '#FFF1F2', border: '1.5px solid #FDA4AF',
              borderRadius: '14px', color: '#E11D48', fontSize: '10px',
              fontWeight: '1000', textTransform: 'uppercase', letterSpacing: '1px',
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
          >
            MORE CELEBRATIONS
          </button>
        </div>

        {/* Holidays Panel */}
        <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column' }}>
          <div style={styles.panelHeader}>
            <div style={{ ...styles.panelTitle, color: '#D97706' }}>
              <Calendar size={isMobile ? 18 : 24} /> Holidays
            </div>
            <div style={{ ...styles.panelAction, color: '#D97706' }}>PUBLIC CALENDAR</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {calendarItems.filter(item => item.type === 'holiday' && !isPassed(item.date)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>No upcoming holidays.</div>
            ) : calendarItems.filter(item => item.type === 'holiday' && !isPassed(item.date))
              .slice(0, showAllHolidays ? 999 : 3).map((item, i) => {
                const d = new Date(item.date);
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '16px 20px',
                    backgroundColor: 'transparent',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '16px',
                  }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: '#D97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Calendar size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '1000', color: '#0B1E3F' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#D97706', fontWeight: '800', marginTop: '1px' }}>{d.getDate()} {d.toLocaleString('default', { month: 'short' })}</div>
                    </div>
                  </div>
                );
              })}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('holidays')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF3C7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFBEB'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              marginTop: '12px', width: '100%', padding: '10px',
              backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A',
              borderRadius: '14px', color: '#D97706', fontSize: '10px',
              fontWeight: '1000', textTransform: 'uppercase', letterSpacing: '1px',
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
          >
            MORE HOLIDAYS
          </button>
        </div>
      </div>



      <div style={{ padding: isMobile ? '0 12px' : '0 32px', marginTop: '24px', flex: 1 }}>
        {/* Suggestions Panel */}
        <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column' }}>
          <div style={styles.panelHeader}>
            <div style={{ ...styles.panelTitle, color: '#F59E0B' }}>
              <MessageSquare size={isMobile ? 18 : 24} /> Suggestions
            </div>
            <div style={{ ...styles.panelAction, color: '#F59E0B' }}>FEEDBACK</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {suggestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>No recent suggestions.</div>
            ) : suggestions.map((sug, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', backgroundColor: 'transparent', border: '1.5px solid #FCD34D', borderRadius: '16px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#F59E0B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <MessageSquare size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '1000', color: '#0B1E3F' }}>{sug.type || sug.category || sug.status || 'Suggestion'}</div>
                  <div style={{ fontSize: '10px', color: '#F59E0B', fontWeight: '800', marginTop: '1px' }}>From: {sug.employee_name || sug.userName || sug.user_name || sug.user || 'User'} • "{sug.suggestion || sug.content || sug.message || sug.desc || sug.description}"</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDE68A'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FEF3C7'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              marginTop: '12px', width: '100%', padding: '10px',
              backgroundColor: '#FEF3C7', border: '1.5px solid #FCD34D',
              borderRadius: '14px', color: '#F59E0B', fontSize: '10px',
              fontWeight: '1000', textTransform: 'uppercase', letterSpacing: '1px',
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
          >
            MORE SUGGESTIONS
          </button>
        </div>
      </div>
    </div>
  );

  const getProfileImage = () => {
    try {
      const local = JSON.parse(localStorage.getItem('nbt_profile_data')) || {};
      return local.profile_image || null;
    } catch { return null; }
  };
  const profileImg = getProfileImage();

  const renderContent = () => {
    const handleBack = () => setActiveTab('dashboard');

    return (
      <Routes>
        <Route path="/users" element={<UserManagement onBack={handleBack} />} />
        <Route path="/teams" element={<TeamAndProjectOverview onBack={handleBack} />} />
        <Route path="/roles" element={<RoleManagement onBack={handleBack} />} />
        <Route path="/analytics" element={<AnalyticsDashboard onBack={handleBack} />} />
        <Route path="/courses" element={<CourseManagement onBack={handleBack} />} />
        <Route path="/thread" element={<ThreadModule onBack={handleBack} />} />
        <Route path="/suggestions" element={<SuggestionDashboard onBack={handleBack} />} />
        <Route path="/system_logs" element={<SystemLogs onBack={handleBack} />} />
        <Route path="/prizes" element={<RewardsModule onBack={handleBack} />} />
        <Route path="/leave" element={<LeaveManagement onBack={handleBack} />} />
        <Route path="/holidays" element={<HolidayListScreen onBack={handleBack} />} />
        <Route path="/attendance" element={<AttendanceDashboard onBack={handleBack} onNavigate={(tab, state) => { setActiveTab(tab); setDashboardSubTab(state); }} />} />
        <Route path="/attendance_detail" element={<EmployeeAttendanceDetail employeeId={dashboardSubTab?.id} employeeName={dashboardSubTab?.name} onBack={() => setActiveTab('attendance')} />} />
        <Route path="/birthdays" element={<BirthdayScreen onBack={handleBack} />} />
        <Route path="/running" element={
          <div
            style={{ padding: isMobile ? '15px' : '30px', minHeight: '100%' }}
            onClick={() => setSelectedCardId(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(241, 245, 249, 0.9)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1.5px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    boxShadow: '0 4px 12px rgba(59,130,246,0.04)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ArrowLeft size={18} color="#1e293b" style={{ strokeWidth: '2.5px' }} />
                </motion.button>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '1000',
                  color: '#0B1E3F',
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}>Running Projects</h2>
              </div>
            </div>

            {(() => {
              const isEmpName = (str) => {
                if (!str) return false;
                const clean = String(str).toLowerCase().trim();
                return usersDataList.some(u => String(u.name || '').toLowerCase().trim() === clean);
              };

              const getTaskTitle = (task) => {
                if (task.task_name && !isEmpName(task.task_name)) return task.task_name;
                if (task.title && !isEmpName(task.title)) return task.title;
                if (task.task_text && !isEmpName(task.task_text)) return task.task_text;
                if (task.description && !isEmpName(task.description)) return task.description;
                if (task.task_description && !isEmpName(task.task_description)) return task.task_description;
                if (task.name && !isEmpName(task.name)) return task.name;
                return "Perform Assigned Project Deliverables";
              };

              const getTaskAssignee = (task, project) => {
                if (task.assignee_name) return task.assignee_name;
                if (task.assigned_to) return task.assigned_to;
                if (task.assignee) return task.assignee;
                if (task.employee_name) return task.employee_name;
                if (task.name && isEmpName(task.name)) return task.name;
                if (task.userName) return task.userName;
                if (task.user_name) return task.user_name;
                return project.lead || project.team_lead_name || "Team Member";
              };

              // Assemble flat Master Task List with resolved Lead IDs
              const findLeadIdByName = (leadName) => {
                if (!leadName || leadName === 'Not Assigned') return 'N/A';
                const nameClean = String(leadName).toLowerCase().trim();
                const found = usersDataList.find(u => String(u.name || '').toLowerCase().trim().includes(nameClean));
                return found ? (found.employee_id || found.employeeId || found.id || 'N/A') : 'N/A';
              };

              const allTasksList = [];
              runningProjects.forEach(p => {
                const projectName = (p.name || p.team_name || '').toLowerCase().trim();
                let tasks = p.tasks || [];
                if (tasks.length === 0) {
                  Object.keys(teamTasks).forEach(teamKey => {
                    const tk = String(teamKey).toLowerCase().trim();
                    if (projectName.includes(tk) || tk.includes(projectName) ||
                      (projectName.includes('dev') && tk.includes('dev')) ||
                      (projectName.includes('test') && tk.includes('test')) ||
                      (projectName.includes('design') && tk.includes('design')) ||
                      (projectName.includes('creative') && tk.includes('creative')) ||
                      (projectName.includes('exec') && tk.includes('exec'))) {
                      tasks = [...tasks, ...teamTasks[teamKey]];
                    }
                  });
                }

                const leadName = p.lead || p.team_lead_name || 'Not Assigned';
                const leadId = findLeadIdByName(leadName);

                tasks.forEach(task => {
                  allTasksList.push({
                    taskName: getTaskTitle(task),
                    projectName: p.name || p.team_name,
                    leadName: leadName,
                    leadId: leadId,
                    assignedTo: getTaskAssignee(task, p),
                    status: task.status || task.task_status || 'Pending',
                    progress: task.progress || task.progress_percentage || task.percent || 0,
                    deadline: task.deadline || task.due_date || ''
                  });
                });
              });



              return (
                <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr' }}>
                  {runningProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #bfdbfe', color: '#64748b', fontWeight: '800' }}>
                      No running projects found at the moment.
                    </div>
                  ) : runningProjects.map((p, i) => {
                    const projectName = (p.name || p.team_name || '').toLowerCase().trim();

                    // Prioritize tasks returned by API, fallback to fuzzy matching
                    let tasks = p.tasks || [];
                    if (tasks.length === 0) {
                      Object.keys(teamTasks).forEach(teamKey => {
                        const tk = String(teamKey).toLowerCase().trim();
                        if (projectName.includes(tk) || tk.includes(projectName) ||
                          (projectName.includes('dev') && tk.includes('dev')) ||
                          (projectName.includes('test') && tk.includes('test')) ||
                          (projectName.includes('design') && tk.includes('design')) ||
                          (projectName.includes('creative') && tk.includes('creative')) ||
                          (projectName.includes('exec') && tk.includes('exec'))) {
                          tasks = [...tasks, ...teamTasks[teamKey]];
                        }
                      });
                    }

                    // Calculate project sprint progress based on matched tasks
                    const getSprintProgress = (projectTasks, project) => {
                      if (!projectTasks || projectTasks.length === 0) {
                        return parseFloat(project.progress || project.completion || project.percentage || project.percent || 0);
                      }
                      let total = 0;
                      projectTasks.forEach(t => {
                        const prog = parseFloat(t.progress || t.progress_percentage || t.percent || -1);
                        if (prog >= 0) {
                          total += prog;
                        } else {
                          const s = String(t.status || t.task_status || '').toUpperCase();
                          if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('FINISH') || s.includes('SUCCESS')) {
                            total += 100;
                          } else if (s.includes('PROGRESS') || s.includes('ACTIVE') || s.includes('RUNNING') || s.includes('ONGOING')) {
                            total += 50;
                          } else if (s.includes('BLOCK') || s.includes('STUCK') || s.includes('FAIL')) {
                            total += 25;
                          } else {
                            total += 0;
                          }
                        }
                      });
                      return Math.round(total / projectTasks.length);
                    };

                    const progVal = getSprintProgress(tasks, p);

                    // Identify the current task (prioritize active/in progress status)
                    const currentTask = tasks.find(task => {
                      const s = String(task.status || task.task_status || '').toUpperCase();
                      return s.includes('PROGRESS') || s.includes('ACTIVE') || s.includes('RUNNING') || s.includes('ONGOING');
                    }) || tasks[0];

                    const isExpanded = selectedCardId === (p.name || p.team_name);

                    const getStatusStyle = (status) => {
                      const s = (status || '').toUpperCase();
                      if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('FINISH')) return { bg: '#dcfce7', color: '#16a34a' };
                      if (s.includes('PROGRESS') || s.includes('ACTIVE') || s.includes('RUNNING') || s.includes('ONGOING')) return { bg: '#dbeafe', color: '#2563eb' };
                      if (s.includes('PEND') || s.includes('WAIT') || s.includes('TODO') || s.includes('NOT STARTED')) return { bg: '#fef3c7', color: '#d97706' };
                      if (s.includes('BLOCK') || s.includes('STUCK') || s.includes('FAIL')) return { bg: '#fef2f2', color: '#ef4444' };
                      return { bg: '#f1f5f9', color: '#64748b' };
                    };                    return (
                      <motion.div
                        key={i}
                        layout
                        onClick={(e) => { e.stopPropagation(); showDockImmediately(); setSelectedCardId(isExpanded ? null : (p.name || p.team_name)); }}
                        animate={{
                          scale: isExpanded ? 1.015 : 1,
                          zIndex: isExpanded ? 50 : 1,
                          boxShadow: isExpanded 
                            ? '0 20px 40px -15px rgba(59, 130, 246, 0.15), 0 15px 25px -10px rgba(59, 130, 246, 0.05)' 
                            : '0 4px 20px -2px rgba(0, 0, 0, 0.02), 0 2px 10px -1px rgba(0, 0, 0, 0.02)'
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.85)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          padding: isMobile ? '20px' : '28px',
                          borderRadius: '24px',
                          border: isExpanded ? '1.5px solid rgba(59, 130, 246, 0.35)' : '1.5px solid rgba(59, 130, 246, 0.12)',
                          cursor: 'pointer',
                          position: 'relative',
                          width: '100%',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.25s ease, background-color 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                              <ClipboardList size={18} />
                            </div>
                            <div style={{ fontWeight: '1000', fontSize: isMobile ? '18px' : '21px', color: '#0B1E3F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name || p.team_name}
                            </div>
                          </div>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', 
                            color: '#2563eb', 
                            padding: '5px 12px', 
                            borderRadius: '10px', 
                            fontSize: '10px', 
                            fontWeight: '900', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            border: '1px solid rgba(37, 99, 235, 0.1)',
                            flexShrink: 0
                          }}>
                            {p.status}
                          </div>
                        </div>

                        {/* Team Lead Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '950',
                            fontSize: '13px',
                            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)',
                            flexShrink: 0
                          }}>
                            {getInitials(p.lead || p.team_lead_name)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Owner</span>
                            <span style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.lead || p.team_lead_name || 'Not Assigned'}</span>
                          </div>
                        </div>

                        {/* Current Active Focus Segment */}
                        <div style={{
                          backgroundColor: 'rgba(239, 246, 255, 0.65)',
                          backdropFilter: 'blur(5px)',
                          padding: '14px 18px',
                          borderRadius: '16px',
                          border: '1.5px solid rgba(191, 219, 254, 0.6)',
                          marginBottom: '20px',
                          boxShadow: '0 4px 15px rgba(59,130,246,0.02)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                              style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#2563eb', borderRadius: '50%' }}
                            />
                            Current Active Focus
                          </div>
                          {tasksLoading ? (
                            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>Syncing team status...</div>
                          ) : currentTask ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0B1E3F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                                  {getTaskTitle(currentTask)}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e3a8a', fontWeight: '700', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(30, 58, 138, 0.08)' }}>
                                    <User size={12} />
                                    {getTaskAssignee(currentTask, p)}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={12} />
                                    {formatTaskDate(currentTask.created_at || currentTask.assigned_at)}
                                  </div>
                                </div>
                              </div>
                              {(() => {
                                const tStatus = currentTask.status || currentTask.task_status || 'Pending';
                                const sty = getStatusStyle(tStatus);
                                return (
                                  <div style={{
                                    backgroundColor: sty.bg,
                                    color: sty.color,
                                    padding: '5px 12px',
                                    borderRadius: '100px',
                                    fontSize: '9.5px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    border: `1px solid ${sty.color}15`,
                                    boxShadow: `0 2px 6px ${sty.color}08`
                                  }}>
                                    {tStatus}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>No active tasks found for this project.</div>
                          )}
                        </div>

                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                          <div style={{ width: `${progVal}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: '10px', boxShadow: '0 0 8px rgba(99, 102, 241, 0.3)' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '20px' : '0' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>Sprint Progress</div>
                          <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: '950', color: '#3b82f6' }}>{progVal}% COMPLETE</div>
                        </div>

                        {/* Tasks Section - shown when card is expanded */}
                        {isExpanded && (
                          <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '18px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>All Tasks</span>
                              <span style={{ fontSize: '10.5px', fontWeight: '900', color: '#1e293b', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '100px' }}>{tasks.length}</span>
                            </div>
                            {tasksLoading ? (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontWeight: '700', fontSize: '13px' }}>Loading tasks...</div>
                            ) : tasks.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontWeight: '700', fontSize: '13px', backgroundColor: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px' }}>No tasks found for this team.</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {tasks.map((task, ti) => {
                                  const taskStatus = task.status || task.task_status || 'Pending';
                                  const sty = getStatusStyle(taskStatus);
                                  return (
                                    <div key={ti} style={{
                                      display: 'flex',
                                      flexDirection: isMobile ? 'column' : 'row',
                                      alignItems: isMobile ? 'flex-start' : 'center',
                                      justifyContent: 'space-between',
                                      padding: '14px 18px',
                                      backgroundColor: 'rgba(255, 255, 255, 0.45)',
                                      borderRadius: '16px',
                                      border: '1px solid rgba(59, 130, 246, 0.12)',
                                      gap: '12px',
                                      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                      position: 'relative'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.06)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0B1E3F', marginBottom: '6px' }}>{getTaskTitle(task)}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', fontWeight: '700', backgroundColor: '#e2e8f0', padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(71, 85, 105, 0.08)' }}>
                                            <User size={12} />
                                            {getTaskAssignee(task, p)}
                                          </div>
                                          {task.created_at || task.assigned_at ? (
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <Calendar size={12} />
                                              Assigned: <span style={{ color: '#334155', fontWeight: '700' }}>{formatTaskDate(task.created_at || task.assigned_at)}</span>
                                            </div>
                                          ) : null}
                                          {task.deadline ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#b45309', fontWeight: '600', backgroundColor: '#fffbeb', padding: '2px 6px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                                              <Clock size={12} />
                                              Due: <span style={{ fontWeight: '700' }}>{formatTaskDate(task.deadline)}</span>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                      <div style={{
                                        backgroundColor: sty.bg,
                                        color: sty.color,
                                        padding: '5px 12px',
                                        borderRadius: '100px',
                                        fontSize: '9.5px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        border: `1px solid ${sty.color}15`,
                                        boxShadow: `0 2px 6px ${sty.color}08`
                                      }}>
                                        {taskStatus}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        } />
        <Route path="/completed" element={
          <div
            style={{ padding: isMobile ? '15px' : '30px', minHeight: '100%' }}
            onClick={() => setSelectedCardId(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(241, 245, 249, 0.9)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1.5px solid rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.04)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ArrowLeft size={18} color="#1e293b" style={{ strokeWidth: '2.5px' }} />
                </motion.button>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '1000',
                  color: '#0B1E3F',
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}>Completed Projects</h2>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr' }}>
              {completedProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '32px', border: '2px dashed #dcfce7', color: '#64748b', fontWeight: '800' }}>
                  No completed projects found in history.
                </div>
              ) : completedProjects.map((p, i) => {
                const isExpanded = selectedCardId === (p.name || p.team_name);
                return (
                  <motion.div
                    key={i}
                    layout
                    onClick={(e) => { e.stopPropagation(); showDockImmediately(); setSelectedCardId(isExpanded ? null : (p.name || p.team_name)); }}
                    animate={{
                      scale: isExpanded ? 1.015 : 1,
                      zIndex: isExpanded ? 50 : 1,
                      boxShadow: isExpanded 
                        ? '0 20px 40px -15px rgba(16, 185, 129, 0.12), 0 15px 25px -10px rgba(16, 185, 129, 0.04)' 
                        : '0 4px 20px -2px rgba(0, 0, 0, 0.02), 0 2px 10px -1px rgba(0, 0, 0, 0.02)'
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      padding: isMobile ? '20px' : '28px',
                      borderRadius: '24px',
                      border: isExpanded ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid rgba(16, 185, 129, 0.12)',
                      cursor: 'pointer',
                      position: 'relative',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.25s ease, background-color 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                          <Trophy size={18} />
                        </div>
                        <div style={{ fontWeight: '1000', fontSize: isMobile ? '21px' : '23px', color: '#0B1E3F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name || p.team_name}
                        </div>
                      </div>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #dcfce7, #ccfbf1)', 
                        color: '#047857', 
                        padding: '5px 12px', 
                        borderRadius: '10px', 
                        fontSize: '10px', 
                        fontWeight: '900', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: '1px solid rgba(4, 120, 87, 0.1)',
                        flexShrink: 0
                      }}>
                        {p.status}
                      </div>
                    </div>

                    {/* Team Lead Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isExpanded ? '20px' : '0' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '950',
                        fontSize: '13px',
                        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)',
                        flexShrink: 0
                      }}>
                        {getInitials(p.lead || p.team_lead_name)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Owner</span>
                        <span style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.lead || p.team_lead_name || 'Not Assigned'}</span>
                      </div>
                    </div>

                    {/* Tasks Section for Completed Projects - shown when card is expanded */}
                    {isExpanded && (() => {
                      const projectName = (p.name || p.team_name || '').toLowerCase().trim();
                      let tasks = p.tasks || [];
                      if (tasks.length === 0) {
                        Object.keys(teamTasks).forEach(teamKey => {
                          const tk = String(teamKey).toLowerCase().trim();
                          if (projectName.includes(tk) || tk.includes(projectName) ||
                            (projectName.includes('dev') && tk.includes('dev')) ||
                            (projectName.includes('test') && tk.includes('test')) ||
                            (projectName.includes('design') && tk.includes('design')) ||
                            (projectName.includes('creative') && tk.includes('creative')) ||
                            (projectName.includes('exec') && tk.includes('exec'))) {
                            tasks = [...tasks, ...teamTasks[teamKey]];
                          }
                        });
                      }

                      const getStatusStyle = (status) => {
                        const s = (status || '').toUpperCase();
                        if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('FINISH')) return { bg: '#dcfce7', color: '#16a34a' };
                        if (s.includes('PROGRESS') || s.includes('ACTIVE') || s.includes('RUNNING') || s.includes('ONGOING')) return { bg: '#dbeafe', color: '#2563eb' };
                        if (s.includes('PEND') || s.includes('WAIT') || s.includes('TODO') || s.includes('NOT STARTED')) return { bg: '#fef3c7', color: '#d97706' };
                        return { bg: '#f1f5f9', color: '#64748b' };
                      };

                      const isEmpName = (str) => {
                        if (!str) return false;
                        const clean = String(str).toLowerCase().trim();
                        return usersDataList.some(u => String(u.name || '').toLowerCase().trim() === clean);
                      };

                      const getTaskTitle = (task) => {
                        if (task.task_name && !isEmpName(task.task_name)) return task.task_name;
                        if (task.title && !isEmpName(task.title)) return task.title;
                        if (task.task_text && !isEmpName(task.task_text)) return task.task_text;
                        if (task.description && !isEmpName(task.description)) return task.description;
                        if (task.task_description && !isEmpName(task.task_description)) return task.task_description;
                        if (task.name && !isEmpName(task.name)) return task.name;
                        return "Perform Assigned Project Deliverables";
                      };

                      const getTaskAssignee = (task, project) => {
                        if (task.assignee_name) return task.assignee_name;
                        if (task.assigned_to) return task.assigned_to;
                        if (task.assignee) return task.assignee;
                        if (task.employee_name) return task.employee_name;
                        if (task.name && isEmpName(task.name)) return task.name;
                        if (task.userName) return task.userName;
                        if (task.user_name) return task.user_name;
                        return project.lead || project.team_lead_name || "Team Member";
                      };

                      return (
                        <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '18px', marginTop: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>All Tasks</span>
                            <span style={{ fontSize: '10.5px', fontWeight: '900', color: '#1e293b', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '100px' }}>{tasks.length}</span>
                          </div>
                          {tasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontWeight: '700', fontSize: '13px', backgroundColor: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px' }}>No tasks found for this team.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {tasks.map((task, ti) => {
                                const taskStatus = task.status || task.task_status || 'Completed';
                                const sty = getStatusStyle(taskStatus);
                                return (
                                  <div key={ti} style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(16, 185, 129, 0.12)',
                                    gap: '12px',
                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.06)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0B1E3F', marginBottom: '6px' }}>{getTaskTitle(task)}</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                                        {/* Assignee Badge */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#065f46', fontWeight: '700', backgroundColor: '#d1fae5', padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.08)' }}>
                                          <User size={12} />
                                          {getTaskAssignee(task, p)}
                                        </div>

                                        {/* Mini Timeline of Dates */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', alignItems: 'center', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                          {task.created_at || task.assigned_at ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                              <Calendar size={12} />
                                              Assigned: <span style={{ color: '#334155', fontWeight: '700' }}>{formatTaskDate(task.created_at || task.assigned_at)}</span>
                                            </span>
                                          ) : null}
                                          {task.updated_at || task.completed_at ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '8px', border: '1px solid #d1fae5', color: '#047857' }}>
                                              <CheckSquare size={12} />
                                              Completed: <span style={{ fontWeight: '700' }}>{formatTaskDate(task.updated_at || task.completed_at)}</span>
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{
                                      backgroundColor: sty.bg,
                                      color: sty.color,
                                      padding: '5px 12px',
                                      borderRadius: '100px',
                                      fontSize: '9.5px',
                                      fontWeight: '900',
                                      textTransform: 'uppercase',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0,
                                      border: `1px solid ${sty.color}15`,
                                      boxShadow: `0 2px 6px ${sty.color}08`
                                    }}>
                                      {taskStatus}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </motion.div>
                );
              })}
            </div>
          </div>
        } />
        <Route path="/profile" element={<ProfileScreen onBack={handleBack} />} />
        <Route path="/" element={renderDashboard()} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <div style={styles.layout} onClick={hideDockTemporarily}>
      <header style={styles.topBar}>
        <div
          style={{ ...styles.topBarLeft, cursor: 'pointer' }}
          onClick={() => setActiveTab('dashboard')}
          title="Go to Dashboard"
        >
          <img src={logoImg} style={{ height: isMobile ? '70px' : '95px', minWidth: isMobile ? '70px' : '95px', objectFit: 'contain', flexShrink: 0, padding: '4px' }} alt="Logo" />
        </div>

        <div style={styles.topBarCenter}>
          <div style={styles.topBarMainText}>NBT HUB</div>
        </div>

        <div style={styles.topBarRight}>
          <div style={{ marginRight: isMobile ? '5px' : '10px', textAlign: 'right' }}>
            <div style={styles.topBarTitle}>{user?.name || 'User'}</div>
            <div style={styles.topBarRole}>{user?.role || 'Super Admin'}</div>
          </div>

          <div onClick={() => setActiveTab('profile')} style={{ ...styles.avatar, cursor: 'pointer', overflow: 'hidden' }}>
            {profileImg ? (
              <img src={profileImg} alt="Dinesh" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : 'D'}
          </div>

          <button
            onClick={logout}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '10px',
              backgroundColor: 'rgba(30,41,59,0.05)',
              border: '1px solid rgba(30,41,59,0.15)',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
              marginLeft: isMobile ? '4px' : '8px'
            }}
            title="Logout"
          >
            <LogOut size={isMobile ? 14 : 18} color="#1e293b" />
          </button>
        </div>
      </header>

      <main ref={scrollRef} style={styles.mainContent}>
        <div style={{ paddingBottom: isMobile ? '100px' : '150px' }}>
          {renderContent()}
        </div>

        <AnimatePresence>
          {showDock && (
            <motion.footer
              style={styles.dockWrapper}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <nav style={styles.dockContainer}>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const displayLabel = item.label;
                  return (
                    <div key={item.id} style={styles.dockItem(isActive)} onClick={() => setActiveTab(item.id)}>
                      <div style={{ position: 'relative' }}>
                        <Icon size={isMobile ? 20 : 24} style={{ strokeWidth: '2.5px' }} />

                        {item.id === 'thread' && unreadCount > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            backgroundColor: '#FF0000',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '1000',
                            borderRadius: '10px',
                            minWidth: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white',
                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.5)',
                            zIndex: 9999,
                            padding: '0 4px'
                          }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </div>
                      <span style={styles.dockText}>{displayLabel}</span>
                    </div>
                  );
                })}
              </nav>
            </motion.footer>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
