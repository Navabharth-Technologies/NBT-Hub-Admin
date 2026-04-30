import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from './config';
 
 export default function ComplianceDashboard({ onBack }) {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompliance = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.COMPLIANCE || `${API_ENDPOINTS.BASE_URL}/api/compliance`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          setComplianceData(data);
        }
      } catch (err) {
        console.error("Failed to fetch compliance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompliance();
  }, []);
  const [winWidth, setWinWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winWidth < 768;

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', padding: isMobile ? '10px' : '20px' },
    header: { fontSize: isMobile ? '20px' : '24px', fontWeight: '900', marginBottom: isMobile ? '15px' : '24px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0' },
    grid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '12px' : '24px', marginBottom: isMobile ? '16px' : '24px' },
    card: { backgroundColor: 'white', borderRadius: '15px', padding: isMobile ? '16px' : '24px', boxShadow: '0 6px 20px rgba(49,99,168,0.08)', border: '2px solid #bfdbfe' },
    value: { fontSize: isMobile ? '28px' : '36px', fontWeight: '900', color: '#315A9E', marginBottom: '4px', letterSpacing: '-0.5px' },
    label: { fontSize: isMobile ? '12px' : '14px', color: '#64748b', fontWeight: '700' },
    panel: { backgroundColor: 'white', borderRadius: '15px', padding: isMobile ? '16px' : '24px', boxShadow: '0 6px 20px rgba(49,99,168,0.08)', border: '2px solid #bfdbfe' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '15px 12px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    td: { padding: '15px 12px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontWeight: '700' },
    downloadBtn: { backgroundColor: 'white', border: '1.5px solid #3863A8', color: '#3863A8', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '800', alignSelf: isMobile ? 'stretch' : 'auto' }
  };

  const reports = [
    { week: 'Week 12 (Mar 18-24)', subRate: '95%', target: '100%', diff: '-5%', status: 'Missed Target' },
    { week: 'Week 11 (Mar 11-17)', subRate: '100%', target: '100%', diff: '0%', status: 'Compliant' },
  ];

  const downloadCSV = () => {
    const headers = ["Period", "Submission Rate", "Target", "Deviation", "Status"];
    const rows = reports.map(r => [
      // Wrapping in quotes to handle commas in week names
      `"${r.week}"`, r.subRate, r.target, r.diff, r.status
    ]);
    
    const csvString = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Compliance_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        {onBack && (
          <div 
            onClick={onBack} 
            style={{ cursor: 'pointer', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}
          >
            <ArrowLeft size={20} color="#1e293b" />
          </div>
        )}
        <h2 style={{ ...styles.header, marginBottom: 0 }}>
          Compliance Dashboard 
        </h2>
        <div style={{ marginLeft: 'auto' }}>
          <button style={styles.downloadBtn} onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', fontWeight: '800', color: '#64748B' }}>Syncing Compliance Data...</div>
      ) : !complianceData ? (
        <div style={{ textAlign: 'center', padding: '100px', fontWeight: '800', color: '#64748B' }}>No compliance data available.</div>
      ) : (
        <>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.value}>{complianceData.participationRate || '95.2%'}</div>
              <div style={styles.label}>Weekly Submission Participation</div>
            </div>
            <div style={styles.card}>
              <div style={styles.value}>{complianceData.warningsSent || '12'}</div>
              <div style={styles.label}>Automatic Warnings Sent (This Mo.)</div>
            </div>
            <div style={styles.card}>
              <div style={styles.value}>{complianceData.policyAcceptance || '100%'}</div>
              <div style={styles.label}>HR Policy Acceptance</div>
            </div>
          </div>

          <div style={styles.panel}>
            <h3 style={{fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px'}}>Weekly Compliance Reports</h3>
            
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {(complianceData.reports || []).map((r, idx) => (
                  <div key={idx} style={{ padding: '15px', border: '1.5px solid #bfdbfe', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                    <div style={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>{r.week || r.period}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>SUBMISSION</div>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{r.subRate || r.submission_rate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>TARGET</div>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{r.target}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>DEVIATION</div>
                        <div style={{ fontWeight: '700', color: r.diff === '0%' ? '#64748b' : '#dc2626' }}>{r.diff || r.deviation}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>STATUS</div>
                        <div style={{ fontWeight: '700', color: (r.status || '').includes('Compliant') ? '#059669' : '#dc2626' }}>{r.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Period</th>
                      <th style={styles.th}>Submission Rate</th>
                      <th style={styles.th}>Target</th>
                      <th style={styles.th}>Deviation</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(complianceData.reports || []).map((r, idx) => (
                      <tr key={idx}>
                        <td style={styles.td}>{r.week || r.period}</td>
                        <td style={styles.td}>{r.subRate || r.submission_rate}</td>
                        <td style={styles.td}>{r.target}</td>
                        <td style={{...styles.td, color: r.diff === '0%' ? '#64748b' : '#dc2626'}}>{r.diff || r.deviation}</td>
                        <td style={{...styles.td, color: (r.status || '').includes('Compliant') ? '#059669' : '#dc2626'}}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
