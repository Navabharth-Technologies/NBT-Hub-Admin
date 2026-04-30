import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, LogIn, LogOut, ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from './config';
import { useAuth } from './AuthContext';

export default function AdminAttendanceLogs({ onBack }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 84);
      return d.toISOString().split('T')[0];
    })(),
    end: new Date().toISOString().split('T')[0]
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = user?.token || localStorage.getItem('token') || '';
      
      // Step 1: Attempt global fetch
      const url = `${API_ENDPOINTS.ATTENDANCE_LOGS_GET}?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=2000&userId=all&all=true`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      
      let allLogs = [];
      if (response.ok) {
        const result = await response.json();
        allLogs = result.data || result.attendance || result.logs || (Array.isArray(result) ? result : []);
      }

      // Step 2: Brute Force Fallback if global fetch is empty
      if (allLogs.length === 0) {
        const userRes = await fetch(API_ENDPOINTS.USERS, { headers: { 'Authorization': `Bearer ${token}` } });
        if (userRes.ok) {
          const usersResult = await userRes.json();
          const users = usersResult.data || (Array.isArray(usersResult) ? usersResult : []);
          
          const logPromises = users.slice(0, 40).map(u => {
            const uid = u.Empcode || u.userId || u.id;
            if (!uid || String(u.name).toLowerCase().includes('dinesh')) return null;
            return fetch(`${API_ENDPOINTS.ATTENDANCE_LOGS_GET}?userId=${uid}&startDate=${dateRange.start}&endDate=${dateRange.end}&limit=100`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.ok ? r.json() : null);
          }).filter(Boolean);

          const results = await Promise.all(logPromises);
          results.forEach(res => {
            if (!res) return;
            const data = res.data || res.attendance || res.logs || (Array.isArray(res) ? res : []);
            if (Array.isArray(data)) allLogs = [...allLogs, ...data];
          });
        }
      }

      setLogs(allLogs);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = logs.filter(l => {
    const name = (l.EmployeeName || l.user_name || l.name || '').toLowerCase();
    const id = String(l.Empcode || l.userId || '').toLowerCase();
    const isDinesh = name.includes('dinesh');
    return (name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase())) && !isDinesh;
  });

  const winWidth = window.innerWidth;
  const isMobile = winWidth < 768;

  return (
    <div style={{ padding: isMobile ? '16px' : '32px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: isMobile ? '20px' : '32px' }}>
        <button onClick={onBack} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Attendance Logs</h1>
          <p style={{ margin: 0, color: '#64748B', fontWeight: '600', fontSize: isMobile ? '11px' : '13px' }}>Super Admin Workforce View</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '20px', border: '1.5px solid #F1F5F9' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" placeholder="Search name or ID..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontWeight: '600' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={dateRange.start} onChange={e=>setDateRange(p=>({...p, start:e.target.value}))} style={{ padding: '8px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontWeight: '700' }} />
          <span style={{ fontWeight: '900', color: '#CBD5E1', fontSize: '11px' }}>TO</span>
          <input type="date" value={dateRange.end} onChange={e=>setDateRange(p=>({...p, end:e.target.value}))} style={{ padding: '8px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontWeight: '700' }} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #F1F5F9' }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#94A3B8' }}>EMPLOYEE</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#94A3B8' }}>DATE</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#94A3B8' }}>PUNCH IN</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#94A3B8' }}>PUNCH OUT</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#94A3B8' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '800' }}>Syncing logs for all employees...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '800' }}>No Records Found</td></tr>
            ) : (
              filteredLogs.map((log, i) => {
                const status = (log.status || (log.in_time ? 'P' : 'A')).toUpperCase();
                const isP = status.includes('P');
                const color = isP ? '#10B981' : (status.includes('WO') ? '#3B82F6' : '#EF4444');
                const bg = isP ? '#F0FDF4' : (status.includes('WO') ? '#EFF6FF' : '#FEF2F2');
                return (
                  <tr key={i} style={{ borderBottom: '1.5px solid #F8FAFC' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '900', color: '#0F172A', fontSize: '14px' }}>{log.EmployeeName || log.name}</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700' }}>ID: {log.Empcode || log.userId}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>{log.punch_date || log.date || '--'}</td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '800', color: '#3B82F6' }}><LogIn size={12} /> {log.in_time || '--:--'}</td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}><LogOut size={12} /> {log.out_time || '--:--'}</td>
                    <td style={{ padding: '16px 24px' }}>
                       <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '100px', backgroundColor: bg, color, fontSize: '10px', fontWeight: '900' }}>
                         <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color }}></div>
                         {status}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}