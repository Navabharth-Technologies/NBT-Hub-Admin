import React, { useState, useEffect } from 'react';
import { Search, Mail, Fingerprint, MapPin, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from './config';

export default function UserManagement({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_ENDPOINTS.USERS, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
           setUsers(data.map(u => ({
             ...u,
             id: u.id || u._id || 'N/A',
             status: u.status || 'Active',
             team: u.team || 'General',
             role: u.role || 'Member'
           })));
        } else {
           setUsers([]);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const [winWidth, setWinWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winWidth < 768;

  const filteredUsers = users.filter(u => 
    (selectedDepartment === 'All' || u.team === selectedDepartment) &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.team.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const departments = ['All', ...new Set(users.map(u => u.team).filter(Boolean))];

  const styles = {
    container: { fontFamily: 'system-ui, -apple-system, sans-serif', padding: isMobile ? '20px' : '40px', backgroundColor: '#F8FAFC', minHeight: '100vh', boxSizing: 'border-box' },
    searchBarContainer: { 
      display: 'flex', 
      gap: '15px', 
      marginBottom: '25px', 
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center'
    },
    searchWrapper: { 
      flex: 1, 
      display: 'flex', 
      alignItems: 'center', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '0 15px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      border: '2px solid #bfdbfe'
    },
    searchInput: { 
      flex: 1, 
      border: 'none', 
      padding: '12px', 
      fontSize: '14px', 
      outline: 'none', 
      background: 'transparent' 
    },
    filterBtn: { 
      padding: '12px 20px', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      border: '2px solid #bfdbfe', 
      fontSize: '14px', 
      fontWeight: '600', 
      color: '#4338ca',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    grid: { 
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
      gap: '24px',
      position: 'relative'
    },
    card: (isSelected) => ({ 
      backgroundColor: 'white', 
      borderRadius: '20px', 
      padding: '24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px',
      boxShadow: isSelected ? '0 30px 60px rgba(49,90,158,0.2)' : '0 8px 20px rgba(49,90,158,0.06)',
      border: isSelected ? '3px solid #315A9E' : '2px solid #bfdbfe',
      cursor: 'pointer',
      position: 'relative',
      zIndex: isSelected ? 100 : 1
    }),
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    avatar: { 
      width: '48px', 
      height: '48px', 
      borderRadius: '12px', 
      backgroundColor: '#EFF6FF', 
      color: '#315A9E', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '18px', 
      fontWeight: '900' 
    },
    status: { 
      fontSize: '9px', 
      fontWeight: '800', 
      textTransform: 'uppercase', 
      color: '#10B981', 
      backgroundColor: '#F0FDF4', 
      padding: '4px 8px', 
      borderRadius: '6px' 
    },
    nameStack: { display: 'flex', flexDirection: 'column' },
    name: { fontSize: isMobile ? '18px' : '16px', fontWeight: '900', color: '#0F172A' },
    role: { fontSize: isMobile ? '13px' : '11px', fontWeight: '800', color: '#64748B' },
    detailRow: { display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B' },
    detailIcon: { color: '#94A3B8' },
    detailText: { fontSize: isMobile ? '14px' : '12px', fontWeight: '600', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    actionBtn: { 
      width: '100%', 
      marginTop: '8px', 
      padding: isMobile ? '14px' : '10px', 
      backgroundColor: '#F8FAFC', 
      color: '#315A9E', 
      border: 'none', 
      borderRadius: '12px', 
      fontSize: isMobile ? '13px' : '11px', 
      fontWeight: '900', 
      textTransform: 'uppercase', 
      cursor: 'pointer',
      letterSpacing: '0.5px'
    }
  };

  return (
    <div style={styles.container} onClick={() => { setSelectedUserId(null); setShowDropdown(false); }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        {onBack && (
          <div 
            onClick={onBack} 
            style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eef2f6' }}
          >
            <ArrowLeft size={20} color="#64748b" />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Employees</h1>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={12} color="#10B981" /> 
            NAVABHARATH TECHNOLOGIES, 2nd Floor, 667/B, Chitrabhanu Road, Kuvempu Nagara, Mysuru, Karnataka 570023
          </div>
        </div>
      </div>
      <div style={styles.searchBarContainer}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94A3B8" />
          <input 
            style={styles.searchInput} 
            placeholder="Search by name, role, or team..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        {!isMobile && (
          <div style={{ position: 'relative' }}>
            <button 
              style={styles.filterBtn} 
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            >
              {selectedDepartment === 'All' ? 'Departments' : selectedDepartment} <ChevronRight size={14} style={{ transform: showDropdown ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, minWidth: '180px', overflow: 'hidden' }}
                >
                  {departments.map(dept => (
                    <div 
                      key={dept} 
                      onClick={(e) => { e.stopPropagation(); setSelectedDepartment(dept); setShowDropdown(false); }}
                      style={{ padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: selectedDepartment === dept ? '800' : '600', color: selectedDepartment === dept ? '#4338ca' : '#64748b', borderBottom: '1px solid #f1f5f9', backgroundColor: selectedDepartment === dept ? '#eff6ff' : 'white', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDepartment === dept ? '#eff6ff' : 'white'}
                    >
                      {dept}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', fontWeight: '800', color: '#64748B' }}>Synchronizing Directory...</div>
      ) : (
        <div style={styles.grid}>
          {filteredUsers.map(user => (
            <motion.div 
              key={user.id} 
              layout
              onClick={(e) => { e.stopPropagation(); setSelectedUserId(selectedUserId === user.id ? null : user.id); }}
              animate={{ 
                scale: selectedUserId === user.id ? 1.08 : 1,
                zIndex: selectedUserId === user.id ? 50 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={styles.card(selectedUserId === user.id)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>{user.name[0]}</div>
                <span style={styles.status}>ACTIVE</span>
              </div>
              
              <div style={styles.nameStack}>
                <div style={styles.name}>{user.name}</div>
                <div style={styles.role}>{user.role}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
                <div style={styles.detailRow}><MapPin size={14} style={styles.detailIcon} /><span style={styles.detailText}>{user.team}</span></div>
                <div style={styles.detailRow}><Mail size={14} style={styles.detailIcon} /><span style={styles.detailText}>{user.email}</span></div>
                <div style={styles.detailRow}><Fingerprint size={14} style={styles.detailIcon} /><span style={styles.detailText}>{user.id}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
