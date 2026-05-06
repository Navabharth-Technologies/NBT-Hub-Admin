import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useThread } from './ThreadContext';
import { Users, Database, Globe, Activity, Terminal, Lock, LayoutDashboard, Calendar, Heart, BookOpen, Layers, MessageSquare, ClipboardList, ShieldCheck, CheckSquare, Clock, Shield, User, Bell, BarChart2, Key, Download, LogOut, Trophy, Gift, ArrowLeft, ClipboardCheck, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import TeamAndProjectOverview from './TeamAndProjectOverview';
import SuggestionDashboard from './suggestion';
import SystemLogs from './SystemLogs';
import ComplianceDashboard from './ComplianceDashboard';
import RoleManagement from './RoleManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import LeaveManagement from './LeaveManagement';

import ThreadModule from './ThreadModule';
import ProfileScreen from './ProfileScreen';
import HolidayListScreen from './HolidayListScreen';
import RewardsModule from './RewardsModule';
import AttendanceDashboard from './AttendanceDashboard';
import EmployeeAttendanceDetail from './EmployeeAttendanceDetail';
import AdminAttendanceLogs from './AdminAttendanceLogs';
import logoImg from './logo.png';
import BirthdayScreen from './BirthdayListScreen';
import { API_ENDPOINTS } from './config';

export default function SuperAdminHomeWeb() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const currentYear = new Date().getFullYear();
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [showAllHolidays, setShowAllHolidays] = useState(false);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  
  // Real-time Thread Notifications
  const [showDock, setShowDock] = useState(true);
  const { unreadCount, clearNotifications } = useThread();
  const scrollTimeout = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowDock(false);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setShowDock(true);
      }, 3000); // 3 seconds delay before showing again
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
      borderBottom: '2px solid rgba(0,0,0,0.05)'
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
    topBarCenter: { flex: 0 },
    topBarMainText: { fontSize: isMobile ? '16px' : '20px', fontWeight: '1000', letterSpacing: '0.5px', whiteSpace: 'nowrap', color: '#1e293b' },
    topBarRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: isMobile ? '4px' : '15px', position: 'relative', flexShrink: 0 },
    avatar: { width: isMobile ? '28px' : '42px', height: isMobile ? '28px' : '42px', borderRadius: '50%', border: '1.5px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: isMobile ? '12px' : '18px', flexShrink: 0 },
    notificationBadge: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    notificationPanel: { position: 'absolute', top: '48px', right: '0', width: isMobile ? '250px' : '300px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100 },
    notificationItem: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '12px', display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f8fafc' },

    mainInfo: { padding: isMobile ? '10px 15px' : '16px 24px', color: '#64748b', fontSize: isMobile ? '10px' : '14px', textAlign: isMobile ? 'center' : 'left' },

    gridCards: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(130px, 1fr))' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
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
    statLabel: { fontSize: isMobile ? '9px' : '11px', color: '#64748b', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase' },
    statValue: { fontSize: isMobile ? '16px' : '20px', fontWeight: '1000', color: '#0f172a' },

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
      backgroundColor: 'rgba(167, 214, 218, 0.85)', // glassmorphism adapted
      borderRadius: '40px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: isMobile ? '10px 12px' : '10px 20px',
      gap: isMobile ? '4px' : '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      border: '1.5px solid rgba(255,255,255,0.4)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)'
    },
    dockItem: (isActive) => ({ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      cursor: 'pointer', 
      color: isActive ? '#0B1E3F' : 'rgba(11, 30, 63, 0.6)', 
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
      flex: 1,
      padding: isMobile ? '8px 4px' : '10px 8px',
      borderRadius: '24px',
      backgroundColor: 'transparent',
      margin: '0 4px'
    }),
    dockText: { 
      fontSize: isMobile ? '7px' : '8px', 
      fontWeight: '900', 
      fontFamily: "'Outfit', sans-serif",
      marginTop: '3px',
      letterSpacing: '0.3px'
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'leave', label: 'LEAVES', icon: Calendar },
    { id: 'prizes', label: 'Prizes', icon: Trophy },
    { id: 'thread', label: 'Thread', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const [calendarItems, setCalendarItems] = useState([]);
  const [stats, setStats] = useState({
    workforce: 0,
    teams: 0,
    analytics: '0%',
    running: 5,
    completed: 3
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
      const [calendarRes, bdayRes, userRes, teamRes, sugRes, sugAdminRes] = await Promise.all([
        fetch(API_ENDPOINTS.HOLIDAYS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.BIRTHDAYS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.USERS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.TEAMS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.SUGGESTIONS, { headers }).catch(() => null),
        fetch(API_ENDPOINTS.SUGGESTIONS_ADMIN, { headers }).catch(() => null)
      ]);

      const safeJson = async (res) => {
        try {
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        } catch { return null; }
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
      }

      if (teamRes?.ok) {
        tData = await safeJson(teamRes) || [];
        setAllTeams(tData);
        setTeams(Array.isArray(tData) ? tData.slice(0, 3) : []);
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

      // Compute stats dynamically
      const runningTeams = tData.filter(t => 
        (t.status || '').toUpperCase().includes('ACTIVE') || 
        (t.status || '').toUpperCase().includes('RUNNING') ||
        (t.status || '').toUpperCase().includes('IN PROGRESS') ||
        ((t.progress || 0) > 0 && (t.progress || 0) < 100)
      );

      const doneTeams = tData.filter(t => 
        (t.status || '').toUpperCase().includes('COMPLETED') || 
        (t.progress || 0) >= 100
      );

      setRunningProjects(runningTeams);
      setCompletedProjects(doneTeams);

      setStats({
        workforce: Array.isArray(uData) ? uData.length : 0,
        teams: Array.isArray(tData) ? tData.length : 0,
        analytics: '98%',
        running: 5,
        completed: 3
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

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>

      <div style={styles.gridCards}>
        <div 
          style={{ ...styles.statCard, cursor: 'default', border: activeTab === 'users' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }} 
          onClick={() => setActiveTab('users')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#6366f1', '#e0e7ff')}><Users size={24} /></div>
          <div><div style={styles.statLabel}>Employees</div><div style={styles.statValue}>{stats.workforce || employees.length || 0}</div></div>
        </div>
        <div 
          style={{ ...styles.statCard, cursor: 'default', border: activeTab === 'teams' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }} 
          onClick={() => setActiveTab('teams')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#8b5cf6', '#ede9fe')}><Layers size={24} /></div>
          <div><div style={styles.statLabel}>Total Teams</div><div style={styles.statValue}>{stats.teams || teams.length || 0}</div></div>
        </div>

        <div 
          style={{ ...styles.statCard, cursor: 'pointer', border: activeTab === 'running' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }} 
          onClick={() => setActiveTab('running')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#3b82f6', '#dbeafe')}><Activity size={18} /></div>
          <div><div style={styles.statLabel}>Running</div><div style={styles.statValue}>{stats.running || 0}</div></div>
        </div>
        <div 
          style={{ ...styles.statCard, cursor: 'pointer', border: activeTab === 'completed' ? '2px solid #a7d6da' : '2px solid #bfdbfe' }} 
          onClick={() => setActiveTab('completed')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#10b981', '#dcfce7')}><CheckSquare size={18} /></div>
          <div><div style={styles.statLabel}>Completed</div><div style={styles.statValue}>{stats.completed || 0}</div></div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Birthdays Panel */}
        <div style={{...styles.panel, display: 'flex', flexDirection: 'column'}}>
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
                  backgroundColor: '#FFF1F2', 
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
        <div style={{...styles.panel, display: 'flex', flexDirection: 'column'}}>
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
                  backgroundColor: '#FFFBEB', 
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



      <div style={{ ...styles.mainGrid, marginTop: '24px', flex: 1 }}>
        {/* Analytics Panel */}
        <div style={{...styles.panel, display: 'flex', flexDirection: 'column'}}>
          <div style={styles.panelHeader}>
            <div style={{ ...styles.panelTitle, color: '#10B981' }}>
              <BarChart2 size={isMobile ? 18 : 24} /> Platform Analytics
            </div>
            <div style={{ ...styles.panelAction, color: '#10B981' }}>QUICK STATS</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {[
              { label: 'Performance Growth', value: stats.growth || '+18.5%', growth: 'Last 6 Months' },
              { label: 'Completion Rate', value: stats.completion || '78%', growth: '+12% Progress' },
              { label: 'Team Engagement', value: stats.engagement || 'High', growth: '92% Active' }
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', backgroundColor: '#F0FDF4', borderRadius: '16px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <BarChart2 size={14} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '1000', color: '#0B1E3F' }}>{stat.label}</div>
                    <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '800', marginTop: '1px' }}>Insight Detail • Performance</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: '1000', color: '#1e293b' }}>{stat.value}</div>
                    <div style={{ fontSize: '9px', color: '#10B981', fontWeight: '800' }}>{stat.growth}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            type="button"
            onClick={() => setActiveTab('analytics')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DCFCE7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F0FDF4'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{ 
              marginTop: '12px', width: '100%', padding: '10px', 
              backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', 
              borderRadius: '14px', color: '#10B981', fontSize: '10px', 
              fontWeight: '1000', textTransform: 'uppercase', letterSpacing: '1px', 
              cursor: 'pointer', transition: 'all 0.3s ease' 
            }}
          >
            MORE ANALYTICS
          </button>
        </div>

        {/* Suggestions Panel */}
        <div style={{...styles.panel, display: 'flex', flexDirection: 'column'}}>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', backgroundColor: '#FEF3C7', borderRadius: '16px' }}>
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

    switch (activeTab) {
      case 'users': return <UserManagement onBack={handleBack} />;
      case 'teams': return <TeamAndProjectOverview onBack={handleBack} />;
      case 'roles': return <RoleManagement onBack={handleBack} />;
      case 'analytics': return <AnalyticsDashboard onBack={handleBack} />;
      case 'courses': return <CourseManagement onBack={handleBack} />;
      case 'thread': return <ThreadModule onBack={handleBack} />;
      case 'suggestions': return <SuggestionDashboard onBack={handleBack} />;
      case 'system_logs': return <SystemLogs onBack={handleBack} />;
      case 'prizes': return <RewardsModule onBack={handleBack} />;
      case 'leave': return <LeaveManagement onBack={handleBack} />;
      case 'holidays': return <HolidayListScreen onBack={handleBack} />;
      case 'attendance': return <AttendanceDashboard onBack={handleBack} onNavigate={(tab, state) => { setActiveTab(tab); setDashboardSubTab(state); }} />;
      case 'attendance_detail': return <EmployeeAttendanceDetail employeeId={dashboardSubTab?.id} employeeName={dashboardSubTab?.name} onBack={() => setActiveTab('attendance')} />;
      case 'birthdays': return <BirthdayScreen onBack={handleBack} />;
      case 'running':
        return (
          <div 
            style={{ padding: isMobile ? '15px' : '30px', minHeight: '100%' }}
            onClick={() => setSelectedCardId(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
              <div onClick={handleBack} style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #eef2f6' }}><ArrowLeft size={20} color="#64748b" /></div>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Running Projects</h2>
            </div>
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {[
                { name: 'Power Producers', lead: 'Santhosha A', status: 'In Progress', progress: 25 },
                { name: 'Dynamo Testers', lead: 'Rakesh Gowda', status: 'Active', progress: 75 },
                { name: 'Bytes Blasters', lead: 'Sahana N V', status: 'In Progress', progress: 90 },
                { name: 'Brand Stormers', lead: 'Deekshitha M', status: 'In Progress', progress: 84 },
                { name: 'Technical Support', lead: 'Manager', status: 'Active', progress: 80 }
              ].map((p, i) => (
                <motion.div 
                  key={i} 
                  layout
                  onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === p.name ? null : p.name); }}
                  animate={{ 
                    scale: selectedCardId === p.name ? 1.08 : 1,
                    zIndex: selectedCardId === p.name ? 50 : 1,
                    boxShadow: selectedCardId === p.name ? '0 20px 25px -5px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.05)'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '24px', 
                    borderRadius: '24px', 
                    border: '3px solid #bfdbfe',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ fontWeight: '1000', fontSize: '18px', color: '#1e293b' }}>{p.name}</div>
                    <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '5px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{p.status}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '15px' }}>Lead: {p.lead}</div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${p.progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '10px' }}></div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: '950', color: '#3b82f6', marginTop: '8px' }}>{p.progress}% COMPLETE</div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'completed':
        return (
          <div 
            style={{ padding: isMobile ? '15px' : '30px', minHeight: '100%' }}
            onClick={() => setSelectedCardId(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
              <div onClick={handleBack} style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #eef2f6' }}><ArrowLeft size={20} color="#64748b" /></div>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Completed Projects</h2>
            </div>
            <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(450px, 1fr))' }}>
              {[
                { name: 'Quantum Coders', lead: 'Namith Gowda', status: 'Completed' },
                { name: 'JKD Mart', lead: 'Santosh', status: 'Completed' },
                { name: 'Tokens Boy', lead: 'Namith', status: 'Completed' }
              ].map((p, i) => (
                <motion.div 
                  key={i} 
                  layout
                  onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === p.name ? null : p.name); }}
                  animate={{ 
                    scale: selectedCardId === p.name ? 1.08 : 1,
                    zIndex: selectedCardId === p.name ? 50 : 1,
                    boxShadow: selectedCardId === p.name ? '0 20px 25px -5px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.05)'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '40px', 
                    borderRadius: '32px', 
                    border: '4px solid #dcfce7',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontWeight: '1000', fontSize: '24px', color: '#1e293b' }}>{p.name}</div>
                    <div style={{ backgroundColor: '#dcfce7', color: '#10b981', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>{p.status}</div>
                  </div>
                  <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '800' }}>Team Lead: {p.lead}</div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'profile': return <ProfileScreen onBack={handleBack} />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <div style={styles.layout}>
      <header style={styles.topBar}>
        <div 
          style={{ ...styles.topBarLeft, cursor: 'pointer' }} 
          onClick={() => setActiveTab('dashboard')}
          title="Go to Dashboard"
        >
          <img src={logoImg} style={{ height: isMobile ? '70px' : '95px', minWidth: isMobile ? '70px' : '95px', objectFit: 'contain', flexShrink: 0, padding: '4px' }} alt="Logo" />
          <div style={{ ...styles.topBarMainText, marginLeft: isMobile ? '8px' : '12px' }}>NBT HUB</div>
        </div>

        <div style={styles.topBarCenter}>
          {/* Center is now flexible spacing */}
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
        <div style={{ paddingBottom: isMobile ? '20px' : '40px' }}>
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
                  return (
                    <div key={item.id} style={styles.dockItem(isActive)} onClick={() => setActiveTab(item.id)}>
                      <div style={{ position: 'relative' }}>
                        <Icon size={isMobile ? 20 : 22} style={{ strokeWidth: '2.5px' }} />
                        
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
                      <span style={styles.dockText}>{item.label}</span>
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
