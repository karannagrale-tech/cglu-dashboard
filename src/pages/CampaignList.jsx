import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCampaigns } from '../api/cglu';
import { GAME_TYPES } from '../constants/gameTypes';

function getGameType(experience) {
  return GAME_TYPES.find((g) => g.id === experience) || null;
}

const STATUS_TABS = [
  { id: 'all', label: 'All', dot: null },
  { id: 'running', label: 'Live', dot: '#10b981' },
  { id: 'draft', label: 'Draft', dot: '#94a3b8' },
  { id: 'stopped', label: 'Stopped', dot: '#ef4444' },
  { id: 'scheduled', label: 'Scheduled', dot: '#10b981' },
];

const STATUS_COLORS = {
  draft: { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  running: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  live: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  stopped: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  scheduled: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  completed: { bg: '#f3f4f6', text: '#6b7280', dot: '#6b7280' },
  expired: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  deleted: { bg: '#f3f4f6', text: '#6b7280', dot: '#6b7280' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999, fontSize: 11,
      fontWeight: 600, background: s.bg, color: s.text,
      textTransform: 'capitalize',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: s.dot,
      }} />
      {status === 'running' ? 'Live' : status}
    </span>
  );
}

function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await listCampaigns();
        if (!cancelled) {
          const raw = res.data || res;
          const list = Array.isArray(raw) ? raw : raw.campaigns || raw.data || [];
          setCampaigns(list);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = campaigns;
    if (activeTab !== 'all') {
      list = list.filter((c) => {
        const s = (c.status || '').toLowerCase();
        if (activeTab === 'running') return s === 'running' || s === 'live';
        return s === activeTab;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.campaignId || c._id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [campaigns, activeTab, search]);

  function copyId(e, id) {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  function truncateId(id) {
    if (!id) return '';
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 20, color: '#64748b' }}>&#9783;</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Campaigns</h1>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '0 14px', height: 42,
      }}>
        <span style={{ color: '#94a3b8', fontSize: 16 }}>&#128269;</span>
        <input
          type="text"
          placeholder="Search by campaign name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 14,
            background: 'transparent', color: '#334155',
          }}
        />
      </div>

      {/* Filter Tabs + Date + Sort */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', fontSize: 13, fontWeight: 500,
                  color: active ? '#0f172a' : '#64748b',
                  background: active ? '#fff' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderRadius: active ? 6 : 0,
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 150ms',
                }}
              >
                {tab.dot && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: tab.dot, display: 'inline-block',
                  }} />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Date filter */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', fontSize: 13, fontWeight: 500,
            color: '#64748b', background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 6, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 14 }}>&#128197;</span>
            All Time
            <span style={{ fontSize: 10 }}>&#9660;</span>
          </button>
          {/* Sort buttons */}
          <button style={{
            padding: '7px 10px', background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 6, cursor: 'pointer', color: '#64748b', fontSize: 14,
          }}>
            &#8593;&#8595;
          </button>
          <button style={{
            padding: '7px 10px', background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 6, cursor: 'pointer', color: '#64748b', fontSize: 14,
          }}>
            &#9776;
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Campaign Cards */}
      {!error && filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#127918;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
            {search || activeTab !== 'all' ? 'No campaigns match your filters' : 'No campaigns yet'}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
            {search || activeTab !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first gamification campaign to get started.'}
          </div>
          {!search && activeTab === 'all' && (
            <button className="btn btn-primary" onClick={() => navigate('/create')}>
              + New Campaign
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}>
          {filtered.map((c) => {
            const gt = getGameType(c.experience);
            const cid = c.campaignId || c._id || c.id;
            const status = (c.status || 'draft').toLowerCase();
            return (
              <div
                key={cid}
                onClick={() => navigate(`/campaign/${cid}`)}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top row: status badge + "Today" + checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StatusBadge status={status} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Today</span>
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                  </div>
                </div>

                {/* Campaign name */}
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                  {c.name || c.title || 'Untitled'}
                </div>

                {/* Campaign ID + game type */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: '#94a3b8',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    # {truncateId(cid)}
                  </span>
                  <button
                    onClick={(e) => copyId(e, cid)}
                    title="Copy Campaign ID"
                    style={{
                      padding: '2px 4px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#94a3b8',
                    }}
                  >
                    {copiedId === cid ? '&#10003;' : '&#128203;'}
                  </button>
                  <span style={{
                    width: 1, height: 14, background: '#e2e8f0', display: 'inline-block',
                  }} />
                  {gt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{gt.icon}</span>
                      <span>{gt.label}</span>
                    </span>
                  )}
                  {!gt && c.experience && (
                    <span>{c.experience}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CampaignList;
