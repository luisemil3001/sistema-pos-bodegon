import React from 'react';

export const ReportPageShell = ({ title, subtitle, icon: Icon, actions, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{
          fontSize: '1.75rem',
          color: 'var(--text-main)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {Icon && <Icon size={28} color="var(--primary)" />}
          {title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
    {children}
  </div>
);

export const ReportFilters = ({ children }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    padding: '1.5rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  }}>
    {children}
  </div>
);

export const ReportCard = ({ children }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    overflow: 'hidden'
  }}>
    {children}
  </div>
);

export const ReportTable = ({ children }) => (
  <ReportCard>
    <div style={{ overflowX: 'auto' }}>
      {children}
    </div>
  </ReportCard>
);

export const ReportButton = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      backgroundColor: 'var(--primary)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      ...style
    }}
  >
    {children}
  </button>
);
