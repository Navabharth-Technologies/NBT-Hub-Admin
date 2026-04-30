import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from './config';

const logData = [
  { id: 1, action: 'HR Manager Access Update', time: '10:45 AM', user: 'Admin01', ip: '192.168.1.10' },
  { id: 2, action: 'Auto-Trigger Suggestion Warning', time: '09:00 AM', user: 'SYSTEM', ip: 'localhost' },
  { id: 3, action: 'Course Assignment Bulk', time: '08:15 AM', user: 'ProjectMgr02', ip: '192.168.1.44' },
  { id: 4, action: 'Failed Login Attempt', time: '03:12 AM', user: 'Unknown', ip: '45.22.11.x' },
];

export default function SystemLogs({ onBack }) {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.SYSTEM_LOGS || `${API_ENDPOINTS.BASE_URL}/api/system-logs`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif' },
    header: { fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' },
    panel: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 'bold' },
    td: { padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontFamily: 'monospace' },
    tag: (user) => ({ 
      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
      backgroundColor: user === 'SYSTEM' ? '#dbeafe' : '#f1f5f9', 
      color: user === 'SYSTEM' ? '#3863A8' : '#64748b' 
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          {onBack && (
            <div 
              onClick={onBack} 
              style={{ cursor: 'pointer', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={20} color="#1e293b" />
            </div>
          )}
          <h2 style={{ ...styles.header, marginBottom: 0 }}>Platform Activity & System Logs</h2>
        </div>
        
        {/* Responsive Toggle: Cards for Mobile, Table for Desktop */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '700' }}>Syncing activity logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '700' }}>No activity logs found.</div>
        ) : (typeof window !== 'undefined' && window.innerWidth < 768) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.map(log => (
              <div key={log.id} style={{ padding: '16px', border: '1.5px solid #eef2f6', borderRadius: '12px', backgroundColor: '#fcfdfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>#{log.id} • {log.time || new Date(log.created_at).toLocaleTimeString()}</span>
                  <span style={styles.tag(log.user || log.userName)}>{log.user || log.userName}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{log.action}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>IP: {log.ip || '0.0.0.0'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Initiator</th>
                  <th style={styles.th}>Action Details</th>
                  <th style={styles.th}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={styles.td}>#{log.id}</td>
                    <td style={styles.td}>{log.time || new Date(log.created_at).toLocaleTimeString()}</td>
                    <td style={styles.td}><span style={styles.tag(log.user || log.userName)}>{log.user || log.userName}</span></td>
                    <td style={{...styles.td, color: '#1e293b', fontWeight: '500'}}>{log.action}</td>
                    <td style={styles.td}>{log.ip || '0.0.0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
