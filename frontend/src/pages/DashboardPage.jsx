import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    employees: 0,
    pendingPayroll: 0,
    paidPayroll: 0,
    transactions: 0,
    attendance: { present: 0, absent: 0, leave: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, payRes, txnRes, attRes] = await Promise.all([
          api.get('/api/employees'),
          api.get('/api/payroll'),
          api.get('/api/transactions'),
          api.get('/api/attendance'),
        ]);

        const payrolls = payRes.data || [];
        const attendance = attRes.data || [];

        setStats({
          employees: empRes.data?.length || 0,
          pendingPayroll: payrolls.filter((p) => p.status === 'pending').length,
          paidPayroll: payrolls.filter((p) => p.status === 'paid').length,
          transactions: txnRes.data?.length || 0,
          attendance: {
            present: attendance.filter((a) => a.status === 'present').length,
            absent: attendance.filter((a) => a.status === 'absent').length,
            leave: attendance.filter((a) => a.status === 'leave').length,
          },
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Employees', value: stats.employees, icon: '👥', color: '#6366f1' },
    { label: 'Pending Payroll', value: stats.pendingPayroll, icon: '⏳', color: '#f59e0b' },
    { label: 'Paid Payroll', value: stats.paidPayroll, icon: '✅', color: '#10b981' },
    { label: 'Transactions', value: stats.transactions, icon: '💳', color: '#0ea5e9' },
    { label: 'Present Today', value: stats.attendance.present, icon: '🟢', color: '#10b981' },
    { label: 'Absent Today', value: stats.attendance.absent, icon: '🔴', color: '#ef4444' },
  ];

  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your company overview.</p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading dashboard..." />
        ) : (
          <>
            <div className="stats-grid">
              {statCards.map((card) => (
                <div className="stat-card" key={card.label}>
                  <div style={{ borderTop: `3px solid ${card.color}`, position: 'absolute', top: 0, left: 0, right: 0 }} />
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="stat-icon">{card.icon}</div>
                </div>
              ))}
            </div>

            {/* Activity Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginTop: '8px',
              }}
            >
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0' }}>
                  📊 Attendance Overview
                </h3>
                {[
                  { label: 'Present', value: stats.attendance.present, color: '#10b981', pct: stats.attendance.present },
                  { label: 'Absent', value: stats.attendance.absent, color: '#ef4444', pct: stats.attendance.absent },
                  { label: 'On Leave', value: stats.attendance.leave, color: '#f59e0b', pct: stats.attendance.leave },
                ].map((item) => {
                  const total = stats.attendance.present + stats.attendance.absent + stats.attendance.leave;
                  const pct = total > 0 ? Math.round((item.pct / total) * 100) : 0;
                  return (
                    <div key={item.label} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{item.label}</span>
                        <span style={{ fontSize: '0.85rem', color: item.color, fontWeight: 600 }}>
                          {item.value} ({pct}%)
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px' }}>
                        <div
                          style={{
                            background: item.color,
                            borderRadius: '4px',
                            height: '100%',
                            width: `${pct}%`,
                            transition: 'width 0.8s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0' }}>
                  💰 Payroll Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Pending', value: stats.pendingPayroll, color: '#f59e0b', icon: '⏳' },
                    { label: 'Paid', value: stats.paidPayroll, color: '#10b981', icon: '✅' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '10px',
                        border: `1px solid rgba(255,255,255,0.06)`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{item.label} Payroll</span>
                      </div>
                      <span style={{ color: item.color, fontSize: '1.5rem', fontWeight: 700 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
