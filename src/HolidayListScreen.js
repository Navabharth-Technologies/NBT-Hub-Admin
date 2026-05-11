import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, RefreshCcw, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from './config';

const HolidayListScreen = ({ onBack }) => {
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    fetchCalendarData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const resp = await fetch(API_ENDPOINTS.HOLIDAYS).catch(() => null);
      let data = [];
      
      if (resp && resp.ok) {
        data = await resp.json();
      } else {
        data = [];
      }
      
      const sorted = data.sort((a,b) => new Date(a.date) - new Date(b.date));
      setHolidays(sorted);
    } catch (err) {
      console.error("Calendar Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isPassed = (dateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const holidayDate = new Date(dateStr);
    holidayDate.setHours(0,0,0,0);
    return holidayDate < today;
  };

  const s = {
    container: {
      padding: winWidth < 768 ? '20px 15px' : '40px 60px',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '30px',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    },
    headerArea: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    headerTitle: {
      fontSize: '14px',
      fontWeight: '1000',
      color: '#3b82f6',
      textTransform: 'uppercase',
      letterSpacing: '3px',
      marginBottom: '10px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: winWidth < 768 ? '1fr' : (winWidth < 1200 ? '1fr 1fr' : '1fr 1fr 1fr'),
      gap: '24px',
      width: '100%'
    },
    card: (passed) => ({
      backgroundColor: 'white',
      borderRadius: winWidth < 768 ? '25px' : '30px',
      padding: winWidth < 768 ? '16px 16px 32px 16px' : '16px 20px',
      display: 'flex',
      alignItems: winWidth < 768 ? 'flex-start' : 'center',
      gap: winWidth < 768 ? '12px' : '16px',
      border: passed ? '1px solid #f1f5f9' : '2.5px solid #10b981',
      boxShadow: passed ? '0 10px 30px rgba(0,0,0,0.02)' : '0 15px 40px rgba(16, 185, 129, 0.08)',
      transition: 'all 0.3s ease',
      position: 'relative',
      minHeight: winWidth < 768 ? '80px' : '85px'
    }),
    dateBox: {
      width: winWidth < 768 ? '60px' : '75px',
      height: winWidth < 768 ? '60px' : '75px',
      backgroundColor: '#f8fafc',
      borderRadius: winWidth < 768 ? '16px' : '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #f1f5f9',
      flexShrink: 0
    },
    month: {
      fontSize: winWidth < 768 ? '10px' : '11px',
      fontWeight: '900',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    dayNum: {
      fontSize: winWidth < 768 ? '22px' : '28px',
      fontWeight: '1000',
      color: '#0B1E3F',
      lineHeight: '1'
    },
    dayName: {
      fontSize: winWidth < 768 ? '11px' : '12px',
      color: '#94a3b8',
      fontWeight: '800',
      textAlign: 'left'
    },
    holidayName: {
      fontSize: winWidth < 768 ? '15px' : '16px',
      fontWeight: '1000',
      color: '#0B1E3F',
      textAlign: 'left',
      lineHeight: '1.2'
    },
    badge: (passed) => ({
      padding: winWidth < 768 ? '4px 10px' : '8px 18px',
      borderRadius: '12px',
      fontSize: winWidth < 768 ? '9px' : '10px',
      fontWeight: '1000',
      backgroundColor: passed ? '#f1f5f9' : '#10b981',
      color: passed ? '#94a3b8' : 'white',
      letterSpacing: '1px',
      position: 'absolute',
      bottom: winWidth < 768 ? '12px' : '15px',
      right: winWidth < 768 ? '12px' : '15px'
    })
  };

  return (
    <div style={s.container}>
      <button 
        onClick={onBack}
        style={{ width: 'fit-content', border: 'none', background: 'white', padding: '12px 20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '1000', color: '#0B1E3F', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <div style={s.headerArea}>
        <div style={s.headerTitle}>OFFICIAL CORPORATE HOLIDAYS 2026</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8', fontWeight: '800' }}>Syncing Corporate Calendar...</div>
      ) : (
        <div style={s.grid}>
          {holidays.map((h, i) => {
            const date = new Date(h.date);
            const passed = isPassed(h.date);
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={s.card(passed)}
                whileHover={{ y: -5, boxShadow: passed ? '0 15px 35px rgba(0,0,0,0.05)' : '0 20px 50px rgba(16, 185, 129, 0.12)' }}
              >
                <div style={s.dateBox}>
                  <div style={s.month}>{date.toLocaleString('default', { month: 'short' })}</div>
                  <div style={s.dayNum}>{date.getDate()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, gap: '4px' }}>
                  <div style={s.holidayName}>{h.name}</div>
                  <div style={s.dayName}>
                    {date.toLocaleString('default', { weekday: 'long' })}
                  </div>
                </div>

                <div style={s.badge(passed)}>
                  {passed ? 'PASSED' : 'UPCOMING'}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div style={{ height: '100px' }} />
    </div>
  );
};

export default HolidayListScreen;
