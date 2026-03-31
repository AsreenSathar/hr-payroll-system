import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

// Helper: returns true if a date string/object falls on today (local time)
const isToday = (dateVal) => {
  const d = new Date(dateVal);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const todayLabel = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const DashboardPage = () => {
  const [stats, setStats] = useState({
    employees: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    pendingPayroll: 0,
    paidPayroll: 0,
    transactions: 0,
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
        const allAttendance = attRes.data || [];

        // Today's attendance records only
        const todayAttendance = allAttendance.filter((a) => isToday(a.date));

        setStats({
          employees: empRes.data?.length || 0,
          presentToday: todayAttendance.filter((a) => a.status === 'present').length,
          absentToday: todayAttendance.filter((a) => a.status === 'absent').length,
          leaveToday: todayAttendance.filter((a) => a.status === 'leave').length,
          pendingPayroll: payrolls.filter((p) => p.status === 'pending').length,
          paidPayroll: payrolls.filter((p) => p.status === 'paid').length,
          transactions: txnRes.data?.length || 0,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Section 1 — Today's Overview cards
  const todayCards = [
    {
      label: 'Total Employees',
      subLabel: 'As of Today',
      value: stats.employees,
      icon: '👥',
      color: '#6366f1',
    },
    {
      label: 'Present Today',
      value: stats.presentToday,
      icon: '🟢',
      color: '#10b981',
    },
    {
      label: 'Absent Today',
      value: stats.absentToday,
      icon: '🔴',
      color: '#ef4444',
    },
    {
      label: 'On Leave Today',
      value: stats.leaveToday,
      icon: '🟡',
      color: '#f59e0b',
    },
  ];

  // Section 2 — Payroll & Transactions cards (unchanged logic)
  const payrollCards = [
    {
      label: 'Pending Payroll',
      value: stats.pendingPayroll,
      icon: '⏳',
      color: '#f59e0b',
    },
    {
      label: 'Paid Payroll',
      value: stats.paidPayroll,
      icon: '✅',
      color: '#10b981',
    },
    {
      label: 'Transactions',
      value: stats.transactions,
      icon: '💳',
      color: '#0ea5e9',
    },
  ];

  const sectionHeadingStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    marginBottom: '12px',
    marginTop: '8px',
  };

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
            {/* ── Section 1: Today's Overview ── */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
                <p style={sectionHeadingStyle}>Today's Overview</p>
                <span style={{ fontSize: '0.78rem', color: '#475569' }}>{todayLabel}</span>
              </div>

              <div className="stats-grid">
                {todayCards.map((card) => (
                  <div className="stat-card" key={card.label}>
                    <div
                      style={{
                        borderTop: `3px solid ${card.color}`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                      }}
                    />
                    <div className="stat-label">
                      {card.label}
                      {card.subLabel && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                          {card.subLabel}
                        </span>
                      )}
                    </div>
                    <div className="stat-value" style={{ color: card.color }}>
                      {card.value}
                    </div>
                    <div className="stat-icon">{card.icon}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 2: Payroll & Transactions Summary ── */}
            <div>
              <p style={{ ...sectionHeadingStyle, marginBottom: '14px' }}>
                Payroll &amp; Transactions Summary
              </p>

              <div className="stats-grid">
                {payrollCards.map((card) => (
                  <div className="stat-card" key={card.label}>
                    <div
                      style={{
                        borderTop: `3px solid ${card.color}`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                      }}
                    />
                    <div className="stat-label">{card.label}</div>
                    <div className="stat-value" style={{ color: card.color }}>
                      {card.value}
                    </div>
                    <div className="stat-icon">{card.icon}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Attendance Overview & Payroll Status panels ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginTop: '20px',
              }}
            >
              {/* Attendance bar chart */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0' }}>
                  📊 Today's Attendance Breakdown
                </h3>
                {[
                  { label: 'Present', value: stats.presentToday, color: '#10b981' },
                  { label: 'Absent', value: stats.absentToday, color: '#ef4444' },
                  { label: 'On Leave', value: stats.leaveToday, color: '#f59e0b' },
                ].map((item) => {
                  const total = stats.presentToday + stats.absentToday + stats.leaveToday;
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
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

              {/* Payroll Status panel */}
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
                        border: '1px solid rgba(255,255,255,0.06)',
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
