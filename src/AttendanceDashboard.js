import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Calendar, Clock, Search, RefreshCw, 
  UserCheck, FileText, LogOut, MapPin
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, BASE_URL } from './config';

// All employee data is now fetched dynamically from the API.

export default function AttendanceDashboard({ onBack, onNavigate }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: `${new Date().getFullYear()}-01-01`,
    end: new Date().toISOString().split('T')[0]
  });
  
  const [metrics, setMetrics] = useState({ present: 0, absent: 0, halfDay: 0, totalLeaves: 0, totalLogs: 0 });
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [systemLogs, setSystemLogs] = useState([]);
  const [showSystemLogs, setShowSystemLogs] = useState(false);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [...prev.slice(-49), { msg, type, time }]);
    if (type === 'error') console.error(`[System] ${msg}`);
    else console.log(`[System] ${msg}`);
  };

  const searchRef = React.useRef(null);
  const dateRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchWorkforceAttendance();
  }, [dateRange]);

  const fetchWorkforceAttendance = async () => {
    addLog(`Fetching attendance for range: ${JSON.stringify(dateRange)}`);
    setLoading(true);
    try {
      // Get the real token - parse navAuthUser (super admin's stored session)
      let token = null;
      try {
        const saved = localStorage.getItem('navAuthUser');
        if (saved) token = JSON.parse(saved).token;
      } catch(e) {}
      // Fallbacks
      if (!token) token = user?.token;
      const cleanToken = String(token || localStorage.getItem('token') || '').trim();

      const headers = { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': cleanToken && cleanToken !== 'undefined' && cleanToken !== 'null' ? `Bearer ${cleanToken}` : ''
      };

      if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') {
        addLog('No auth token found. Please re-login.', 'error');
        setLoading(false);
        return;
      }


      const BASE = BASE_URL; // Use global config BASE_URL instead of hardcoded IP

      // Step 1: Get all users (email + name) for mapping, skip Dinesh
      let usersMap = {};
      try {
        const res = await fetch(`${BASE}/api/users`, { headers });
        if (res.ok) {
          const result = await res.json();
          const all = Array.isArray(result) ? result : (result.data || result.users || []);
          all.forEach(u => {
            if (!(u.name || '').toLowerCase().includes('dinesh')) {
              usersMap[String(u.id)] = u;
              usersMap[String(u.employee_id || u.Empcode || '')] = u;
            }
          });
          addLog(`Mapped ${Object.keys(usersMap).length} users for display`);
          setEmployees(Object.values(usersMap));
        }
      } catch (e) { addLog('Users fetch failed', 'error'); }

      // Step 2: Consolidated Backend Fetch: Get everything from the official attendance_logs table
      let allLogs = [];
      const today = new Date().toISOString().split('T')[0];
      let resData = {};
      try {
        const fetchUrl = `${BASE}/api/attendance_logs?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=5000`;
        const res = await fetch(fetchUrl, { headers });
        if (res.ok) {
          resData = await res.json();
          allLogs = Array.isArray(resData) ? resData : (resData.data || resData.logs || resData.attendance || []);
        }
      } catch (e) {
        console.error('Backend Fetch Error:', e);
      }

      // Deduplicate by user_id + punch_date
      const uniqueLogs = [];
      const seen = new Set();
      allLogs.forEach(log => {
        const date = (log.punch_date || log.date || '').split('T')[0].split(' ')[0];
        const uid = log.user_id || log.userId || log.Empcode;
        const key = `${uid}-${date}`;
        if (date && uid && !seen.has(key)) {
          seen.add(key);
          uniqueLogs.push(log);
        }
      });
      allLogs = uniqueLogs;







      const calculateWorkHours = (inT, outT) => {
        if (!inT || !outT || inT === '--:--' || outT === '--:--' || inT === '----' || outT === '----') return '00:00';
        try {
          const [inH, inM] = inT.split(':').map(Number);
          const [outH, outM] = outT.split(':').map(Number);
          let diff = (outH * 60 + outM) - (inH * 60 + inM);
          if (diff < 0) diff += 1440; // Handle overnight shifts
          const h = Math.floor(diff / 60).toString().padStart(2, '0');
          const m = (diff % 60).toString().padStart(2, '0');
          return `${h}:${m}`;
        } catch (e) { return '00:00'; }
      };

      // Step 3: Map exact DB column names to UI fields
      // DB schema: user_id, punch_date, in_time, out_time, work_time, status, remark, punchin_location, punchout_location
      const mapped = allLogs.map(log => {
        const uid = String(log.user_id || log.userId || log.Empcode || '');
        const userInfo = usersMap[uid] || {};
        const name = userInfo.name || userInfo.EmployeeName || userInfo.employee_name || log.name || log.user_name || `Employee ${uid}`;
        
        // Exact DB Mapping from screenshot
        return {
          ...log,
          EmployeeName: name,
          Empcode: log.user_id || log.userId || log.Empcode || uid,
          punch_date: log.punch_date || log.date || '',
          in_time: log.in_time || log.punch_in || log.check_in || '--:--',
          out_time: log.out_time || log.punch_out || log.check_out || '--:--',
          work_hrs: log.work_time || log.work_hours || log.total_time || log.duration || calculateWorkHours(log.in_time || log.punch_in, log.out_time || log.punch_out) || '00:00',
          punch_in_location: log.punchin_location || log.punch_in_location || log.check_in_location || '',
          punch_out_location: log.punchout_location || log.punch_out_location || log.check_out_location || '',
          status: (log.status || (log.in_time && log.in_time !== '--:--' ? 'P' : 'A')).toUpperCase(),
          remark: log.remark || ''
        };
      });

      // Filter by selected date range on frontend as backup
      const filtered = mapped.filter(log => {
        if (!log.punch_date) return true;
        const d = log.punch_date.split('T')[0].split(' ')[0];
        return (!dateRange.start || d >= dateRange.start) && (!dateRange.end || d <= dateRange.end);
      });

      // Final sorting: Today first, then by ID (20250 to 202521)
      filtered.sort((a, b) => {
        const dateA = new Date(a.punch_date || a.date);
        const dateB = new Date(b.punch_date || b.date);
        
        // Sort by date descending (Today first)
        const dateDiff = dateB - dateA;
        if (dateDiff !== 0) return dateDiff;
        
        // Then sort by ID ascending (20250, 20251, ...)
        const idA = parseInt(a.user_id || a.Empcode || 0);
        const idB = parseInt(b.user_id || b.Empcode || 0);
        return idA - idB;
      });

      addLog(`Final logs after filter & sort: ${filtered.length}`);

      setLogs(mapped);
      calculateMetrics(mapped, resData);
    } catch (error) {
      addLog(`Error fetching attendance: ${error.message}`, 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };


  const calculateMetrics = (data, apiData = {}) => {
    const stats = { 
      present: apiData.presentCount || apiData.present || 0, 
      absent: apiData.absentCount || apiData.leaves || apiData.absent || 0, 
      halfDay: apiData.halfDayCount || apiData.halfDay || 0, 
      totalLeaves: 0, 
      totalLogs: apiData.totalCount || apiData.totalLogs || data.length 
    };

    // If backend didn't provide counts, calculate from logs
    if (!stats.present && !stats.absent && !stats.halfDay) {
      data.forEach(log => {
        const status = (log.status || (log.in_time && log.in_time !== '--:--' ? 'P' : 'A')).toUpperCase();
        if (status === 'P' || status === 'PRESENT') stats.present++;
        if (status === 'A' || status === 'ABSENT') stats.absent++;
        if (status === 'HD' || status === 'HALF DAY' || status === 'HALF-DAY') stats.halfDay++;
      });
    }
    setMetrics(stats);
  };

  const filteredLogs = logs.filter(log => {
    const name = (log.EmployeeName || log.name || '').toLowerCase();
    const id = String(log.Empcode || log.user_id || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    // Always exclude Dinesh (Founder & CEO)
    if (name.includes('dinesh')) return false;
    return !search || name.includes(search) || id.includes(search);
  });


  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Workforce Attendance Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.start} TO ${dateRange.end}`, 14, 22);

    const tableColumn = ["Employee", "ID", "Date", "In Time", "Out Time", "Work Hrs", "Status"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const status = (log.status || (log.in_time ? 'P' : 'A')).toUpperCase();
      const rowData = [
        log.EmployeeName || log.name || log.userName || '-',
        log.Empcode || log.userId || log.employee_id || '-',
        log.punch_date || log.date || '-',
        log.in_time || log.punch_in || log.check_in || '--:--',
        log.out_time || log.punch_out || log.check_out || '--:--',
        log.work_hrs || log.work_time || log.work_hours || '00:00',
        status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [11, 30, 63] }
    });

    doc.save(`Attendance_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const tableColumn = ["Employee", "ID", "Date", "In Time", "Out Time", "Work Hrs", "Status"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const status = (log.status || (log.in_time ? 'P' : 'A')).toUpperCase();
      const rowData = [
        `"${(log.EmployeeName || log.name || log.userName || '-').replace(/"/g, '""')}"`,
        `"${(log.Empcode || log.userId || log.employee_id || '-').toString().replace(/"/g, '""')}"`,
        `"${(log.punch_date || log.date || '-').replace(/"/g, '""')}"`,
        `"${(log.in_time || log.punch_in || log.check_in || '--:--').replace(/"/g, '""')}"`,
        `"${(log.out_time || log.punch_out || log.check_out || '--:--').replace(/"/g, '""')}"`,
        `"${(log.work_hrs || log.work_time || log.work_hours || '00:00').replace(/"/g, '""')}"`,
        `"${status.replace(/"/g, '""')}"`
      ];
      tableRows.push(rowData.join(','));
    });

    const csvContent = tableColumn.join(',') + '\n' + tableRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_Report_${dateRange.start}_to_${dateRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const formatLongDate = (dateStr) => {
    if (!dateStr || dateStr === '--') return '--';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
    } catch(e) { return dateStr; }
  };

  const isMobile = winWidth < 768;

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" },
    main: { flex: 1, padding: isMobile ? '16px 12px' : '24px 40px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    headerRow: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '24px', gap: '20px' },
    titleSection: { display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px', flexDirection: isMobile ? 'column' : 'row' },
    backBtn: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    title: { fontSize: isMobile ? '20px' : '24px', fontWeight: '900', color: '#0B1E3F', margin: 0, lineHeight: 1.2 },
    subTitle: { fontSize: isMobile ? '11px' : '13px', color: '#64748B', fontWeight: '600', marginTop: '6px' },
    controls: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' },
    searchWrapper: { position: 'relative', width: isMobile ? '100%' : '300px' },
    searchInput: { width: '100%', padding: '10px 16px 10px 40px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontSize: '13px', fontWeight: '600', outline: 'none' },
    datePicker: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '0 12px', height: '40px' },
    dateInput: { border: 'none', backgroundColor: 'transparent', fontSize: '12px', fontWeight: '700', color: '#0B1E3F', outline: 'none' },
    iconBtn: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    exportBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '40px', backgroundColor: '#0B1E3F', color: 'white', borderRadius: '12px', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer' },
    
    punchCard: { backgroundColor: 'white', borderRadius: '24px', padding: '24px 32px', marginBottom: '24px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
    punchInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
    locationIcon: { width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0EA5E9' },
    punchStatus: { fontSize: '18px', fontWeight: '900', color: '#0B1E3F', marginBottom: '4px' },
    locationText: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
    punchBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: '#F43F5E', color: 'white', borderRadius: '16px', fontWeight: '800', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(244, 63, 94, 0.3)' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' },
    statCard: { backgroundColor: 'white', padding: '20px 24px', borderRadius: '20px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '16px' },
    statIcon: (bg, color) => ({ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    statLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statValue: { fontSize: '24px', fontWeight: '900', color: '#0B1E3F' },

    tableSection: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #F1F5F9', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
    tableHeader: { display: 'flex', gap: '32px', marginBottom: '24px', alignItems: 'center' },
    tableHeaderItem: { display: 'flex', alignItems: 'center', gap: '10px' },
    tableTitle: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    tableValue: { fontSize: '16px', fontWeight: '900', color: '#0B1E3F' },

    table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
    th: { textAlign: 'left', padding: isMobile ? '12px 16px' : '16px 24px', fontSize: isMobile ? '9px' : '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' },
    td: { padding: '20px 12px', borderBottom: '1px solid #F8FAFC' },
    empCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: '900', fontSize: '12px', objectFit: 'cover' },
    empName: { fontSize: '13px', fontWeight: '800', color: '#0B1E3F' },
    empRole: { fontSize: '10px', color: '#94A3B8', fontWeight: '700', marginTop: '1px' },
    dateText: { fontSize: '13px', fontWeight: '700', color: '#475569' },
    timeIn: { fontSize: '13px', fontWeight: '800', color: '#0EA5E9', display: 'flex', alignItems: 'center', gap: '6px' },
    timeOut: { fontSize: '13px', fontWeight: '700', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' },
    workHrs: { fontSize: '13px', fontWeight: '800', color: '#0B1E3F' },
    statusBadge: (bg, color) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: bg, color: color, fontSize: '10px', fontWeight: '900' }),
    auditLocation: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', fontWeight: '600' },
    
    // New Button Styles
    filterBtn: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '10px 20px', 
      backgroundColor: 'white', 
      border: '1.5px solid #E2E8F0', 
      borderRadius: '12px', 
      fontSize: isMobile ? '12px' : '14px', 
      fontWeight: '700', 
      color: '#64748B', 
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    workforceBtn: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: isMobile ? '8px 16px' : '10px 24px', 
      backgroundColor: '#0F172A', 
      color: 'white', 
      border: 'none', 
      borderRadius: '14px', 
      fontSize: isMobile ? '12px' : '13px', 
      fontWeight: '800', 
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
      minWidth: isMobile ? '120px' : '160px',
      lineHeight: '1.2'
    }
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        
        {/* New Tabbed Header from Screenshot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          {onBack && (
            <div 
              onClick={onBack} 
              style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eef2f6' }}
            >
              <ArrowLeft size={20} color="#64748b" />
            </div>
          )}
          <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '800', color: '#2563EB', borderBottom: '2.5px solid #2563EB', paddingBottom: '10px', cursor: 'pointer' }}>Attendance Logs</div>
        </div>

        {/* Header Row with Search and Filters */}
        <div style={{ ...styles.headerRow, marginBottom: '24px' }}>
          <div style={{ ...styles.searchWrapper, width: isMobile ? '100%' : '350px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              ref={searchRef}
              type="text" 
              placeholder="Search employee, role or department..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
          </div>

          <div style={styles.controls}>
            <button 
              onClick={fetchWorkforceAttendance}
              style={{ ...styles.iconBtn, border: '1px solid #E2E8F0', color: '#64748B' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div style={styles.datePicker}>
              <Calendar size={14} color="#94A3B8" />
              <input ref={dateRef} type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} style={styles.dateInput} />
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>TO</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} style={styles.dateInput} />
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)} style={{ ...styles.exportBtn, backgroundColor: '#0F172A', padding: '0 20px' }}>
                <Download size={16} /> Export
              </button>
              {showExportMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', padding: '8px', zIndex: 1000, width: '150px' }}>
                  <div onClick={exportToExcel} style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#0F172A', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Excel Sheet (CSV)
                  </div>
                  <div onClick={exportToPDF} style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#0F172A', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    PDF Document
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Clean Table Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1.5px solid #F1F5F9', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
          <table style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #F8FAFC' }}>
                <th style={{ ...styles.th, width: '22%', padding: '20px 16px', paddingLeft: '60px' }}>EMPLOYEE</th>
                <th style={{ ...styles.th, width: '10%', padding: '20px 16px' }}>EMPLOYEE ID</th>
                <th style={{ ...styles.th, width: '15%', padding: '20px 16px', paddingLeft: '38px' }}>DATE</th>
                <th style={{ ...styles.th, width: '10%', padding: '20px 16px', paddingLeft: '38px' }}>PUNCH IN</th>
                <th style={{ ...styles.th, width: '10%', padding: '20px 16px', paddingLeft: '38px' }}>PUNCH OUT</th>
                <th style={{ ...styles.th, width: '10%', padding: '20px 16px' }}>WORK HRS</th>
                <th style={{ ...styles.th, width: '8%', padding: '20px 16px', textAlign: 'center' }}>STATUS</th>
                <th style={{ ...styles.th, width: '15%', padding: '20px 16px', paddingLeft: '38px' }}>AUDIT LOCATION</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredLogs.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '700' }}>Synchronizing record history...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '700' }}>No history found for the selected period.</td></tr>
              ) : (
                filteredLogs.map((log, i) => {
                  const inT = log.in_time || log.punch_in;
                  const isValidPunch = inT && inT !== '--:--';
                  const status = isValidPunch ? 'P' : 'A';
                  const isP = status === 'P';
                  const color = isP ? '#10B981' : '#EF4444';
                  const bg = isP ? '#F0FDF4' : '#FEF2F2';
                  
                  return (
                    <tr 
                      key={i} 
                      onClick={() => onNavigate('attendance_detail', { id: log.Empcode || log.user_id, name: log.EmployeeName })}
                      style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ ...styles.td, padding: '16px' }}>
                        <div style={styles.empCell}>
                          {log.profile_pic ? (
                            <img src={log.profile_pic} style={styles.avatar} alt="" />
                          ) : (
                            <div style={styles.avatar}>{(log.EmployeeName || 'E').charAt(0)}</div>
                          )}
                          <div>
                            <div style={{ ...styles.empName, color: '#2563EB', textDecoration: 'underline', textUnderlineOffset: '3px', whiteSpace: 'nowrap' }}>
                              {log.EmployeeName}
                            </div>
                            <div style={styles.empRole}>{log.role || log.designation || log.department || 'Team Member'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...styles.td, padding: '16px', fontWeight: '800', color: '#64748B', fontSize: '13px' }}>
                        {log.user_id || log.Empcode}
                      </td>
                      <td style={{ ...styles.td, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <Calendar size={14} color="#CBD5E1" />
                          {formatLongDate(log.punch_date || log.date)}
                        </div>
                      </td>
                      <td style={{ ...styles.td, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3B82F6', fontWeight: '800', fontSize: '13px' }}>
                          <Clock size={14} color="#3B82F6" />
                          {log.in_time || log.punch_in || '--:--'}
                        </div>
                      </td>
                      <td style={{ ...styles.td, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700', fontSize: '13px' }}>
                          <Clock size={14} color="#CBD5E1" />
                          {log.out_time || log.punch_out || '--:--'}
                        </div>
                      </td>
                      <td style={{ ...styles.td, padding: '16px', fontWeight: '900', color: '#0F172A', fontSize: '13px' }}>
                        {log.work_hrs || '0:00'}<br/><span style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase' }}>HOURS</span>
                      </td>
                      <td style={{ ...styles.td, padding: '16px', textAlign: 'center' }}>
                        <div style={{ ...styles.statusBadge(bg, color), padding: '4px 10px', display: 'inline-flex' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color }}></div>
                          {status}
                        </div>
                      </td>
                      <td style={{ ...styles.td, padding: '16px', color: '#64748B', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color="#CBD5E1" />
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(log.punch_in_location || log.punch_out_location || 'NAVABHARATH TECHNOLOGIES')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#64748B', textDecoration: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.punch_in_location || log.punch_out_location || 'Office Zone'}
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
