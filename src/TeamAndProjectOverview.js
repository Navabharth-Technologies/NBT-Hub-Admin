import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from './config';

export default function TeamAndProjectOverview({ onBack }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [zoomedId, setZoomedId] = useState(null);

  React.useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    fetchTeams();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEAMS, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || data.teams || []);
        setTeams(list);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = winWidth < 768;

  const getTeamMembers = (leaderName) => {
    const name = String(leaderName || '').toLowerCase();
    if (name.includes('santhosh')) return ['Tejaswini'];
    if (name.includes('namith')) return ['Aishwarya', 'Rakshitha', 'Varun', 'Faraz'];
    if (name.includes('rakesh')) return ['Shobha', 'Ashwini'];
    if (name.includes('sahana')) return ['Imsha', 'Vishalakshi', 'Anoop'];
    if (name.includes('deekshitha')) return ['Sonu', 'Akhil'];
    return ['Team Member 1', 'Team Member 2'];
  };

  const styles = {
    container: {
      fontFamily: 'system-ui, sans-serif',
      padding: isMobile ? '20px 15px' : '30px 40px',
      marginTop: isMobile ? '0' : '10px'
    },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(49,90,158,0.10)',
      border: '2px solid #bfdbfe',
      display: 'flex',
      flexDirection: 'column'
    },
    cardHeader: {
      padding: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    teamName: {
      fontSize: '18px',
      fontWeight: '900',
      color: '#0B1E3F',
      lineHeight: '1.2',
      maxWidth: '70%',
      margin: 0
    },
    statusBadge: {
      backgroundColor: '#E0F2FE',
      color: '#0EA5E9',
      padding: '4px 10px',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: '800',
      textTransform: 'uppercase'
    },
    leaderStrip: {
      backgroundColor: '#EFF6FF',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '2px solid #bfdbfe',
      borderBottom: '2px solid #bfdbfe'
    },
    leaderInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    leaderAvatar: {
      width: '32px',
      height: '32px',
      backgroundColor: '#315A9E',
      color: 'white',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    leaderText: {
      display: 'flex',
      flexDirection: 'column'
    },
    leaderName: {
      fontSize: '13px',
      fontWeight: '900',
      color: '#0B1E3F'
    },
    leaderTitle: {
      fontSize: '10px',
      fontWeight: '800',
      color: '#315A9E',
      textTransform: 'uppercase'
    },
    activeBadge: {
      backgroundColor: '#E0F2FE',
      color: '#315A9E',
      padding: '4px 10px',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: '800',
      textTransform: 'uppercase'
    },
    description: {
      padding: '20px 24px',
      fontSize: '12px',
      color: '#64748b',
      lineHeight: '1.6',
      minHeight: '60px',
      borderBottom: '1.5px solid #e2e8f0'
    },
    statsRow: {
      display: 'flex',
      gap: '15px',
      padding: '0 24px 20px 24px'
    },
    statBox: {
      flex: 1,
      backgroundColor: '#F8FAFC',
      borderRadius: '16px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid #e2e8f0'
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '900',
      color: '#0B1E3F'
    },
    statLabel: {
      fontSize: '10px',
      fontWeight: '800',
      color: '#94a3b8',
      textTransform: 'uppercase'
    },
    progressSection: {
      padding: '0 24px 24px 24px'
    },
    progressLabelRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px'
    },
    progressLabel: {
      fontSize: '10px',
      fontWeight: '900',
      color: '#94a3b8',
      textTransform: 'uppercase'
    },
    progressValue: {
      fontSize: '10px',
      fontWeight: '900',
      color: '#315A9E'
    },
    progressBar: {
      height: '6px',
      backgroundColor: '#F1F5F9',
      borderRadius: '3px',
      overflow: 'hidden'
    },
    progressFill: (p) => ({
      width: `${p}%`,
      height: '100%',
      backgroundColor: '#315A9E',
      borderRadius: '3px'
    }),
    footer: {
      padding: '15px 24px',
      borderTop: '2px solid #bfdbfe',
      textAlign: 'right',
      backgroundColor: '#f8faff'
    },
    footerLink: {
      fontSize: '12px',
      fontWeight: '900',
      color: '#315A9E',
      textDecoration: 'none',
      cursor: 'default' // Changed to default arrow mark as requested
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 99,
      display: zoomedId ? 'block' : 'none'
    },
    zoomedCard: {
      transform: 'scale(1.1)',
      zIndex: 100,
      position: 'relative',
      boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
    },
    rosterContainer: {
      padding: '15px 24px',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    rosterMember: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    rosterAvatar: {
      width: '28px',
      height: '28px',
      backgroundColor: '#e0f2fe',
      color: '#0ea5e9',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    rosterName: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#1e293b'
    }
  };

  return (
    <div style={styles.container} onClick={() => setZoomedId(null)}>
      <div style={styles.overlay} />
      <div style={styles.header}>
        {onBack && (
          <div
            onClick={onBack}
            style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}
          >
            <ArrowLeft size={20} color="#0B1E3F" />
          </div>
        )}
        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '900', color: '#0B1E3F', margin: 0 }}>Team & Project Overview</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', fontWeight: '800', color: '#64748B' }}>Syncing Teams...</div>
      ) : (
        <div style={styles.grid}>
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1/-1', color: '#64748B', fontWeight: '800' }}>No teams found.</div>
          ) : teams.map(team => {
            const isZoomed = zoomedId === team.id;
            return (
              <div
                key={team.id}
                style={{ ...styles.card, transition: 'all 0.3s ease', cursor: 'default', ...(isZoomed ? styles.zoomedCard : {}) }}
                onClick={(e) => { e.stopPropagation(); setZoomedId(isZoomed ? null : team.id); }}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.teamName}>{team.name}</h3>
                  <span style={styles.statusBadge}>{team.status || 'ACTIVE'}</span>
                </div>

                <div style={styles.leaderStrip}>
                  <div style={styles.leaderInfo}>
                    <div style={styles.leaderAvatar}>{(team.leader || team.lead || 'M')[0]}</div>
                    <div style={styles.leaderText}>
                      <span style={styles.leaderName}>{team.leader || team.lead || 'Manager'}</span>
                      <span style={styles.leaderTitle}>Team Leader</span>
                    </div>
                  </div>
                  <span style={styles.activeBadge}>Active</span>
                </div>

                <div style={styles.description}>{team.desc || team.description || `Active operations team for ${team.name}.`}</div>

                <div style={styles.statsRow}>
                  <div style={styles.statBox}>
                    <span style={styles.statValue}>{team.members || 0}</span>
                    <span style={styles.statLabel}>Members</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statValue}>{team.tasks || 0}</span>
                    <span style={styles.statLabel}>Tasks</span>
                  </div>
                </div>

                <div style={styles.progressSection}>
                  <div style={styles.progressLabelRow}>
                    <span style={styles.progressLabel}>Overall Progress</span>
                    <span style={styles.progressValue}>{team.progress || 0}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill(team.progress || 0)} />
                  </div>
                </div>

                {isZoomed && (
                  <div style={styles.rosterContainer}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Team Members</div>
                    {getTeamMembers(team.leader || team.lead).map((memberName, idx) => (
                      <div key={idx} style={styles.rosterMember}>
                        <div style={styles.rosterAvatar}>{memberName.charAt(0)}</div>
                        <div style={styles.rosterName}>{memberName}</div>
                      </div>
                    ))}
                  </div>
                )}


              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
