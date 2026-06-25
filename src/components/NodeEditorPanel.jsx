import { useState, useEffect, useRef, useCallback } from 'react';
import { ACTION_TYPES } from '../engine/layoutState';
import { getEditableProperties } from '../engine/elementSchema';

/* ── NodeEditorPanel ─────────────────────────────────────── */

const TABS = [
  { id: 'ui', label: 'UI' },
  { id: 'logic', label: 'Logic' },
  { id: 'nudges', label: 'Nudges' },
  { id: 'rewards', label: 'Rewards' },
];

/**
 * Get a value at a dot-separated path inside an object.
 */
function getNestedValue(obj, path) {
  const keys = typeof path === 'string' ? path.split('.') : path;
  let target = obj;
  for (const key of keys) {
    if (target === undefined || target === null) return undefined;
    target = target[key];
  }
  return target;
}

/**
 * Determine whether a dot-path targets content or css, and dispatch accordingly.
 * Path format: 'ui.content.text', 'ui.css.button.color', etc.
 */
function dispatchByPath(dispatch, nodeId, dotPath, value) {
  const parts = dotPath.split('.');
  // ui.content.<key>
  if (parts[0] === 'ui' && parts[1] === 'content' && parts.length === 3) {
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId, key: parts[2], value });
  }
  // ui.css.<section>.<property>
  else if (parts[0] === 'ui' && parts[1] === 'css' && parts.length === 4) {
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CSS, nodeId, cssSection: parts[2], property: parts[3], value });
  }
  // Fallback: UPDATE_NODE_CONTENT with the last key
  else if (parts[0] === 'ui' && parts[1] === 'content') {
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId, key: parts.slice(2).join('.'), value });
  }
  else {
    // Deep path — fall back to full update
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId, key: parts[parts.length - 1], value });
  }
}

/* ── Styles ──────────────────────────────────────────────── */

const S = {
  fieldRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: 13,
  },
  label: {
    width: 110, flexShrink: 0, fontSize: 12, color: 'var(--text-muted)',
    paddingTop: 6, lineHeight: 1.3,
  },
  inputBase: {
    flex: 1, border: '1px solid var(--border)', borderRadius: 4,
    padding: '5px 8px', fontSize: 12, background: 'white', outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  requiredBadge: {
    fontSize: 10, color: '#EF4444', marginTop: 2,
  },
  thumbnail: {
    width: 48, height: 48, objectFit: 'cover', borderRadius: 4,
    border: '1px solid var(--border)', background: '#f1f5f9',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
    userSelect: 'none',
  },
  sectionArrow: (open) => ({
    fontSize: 9, transition: 'transform 0.15s',
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
  }),
  sectionBody: {
    paddingLeft: 12, borderLeft: '1px solid var(--border-light)', marginBottom: 8,
  },
  colorSwatch: {
    width: 28, height: 28, padding: 0, border: '1px solid var(--border)',
    borderRadius: 4, cursor: 'pointer', flexShrink: 0,
  },
  toggle: (on) => ({
    width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
    background: on ? 'var(--primary)' : '#cbd5e1', transition: 'background 0.15s',
    flexShrink: 0,
  }),
  toggleDot: (on) => ({
    position: 'absolute', top: 2, left: on ? 18 : 2,
    width: 16, height: 16, borderRadius: '50%', background: 'white',
    transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
  }),
  unitLabel: {
    fontSize: 11, color: 'var(--text-muted)', padding: '5px 4px', flexShrink: 0,
  },
  removeBtn: {
    background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer',
    fontSize: 14, padding: '0 4px', lineHeight: 1,
  },
  addBtn: {
    background: 'none', border: '1px dashed var(--border)', borderRadius: 4,
    padding: '4px 10px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
    width: '100%', textAlign: 'center', marginTop: 4,
  },
};

/* ── Field Controls ──────────────────────────────────────── */

function StringControl({ value, onChange, hasError }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...S.inputBase, ...(hasError ? S.inputError : {}) }}
    />
  );
}

