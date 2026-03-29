import React from 'react';

const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const user = employee.userId;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const avatarColors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #0ea5e9, #6366f1)',
    'linear-gradient(135deg, #10b981, #0ea5e9)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
  ];
  const colorIdx = (user?.name?.charCodeAt(0) || 0) % avatarColors.length;

  return (
    <div
      className="card"
      style={{
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: avatarColors[colorIdx],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.email}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Position</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
            {employee.position || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Department</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
            {employee.department || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Salary</span>
          <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>
            ₹{(employee.salary || 0).toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Joined</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {employee.joiningDate
              ? new Date(employee.joiningDate).toLocaleDateString('en-IN')
              : '—'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {onEdit && (
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(employee)} style={{ flex: 1, justifyContent: 'center' }}>
            ✏️ Edit
          </button>
        )}
        {onDelete && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(employee._id)} style={{ flex: 1, justifyContent: 'center' }}>
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;
