import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  RefreshCw, 
  FileText,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, BASE_URL } from './config';

export default function EmployeeAttendanceDetail({ employeeId, employeeName, onBack }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = employeeId || paramId;
  
  const [employee, setEmployee] = useState(employeeName ? { name: employeeName } : null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, [id, user, startDate, endDate]);

  const calculateWorkHours = (inT, outT) => {
    if (!inT || !outT || inT === '----' || outT === '----') return '00:00';
    try {
      const [h1, m1] = inT.split(':').map(Number);
      const [h2, m2] = outT.split(':').map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff <= 0) return '00:00';
      return `${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`;
    } catch(e) { return '00:00'; }
  };

  const fetchData = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      setError(null);

      const storedUser = JSON.parse(localStorage.getItem('navAuthUser') || '{}');
      const token = storedUser.token || localStorage.getItem('token') || user?.token;
      const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const BASE = BASE_URL || 'http://192.168.1.3:5000';

      // Fetch employee info if we have an ID
      if (id) {
        try {
          const userRes = await fetch(`${BASE}/api/users`, { headers });
          if (userRes.ok) {
            const users = await userRes.json();
            const validUsers = Array.isArray(users) ? users : (users?.data || []);
            const found = validUsers.find(u => String(u.id) === String(id) || String(u.Empcode) === String(id) || String(u.employee_id) === String(id));
            if (found) setEmployee(found);
          }
        } catch(e) { console.error('User fetch error:', e); }
      }

      let allLogs = [];
      // Sanitize ID to remove legacy suffixes like ':1'
      const uid = String(id || '').split(':')[0].trim().toLowerCase();

      // Strategy 0: Unified Local Database Fetch (Primary)
      const fetchUrls = [
        `${BASE}/api/attendance_logs?startDate=${startDate}&endDate=${endDate}&limit=5000`,
        `${BASE}/api/attendance_logs?userId=${id}&limit=5000`,
        `${BASE}/api/attendance?userId=${id}&startDate=${startDate}&endDate=${endDate}`
      ];

      for (const url of fetchUrls) {
        try {
          console.log(`📡 Fetching from local DB: ${url}`);
          const res = await fetch(url, { headers });
          if (res.ok) {
            const result = await res.json();
            const data = Array.isArray(result) ? result : (result.data || result.logs || result.attendance || []);
            
            const matched = data.filter(l => {
              const logEmpCode = String(l.Empcode || '').trim().toLowerCase();
              const logUserId = String(l.userId || l.user_id || '').trim().toLowerCase();
              const logName = (l.EmployeeName || l.name || '').toLowerCase().trim();
              const targetName = (employee?.name || '').toLowerCase().trim();
              return (uid && (logEmpCode === uid || logUserId === uid || logEmpCode.includes(uid) || logUserId.includes(uid))) ||
                     (targetName && logName && (logName.includes(targetName) || targetName.includes(logName)));
            });

            if (matched.length > 0) {
              console.log(`✅ Local DB Success: Found ${matched.length} logs`);
              allLogs = matched;
              break;
            }
          }
        } catch (e) { console.error('Local Fetch Error:', e); }
      }

      // If employee profile wasn't found earlier, try to extract it from the first log found
      if ((!employee || !employee.name) && allLogs.length > 0) {
        const first = allLogs[0];
        setEmployee({
          name: first.EmployeeName || first.name || employeeName || `Staff ${uid}`,
          Empcode: first.Empcode || first.userId || uid,
          role: first.role || first.remark || 'Team Member'
        });
      }

      // ✅ Group by employee + date
      const grouped = {};
      allLogs.forEach(l => {
        const dateStr = String(l.punch_date || l.date || '').split('T')[0].split(' ')[0];
        if (!dateStr) return;
        
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(l);
      });

      const processed = Object.keys(grouped).map(key => {
        const dayPunches = grouped[key].sort((a,b) => String(a.in_time || '00:00').localeCompare(String(b.in_time || '00:00')));
        const first = dayPunches[0];
        const last = dayPunches[dayPunches.length - 1];
        const isSunday = new Date(dayPunches[0].punch_date || dayPunches[0].date).getDay() === 0;
        
        // Use exact DB fields from screenshot
        const inTime = first.in_time || '----';
        const outTime = dayPunches.length > 1 ? (last.out_time || last.in_time || '----') : (first.out_time || '----');
        const workTime = first.work_time || last.work_time || calculateWorkHours(inTime, outTime);
        const remark = first.remark || last.remark || '';
        const inLoc = first.punchin_location || 'Biometric Terminal';
        const outLoc = last.punchout_location || 'Biometric Terminal';
        
        return {
          ...first,
          employeeName: first.EmployeeName || first.name || employee?.name || "Unknown",
          employeeId: first.user_id || first.Empcode || first.userId || id,
          date: key,
          in_time: inTime,
          out_time: outTime,
          work_hrs: workTime,
          status: first.status || (isSunday ? 'WO' : (inTime !== '----' ? 'P' : 'A')),
          remark: remark,
          punchin_location: inLoc,
          punchout_location: outLoc
        };
      }).sort((a,b) => b.date.localeCompare(a.date));

      setLogs(processed);
    } catch (err) {
      console.error(err);
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { backgroundColor: '#F0F4F8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
    main: { padding: winWidth < 768 ? '20px' : '40px', maxWidth: '1400px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    profileSection: { display: 'flex', alignItems: 'center', gap: '16px' },
    backBtn: { width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1e293b' },
    empName: { fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: 0 },
    empMeta: { fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '2px' },
    statsRow: { display: 'flex', gap: '16px', marginBottom: '32px' },
    statBox: { background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' },
    statLabel: { fontSize: '9px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statValue: { fontSize: '13px', fontWeight: '900', color: '#0F172A' },
    tableCard: { background: 'white', borderRadius: '24px', border: '1.5px solid #F1F5F9', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '20px 24px', fontSize: '10px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #F1F5F9' },
    td: { padding: '18px 24px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #F1F5F9' },
    statusBadge: (bg, color) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '100px', background: bg, color, fontSize: '10px', fontWeight: '900' }),
    statusDot: (bg) => ({ width: '5px', height: '5px', borderRadius: '50%', background: bg })
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div style={styles.profileSection}>
            <button style={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /></button>
            <div>
              <h1 style={{ ...styles.empName, fontSize: '28px' }}>{id ? (employee?.name || 'Employee') : 'Workforce'} Dashboard</h1>
              <p style={{ ...styles.empMeta, fontSize: '13px' }}>
                ID: #{id || 'N/A'} <span style={{ margin: '0 8px', color: '#CBD5E1' }}>•</span> 
                Biometric Syncing: <span style={{ color: '#10B981', fontWeight: '800' }}>Operational</span>
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '2px 8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
               <Calendar size={14} style={{ margin: 'auto 8px', color: '#94A3B8' }} />
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', fontSize: '12px', fontWeight: '700', padding: '10px 4px', outline: 'none' }} />
               <span style={{ margin: 'auto 8px', color: '#CBD5E1', fontSize: '10px', fontWeight: '800' }}>TO</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', fontSize: '12px', fontWeight: '700', padding: '10px 4px', outline: 'none' }} />
            </div>
            <button style={styles.backBtn} onClick={fetchData}><RefreshCw size={14} /></button>
            <button style={{ background: '#0F172A', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)' }}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div style={{ ...styles.statsRow, marginBottom: '40px' }}>
          <div style={{ ...styles.statBox, padding: '16px 24px', borderRadius: '16px' }}>
            <div style={{ backgroundColor: '#F0FDF4', padding: '8px', borderRadius: '10px' }}><FileText size={18} color="#10B981" /></div>
            <div>
              <div style={styles.statLabel}>TOTAL LOGS</div>
              <div style={{ ...styles.statValue, fontSize: '18px' }}>{logs.length}</div>
            </div>
          </div>
          <div style={{ ...styles.statBox, padding: '16px 24px', borderRadius: '16px' }}>
            <div style={{ backgroundColor: '#EFF6FF', padding: '8px', borderRadius: '10px' }}><ShieldCheck size={18} color="#3B82F6" /></div>
            <div>
              <div style={styles.statLabel}>VERIFIED BY</div>
              <div style={{ ...styles.statValue, fontSize: '18px' }}>Biometrics API</div>
            </div>
          </div>
        </div>

        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>EMPLOYEE</th>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}>IN TIME</th>
                <th style={styles.th}>OUT TIME</th>
                <th style={styles.th}>WORK HRS</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>REMARK</th>
                <th style={styles.th}>IN LOCATION</th>
                <th style={styles.th}>OUT LOCATION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '700' }}>Synchronizing record history...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '700' }}>No history found for the selected period.</td></tr>
              ) : logs.map((log, i) => {
                const status = (log.status || (log.in_time !== '----' ? 'P' : 'A')).toUpperCase();
                const color = status.includes('P') ? '#10B981' : (status.includes('WO') ? '#3B82F6' : '#EF4444');
                const bg = status.includes('P') ? '#F0FDF4' : (status.includes('WO') ? '#EFF6FF' : '#FEF2F2');

                return (
                  <tr key={i}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: '#475569' }}>
                          {(log.employeeName || 'E').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '900', color: '#0F172A', fontSize: '13px' }}>{log.employeeName}</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700' }}>ID: {log.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700' }}>
                        <Calendar size={14} color="#CBD5E1" />
                        {log.date}
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: '#3B82F6', fontWeight: '800' }}>{log.in_time}</td>
                    <td style={{ ...styles.td, color: '#64748B', fontWeight: '700' }}>{log.out_time}</td>
                    <td style={{ ...styles.td, fontWeight: '900', color: '#0F172A' }}>{log.work_hrs} <span style={{ fontSize: '9px', color: '#94A3B8' }}>HOURS</span></td>
                    <td style={styles.td}>
                      <div style={styles.statusBadge(bg, color)}>
                        <div style={styles.statusDot(color)}></div>
                        {status}
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: '#64748B', fontWeight: '700', fontSize: '11px' }}>{log.remark || '---'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                        <MapPin size={14} />
                        {log.punchin_location || 'Office'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                        <MapPin size={14} />
                        {log.punchout_location || 'Office'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}