function ColorControl({ value, onChange }) {
  // Normalize the value for the color picker (needs #rrggbb)
  const safeHex = (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value))
    ? value : '#000000';
  return (
    <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
      <input
        type="color"
        value={safeHex}
        onChange={(e) => onChange(e.target.value)}
        style={S.colorSwatch}
      />
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...S.inputBase }}
      />
    </div>
  );
}

function ImageControl({ value, onChange }) {
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="text"
          value={value ?? ''}
          placeholder="Image URL or data URL"
          onChange={(e) => onChange(e.target.value)}
          style={{ ...S.inputBase }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '4px 10px', fontSize: 11, borderRadius: 4,
            border: '1px solid var(--border)', background: '#f8fafc',
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,image/gif"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          style={S.thumbnail}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function SizeControl({ value, onChange, def }) {
  // Parse numeric part and unit from value like '16px'
  const parsed = typeof value === 'string' ? value.match(/^(-?\d*\.?\d+)(.*)$/) : null;
  const numVal = parsed ? parseFloat(parsed[1]) : (typeof value === 'number' ? value : 0);
  const unit = def.unit || (parsed ? parsed[2] : 'px') || 'px';

  function handleNum(e) {
    const n = parseFloat(e.target.value);
    if (isNaN(n)) return;
    const clamped = Math.min(Math.max(n, def.min ?? -Infinity), def.max ?? Infinity);
    onChange(`${clamped}${unit}`);
  }

  return (
    <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
      <input
        type="number"
        value={numVal}
        min={def.min}
        max={def.max}
        onChange={handleNum}
        style={{ ...S.inputBase, width: 70, flex: 'none' }}
      />
      <span style={S.unitLabel}>{unit}</span>
    </div>
  );
}

function NumberControl({ value, onChange, def, hasError }) {
  return (
    <input
      type="number"
      value={value ?? def.default ?? ''}
      min={def.min}
      max={def.max}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        onChange(isNaN(n) ? '' : n);
      }}
      style={{ ...S.inputBase, width: 100, flex: 'none', ...(hasError ? S.inputError : {}) }}
    />
  );
}

