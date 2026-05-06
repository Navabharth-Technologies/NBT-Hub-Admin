import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Mail, User, 
  Calendar, 
  Users, Edit3, Fingerprint, Camera, Phone, Check, Send, Database, ArrowLeft
} from 'lucide-react';
import { API_ENDPOINTS, BASE_URL } from './config';

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

export default function ProfileScreen({ onBack }) {
  const { user } = useAuth();
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [isEditingEmployeeId, setIsEditingEmployeeId] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  const local = loadLocalProfile();

  const [name, setName] = useState(user?.name || local.name || 'Dinesh Sir');
  const [role, setRole] = useState(user?.role || local.role || 'Super Admin');
  const [employeeId, setEmployeeId] = useState(local.employee_id || user?.employee_id || '20250');
  const [team, setTeam] = useState(local.team || user?.team || 'Executive Leadership');
  const [phone, setPhone] = useState(local.phone_number || user?.phone_number || '9874521785');
  const [aboutMe, setAboutMe] = useState(local.about_me || user?.about_me || 'Founder & CEO of Navabharath Technologies. Visionary leader dedicated to empowering excellence through innovative educational and infrastructure solutions.');
  const [dob, setDob] = useState(local.date_of_birth || user?.date_of_birth || '15/08/1987');
  const [profileImage, setProfileImage] = useState(local.profile_image || null);
  const [reportingManager, setReportingManager] = useState({ name: 'NBT Board', id: 'EXECUTIVE-001' });
  const [taskContent, setTaskContent] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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
            if (data.name) setName(data.name);
            if (data.role) setRole(data.role);
            if (data.employeeId || data.employee_id) setEmployeeId(data.employeeId || data.employee_id);
            if (data.team) setTeam(data.team);
            if (data.phoneNumber || data.phone_number) setPhone(data.phoneNumber || data.phone_number);
            if (data.aboutMe || data.about_me) setAboutMe(data.aboutMe || data.about_me);
            if (data.date_of_birth || data.dateOfBirth) setDob(data.date_of_birth || data.dateOfBirth);
            const remoteImg = data.profile_image || data.profile_picture || data.profilePicture || data.avatar;
            if (remoteImg) {
               let fullSrc = remoteImg;
               if (!remoteImg.startsWith('data:') && !remoteImg.startsWith('blob:') && !remoteImg.startsWith('http')) {
                   fullSrc = `${BASE_URL}${remoteImg.startsWith('/') ? '' : '/'}${remoteImg}`;
               }
               setProfileImage(fullSrc);
               saveLocalProfile({ profile_image: fullSrc });
            }
            if (data.reportingManagerName || data.manager) {
               setReportingManager({ name: data.reportingManagerName || data.manager, id: data.reportingManagerId || '' });
            }
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

  const syncTaskToBackend = async () => {
    if (!taskContent.trim()) return;
    setIsSyncing(true);
    try {
      const response = await fetch(API_ENDPOINTS.TASK_UPDATES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 999, content: taskContent, status: 'COMPLETED', timestamp: new Date().toISOString() })
      });
      if (response.ok) { alert("Task synchronized with NBT Database!"); setTaskContent(''); }
    } catch { alert("Could not sync task."); }
    finally { setIsSyncing(false); }
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
           console.log('✅ Profile image saved to database.');
        } else {
           const errData = await response.json().catch(() => ({}));
           console.warn(`⚠️ Image upload: server returned ${response.status}. ${errData.message || ''}`);
        }
     } catch (err) {
        console.warn('⚠️ Image network error. Preview cached locally.', err.message);
     }
  };

  const isMobile = winWidth < 768;
  const isSmallMobile = winWidth < 480;

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: isMobile ? '120px' : '160px', paddingTop: isMobile ? '15px' : '30px', fontFamily: "'Outfit', sans-serif" },
    profileWrapper: { maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 15px' : '0 20px' },
    banner: { height: isMobile ? '120px' : '160px', backgroundColor: '#0B1E3F', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
    bannerText: { color: '#FFFFFF', fontSize: isMobile ? '14px' : '18px', fontWeight: '800', letterSpacing: '0.5px', textAlign: 'center', zIndex: 1 },
    masterCard: { backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', padding: isMobile ? '25px 20px' : '35px', position: 'relative', marginTop: '-40px', border: '1px solid #F1F5F9', zIndex: 2 },
    headerRow: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-start', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: isMobile ? '25px' : '60px', paddingBottom: '25px', borderBottom: '1px solid #f1f5f9', marginBottom: '25px' },
    avatarContainer: { position: 'relative' },
    avatar: { width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px', borderRadius: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#2563EB', fontWeight: '800', overflow: 'hidden' },
    editAvatarBtn: { position: 'absolute', bottom: '-5px', right: '-5px', backgroundColor: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer', border: '1px solid #e2e8f0', color: '#2563EB' },
    userName: { fontSize: isMobile ? '24px' : '28px', fontWeight: '1000', color: '#0B1E3F', margin: '0', letterSpacing: '-0.5px' },
    userRole: { fontSize: '11px', color: '#2563EB', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
    infoGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '20px' },
    infoCard: { backgroundColor: '#F5F9FF', padding: isMobile ? '18px' : '25px', borderRadius: '20px', border: '1.5px solid #E0EFFF', display: 'flex', alignItems: 'center', gap: '15px' },
    iconCircle: { width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', borderRadius: '14px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)', flexShrink: 0 },
    label: { fontSize: '10px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    value: { fontSize: isMobile ? '14px' : '16px', color: '#0B1E3F', fontWeight: '1000', marginTop: '2px' },
    aboutSection: { marginTop: '25px', backgroundColor: '#f8fafc', padding: isMobile ? '20px' : '30px', borderRadius: '20px', border: '1px solid #f1f5f9' },
    logoutBtn: { width: isMobile ? '100%' : 'auto', padding: '15px 40px', borderRadius: '16px', border: '2px solid #EF4444', backgroundColor: 'white', color: '#EF4444', fontSize: '14px', fontWeight: '1000', cursor: 'pointer', display: 'block', margin: '40px auto 0', transition: 'all 0.2s' }
  };

  return (
    <div style={styles.container}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />

      <div style={styles.profileWrapper}>
        {onBack && (
          <div 
            onClick={onBack} 
            style={{ cursor: 'pointer', backgroundColor: 'white', width: '36px', height: '36px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9', marginBottom: '12px' }}
          >
            <ArrowLeft size={18} color="#0B1E3F" />
          </div>
        )}
        <div style={styles.banner}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', opacity: 0.5 }}></div>
          <div style={styles.bannerText}>Innovation • Excellence • Impact</div>
        </div>

        <div style={styles.masterCard}>
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: isMobile ? '100%' : 'auto' }}>
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>
                  {profileImage ? <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.name ? user.name[0] : 'S')}
                </div>
                <button onClick={() => fileInputRef.current?.click()} style={styles.editAvatarBtn}><Camera size={14} /></button>
              </div>
              <div>
                <div style={styles.userName}>{name}</div>
                <div style={styles.userRole}>{role}</div>
              </div>
            </div>

            {!isMobile && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ ...styles.iconCircle, width: '36px', height: '36px', backgroundColor: '#F1F5F9', color: '#64748b' }}><Phone size={16} /></div>
                  <div>
                    <div style={styles.label}>Contact Number</div>
                    <div style={{ ...styles.value, fontSize: '13px' }}>{phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ ...styles.iconCircle, width: '36px', height: '36px', backgroundColor: '#F1F5F9', color: '#64748b' }}><Calendar size={16} /></div>
                  <div>
                    <div style={styles.label}>Date of Birth</div>
                    <div style={{ ...styles.value, fontSize: '13px' }}>{dob}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={styles.infoGrid}>
            {isMobile && (
              <>
                <div style={styles.infoCard}>
                  <div style={styles.iconCircle}><Phone size={18} /></div>
                  <div>
                    <div style={styles.label}>Contact Number</div>
                    <div style={styles.value}>{phone}</div>
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.iconCircle}><Calendar size={18} /></div>
                  <div>
                    <div style={styles.label}>Date of Birth</div>
                    <div style={styles.value}>{dob}</div>
                  </div>
                </div>
              </>
            )}
            <div style={styles.infoCard}>
              <div style={styles.iconCircle}><Users size={18} /></div>
              <div>
                <div style={styles.label}>Team</div>
                <div style={styles.value}>{team}</div>
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.iconCircle}><Mail size={18} /></div>
              <div>
                <div style={styles.label}>Email Address</div>
                <div style={{ ...styles.value, fontSize: isSmallMobile ? '12px' : '14px' }}>{user?.email || 'dinesh@navabharathtechnologies.com'}</div>
              </div>
            </div>
          </div>

          <div style={styles.aboutSection}>
            <div style={{ ...styles.label, marginBottom: '10px', color: '#0B1E3F' }}>About Me</div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', fontWeight: '600' }}>
              {aboutMe}
            </div>
          </div>

          <button style={styles.logoutBtn} onClick={() => { if (window.confirm('Securely end this session?')) window.location.reload(); }}>
            Logout Securely
          </button>
        </div>
      </div>
    </div>
  );
}
