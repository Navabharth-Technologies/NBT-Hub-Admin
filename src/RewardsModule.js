import React from 'react';
import { 
    Trophy, Star, Award, ArrowLeft, Flame, 
    Plus, ChevronRight, ChevronLeft, X, Check 
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from './config';

const parsePoints = (p) => {
    if (p === null || p === undefined) return 0;
    if (typeof p === 'number') return p;
    const cleaned = String(p).replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
};

// Generates consistent elegant pastel colors based on employee name
const getAvatarStyle = (name) => {
    const colors = [
        { bg: '#e0e7ff', text: '#4f46e5' }, // Indigo
        { bg: '#fef3c7', text: '#d97706' }, // Amber
        { bg: '#d1fae5', text: '#059669' }, // Emerald
        { bg: '#fee2e2', text: '#dc2626' }, // Red
        { bg: '#f3e8ff', text: '#9333ea' }, // Purple
        { bg: '#e0f2fe', text: '#0284c7' }, // Sky
        { bg: '#ffe4e6', text: '#e11d48' }, // Rose
    ];
    let hash = 0;
    const str = name || '';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export default function RewardsModule({ onBack }) {
    const { user } = useAuth();
    const [winWidth, setWinWidth] = React.useState(window.innerWidth);
    const [rewards, setRewards] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState('feed'); // 'feed' or 'leaderboard'
    const [leaderboard, setLeaderboard] = React.useState([]);
    const [rewardNames, setRewardNames] = React.useState([]);
    const [employees, setEmployees] = React.useState([]);
    const [showAllFeed, setShowAllFeed] = React.useState(false);
    const [selectedHistoryUser, setSelectedHistoryUser] = React.useState(null);
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [availableAwards, setAvailableAwards] = React.useState([]);
    const [totalCirculating, setTotalCirculating] = React.useState(0);

    // Grant Modal states
    const [showGrantModal, setShowGrantModal] = React.useState(false);
    const [selectedEmp, setSelectedEmp] = React.useState('');
    const [selectedAward, setSelectedAward] = React.useState('');
    const [customPoints, setCustomPoints] = React.useState('');
    const [reason, setReason] = React.useState('');
    const [granting, setGranting] = React.useState(false);
    const [grantError, setGrantError] = React.useState('');
    const [grantSuccess, setGrantSuccess] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchInitialData = async () => {
        if (!user?.token) return;
        try {
            const [rewRes, awardRes, lbAdminRes, lbAllRes, empRes, userRes] = await Promise.all([
                fetch(API_ENDPOINTS.REWARDS_HISTORY, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
                fetch(API_ENDPOINTS.REWARDS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
                fetch(API_ENDPOINTS.REWARDS_LEADERBOARD, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
                fetch(API_ENDPOINTS.LEADERBOARD_ALL, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
                fetch(API_ENDPOINTS.EMPLOYEES, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
                fetch(API_ENDPOINTS.USERS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
            ]);

            if (rewRes?.ok) {
                const data = await rewRes.json().catch(() => null);
                if (data) {
                    setRewards(Array.isArray(data) ? data : (data.data || data.history || []));
                    const total = data.totalPoints || data.total_points || data.totalCirculating || data.total_circulating || 0;
                    if (total > 0) setTotalCirculating(total);
                }
            }

            let lbData = null;
            if (lbAdminRes?.ok) {
                lbData = await lbAdminRes.json().catch(() => null);
            }
            if (!lbData && lbAllRes?.ok) {
                lbData = await lbAllRes.json().catch(() => null);
            }

            if (lbData) {
                const list = Array.isArray(lbData) ? lbData : (lbData.data || []);
                setLeaderboard(list.map(item => {
                    const base = item.employee || item.user || item;
                    return {
                        ...item,
                        name: base.name || base.employee_name || base.user_name || item.name || 'Anonymous Member',
                        total_points: parsePoints(base.total_points || base.points || base.score || base.total_score || base.rep || base.reputation || item.totalPoints || item.totalScore || item.total_points || item.points)
                    };
                }));
            }

            if (awardRes?.ok) {
                const data = await awardRes.json().catch(() => null);
                if (data) {
                    const list = Array.isArray(data) ? data : (data.data || data.rewards || data.categories || []);
                    const mapped = list.map(a => ({
                        id: a.id || a._id || Math.random().toString(),
                        title: a.title || a.name || a.reward_name || 'Unnamed Reward',
                        rep: a.rep || a.points || a.reputation || 0,
                        desc: a.desc || a.description || ''
                    }));
                    setAvailableAwards(mapped);
                    setRewardNames(mapped.map(a => a.title));
                }
            }

            let allStaff = [];
            if (empRes?.ok) {
                const resJson = await empRes.json().catch(() => null);
                if (resJson) allStaff = [...allStaff, ...(Array.isArray(resJson) ? resJson : (resJson.data || []))];
            }
            if (userRes?.ok) {
                const resJson = await userRes.json().catch(() => null);
                if (resJson) allStaff = [...allStaff, ...(Array.isArray(resJson) ? resJson : (resJson.data || []))];
            }

            const unique = Array.from(new Map(allStaff.map(s => [s.id || s.employee_id || s.userId, s])).values());
            setEmployees(unique);

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
            
            const [adminRes, allRes] = await Promise.all([
                fetch(`${API_ENDPOINTS.REWARDS_LEADERBOARD}?${params.toString()}`, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
                fetch(`${API_ENDPOINTS.LEADERBOARD_ALL}?${params.toString()}`, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
            ]);

            let data = null;
            if (adminRes?.ok) data = await adminRes.json().catch(() => null);
            if (!data && allRes?.ok) data = await allRes.json().catch(() => null);

            if (data) {
                const list = Array.isArray(data) ? data : (data.data || []);
                setLeaderboard(list.map(item => {
                    const base = item.employee || item.user || item;
                    return {
                        ...item,
                        name: base.name || base.employee_name || base.user_name || item.name || 'Anonymous Member',
                        total_points: parsePoints(base.total_points || base.points || base.score || base.total_score || base.rep || base.reputation || item.totalPoints || item.totalScore || item.total_points || item.points)
                    };
                }));
            }
        } catch (err) { setLeaderboard([]); }
    };

    React.useEffect(() => {
        if (startDate || endDate) {
            fetchLeaderboard();
        }
    }, [startDate, endDate]);

    const filteredRewards = rewards.filter(r => {
        if (!startDate && !endDate) return true;
        const rDate = (r.created_at || r.date || "").split('T')[0];
        if (!rDate) return true;
        if (startDate && rDate < startDate) return false;
        if (endDate && rDate > endDate) return false;
        return true;
    });

    const handleAwardChange = (awardId) => {
        setSelectedAward(awardId);
        const award = availableAwards.find(a => String(a.id) === String(awardId));
        if (award) {
            setCustomPoints(String(award.rep || award.points || 0));
        }
    };

    const handleGrantSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmp || !selectedAward || !customPoints) {
            setGrantError('Please fill out all required fields.');
            return;
        }
        
        const emp = employees.find(e => String(e.id || e.employee_id || e.userId) === String(selectedEmp));
        const award = availableAwards.find(a => String(a.id) === String(selectedAward));
        if (!emp || !award) {
            setGrantError('Invalid Employee or Award selection.');
            return;
        }
        
        setGranting(true);
        setGrantError('');
        
        try {
            const body = {
                employee_id: selectedEmp,
                userId: selectedEmp,
                emp_id: selectedEmp,
                
                reward_name: award.title,
                reward_title: award.title,
                title: award.title,
                
                points: Number(customPoints),
                rep: Number(customPoints),
                amount: Number(customPoints),
                
                reason: reason || `Awarded ${award.title}`,
                desc: reason || `Awarded ${award.title}`,
                description: reason || `Awarded ${award.title}`
            };
            
            const res = await fetch(API_ENDPOINTS.REWARDS_GIVE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(body)
            });
            
            if (res.ok) {
                setGrantSuccess(true);
                setTimeout(() => {
                    setShowGrantModal(false);
                    setGrantSuccess(false);
                    setSelectedEmp('');
                    setSelectedAward('');
                    setCustomPoints('');
                    setReason('');
                    fetchInitialData();
                }, 1800);
            } else {
                const errJson = await res.json().catch(() => null);
                setGrantError(errJson?.message || errJson?.error || 'Failed to grant award. Please try again.');
            }
        } catch (err) {
            setGrantError('Network error. Failed to grant award.');
        } finally {
            setGranting(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif", padding: winWidth < 768 ? '15px' : '30px', minHeight: '100vh', boxSizing: 'border-box' }}>

            <main style={{ flex: 1 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    
                    {/* Header Controls */}
                    <div style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 600 ? 'stretch' : 'center', marginBottom: '24px', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div onClick={onBack || (() => {})} style={{ cursor: onBack ? 'pointer' : 'pointer', background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                                <ArrowLeft size={16} color="#475569" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: winWidth < 768 ? '20px' : '26px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.8px' }}>Awards & Recognition</h1>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Manage employee achievements and reputation points</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: winWidth < 600 ? '100%' : 'auto', justifyContent: 'flex-start', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', width: winWidth < 600 ? '100%' : 'auto', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>From</span>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '11px', fontWeight: '700', outline: 'none', width: '95px', color: '#334155' }} />
                                </div>
                                <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>To</span>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '11px', fontWeight: '700', outline: 'none', width: '95px', color: '#334155' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* High-Fidelity Premium Banner */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c0519 100%)', 
                        borderRadius: '24px', 
                        padding: winWidth < 768 ? '24px 20px' : '35px 50px', 
                        display: 'grid', 
                        gridTemplateColumns: winWidth < 600 ? '1fr' : (winWidth < 900 ? '1fr 1fr' : '1fr 1fr 1fr'), 
                        gap: '24px',
                        alignItems: 'center', 
                        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)',
                        marginBottom: '32px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '50%', height: '200%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', transform: 'rotate(-30deg)', opacity: 0.7 }}></div>
                        <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: '50%', height: '200%', background: 'radial-gradient(circle, rgba(219, 39, 119, 0.1) 0%, transparent 70%)', opacity: 0.7 }}></div>

                        {/* Current Rank */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderRight: winWidth < 900 ? 'none' : '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.06)', width: '50px', height: '50px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={winWidth < 768 ? 22 : 28} color="#fbbf24" style={{ filter: 'drop-shadow(0 4px 6px rgba(251, 191, 36, 0.25))' }} />
                            </div>
                            <div>
                                <p style={{ margin: '0 0 3px 0', fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Member Status</p>
                                <h3 style={{ margin: 0, fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#ffffff' }}>Active Hub</h3>
                            </div>
                        </div>

                        {/* Points Display */}
                        <div style={{ textAlign: winWidth < 600 ? 'left' : 'center', borderRight: winWidth < 900 ? 'none' : '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                            <p style={{ margin: '0 0 3px 0', fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Top Contributor Score</p>
                            <h3 style={{ margin: 0, fontSize: winWidth < 768 ? '20px' : '28px', fontWeight: '950', color: '#fbbf24' }}>
                                {leaderboard[0] ? parsePoints(leaderboard[0].total_points).toLocaleString() : '0'} <span style={{ fontSize: '14px', color: '#fcd34d', fontWeight: '800' }}>REP</span>
                            </h3>
                        </div>

                        {/* Leaderboard Score */}
                        <div style={{ textAlign: winWidth < 900 ? 'left' : 'right', gridColumn: winWidth < 900 && winWidth >= 600 ? 'span 2' : 'auto' }}>
                            <p style={{ margin: '0 0 3px 0', fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Top Recognition</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: winWidth < 900 ? 'flex-start' : 'flex-end', gap: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: winWidth < 768 ? '16px' : '20px', fontWeight: '950', color: '#ffffff' }}>
                                    {leaderboard[0] ? leaderboard[0].name : "Syncing..."}
                                </h3>
                                <Star size={18} color="#fbbf24" fill="#fbbf24" />
                            </div>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: winWidth < 1200 ? '1fr' : '1fr 380px', gap: '30px' }}>
                        
                        {/* Global Rewards Main Card */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: winWidth < 768 ? '18px' : '30px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -15px rgba(0,0,0,0.03)' }}>
                            
                            {/* Visual Tabs Selector */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                <button 
                                    onClick={() => { setView('feed'); setSelectedHistoryUser(null); }}
                                    style={{ 
                                        padding: '10px 20px', 
                                        borderRadius: '10px', 
                                        fontSize: '13px', 
                                        fontWeight: '800', 
                                        border: 'none', 
                                        background: view === 'feed' ? '#eef2ff' : 'transparent', 
                                        color: view === 'feed' ? '#4f46e5' : '#64748b', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Flame size={15} /> Live Feed
                                </button>
                                <button 
                                    onClick={() => { setView('leaderboard'); setSelectedHistoryUser(null); }}
                                    style={{ 
                                        padding: '10px 20px', 
                                        borderRadius: '10px', 
                                        fontSize: '13px', 
                                        fontWeight: '800', 
                                        border: 'none', 
                                        background: view === 'leaderboard' ? '#eef2ff' : 'transparent', 
                                        color: view === 'leaderboard' ? '#4f46e5' : '#64748b', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Trophy size={15} /> Leaderboard Standings
                                </button>
                            </div>

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Syncing rewards database...</div>
                                </div>
                            ) : (
                                <>
                                    {/* View 1: Live Feed */}
                                    {view === 'feed' && (
                                        <>
                                            {!selectedHistoryUser ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div>
                                                            <h2 style={{ margin: 0, fontSize: winWidth < 480 ? '16px' : '18px', fontWeight: '1000', color: '#0f172a', letterSpacing: '-0.3px' }}>Recent Recognitions</h2>
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Click on a member to view their complete achievements</p>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {Array.from(new Set(filteredRewards.map(r => r.employee_id || r.userId))).length > 5 && (
                                                                <button 
                                                                    onClick={() => setShowAllFeed(!showAllFeed)}
                                                                    style={{ 
                                                                        background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', textDecoration: 'none' 
                                                                    }}>
                                                                    {showAllFeed ? 'Show Less' : 'View All'}
                                                                </button>
                                                            )}
                                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', background: '#eff6ff', padding: '5px 10px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                                                                {Array.from(new Set(filteredRewards.map(r => r.employee_id || r.userId))).length} Active Members
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {filteredRewards.length === 0 ? (
                                                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                                                            <Award size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                                                            <div style={{ fontSize: '13px', fontWeight: '700' }}>No recognitions found</div>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Try adjusting your date filters.</div>
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            const employeeStats = Array.from(new Set(filteredRewards.map(r => r.employee_id || r.userId))).map(id => {
                                                                const userRewards = filteredRewards.filter(r => String(r.employee_id || r.userId) === String(id));
                                                                const lbEntry = leaderboard.find(l => String(l.id || l.employee_id || l.userId) === String(id));
                                                                
                                                                const totalRep = lbEntry ? parsePoints(lbEntry.total_points) : userRewards.reduce((sum, r) => {
                                                                    const p = r.points || r.rep || r.reward_points || r.points_earned || r.value || r.amount || 0;
                                                                    return sum + parsePoints(p);
                                                                }, 0);
                                                                return { id, totalRep, userRewards };
                                                            }).sort((a, b) => b.totalRep - a.totalRep);

                                                            const displayedStats = showAllFeed ? employeeStats : employeeStats.slice(0, 5);
                                                            
                                                            return displayedStats.map(({ id: empId, totalRep, userRewards }, idx) => {
                                                                const latest = userRewards.reduce((prev, current) => (new Date(prev.created_at || prev.date) > new Date(current.created_at || current.date)) ? prev : current, userRewards[0]);
                                                                const empName = resolveEmployeeName(empId);
                                                                const avatar = getAvatarStyle(empName);

                                                                return (
                                                                    <div 
                                                                        key={empId} 
                                                                        onClick={() => setSelectedHistoryUser(empId)} 
                                                                        style={{ 
                                                                            background: '#white', 
                                                                            padding: winWidth < 768 ? '14px' : '18px', 
                                                                            borderRadius: '20px', 
                                                                            border: '1px solid #f1f5f9', 
                                                                            cursor: 'pointer', 
                                                                            display: 'flex', 
                                                                            justifyContent: 'space-between', 
                                                                            alignItems: 'center', 
                                                                            transition: 'all 0.2s',
                                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                                                                        }} 
                                                                        onMouseEnter={e => {
                                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                                            e.currentTarget.style.borderColor = '#dbeafe';
                                                                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.04)';
                                                                        }} 
                                                                        onMouseLeave={e => {
                                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                                            e.currentTarget.style.borderColor = '#f1f5f9';
                                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)';
                                                                        }}
                                                                    >
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                                            <div style={{ 
                                                                                width: '42px', 
                                                                                height: '42px', 
                                                                                borderRadius: '12px', 
                                                                                background: avatar.bg, 
                                                                                color: avatar.text, 
                                                                                display: 'flex', 
                                                                                alignItems: 'center', 
                                                                                justifyContent: 'center', 
                                                                                fontSize: '15px', 
                                                                                fontWeight: '900',
                                                                                flexShrink: 0
                                                                            }}>
                                                                                {empName.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <div style={{ fontSize: winWidth < 480 ? '13px' : '15px', fontWeight: '800', color: '#0f172a' }}>{empName}</div>
                                                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '1px' }}>
                                                                                    {userRewards.length} awards • Latest: <span style={{ fontWeight: '700', color: '#475569' }}>{latest.reward_name || 'Team Growth'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <div style={{ textAlign: 'right' }}>
                                                                                <div style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>+{totalRep.toLocaleString()}</div>
                                                                                <div style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REP</div>
                                                                            </div>
                                                                            <ChevronRight size={16} color="#cbd5e1" />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()
                                                    )}
                                                </div>
                                            ) : (
                                                /* User Awards Detail View */
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                                        <button 
                                                            onClick={() => setSelectedHistoryUser(null)} 
                                                            style={{ 
                                                                border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: '800', fontSize: '13px' 
                                                            }}
                                                        >
                                                            <ChevronLeft size={16}/> Back to Feed
                                                        </button>
                                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                                                            {resolveEmployeeName(selectedHistoryUser)}'s Timeline
                                                        </div>
                                                    </div>
                                                    
                                                    {filteredRewards.filter(r => String(r.employee_id || r.userId) === String(selectedHistoryUser)).length === 0 ? (
                                                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' }}>No records inside filter bounds.</div>
                                                    ) : (
                                                        filteredRewards.filter(r => String(r.employee_id || r.userId) === String(selectedHistoryUser)).map((r, i) => (
                                                            <div key={i} style={{ padding: '16px', borderRadius: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <Award size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>{r.reward_name || 'Excellence Recognition'}</div>
                                                                        {r.reason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>"{r.reason}"</div>}
                                                                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>
                                                                            {new Date(r.created_at || r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                                                                    +{parsePoints(r.points || r.rep || r.reward_points || r.points_earned).toLocaleString()} REP
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* View 2: Leaderboard rankings */}
                                    {view === 'leaderboard' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <div>
                                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '1000', color: '#0f172a' }}>Global Standings</h2>
                                                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>Ranks based on accumulated reputation points</p>
                                                </div>
                                            </div>
                                            {leaderboard.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>No rankings available.</div>
                                            ) : (
                                                leaderboard.map((item, idx) => {
                                                    const rank = idx + 1;
                                                    const avatar = getAvatarStyle(item.name);
                                                    
                                                    const topScore = parsePoints(leaderboard[0]?.total_points) || 1;
                                                    const currentScore = parsePoints(item.total_points);
                                                    const pct = Math.min(100, Math.max(5, (currentScore / topScore) * 100));
                                                    
                                                    return (
                                                        <div key={item.id || item.employee_id || item.userId || idx} style={{ 
                                                            background: 'white', 
                                                            padding: '16px', 
                                                            borderRadius: '20px', 
                                                            border: rank <= 3 ? '1.5px solid #bfdbfe' : '1px solid #f1f5f9', 
                                                            boxShadow: rank <= 3 ? '0 4px 12px rgba(59, 130, 246, 0.03)' : 'none',
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '15px'
                                                        }}>
                                                            {/* Rank Badge */}
                                                            <div style={{ 
                                                                width: '32px', 
                                                                height: '32px', 
                                                                borderRadius: '50%', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                fontSize: '14px', 
                                                                fontWeight: '900',
                                                                background: rank === 1 ? '#fef08a' : rank === 2 ? '#f1f5f9' : rank === 3 ? '#ffe4e6' : 'transparent',
                                                                color: rank === 1 ? '#a16207' : rank === 2 ? '#475569' : rank === 3 ? '#be123c' : '#64748b',
                                                                border: rank <= 3 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                                                flexShrink: 0
                                                            }}>
                                                                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                                                            </div>
                                                            
                                                            {/* User Avatar */}
                                                            <div style={{ 
                                                                width: '40px', 
                                                                height: '40px', 
                                                                borderRadius: '12px', 
                                                                background: avatar.bg, 
                                                                color: avatar.text, 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                fontSize: '15px', 
                                                                fontWeight: '900',
                                                                flexShrink: 0
                                                            }}>
                                                                {item.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            
                                                            {/* Info & Bar */}
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{item.name}</div>
                                                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#3b82f6' }}>{currentScore.toLocaleString()} <span style={{ fontSize: '9px', color: '#94a3b8' }}>REP</span></div>
                                                                </div>
                                                                <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                                    <div style={{ 
                                                                        width: `${pct}%`, 
                                                                        height: '100%', 
                                                                        background: rank === 1 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 'linear-gradient(90deg, #64748b, #cbd5e1)',
                                                                        borderRadius: '3px'
                                                                    }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right Sidebar - Highlight Top & Action Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* Recognition Spotlight Banner */}
                            <div style={{ 
                                background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)', 
                                borderRadius: '24px', 
                                padding: '30px', 
                                color: 'white', 
                                boxShadow: '0 15px 30px -10px rgba(30, 27, 75, 0.25)',
                                position: 'relative', 
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}></div>
                                
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.08)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Trophy size={22} color="#fbbf24" style={{ filter: 'drop-shadow(0 4px 6px rgba(251, 191, 36, 0.2))' }} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.3px' }}>Hub Spotlight</h3>
                                    <p style={{ margin: '8px 0 24px 0', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', fontWeight: '500' }}>Recognize employee accomplishments by granting awards and points.</p>
                                    
                                    {leaderboard.length > 0 ? (
                                        <>
                                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
                                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Top Contributor</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '1000', color: '#0f172a' }}>
                                                        {leaderboard[0].name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>{leaderboard[0].name}</div>
                                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: '600' }}>
                                                            {parsePoints(leaderboard[0].total_points).toLocaleString()} Reputation Points
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setGrantError('');
                                                    setGrantSuccess(false);
                                                    setShowGrantModal(true);
                                                }}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '14px', 
                                                    borderRadius: '12px', 
                                                    border: 'none', 
                                                    backgroundColor: '#ffffff', 
                                                    color: '#0f172a', 
                                                    fontWeight: '900', 
                                                    fontSize: '12px', 
                                                    textTransform: 'uppercase', 
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,255,255,0.15)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.1)';
                                                }}
                                            >
                                                <Plus size={16} /> Grant Recognition
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>Loading top stats...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* HIGH-FIDELITY GRANT RECOGNITION MODAL */}
            {showGrantModal && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                    backdropFilter: 'blur(4px)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{ 
                        background: 'white', 
                        borderRadius: '24px', 
                        width: '100%', 
                        maxWidth: '520px', 
                        padding: winWidth < 500 ? '20px' : '30px', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.3px' }}>Grant Recognition</h3>
                                    <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Reward points to employee profiles</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowGrantModal(false)}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {grantSuccess ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '15px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                                    <Check size={32} strokeWidth={3} />
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>Recognition Granted!</div>
                                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', maxWidth: '280px' }}>Points have been successfully credited to the employee profile.</div>
                            </div>
                        ) : (
                            <form onSubmit={handleGrantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                
                                {/* Select Employee */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Employee *</label>
                                    <select 
                                        value={selectedEmp}
                                        onChange={e => setSelectedEmp(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none', background: 'white' }}
                                    >
                                        <option value="">-- Choose employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id || emp.employee_id || emp.userId} value={emp.id || emp.employee_id || emp.userId}>
                                                {emp.name || emp.employee_name || 'Unnamed Member'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Select Award Category */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Award Category *</label>
                                    <select 
                                        value={selectedAward}
                                        onChange={e => handleAwardChange(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none', background: 'white' }}
                                    >
                                        <option value="">-- Choose award category --</option>
                                        {availableAwards.map(aw => (
                                            <option key={aw.id} value={aw.id}>
                                                {aw.title} ({aw.rep} REP)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Points */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reputation Points *</label>
                                    <input 
                                        type="number"
                                        value={customPoints}
                                        onChange={e => setCustomPoints(e.target.value)}
                                        required
                                        placeholder="Points to award"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Reason Message */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason / Message (Optional)</label>
                                    <textarea 
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="Add a custom message about their achievement..."
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {grantError && (
                                    <div style={{ fontSize: '12px', color: '#e11d48', fontWeight: '700', backgroundColor: '#fff1f2', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ffe4e6' }}>
                                        ⚠️ {grantError}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setShowGrantModal(false)}
                                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={granting}
                                        style={{ 
                                            padding: '12px 24px', 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', 
                                            color: 'white', 
                                            fontSize: '13px', 
                                            fontWeight: '800', 
                                            cursor: granting ? 'not-allowed' : 'pointer',
                                            opacity: granting ? 0.7 : 1,
                                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                        }}
                                    >
                                        {granting ? 'Granting...' : 'Grant Award'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
