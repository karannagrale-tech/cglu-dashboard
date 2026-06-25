import { useState, useEffect, useMemo, useCallback } from 'react';
import { NODE_LABELS } from '../constants/gameTypes';

const TABS = [
  { id: 'ui', label: 'UI' },
  { id: 'logic', label: 'Logic' },
  { id: 'nudges', label: 'Nudges' },
  { id: 'rewards', label: 'Rewards' },
];

const STYLE_TEMPLATES = [
  { id: 'none', label: '-- No Template --' },
  { id: 'modern', label: 'Modern Clean' },
  { id: 'festive', label: 'Festive' },
  { id: 'dark', label: 'Dark Mode' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'bold', label: 'Bold & Bright' },
];

const TEMPLATE_PRESETS = {
  modern: {
    container: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px' },
    text: { color: '#1F2937', fontSize: '16px', fontWeight: '500' },
    button: { backgroundColor: '#3B82F6', borderRadius: '8px', color: '#FFFFFF' },
  },
  festive: {
    container: { backgroundColor: '#FFD700', borderRadius: '16px', padding: '24px' },
    text: { color: '#FFFFFF', fontSize: '18px', fontWeight: '700' },
    button: { backgroundColor: '#DC2626', borderRadius: '12px', color: '#FFFFFF' },
  },
  dark: {
    container: { backgroundColor: '#1a1a2e', borderRadius: '16px', padding: '24px' },
    text: { color: '#E5E7EB', fontSize: '16px', fontWeight: '500' },
    button: { backgroundColor: '#7c3aed', borderRadius: '8px', color: '#FFFFFF' },
  },
  minimal: {
    container: { backgroundColor: '#FFFFFF', borderRadius: '4px', padding: '20px' },
    text: { color: '#6B7280', fontSize: '14px', fontWeight: '400' },
    button: { backgroundColor: '#3B82F6', borderRadius: '4px', color: '#FFFFFF' },
  },
  bold: {
    container: { backgroundColor: '#7C3AED', borderRadius: '20px', padding: '28px' },
    text: { color: '#FFFFFF', fontSize: '20px', fontWeight: '800' },
    button: { backgroundColor: '#F59E0B', borderRadius: '999px', color: '#1F2937' },
  },
};

function isColorValue(value) {
  if (typeof value !== 'string') return false;
  return /^#([0-9a-fA-F]{3,8})$/i.test(value) || /^(rgb|hsl|rgba|hsla)\(/i.test(value);
}

function isImageUrl(key, value) {
  if (typeof value !== 'string') return false;
  const imageKeys = ['backgroundImage', 'image', 'imageUrl', 'src', 'icon', 'logo'];
  return imageKeys.some((k) => key.toLowerCase().includes(k.toLowerCase())) ||
    /^(https?:\/\/).+\.(png|jpg|jpeg|gif|svg|webp)/i.test(value);
}

/** Render a single CSS property input */
function CssPropertyInput({ propKey, value, onChange }) {
  const isColor = isColorValue(value);

  return (
    <div className="node-field" style={{ marginBottom: 8 }}>
      <label className="node-field-label" style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted, #9CA3AF)',
        marginBottom: 2,
        textTransform: 'capitalize',
      }}>
        {propKey.replace(/([A-Z])/g, ' $1').trim()}
      </label>
      {isColor ? (
        <div className="node-field-color" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="color"
            value={value || '#ffffff'}
            onChange={(e) => onChange(propKey, e.target.value)}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              border: '1px solid var(--border, #E5E7EB)',
              borderRadius: 4,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(propKey, e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid var(--border, #E5E7EB)',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          />
        </div>
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(propKey, e.target.value)}
          style={{
            width: '100%',
            padding: '4px 8px',
            border: '1px solid var(--border, #E5E7EB)',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: typeof value === 'number' || /^\d/.test(value) ? 'monospace' : 'inherit',
          }}
        />
      )}
    </div>
  );
}

