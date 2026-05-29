import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const initialCourses = [
  { id: 101, title: 'Security Protocol Compliance', assigned: 145, completed: 120, status: 'Active' },
  { id: 102, title: 'Advanced React Integration', assigned: 45, completed: 40, status: 'Active' },
  { id: 103, title: 'HR Annual Review Gen', assigned: 10, completed: 2, status: 'Active' },
];

export default function CourseManagement({ onBack }) {
  const [courses] = useState(initialCourses);

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' },
    panel: { backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' },
    topActions: { display: 'flex', gap: '12px', marginBottom: '20px' },
    input: { padding: '14px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '15px', flex: 1 },
    button: { backgroundColor: '#a7d6da', color: '#1e293b', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '15px' },
    th: { padding: '16px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 'bold' },
    td: { padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
    progressBg: { width: '200px', backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'inline-block' },
    progressFill: (percent) => ({ width: `${percent}%`, backgroundColor: '#a7d6da', height: '100%' }),
    badge: { color: '#1e293b', backgroundColor: '#a7d6da', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
          {onBack && (
            <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '2px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}><ArrowLeft size={18} color="#0f172a" /></button>
          )}
          <h2 style={{ ...styles.header, marginBottom: 0 }}>Course Management & Compliance</h2>
        </div>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Course ID</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Assigned</th>
                <th style={styles.th}>Completion</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => {
                const percent = Math.round((c.completed / c.assigned) * 100);
                return (
                  <tr key={c.id}>
                    <td style={styles.td}>#{c.id}</td>
                    <td style={{...styles.td, fontWeight: '500'}}>{c.title}</td>
                    <td style={styles.td}>{c.assigned} Users</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.progressBg}>
                          <div style={styles.progressFill(percent)} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{percent}%</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{c.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
