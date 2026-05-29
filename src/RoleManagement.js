import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const rolesData = [
  { id: 1, name: 'HR', permissions: ['manage_users', 'view_reports'] },
  { id: 2, name: 'Team Lead', permissions: ['view_team', 'assign_courses'] },
  { id: 3, name: 'Employee', permissions: ['view_self', 'take_courses'] }
];

const allPerms = ['manage_users', 'view_reports', 'edit_roles', 'delete_records', 'view_team', 'assign_courses', 'take_courses'];



export default function RoleManagement({ onBack }) {
  const [roles, setRoles] = useState(rolesData);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winWidth < 768;

  const togglePerm = (roleId, perm) => {
    setRoles(roles.map(r => {
      if (r.id === roleId) {
        const hasPerm = r.permissions.includes(perm);
        return { ...r, permissions: hasPerm ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm] };
      }
      return r;
    }));
  };

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', padding: isMobile ? '10px' : '20px' },
    header: { fontSize: isMobile ? '20px' : '24px', fontWeight: '900', marginBottom: '24px', color: '#1e293b' },
    panel: { backgroundColor: 'white', borderRadius: '15px', padding: isMobile ? '15px' : '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', marginBottom: '24px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '15px 12px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    td: { padding: '15px 12px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
    
    // MOBILE CARD STYLES
    roleCard: { backgroundColor: '#f8fafc', borderRadius: '15px', padding: '18px', marginBottom: '20px', border: '1px solid #eef2f6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
    roleName: { fontSize: '18px', fontWeight: '900', color: '#3863A8', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    permGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' },
    permItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: active ? '#3863A8' : 'white', border: `1.5px solid ${active ? '#3863A8' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: active ? '0 4px 12px rgba(56, 99, 168, 0.2)' : 'none' }),
    permLabel: (active) => ({ fontSize: '11px', fontWeight: '800', color: active ? 'white' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }),
    
    checkbox: { cursor: 'pointer', accentColor: '#3863A8', width: '18px', height: '18px' },
    deleteBtn: { backgroundColor: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
          {onBack && (
            <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '2px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}><ArrowLeft size={18} color="#0f172a" /></button>
          )}
          <h2 style={{ ...styles.header, marginBottom: 0 }}>Role & Access Control</h2>
        </div>
        
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {roles.map(r => (
              <div key={r.id} style={styles.roleCard}>
                <div style={styles.roleName}>
                  <span>{r.name}</span>
                  <button style={styles.deleteBtn}>Delete</button>
                </div>
                <div style={styles.permGrid}>
                  {allPerms.map(p => {
                    const active = r.permissions.includes(p);
                    return (
                      <div key={p} style={styles.permItem(active)} onClick={() => togglePerm(r.id, p)}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: active ? 'white' : '#cbd5e1' }} />
                        <span style={styles.permLabel(active)}>{p.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Role Name</th>
                  {allPerms.map(p => <th key={p} style={{ ...styles.th, textAlign: 'center' }} title={p}>{p.replace('_', ' ').toUpperCase()}</th>)}
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...styles.td, fontWeight: '800', fontSize: '14px' }}>{r.name}</td>
                    {allPerms.map(p => (
                      <td key={p} style={{ ...styles.td, textAlign: 'center' }}>
                        <input type="checkbox" style={styles.checkbox} checked={r.permissions.includes(p)} onChange={() => togglePerm(r.id, p)} />
                      </td>
                    ))}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                       <button style={styles.deleteBtn}>Delete</button>
                    </td>
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
