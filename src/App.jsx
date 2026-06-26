import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import CreateCampaign from './pages/CreateCampaign';
import LayoutEditor from './pages/LayoutEditor';

const NAV_LINKS = [
  { to: '/', label: 'Campaigns' },
  { to: '#', label: 'Segments' },
  { to: '#', label: 'Experiments' },
  { to: '#', label: 'Rewards' },
  { to: '#', label: 'AI Agent' },
  { to: '#', label: 'Dev Console' },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditor = location.pathname.startsWith('/editor');

  const isActiveLink = (to) => {
    if (to === '/') return location.pathname === '/' || location.pathname.startsWith('/campaign');
    return location.pathname === to;
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 20px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Logo + New Campaign button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}>CustomerGlu</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              background: '#10b981',
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: '0.05em',
              lineHeight: '14px',
            }}>BETA</span>
          </Link>
          <button
            onClick={() => navigate('/create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 14px',
              background: '#10b981',
              color: '#fff',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + New Campaign
          </button>
        </div>

        {/* Center: Nav links */}
        {!isEditor && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            margin: '0 auto',
          }}>
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.to);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  style={{
                    padding: '16px 16px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: active ? '#0f172a' : '#64748b',
                    textDecoration: 'none',
                    borderBottom: active ? '2px solid #0f172a' : '2px solid transparent',
                    transition: 'all 150ms',
                    lineHeight: '24px',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {isEditor && (
          <div style={{ margin: '0 auto' }}>
            <Link to="/" style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              &#8592; Back to Campaigns
            </Link>
          </div>
        )}

        {/* Right: PRODUCTION badge + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: '#ecfdf5',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#059669',
            border: '1px solid #a7f3d0',
            cursor: 'pointer',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#10b981', display: 'inline-block',
            }} />
            PRODUCTION
            <span style={{ fontSize: 10, marginLeft: 2 }}>&#9660;</span>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#6366f1', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            AB
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Routes>
          <Route path="/" element={<CampaignList />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/create" element={<CreateCampaign />} />
          <Route path="/editor/:campaignId" element={<LayoutEditor />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
