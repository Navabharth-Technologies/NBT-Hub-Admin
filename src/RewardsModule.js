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
        fetchGrantedHistory();
    }, [user]);

    const fetchGrantedHistory = async () => {
        if (!user?.token) return;
        try {
            const res = await fetch(API_ENDPOINTS.REWARDS_HISTORY, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (res.ok) {
                const data = await res.json();
                const historyData = Array.isArray(data) ? data : (data.data || []);
                const uid = user?.employee_id || user?.userId || user?.id;
                const myGrants = historyData.filter(r => String(r.granted_by) === String(uid));
                setHistory({ pm: myGrants });
            }
        } catch (err) {}
    };

    const showFeedback = (msg, type) => {
        setFeedback({ msg, type });
        setTimeout(() => setFeedback(null), 3000);
    };

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
        <div style={{ backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>

            <main style={{ flex: 1 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    
                    {/* Header Controls */}

                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <button onClick={() => setSelectedHistoryUser(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '800' }}><ChevronLeft size={16}/> Back to Feed</button>
                                            {filteredRewards.filter(r => String(r.employee_id) === String(selectedHistoryUser)).map((r, i) => (
                                                <div key={i} style={{ padding: '20px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <div style={{ fontWeight: '1000' }}>{r.reward_name || 'Excellence'}</div>
                                                        <div style={{ color: '#38bdf8', fontWeight: '1000' }}>+{r.points} REP</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : view === 'leaderboard' ? (
                                <div style={{ 
                                    maxHeight: '650px', 
                                    overflowY: 'auto', 
                                    paddingRight: '15px',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '10px',
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#e2e8f0 transparent'
                                }} className="custom-scroll">
                                    {leaderboard.map((item, idx) => (
                                        <div key={idx} style={{ 
                                            background: idx === 0 ? 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' : idx < 3 ? 'white' : '#f8fafc', 
                                            padding: winWidth < 768 ? (idx < 3 ? '15px 15px' : '12px 15px') : (idx < 3 ? '20px 25px' : '15px 20px'), 
                                            borderRadius: idx < 3 ? '20px' : '16px', 
                                            border: idx === 0 ? '2px solid #facc15' : '1px solid #f1f5f9', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            boxShadow: idx === 0 ? '0 10px 15px -3px rgba(250, 204, 21, 0.1)' : 'none',
                                            transition: 'transform 0.2s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 768 ? '12px' : (idx < 3 ? '20px' : '15px') }}>
                                                <div style={{ 
                                                    width: winWidth < 768 ? '30px' : (idx < 3 ? '40px' : '30px'), 
                                                    height: winWidth < 768 ? '30px' : (idx < 3 ? '40px' : '30px'), 
                                                    borderRadius: idx < 3 ? '12px' : '8px', 
                                                    background: idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#ed8936' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: idx < 3 ? 'white' : '#94a3b8', 
                                                    fontWeight: '1000', 
                                                    fontSize: winWidth < 768 ? '13px' : (idx < 3 ? '18px' : '13px'),
                                                    boxShadow: idx < 3 ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                                                }}>
                                                    #{idx+1}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: winWidth < 480 ? '11px' : (winWidth < 768 ? '13px' : (idx < 3 ? '15px' : '13px')), fontWeight: '1000', color: idx < 3 ? '#0f172a' : '#334155' }}>{item.name}</div>
                                                    <div style={{ fontSize: winWidth < 480 ? '8px' : '10px', color: '#94a3b8', fontWeight: '700' }}>{item.role}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: winWidth < 768 ? '14px' : (idx < 3 ? '18px' : '14px'), fontWeight: '1000', color: idx < 3 ? '#0f172a' : '#475569' }}>{item.total_points}</div>
                                                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>REP</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {availableAwards.map((award, i) => (
                                        <div key={award.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: winWidth < 768 ? '16px' : '24px', borderRadius: '24px', background: 'white', border: '1.5px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 768 ? '12px' : '20px' }}>
                                                <div style={{ width: winWidth < 768 ? '40px' : '50px', height: winWidth < 768 ? '40px' : '50px', borderRadius: '14px', background: i < 3 ? '#fff7ed' : '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i < 3 ? <Trophy size={winWidth < 768 ? 20 : 24} color="#f59e0b" /> : <Star size={winWidth < 768 ? 20 : 24} color="#3b82f6" />}</div>
                                                <div>
                                                    <div style={{ fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '1000' }}>{award.title}</div>
                                                    <div style={{ fontSize: winWidth < 768 ? '10px' : '12px', color: '#64748b', fontWeight: '700' }}>{award.desc}</div>
                                                </div>
                                            </div>
                                            <div style={{ background: '#eff6ff', padding: winWidth < 768 ? '6px 12px' : '10px 25px', borderRadius: '12px', color: '#2563eb', fontWeight: '1000', fontSize: winWidth < 768 ? '12px' : '14px' }}>{award.rep} R</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', height: '100%' }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                                borderRadius: winWidth < 768 ? '30px' : '40px', padding: winWidth < 768 ? '40px 25px' : '50px 40px', color: 'white', 
                                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                                position: 'relative', overflow: 'hidden',
                                height: '100%', minHeight: winWidth < 768 ? 'auto' : '520px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                            }}>
                                {/* Decorative elements */}
                                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '200px', height: '200px', background: 'rgba(250, 204, 21, 0.05)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', width: winWidth < 480 ? '45px' : '60px', height: winWidth < 480 ? '45px' : '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: winWidth < 768 ? '20px' : '30px' }}>
                                        <Trophy size={winWidth < 480 ? 24 : 30} color="#facc15" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: winWidth < 480 ? '18px' : (winWidth < 768 ? '24px' : '28px'), fontWeight: '1000', letterSpacing: '-0.8px', color: '#ffffff', lineHeight: '1.2' }}>Recognition Spotlight</h3>
                                    <p style={{ margin: winWidth < 768 ? '10px 0 30px 0' : '15px 0 40px 0', fontSize: winWidth < 480 ? '12px' : (winWidth < 768 ? '14px' : '15px'), color: '#94a3b8', fontWeight: '600', lineHeight: '1.7' }}>Celebrate the champions pushing our organization forward with exceptional dedication and vision.</p>
                                    
                                    {leaderboard.length > 0 && (
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: winWidth < 480 ? '15px' : '25px', borderRadius: '24px', border: '1.5px solid rgba(255,255,255,0.1)', marginBottom: '40px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '15px' }}>Top Contributor</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 480 ? '12px' : '20px' }}>
                                                <div style={{ width: winWidth < 480 ? '40px' : '55px', height: winWidth < 480 ? '40px' : '55px', borderRadius: '14px', background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: winWidth < 480 ? '18px' : '22px', fontWeight: '1000', color: '#0f172a' }}>
                                                    {leaderboard[0].name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: winWidth < 480 ? '14px' : '17px', fontWeight: '900', color: '#ffffff' }}>{leaderboard[0].name}</div>
                                                    <div style={{ fontSize: winWidth < 480 ? '10px' : '12px', color: '#94a3b8', fontWeight: '700' }}>{leaderboard[0].total_points} Reputation Points</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Removed Grant Recognition button for Super Admin GET-only view */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
}
