import React from 'react';
import { Trophy, Star, Award, Zap, ArrowLeft, ShieldCheck, UserCheck, Flame, Edit, Trash2, Plus, Users, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from './config';

export default function RewardsModule({ onBack }) {
    const { user } = useAuth();
    const [winWidth, setWinWidth] = React.useState(window.innerWidth);
    const [rewards, setRewards] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState('feed'); // 'feed', 'leaderboard', 'points'
    const [leaderboard, setLeaderboard] = React.useState([]);
    const [rewardNames, setRewardNames] = React.useState([]);
    const [employees, setEmployees] = React.useState([]);
    const [showAllFeed, setShowAllFeed] = React.useState(false);
    const [selectedHistoryUser, setSelectedHistoryUser] = React.useState(null);
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [availableAwards] = React.useState([
        { id: 'visionary', title: "Visionary Lead", rep: 200, desc: "Acknowledge exceptional leadership and vision." },
        { id: 'achiever', title: "Goal Achiever", rep: 150, desc: "Recognize consistent goal hitting and performance." },
        { id: 'growth', title: "Team Growth", rep: 150, desc: "Reward contributions to team development." },
        { id: 'star', title: "Star Performer", rep: 50, desc: "Acknowledge exceptional output and dedication." },
        { id: 'solver', title: "Problem Solver", rep: 30, desc: "Recognize innovative solutions and quick thinking." },
        { id: 'collaborator', title: "Collaborative Hero", rep: 20, desc: "Reward great teamwork and unselfish assistance." }
    ]);

    React.useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchInitialData = async () => {
        if (!user?.token) return;
        try {
            const rewRes = await fetch(API_ENDPOINTS.REWARDS_HISTORY, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (rewRes.ok) {
                const data = await rewRes.json();
                setRewards(Array.isArray(data) ? data : (data.data || []));
            }

            setRewardNames(["Visionary Lead", "Goal Achiever", "Team Growth", "Star Performer", "Problem Solver", "Collaborative Hero"]);

            let allStaff = [];
            try {
                const empRes = await fetch(API_ENDPOINTS.EMPLOYEES, { headers: { 'Authorization': `Bearer ${user.token}` } });
                if (empRes.ok) {
                    const resJson = await empRes.json();
                    allStaff = [...allStaff, ...(Array.isArray(resJson) ? resJson : (resJson.data || []))];
                }
            } catch (e) {}
            
            try {
                const userRes = await fetch(API_ENDPOINTS.USERS, { headers: { 'Authorization': `Bearer ${user.token}` } });
                if (userRes.ok) {
                    const resJson = await userRes.json();
                    allStaff = [...allStaff, ...(Array.isArray(resJson) ? resJson : (resJson.data || []))];
                }
            } catch (e) {}

            // Deduplicate
            const unique = Array.from(new Map(allStaff.map(s => [s.id || s.employee_id || s.userId, s])).values());
            setEmployees(unique);

            // Fetch Leaderboard for Banner (Top Recognition)
            await fetchLeaderboard();

        } catch (err) { 
            console.error(err);
        } finally { 
            setLoading(false); 
        }
    };

    React.useEffect(() => {
        fetchInitialData();
    }, [user]);

    const resolveEmployeeName = (id) => {
        if (!id) return 'Anonymous Member';
        const emp = employees.find(e => 
            String(e.id) === String(id) || 
            String(e.employee_id) === String(id) || 
            String(e.userId) === String(id) ||
            String(e.emp_id) === String(id)
        );
        return emp ? (emp.name || emp.employee_name || 'Anonymous Member') : 'Anonymous Member';
    };

    const fetchLeaderboard = async () => {
        if (!user?.token) return;
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            
            const res = await fetch(`${API_ENDPOINTS.LEADERBOARD_ALL}?${params.toString()}`, { 
                headers: { 'Authorization': `Bearer ${user.token}` } 
            });
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (err) { setLeaderboard([]); }
    };

    React.useEffect(() => {
        fetchLeaderboard();
    }, [startDate, endDate]);

    const filteredRewards = rewards.filter(r => {
        if (!startDate && !endDate) return true;
        const rDate = (r.created_at || r.date || "").split('T')[0];
        if (!rDate) return true;
        if (startDate && rDate < startDate) return false;
        if (endDate && rDate > endDate) return false;
        return true;
    });

    return (
        <div style={{ backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif", padding: winWidth < 768 ? '15px' : '30px' }}>

            <main style={{ flex: 1 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    
                    {/* Header Controls */}
                    <div style={{ display: 'flex', flexDirection: winWidth < 500 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 500 ? 'stretch' : 'center', marginBottom: '24px', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div onClick={onBack || (() => {})} style={{ cursor: onBack ? 'pointer' : 'default', background: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <ArrowLeft size={16} color="#64748b" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: winWidth < 768 ? '18px' : '24px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' }}>Awards & Recognition</h1>
                                <p style={{ margin: 0, fontSize: winWidth < 768 ? '10px' : '13px', color: '#94a3b8', fontWeight: '600' }}>Live achievements at NBT Hub</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: winWidth < 768 ? '100%' : 'auto', justifyContent: 'flex-start', alignItems: 'center' }}>
                            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', width: winWidth < 500 ? '100%' : 'auto', overflowX: 'auto' }}>
                                <button 
                                    onClick={() => setView('feed')}
                                    style={{ flex: 1, padding: winWidth < 480 ? '6px 10px' : '8px 16px', borderRadius: '8px', fontSize: winWidth < 480 ? '9px' : '11px', fontWeight: '800', border: 'none', background: view === 'feed' ? 'white' : 'transparent', color: view === 'feed' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: view === 'feed' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', whiteSpace: 'nowrap' }}>
                                    Live Feed
                                </button>
                                <button 
                                    onClick={() => setView('leaderboard')}
                                    style={{ flex: 1, padding: winWidth < 480 ? '6px 10px' : '8px 16px', borderRadius: '8px', fontSize: winWidth < 480 ? '9px' : '11px', fontWeight: '800', border: 'none', background: view === 'leaderboard' ? 'white' : 'transparent', color: view === 'leaderboard' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: view === 'leaderboard' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', whiteSpace: 'nowrap' }}>
                                    Leaderboard
                                </button>
                                <button 
                                    onClick={() => setView('points')}
                                    style={{ flex: 1, padding: winWidth < 480 ? '6px 10px' : '8px 16px', borderRadius: '8px', fontSize: winWidth < 480 ? '9px' : '11px', fontWeight: '800', border: 'none', background: view === 'points' ? 'white' : 'transparent', color: view === 'points' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: view === 'points' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', whiteSpace: 'nowrap' }}>
                                    Reward Points
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '5px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', width: winWidth < 500 ? '100%' : 'auto', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '8px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>From</span>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '9px', fontWeight: '700', outline: 'none', width: '85px' }} />
                                </div>
                                <div style={{ width: '1px', height: '12px', background: '#cbd5e1' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '8px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>To</span>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '9px', fontWeight: '700', outline: 'none', width: '85px' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* High-Fidelity Top Banner */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                        borderRadius: '24px', 
                        padding: winWidth < 768 ? '20px' : '30px 60px', 
                        display: 'grid', 
                        gridTemplateColumns: winWidth < 600 ? '1fr' : (winWidth < 900 ? '1fr 1fr' : '1fr 1fr 1fr'), 
                        gap: '20px',
                        alignItems: 'center', 
                        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                        marginBottom: '32px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '40%', height: '200%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)', transform: 'rotate(-45deg)', opacity: 0.5 }}></div>

                        {/* Current Rank */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderRight: winWidth < 900 ? 'none' : '1.5px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Trophy size={winWidth < 768 ? 20 : 32} color="#facc15" />
                            </div>
                            <div>
                                <p style={{ margin: '0 0 3px 0', fontSize: '8px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Member Status</p>
                                <h3 style={{ margin: 0, fontSize: winWidth < 768 ? '16px' : '24px', fontWeight: '950', color: '#ffffff' }}>Active Hub</h3>
                            </div>
                        </div>

                        {/* Points Display */}
                        <div style={{ textAlign: winWidth < 600 ? 'left' : 'center', borderRight: winWidth < 900 ? 'none' : '1.5px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
                            <p style={{ margin: '0 0 3px 0', fontSize: '8px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Points Circulating</p>
                            <h3 style={{ margin: 0, fontSize: winWidth < 768 ? '18px' : '28px', fontWeight: '950', color: '#facc15' }}>
                                {rewards.reduce((acc, r) => acc + (Number(r.points) || 0), 0).toLocaleString()} <span style={{ fontSize: '12px' }}>REP</span>
                            </h3>
                        </div>

                        {/* Leaderboard Score */}
                        <div style={{ textAlign: winWidth < 900 ? 'left' : 'right', gridColumn: winWidth < 900 && winWidth >= 600 ? 'span 2' : 'auto' }}>
                            <p style={{ margin: '0 0 3px 0', fontSize: '8px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Recognition</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: winWidth < 900 ? 'flex-start' : 'flex-end', gap: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '22px', fontWeight: '950', color: '#ffffff' }}>
                                    {leaderboard[0] ? leaderboard[0].name : "Syncing..."}
                                </h3>
                                <Star size={16} color="#facc15" fill="#facc15" />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: winWidth < 1200 ? '1fr' : '1fr 380px', gap: '30px' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '24px', padding: winWidth < 768 ? '15px' : '30px', border: '1.5px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b' }}>
                                    {view === 'feed' ? 'Global Rewards' : view === 'leaderboard' ? 'Organization Ranking' : 'Standard Recognition Tiers'}
                                </h3>
                                <div style={{ fontSize: '8px', fontWeight: '950', color: '#3863a8', background: '#e0f2fe', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                                    {view === 'feed' ? `${rewards.length} ENTRIES` : view === 'leaderboard' ? 'ALL STAFF' : `${availableAwards.length} TIERS`}
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>⚡ Syncing database...</div>
                            ) : (
                                <>
                                    {view === 'feed' ? (
                                        <>
                                            {!selectedHistoryUser ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                        <div>
                                                            <h2 style={{ margin: 0, fontSize: winWidth < 480 ? '15px' : '18px', fontWeight: '1000', color: '#0f172a' }}>Recognition Glimpse</h2>
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>Aggregated results per member</p>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {Array.from(new Set(filteredRewards.map(r => r.employee_id))).length > 5 && (
                                                                <button 
                                                                    onClick={() => setShowAllFeed(!showAllFeed)}
                                                                    style={{ 
                                                                        background: 'none', border: 'none', color: '#3863a8', fontSize: '10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', textDecoration: 'underline' 
                                                                    }}>
                                                                    {showAllFeed ? 'Less' : 'All'}
                                                                </button>
                                                            )}
                                                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', background: '#eff6ff', padding: '4px 8px', borderRadius: '8px' }}>
                                                                {Array.from(new Set(filteredRewards.map(r => r.employee_id))).length} Members
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(() => {
                                                        const employeeStats = Array.from(new Set(filteredRewards.map(r => r.employee_id))).map(id => {
                                                            const userRewards = filteredRewards.filter(r => String(r.employee_id) === String(id));
                                                            const totalRep = userRewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
                                                            return { id, totalRep, userRewards };
                                                        }).sort((a, b) => b.totalRep - a.totalRep);

                                                        const displayedStats = showAllFeed ? employeeStats : employeeStats.slice(0, 5);
                                                        
                                                        return displayedStats.map(({ id: empId, totalRep, userRewards }) => {
                                                            const latest = userRewards.reduce((prev, current) => (new Date(prev.created_at || prev.date) > new Date(current.created_at || current.date)) ? prev : current, userRewards[0]);
                                                            return (
                                                                <div key={empId} onClick={() => setSelectedHistoryUser(empId)} style={{ background: 'white', padding: winWidth < 768 ? '12px' : '18px', borderRadius: '20px', border: '1.5px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <div style={{ width: winWidth < 480 ? '34px' : '40px', height: winWidth < 480 ? '34px' : '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}><Award size={winWidth < 480 ? 16 : 20} color="#0369a1" /></div>
                                                                        <div>
                                                                            <div style={{ fontSize: winWidth < 480 ? '12px' : '14px', fontWeight: '1000', color: '#0f172a' }}>{resolveEmployeeName(empId)}</div>
                                                                            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>
                                                                                {userRewards.length} awards • {latest.reward_name || 'Excellence'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontSize: '14px', fontWeight: '1000', color: '#10b981' }}>+{totalRep}</div>
                                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>REP</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <button onClick={() => setSelectedHistoryUser(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '800' }}><ChevronLeft size={16}/> Back to Feed</button>
                                                    {filteredRewards.filter(r => String(r.employee_id) === String(selectedHistoryUser)).map((r, i) => (
                                                        <div key={i} style={{ padding: '15px', borderRadius: '16px', background: 'white', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ fontWeight: '1000', fontSize: '13px' }}>{r.reward_name || 'Excellence'}</div>
                                                                <div style={{ color: '#38bdf8', fontWeight: '1000', fontSize: '13px' }}>+{r.points} REP</div>
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(r.created_at || r.date).toLocaleDateString()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : view === 'leaderboard' ? (
                                        <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="custom-scroll">
                                            {leaderboard.map((item, idx) => (
                                                <div key={idx} style={{ 
                                                    background: idx === 0 ? 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' : idx < 3 ? 'white' : '#f8fafc', 
                                                    padding: '12px 16px', borderRadius: '16px', 
                                                    border: idx === 0 ? '2px solid #facc15' : '1px solid #f1f5f9', 
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#ed8936' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx < 3 ? 'white' : '#94a3b8', fontWeight: '1000', fontSize: '12px' }}>
                                                            #{idx+1}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: '1000' }}>{item.name}</div>
                                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.role}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: '1000' }}>{item.total_points}</div>
                                                        <div style={{ fontSize: '8px', color: '#94a3b8' }}>REP</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {availableAwards.map((award, i) => (
                                                <div key={award.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px', background: 'white', border: '1.5px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: i < 3 ? '#fff7ed' : '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i < 3 ? <Trophy size={20} color="#f59e0b" /> : <Star size={20} color="#3b82f6" />}</div>
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '1000' }}>{award.title}</div>
                                                            <div style={{ fontSize: '10px', color: '#64748b' }}>{award.desc}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ background: '#eff6ff', padding: '5px 12px', borderRadius: '8px', color: '#2563eb', fontWeight: '1000', fontSize: '12px' }}>{award.rep} R</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                                borderRadius: '24px', padding: '30px', color: 'white', 
                                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <Trophy size={24} color="#facc15" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '1000', color: '#ffffff' }}>Recognition Spotlight</h3>
                                    <p style={{ margin: '10px 0 24px 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>Celebrate the champions pushing our organization forward with exceptional dedication.</p>
                                    
                                    {leaderboard.length > 0 && (
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase', marginBottom: '12px' }}>Top Contributor</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '1000', color: '#0f172a' }}>
                                                    {leaderboard[0].name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>{leaderboard[0].name}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{leaderboard[0].total_points} Reputation Points</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
