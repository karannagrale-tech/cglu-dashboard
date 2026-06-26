import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaign, updateCampaign } from '../api/cglu';
import { GAME_TYPES } from '../constants/gameTypes';

function getGameType(experience) {
  return GAME_TYPES.find((g) => g.id === experience) || null;
}

const STATUS_COLORS = {
  draft: { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  running: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  live: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  stopped: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  scheduled: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  completed: { bg: '#f3f4f6', text: '#6b7280', dot: '#6b7280' },
  expired: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
};

const SIDEBAR_ITEMS_BASE = [
  { id: 'overview', label: 'Overview', icon: '☰' },
  { id: 'audience', label: 'Audience', icon: '\u{1F465}' },
  { id: 'rewards', label: 'Rewards', icon: '\u{1F381}' },
  { id: 'widgets', label: 'Widgets', icon: '⬚' },
  { id: 'schedule', label: 'Schedule & Launch', icon: '\u{1F552}' },
];

// Activities tab only for multistep/gamechallenge/streak
const ACTIVITY_EXPERIENCES = ['multistep', 'gamechallenge', 'streak', 'collectthestamps'];

/* ================================================================
   Sub-sections rendered based on active sidebar tab
   ================================================================ */

function OverviewSection({ campaign }) {
  const gt = getGameType(campaign.experience);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
        Campaign Overview
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <InfoCard label="Campaign Name" value={campaign.name || 'Untitled'} />
        <InfoCard label="Campaign ID" value={campaign.campaignId || campaign._id} mono />
        <InfoCard label="Status" value={
          <StatusDot status={campaign.status} />
        } />
        <InfoCard label="Experience Type" value={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {gt && <span>{gt.icon}</span>}
            {gt ? gt.label : campaign.experience}
          </span>
        } />
        <InfoCard label="Campaign Type" value={campaign.type || 'uidirect'} />
        <InfoCard label="Fragment Map" value={String(campaign.fragmentMap || campaign.fragmentMapId || 'None')} mono />
        {campaign.validity && (
          <>
            <InfoCard label="Expiry" value={campaign.validity.campaignExpiry?.type || campaign.validity.timeLimit?.type || 'Not set'} />
            <InfoCard label="Occurrence" value={campaign.validity.occurrence ? `${campaign.validity.occurrence.type} (${campaign.validity.occurrence.value})` : 'Not set'} />
          </>
        )}
        {campaign.banner && (
          <>
            <InfoCard label="Banner Title" value={campaign.banner.title || campaign.banner.campaignName || 'None'} />
            <InfoCard label="Banner Body" value={campaign.banner.body || 'None'} />
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }) {
  return (
    <div style={{
      background: '#f8fafc', borderRadius: 8, padding: '14px 16px',
      border: '1px solid #f1f5f9',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 500, color: '#0f172a',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all',
      }}>
        {value}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />
      <span style={{ textTransform: 'capitalize' }}>{status === 'running' ? 'Live' : status}</span>
    </span>
  );
}

/* ---- Audience ---- */
function AudienceSection({ campaign, onChange }) {
  const [audienceType, setAudienceType] = useState(
    campaign.audience?.type === 'segment' ? 'segment' : 'all'
  );
  const [audienceName, setAudienceName] = useState(campaign.audience?.name || '');

  function handleTypeChange(type) {
    setAudienceType(type);
    if (type === 'all') {
      onChange({ audience: { type: 'all', name: 'All Users' } });
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          Audience Configuration
        </h2>
        <button style={{
          padding: '7px 14px', fontSize: 13, fontWeight: 600,
          color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe',
          borderRadius: 6, cursor: 'pointer',
        }}>
          + Create Segment
        </button>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: 20,
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 8, cursor: 'pointer',
            background: audienceType === 'all' ? '#eef2ff' : 'transparent',
            border: audienceType === 'all' ? '1px solid #c7d2fe' : '1px solid transparent',
            marginBottom: 8,
          }}>
            <input
              type="radio"
              name="audience"
              checked={audienceType === 'all'}
              onChange={() => handleTypeChange('all')}
              style={{ accentColor: '#6366f1' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>All Users</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Target all users in your app</div>
            </div>
          </label>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 8, cursor: 'pointer',
            background: audienceType === 'segment' ? '#eef2ff' : 'transparent',
            border: audienceType === 'segment' ? '1px solid #c7d2fe' : '1px solid transparent',
          }}>
            <input
              type="radio"
              name="audience"
              checked={audienceType === 'segment'}
              onChange={() => handleTypeChange('segment')}
              style={{ accentColor: '#6366f1' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Select Audience</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Choose a specific segment</div>
            </div>
          </label>
        </div>

        {audienceType === 'segment' && (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Audience Name / ID
            </label>
            <input
              type="text"
              placeholder="Enter audience name or ID"
              value={audienceName}
              onChange={(e) => {
                setAudienceName(e.target.value);
                onChange({ audience: { type: 'segment', name: e.target.value } });
              }}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
                borderRadius: 6, fontSize: 14, outline: 'none',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Rewards ---- */
function RewardsSection({ campaign, onChange }) {
  const slots = campaign.slots || [];
  const [rewardMode, setRewardMode] = useState('single');

  function addSlot() {
    const newSlot = {
      slotIndex: slots.length,
      probability: 0,
      reward: {
        type: 'coupon',
        rewardTemplateConfig: {
          experience: campaign.experience,
          rewardProperties: {
            title: 'New Reward',
            body: 'Reward description',
            icon: '',
            code: '',
            tnc: [],
            CTA: 'Claim Now',
          },
        },
      },
    };
    onChange({ slots: [...slots, newSlot] });
  }

  function updateSlot(idx, patch) {
    const updated = slots.map((s, i) => i === idx ? { ...s, ...patch } : s);
    onChange({ slots: updated });
  }

  function removeSlot(idx) {
    onChange({ slots: slots.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          Reward Slot Configuration
        </h2>
        <button
          onClick={addSlot}
          style={{
            padding: '7px 14px', fontSize: 13, fontWeight: 600,
            color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          + Add Slot
        </button>
      </div>

      {/* Reward Mode Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        background: '#f8fafc', padding: '10px 16px', borderRadius: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Reward Mode:</span>
        <div style={{
          display: 'flex', background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 6, overflow: 'hidden',
        }}>
          {['single', 'multiple'].map((mode) => (
            <button
              key={mode}
              onClick={() => setRewardMode(mode)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 600,
                color: rewardMode === mode ? '#fff' : '#64748b',
                background: rewardMode === mode ? '#6366f1' : 'transparent',
                border: 'none', cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {mode === 'single' ? 'Single Set' : 'Multiple Sets'}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Slots */}
      {slots.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px', color: '#94a3b8',
          background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>&#127873;</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>No reward slots configured</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Click "Add Slot" to create one</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slots.map((slot, idx) => {
            const rp = slot.reward?.rewardTemplateConfig?.rewardProperties || {};
            return (
              <div key={idx} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                        {rp.title || `Slot ${idx + 1}`}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: '#eef2ff', color: '#6366f1',
                      }}>
                        {slot.reward?.type || 'coupon'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {rp.body || 'No description'}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSlot(idx)}
                    style={{
                      padding: '4px 8px', fontSize: 12, color: '#ef4444',
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: 4, cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>

                {/* Probability */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                      Probability %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={slot.probability || 0}
                      onChange={(e) => updateSlot(idx, { probability: Number(e.target.value) })}
                      style={{
                        width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0',
                        borderRadius: 6, fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                      Reward Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SAVE20"
                      value={rp.code || ''}
                      onChange={(e) => {
                        const updated = [...slots];
                        const config = { ...updated[idx].reward?.rewardTemplateConfig || {} };
                        config.rewardProperties = { ...config.rewardProperties, code: e.target.value };
                        updated[idx] = {
                          ...updated[idx],
                          reward: { ...updated[idx].reward, rewardTemplateConfig: config },
                        };
                        onChange({ slots: updated });
                      }}
                      style={{
                        width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0',
                        borderRadius: 6, fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                      CTA Text
                    </label>
                    <input
                      type="text"
                      placeholder="Claim Now"
                      value={rp.CTA || ''}
                      onChange={(e) => {
                        const updated = [...slots];
                        const config = { ...updated[idx].reward?.rewardTemplateConfig || {} };
                        config.rewardProperties = { ...config.rewardProperties, CTA: e.target.value };
                        updated[idx] = {
                          ...updated[idx],
                          reward: { ...updated[idx].reward, rewardTemplateConfig: config },
                        };
                        onChange({ slots: updated });
                      }}
                      style={{
                        width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0',
                        borderRadius: 6, fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Limits */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '10px 14px', background: '#f8fafc', borderRadius: 8,
                  fontSize: 12, color: '#64748b',
                }}>
                  <span style={{ fontWeight: 600 }}>Limits:</span>
                  <span>Hourly: -</span>
                  <span>Daily: -</span>
                  <span>Campaign: -</span>
                  <span>Per User: -</span>
                </div>

                {/* Release Mode */}
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Release Mode:</span>
                  <div style={{ display: 'flex', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                    {['immediate', 'scheduled', 'manual'].map((mode) => (
                      <button
                        key={mode}
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 500,
                          color: '#64748b', background: 'transparent',
                          border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Widgets ---- */
function WidgetsSection({ campaign }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
        Widget Configuration
      </h2>
      <div style={{
        background: '#f8fafc', borderRadius: 10, padding: '40px 20px',
        textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#9634;</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Widget settings</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          Configure how this campaign appears in your app (banner, popup, embedded, full-page).
        </div>
        {campaign.banner && (
          <div style={{
            marginTop: 20, background: '#fff', borderRadius: 8,
            padding: 16, border: '1px solid #e2e8f0', textAlign: 'left',
            maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>
              Banner Preview
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {campaign.banner.title || 'Untitled Banner'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {campaign.banner.body || ''}
            </div>
            {campaign.banner.imageUrl && (
              <img
                src={campaign.banner.imageUrl}
                alt="banner"
                style={{ width: '100%', borderRadius: 6, marginTop: 8 }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Activities (multistep/gamechallenge/streak) ---- */
function ActivitiesSection({ campaign, onChange }) {
  const activity = campaign.activity || { count: 0, activities: [] };
  const activities = activity.activities || [];
  const stepUI = campaign.stepUI || {};

  const LBL = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
  const INP = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none', width: '100%' };
  const CARD = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 };

  function addActivity() {
    const newActivity = {
      activityId: 'activity_' + Date.now(),
      eventName: 'custom_event',
      turnCount: 1,
      limits: { campaign: 1, daily: 1 },
      styleConfig: { title: `Step ${activities.length + 1}`, body: 'Complete this activity' },
    };
    const updated = [...activities, newActivity];
    onChange({
      activity: { ...activity, count: updated.length, activities: updated },
    });
  }

  function updateActivity(idx, patch) {
    const updated = activities.map((a, i) => i === idx ? { ...a, ...patch } : a);
    onChange({ activity: { ...activity, activities: updated } });
  }

  function removeActivity(idx) {
    const updated = activities.filter((_, i) => i !== idx);
    onChange({ activity: { ...activity, count: updated.length, activities: updated } });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Activities Configuration
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {campaign.experience === 'multistep' ? 'Configure the steps users must complete' :
             campaign.experience === 'streak' ? 'Configure daily check-in activities' :
             campaign.experience === 'gamechallenge' ? 'Configure challenge activities' :
             'Configure stamp collection activities'}
          </div>
        </div>
        <button onClick={addActivity} style={{
          padding: '7px 14px', fontSize: 13, fontWeight: 600,
          color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe',
          borderRadius: 6, cursor: 'pointer',
        }}>
          + Add Activity
        </button>
      </div>

      {/* Step UI config */}
      <div style={{ ...CARD, background: '#f8fafc', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LBL}>Program Title</label>
            <input type="text" value={stepUI.programTitle || ''} placeholder="Begin Your Journey"
              onChange={(e) => onChange({ stepUI: { ...stepUI, programTitle: e.target.value } })}
              style={INP} />
          </div>
          <div>
            <label style={LBL}>Step Type</label>
            <select value={stepUI.type || 'sequence'}
              onChange={(e) => onChange({ stepUI: { ...stepUI, type: e.target.value } })}
              style={INP}>
              <option value="sequence">Sequence (in order)</option>
              <option value="checklist">Checklist (any order)</option>
              <option value="collectthestamps">Stamp Collection</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ ...LBL, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={stepUI.giveRewardAtEnd || false}
              onChange={(e) => onChange({ stepUI: { ...stepUI, giveRewardAtEnd: e.target.checked } })} />
            Give reward only after all steps are completed
          </label>
        </div>
      </div>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>No activities configured</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Add activities that users need to complete</div>
        </div>
      ) : (
        activities.map((act, idx) => (
          <div key={act.activityId || idx} style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#6366f1',
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                  {act.styleConfig?.title || `Activity ${idx + 1}`}
                </span>
              </div>
              <button onClick={() => removeActivity(idx)} style={{
                padding: '4px 8px', fontSize: 12, color: '#ef4444',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 4, cursor: 'pointer',
              }}>
                Remove
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LBL}>Step Title</label>
                <input type="text" value={act.styleConfig?.title || ''}
                  onChange={(e) => updateActivity(idx, {
                    styleConfig: { ...(act.styleConfig || {}), title: e.target.value }
                  })}
                  style={INP} />
              </div>
              <div>
                <label style={LBL}>Event Name</label>
                <input type="text" value={act.eventName || ''}
                  onChange={(e) => updateActivity(idx, { eventName: e.target.value })}
                  style={INP} />
              </div>
              <div>
                <label style={LBL}>Description</label>
                <input type="text" value={act.styleConfig?.body || ''}
                  onChange={(e) => updateActivity(idx, {
                    styleConfig: { ...(act.styleConfig || {}), body: e.target.value }
                  })}
                  style={INP} />
              </div>
              <div>
                <label style={LBL}>Required Count</label>
                <input type="number" min={1} max={100} value={act.turnCount || 1}
                  onChange={(e) => updateActivity(idx, { turnCount: parseInt(e.target.value) || 1 })}
                  style={INP} />
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
              ID: {act.activityId || 'auto'}
            </div>
          </div>
        ))
      )}

      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
        Total activities: {activities.length} · Type: {stepUI.type || 'sequence'}
      </div>
    </div>
  );
}

/* ---- Schedule & Launch ---- */
function ScheduleSection({ campaign, onChange }) {
  const validity = campaign.validity || {};
  const occurrence = validity.occurrence || {};
  const timeLimit = validity.timeLimit || {};

  function updateOccurrence(field, value) {
    onChange({
      validity: {
        ...validity,
        occurrence: { ...occurrence, [field]: value },
      },
    });
  }

  function updateTimeLimit(field, value) {
    onChange({
      validity: {
        ...validity,
        timeLimit: { ...timeLimit, [field]: value },
      },
    });
  }

  const LBL = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
  const INP = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none' };
  const CARD = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 16 };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
        Schedule & Launch
      </h2>

      {/* Play Frequency */}
      <div style={CARD}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          🎮 Play Frequency
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          How many times can a single user play this game?
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={LBL}>Frequency Period</label>
            <select
              value={occurrence.type || 'lifetime'}
              onChange={(e) => updateOccurrence('type', e.target.value)}
              style={{ ...INP, width: '100%' }}
            >
              <option value="lifetime">Lifetime (total ever)</option>
              <option value="daily">Daily (resets each day)</option>
              <option value="hourly">Hourly (resets each hour)</option>
            </select>
          </div>
          <div>
            <label style={LBL}>Plays Allowed</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={occurrence.value || 1}
              onChange={(e) => updateOccurrence('value', parseInt(e.target.value) || 1)}
              style={{ ...INP, width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {occurrence.type === 'daily' ? 'plays per day per user' : occurrence.type === 'hourly' ? 'plays per hour per user' : 'plays per user total'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LBL}>Retry Count</label>
          <input
            type="number"
            min={0}
            max={100000}
            value={campaign.retryCount || 0}
            onChange={(e) => onChange({ retryCount: parseInt(e.target.value) || 0 })}
            style={{ ...INP, width: 200 }}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            How many times can the user retry the game (0 = no retries, 100000 = unlimited)
          </div>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Once only', occ: { type: 'lifetime', value: 1 }, retry: 0 },
            { label: '1x per day', occ: { type: 'daily', value: 1 }, retry: 100000 },
            { label: '3x per day', occ: { type: 'daily', value: 3 }, retry: 100000 },
            { label: '5x per day', occ: { type: 'daily', value: 5 }, retry: 100000 },
            { label: 'Unlimited', occ: { type: 'daily', value: 10000000 }, retry: 100000 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({
                retryCount: preset.retry,
                validity: { ...validity, occurrence: preset.occ },
              })}
              style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500,
                border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155',
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Reset / Recurring */}
      <div style={CARD}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          🔄 Auto-Reset
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          Should the game reset automatically after completion or expiry?
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#334155' }}>Reset when user completes</span>
          <div
            onClick={() => updateTimeLimit('recurAtCompletion', !timeLimit.recurAtCompletion)}
            style={{
              width: 40, height: 22, borderRadius: 11, position: 'relative',
              background: timeLimit.recurAtCompletion ? '#6366f1' : '#cbd5e1', cursor: 'pointer',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: timeLimit.recurAtCompletion ? 20 : 2,
              width: 18, height: 18, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#334155' }}>Reset when time expires</span>
          <div
            onClick={() => updateTimeLimit('recurAtExpiry', !timeLimit.recurAtExpiry)}
            style={{
              width: 40, height: 22, borderRadius: 11, position: 'relative',
              background: timeLimit.recurAtExpiry ? '#6366f1' : '#cbd5e1', cursor: 'pointer',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: timeLimit.recurAtExpiry ? 20 : 2,
              width: 18, height: 18, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
        </div>

        {(timeLimit.recurAtCompletion || timeLimit.recurAtExpiry) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={LBL}>Max resets/day</label>
              <input type="number" min={1} value={timeLimit.recurLimit?.daily || 10000000}
                onChange={(e) => updateTimeLimit('recurLimit', { ...(timeLimit.recurLimit || {}), daily: parseInt(e.target.value) || 1 })}
                style={{ ...INP, width: '100%' }} />
            </div>
            <div>
              <label style={LBL}>Max resets/week</label>
              <input type="number" min={1} value={timeLimit.recurLimit?.weekly || 10000000}
                onChange={(e) => updateTimeLimit('recurLimit', { ...(timeLimit.recurLimit || {}), weekly: parseInt(e.target.value) || 1 })}
                style={{ ...INP, width: '100%' }} />
            </div>
            <div>
              <label style={LBL}>Max resets total</label>
              <input type="number" min={1} value={timeLimit.recurLimit?.absolute || 10000000}
                onChange={(e) => updateTimeLimit('recurLimit', { ...(timeLimit.recurLimit || {}), absolute: parseInt(e.target.value) || 1 })}
                style={{ ...INP, width: '100%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Campaign Timing */}
      <div style={CARD}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          📅 Campaign Timing
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LBL}>Start Campaign</label>
            <select value="immediate" style={{ ...INP, width: '100%' }} readOnly>
              <option value="immediate">Immediately</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div>
            <label style={LBL}>End Campaign</label>
            <select value="never" style={{ ...INP, width: '100%' }} readOnly>
              <option value="never">Never</option>
              <option value="date">On specific date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div style={{
        padding: '14px 16px', background: '#f8fafc', borderRadius: 8,
        fontSize: 13, color: '#64748b',
      }}>
        <strong>Current Status:</strong>{' '}
        <StatusDot status={campaign.status} />
        <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>
          RetryCount: {campaign.retryCount || 0} ·
          Occurrence: {occurrence.type || 'lifetime'} × {occurrence.value || 1}
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   Main CampaignDetail component
   ================================================================ */
function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await getCampaign(id);
        const camp = res.data || res;
        if (!cancelled) setCampaign(camp);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleChange = useCallback((patch) => {
    setPendingChanges((prev) => ({ ...prev, ...patch }));
    setCampaign((prev) => ({ ...prev, ...patch }));
  }, []);

  async function handleSave() {
    if (!Object.keys(pendingChanges).length) return;
    try {
      setSaving(true);
      setSaveMsg(null);
      await updateCampaign(id, pendingChanges);
      setPendingChanges({});
      setSaveMsg('Changes saved successfully');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div className="error-banner">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Campaigns
        </button>
      </div>
    );
  }

  if (!campaign) return null;

  const gt = getGameType(campaign.experience);
  const cid = campaign.campaignId || campaign._id || id;
  const status = (campaign.status || 'draft').toLowerCase();
  const sc = STATUS_COLORS[status] || STATUS_COLORS.draft;

  // Build sidebar items — add Activities tab for multistep/challenge/streak games
  const SIDEBAR_ITEMS = ACTIVITY_EXPERIENCES.includes(campaign.experience)
    ? [...SIDEBAR_ITEMS_BASE.slice(0, 3),
       { id: 'activities', label: 'Activities', icon: '📋' },
       ...SIDEBAR_ITEMS_BASE.slice(3)]
    : SIDEBAR_ITEMS_BASE;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
      {/* Left Sidebar */}
      <div style={{
        width: 240, background: '#fff', borderRight: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              fontSize: 13, color: '#64748b', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            &#8592; All Campaigns
          </button>
        </div>
        <div style={{ padding: '8px 8px', flex: 1 }}>
          {SIDEBAR_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                  fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer',
                  color: active ? '#3b82f6' : '#64748b',
                  background: active ? '#eff6ff' : 'transparent',
                  transition: 'all 150ms',
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '20px 32px', background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              {campaign.name || 'Untitled Campaign'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace', fontSize: 13, color: '#94a3b8',
              }}>
                # {cid}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: sc.bg, color: sc.text,
                textTransform: 'capitalize',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                {status === 'running' ? 'Live' : status}
              </span>
              {gt && (
                <span style={{
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  background: '#f3f0ff', color: '#7c3aed',
                }}>
                  {gt.icon} {campaign.experience}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/editor/${cid}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(124,58,237,0.3)',
            }}
          >
            <span>&#10024;</span>
            Edit Layout
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: '24px 32px', background: '#f8fafc', overflowY: 'auto' }}>
          {activeTab === 'overview' && <OverviewSection campaign={campaign} />}
          {activeTab === 'audience' && <AudienceSection campaign={campaign} onChange={handleChange} />}
          {activeTab === 'rewards' && <RewardsSection campaign={campaign} onChange={handleChange} />}
          {activeTab === 'activities' && <ActivitiesSection campaign={campaign} onChange={handleChange} />}
          {activeTab === 'widgets' && <WidgetsSection campaign={campaign} />}
          {activeTab === 'schedule' && <ScheduleSection campaign={campaign} onChange={handleChange} />}
        </div>

        {/* Save Bar */}
        <div style={{
          padding: '14px 32px', background: '#fff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {saveMsg && (
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: saveMsg.startsWith('Error') ? '#ef4444' : '#10b981',
            }}>
              {saveMsg}
            </span>
          )}
          {!saveMsg && <span />}
          <button
            onClick={handleSave}
            disabled={saving || !Object.keys(pendingChanges).length}
            style={{
              width: '100%', maxWidth: 'none',
              padding: '10px 24px', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              color: '#fff',
              background: Object.keys(pendingChanges).length ? '#3b82f6' : '#94a3b8',
              border: 'none', cursor: Object.keys(pendingChanges).length ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
              transition: 'all 150ms',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CampaignDetail;
