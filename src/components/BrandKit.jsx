import { useState, useCallback } from 'react';

/**
 * BrandKit — Set brand identity once, apply to any game.
 *
 * A marketer sets: primary color, secondary, accent, background, text colors, logo.
 * Then clicks "Apply Brand" to theme the entire game consistently.
 *
 * The brand kit maps intelligently to game elements:
 *   - Page background → brand background
 *   - Title text → brand text primary (or white on dark bg)
 *   - Subtitle text → brand text secondary
 *   - CTA button bg → brand primary
 *   - CTA button text → white (or auto-contrast)
 *   - Game component accent → brand accent
 *   - Coupon code bg → brand secondary (muted)
 */

const DEFAULT_BRAND = {
  name: '',
  primaryColor: '#003B8E',    // e.g., IndiGo blue
  secondaryColor: '#0066CC',  // lighter accent
  accentColor: '#FFD700',     // highlight/gold
  backgroundColor: '#001F4D', // dark bg
  textPrimary: '#FFFFFF',     // main text
  textSecondary: '#B0C4DE',   // muted text
  ctaColor: '#E63946',        // button color
  logoUrl: '',
  fontFamily: '',
};

// Saved brand kits (could be persisted to localStorage)
const PRESET_BRANDS = {
  indigo: {
    name: 'IndiGo Airlines',
    primaryColor: '#003B8E',
    secondaryColor: '#0057B8',
    accentColor: '#FFD700',
    backgroundColor: '#001F4D',
    textPrimary: '#FFFFFF',
    textSecondary: '#87CEEB',
    ctaColor: '#E63946',
    logoUrl: 'https://www.goindigo.in/content/dam/indigov2/6e-website/images/header/IndiGo_logo_2.svg',
    fontFamily: '',
  },
  swiggy: {
    name: 'Swiggy',
    primaryColor: '#FC8019',
    secondaryColor: '#FF9F45',
    accentColor: '#FFFFFF',
    backgroundColor: '#1B1B1B',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    ctaColor: '#FC8019',
    logoUrl: '',
    fontFamily: '',
  },
  flipkart: {
    name: 'Flipkart',
    primaryColor: '#2874F0',
    secondaryColor: '#FFE500',
    accentColor: '#FFE500',
    backgroundColor: '#F1F3F6',
    textPrimary: '#212121',
    textSecondary: '#878787',
    ctaColor: '#FB641B',
    logoUrl: '',
    fontFamily: '',
  },
  nykaa: {
    name: 'Nykaa',
    primaryColor: '#FC2779',
    secondaryColor: '#FF6B9D',
    accentColor: '#FFD1E3',
    backgroundColor: '#FFF5F9',
    textPrimary: '#2D2D2D',
    textSecondary: '#666666',
    ctaColor: '#FC2779',
    logoUrl: '',
    fontFamily: '',
  },
};

const S = {
  section: { padding: '12px 14px' },
  label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
  colorRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  colorInput: {
    width: 36, height: 36, padding: 0, border: '2px solid #e2e8f0',
    borderRadius: 8, cursor: 'pointer', flexShrink: 0,
  },
  textInput: {
    flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: 13, outline: 'none',
  },
  presetCard: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
    marginBottom: 6, transition: 'all 0.15s',
  },
  colorDots: { display: 'flex', gap: 3 },
  dot: (color) => ({
    width: 14, height: 14, borderRadius: '50%', background: color,
    border: '1px solid rgba(0,0,0,0.1)',
  }),
  applyBtn: {
    width: '100%', padding: '10px', borderRadius: 8, border: 'none',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: 'white', marginTop: 12,
    transition: 'opacity 0.15s',
  },
};

function ColorField({ label, value, onChange }) {
  return (
    <div style={S.colorRow}>
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} style={S.colorInput} />
      <div style={{ flex: 1 }}>
        <label style={{ ...S.label, marginBottom: 2 }}>{label}</label>
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          style={{ ...S.textInput, fontSize: 12, padding: '4px 8px', fontFamily: 'monospace' }} />
      </div>
    </div>
  );
}

/**
 * Generate theme patches from a brand kit.
 * Maps brand colors to game elements intelligently.
 */
export function brandToThemePatches(brand) {
  return {
    ROOT: {
      css: {
        container: {
          backgroundColor: brand.backgroundColor,
          backgroundImage: 'none',
        },
      },
    },
    TEXT_1: {
      css: {
        text: { color: brand.textPrimary },
      },
    },
    TEXT_2: {
      css: {
        text: { color: brand.textSecondary },
      },
    },
    CTA: {
      css: {
        button: {
          backgroundColor: brand.ctaColor || brand.primaryColor,
          color: '#FFFFFF',
        },
      },
    },
    REWARD_BODY: {
      css: {
        text: { color: brand.textPrimary },
      },
    },
    CC: {
      css: {
        container: {
          background: brand.secondaryColor + '33', // 20% opacity
          borderColor: brand.secondaryColor,
        },
      },
    },
    TNC: {
      css: {
        text: { color: brand.textSecondary },
      },
    },
    // Spin wheel slices get brand colors
    STW_1: {
      css: {
        container: {},
      },
      // Slices will use brand color palette
      _sliceColors: [
        brand.primaryColor,
        brand.accentColor,
        brand.secondaryColor,
        brand.ctaColor || brand.primaryColor,
        brand.accentColor,
        brand.secondaryColor,
      ],
    },
    // Scratch card cover
    SC: {
      css: {
        container: {},
      },
      content: {
        coverColor: brand.primaryColor,
      },
    },
    // Quiz question card
    QUIZ_1: {
      css: {
        questionCard: {
          background: brand.primaryColor + 'CC', // 80% opacity
          borderRadius: '12px',
        },
        optionButton: {
          background: brand.secondaryColor + '66', // 40% opacity
          color: brand.textPrimary,
          borderRadius: '8px',
        },
      },
    },
  };
}