function SelectControl({ value, onChange, def }) {
  const options = def.options || [];
  return (
    <select
      value={value ?? def.default ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...S.inputBase, cursor: 'pointer' }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function BooleanControl({ value, onChange }) {
  const on = !!value;
  return (
    <div onClick={() => onChange(!on)} style={S.toggle(on)}>
      <div style={S.toggleDot(on)} />
    </div>
  );
}

function ArrayControl({ value, onChange, def, nodeData, dotPath, dispatch, nodeId }) {
  const arr = Array.isArray(value) ? value : [];
  const itemSchema = def.itemSchema;

  function updateItem(idx, newItem) {
    const next = [...arr];
    next[idx] = newItem;
    onChange(next);
  }

  function removeItem(idx) {
    const next = arr.filter((_, i) => i !== idx);
    onChange(next);
  }

  function addItem() {
    let newItem;
    if (itemSchema) {
      // Build default from itemSchema
      newItem = {};
      for (const [key, fieldDef] of Object.entries(itemSchema)) {
        newItem[key] = fieldDef.default ?? '';
      }
    } else {
      // Simple string array
      newItem = '';
    }
    onChange([...arr, newItem]);
  }

  function moveItem(idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    const next = [...arr];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div style={{ flex: 1 }}>
      {arr.map((item, idx) => (
        <div key={idx} style={{
          padding: '6px 8px', background: '#f8fafc', borderRadius: 6,
          marginBottom: 4, border: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: itemSchema ? 4 : 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                style={{ ...S.removeBtn, color: 'var(--text-muted)', opacity: idx === 0 ? 0.3 : 1 }}
                title="Move up"
              >&uarr;</button>
              <button onClick={() => moveItem(idx, 1)} disabled={idx === arr.length - 1}
                style={{ ...S.removeBtn, color: 'var(--text-muted)', opacity: idx === arr.length - 1 ? 0.3 : 1 }}
                title="Move down"
              >&darr;</button>
              <button onClick={() => removeItem(idx)} style={S.removeBtn} title="Remove">&times;</button>
            </div>
          </div>
          {itemSchema ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(itemSchema).map(([fieldKey, fieldDef]) => {
                const fieldVal = typeof item === 'object' ? (item[fieldKey] ?? '') : '';
                return (
                  <div key={fieldKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ width: 80, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {fieldDef.label || fieldKey}
                    </label>
                    {fieldDef.type === 'color' ? (
                      <ColorControl
                        value={fieldVal}
                        onChange={(v) => updateItem(idx, { ...item, [fieldKey]: v })}
                      />
                    ) : fieldDef.type === 'number' ? (
                      <input
                        type="number"
                        value={fieldVal}
                        min={fieldDef.min}
                        max={fieldDef.max}
                        onChange={(e) => updateItem(idx, { ...item, [fieldKey]: parseFloat(e.target.value) || 0 })}
                        style={{ ...S.inputBase, width: 70 }}
                      />
                    ) : fieldDef.type === 'array' ? (
                      // Nested array (e.g. quiz options) — simple string list
                      <div style={{ flex: 1 }}>
                        {(Array.isArray(fieldVal) ? fieldVal : []).map((subItem, si) => (
                          <div key={si} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                            <input
                              type="text"
                              value={subItem}
                              onChange={(e) => {
                                const newArr = [...fieldVal];
                                newArr[si] = e.target.value;
                                updateItem(idx, { ...item, [fieldKey]: newArr });
                              }}
                              style={{ ...S.inputBase }}
                            />
                            <button onClick={() => {
                              updateItem(idx, { ...item, [fieldKey]: fieldVal.filter((_, i) => i !== si) });
                            }} style={S.removeBtn}>&times;</button>
                          </div>
                        ))}
                        <button onClick={() => {
                          updateItem(idx, { ...item, [fieldKey]: [...(fieldVal || []), ''] });
                        }} style={{ ...S.addBtn, marginTop: 2, padding: '2px 6px', fontSize: 11 }}>+ Add</button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={fieldVal}
                        onChange={(e) => updateItem(idx, { ...item, [fieldKey]: e.target.value })}
                        style={{ ...S.inputBase }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              value={typeof item === 'string' ? item : JSON.stringify(item)}
              onChange={(e) => updateItem(idx, e.target.value)}
              style={{ ...S.inputBase, width: '100%' }}
            />
          )}
        </div>
      ))}
      <button onClick={addItem} style={S.addBtn}>+ Add Item</button>
    </div>
  );
}

/* ── Generic fallback for unknown field types ────────────── */

function GenericControl({ value, onChange }) {
  const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  return (
    <input
      type="text"
      value={strVal}
      onChange={(e) => {
        // Try to parse as JSON for objects, otherwise pass as string
        try {
          const parsed = JSON.parse(e.target.value);
          onChange(parsed);
        } catch {
          onChange(e.target.value);
        }
      }}
      style={S.inputBase}
    />
  );
}

/* ── Render a single property field ──────────────────────── */

function PropertyField({ dotPath, def, nodeData, dispatch, nodeId }) {
  const currentValue = getNestedValue(nodeData, dotPath);
  const isEmpty = currentValue === undefined || currentValue === null || currentValue === '' ||
    (Array.isArray(currentValue) && currentValue.length === 0);
  const hasError = def.required && isEmpty;

  const handleChange = useCallback((newValue) => {
    dispatchByPath(dispatch, nodeId, dotPath, newValue);
  }, [dispatch, nodeId, dotPath]);

  let control;
  switch (def.type) {
    case 'string':
    case 'textarea':
    case 'richtext':
      control = <StringControl value={currentValue} onChange={handleChange} hasError={hasError} />;
      break;
    case 'color':
      control = <ColorControl value={currentValue} onChange={handleChange} />;
      break;
    case 'image':
      control = <ImageControl value={currentValue} onChange={handleChange} />;
      break;
    case 'size':
      control = <SizeControl value={currentValue} onChange={handleChange} def={def} />;
      break;
    case 'number':
      control = <NumberControl value={currentValue} onChange={handleChange} def={def} hasError={hasError} />;
      break;
    case 'select':
      control = <SelectControl value={currentValue} onChange={handleChange} def={def} />;
      break;
    case 'boolean':
      control = <BooleanControl value={currentValue} onChange={handleChange} />;
      break;
    case 'array':
      control = (
        <ArrayControl
          value={currentValue}
          onChange={handleChange}
          def={def}
          nodeData={nodeData}
          dotPath={dotPath}
          dispatch={dispatch}
          nodeId={nodeId}
        />
      );
      break;
    default:
      control = <GenericControl value={currentValue} onChange={handleChange} />;
      break;
  }

  return (
    <div style={S.fieldRow}>
      <label style={S.label}>
        {def.label || dotPath.split('.').pop()}
        {def.required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {control}
        {hasError && <span style={S.requiredBadge}>Required</span>}
      </div>
    </div>
  );
}

/* ── Generic key-value fallback editor ───────────────────── */

function GenericKeyValueEditor({ obj, basePath, dispatch, nodeId }) {
  if (!obj || typeof obj !== 'object') return null;

  return Object.entries(obj).map(([key, value]) => {
    const fullPath = `${basePath}.${key}`;

    // Skip children arrays (node IDs)
    if (key === 'children' && Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      return (
        <div key={fullPath} style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', paddingLeft: 4 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>{key}:</strong> [{value.join(', ')}]
        </div>
      );
    }

    // Nested object — recurse
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={fullPath} style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 0' }}>
            {key}
          </div>
          <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--border-light)' }}>
            <GenericKeyValueEditor obj={value} basePath={fullPath} dispatch={dispatch} nodeId={nodeId} />
          </div>
        </div>
      );
    }

    // Guess the type from the value
    const isColor = typeof value === 'string' && (/^#([0-9a-fA-F]{3,8})$/.test(value) || /^(rgb|hsl)/i.test(value));
    const guessedDef = {
      label: key,
      type: isColor ? 'color' : typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : Array.isArray(value) ? 'array' : 'string',
      default: value,
    };

    return (
      <PropertyField
        key={fullPath}
        dotPath={fullPath}
        def={guessedDef}
        nodeData={{ [basePath.split('.')[0]]: getNestedValue({ [basePath.split('.')[0]]: undefined }, basePath.split('.')[0]) || undefined, ...(() => {
          // Build a mini object so getNestedValue works
          const root = {};
          const parts = fullPath.split('.');
          let cursor = root;
          for (let i = 0; i < parts.length - 1; i++) {
            cursor[parts[i]] = {};
            cursor = cursor[parts[i]];
          }
          cursor[parts[parts.length - 1]] = value;
          return root;
        })() }}
        dispatch={dispatch}
        nodeId={nodeId}
      />
    );
  });
}

/* ── Fallback editor that works directly on raw node data ── */

function RawFieldEditor({ obj, basePath, dispatch, nodeId, expandedSections, onToggle }) {
  if (!obj || typeof obj !== 'object') return null;

  return Object.entries(obj).map(([key, value]) => {
    const fullPath = [...basePath, key];
    const pathKey = fullPath.join('.');

    // Children array (node ids) — read-only
    if (key === 'children' && Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      return (
        <div key={pathKey} style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', paddingLeft: 4 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>{key}:</strong> [{value.join(', ')}]
        </div>
      );
    }

    // Generic array
    if (Array.isArray(value)) {
      return (
        <div key={pathKey} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {key} ({value.length})
          </div>
          {value.map((item, idx) => (
            <div key={idx} style={{ padding: '4px 8px', background: 'var(--bg)', borderRadius: 6, marginBottom: 3, fontSize: 12 }}>
              {typeof item === 'string' ? (
                <input type="text" value={item} onChange={(e) => {
                  const a = [...value]; a[idx] = e.target.value;
                  dispatchFieldChange(dispatch, nodeId, fullPath, a);
                }}
                  style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 6px', fontSize: 12, background: 'white' }} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {item.label || item.title || JSON.stringify(item).slice(0, 60)}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Nested object
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={pathKey} style={{ marginBottom: 4 }}>
          <div onClick={() => onToggle(pathKey)} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
          }}>
            <span style={S.sectionArrow(expandedSections[pathKey] !== false)}>&#9654;</span>
            <span>{key}</span>
          </div>
          {expandedSections[pathKey] !== false && (
            <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--border-light)' }}>
              <RawFieldEditor obj={value} basePath={fullPath} dispatch={dispatch} nodeId={nodeId}
                expandedSections={expandedSections} onToggle={onToggle} />
            </div>
          )}
        </div>
      );
    }

    // Primitive
    const isColor = typeof value === 'string' && (/^#([0-9a-fA-F]{3,8})$/.test(value) || /^(rgb|hsl)/i.test(value));
    return (
      <div key={pathKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
        <label style={{ width: 100, flexShrink: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{key}</label>
        {isColor ? (
          <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
            <input type="color" value={value} onChange={(e) => dispatchFieldChange(dispatch, nodeId, fullPath, e.target.value)}
              style={S.colorSwatch} />
            <input type="text" value={value} onChange={(e) => dispatchFieldChange(dispatch, nodeId, fullPath, e.target.value)}
              style={{ ...S.inputBase }} />
          </div>
        ) : typeof value === 'boolean' ? (
          <div onClick={() => dispatchFieldChange(dispatch, nodeId, fullPath, !value)} style={S.toggle(value)}>
            <div style={S.toggleDot(value)} />
          </div>
        ) : typeof value === 'number' ? (
          <input type="number" value={value} onChange={(e) => dispatchFieldChange(dispatch, nodeId, fullPath, Number(e.target.value))}
            style={{ ...S.inputBase }} />
        ) : (
          <input type="text" value={String(value ?? '')} onChange={(e) => dispatchFieldChange(dispatch, nodeId, fullPath, e.target.value)}
            style={{ ...S.inputBase }} />
        )}
      </div>
    );
  });
}

/** Dispatch helper for the raw fallback editor (path as array) */
function dispatchFieldChange(dispatch, nodeId, path, value) {
  if (path[0] === 'ui' && path[1] === 'content' && path.length === 3) {
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId, key: path[2], value });
  } else if (path[0] === 'ui' && path[1] === 'css' && path.length >= 4) {
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CSS, nodeId, cssSection: path[2], property: path[3], value });
  } else {
    // Full update fallback
    dispatch({ type: ACTION_TYPES.UPDATE_NODE_CONTENT, nodeId, key: path[path.length - 1], value });
  }
}

/* ── Main component ──────────────────────────────────────── */

function NodeEditorPanel({ nodeId, nodeData, dispatch }) {
  const [activeTab, setActiveTab] = useState('ui');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [expandedSections, setExpandedSections] = useState({ content: true, style: true });

  useEffect(() => {
    setActiveTab('ui');
    setShowJsonEditor(false);
    setExpandedSections({ content: true, style: true });
  }, [nodeId]);

  if (!nodeId || !nodeData) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 40, color: 'var(--text-muted)',
        textAlign: 'center', flex: 1,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>&#128065;</div>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No node selected</div>
        <div style={{ fontSize: 12 }}>Click a node in the structure tree to edit it.</div>
      </div>
    );
  }

  const typeId = nodeData.type_id || nodeId;
  const ui = nodeData.ui || {};
  const content = ui.content || {};
  const css = ui.css || {};

  // Get schema-based properties for this node
  const schema = getEditableProperties(nodeData);
  const hasSchema = Object.keys(schema.properties).length > 0 || Object.keys(schema.style).length > 0;

  function toggleSection(key) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleOpenJson() {
    setJsonText(JSON.stringify(nodeData, null, 2));
    setShowJsonEditor(true);
  }

  function handleSaveJson() {
    try {
      const parsed = JSON.parse(jsonText);
      dispatch({ type: ACTION_TYPES.UPDATE_NODE_FULL, nodeId, nodeData: parsed });
      setShowJsonEditor(false);
    } catch { alert('Invalid JSON'); }
  }

  /* ── Render schema-driven sections ─────────────────────── */

  function renderSchemaSection(sectionKey, sectionLabel, fields) {
    const entries = Object.entries(fields);
    if (entries.length === 0) return null;

    const isOpen = expandedSections[sectionKey] !== false;

    return (
      <div style={{ marginBottom: 8 }}>
        <div onClick={() => toggleSection(sectionKey)} style={S.sectionHeader}>
          <span style={S.sectionArrow(isOpen)}>&#9654;</span>
          <span>{sectionLabel}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
            ({entries.length})
          </span>
        </div>
        {isOpen && (
          <div style={S.sectionBody}>
            {entries.map(([dotPath, def]) => (
              <PropertyField
                key={dotPath}
                dotPath={dotPath}
                def={def}
                nodeData={nodeData}
                dispatch={dispatch}
                nodeId={nodeId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Node header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#f1f5f9', padding: '4px 10px', borderRadius: 6,
          fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13,
        }}>
          <span style={{ fontSize: 16 }}>{schema.icon || '?'}</span>
          <span style={{ fontWeight: 600 }}>{schema.label || nodeId}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{typeId}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 500,
              color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {activeTab === 'ui' && (
          <>
            {/* Edit JSON button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleOpenJson}
                style={{ fontSize: 12 }}
              >
                Edit JSON
              </button>
            </div>

            {hasSchema ? (
              <>
                {/* Schema-driven Content section */}
                {renderSchemaSection('content', 'Content', schema.properties)}

                {/* Schema-driven Style section */}
                {renderSchemaSection('style', 'Style', schema.style)}
              </>
            ) : (
              <>
                {/* Fallback: generic key-value editor for unknown types */}
                <CollapsibleSection label="Content" sectionKey="content" expanded={expandedSections} onToggle={toggleSection}>
                  <RawFieldEditor
                    obj={content}
                    basePath={['ui', 'content']}
                    dispatch={dispatch}
                    nodeId={nodeId}
                    expandedSections={expandedSections}
                    onToggle={toggleSection}
                  />
                </CollapsibleSection>
                <CollapsibleSection label="CSS" sectionKey="css" expanded={expandedSections} onToggle={toggleSection}>
                  <RawFieldEditor
                    obj={css}
                    basePath={['ui', 'css']}
                    dispatch={dispatch}
                    nodeId={nodeId}
                    expandedSections={expandedSections}
                    onToggle={toggleSection}
                  />
                </CollapsibleSection>
              </>
            )}
          </>
        )}
        {activeTab === 'logic' && <PlaceholderTab icon="&#9881;" text="Configure conditional rendering and visibility rules." />}
        {activeTab === 'nudges' && <PlaceholderTab icon="&#128276;" text="Configure nudge behaviors: animations, highlights, tooltips." />}
        {activeTab === 'rewards' && <PlaceholderTab icon="&#127873;" text="Reward configurations linked to this node." />}
      </div>

      {/* JSON modal */}
      {showJsonEditor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, width: '60%', maxWidth: 700, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Edit Node JSON - {nodeId}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveJson}>Apply</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowJsonEditor(false)}>Cancel</button>
              </div>
            </div>
            <textarea style={{ flex: 1, padding: 20, border: 'none', resize: 'none', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13, lineHeight: 1.6, background: '#f8fafc', minHeight: 400 }}
              value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small reusable pieces ────────────────────────────────── */

function CollapsibleSection({ label, sectionKey, expanded, onToggle, children }) {
  const isOpen = expanded[sectionKey] !== false;
  return (
    <div style={{ marginBottom: 4 }}>
      <div onClick={() => onToggle(sectionKey)} style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
      }}>
        <span style={{ fontSize: 9, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--transition)' }}>&#9654;</span>
        <span>{label}</span>
      </div>
      {isOpen && (
        <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--border-light)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ icon, text }) {
  return (
    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }} dangerouslySetInnerHTML={{ __html: icon }} />
      {text}
    </div>
  );
}

export default NodeEditorPanel;
