import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../api/cglu';
import { GAME_TYPES, GAME_CATEGORIES } from '../constants/gameTypes';

function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedGame, setSelectedGame] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const grouped = GAME_CATEGORIES.map((cat) => ({
    category: cat,
    types: GAME_TYPES.filter((g) => g.category === cat),
  }));

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await createCampaign({
        name: name.trim(),
        experience: selectedGame.id,
        type: 'uidirect',
      });
      const data = res.data || res;
      const id = data.campaignId || data._id || data.id || res.campaignId;
      if (id) {
        navigate(`/campaign/${id}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create Campaign</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          &#10005; Cancel
        </button>
      </div>

      <div className="create-steps">
        <div className={`step-indicator ${step === 1 ? 'active' : ''}`}>
          <span className="step-num">1</span>
          Select Type
        </div>
        <div className={`step-indicator ${step === 2 ? 'active' : ''}`}>
          <span className="step-num">2</span>
          Configure
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {step === 1 && (
        <div>
          {grouped.map((group) => (
            <div key={group.category} className="category-section">
              <div className="category-label">{group.category}</div>
              <div className="game-types-grid">
                {group.types.map((gt) => (
                  <button
                    key={gt.id}
                    className={`game-type-card ${selectedGame?.id === gt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGame(gt)}
                  >
                    <div className="game-type-card-icon">{gt.icon}</div>
                    <div className="game-type-card-label">{gt.label}</div>
                    <div className="game-type-card-desc">{gt.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary"
              disabled={!selectedGame}
              onClick={() => setStep(2)}
              style={{ opacity: selectedGame ? 1 : 0.5 }}
            >
              Continue &#8594;
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="create-form">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="campaign-card-icon">{selectedGame.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-heading)' }}>
                {selectedGame.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {selectedGame.description}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Campaign Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Summer Spin & Win"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleCreate(); }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              &#8592; Back
            </button>
            <button
              className="btn btn-primary"
              disabled={loading || !name.trim()}
              onClick={handleCreate}
              style={{ opacity: loading || !name.trim() ? 0.5 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateCampaign;