/**
 * Generate slice colors for spin wheel from brand palette.
 */
export function brandToSliceColors(brand, count = 6) {
  const palette = [
    brand.primaryColor,
    brand.accentColor,
    brand.secondaryColor,
    brand.ctaColor || brand.primaryColor,
    brand.accentColor + 'CC',
    brand.secondaryColor + 'CC',
  ];
  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}

function BrandKit({ brand, onBrandChange, onApplyBrand }) {
  const [showPresets, setShowPresets] = useState(true);

  const updateField = useCallback((field, value) => {
    onBrandChange({ ...brand, [field]: value });
  }, [brand, onBrandChange]);

  const loadPreset = useCallback((presetKey) => {
    onBrandChange({ ...PRESET_BRANDS[presetKey] });
  }, [onBrandChange]);

  // Preview swatch
  const previewColors = [
    brand.primaryColor, brand.secondaryColor, brand.accentColor,
    brand.backgroundColor, brand.ctaColor,
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 8px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          🎨 Brand Kit
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Set your brand colors once, apply to any game
        </div>
      </div>

      {/* Brand name */}
      <div style={S.section}>
        <label style={S.label}>Brand Name</label>
        <input type="text" placeholder="e.g., IndiGo Airlines"
          value={brand.name || ''} onChange={(e) => updateField('name', e.target.value)}
          style={S.textInput} />
      </div>

      {/* Quick presets */}
      <div style={{ padding: '0 14px 8px' }}>
        <div
          onClick={() => setShowPresets(v => !v)}
          style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span style={{ fontSize: 10, transform: showPresets ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>▶</span>
          Example Brands
        </div>
        {showPresets && Object.entries(PRESET_BRANDS).map(([key, preset]) => (
          <div key={key} style={S.presetCard}
            onClick={() => loadPreset(key)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#6366f1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <div style={S.colorDots}>
              <span style={S.dot(preset.primaryColor)} />
              <span style={S.dot(preset.secondaryColor)} />
              <span style={S.dot(preset.accentColor)} />
              <span style={S.dot(preset.ctaColor)} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{preset.name}</span>
          </div>
        ))}
      </div>

      {/* Color fields */}
      <div style={{ ...S.section, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Colors</div>
        <ColorField label="Primary" value={brand.primaryColor} onChange={(v) => updateField('primaryColor', v)} />
        <ColorField label="Secondary" value={brand.secondaryColor} onChange={(v) => updateField('secondaryColor', v)} />
        <ColorField label="Accent / Highlight" value={brand.accentColor} onChange={(v) => updateField('accentColor', v)} />
        <ColorField label="Background" value={brand.backgroundColor} onChange={(v) => updateField('backgroundColor', v)} />
        <ColorField label="CTA Button" value={brand.ctaColor} onChange={(v) => updateField('ctaColor', v)} />
        <ColorField label="Text Primary" value={brand.textPrimary} onChange={(v) => updateField('textPrimary', v)} />
        <ColorField label="Text Secondary" value={brand.textSecondary} onChange={(v) => updateField('textSecondary', v)} />
      </div>

      {/* Logo */}
      <div style={S.section}>
        <label style={S.label}>Logo URL (optional)</label>
        <input type="text" placeholder="https://example.com/logo.svg"
          value={brand.logoUrl || ''} onChange={(e) => updateField('logoUrl', e.target.value)}
          style={S.textInput} />
        {brand.logoUrl && (
          <img src={brand.logoUrl} alt="logo" style={{ maxHeight: 40, marginTop: 8, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }} />
        )}
      </div>

      {/* Preview strip */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
        <label style={{ ...S.label, marginBottom: 6 }}>Preview</label>
        <div style={{
          display: 'flex', gap: 4, padding: 8, borderRadius: 8,
          background: brand.backgroundColor || '#f8fafc',
          border: '1px solid #e2e8f0',
        }}>
          {previewColors.map((c, i) => (
            <div key={i} style={{
              flex: 1, height: 32, borderRadius: 6, background: c,
              border: '1px solid rgba(0,0,0,0.1)',
            }} />
          ))}
        </div>
        <div style={{
          marginTop: 6, padding: '8px 12px', borderRadius: 8,
          background: brand.backgroundColor || '#001F4D', textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: brand.textPrimary || '#fff' }}>
            {brand.name || 'Your Brand'} Quiz
          </div>
          <div style={{ fontSize: 11, color: brand.textSecondary || '#aaa', marginTop: 2 }}>
            Answer & win exciting rewards
          </div>
          <div style={{
            display: 'inline-block', marginTop: 8, padding: '6px 20px',
            borderRadius: 6, fontSize: 12, fontWeight: 700,
            background: brand.ctaColor || brand.primaryColor || '#6366f1',
            color: '#fff',
          }}>
            Play Now
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div style={{ padding: '8px 14px 14px' }}>
        <button onClick={onApplyBrand} style={S.applyBtn}>
          🎨 Apply Brand to This Game
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_BRAND, PRESET_BRANDS };
export default BrandKit;
