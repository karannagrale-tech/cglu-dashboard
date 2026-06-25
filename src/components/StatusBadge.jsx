const STATUS_CONFIG = {
  live: {
    background: '#DCFCE7',
    color: '#166534',
    borderColor: '#BBF7D0',
    dotColor: '#22C55E',
    label: 'Live',
  },
  running: {
    background: '#DCFCE7',
    color: '#166534',
    borderColor: '#BBF7D0',
    dotColor: '#22C55E',
    label: 'Live',
  },
  draft: {
    background: '#F3F4F6',
    color: '#4B5563',
    borderColor: '#E5E7EB',
    dotColor: '#9CA3AF',
    label: 'Draft',
  },
  stopped: {
    background: '#FEE2E2',
    color: '#991B1B',
    borderColor: '#FECACA',
    dotColor: '#EF4444',
    label: 'Stopped',
  },
  scheduled: {
    background: '#DBEAFE',
    color: '#1E40AF',
    borderColor: '#BFDBFE',
    dotColor: '#3B82F6',
    label: 'Scheduled',
  },
  completed: {
    background: '#EDE9FE',
    color: '#5B21B6',
    borderColor: '#DDD6FE',
    dotColor: '#8B5CF6',
    label: 'Completed',
  },
  expired: {
    background: '#FEF3C7',
    color: '#92400E',
    borderColor: '#FDE68A',
    dotColor: '#F59E0B',
    label: 'Expired',
  },
  deleted: {
    background: '#F3F4F6',
    color: '#6B7280',
    borderColor: '#E5E7EB',
    dotColor: '#9CA3AF',
    label: 'Deleted',
  },
};

function StatusBadge({ status, size = 'default' }) {
  const normalized = (status || 'draft').toLowerCase();
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.draft;
  const isSmall = size === 'small';

  return (
    <span
      className={`status-badge status-badge--${normalized}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 4 : 6,
        padding: isSmall ? '1px 8px' : '2px 10px',
        borderRadius: 999,
        fontSize: isSmall ? 10 : 12,
        fontWeight: 600,
        lineHeight: isSmall ? '18px' : '22px',
        backgroundColor: config.background,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      <span
        className="status-badge-dot"
        style={{
          width: isSmall ? 5 : 6,
          height: isSmall ? 5 : 6,
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          flexShrink: 0,
          // Pulse animation for live status
          animation: (normalized === 'live' || normalized === 'running')
            ? 'status-pulse 2s ease-in-out infinite'
            : 'none',
        }}
      />
      {config.label}
      {(normalized === 'live' || normalized === 'running') && (
        <style>{`
          @keyframes status-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
        `}</style>
      )}
    </span>
  );
}

export { STATUS_CONFIG };
export default StatusBadge;
