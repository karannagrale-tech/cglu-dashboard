import { useReducer, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCampaign,
  getFragmentMap,
  updateFragmentMap,
  createFragmentMap,
  updateCampaign,
} from '../api/cglu';
import { GAME_TYPES } from '../constants/gameTypes';
import { getDefaultFragment } from '../constants/defaultFragmentMaps';
import {
  layoutReducer,
  createInitialState,
  ACTION_TYPES,
  getNodeTree,
  getSelectedNode,
  getFragmentMapForSave,
} from '../engine/layoutState';
import LocalPreview from '../components/LocalPreview';
import AskAiraPanel from '../components/AskAiraPanel';
import NodeEditorPanel from '../components/NodeEditorPanel';
import AddElementPanel from '../components/AddElementPanel';
import GameSettingsPanel from '../components/GameSettingsPanel';
import BrandKit, { DEFAULT_BRAND, PRESET_BRANDS, brandToThemePatches, brandToSliceColors } from '../components/BrandKit';

/* ── Helpers ──────────────────────────────────────────────── */

function getGameInfo(experience) {
  return GAME_TYPES.find((g) => g.id === experience) || { icon: '🎮', label: experience || 'Campaign' };
}

/* ── Friendly names for tree ────────────────────────── */

const NODE_DISPLAY = {
  ROOT: { icon: '🎨', label: 'Page Background' },
  TEXT_1: { icon: '📝', label: 'Title' },
  TEXT_2: { icon: '📝', label: 'Subtitle' },
  TEXT_HINT: { icon: '💡', label: 'Hint Text' },
  TEXT_HELP: { icon: '❓', label: 'Help Text' },
  SC: { icon: '🎴', label: 'Scratch Card' },
  STW_1: { icon: '🎡', label: 'Spin Wheel' },
  QUIZ_1: { icon: '❓', label: 'Quiz' },
  CTA: { icon: '👆', label: 'CTA Button' },
  CC: { icon: '🎟️', label: 'Coupon Code' },
  RC: { icon: '🎁', label: 'Reward Card' },
  TNC: { icon: '📋', label: 'Terms & Conditions' },
  REWARD_BODY: { icon: '🏆', label: 'Reward Text' },
  EXPIRY: { icon: '⏱️', label: 'Expiry Timer' },
  EXPIRY_DATE: { icon: '📅', label: 'Expiry Date' },
  IMG_1: { icon: '🖼️', label: 'Image' },
  ANIME_BLOCK: { icon: '✨', label: 'Animation' },
  CONDITIONAL: { icon: '🔀', label: 'Reward Section' },
  CONDITIONAL_1: { icon: '🔀', label: 'Conditional 1' },
  CONDITIONAL_2: { icon: '🔀', label: 'Conditional 2' },
};

function getNodeDisplay(nodeId, typeId) {
  if (NODE_DISPLAY[nodeId]) return NODE_DISPLAY[nodeId];
  // Fallback by type
  if (typeId?.includes('TEXT')) return { icon: '📝', label: nodeId };
  if (typeId?.includes('BUTTON')) return { icon: '👆', label: nodeId };
  if (typeId?.includes('IMAGE')) return { icon: '🖼️', label: nodeId };
  if (typeId?.includes('CONDITIONAL')) return { icon: '🔀', label: nodeId };
  if (typeId?.includes('CONTAINER')) return { icon: '📦', label: nodeId };
  return { icon: '⬜', label: nodeId };
}

/* ── StructureTreeNode (recursive) ────────────────────────── */

