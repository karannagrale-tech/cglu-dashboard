import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ADDABLE_ELEMENTS,
  ELEMENT_TYPES,
  CATEGORY_LABELS,
  getAddableByCategory,
} from '../engine/elementSchema';
import { ACTION_TYPES } from '../engine/layoutState';

/* ── Constants ───────────────────────────────────────────────── */

const STEPS = { PICK: 'pick', CONFIGURE: 'configure' };

const POSITION_OPTIONS = [
  { value: 'end', label: 'At end' },
  { value: 'start', label: 'At start' },
  { value: 'after', label: 'After selected node' },
];

/* ── Styles ──────────────────────────────────────────────────── */

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 400,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  panel: {
    background: 'white',
    borderRadius: 16,
    width: 520,
    maxWidth: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
    animation: 'addElementSlideIn 0.2s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    color: '#64748B',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '14px 20px',
    borderTop: '1px solid #E2E8F0',
    background: '#F8FAFC',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: 'white',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#7C3AED',
    fontSize: 13,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    cursor: 'default',
  },
};

/* ── Keyframe injection (once) ───────────────────────────────── */

let _injected = false;
function injectKeyframes() {
  if (_injected) return;
  _injected = true;
  const sheet = document.createElement('style');
  sheet.textContent = `
    @keyframes addElementSlideIn {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Helper: find container nodes ────────────────────────────── */

function findContainerNodes(byId) {
  if (!byId) return [];
  const containers = [];
  for (const [id, node] of Object.entries(byId)) {
    const children = node?.ui?.content?.children;
    if (Array.isArray(children)) {
      containers.push({
        id,
        type_id: node.type_id || id,
        childCount: children.length,
      });
    }
  }
  return containers;
}

function findParentOf(nodeId, byId) {
  if (!byId || !nodeId) return null;
  for (const [id, node] of Object.entries(byId)) {
    const children = node?.ui?.content?.children;
    if (Array.isArray(children) && children.includes(nodeId)) {
      return id;
    }
  }
  return null;
}

/* ── Element Card ────────────────────────────────────────────── */

function ElementCard({ item, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isActive = selected || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 8px',
        borderRadius: 12,
        border: selected
          ? '2px solid #7C3AED'
          : '1px solid #E2E8F0',
        background: selected
          ? '#F5F3FF'
          : hovered
          ? '#FAF5FF'
          : 'white',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isActive
          ? '0 2px 8px rgba(124,58,237,0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        minHeight: 100,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>
        {item.icon}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: selected ? '#7C3AED' : '#1E293B',
          marginBottom: 2,
          textAlign: 'center',
        }}
      >
        {item.label}
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#94A3B8',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {item.description}
      </div>
    </div>
  );
}

/* ── Element Picker Grid ─────────────────────────────────────── */

function ElementPickerGrid({ selectedType, onSelect }) {
  const grouped = useMemo(() => getAddableByCategory(), []);

  return (
    <div>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 10,
            }}
          >
            {CATEGORY_LABELS[category] || category}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}
          >
            {items.map((item) => (
              <ElementCard
                key={item.type}
                item={item}
                selected={selectedType === item.type}
                onClick={() => onSelect(item.type)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Configuration forms per type ────────────────────────────── */

function TextConfig({ overrides, onChange }) {
  return (
    <div>
      <FieldLabel label="Initial Text" />
      <input
        type="text"
        value={overrides['ui.content.text'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.text': e.target.value })}
        placeholder="Enter text content..."
        style={fieldInputStyle}
        autoFocus
      />
      <FieldLabel label="Text Alignment" />
      <SegmentedControl
        options={['left', 'center', 'right']}
        value={overrides['ui.css.text.textAlign'] || 'center'}
        onChange={(v) => onChange({ ...overrides, 'ui.css.text.textAlign': v })}
      />
      <FieldLabel label="Text Color" />
      <ColorInput
        value={overrides['ui.css.text.color'] || '#FFFFFF'}
        onChange={(v) => onChange({ ...overrides, 'ui.css.text.color': v })}
      />
    </div>
  );
}

function ImageConfig({ overrides, onChange }) {
  const [tab, setTab] = useState('upload');
  const [preview, setPreview] = useState(overrides['ui.content.src'] || '');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      onChange({ ...overrides, 'ui.content.src': dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }

  function handleUrlChange(url) {
    setPreview(url);
    onChange({ ...overrides, 'ui.content.src': url });
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
        {['upload', 'url'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#7C3AED' : '#94A3B8',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t === 'upload' ? 'Upload' : 'URL'}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#7C3AED' : '#E2E8F0'}`,
            borderRadius: 12,
            padding: preview ? 12 : 32,
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? '#FAF5FF' : '#F8FAFC',
            transition: 'all 0.15s ease',
          }}
        >
          {preview ? (
            <div>
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 160,
                  borderRadius: 8,
                  objectFit: 'contain',
                }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                Click or drag to replace
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>
                &#128247;
              </div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                Drag and drop an image here
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                or click to browse (PNG, JPG, GIF)
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {tab === 'url' && (
        <div>
          <input
            type="text"
            value={overrides['ui.content.src'] || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.png"
            style={fieldInputStyle}
            autoFocus
          />
          {preview && preview.startsWith('http') && (
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 140,
                  borderRadius: 8,
                  objectFit: 'contain',
                  border: '1px solid #E2E8F0',
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      )}

      <FieldLabel label="Alt Text" style={{ marginTop: 14 }} />
      <input
        type="text"
        value={overrides['ui.content.alt'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.alt': e.target.value })}
        placeholder="Describe the image..."
        style={fieldInputStyle}
      />
    </div>
  );
}

function ButtonConfig({ overrides, onChange }) {
  return (
    <div>
      <FieldLabel label="Button Text" />
      <input
        type="text"
        value={overrides['ui.content.text'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.text': e.target.value })}
        placeholder="Click Here"
        style={fieldInputStyle}
        autoFocus
      />
      <FieldLabel label="Link URL" />
      <input
        type="text"
        value={overrides['ui.content.link'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.link': e.target.value })}
        placeholder="https://..."
        style={fieldInputStyle}
      />
      <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Background Color" />
          <ColorInput
            value={overrides['ui.css.button.backgroundColor'] || '#EC4899'}
            onChange={(v) => onChange({ ...overrides, 'ui.css.button.backgroundColor': v })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Text Color" />
          <ColorInput
            value={overrides['ui.css.button.color'] || '#FFFFFF'}
            onChange={(v) => onChange({ ...overrides, 'ui.css.button.color': v })}
          />
        </div>
      </div>
      {/* Live preview */}
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '10px 28px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            background: overrides['ui.css.button.backgroundColor'] || '#EC4899',
            color: overrides['ui.css.button.color'] || '#FFFFFF',
            border: 'none',
          }}
        >
          {overrides['ui.content.text'] || 'Click Here'}
        </div>
      </div>
    </div>
  );
}

function DividerConfig({ overrides, onChange }) {
  const height = parseInt(overrides['ui.css.container.height'] || '1', 10);
  const color = overrides['ui.css.container.backgroundColor'] || 'rgba(255,255,255,0.2)';
  const variant = overrides['ui.content.variant'] || 'line';

  return (
    <div>
      <FieldLabel label="Variant" />
      <SegmentedControl
        options={['line', 'spacer', 'dashed', 'dotted']}
        value={variant}
        onChange={(v) => onChange({ ...overrides, 'ui.content.variant': v })}
      />
      <FieldLabel label={`Height: ${height}px`} />
      <input
        type="range"
        min={1}
        max={20}
        value={height}
        onChange={(e) =>
          onChange({ ...overrides, 'ui.css.container.height': `${e.target.value}px` })
        }
        style={{ width: '100%', accentColor: '#7C3AED' }}
      />
      <FieldLabel label="Color" />
      <ColorInput
        value={color}
        onChange={(v) => onChange({ ...overrides, 'ui.css.container.backgroundColor': v })}
      />
      {/* Preview */}
      <div style={{ marginTop: 14, padding: '12px 0', textAlign: 'center' }}>
        <div
          style={{
            height: variant === 'spacer' ? height : Math.max(height, 1),
            background: variant === 'spacer' ? 'transparent' : color,
            borderTop:
              variant === 'dashed'
                ? `${height}px dashed ${color}`
                : variant === 'dotted'
                ? `${height}px dotted ${color}`
                : 'none',
            width: '80%',
            margin: '0 auto',
          }}
        />
      </div>
    </div>
  );
}

function CouponCodeConfig({ overrides, onChange }) {
  return (
    <div>
      <FieldLabel label="Label" />
      <input
        type="text"
        value={overrides['ui.content.label'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.label': e.target.value })}
        placeholder="Your Code"
        style={fieldInputStyle}
        autoFocus
      />
      <FieldLabel label="Placeholder Text" />
      <input
        type="text"
        value={overrides['ui.content.placeholder'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.placeholder': e.target.value })}
        placeholder="COUPON CODE"
        style={fieldInputStyle}
      />
      {/* Preview */}
      <div
        style={{
          marginTop: 14,
          padding: '14px 16px',
          background: '#F1F5F9',
          borderRadius: 8,
          border: '1px dashed #CBD5E1',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
          {overrides['ui.content.label'] || 'Your Code'}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#1E293B',
            fontFamily: 'ui-monospace, Consolas, monospace',
          }}
        >
          {overrides['ui.content.placeholder'] || 'COUPON CODE'}
        </div>
      </div>
    </div>
  );
}

function TermsConfig({ overrides, onChange }) {
  const raw = overrides['ui.content.items'];
  const text = Array.isArray(raw) ? raw.join('\n') : (raw || '');

  function handleChange(val) {
    const items = val
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ ...overrides, 'ui.content.items': items });
  }

  return (
    <div>
      <FieldLabel label="Terms & Conditions (one per line)" />
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={"Valid for 7 days\nCannot be combined with other offers\nMinimum purchase of $50 required"}
        rows={6}
        style={{
          ...fieldInputStyle,
          resize: 'vertical',
          lineHeight: 1.6,
          minHeight: 120,
        }}
        autoFocus
      />
      {/* Preview */}
      {Array.isArray(overrides['ui.content.items']) && overrides['ui.content.items'].length > 0 && (
        <div style={{ marginTop: 12, padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>Preview</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
            {overrides['ui.content.items'].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CountdownConfig({ overrides, onChange }) {
  const duration = overrides['ui.content.duration'] || 3600;
  return (
    <div>
      <FieldLabel label="Duration (seconds)" />
      <input
        type="number"
        value={duration}
        min={60}
        max={86400}
        onChange={(e) =>
          onChange({ ...overrides, 'ui.content.duration': Number(e.target.value) })
        }
        style={fieldInputStyle}
      />
      <FieldLabel label="Format" />
      <select
        value={overrides['ui.content.format'] || 'hh:mm:ss'}
        onChange={(e) => onChange({ ...overrides, 'ui.content.format': e.target.value })}
        style={fieldInputStyle}
      >
        <option value="hh:mm:ss">HH:MM:SS</option>
        <option value="mm:ss">MM:SS</option>
        <option value="ss">Seconds only</option>
        <option value="descriptive">Descriptive</option>
      </select>
    </div>
  );
}

function ExpiryConfig({ overrides, onChange }) {
  return (
    <div>
      <FieldLabel label="Prefix Text" />
      <input
        type="text"
        value={overrides['ui.content.prefix'] || ''}
        onChange={(e) => onChange({ ...overrides, 'ui.content.prefix': e.target.value })}
        placeholder="Expires on"
        style={fieldInputStyle}
      />
      <FieldLabel label="Date Format" />
      <select
        value={overrides['ui.content.format'] || 'MMM DD, YYYY'}
        onChange={(e) => onChange({ ...overrides, 'ui.content.format': e.target.value })}
        style={fieldInputStyle}
      >
        <option value="MMM DD, YYYY">MMM DD, YYYY</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
      </select>
    </div>
  );
}

function ContainerConfig({ overrides, onChange }) {
  return (
    <div>
      <FieldLabel label="Direction" />
      <SegmentedControl
        options={['column', 'row']}
        value={overrides['ui.css.container.flexDirection'] || 'column'}
        onChange={(v) => onChange({ ...overrides, 'ui.css.container.flexDirection': v })}
      />
      <FieldLabel label="Alignment" />
      <SegmentedControl
        options={['flex-start', 'center', 'flex-end', 'stretch']}
        labels={['Start', 'Center', 'End', 'Stretch']}
        value={overrides['ui.css.container.alignItems'] || 'center'}
        onChange={(v) => onChange({ ...overrides, 'ui.css.container.alignItems': v })}
      />
      <FieldLabel label="Background Color" />
      <ColorInput
        value={overrides['ui.css.container.backgroundColor'] || 'transparent'}
        onChange={(v) => onChange({ ...overrides, 'ui.css.container.backgroundColor': v })}
      />
    </div>
  );
}

/* Map element types to their config components */
const CONFIG_COMPONENTS = {
  TEXT: TextConfig,
  IMAGE: ImageConfig,
  BUTTON: ButtonConfig,
  DIVIDER: DividerConfig,
  COUPON_CODE: CouponCodeConfig,
  TERMS: TermsConfig,
  COUNTDOWN: CountdownConfig,
  EXPIRY: ExpiryConfig,
  CONTAINER: ContainerConfig,
};

/* ── Shared small components ─────────────────────────────────── */

const fieldInputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 13,
  color: '#1E293B',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

function FieldLabel({ label, style: extraStyle }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#64748B',
        marginBottom: 6,
        marginTop: 14,
        ...extraStyle,
      }}
    >
      {label}
    </div>
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="color"
        value={value.startsWith('#') ? value : '#FFFFFF'}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 36,
          height: 36,
          padding: 2,
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          cursor: 'pointer',
          background: 'white',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldInputStyle, flex: 1 }}
      />
    </div>
  );
}

function SegmentedControl({ options, labels, value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: '#F1F5F9',
        borderRadius: 8,
        padding: 3,
      }}
    >
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            padding: '5px 8px',
            borderRadius: 6,
            border: 'none',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            background: value === opt ? 'white' : 'transparent',
            color: value === opt ? '#7C3AED' : '#94A3B8',
            boxShadow: value === opt ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            textTransform: 'capitalize',
          }}
        >
          {labels ? labels[i] : opt}
        </button>
      ))}
    </div>
  );
}

/* ── Position Selector ───────────────────────────────────────── */

function PositionSelector({ parentId, positionMode, containers, selectedNodeId, onParentChange, onPositionChange }) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        background: '#F8FAFC',
        borderRadius: 10,
        border: '1px solid #E2E8F0',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
        Placement
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: 500 }}>
            Add to
          </div>
          <select
            value={parentId}
            onChange={(e) => onParentChange(e.target.value)}
            style={{
              ...fieldInputStyle,
              padding: '6px 10px',
              fontSize: 12,
            }}
          >
            {containers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} ({c.type_id}) [{c.childCount} children]
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: 500 }}>
            Position
          </div>
          <select
            value={positionMode}
            onChange={(e) => onPositionChange(e.target.value)}
            style={{
              ...fieldInputStyle,
              padding: '6px 10px',
              fontSize: 12,
            }}
          >
            {POSITION_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.value === 'after' && !selectedNodeId}
              >
                {opt.label}
                {opt.value === 'after' && !selectedNodeId ? ' (select a node)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component: AddElementPanel
   ══════════════════════════════════════════════════════════════ */

function AddElementPanel({ byId, selectedNodeId, dispatch, onClose }) {
  useEffect(() => { injectKeyframes(); }, []);

  const [step, setStep] = useState(STEPS.PICK);
  const [selectedType, setSelectedType] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [parentId, setParentId] = useState('ROOT');
  const [positionMode, setPositionMode] = useState('end');

  const containers = useMemo(() => findContainerNodes(byId), [byId]);

  // Auto-select parent based on selected node
  useEffect(() => {
    if (selectedNodeId && byId) {
      const parent = findParentOf(selectedNodeId, byId);
      if (parent) {
        setParentId(parent);
        setPositionMode('after');
      }
    }
  }, [selectedNodeId, byId]);

  // Ensure parentId is valid
  useEffect(() => {
    if (containers.length > 0 && !containers.find((c) => c.id === parentId)) {
      setParentId(containers[0].id);
    }
  }, [containers, parentId]);

  const handleSelectType = useCallback((type) => {
    setSelectedType(type);
    // Pre-fill overrides from schema defaults
    const schema = ELEMENT_TYPES[type];
    const defaults = {};
    if (schema) {
      for (const [path, def] of Object.entries(schema.properties)) {
        if (def.default !== undefined && def.default !== '') {
          const val = def.default;
          defaults[path] = typeof val === 'object' && val !== null
            ? JSON.parse(JSON.stringify(val))
            : val;
        }
      }
      for (const [path, def] of Object.entries(schema.style)) {
        if (def.default !== undefined) {
          defaults[path] = def.default;
        }
      }
    }
    setOverrides(defaults);
    setStep(STEPS.CONFIGURE);
  }, []);

  const handleBack = useCallback(() => {
    setStep(STEPS.PICK);
    setSelectedType(null);
    setOverrides({});
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedType) return;

    // Compute position index
    let position;
    if (positionMode === 'start') {
      position = 0;
    } else if (positionMode === 'after' && selectedNodeId) {
      const parentNode = byId[parentId];
      const children = parentNode?.ui?.content?.children || [];
      const idx = children.indexOf(selectedNodeId);
      position = idx >= 0 ? idx + 1 : children.length;
    } else {
      // 'end'
      const parentNode = byId[parentId];
      const children = parentNode?.ui?.content?.children || [];
      position = children.length;
    }

    dispatch({
      type: ACTION_TYPES.ADD_ELEMENT,
      parentId,
      position,
      elementType: selectedType,
      overrides,
    });

    onClose();
  }, [selectedType, parentId, positionMode, selectedNodeId, byId, overrides, dispatch, onClose]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ConfigComponent = selectedType ? CONFIG_COMPONENTS[selectedType] : null;
  const selectedSchema = selectedType ? ELEMENT_TYPES[selectedType] : null;

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            {step === STEPS.CONFIGURE && (
              <button
                onClick={handleBack}
                style={{
                  ...styles.closeBtn,
                  fontSize: 14,
                  marginRight: 4,
                }}
                title="Back to element picker"
              >
                &#8592;
              </button>
            )}
            <span style={{ color: '#7C3AED', fontSize: 18 }}>&#10022;</span>
            {step === STEPS.PICK
              ? 'Add Element'
              : `Configure ${selectedSchema?.label || selectedType}`}
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Close">
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {step === STEPS.PICK && (
            <ElementPickerGrid
              selectedType={selectedType}
              onSelect={handleSelectType}
            />
          )}

          {step === STEPS.CONFIGURE && ConfigComponent && (
            <>
              {/* Type badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: '#F5F3FF',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#7C3AED',
                  marginBottom: 16,
                }}
              >
                <span>{selectedSchema?.icon}</span>
                <span>{selectedSchema?.label}</span>
              </div>

              <ConfigComponent overrides={overrides} onChange={setOverrides} />

              <PositionSelector
                parentId={parentId}
                positionMode={positionMode}
                containers={containers}
                selectedNodeId={selectedNodeId}
                onParentChange={setParentId}
                onPositionChange={setPositionMode}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          {step === STEPS.CONFIGURE && (
            <button
              onClick={handleConfirm}
              disabled={!selectedType}
              style={{
                ...styles.confirmBtn,
                ...(selectedType ? {} : styles.confirmBtnDisabled),
              }}
            >
              <span style={{ fontSize: 14 }}>+</span> Add Element
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddElementPanel;
