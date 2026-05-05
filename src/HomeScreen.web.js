import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  MessageSquare, 
  Plus, 
  Search, 
  Bell, 
  ChevronRight, 
  BarChart2, 
  Calendar, 
  Gift, 
  ArrowLeft, 
  Clock,
  Layout,
  FileText,
  Target,
  UserCheck,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, BASE_URL } from './config';
import UserManagement from './UserManagement';
import TeamAndProjectOverview from './TeamAndProjectOverview';
import RoleManagement from './RoleManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import CourseManagement from './CourseManagement';
import ThreadModule from './ThreadModule';
import SuggestionDashboard from './SuggestionDashboard';
import SystemLogs from './SystemLogs';
import RewardsModule from './RewardsModule';
import LeaveManagement from './LeaveManagement';
import HolidayListScreen from './HolidayListScreen';
import AttendanceDashboard from './AttendanceDashboard';
import EmployeeAttendanceDetail from './EmployeeAttendanceDetail';
import BirthdayScreen from './BirthdayScreen';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ workforce: 0, running: 0, completed: 0, suggestions: 0 });
  const [calendarItems, setCalendarItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const [showAllHolidays, setShowAllHolidays] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [dashboardSubTab, setDashboardSubTab] = useState(null);
  const isMobile = winWidth < 768;

  useEffect(() => {
    const handleResize = () => {
      setWinWidth(window.innerWidth);
      if (window.innerWidth <= 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

      // Fetch Workforce Count
      const usersRes = await fetch(API_ENDPOINTS.USERS, { headers }).catch(() => null);
      const usersData = usersRes && usersRes.ok ? await usersRes.json().catch(() => []) : [];
      
      // Fetch Teams for Projects
      const teamsRes = await fetch(API_ENDPOINTS.TEAMS, { headers }).catch(() => null);
      const teamsData = teamsRes && teamsRes.ok ? await teamsRes.json().catch(() => []) : [];

      // Fetch Suggestions
      const sugRes = await fetch(API_ENDPOINTS.SUGGESTIONS, { headers }).catch(() => null);
      const sugData = sugRes && sugRes.ok ? await sugRes.json().catch(() => []) : [];
      setSuggestions(Array.isArray(sugData) ? sugData.slice(0, 3) : []);

      // Fetch Holidays & Birthdays
      const calRes = await fetch(API_ENDPOINTS.CALENDAR, { headers }).catch(() => null);
      const calData = calRes && calRes.ok ? await calRes.json().catch(() => []) : [];
      setCalendarItems(Array.isArray(calData) ? calData : []);

      // Synchronize stats
      const runningCount = teamsData.filter(t => (t.status || '').toLowerCase() !== 'completed' && (t.status || '').toLowerCase() !== 'closed').length;
      const completedCount = teamsData.filter(t => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'closed').length;

      setStats({
        workforce: Array.isArray(usersData) ? usersData.length : 0,
        running: runningCount,
        completed: completedCount,
        suggestions: Array.isArray(sugData) ? sugData.length : 0
      });

    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPassed = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return d < today;
  };

  const styles = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', color: '#1e293b', overflow: 'hidden' },
    sidebar: { 
      width: isSidebarOpen ? (isMobile ? '100%' : '280px') : '0px', 
      backgroundColor: '#0B1E3F', 
      height: '100%', 
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      zIndex: 2000,
      position: isMobile ? 'fixed' : 'relative',
      boxShadow: isSidebarOpen ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'
    },
    main: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' },
    header: { 
      height: '80px', 
      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 30px', 
      borderBottom: '1px solid #eef2f6',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    },
    navItem: (active) => ({ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '14px 20px', 
      margin: '4px 15px',
      borderRadius: '12px', 
      cursor: 'pointer', 
      backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: active ? 'white' : '#94a3b8',
      fontWeight: active ? '700' : '500',
      transition: '0.2s'
    }),
    statCard: { 
      backgroundColor: 'white', 
      padding: '24px', 
      borderRadius: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)', 
      border: '1px solid #eef2f6',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    iconWrapper: (color, bg) => ({ 
      width: '48px', 
      height: '48px', 
      borderRadius: '14px', 
      backgroundColor: bg, 
      color: color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexShrink: 0
    }),
    statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statValue: { fontSize: '24px', fontWeight: '900', color: '#1e293b', marginTop: '2px' },
    mainGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' },
    panel: { backgroundColor: 'white', padding: '30px', borderRadius: '32px', border: '1px solid #eef2f6', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    panelTitle: { fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' },
    panelAction: { fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' },
    zoomedPanel: {
      position: 'relative',
      zIndex: 50,
      border: '3px solid #3b82f6',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }
  };

  const renderDashboard = () => (
    <div 
      style={{ padding: isMobile ? '20px' : '40px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}
      onClick={() => setSelectedCardId(null)}
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '1000', color: '#0B1E3F', margin: 0 }}>System Overview</h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontWeight: '500' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div 
          style={styles.statCard} 
          onClick={(e) => { e.stopPropagation(); setActiveTab('users'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#3b82f6', '#eff6ff')}><Users size={18} /></div>
          <div><div style={styles.statLabel}>Employees</div><div style={styles.statValue}>{stats.workforce || 0}</div></div>
        </div>
        <div 
          style={styles.statCard} 
          onClick={(e) => { e.stopPropagation(); setActiveTab('running'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#f59e0b', '#fffbeb')}><Briefcase size={18} /></div>
          <div><div style={styles.statLabel}>Running</div><div style={styles.statValue}>{stats.running || 0}</div></div>
        </div>
        <div 
          style={styles.statCard} 
          onClick={(e) => { e.stopPropagation(); setActiveTab('completed'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#10b981', '#dcfce7')}><CheckSquare size={18} /></div>
          <div><div style={styles.statLabel}>Completed</div><div style={styles.statValue}>{stats.completed || 0}</div></div>
        </div>
        <div 
          style={styles.statCard} 
          onClick={(e) => { e.stopPropagation(); setActiveTab('suggestions'); }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={styles.iconWrapper('#8b5cf6', '#f5f3ff')}><MessageSquare size={18} /></div>
          <div><div style={styles.statLabel}>Suggestions</div><div style={styles.statValue}>{stats.suggestions || 0}</div></div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Birthdays Panel */}
        <motion.div 
          layout
          onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === 'birthdays' ? null : 'birthdays'); }}
          animate={{ scale: selectedCardId === 'birthdays' ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{...styles.panel, display: 'flex', flexDirection: 'column', cursor: 'pointer', ...(selectedCardId === 'birthdays' ? styles.zoomedPanel : {})}}
        >
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
            onClick={(e) => { e.stopPropagation(); setActiveTab('birthdays'); }}
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
        </motion.div>

        {/* Holidays Panel */}
        <motion.div 
          layout
          onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === 'holidays' ? null : 'holidays'); }}
          animate={{ scale: selectedCardId === 'holidays' ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{...styles.panel, display: 'flex', flexDirection: 'column', cursor: 'pointer', ...(selectedCardId === 'holidays' ? styles.zoomedPanel : {})}}
        >
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
            onClick={(e) => { e.stopPropagation(); setActiveTab('holidays'); }}
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
        </motion.div>
      </div>



      <div style={{ ...styles.mainGrid, marginTop: '24px', flex: 1 }}>
        {/* Analytics Panel */}
        <motion.div 
          layout
          onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === 'analytics' ? null : 'analytics'); }}
          animate={{ scale: selectedCardId === 'analytics' ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{...styles.panel, display: 'flex', flexDirection: 'column', cursor: 'pointer', ...(selectedCardId === 'analytics' ? styles.zoomedPanel : {})}}
        >
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
            onClick={(e) => { e.stopPropagation(); setActiveTab('analytics'); }}
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
        </motion.div>

        {/* Suggestions Panel */}
        <motion.div 
          layout
          onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === 'suggestions' ? null : 'suggestions'); }}
          animate={{ scale: selectedCardId === 'suggestions' ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{...styles.panel, display: 'flex', flexDirection: 'column', cursor: 'pointer', ...(selectedCardId === 'suggestions' ? styles.zoomedPanel : {})}}
        >
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
            onClick={(e) => { e.stopPropagation(); setActiveTab('suggestions'); }}
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
        </motion.div>
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
      case 'analytics': return <AnalyticsDashboard onBack={handleBack} />;
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
                  onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === `run-${i}` ? null : `run-${i}`); }}
                  animate={{ 
                    scale: selectedCardId === `run-${i}` ? 1.05 : 1,
                    zIndex: selectedCardId === `run-${i}` ? 50 : 1
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '25px', 
                    borderRadius: '24px', 
                    boxShadow: selectedCardId === `run-${i}` ? '0 30px 60px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.04)', 
                    border: selectedCardId === `run-${i}` ? '3px solid #3b82f6' : '1.5px solid #eef2f6',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1E3F' }}>{p.name}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Lead: {p.lead}</p>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '8px', backgroundColor: p.status === 'Active' ? '#f0fdf4' : '#eff6ff', color: p.status === 'Active' ? '#22c55e' : '#3b82f6', textTransform: 'uppercase' }}>{p.status}</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Overall Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#3b82f6' }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1 }} style={{ height: '100%', backgroundColor: '#3b82f6' }} />
                  </div>
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
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {[
                { name: 'JKD Mart', lead: 'Santhosha A', status: 'Completed', date: '2025-05-15' },
                { name: 'Tokens Boy', lead: 'Namith Gowda', status: 'Completed', date: '2025-04-20' },
                { name: 'Quantum Coders', lead: 'Namith Gowda', status: 'Completed', date: '2025-06-10' }
              ].map((p, i) => (
                <motion.div 
                  key={i} 
                  layout
                  onClick={(e) => { e.stopPropagation(); setSelectedCardId(selectedCardId === `comp-${i}` ? null : `comp-${i}`); }}
                  animate={{ 
                    scale: selectedCardId === `comp-${i}` ? 1.05 : 1,
                    zIndex: selectedCardId === `comp-${i}` ? 50 : 1
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '25px', 
                    borderRadius: '24px', 
                    boxShadow: selectedCardId === `comp-${i}` ? '0 30px 60px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.04)', 
                    border: selectedCardId === `comp-${i}` ? '3px solid #10b981' : '1.5px solid #eef2f6',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1E3F' }}>{p.name}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Team Lead: {p.lead}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#10b981', textTransform: 'uppercase' }}>{p.status}</span>
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>Finished on {p.date}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      default: return renderDashboard();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Layout size={20} />
            </div>
            {isSidebarOpen && <span style={{ color: 'white', fontWeight: '900', fontSize: '18px', letterSpacing: '0.5px' }}>NBT HUB</span>}
          </div>
          {isMobile && <X color="white" onClick={() => setIsSidebarOpen(false)} />}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '20px' }}>
          {[
            { id: 'dashboard', icon: Layout, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'Employees' },
            { id: 'teams', icon: Briefcase, label: 'Teams & Projects' },
            { id: 'attendance', icon: UserCheck, label: 'Attendance' },
            { id: 'leave', icon: Calendar, label: 'Leave Manager' },
            { id: 'prizes', icon: Target, label: 'Rewards' },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' },
            { id: 'suggestions', icon: MessageSquare, label: 'Feedback' },
            { id: 'system_logs', icon: FileText, label: 'Activity Logs' }
          ].map(item => (
            <div key={item.id} style={styles.navItem(activeTab === item.id)} onClick={() => { setActiveTab(item.id); if (isMobile) setIsSidebarOpen(false); }}>
              <item.icon size={20} />
              {isSidebarOpen && item.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={styles.navItem(false)} onClick={() => { logout(); setActiveTab('dashboard'); }}>
            <LogOut size={20} />
            {isSidebarOpen && 'Logout Session'}
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div 
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={20} color="#0B1E3F" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
              <Layout size={24} color="#0B1E3F" />
              <span style={{ fontWeight: '1000', fontSize: '20px', color: '#0B1E3F' }}>ADMIN PANEL</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            {!isMobile && (
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '14px', border: '1.5px solid #eef2f6', outline: 'none', fontSize: '13px', fontWeight: '600' }} placeholder="Quick search..." />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <Bell size={22} color="#0B1E3F" />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '15px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '10px', backgroundColor: '#0B1E3F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900' }}>
                {profileImg ? <img src={profileImg} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} /> : 'S'}
              </div>
              {!isMobile && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0B1E3F' }}>Sinchana H S</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Super Admin</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #3b82f6', borderRadius: '50%' }} />
              <span style={{ fontWeight: '800', color: '#64748b', fontSize: '14px' }}>Loading Admin Console...</span>
            </div>
          ) : renderContent()}
        </div>
      </div>
    </div>
  );
}
