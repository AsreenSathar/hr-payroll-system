import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTop: '3px solid #6366f1',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