/** Render a content value - handles strings, arrays, objects */
function ContentValueEditor({ propKey, value, onChange }) {
  // String value
  if (typeof value === 'string' || typeof value === 'number') {
    const isImg = isImageUrl(propKey, String(value));
    return (
      <div className="node-field" style={{ marginBottom: 8 }}>
        <label className="node-field-label" style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted, #9CA3AF)',
          marginBottom: 2,
        }}>
          {propKey}
        </label>
        {isImg && typeof value === 'string' && value.startsWith('http') && (
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            border: '1px solid var(--border, #E5E7EB)',
            overflow: 'hidden',
            marginBottom: 4,
          }}>
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(propKey, typeof value === 'number' ? Number(e.target.value) || 0 : e.target.value)}
          style={{
            width: '100%',
            padding: '4px 8px',
            border: '1px solid var(--border, #E5E7EB)',
            borderRadius: 4,
            fontSize: 12,
          }}
        />
      </div>
    );
  }

  // Array value (children, slices, etc.)
  if (Array.isArray(value)) {
    return (
      <div className="node-field" style={{ marginBottom: 8 }}>
        <label className="node-field-label" style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted, #9CA3AF)',
          marginBottom: 4,
        }}>
          {propKey} ({value.length} items)
        </label>
        <div style={{
          border: '1px solid var(--border, #E5E7EB)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {value.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              borderBottom: idx < value.length - 1 ? '1px solid var(--border, #E5E7EB)' : 'none',
              fontSize: 12,
              background: idx % 2 === 0 ? 'var(--bg-input, #F9FAFB)' : 'transparent',
            }}>
              <span style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 10, width: 16, flexShrink: 0 }}>
                {idx}
              </span>
              {typeof item === 'string' ? (
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArr = [...value];
                    newArr[idx] = e.target.value;
                    onChange(propKey, newArr);
                  }}
                  style={{
                    flex: 1,
                    padding: '2px 6px',
                    border: '1px solid var(--border, #E5E7EB)',
                    borderRadius: 3,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                />
              ) : typeof item === 'object' && item !== null ? (
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'var(--text-secondary, #6B7280)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {JSON.stringify(item).slice(0, 80)}
                </span>
              ) : (
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Object value (nested key-value pairs)
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="node-field" style={{ marginBottom: 8 }}>
        <label className="node-field-label" style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted, #9CA3AF)',
          marginBottom: 4,
        }}>
          {propKey}
        </label>
        <div style={{
          border: '1px solid var(--border, #E5E7EB)',
          borderRadius: 6,
          padding: '6px 8px',
          background: 'var(--bg-input, #F9FAFB)',
        }}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted, #9CA3AF)', minWidth: 60, flexShrink: 0 }}>
                {k}:
              </span>
              {typeof v === 'string' || typeof v === 'number' ? (
                <input
                  type="text"
                  value={String(v)}
                  onChange={(e) => {
                    const newObj = { ...value, [k]: e.target.value };
                    onChange(propKey, newObj);
                  }}
                  style={{
                    flex: 1,
                    padding: '2px 6px',
                    border: '1px solid var(--border, #E5E7EB)',
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                />
              ) : (
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary, #6B7280)' }}>
                  {JSON.stringify(v).slice(0, 60)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Boolean
  if (typeof value === 'boolean') {
    return (
      <div className="node-field" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <label className="node-field-label" style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted, #9CA3AF)',
        }}>
          {propKey}
        </label>
        <div
          className={`toggle-switch ${value ? 'on' : ''}`}
          onClick={() => onChange(propKey, !value)}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            backgroundColor: value ? '#7c3aed' : '#D1D5DB',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            top: 2,
            left: value ? 16 : 2,
            transition: 'left 0.2s',
          }} />
        </div>
      </div>
    );
  }

  return null;
}

/** CSS section renderer */
function CssSection({ sectionKey, styles, onStyleChange }) {
  if (!styles || typeof styles !== 'object') return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-heading, #1F2937)',
        marginBottom: 6,
        textTransform: 'capitalize',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#7c3aed',
          display: 'inline-block',
        }} />
        {sectionKey}
      </div>
      {Object.entries(styles).map(([propKey, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Nested object in CSS (e.g., container > nestedProp)
          return (
            <div key={propKey} style={{ marginLeft: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #9CA3AF)' }}>{propKey}</span>
              {Object.entries(value).map(([subKey, subVal]) => (
                <CssPropertyInput
                  key={subKey}
                  propKey={subKey}
                  value={subVal}
                  onChange={(k, v) => {
                    onStyleChange(sectionKey, propKey, { ...value, [k]: v });
                  }}
                />
              ))}
            </div>
          );
        }
        return (
          <CssPropertyInput
            key={propKey}
            propKey={propKey}
            value={value}
            onChange={(k, v) => onStyleChange(sectionKey, k, v)}
          />
        );
      })}
    </div>
  );
}