function StructureTreeNode({ node, depth, selectedId, onSelect, searchTerm }) {
  const [expanded, setExpanded] = useState(depth < 3);
  const hasChildren = node.children && node.children.length > 0;
  const nodeId = node.id;
  const typeId = node.type_id || '';
  const isSelected = selectedId === nodeId;
  const display = getNodeDisplay(nodeId, typeId);

  const matchesSearch = !searchTerm
    || nodeId.toLowerCase().includes(searchTerm)
    || typeId.toLowerCase().includes(searchTerm)
    || display.label.toLowerCase().includes(searchTerm);

  const childMatchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    function check(n) {
      const d = getNodeDisplay(n.id, n.type_id);
      if ((n.id || '').toLowerCase().includes(searchTerm)) return true;
      if ((n.type_id || '').toLowerCase().includes(searchTerm)) return true;
      if (d.label.toLowerCase().includes(searchTerm)) return true;
      return (n.children || []).some(check);
    }
    return check(node);
  }, [node, searchTerm]);

  if (searchTerm && !matchesSearch && !childMatchesSearch) return null;

  // Get content preview (first 30 chars of text content)
  const textPreview = node.ui?.content?.text;
  const previewText = textPreview ? (textPreview.length > 25 ? textPreview.slice(0, 25) + '…' : textPreview) : null;

  return (
    <>
      <div
        onClick={() => onSelect(nodeId)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', paddingLeft: `${12 + depth * 18}px`,
          borderRadius: 6, cursor: 'pointer', fontSize: 13,
          background: isSelected ? '#EDE9FE' : 'transparent',
          color: isSelected ? '#6D28D9' : 'var(--text)',
          fontWeight: isSelected ? 600 : 400, marginBottom: 1,
          borderLeft: isSelected ? '3px solid #7c3aed' : '3px solid transparent',
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded((v) => !v); }}
          style={{
            display: 'inline-flex', width: 16, height: 16,
            alignItems: 'center', justifyContent: 'center', fontSize: 10,
            color: 'var(--text-muted)', flexShrink: 0,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          {hasChildren ? '▶' : ''}
        </span>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{display.icon}</span>
        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontSize: 13 }}>
            {display.label}
          </div>
          {previewText && (
            <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{previewText}"
            </div>
          )}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace', flexShrink: 0 }}>
          {nodeId}
        </span>
      </div>
      {hasChildren && expanded && node.children.map((child, i) => (
        <StructureTreeNode
          key={child.id || `${nodeId}-${i}`}
          node={child} depth={depth + 1} selectedId={selectedId}
          onSelect={onSelect} searchTerm={searchTerm}
        />
      ))}
    </>
  );
}

/* ── StructurePanel ───────────────────────────────────────── */

function StructurePanel({ tree, selectedNodeId, onSelectNode, onEditJson, onResetLayout, onAddElement }) {
  const [search, setSearch] = useState('');
  const searchTerm = search.toLowerCase().trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border-light)' }}>
        <button className="btn btn-ghost btn-sm" onClick={onEditJson} style={{ fontSize: 12 }}>Edit Full JSON</button>
        <button className="btn btn-ghost btn-sm" onClick={onResetLayout} style={{ fontSize: 12 }}>Reset</button>
      </div>
      <div style={{ padding: '8px 16px' }}>
        <input type="text" placeholder="Search nodes..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
        {tree ? (
          <StructureTreeNode node={tree} depth={0} selectedId={selectedNodeId} onSelect={onSelectNode} searchTerm={searchTerm} />
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>&#128450;</div>No layout configured
          </div>
        )}
      </div>
      {/* Add Element button */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-light)' }}>
        <button
          onClick={onAddElement}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            border: '1px dashed #C4B5FD', background: '#FAF5FF',
            color: '#7C3AED', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#7C3AED'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FAF5FF'; e.currentTarget.style.borderColor = '#C4B5FD'; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Element
        </button>
      </div>
    </div>
  );
}

/* ── PhoneMockup ──────────────────────────────────────────── */

function PhoneMockup({ children }) {
  return (
    <div style={{
      width: 375, height: 720, borderRadius: 40, border: '6px solid #1a1a2e',
      background: '#000', position: 'relative',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 0 2px #333', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 150, height: 28, background: '#1a1a2e', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
      <div style={{ width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', background: '#f0f0f0' }}>{children}</div>
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 4, borderRadius: 2, background: '#666' }} />
    </div>
  );
}

/* ── Inline banners & toasts ──────────────────────────────── */

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', fontSize: 13, color: '#991B1B' }}>
      <span>Error: {message}</span>
      {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 700 }}>Dismiss</button>}
    </div>
  );
}

