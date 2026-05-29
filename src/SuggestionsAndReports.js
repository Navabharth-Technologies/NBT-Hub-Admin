import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const initialSuggestions = [
  { id: 1, user: 'Santhosha A Doddamallappanavara', content: 'Need better dual monitors.', date: '2026-03-24', status: 'Pending' },
  { id: 2, user: 'Aishwarya K', content: 'Weekly syncs could be shorter.', date: '2026-03-23', status: 'Resolved' },
];

const initialHistory = [
  { id: 101, user: 'Namith Gowda', type: 'Warning', reason: 'Missed Weekly Suggestion', date: '2026-03-21' }
];

export default function SuggestionsAndReports({ onBack }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [history, setHistory] = useState(initialHistory);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [isSaturday, setIsSaturday] = useState(false);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    const todayDay = new Date().getDay();
    if (todayDay === 6) setIsSaturday(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winWidth < 768;

  const generateWeeklyReport = () => {
    alert("Generating Weekly Employee Performance and Suggestions Summary...");
  };

  const markResolved = (id) => {
    setSuggestions(suggestions.map(s => s.id === id ? { ...s, status: 'Resolved' } : s));
  };

  const styles = {
    container: { 
      fontFamily: 'system-ui, sans-serif', 
      padding: isMobile ? '20px 15px' : '30px 40px',
      marginTop: isMobile ? '0' : '10px'
    },
    header: { fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' },
    grid: { 
      display: 'grid', 
      gridTemplateColumns: winWidth < 1024 ? '1fr' : '2fr 1fr', 
      gap: '24px' 
    },
    panel: { backgroundColor: 'white', borderRadius: '16px', padding: isMobile ? '16px' : '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)', height: 'fit-content', border: '1px solid #e2e8f0' },
    title: { fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' },
    suggestionCard: (index) => ({ 
      border: '1.5px solid ' + (index % 2 === 0 ? '#a7d6da60' : '#e2e8f0'), 
      padding: '24px', 
      borderRadius: '20px', 
      backgroundColor: index % 2 === 0 ? '#f0fafa' : '#ffffff', 
      marginBottom: '20px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
    }),
    historyItem: { borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px', fontSize: '13px' },
    btnResolved: { backgroundColor: '#a7d6da', color: '#1e293b', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px', transition: '0.2s' },
    badge: (status) => ({ 
      color: status === 'Resolved' ? '#059669' : '#64748b', 
      backgroundColor: status === 'Resolved' ? '#d1fae5' : '#f1f5f9', 
      fontSize: '11px', 
      fontWeight: 'bold', 
      padding: '6px 10px', 
      borderRadius: '8px' 
    })
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        {onBack && (
          <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '2px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}><ArrowLeft size={18} color="#0f172a" /></button>
        )}
        <h2 style={{ ...styles.header, marginBottom: 0 }}>Suggestions & Reporting Engine</h2>
      </div>
      <div style={styles.grid}>
        
        <div style={styles.panel}>
          <div style={{...styles.title, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '10px'}}>
            All Suggestions
            {isSaturday && (
              <button onClick={generateWeeklyReport} style={{backgroundColor: '#a7d6da', color: '#1e293b', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'}}>
                Generate Weekly Report
              </button>
            )}
          </div>
          {suggestions.map((s, index) => (
            <div key={s.id} style={styles.suggestionCard(index)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>{s.user}</span>
                <span style={styles.badge(s.status)}>{s.status}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{s.content}</div>
              {s.status === 'Pending' && (
                <button style={styles.btnResolved} onClick={() => markResolved(s.id)}>Mark Resolved</button>
              )}
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>Warning/Submission History</div>
          {history.map(h => (
            <div key={h.id} style={styles.historyItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#1e293b', fontWeight: '600' }}>{h.user}</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>{h.date}</span>
              </div>
              <div style={{ color: '#dc2626', fontWeight: '500' }}>{h.type}: {h.reason}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
