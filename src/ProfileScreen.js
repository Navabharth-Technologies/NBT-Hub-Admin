import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  Mail, User, Calendar, Users, Edit3, Fingerprint, Camera, Phone, Check, Send, Database, ArrowLeft,
  Shield, CheckSquare, Server, Lock, Cpu, Globe, RefreshCw, X, LogOut
} from 'lucide-react';
import { API_ENDPOINTS, BASE_URL } from './config';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS — persist data locally as a safety net
// ─────────────────────────────────────────────────────────────────────────────
const LS_KEY = 'nbt_profile_data';
function loadLocalProfile() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function saveLocalProfile(patch) {
  const current = loadLocalProfile();
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...patch }));
}

// Helper date format conversions for HTML5 <input type="date">
function convertToInputDateFormat(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr; // Already in YYYY-MM-DD format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

function convertToDisplayDateFormat(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr; // Already in DD/MM/YYYY format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export default function ProfileScreen({ onBack }) {
  const { user, logout } = useAuth();
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  // Editing states
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const local = loadLocalProfile();

  const [name, setName] = useState(local.name || user?.name || '');
  const [role, setRole] = useState(local.role || user?.role || '');
  const [employeeId, setEmployeeId] = useState(local.employee_id || user?.employee_id || user?.employeeId || '');
  const [phone, setPhone] = useState(local.phone_number || user?.phone_number || user?.phoneNumber || '');
  const [aboutMe, setAboutMe] = useState(local.about_me || user?.about_me || user?.aboutMe || '');
  const [dob, setDob] = useState(local.date_of_birth || user?.date_of_birth || user?.dateOfBirth || '');
  const [profileImage, setProfileImage] = useState(local.profile_image || null);
  const [reportingManager, setReportingManager] = useState({
    name: local.reporting_manager_name || '',
    id: local.reporting_manager_id || ''
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Backup values for edit cancellations
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempDob, setTempDob] = useState('');
  const [tempAboutMe, setTempAboutMe] = useState('');

  const fileInputRef = useRef(null);

  // ── Fetch live profile from DB on load ──────────────────────────────────────
  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!user?.email) return;
      try {
        const rawToken = user?.token || localStorage.getItem('token');
        const token = String(rawToken || '').trim();
        if (!token || token === 'undefined' || token === 'null') return;
        const response = await fetch(API_ENDPOINTS.PROFILE(user.email), {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedName = data.name || '';
          const fetchedRole = data.role || '';
          const fetchedEmpId = data.employeeId || data.employee_id || '';
          const fetchedPhone = data.phoneNumber || data.phone_number || '';
          const fetchedAbout = data.aboutMe || data.about_me || '';
          const fetchedDob = data.date_of_birth || data.dateOfBirth || '';
          const managerName = data.reportingManagerName || data.manager || '';
          const managerId = data.reportingManagerId || '';

          if (fetchedName) setName(fetchedName);
          if (fetchedRole) setRole(fetchedRole);
          if (fetchedEmpId) setEmployeeId(fetchedEmpId);
          if (fetchedPhone) setPhone(fetchedPhone);
          if (fetchedAbout) setAboutMe(fetchedAbout);
          if (fetchedDob) setDob(fetchedDob);
          if (managerName) setReportingManager({ name: managerName, id: managerId });

          const remoteImg = data.profile_image || data.profile_picture || data.profilePicture || data.avatar;
          let fullSrc = remoteImg || null;
          if (remoteImg) {
            if (!remoteImg.startsWith('data:') && !remoteImg.startsWith('blob:') && !remoteImg.startsWith('http')) {
              fullSrc = `${BASE_URL}${remoteImg.startsWith('/') ? '' : '/'}${remoteImg}`;
            }
            setProfileImage(fullSrc);
          }

          // Keep local storage cache fresh
          saveLocalProfile({
            name: fetchedName || name,
            role: fetchedRole || role,
            employee_id: fetchedEmpId || employeeId,
            phone_number: fetchedPhone || phone,
            about_me: fetchedAbout || aboutMe,
            date_of_birth: fetchedDob || dob,
            profile_image: fullSrc || profileImage,
            reporting_manager_name: managerName || reportingManager.name,
            reporting_manager_id: managerId || reportingManager.id
          });
        }
      } catch (err) {
        console.warn('Profile fetch failed, using cached data.');
      }
    };
    fetchFullProfile();
  }, [user?.email]);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateProfileField = async (fieldName, value) => {
    let patch = {};
    if (fieldName === 'phone') patch.phone_number = value;
    else if (fieldName === 'dob') patch.date_of_birth = value;
    else if (fieldName === 'aboutMe') patch.about_me = value;
    else if (fieldName === 'name') patch.name = value;
    else if (fieldName === 'employeeId') patch.employee_id = value;
    saveLocalProfile(patch);

    try {
      const rawToken = user?.token || localStorage.getItem('token');
      const token = String(rawToken || '').trim();

      const payload = {
        email: user?.email,
        id: user?.id || user?.employee_id
      };

      if (fieldName === 'phone') {
        payload.phoneNumber = value;
        payload.phone_number = value;
      } else if (fieldName === 'dob') {
        payload.dateOfBirth = value;
        payload.date_of_birth = value;
      } else if (fieldName === 'aboutMe') {
        payload.aboutMe = value;
        payload.about_me = value;
      } else if (fieldName === 'name') {
        payload.name = value;
      } else if (fieldName === 'employeeId') {
        payload.employeeId = value;
        payload.employee_id = value;
      }

      setIsSyncing(true);
      const response = await fetch(API_ENDPOINTS.PROFILE_UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token && token !== 'undefined' && token !== 'null' ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`Database sync: ${fieldName} updated successfully.`);
      } else {
        console.warn(`Database sync failed: ${response.status}`);
      }
    } catch (err) {
      console.warn(`Network sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Edit flows
  const startEditingName = () => { setTempName(name); setIsEditingName(true); };
  const cancelEditingName = () => { setName(tempName); setIsEditingName(false); };
  const saveEditingName = () => { setIsEditingName(false); updateProfileField('name', name); };

  const startEditingPhone = () => { setTempPhone(phone); setIsEditingPhone(true); };
  const cancelEditingPhone = () => { setPhone(tempPhone); setIsEditingPhone(false); };
  const saveEditingPhone = () => { setIsEditingPhone(false); updateProfileField('phone', phone); };

  const startEditingDob = () => { setTempDob(dob); setIsEditingDob(true); };
  const cancelEditingDob = () => { setDob(tempDob); setIsEditingDob(false); };
  const saveEditingDob = () => { setIsEditingDob(false); updateProfileField('dob', dob); };

  const startEditingAbout = () => { setTempAboutMe(aboutMe); setIsEditingAbout(true); };
  const cancelEditingAbout = () => { setAboutMe(tempAboutMe); setIsEditingAbout(false); };
  const saveEditingAbout = () => { setIsEditingAbout(false); updateProfileField('aboutMe', aboutMe); };

  const triggerForceSync = async () => {
    setIsSyncing(true);
    // Mimic manual database synchronization verification
    try {
      const rawToken = user?.token || localStorage.getItem('token');
      const token = String(rawToken || '').trim();
      const response = await fetch(API_ENDPOINTS.PROFILE(user?.email || ''), {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        alert("NBT Database successfully synchronized! All profile details verified.");
      } else {
        alert("Failed to synchronize with server. Using locally cached profile data.");
      }
    } catch (e) {
      alert("Network error: Profile synchronized locally. Offline cache active.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const rawReader = new FileReader();
    rawReader.onloadend = () => setProfileImage(rawReader.result);
    rawReader.readAsDataURL(file);

    try {
      const compressImage = (file, maxWidthPx = 800, quality = 0.7) => {
        return new Promise((resolve) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > maxWidthPx) {
              height = Math.round((height * maxWidthPx) / width);
              width = maxWidthPx;
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.src = objectUrl;
        });
      };

      const compressed = await compressImage(file);
      saveLocalProfile({ profile_image: compressed });

      const rawToken = user?.token || localStorage.getItem('token');
      const token = String(rawToken || '').trim();
      const response = await fetch(API_ENDPOINTS.PROFILE_UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token && token !== 'undefined' && token !== 'null' ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          profile_image: compressed,
          profile_picture: compressed,
          email: user?.email,
          id: user?.id || user?.employee_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        const img = data.data?.profile_image || data.data?.profile_picture || data.profile_image || data.profile_picture;
        if (img) {
          let fullSrc = img;
          if (!img.startsWith('data:') && !img.startsWith('blob:') && !img.startsWith('http')) {
            fullSrc = `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
          }
          setProfileImage(fullSrc);
          saveLocalProfile({ profile_image: fullSrc });
        }
      }
    } catch (err) {
      console.warn('⚠️ Image network error. Preview cached locally.');
    }
  };

  const isMobile = winWidth < 768;

  const styles = {
    container: {
      width: '100%',
      minHeight: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: "'Outfit', sans-serif",
      color: '#1e293b',
      boxSizing: 'border-box'
    },
    banner: {
      height: isMobile ? '120px' : '230px',
      background: 'linear-gradient(135deg, #0B1E3F 0%, #172554 40%, #1e3a8a 85%, #2563eb 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.1)'
    },
    bannerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 80%)',
      pointerEvents: 'none'
    },
    bannerText: {
      color: '#FFFFFF',
      fontSize: isMobile ? '16px' : '32px',
      fontWeight: '900',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      textAlign: 'center',
      zIndex: 1,
      textShadow: '0 4px 12px rgba(0,0,0,0.2)',
      marginBottom: '6px'
    },
    bannerSubtext: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: isMobile ? '9px' : '13px',
      fontWeight: '600',
      letterSpacing: '1px',
      textAlign: 'center',
      zIndex: 1,
      textTransform: 'uppercase'
    },
    profileGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '360px 1fr',
      gap: isMobile ? '24px' : '40px',
      padding: isMobile ? '24px 16px 80px 16px' : '40px 60px 120px 60px',
      maxWidth: '100%',
      margin: '0 auto',
      boxSizing: 'border-box'
    },
    leftCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      padding: isMobile ? '30px 20px' : '40px 30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
      height: 'fit-content',
      minWidth: 0,
      overflow: 'hidden'
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: '20px'
    },
    avatar: {
      width: isMobile ? '110px' : '140px',
      height: isMobile ? '110px' : '140px',
      borderRadius: '50%',
      backgroundColor: '#f8fafc',
      border: '4px solid #ffffff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: '#2563EB',
      fontWeight: '800',
      overflow: 'hidden'
    },
    editAvatarBtn: {
      position: 'absolute',
      bottom: '5px',
      right: '5px',
      backgroundColor: '#2563EB',
      color: '#ffffff',
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
      cursor: 'pointer',
      border: '2px solid #ffffff',
      transition: 'all 0.2s'
    },
    userName: {
      fontSize: '24px',
      fontWeight: '900',
      color: '#0B1E3F',
      margin: '0',
      letterSpacing: '-0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center'
    },
    nameInput: {
      fontSize: '20px',
      fontWeight: '800',
      color: '#0B1E3F',
      border: '1.5px solid #cbd5e1',
      borderRadius: '8px',
      padding: '4px 10px',
      textAlign: 'center',
      width: '80%',
      outline: 'none',
      fontFamily: "'Outfit', sans-serif"
    },
    userRole: {
      fontSize: '11px',
      color: '#2563EB',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginTop: '6px',
      backgroundColor: 'rgba(37, 99, 235, 0.06)',
      padding: '4px 12px',
      borderRadius: '100px',
      display: 'inline-block'
    },
    securityBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'rgba(239, 68, 68, 0.06)',
      border: '1px solid rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '6px 12px',
      borderRadius: '10px',
      marginTop: '16px'
    },
    divider: {
      width: '100%',
      height: '1px',
      backgroundColor: '#f1f5f9',
      margin: '24px 0'
    },
    menuList: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '14px',
      backgroundColor: '#f8fafc',
      border: '1px solid #f1f5f9',
      fontSize: '13px',
      fontWeight: '700',
      color: '#475569',
      textAlign: 'left'
    },
    syncBtn: {
      width: '100%',
      padding: '12px',
      borderRadius: '14px',
      backgroundColor: '#2563EB',
      color: 'white',
      border: 'none',
      fontWeight: '800',
      fontSize: '13px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
      marginTop: '16px',
      transition: 'all 0.2s'
    },

    // Right Column Cards:
    rightContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      minWidth: 0
    },
    detailCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      padding: isMobile ? '24px 16px' : '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
      minWidth: 0,
      overflow: 'hidden'
    },
    cardTitleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '800',
      color: '#0B1E3F',
      margin: 0
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '20px'
    },
    infoItem: {
      backgroundColor: '#f8fafc',
      padding: '18px',
      borderRadius: '16px',
      border: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      transition: 'all 0.2s',
      position: 'relative',
      minWidth: 0,
      overflow: 'hidden'
    },
    infoIconBox: {
      width: '42px',
      height: '42px',
      borderRadius: '12px',
      backgroundColor: 'white',
      color: '#2563EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      flexShrink: 0
    },
    infoContent: {
      flex: 1,
      minWidth: 0
    },
    infoLabel: {
      fontSize: '10px',
      color: '#64748B',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    infoValue: {
      fontSize: '13.5px',
      color: '#1e293b',
      fontWeight: '800',
      marginTop: '2px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    editInlineBtn: {
      cursor: 'pointer',
      color: '#94a3b8',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
      borderRadius: '6px'
    },
    inputInline: {
      fontSize: '13px',
      color: '#1e293b',
      fontWeight: '800',
      border: '1.5px solid #cbd5e1',
      borderRadius: '6px',
      padding: '2px 6px',
      width: '90%',
      outline: 'none',
      fontFamily: "'Outfit', sans-serif",
      backgroundColor: 'white'
    },

    // About Me card (slate theme)
    aboutCard: {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: '#ffffff',
      borderRadius: '24px',
      padding: isMobile ? '24px 16px' : '30px',
      boxShadow: '0 20px 25px rgba(15, 23, 42, 0.12)',
      position: 'relative',
      overflow: 'hidden',
      minWidth: 0
    },
    aboutText: {
      fontSize: isMobile ? '14px' : '15px',
      color: '#e2e8f0',
      lineHeight: '1.75',
      fontWeight: '600',
      fontStyle: 'italic',
      position: 'relative',
      zIndex: 1,
      marginTop: '10px'
    },
    aboutQuote: {
      position: 'absolute',
      right: '25px',
      bottom: '-30px',
      fontSize: '140px',
      fontFamily: 'serif',
      color: 'rgba(255,255,255,0.05)',
      lineHeight: 1,
      pointerEvents: 'none',
      userSelect: 'none'
    },
    textareaAbout: {
      width: '100%',
      height: '110px',
      backgroundColor: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      padding: '12px',
      color: 'white',
      fontSize: '14px',
      lineHeight: '1.6',
      outline: 'none',
      fontFamily: "'Outfit', sans-serif",
      resize: 'none',
      marginTop: '10px',
      position: 'relative',
      zIndex: 2,
      boxSizing: 'border-box'
    },
    aboutEditActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '12px',
      position: 'relative',
      zIndex: 2
    },
    aboutBtnSave: {
      backgroundColor: '#2563EB',
      color: 'white',
      border: 'none',
      padding: '6px 14px',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '12px',
      cursor: 'pointer'
    },
    aboutBtnCancel: {
      backgroundColor: 'transparent',
      color: '#e2e8f0',
      border: '1px solid rgba(255,255,255,0.3)',
      padding: '6px 14px',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '12px',
      cursor: 'pointer'
    },

    // Administrative Info Cards:
    adminMetricsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: '16px'
    },
    metricCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      padding: '16px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.01)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    metricVal: {
      fontSize: '14.5px',
      fontWeight: '800',
      color: '#0B1E3F',
      marginTop: '4px'
    },

    logoutBtn: {
      width: isMobile ? 'calc(100% - 32px)' : '240px',
      padding: '14px 28px',
      borderRadius: '16px',
      border: '2px solid #EF4444',
      backgroundColor: 'transparent',
      color: '#EF4444',
      fontSize: '13px',
      fontWeight: '900',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      margin: '20px auto 40px auto'
    }
  };

  return (
    <div style={styles.container}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />

      {/* Edge-to-edge Top Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ zIndex: 1 }}
        >
          <div style={styles.bannerText}>NAVABHARATH TECHNOLOGIES</div>
          <div style={styles.bannerSubtext}>SMARTER SOLUTIONS FOR BETTER FUTURE</div>
        </motion.div>
      </div>

      {/* Two Column Grid Layout */}
      <div style={styles.profileGrid}>

        {/* Left Column: Profile Summary Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={styles.leftCard}
        >
          <div style={styles.avatarWrapper}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              style={styles.avatar}
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name ? user.name[0] : 'S'
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              style={styles.editAvatarBtn}
              title="Upload new photo"
            >
              <Camera size={15} />
            </motion.button>
          </div>

          {/* Name & Role Section */}
          <div style={{ width: '100%' }}>
            {isEditingName ? (
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', width: '100%' }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...styles.nameInput, width: isMobile ? '90%' : '80%' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditingName();
                    if (e.key === 'Escape') cancelEditingName();
                  }}
                />
                <div style={{ display: 'flex', gap: '12px', marginTop: isMobile ? '8px' : '0' }}>
                  <button 
                    onClick={saveEditingName} 
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Check size={12} /> Save
                  </button>
                  <button 
                    onClick={cancelEditingName} 
                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.userName}>
                {name}
                <Edit3
                  size={14}
                  color="#94a3b8"
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={startEditingName}
                  title="Edit Name"
                />
              </div>
            )}
            <div style={styles.userRole}>{role}</div>
          </div>

        </motion.div>

        {/* Right Column: Information & Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={styles.rightContainer}
        >

          {/* Personal Details Panel */}
          <div style={styles.detailCard}>
            <div style={styles.cardTitleRow}>
              <h2 style={styles.cardTitle}>Personal Information</h2>
            </div>

            <div style={styles.infoGrid}>

              {/* Email Address - Lock / Non-Editable */}
              <div style={{ ...styles.infoItem, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <div style={styles.infoIconBox}>
                  <Mail size={18} />
                </div>
                <div style={styles.infoContent}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={styles.infoLabel}>Email Address</div>
                    <Lock size={12} color="#94a3b8" title="System Locked Profile Field" />
                  </div>
                  <div style={styles.infoValue}>{user?.email || ''}</div>
                </div>
              </div>

              {/* Contact Number - Editable */}
              <div style={styles.infoItem}>
                <div style={{ ...styles.infoIconBox, cursor: 'pointer' }} onClick={startEditingPhone}>
                  <Phone size={18} />
                </div>
                <div style={styles.infoContent}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={styles.infoLabel}>Contact Number</div>
                    {!isEditingPhone && (
                      <div style={styles.editInlineBtn} onClick={startEditingPhone} title="Edit Phone Number">
                        <Edit3 size={12} />
                      </div>
                    )}
                  </div>
                  {isEditingPhone ? (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '8px', marginTop: '6px', width: '100%' }}>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ ...styles.inputInline, width: '100%' }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditingPhone();
                          if (e.key === 'Escape') cancelEditingPhone();
                        }}
                      />
                      <div style={{ display: 'flex', gap: '12px', marginTop: isMobile ? '4px' : '0', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                        <button 
                          onClick={saveEditingPhone} 
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Check size={12} /> Save
                        </button>
                        <button 
                          onClick={cancelEditingPhone} 
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.infoValue}>{phone}</div>
                  )}
                </div>
              </div>

              {/* Date of Birth - Editable */}
              <div style={styles.infoItem}>
                <div style={{ ...styles.infoIconBox, cursor: 'pointer' }} onClick={startEditingDob}>
                  <Calendar size={18} />
                </div>
                <div style={styles.infoContent}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={styles.infoLabel}>Date of Birth</div>
                    {!isEditingDob && (
                      <div style={styles.editInlineBtn} onClick={startEditingDob} title="Edit Birth Date">
                        <Edit3 size={12} />
                      </div>
                    )}
                  </div>
                  {isEditingDob ? (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '8px', marginTop: '6px', width: '100%' }}>
                      <input
                        type="date"
                        value={convertToInputDateFormat(dob)}
                        onChange={(e) => setDob(convertToDisplayDateFormat(e.target.value))}
                        style={{ ...styles.inputInline, width: '100%' }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditingDob();
                          if (e.key === 'Escape') cancelEditingDob();
                        }}
                      />
                      <div style={{ display: 'flex', gap: '12px', marginTop: isMobile ? '4px' : '0', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                        <button 
                          onClick={saveEditingDob} 
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Check size={12} /> Save
                        </button>
                        <button 
                          onClick={cancelEditingDob} 
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.infoValue}>{convertToDisplayDateFormat(dob)}</div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* About Me / Biography Section (Gradient/Dark Sleek card) */}
          <div style={styles.aboutCard}>
            <div style={styles.cardTitleRow}>
              <h2 style={{ ...styles.cardTitle, color: '#ffffff' }}>Executive Biography</h2>
              {!isEditingAbout && (
                <div
                  style={{ ...styles.editInlineBtn, color: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={startEditingAbout}
                  title="Edit Biography"
                >
                  <Edit3 size={14} />
                </div>
              )}
            </div>

            <div style={styles.aboutQuote}>“</div>

            {isEditingAbout ? (
              <div>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  style={styles.textareaAbout}
                  autoFocus
                />
                <div style={styles.aboutEditActions}>
                  <button style={styles.aboutBtnCancel} onClick={cancelEditingAbout}>Cancel</button>
                  <button style={styles.aboutBtnSave} onClick={saveEditingAbout}>Save Biography</button>
                </div>
              </div>
            ) : (
              <p style={styles.aboutText}>{aboutMe}</p>
            )}
          </div>

        </motion.div>
      </div>

      {/* Centered Logout Button at the Bottom */}
      <motion.button
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.04)' }}
        whileTap={{ scale: 0.98 }}
        style={styles.logoutBtn}
        onClick={() => { 
          if (window.confirm('Securely end this session?')) {
            logout();
          } 
        }}
      >
        <LogOut size={16} />
        Secure Logout
      </motion.button>

      {/* Spin Animation Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
