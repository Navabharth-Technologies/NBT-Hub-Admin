import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, BASE_URL } from './config';

export default function SuggestionDashboard({ onBack }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = user?.token || localStorage.getItem('token');
      console.log('Fetching suggestions with token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Hitting endpoints:', API_ENDPOINTS.SUGGESTIONS, API_ENDPOINTS.SUGGESTIONS_ADMIN);
        
        const [res1, res2] = await Promise.allSettled([
          fetch(API_ENDPOINTS.SUGGESTIONS, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(API_ENDPOINTS.SUGGESTIONS_ADMIN, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let combinedData = [];

        if (res1.status === 'fulfilled' && res1.value.ok) {
          const d1 = await res1.value.json();
          console.log('Suggestions response 1:', d1);
          const list1 = Array.isArray(d1) ? d1 : (d1.data || d1.suggestions || d1.value || []);
          combinedData = [...list1];
        } else {
          console.warn('Suggestions endpoint 1 failed:', res1.status === 'fulfilled' ? res1.value.status : res1.reason);
        }

        if (res2.status === 'fulfilled' && res2.value.ok) {
          const d2 = await res2.value.json();
          console.log('Suggestions response 2:', d2);
          const list2 = Array.isArray(d2) ? d2 : (d2.data || d2.suggestions || d2.value || []);
          list2.forEach(item => {
            const isDuplicate = combinedData.some(existing => 
              (existing.suggestion || existing.content) === (item.suggestion || item.content) &&
              (existing.employee_id || existing.user_id) === (item.employee_id || item.user_id)
            );
            if (!isDuplicate) combinedData.push(item);
          });
        } else {
          console.warn('Suggestions endpoint 2 failed:', res2.status === 'fulfilled' ? res2.value.status : res2.reason);
        }

        console.log('Combined suggestions count:', combinedData.length);

        const mapped = combinedData.map(s => ({
          user: s.employee_name || s.user_name || s.user || 'Anonymous',
          team: s.employee_id || s.department || s.team || 'N/A',
          date: s.created_at ? new Date(s.created_at).toLocaleDateString() : (s.date || 'Today'),
          content: s.suggestion || s.suggestion_text || s.message || s.content || 'No content provided.',
          participation: s.requirement || s.status || s.participation || 'Active',
          profile_pic: s.profile_pic || s.profile_picture || s.user_profile_pic || s.user_pic
        }));
        setSubmissions(mapped);
      } catch (err) {
        console.error('Suggestion fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const isMobile = winWidth < 768;

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = {
    container: { padding: isMobile ? '16px' : '30px', backgroundColor: '#f8fafc', minHeight: '100vh' },
    header: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '30px', gap: isMobile ? '20px' : '0' },
    title: { fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#1e293b' },
    subtitle: { color: '#64748b', fontSize: isMobile ? '12px' : '14px', maxWidth: isMobile ? '100%' : '500px' },
    btnOutline: { padding: isMobile ? '6px 12px' : '8px 16px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '11px' : '13px' },
    card: { backgroundColor: 'white', padding: isMobile ? '16px' : '24px', borderRadius: '20px', border: '1px solid #eef2f6', borderLeft: '5px solid #2563eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '16px' },
    badge: { fontSize: isMobile ? '8px' : '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }
  };

  return (
    <div style={styles.container}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={onBack} style={styles.btnOutline}>← Back</button>
            <div>
              <h1 style={styles.title}>Innovation Hub</h1>
              <p style={styles.subtitle}>Collaborative space for internal suggestions & workflow improvements.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
            <button onClick={() => window.location.reload()} style={styles.btnOutline}>🔄 Refresh</button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '900', color: '#2563eb' }}>84%</div>
              <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>PARTICIPATION RATE</div>
            </div>
          </div>
        </header>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Recent Submissions</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{submissions.length} Total Submissions</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                <p style={{ fontWeight: '800', fontSize: '16px', marginBottom: '8px' }}>Syncing with Database...</p>
                <p style={{ fontSize: '12px' }}>This may take a moment depending on network speed.</p>
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>📭</div>
                <p style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>No submissions found.</p>
                <p style={{ fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>If you expect to see suggestions here, please ensure you have the correct permissions.</p>
              </div>
            ) : (
              submissions.map((s, i) => (
                <div key={i} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '16px', fontWeight: '900', color: '#2563eb' }}>
                        {s.profile_pic ? (
                          <img 
                            src={s.profile_pic.startsWith('http') || s.profile_pic.startsWith('data:') ? s.profile_pic : `${BASE_URL}${s.profile_pic.startsWith('/') ? '' : '/'}${s.profile_pic}`} 
                            alt="User" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          s.user.charAt(0)
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', display: 'block' }}>{s.user}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>from <strong style={{ color: '#2563eb' }}>{s.team}</strong></span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{s.date}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                    "{s.content}"
                  </p>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 'bold', color: '#64748b' }}>Engagement:</span>
                      <span style={styles.badge}>{s.participation}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                      <button style={{ ...styles.btnOutline, border: 'none', color: '#ef4444', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}>Archive</button>
                      <button style={{ ...styles.btnOutline, background: '#2563eb', color: 'white', border: 'none', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}>Review Input</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
    </div>
  );
}