function DefaultTemplateBanner() {
  return (
    <div style={{ padding: '8px 16px', background: '#FEF3C7', borderBottom: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
      This is a default template -- make changes and save to create your layout.
    </div>
  );
}

function SaveToast({ message, type, onClose }) {
  if (!message) return null;
  const isErr = type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 500, padding: '12px 20px', borderRadius: 8,
      background: isErr ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${isErr ? '#FECACA' : '#BBF7D0'}`,
      color: isErr ? '#991B1B' : '#166534', fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}>x</button>
    </div>
  );
}

/* ── Reward state button config ───────────────────────────── */

const REWARD_STATE_BUTTONS = [
  { id: 'redeemable-seen', label: 'Redeemable Seen', icon: '&#128065;', color: 'var(--primary)', bg: 'var(--primary-light)' },
  { id: 'redeemable-unseen', label: 'Redeemable Unseen', icon: '&#127873;', color: '#D97706', bg: '#FEF3C7' },
];

/* ══════════════════════════════════════════════════════════════
   Main LayoutEditor
   ══════════════════════════════════════════════════════════════ */

function LayoutEditor() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(layoutReducer, null, createInitialState);

  const [campaign, setCampaign] = useState(null);
  const [fragmentMapId, setFragmentMapId] = useState(null);
  // Preview is always local/reactive. On deployment to *.customerglu.com,
  // this becomes the constellation iframe which reads from the same data.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFullJson, setShowFullJson] = useState(false);
  const [fullJsonText, setFullJsonText] = useState('');
  const [showAddElement, setShowAddElement] = useState(false);
  const [rightTab, setRightTab] = useState('editor');
  const [gameSettings, setGameSettings] = useState({});
  const [brand, setBrand] = useState(() => {
    // Load brand from localStorage if saved
    try { const s = localStorage.getItem('cglu_brand'); return s ? JSON.parse(s) : { ...DEFAULT_BRAND }; }
    catch { return { ...DEFAULT_BRAND }; }
  });
  const toastTimer = useRef(null);

  const gameInfo = useMemo(() => getGameInfo(campaign?.experience), [campaign]);
  const tree = useMemo(() => getNodeTree(state), [state]);
  const selectedNode = useMemo(() => getSelectedNode(state), [state]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Load campaign data ─────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const campRes = await getCampaign(campaignId);
        const camp = campRes.data || campRes;
        if (cancelled) return;
        setCampaign(camp);

        let loadedFm = null;
        let isDefault = false;
        const fmId = camp.fragmentMapId || camp.fragment_map_id || camp.fragmentMap;
        if (fmId) {
          try {
            const fmRes = await getFragmentMap(fmId);
            loadedFm = fmRes.data || fmRes;
            if (!cancelled) setFragmentMapId(fmId);
          } catch (e) { console.warn('Fragment map load failed:', e.message); }
        }
        if (!loadedFm && camp.experience) {
          const defaultFM = getDefaultFragment(camp.experience);
          if (defaultFM) { loadedFm = defaultFM; isDefault = true; if (!cancelled) setFragmentMapId('local-draft'); }
        }
        if (loadedFm && !cancelled) {
          dispatch({ type: ACTION_TYPES.LOAD_FRAGMENT_MAP, fragmentMap: loadedFm, isDefault });
        }
        // Preview URL not needed — local preview renders from state directly
      } catch (err) { if (!cancelled) setLoadError(err.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [campaignId]);

  /* ── Save ───────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!state?.isDirty || !state?.byId) return;
    setSaving(true);
    try {
      const fm = getFragmentMapForSave(state);
      if (!fm) throw new Error('No fragment map data');

      if (!fragmentMapId || fragmentMapId === 'local-draft') {
        // First save — CREATE a new fragmentMap on the server
        const createRes = await createFragmentMap(fm);
        const newFmId = createRes.data?._id || createRes._id || createRes.data?.id;
        if (!newFmId) throw new Error('Failed to create fragment map — no ID returned');

        // Link the new fragmentMap to the campaign
        try {
          await updateCampaign(campaignId, { fragmentMap: newFmId });
        } catch (linkErr) {
          console.warn('Could not link fragmentMap to campaign:', linkErr.message);
        }

        setFragmentMapId(newFmId);
        dispatch({ type: ACTION_TYPES.MARK_SAVED, fragmentMap: fm });
        showToast('Layout created & saved ✓');
      } else {
        // Subsequent saves — UPDATE existing fragmentMap
        await updateFragmentMap(fragmentMapId, fm);
        dispatch({ type: ACTION_TYPES.MARK_SAVED, fragmentMap: fm });
        showToast('Saved ✓ Preview refreshing...');
      }

      // Note: On deployment to *.customerglu.com, the save pipeline will also
      // sync ProgramLayout and flush constellation caches automatically.
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [state, fragmentMapId, campaignId, showToast]);

  const handleDeleteNode = useCallback(() => {
    if (!state?.selectedNodeId || state.selectedNodeId === state.rootId) return;
    dispatch({ type: ACTION_TYPES.DELETE_NODE, nodeId: state.selectedNodeId });
  }, [state?.selectedNodeId, state?.rootId]);

  const handleResetLayout = useCallback(() => {
    if (!state?.fragmentMap) return;
    if (!window.confirm('Reset all unsaved changes?')) return;
    dispatch({ type: ACTION_TYPES.LOAD_FRAGMENT_MAP, fragmentMap: state.fragmentMap, isDefault: state.isDefault });
  }, [state?.fragmentMap, state?.isDefault]);

  function handleOpenFullJson() {
    setFullJsonText(JSON.stringify(getFragmentMapForSave(state), null, 2));
    setShowFullJson(true);
  }
  function handleSaveFullJson() {
    try { dispatch({ type: ACTION_TYPES.REPLACE_FRAGMENT_MAP, fragmentMap: JSON.parse(fullJsonText) }); setShowFullJson(false); }
    catch { alert('Invalid JSON'); }
  }

  /* ── Brand Kit ──────────────────────────────────── */
  const handleBrandChange = useCallback((newBrand) => {
    setBrand(newBrand);
    try { localStorage.setItem('cglu_brand', JSON.stringify(newBrand)); } catch {}
  }, []);

  const handleApplyBrand = useCallback(() => {
    if (!state?.byId) return;
    const patches = brandToThemePatches(brand);
    dispatch({ type: ACTION_TYPES.APPLY_THEME, patches });

    // Also update spin wheel slice colors if STW_1 exists
    const byId = state.byId;
    if (byId.STW_1?.ui?.content?.slices) {
      const slices = [...byId.STW_1.ui.content.slices];
      const colors = brandToSliceColors(brand, slices.length);
      slices.forEach((s, i) => { s.backgroundColor = colors[i]; });
      dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId: 'STW_1', key: 'slices', value: slices });
    }

    // Update scratch card cover color if SC exists
    if (byId.SC) {
      dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId: 'SC', key: 'coverColor', value: brand.primaryColor });
    }

    showToast(`Applied "${brand.name || 'Brand'}" theme ✓`);
  }, [state?.byId, brand, dispatch, showToast]);

  /* ── Keyboard shortcuts ─────────────────────────── */
  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: ACTION_TYPES.UNDO }); }
      else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); dispatch({ type: ACTION_TYPES.REDO }); }
      else if (mod && e.key === 's') { e.preventDefault(); handleSave(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  /* ── Render: loading / error ────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div className="spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading layout editor...</div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>&#9888;</div>
        <div className="error-banner">{loadError}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Campaigns</button>
      </div>
    );
  }

  const canUndo = (state?.undoStack?.length || 0) > 0;
  const canRedo = (state?.redoStack?.length || 0) > 0;
  const canDelete = state?.selectedNodeId && state.selectedNodeId !== state?.rootId;

  /* ── Main render ────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {state?.error && <ErrorBanner message={state.error} onDismiss={() => dispatch({ type: ACTION_TYPES.CLEAR_ERROR })} />}
      {state?.isDefault && <DefaultTemplateBanner />}

      {/* ── Toolbar ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, padding: '0 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(`/campaigns/${campaignId}`)} title="Back"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'white', fontSize: 16, color: 'var(--text)', cursor: 'pointer' }}>&#8592;</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>&#10024; Layout Editor</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Campaign:</span>
            <div style={{ padding: '4px 10px', borderRadius: 6, background: '#f1f5f9', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campaign?.name || 'Untitled'} &middot; {campaignId?.slice(0, 12)}...
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ToolbarButton onClick={() => dispatch({ type: ACTION_TYPES.UNDO })} disabled={!canUndo} title="Undo (Ctrl+Z)" label="&#8630;" />
          <ToolbarButton onClick={() => dispatch({ type: ACTION_TYPES.REDO })} disabled={!canRedo} title="Redo (Ctrl+Y)" label="&#8631;" />
          <ToolbarButton onClick={handleDeleteNode} disabled={!canDelete} title="Delete node" label="&#128465;" color={canDelete ? '#ef4444' : undefined} />
          <button onClick={handleSave} disabled={!state?.isDirty || saving}
            style={{ padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: state?.isDirty && !saving ? 'pointer' : 'default', background: state?.isDirty ? '#10b981' : '#D1D5DB', color: 'white', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Three-panel grid ─────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: Structure */}
        <div style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{gameInfo.icon}</span><span>{gameInfo.label}</span>
              {campaign && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>[{campaign.name || 'Untitled'}]</span>}
            </div>
          </div>
          {/* Reward state */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Reward State</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Toggle between game and reward screens</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {REWARD_STATE_BUTTONS.map((rs) => {
                const active = state?.rewardState === rs.id;
                return (
                  <button key={rs.id} onClick={() => dispatch({ type: ACTION_TYPES.SET_REWARD_STATE, rewardState: rs.id })}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: active ? `2px solid ${rs.color}` : '1px solid var(--border)', background: active ? rs.bg : 'white', color: active ? rs.color : 'var(--text)' }}
                    dangerouslySetInnerHTML={{ __html: `${rs.icon} ${rs.label}` }} />
                );
              })}
            </div>
          </div>
          <div style={{ padding: '8px 16px 4px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Structure</div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <StructurePanel tree={tree} selectedNodeId={state?.selectedNodeId}
              onSelectNode={(id) => dispatch({ type: ACTION_TYPES.SELECT_NODE, nodeId: id })}
              onEditJson={handleOpenFullJson} onResetLayout={handleResetLayout}
              onAddElement={() => setShowAddElement(true)} />
          </div>
        </div>

        {/* CENTER: Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
              <span>&#128065;</span><span>Preview</span>
              {saving && <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>● Saving...</span>}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Click any element to select & edit
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'auto' }}>
            <PhoneMockup>
              {state?.byId ? (
                <LocalPreview
                  byId={state.byId} rootId={state.rootId || 'ROOT'}
                  rewardState={state.rewardState}
                  selectedNodeId={state.selectedNodeId}
                  onSelectNode={(id) => { dispatch({ type: ACTION_TYPES.SELECT_NODE, nodeId: id }); setRightTab('editor'); }}
                  deviceWidth={363}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>{gameInfo.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{gameInfo.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>No layout data loaded</div>
                </div>
              )}
            </PhoneMockup>
          </div>
        </div>

        {/* RIGHT: Tabbed panel — Editor / Settings / Aira */}
        <div style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
            {[
              { id: 'editor', label: '✏️ Editor', desc: 'Edit selected element' },
              { id: 'settings', label: '⚙️ Settings', desc: 'Game configuration' },
              { id: 'aira', label: '✨ Aira', desc: 'AI assistant' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                title={tab.desc}
                style={{
                  flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  borderBottom: rightTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                  color: rightTab === tab.id ? '#6366f1' : '#64748b',
                  background: rightTab === tab.id ? 'white' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {rightTab === 'editor' && (
              <NodeEditorPanel nodeId={state?.selectedNodeId} nodeData={selectedNode} dispatch={dispatch} />
            )}
            {rightTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
                <BrandKit brand={brand} onBrandChange={handleBrandChange} onApplyBrand={handleApplyBrand} />
                <div style={{ borderTop: '2px solid #e2e8f0' }}>
                  <GameSettingsPanel
                    experience={campaign?.experience}
                    settings={gameSettings}
                    onChange={setGameSettings}
                  />
                </div>
              </div>
            )}
            {rightTab === 'aira' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AskAiraPanel byId={state?.byId} selectedNodeId={state?.selectedNodeId} rewardState={state?.rewardState} dispatch={dispatch} campaignExperience={campaign?.experience}
                  onApplyBrand={handleApplyBrand}
                  onLoadBrandPreset={(preset) => {
                    if (PRESET_BRANDS[preset]) {
                      handleBrandChange({ ...PRESET_BRANDS[preset] });
                      // Apply after state updates
                      setTimeout(() => {
                        const patches = brandToThemePatches(PRESET_BRANDS[preset]);
                        dispatch({ type: ACTION_TYPES.APPLY_THEME, patches });
                        showToast(`Applied ${PRESET_BRANDS[preset].name} brand ✓`);
                      }, 50);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full JSON overlay */}
      {showFullJson && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, width: '80%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Fragment Map JSON</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveFullJson}>Apply</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowFullJson(false)}>Close</button>
              </div>
            </div>
            <textarea style={{ flex: 1, padding: 20, border: 'none', resize: 'none', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, background: '#f8fafc', minHeight: 500 }}
              value={fullJsonText} onChange={(e) => setFullJsonText(e.target.value)} />
          </div>
        </div>
      )}

      {showAddElement && (
        <AddElementPanel
          byId={state?.byId}
          selectedNodeId={state?.selectedNodeId}
          dispatch={dispatch}
          onClose={() => setShowAddElement(false)}
        />
      )}

      <SaveToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

/* ── ToolbarButton (small reusable) ───────────────────────── */

function ToolbarButton({ onClick, disabled, title, label, color }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)',
        background: 'white', fontSize: 14,
        color: color || (disabled ? 'var(--text-muted)' : 'var(--text)'),
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

export default LayoutEditor;
