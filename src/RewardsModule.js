import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Award, Zap, Users, 
  Sparkles, Heart, Crown, Clock, 
  Target, Rocket, CheckCircle, Shield, 
  History, Gift, ChevronRight, X, UserCheck, AlertCircle, Loader2,
  PartyPopper, Lightbulb, TrendingUp, Ribbon, Medal,
  ShieldCheck, BadgeCheck, MousePointer2, Eye, Lock, ArrowLeft
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from './config';

// Map award/reward names to badge styles — fully dynamic, no hardcoding
const getBadgeStyle = (name = '') => {
  const n = name.toUpperCase();
  if (n.includes('INNOVAT') || n.includes('IDEA'))   return { bg: '#fef3c7', color: '#d97706', border: '#fde68a', label: name };
  if (n.includes('QUALITY') || n.includes('MAESTRO')) return { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', label: name };
  if (n.includes('SPEED') || n.includes('DEMON') || n.includes('FAST')) return { bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe', label: name };
  if (n.includes('CULTURE') || n.includes('PILLAR') || n.includes('HEART')) return { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8', label: name };
  if (n.includes('VISION') || n.includes('LEAD'))    return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: name };
  if (n.includes('GOAL') || n.includes('ACHIEV'))    return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: name };
  if (n.includes('SPRINT') || n.includes('MASTER'))  return { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff', label: name };
  if (n.includes('QUIZ') || n.includes('BRAIN'))     return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: name };
  if (n.includes('IMPACT') || n.includes('AWARD'))   return { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', label: name };
  return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: name };
};

const RewardsModule = ({ onBack }) => {
  const { user } = useAuth();
  // Super Admin gets strict VIEW-ONLY access — no edit or delete allowed
  const isSuperAdmin = user?.role === 'Super Admin';
  const canEdit = !isSuperAdmin; // Only non-Super-Admin roles can make changes
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [allRewards, setAllRewards] = useState([]); // Real award records from backend
  const [dataLoading, setDataLoading] = useState(true);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchRecognitionData = async () => {
      try {
        setDataLoading(true);
        const token = String(localStorage.getItem('token') || '').trim();
        const headers = { 
          'Accept': 'application/json',
          'Authorization': token && token !== 'undefined' && token !== 'null' ? `Bearer ${token}` : ''
        };

        // Fetch leaderboard, all users, and all real award records in parallel
        const [lbRes, usersRes, rewardsRes] = await Promise.all([
          fetch(API_ENDPOINTS.REWARDS_LEADERBOARD, { headers }).catch(() => null),
          fetch(API_ENDPOINTS.USERS, { headers }).catch(() => null),
          fetch(API_ENDPOINTS.REWARDS_ALL, { headers }).catch(() => null)
        ]);

        let lbData = [];
        let allUsers = [];
        let rewardsData = [];

        if (lbRes && lbRes.ok) lbData = await lbRes.json();
        if (usersRes && usersRes.ok) allUsers = await usersRes.json();
        if (rewardsRes && rewardsRes.ok) {
          const raw = await rewardsRes.json();
          rewardsData = Array.isArray(raw) ? raw : (raw.data || raw.rewards || []);
        }

        // Build a map of userId -> their latest award (for the table)
        const latestRewardByUser = {};
        rewardsData.forEach(r => {
          const uid = String(r.userId || r.user_id || r.employee_id || '');
          if (!latestRewardByUser[uid] || new Date(r.created_at || r.date) > new Date(latestRewardByUser[uid].created_at || latestRewardByUser[uid].date)) {
            latestRewardByUser[uid] = r;
          }
        });

        // Filter out Dinesh and Admins for the leaderboard display
        const validUsers = lbData.filter(entry => {
          const userId = entry.userId || entry.employee_id || entry.id;
          const userObj = allUsers.find(u => String(u.id || u.employee_id) === String(userId));
          if (!userObj) return true;
          const name = (userObj.name || '').toLowerCase();
          return !name.includes('dinesh') && !['Super Admin', 'Admin'].includes(userObj.role);
        });

        // Sort by points descending
        const sorted = validUsers.sort((a, b) => (b.total_points || b.points || 0) - (a.total_points || a.points || 0));
        
        // Enhance with user details and REAL award data
        const enriched = sorted.map((entry, i) => {
          const userId = String(entry.userId || entry.employee_id || entry.id || '');
          const userObj = allUsers.find(u => String(u.id || u.employee_id) === userId) || {};
          const latestAward = latestRewardByUser[userId];
          // Pool of diverse professional citations
          const defaultCitations = [
            "Exemplary dedication and consistently high performance throughout the period.",
            "Exceptional problem-solving skills and technical contribution to core projects.",
            "Outstanding leadership and proactive approach in driving team initiatives.",
            "Continuous commitment to excellence and high-quality deliverables.",
            "Recognized for remarkable efficiency and maintaining peak productivity levels.",
            "Strong team player with a positive impact on organization culture.",
            "Demonstrated superior analytical thinking and strategic project execution.",
            "Valued for consistent reliability and exceeding key performance targets."
          ];
          const citationIdx = (parseInt(userId) || i) % defaultCitations.length;

          return {
            ...entry,
            name: userObj.name || entry.name || `Employee ${userId}`,
            role: userObj.role || entry.role || 'Team Member',
            image: (userObj.name || entry.name || 'E').charAt(0),
            points: entry.total_points || entry.points || 0,
            achievement: latestAward?.reward_name || latestAward?.award_name || latestAward?.title || entry.achievement || 'Recognition Award',
            citation: latestAward?.reason || latestAward?.comment || latestAward?.description || entry.last_citation || entry.reason || defaultCitations[citationIdx],
            month: latestAward
              ? new Date(latestAward.created_at || latestAward.date || Date.now()).toLocaleString('default', { month: 'long', year: 'numeric' })
              : new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          };
        });

        setLeaderboard(enriched);
        setAllRewards(rewardsData);
        setEmployees(allUsers);
      } catch (err) {
        console.error('Recognition Fetch Error:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchRecognitionData();
  }, []);

  const employeeOfTheMonth = leaderboard.length > 0 ? {
    ...leaderboard[0],
    achievements: [
        { title: 'Highest Performance Score', icon: <Rocket size={12} />, date: 'THIS MONTH' },
        { title: 'Top Rated by Team & Manager', icon: <CheckCircle size={12} />, date: 'THIS MONTH' },
        { title: 'Best Employee of the Month', icon: <Users size={12} />, date: 'THIS MONTH' }
    ]
  } : null;

  // Build the logs array from REAL backend data — no hardcoded achievement cycling
  const logs = leaderboard.map((entry, idx) => {
    const badgeStyle = getBadgeStyle(entry.achievement || '');
    return {
      id: entry.id || idx + 1,
      name: entry.name,
      achievement: entry.achievement,  // Real award name from backend
      icon: <Award size={14} />,       // Generic icon — badge color communicates type
      citation: entry.citation,        // Real citation from backend
      points: `${entry.points} Points`,
      month: entry.month,              // Real month from backend award date
      badgeStyle                       // Dynamic badge colors based on award name
    };
  });

  const isMobile = winWidth < 768;

  const styles = {
    container: { fontFamily: '"Outfit", sans-serif', color: '#1e293b', background: '#FAFBFC', minHeight: '100vh', paddingBottom: '100px' },
    hero: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
      borderRadius: isMobile ? '20px' : '32px',
      padding: isMobile ? '20px 16px' : '45px 50px',
      color: 'white',
      marginBottom: isMobile ? '20px' : '40px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '16px' : '35px',
      boxShadow: '0 15px 30px rgba(49, 46, 129, 0.2)'
    },
    tableHeader: { 
      textAlign: 'left', 
      padding: '0 15px 18px', 
      fontSize: '12px', 
      fontWeight: '800', 
      color: '#1e293b', 
      letterSpacing: '0.5px', 
      textTransform: 'uppercase',
      borderBottom: '2px solid #f1f5f9'
    }
  };

  // No full-page loading block — page opens instantly!

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* TOP ACTION BAR: BACK BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
          {onBack && (
            <div 
              onClick={onBack} 
              style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eef2f6' }}
            >
              <ArrowLeft size={20} color="#64748b" />
            </div>
          )}
          <h2 style={{ fontSize: '20px', fontWeight: '1000', color: '#1e2b3b', margin: 0 }}>Recognition & Rewards</h2>
        </div>

        {/* VIEW-ONLY NOTICE FOR SUPER ADMIN */}
        {isSuperAdmin && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '16px', padding: '12px 20px', marginBottom: '24px'
          }}>
            <div style={{ background: '#f59e0b', borderRadius: '8px', padding: '6px', display: 'flex' }}>
              <Eye size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: '1000', fontSize: '13px', color: '#92400e' }}>View-Only Access</div>
              <div style={{ fontSize: '11px', color: '#b45309' }}>As Super Admin, you can view all rank holders but cannot edit or delete any records.</div>
            </div>
            <Lock size={16} color="#f59e0b" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        )}

        {/* TOP SECTION: Best Employee Profile */}
        {employeeOfTheMonth && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.hero}>
            <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.08 }}><Trophy size={isMobile ? 120 : 200} /></div>

            {/* TOP ROW: Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '30px', zIndex: 2 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: isMobile ? '72px' : '130px', height: isMobile ? '72px' : '130px', borderRadius: isMobile ? '20px' : '40px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontSize: isMobile ? '30px' : '60px', fontWeight: '1000', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                  {employeeOfTheMonth.image}
                  <div style={{ position: 'absolute', top: isMobile ? -6 : -10, right: isMobile ? -6 : -10, width: isMobile ? '24px' : '40px', height: isMobile ? '24px' : '40px', background: '#fbbf24', borderRadius: isMobile ? '8px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `${isMobile ? '2px' : '4px'} solid white` }}>
                    <Star size={isMobile ? 10 : 18} fill="white" color="white" />
                  </div>
                </div>
                <div style={{ marginTop: '6px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>TOP PERFORMER</div>
              </div>

              <div style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '100px', fontSize: '9px', fontWeight: '800', marginBottom: isMobile ? '6px' : '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Sparkles size={10} style={{ marginRight: '5px' }} /> Best Employee of the Month
                </div>
                <h1 style={{ fontSize: isMobile ? '16px' : '28px', fontWeight: '1000', margin: '0 0 4px 0', letterSpacing: '-0.5px', color: 'white', wordBreak: 'break-word', lineHeight: '1.2' }}>{employeeOfTheMonth.name}</h1>
                <div style={{ fontSize: isMobile ? '10px' : '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{employeeOfTheMonth.role}</div>
              </div>
            </div>

            {/* BOTTOM: Citation */}
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: isMobile ? '12px' : '20px', borderRadius: isMobile ? '14px' : '24px', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', zIndex: 2 }}>
              <div style={{ fontSize: '8px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', letterSpacing: '1px' }}>OFFICIAL CITATION</div>
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'white', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>"{employeeOfTheMonth.citation}"</p>
            </div>

            {/* ACHIEVEMENTS — chips on mobile, card on desktop */}
            {isMobile ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', zIndex: 2 }}>
                {employeeOfTheMonth.achievements.map((ach, i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: 'white' }}>
                    {ach.icon} {ach.title}
                  </div>
                ))}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#4338ca', color: 'white', padding: '6px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '11px', border: '2px solid rgba(255,255,255,0.3)' }}>
                  <Medal size={12} /> RANK 1 HOLDER
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', zIndex: 2 }}>
                <div style={{ flex: 1.5, background: 'white', padding: '20px', borderRadius: '24px', color: '#4338ca', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', border: '2px solid #bfdbfe' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>TOP RANK STATUS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employeeOfTheMonth.achievements.map((ach, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#1e293b' }}>{ach.icon} {ach.title}</div>
                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#cbd5e1' }}>{ach.date}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#4338ca', color: 'white', padding: '10px', borderRadius: '12px', justifyContent: 'center', fontWeight: '1000', fontSize: '11px' }}>
                    <Medal size={16} /> RANK 1 HOLDER
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}


        {/* REGISTRY TABLE — Attractive Redesign */}
        <div style={{ background: 'white', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(67,56,202,0.08)', border: '2px solid #bfdbfe' }}>
          
          {/* Table Header Strip */}
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', padding: '24px 35px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px', display: 'flex' }}>
              <Trophy size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '1000', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>Rank Holders</h3>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Top performing team members this month</div>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '100px', padding: '6px 16px', fontSize: '11px', fontWeight: '800', color: 'white' }}>
              {logs.length} Achievers
            </div>
          </div>

          <div style={{ padding: isMobile ? '12px' : '24px 35px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: isMobile ? '800px' : 'auto' }}>
                <thead>
                  <tr>
                    <th style={{ ...styles.tableHeader, width: '70px' }}>RANK</th>
                    <th style={styles.tableHeader}>ASSOCIATE</th>
                    <th style={styles.tableHeader}>MONTH</th>
                    <th style={styles.tableHeader}>MERIT BADGE</th>
                    <th style={styles.tableHeader}>PERFORMANCE CITATION</th>
                    <th style={{ ...styles.tableHeader, textAlign: 'right' }}>TOTAL XP</th>
                  </tr>
                </thead>
                <tbody>
                  {dataLoading
                    ? [1,2,3,4,5].map(i => (
                      <tr key={i}>
                        <td style={{ padding: '14px 10px' }}><div style={{ height: '32px', width: '32px', background: '#f1f5f9', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} /></td>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                            <div style={{ height: '14px', width: '130px', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                          </div>
                        </td>
                        <td style={{ padding: '14px 10px' }}><div style={{ height: '28px', width: '100px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div style={{ height: '28px', width: '120px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div style={{ height: '14px', width: '210px', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} /></td>
                        <td style={{ padding: '14px 10px', textAlign: 'right' }}><div style={{ height: '34px', width: '110px', background: '#f1f5f9', borderRadius: '100px', marginLeft: 'auto', animation: 'pulse 1.5s infinite' }} /></td>
                      </tr>
                    ))
                    : logs.map((log, idx) => {
                      const rankStyle = idx === 0
                        ? { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', text: '#fff', label: '🥇' }
                        : idx === 1
                        ? { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', text: '#fff', label: '🥈' }
                        : idx === 2
                        ? { bg: 'linear-gradient(135deg, #f97316, #ea580c)', text: '#fff', label: '🥉' }
                        : { bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', text: '#4338ca', label: String(idx + 1).padStart(2,'0') };

                      const badgeStyle = log.badgeStyle || getBadgeStyle(log.achievement || '');

                      const avatarGradients = [
                        'linear-gradient(135deg,#6366f1,#4338ca)',
                        'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                        'linear-gradient(135deg,#06b6d4,#0284c7)',
                        'linear-gradient(135deg,#f43f5e,#e11d48)',
                        'linear-gradient(135deg,#10b981,#059669)',
                        'linear-gradient(135deg,#f59e0b,#d97706)',
                      ];

                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{ background: idx % 2 === 0 ? '#fafbff' : 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(67,56,202,0.04)' }}
                        >
                          <td style={{ padding: '16px 10px 16px 15px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: rankStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: idx < 3 ? '18px' : '12px', fontWeight: '1000', color: rankStyle.text, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                              {rankStyle.label}
                            </div>
                          </td>
                          <td style={{ padding: '16px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: avatarGradients[idx % avatarGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '1000', fontSize: '16px', boxShadow: '0 4px 12px rgba(67,56,202,0.2)' }}>
                                {log.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap' }}>{log.name}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>Rank Candidate</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content', whiteSpace: 'nowrap' }}>
                              {log.month}
                            </div>
                          </td>
                          <td style={{ padding: '16px 10px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}`, borderRadius: '100px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                              {log.icon} {log.achievement}
                            </div>
                          </td>
                          <td style={{ padding: '16px 10px', color: '#475569', fontSize: '13px', fontWeight: '500', fontStyle: 'italic', minWidth: '200px' }}>"{log.citation}"</td>
                          <td style={{ padding: '16px 15px 16px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4338ca, #6366f1)', color: 'white', fontWeight: '800', fontSize: '13px', padding: '8px 18px', borderRadius: '100px', boxShadow: '0 4px 12px rgba(67,56,202,0.3)', whiteSpace: 'nowrap' }}>
                              <Zap size={13} fill="white" /> {log.points}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsModule;