function NodeEditor({ node, onSave }) {
  const [tab, setTab] = useState('ui');
  const [editedNode, setEditedNode] = useState(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [dirty, setDirty] = useState(false);

  // Reset when node changes
  useEffect(() => {
    if (!node) {
      setEditedNode(null);
      return;
    }
    // Deep clone the node's raw data
    const raw = node.raw || node;
    setEditedNode(JSON.parse(JSON.stringify(raw)));
    setJsonText(JSON.stringify(raw, null, 2));
    setJsonError('');
    setJsonMode(false);
    setSelectedTemplate('none');
    setDirty(false);
    setTab('ui');
  }, [node]);

  const nodeId = node?.id || node?.nodeId;
  const typeId = editedNode?.type_id || nodeId || '';
  const label = NODE_LABELS[nodeId] || NODE_LABELS[typeId] || typeId || 'Node';

  const contentEntries = useMemo(() => {
    if (!editedNode?.ui?.content) return [];
    return Object.entries(editedNode.ui.content);
  }, [editedNode]);

  const cssEntries = useMemo(() => {
    if (!editedNode?.ui?.css) return [];
    return Object.entries(editedNode.ui.css);
  }, [editedNode]);

  const updateContent = useCallback((key, value) => {
    setEditedNode((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.ui) updated.ui = {};
      if (!updated.ui.content) updated.ui.content = {};
      updated.ui.content[key] = value;
      setJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
    setDirty(true);
  }, []);

  const updateCssProperty = useCallback((sectionKey, propKey, value) => {
    setEditedNode((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.ui) updated.ui = {};
      if (!updated.ui.css) updated.ui.css = {};
      if (!updated.ui.css[sectionKey]) updated.ui.css[sectionKey] = {};
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Nested object replacement
        updated.ui.css[sectionKey][propKey] = value;
      } else {
        updated.ui.css[sectionKey][propKey] = value;
      }
      setJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
    setDirty(true);
  }, []);

  const applyTemplate = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    if (templateId === 'none' || !TEMPLATE_PRESETS[templateId]) return;
    const preset = TEMPLATE_PRESETS[templateId];
    setEditedNode((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.ui) updated.ui = {};
      if (!updated.ui.css) updated.ui.css = {};
      // Merge preset styles into existing CSS sections
      for (const [section, styles] of Object.entries(preset)) {
        if (updated.ui.css[section]) {
          updated.ui.css[section] = { ...updated.ui.css[section], ...styles };
        }
      }
      setJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
    setDirty(true);
  }, []);

  const handleJsonChange = useCallback((text) => {
    setJsonText(text);
    setDirty(true);
    try {
      const parsed = JSON.parse(text);
      setEditedNode(parsed);
      setJsonError('');
    } catch (e) {
      setJsonError(e.message);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!editedNode || !nodeId) return;
    setSaving(true);
    try {
      await onSave(nodeId, editedNode);
      setDirty(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [editedNode, nodeId, onSave]);

  if (!node) {
    return (
      <div className="node-editor-empty" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        textAlign: 'center',
        color: 'var(--text-muted, #9CA3AF)',
        height: '100%',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>&#128065;</div>
        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary, #6B7280)' }}>
          No node selected
        </div>
        <div style={{ fontSize: 12 }}>Click a node in the structure tree to edit it.</div>
      </div>
    );
  }

  return (
    <div className="node-editor" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid var(--border, #E5E7EB)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-heading, #1F2937)',
          }}>
            {label}
          </span>
          {dirty && (
            <span style={{
              fontSize: 9,
              padding: '1px 6px',
              borderRadius: 8,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 600,
            }}>
              unsaved
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--text-muted, #9CA3AF)',
            background: 'var(--bg-input, #F9FAFB)',
            padding: '1px 6px',
            borderRadius: 4,
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            {typeId}
          </span>
          <span style={{
            fontSize: 12,
            cursor: 'pointer',
            color: 'var(--text-muted, #9CA3AF)',
          }} title="Type ID (read-only)">
            &#9998;
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="node-editor-tabs" style={{
        display: 'flex',
        borderBottom: '1px solid var(--border, #E5E7EB)',
        padding: '0 12px',
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`node-editor-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: tab === t.id ? '#7c3aed' : 'var(--text-muted, #9CA3AF)',
              borderBottom: tab === t.id ? '2px solid #7c3aed' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {tab === 'ui' && (
          <>
            {/* Style Templates + Edit JSON toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  border: '1px solid var(--border, #E5E7EB)',
                  borderRadius: 4,
                  fontSize: 12,
                  background: 'var(--bg-input, #F9FAFB)',
                }}
              >
                {STYLE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <button
                onClick={() => setJsonMode((v) => !v)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid var(--border, #E5E7EB)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: jsonMode ? '#7c3aed' : 'var(--bg-input, #F9FAFB)',
                  color: jsonMode ? '#FFFFFF' : 'var(--text-secondary, #6B7280)',
                  whiteSpace: 'nowrap',
                }}
              >
                {jsonMode ? 'Form View' : 'Edit JSON'}
              </button>
            </div>

            {jsonMode ? (
              /* JSON editor */
              <div>
                <textarea
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    minHeight: 300,
                    padding: 10,
                    border: `1px solid ${jsonError ? '#EF4444' : 'var(--border, #E5E7EB)'}`,
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                    background: 'var(--bg-input, #F9FAFB)',
                  }}
                />
                {jsonError && (
                  <div style={{
                    fontSize: 11,
                    color: '#EF4444',
                    marginTop: 4,
                    fontFamily: 'monospace',
                  }}>
                    JSON Error: {jsonError}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Content section */}
                {contentEntries.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-heading, #1F2937)',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>&#128196;</span>
                      Content
                    </div>
                    {contentEntries.map(([key, value]) => (
                      <ContentValueEditor
                        key={key}
                        propKey={key}
                        value={value}
                        onChange={updateContent}
                      />
                    ))}
                  </div>
                )}

                {/* CSS section */}
                {cssEntries.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-heading, #1F2937)',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>&#127912;</span>
                      CSS
                    </div>
                    {cssEntries.map(([sectionKey, styles]) => (
                      <CssSection
                        key={sectionKey}
                        sectionKey={sectionKey}
                        styles={styles}
                        onStyleChange={updateCssProperty}
                      />
                    ))}
                  </div>
                )}

                {contentEntries.length === 0 && cssEntries.length === 0 && (
                  <div style={{
                    fontSize: 13,
                    color: 'var(--text-muted, #9CA3AF)',
                    padding: '24px 0',
                    textAlign: 'center',
                  }}>
                    No editable UI properties on this node.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'logic' && (
          <div style={{
            fontSize: 13,
            color: 'var(--text-muted, #9CA3AF)',
            padding: '32px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#9881;</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary, #6B7280)', marginBottom: 4 }}>
              Logic Editor
            </div>
            <div style={{ fontSize: 12 }}>
              Conditional visibility, data bindings, and event handlers coming soon.
            </div>
          </div>
        )}

        {tab === 'nudges' && (
          <div style={{
            fontSize: 13,
            color: 'var(--text-muted, #9CA3AF)',
            padding: '32px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#128276;</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary, #6B7280)', marginBottom: 4 }}>
              Nudge Configuration
            </div>
            <div style={{ fontSize: 12 }}>
              Push notifications, in-app messages, and nudge triggers coming soon.
            </div>
          </div>
        )}

        {tab === 'rewards' && (
          <div style={{
            fontSize: 13,
            color: 'var(--text-muted, #9CA3AF)',
            padding: '32px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#127873;</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary, #6B7280)', marginBottom: 4 }}>
              Reward Mapping
            </div>
            <div style={{ fontSize: 12 }}>
              Map reward slots to layout elements. Coming soon.
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border, #E5E7EB)',
      }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty || (jsonMode && !!jsonError)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: saving || !dirty ? 'not-allowed' : 'pointer',
            backgroundColor: saving || !dirty ? '#D1D5DB' : '#7c3aed',
            color: '#FFFFFF',
            opacity: saving ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {saving ? 'Saving...' : dirty ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  );
}

export default NodeEditor;
