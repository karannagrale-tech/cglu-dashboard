import { useState, useRef, useEffect, useCallback } from 'react';

/* ─────────────── Theme presets ─────────────── */
const THEME_PRESETS = {
  festive: {
    label: 'Festive (Gold & Red)',
    ROOT: { css: { container: { backgroundColor: '#FFD700', backgroundImage: 'none' } } },
    TEXT_1: { css: { text: { color: '#1a1a2e', textShadow: '0 1px 2px rgba(0,0,0,0.1)' } } },
    TEXT_2: { css: { text: { color: '#4a1a1a' } } },
    CTA: { css: { button: { backgroundColor: '#DC2626', color: '#FFFFFF', borderRadius: '8px' } } },
  },
  dark: {
    label: 'Dark Mode',
    ROOT: { css: { container: { backgroundColor: '#1a1a2e', backgroundImage: 'none' } } },
    TEXT_1: { css: { text: { color: '#F3F4F6' } } },
    TEXT_2: { css: { text: { color: '#D1D5DB' } } },
    CTA: { css: { button: { backgroundColor: '#7c3aed', color: '#FFFFFF' } } },
  },
  minimal: {
    label: 'Clean Minimal',
    ROOT: { css: { container: { backgroundColor: '#FFFFFF', backgroundImage: 'none' } } },
    TEXT_1: { css: { text: { color: '#374151' } } },
    TEXT_2: { css: { text: { color: '#6B7280' } } },
    CTA: { css: { button: { backgroundColor: '#3B82F6', color: '#FFFFFF' } } },
  },
  ocean: {
    label: 'Ocean Blue',
    ROOT: { css: { container: { backgroundColor: '#0F172A', backgroundImage: 'none' } } },
    TEXT_1: { css: { text: { color: '#38BDF8' } } },
    TEXT_2: { css: { text: { color: '#BAE6FD' } } },
    CTA: { css: { button: { backgroundColor: '#0EA5E9', color: '#FFFFFF' } } },
  },
  nature: {
    label: 'Fresh Green',
    ROOT: { css: { container: { backgroundColor: '#F0FDF4', backgroundImage: 'none' } } },
    TEXT_1: { css: { text: { color: '#166534' } } },
    TEXT_2: { css: { text: { color: '#15803D' } } },
    CTA: { css: { button: { backgroundColor: '#16A34A', color: '#FFFFFF' } } },
  },
};

/* ─────────────── Named colors ─────────────── */
const COLOR_MAP = {
  red: '#EF4444', blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B',
  purple: '#8B5CF6', pink: '#EC4899', orange: '#F97316', white: '#FFFFFF',
  black: '#000000', gold: '#FFD700', silver: '#C0C0C0', indigo: '#6366F1',
  teal: '#14B8A6', cyan: '#06B6D4', lime: '#84CC16', amber: '#F59E0B',
  gray: '#6B7280', navy: '#1E3A5F', maroon: '#7F1D1D', coral: '#FF6B6B',
};

function resolveColor(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  if (lower.startsWith('#')) return lower;
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  return null;
}

/* ─────────────── Helpers ─────────────── */
function findTextNodes(byId) {
  if (!byId) return [];
  return Object.entries(byId)
    .filter(([, n]) => n.type_id === 'TEXT' || (n.type_id || '').includes('TEXT'))
    .map(([id]) => id);
}

function findNodeByTypeId(byId, typeId) {
  for (const [id, n] of Object.entries(byId || {})) {
    if (id === typeId || n.type_id === typeId) return id;
  }
  return null;
}

/* ─────────────── Node info helper ─────────────── */
const NODE_FRIENDLY = {
  ROOT: 'Page Background', TEXT_1: 'Title', TEXT_2: 'Subtitle',
  TEXT_HINT: 'Hint Text', TEXT_HELP: 'Help Text',
  CTA: 'CTA Button', CC: 'Coupon Code', RC: 'Reward Card',
  SC: 'Scratch Card', STW: 'Spin Wheel', QUIZ: 'Quiz',
  IMG_1: 'Main Image', IMG0: 'Image 1', IMG1: 'Image 2',
  TNC: 'Terms & Conditions', EXPIRY: 'Expiry Timer',
  REWARD_BODY: 'Reward Body', ANIME_BLOCK: 'Animation',
  CONDITIONAL: 'Conditional', CONDITIONAL_1: 'Conditional 1',
  CONDITIONAL_2: 'Conditional 2', EXPIRY_DATE: 'Expiry Date',
};

function getNodeLabel(nodeId) { return NODE_FRIENDLY[nodeId] || nodeId; }

function getNodeCurrentValues(nodeId, byId) {
  if (!byId || !byId[nodeId]) return null;
  const node = byId[nodeId];
  const info = {};
  if (node.ui?.content?.text) info.text = node.ui.content.text;
  if (node.ui?.css) {
    const css = node.ui.css;
    if (css.container?.backgroundColor) info.bgColor = css.container.backgroundColor;
    if (css.text?.color) info.textColor = css.text.color;
    if (css.text?.fontSize) info.fontSize = css.text.fontSize;
    if (css.button?.backgroundColor) info.buttonColor = css.button.backgroundColor;
    if (css.container?.backgroundImage) info.bgImage = css.container.backgroundImage;
  }
  return info;
}

/* ─────────────── Context-aware command parser ─────────────── */
/**
 * Returns { actions: Action[], changes: string[] } or null.
 *
 * Action types:
 *   UPDATE_NODE_CSS     — { type, nodeId, cssSection, property, value }
 *   UPDATE_NODE_CONTENT — { type, nodeId, key, value }
 *   APPLY_THEME         — { type, patches: { [nodeId]: { css, content } } }
 *   REMOVE_NODE         — { type, nodeId }
 *   REPLACE_ASSET       — { type, nodeId, cssSection, property, url }
 */
/**
 * Intent-based command parser. Strips conversational fluff, detects intent, extracts payload.
 * Handles: "Can you please add a block saying X", "I want to change the color to blue", etc.
 */
function parseCommand(message, byId, selectedNodeId) {
  if (!byId) return null;
  const raw = message.trim();
  if (!raw) return null;

  // Strip conversational prefixes: "can you", "please", "could you", "I want to", "I'd like to"
  const stripped = raw
    .replace(/^(hey|hi|hello|ok|okay|sure|yes|please|now|also|and|then)\s*[,.]?\s*/i, '')
    .replace(/^(can you|could you|would you|will you|i want to|i'd like to|i would like to|please)\s*/i, '')
    .replace(/^(can you|could you|would you|please)\s*/i, '') // double pass
    .replace(/["""]+/g, '') // remove smart quotes
    .trim();

  const msg = stripped;
  const lower = msg.toLowerCase();
  const target = selectedNodeId && byId[selectedNodeId] ? selectedNodeId : null;
  const addParent = target || 'ROOT';

  // ── ADD ELEMENT — detect "add" intent with content after "saying/with/that says" ──
  if (/add/i.test(lower)) {
    // Extract text content after trigger words
    const contentMatch = msg.match(/(?:saying|with text|that says|that reads|with|:)\s*[,.]?\s*(.+)$/i);

    if (/(?:image|gif|photo|picture)/i.test(lower)) {
      const urlMatch = msg.match(/(https?:\/\/\S+)/);
      return {
        actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'IMAGE', overrides: urlMatch ? { 'ui.content.src': urlMatch[1] } : {} }],
        changes: [urlMatch ? `Added image: ${urlMatch[1]}` : 'Added image — set URL in editor'],
      };
    }
    if (/(?:button|cta)/i.test(lower)) {
      const text = contentMatch?.[1] || 'Click Here';
      return {
        actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'BUTTON', overrides: { 'ui.content.text': text } }],
        changes: [`Added button: "${text}"`],
      };
    }
    if (/(?:divider|separator|spacer|line)/i.test(lower)) {
      return { actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'DIVIDER', overrides: {} }], changes: ['Added divider'] };
    }
    if (/(?:coupon|code block)/i.test(lower)) {
      return { actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'COUPON_CODE', overrides: {} }], changes: ['Added coupon code'] };
    }
    if (/(?:terms|t&c|tnc)/i.test(lower)) {
      return { actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'TERMS', overrides: {} }], changes: ['Added T&C block'] };
    }
    // Default "add" = add text with whatever content follows
    if (contentMatch) {
      return {
        actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'TEXT', overrides: { 'ui.content.text': contentMatch[1].replace(/[,.]$/, '').trim() } }],
        changes: [`Added text: "${contentMatch[1].replace(/[,.]$/, '').trim()}"`],
      };
    }
    // "add text" / "add block" with no content
    if (/(?:text|block|element)/i.test(lower)) {
      return { actions: [{ type: 'ADD_ELEMENT', parentId: addParent, position: -1, elementType: 'TEXT', overrides: {} }], changes: ['Added text block'] };
    }
  }

  // ── BRAND — only on explicit brand intent ──
  if (/^apply\s+(?:my\s+)?brand/i.test(lower) || /^use\s+(?:my\s+)?brand/i.test(lower)) {
    return { actions: [{ type: '_APPLY_BRAND' }], changes: ['Applied brand kit'] };
  }
  const knownBrands = { indigo: 'IndiGo Airlines', swiggy: 'Swiggy', flipkart: 'Flipkart', nykaa: 'Nykaa' };
  for (const [key, label] of Object.entries(knownBrands)) {
    if (new RegExp(`^(?:apply\\s+)?${key}\\s+(?:theme|brand|style)$`, 'i').test(lower) ||
        new RegExp(`^make\\s+it\\s+(?:like\\s+)?${key}$`, 'i').test(lower)) {
      return { actions: [{ type: '_LOAD_BRAND_PRESET', preset: key }], changes: [`Applying ${label} brand`] };
    }
  }

  // ── THEME presets ──
  const themeNames = Object.keys(THEME_PRESETS);
  for (const name of themeNames) {
    if (new RegExp(`^${name}$|^${name}\\s+theme$|^(?:apply|set|switch)\\s+(?:to\\s+)?${name}`, 'i').test(lower)) {
      const preset = THEME_PRESETS[name];
      const patches = {};
      for (const [nid, patch] of Object.entries(preset)) {
        if (nid !== 'label' && byId[nid]) patches[nid] = patch;
      }
      return { actions: [{ type: 'APPLY_THEME', patches }], changes: [`Applied "${name}" theme`] };
    }
  }

  // ── COLOR — detect color anywhere in message ──
  const colorWords = Object.keys(COLOR_MAP).join('|');
  const foundColor = lower.match(new RegExp(`(#[0-9a-fA-F]{3,8}|${colorWords})`, 'i'));
  const color = foundColor ? resolveColor(foundColor[1]) : null;

  if (color) {
    if (/background/i.test(lower)) {
      return { actions: [{ type: 'UPDATE_NODE_CSS', nodeId: 'ROOT', cssSection: 'container', property: 'backgroundColor', value: color }], changes: [`Background → ${color}`] };
    }
    if (/button|cta/i.test(lower)) {
      const nid = byId.CTA ? 'CTA' : findNodeByTypeId(byId, 'REWARD_BUTTON');
      if (nid) return { actions: [{ type: 'UPDATE_NODE_CSS', nodeId: nid, cssSection: 'button', property: 'backgroundColor', value: color }], changes: [`Button → ${color}`] };
    }
    if (/text\s+color|font\s+color/i.test(lower)) {
      const nodes = target ? [target] : findTextNodes(byId);
      return { actions: nodes.map(n => ({ type: 'UPDATE_NODE_CSS', nodeId: n, cssSection: 'text', property: 'color', value: color })), changes: [`Text color → ${color}`] };
    }
    // Apply to selected element or background
    if (target) {
      const node = byId[target];
      const isText = (node.type_id || '').includes('TEXT') || target.includes('TEXT');
      const isBtn = (node.type_id || '').includes('BUTTON') || target === 'CTA';
      if (isText) return { actions: [{ type: 'UPDATE_NODE_CSS', nodeId: target, cssSection: 'text', property: 'color', value: color }], changes: [`${getNodeLabel(target)} text → ${color}`] };
      if (isBtn) return { actions: [{ type: 'UPDATE_NODE_CSS', nodeId: target, cssSection: 'button', property: 'backgroundColor', value: color }], changes: [`${getNodeLabel(target)} → ${color}`] };
      if (target === 'ROOT') return { actions: [{ type: 'UPDATE_NODE_CSS', nodeId: 'ROOT', cssSection: 'container', property: 'backgroundColor', value: color }], changes: [`Background → ${color}`] };
    }
    return { actions: [{ type: 'UPDATE_NODE_CSS', nodeId: 'ROOT', cssSection: 'container', property: 'backgroundColor', value: color }], changes: [`Background → ${color}`] };
  }

  // ── TEXT CHANGE — "change title/subtitle/text/button text to X" ──
  const changeTextMatch = msg.match(/(?:change|update|set|make)\s+(?:the\s+)?(title|subtitle|heading|text|button text|cta text|reward text|button|cta)\s+(?:to|=|:)\s*(.+)$/i);
  if (changeTextMatch) {
    const what = changeTextMatch[1].toLowerCase();
    const value = changeTextMatch[2].replace(/^["']|["']$/g, '').trim();
    let nid = target;
    if (/title|heading/i.test(what) && !nid) nid = byId.TEXT_1 ? 'TEXT_1' : null;
    if (/subtitle/i.test(what)) nid = byId.TEXT_2 ? 'TEXT_2' : null;
    if (/button|cta/i.test(what)) nid = byId.CTA ? 'CTA' : findNodeByTypeId(byId, 'REWARD_BUTTON');
    if (/reward/i.test(what)) nid = byId.REWARD_BODY ? 'REWARD_BODY' : null;
    if (!nid && /text/i.test(what)) nid = target || (byId.TEXT_1 ? 'TEXT_1' : null);
    if (nid) return { actions: [{ type: 'UPDATE_NODE_CONTENT', nodeId: nid, key: 'text', value }], changes: [`${getNodeLabel(nid)} → "${value}"`] };
  }

  // ── SIZE — bigger, smaller, bold ──
  const sizeWord = lower.match(/(bigger|larger|smaller|tiny|huge|bolder|bold|normal)/);
  if (sizeWord) {
    const w = sizeWord[1];
    const nodes = target ? [target] : findTextNodes(byId);
    if (nodes.length === 0) return null;
    const actions = [];
    if (['bigger', 'larger', 'huge'].includes(w)) {
      nodes.forEach(n => { const c = parseInt(byId[n]?.ui?.css?.text?.fontSize, 10) || 16; actions.push({ type: 'UPDATE_NODE_CSS', nodeId: n, cssSection: 'text', property: 'fontSize', value: (c + (w === 'huge' ? 8 : 4)) + 'px' }); });
    } else if (['smaller', 'tiny'].includes(w)) {
      nodes.forEach(n => { const c = parseInt(byId[n]?.ui?.css?.text?.fontSize, 10) || 16; actions.push({ type: 'UPDATE_NODE_CSS', nodeId: n, cssSection: 'text', property: 'fontSize', value: Math.max(8, c - (w === 'tiny' ? 6 : 3)) + 'px' }); });
    } else if (['bold', 'bolder'].includes(w)) {
      nodes.forEach(n => actions.push({ type: 'UPDATE_NODE_CSS', nodeId: n, cssSection: 'text', property: 'fontWeight', value: '700' }));
    } else {
      nodes.forEach(n => actions.push({ type: 'UPDATE_NODE_CSS', nodeId: n, cssSection: 'text', property: 'fontWeight', value: '400' }));
    }
    return { actions, changes: nodes.map(n => `${getNodeLabel(n)} → ${w}`) };
  }

  // ── VISIBILITY — hide/show/remove ──
  if (/^(hide|show|remove)/i.test(lower)) {
    const action = lower.match(/^(hide|show|remove)/)[1];
    const rest = lower.replace(/^(hide|show|remove)\s+(?:the\s+)?/, '').toUpperCase().replace(/\s+/g, '_');
    const nid = byId[rest] ? rest : findNodeByTypeId(byId, rest);
    if (nid) {
      if (action === 'remove') return { actions: [{ type: 'REMOVE_NODE', nodeId: nid }], changes: [`Removed ${getNodeLabel(nid)}`] };
      return { actions: [{ type: 'UPDATE_NODE_CONTENT', nodeId: nid, key: 'visible', value: action === 'show' }], changes: [`${action === 'show' ? 'Showing' : 'Hiding'} ${getNodeLabel(nid)}`] };
    }
  }

  return null;
}

/* ─────────────── Format time ─────────────── */
function ts() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

/* ─────────────── Component ─────────────── */
function AskAiraPanel({ byId, selectedNodeId, rewardState, dispatch, campaignExperience, onApplyBrand, onLoadBrandPreset }) {
  const [expanded, setExpanded] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Welcome message on mount
  useEffect(() => {
    setMessages([{
      role: 'assistant', timestamp: ts(),
      text: 'Hi! I\'m Aira. Select an element in the structure tree, then tell me what to change. Or just describe what you want!\n\nExamples:\n  - "dark" -- apply dark theme\n  - "make it blue" -- recolor selected element\n  - "change title to Win Big!"\n  - "bigger" -- increase font size\n  - "add text Welcome!" -- add a text element\n  - "add button Shop Now" -- add a CTA\n  - "add image" -- add an image element',
    }]);
  }, []);

  // Show context when selected node changes
  useEffect(() => {
    if (!selectedNodeId) return;
    if (!byId || !byId[selectedNodeId]) return;
    const info = getNodeCurrentValues(selectedNodeId, byId);
    const parts = [`Selected: **${getNodeLabel(selectedNodeId)}** (${selectedNodeId})`];
    if (info?.text) parts.push(`Text: "${info.text}"`);
    if (info?.bgColor) parts.push(`Background: ${info.bgColor}`);
    if (info?.textColor) parts.push(`Text color: ${info.textColor}`);
    if (info?.fontSize) parts.push(`Font size: ${info.fontSize}`);
    if (info?.buttonColor) parts.push(`Button color: ${info.buttonColor}`);

    setMessages(prev => [...prev, {
      role: 'system', timestamp: ts(),
      text: parts.join('\n'),
    }]);
  }, [selectedNodeId, byId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: msg, timestamp: ts() }]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    if (!byId) {
      setMessages(prev => [...prev, {
        role: 'assistant', timestamp: ts(), status: 'warning',
        text: 'This campaign doesn\'t have a layout configured yet. To edit the layout:\n1. Go to the production dashboard\n2. Open this campaign and click "Edit Layout"\n3. Save once to create the layout\n4. Come back here to edit with Aira',
      }]);
      setLoading(false);
      return;
    }

    const result = parseCommand(msg, byId, selectedNodeId);

    if (result && result.actions && result.actions.length > 0) {
      try {
        // Handle special brand actions
        for (const action of result.actions) {
          if (action.type === '_APPLY_BRAND') {
            // Trigger the parent's apply brand handler
            if (onApplyBrand) onApplyBrand();
          } else if (action.type === '_LOAD_BRAND_PRESET') {
            // Load a known brand preset and apply
            if (onLoadBrandPreset) onLoadBrandPreset(action.preset);
          } else {
            dispatch(action);
          }
        }
        setMessages(prev => [...prev, {
          role: 'assistant', timestamp: ts(), status: 'success',
          text: result.changes.join('\n'),
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant', timestamp: ts(), status: 'error',
          text: `Failed: ${err.message}`,
        }]);
      }
    } else {
      // Smart fallback suggestions based on what they typed
      const suggestions = [];
      if (/color|colou?r/i.test(msg)) suggestions.push('Try: "change background to blue" or "make it #FF5733"');
      if (/text|title|write|copy/i.test(msg)) suggestions.push('Try: "change title to Your Text Here"');
      if (/big|small|size|font/i.test(msg)) suggestions.push('Try: "make it bigger" or "make text smaller"');
      if (/image|photo|picture|upload/i.test(msg)) suggestions.push('Try: "add image https://..." or upload with the + button');
      if (/theme|style|look|design/i.test(msg)) suggestions.push(`Available themes: ${Object.keys(THEME_PRESETS).join(', ')}\nTry: "dark" or "festive"`);
      if (/add|insert|new|create/i.test(msg)) suggestions.push('Try: "add text Hello!", "add button Sign Up", "add image", "add divider", "add coupon code", "add terms"');

      const fallback = suggestions.length > 0
        ? `I didn't quite get that.\n\n${suggestions.join('\n\n')}`
        : `I didn't understand that. Here's what I can do:\n\n- Colors: "blue", "background gold", "button #FF0000"\n- Text: "change title to ...", "change text to ..."\n- Size: "bigger", "smaller", "bold"\n- Themes: "${Object.keys(THEME_PRESETS).join('", "')}"\n- Add elements: "add text ...", "add button ...", "add image", "add divider"\n- Visibility: "hide CTA", "show TEXT_1"\n\nSelect a node first for targeted changes!`;

      setMessages(prev => [...prev, {
        role: 'assistant', timestamp: ts(), status: 'info', text: fallback,
      }]);
    }
    setLoading(false);
  }, [input, loading, byId, dispatch, selectedNodeId]);

  // Pending image upload waiting for user choice (new element vs background)
  const [pendingUpload, setPendingUpload] = useState(null);

  const applyUploadAsBackground = useCallback((dataUrl, fileName) => {
    if (!byId) return;
    const nid = selectedNodeId && byId[selectedNodeId] ? selectedNodeId : 'ROOT';
    try {
      dispatch({
        type: 'REPLACE_ASSET',
        nodeId: nid,
        cssSection: 'container',
        property: 'backgroundImage',
        url: dataUrl,
      });
      setMessages(prev => [...prev, {
        role: 'assistant', timestamp: ts(), status: 'success',
        text: `Applied "${fileName}" as background on ${getNodeLabel(nid)}`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', timestamp: ts(), status: 'error',
        text: `Failed to apply image: ${err.message}`,
      }]);
    }
  }, [byId, dispatch, selectedNodeId]);

  const applyUploadAsElement = useCallback((dataUrl, fileName) => {
    if (!byId) return;
    const parentId = selectedNodeId || 'ROOT';
    try {
      dispatch({
        type: 'ADD_ELEMENT',
        parentId,
        position: -1,
        elementType: 'IMAGE',
        overrides: { 'ui.content.src': dataUrl },
      });
      setMessages(prev => [...prev, {
        role: 'assistant', timestamp: ts(), status: 'success',
        text: `Added "${fileName}" as a new image element`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', timestamp: ts(), status: 'error',
        text: `Failed to add image element: ${err.message}`,
      }]);
    }
  }, [byId, dispatch, selectedNodeId]);

  const handleUploadChoice = useCallback((choice) => {
    if (!pendingUpload) return;
    const { url, name } = pendingUpload;
    setPendingUpload(null);
    if (choice === 'element') {
      applyUploadAsElement(url, name);
    } else {
      applyUploadAsBackground(url, name);
    }
  }, [pendingUpload, applyUploadAsElement, applyUploadAsBackground]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setUploadedImage({ name: file.name, url: dataUrl });
      setMessages(prev => [...prev, {
        role: 'user', timestamp: ts(),
        text: `Uploaded: ${file.name}`,
        image: dataUrl,
      }]);

      if (byId) {
        // Ask user how to use the uploaded image
        setPendingUpload({ url: dataUrl, name: file.name });
        setMessages(prev => [...prev, {
          role: 'assistant', timestamp: ts(), status: 'info',
          text: 'How would you like to use this image?\nChoose below:',
        }]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [byId]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // Dynamic suggestions based on selection
  const suggestions = selectedNodeId
    ? [
        { label: 'Change color', prompt: `make ${selectedNodeId} blue` },
        { label: 'Edit text', prompt: `change text to ` },
        { label: 'Bigger', prompt: 'bigger' },
        { label: 'Hide', prompt: `hide ${selectedNodeId}` },
      ]
    : [
        { label: 'Dark theme', prompt: 'dark' },
        { label: 'Festive', prompt: 'festive' },
        { label: 'Add text', prompt: 'add text ' },
        { label: 'Add image', prompt: 'add image' },
        { label: 'Add button', prompt: 'add button ' },
      ];

  return (
    <div style={{ borderTop: '2px solid #7c3aed', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'linear-gradient(135deg, #7c3aed, #6D28D9)',
          color: '#fff', cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Ask Aira</span>
          {selectedNodeId && (
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.2)' }}>
              {getNodeLabel(selectedNodeId)}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, transform: expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {expanded && (
        <>
          {/* Messages */}
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 12px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, marginBottom: 10,
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              }}>
                {m.role !== 'system' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: m.role === 'user' ? '#E5E7EB' : 'linear-gradient(135deg, #7c3aed, #A78BFA)',
                    color: m.role === 'user' ? '#6B7280' : '#fff',
                  }}>
                    {m.role === 'user' ? 'U' : 'A'}
                  </div>
                )}
                <div style={{ maxWidth: m.role === 'system' ? '100%' : '82%', width: m.role === 'system' ? '100%' : undefined }}>
                  {m.image && (
                    <img src={m.image} alt="upload" style={{ maxWidth: 120, borderRadius: 8, marginBottom: 4, display: 'block' }} />
                  )}
                  <div style={{
                    padding: m.role === 'system' ? '6px 10px' : '8px 12px',
                    borderRadius: 10, fontSize: 12, lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: m.role === 'user' ? '#7c3aed'
                      : m.role === 'system' ? '#F5F3FF'
                      : m.status === 'success' ? '#F0FDF4'
                      : m.status === 'error' ? '#FEF2F2'
                      : m.status === 'warning' ? '#FFFBEB'
                      : '#F9FAFB',
                    color: m.role === 'user' ? '#fff'
                      : m.role === 'system' ? '#7c3aed'
                      : m.status === 'success' ? '#166534'
                      : m.status === 'error' ? '#991B1B'
                      : m.status === 'warning' ? '#92400E'
                      : '#1F2937',
                    border: m.role === 'user' ? 'none'
                      : m.role === 'system' ? '1px solid #DDD6FE'
                      : m.status === 'success' ? '1px solid #BBF7D0'
                      : m.status === 'error' ? '1px solid #FECACA'
                      : m.status === 'warning' ? '1px solid #FDE68A'
                      : '1px solid #E5E7EB',
                    fontStyle: m.role === 'system' ? 'italic' : 'normal',
                    fontSize: m.role === 'system' ? 11 : 12,
                  }}>
                    {m.text}
                  </div>
                  {m.timestamp && m.role !== 'system' && (
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: m.role === 'user' ? 'right' : 'left', paddingInline: 4 }}>
                      {m.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, background: 'linear-gradient(135deg, #7c3aed, #A78BFA)', color: '#fff',
                }}>A</div>
                <div style={{
                  padding: '10px 16px', borderRadius: 10, background: '#F9FAFB',
                  border: '1px solid #E5E7EB', display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  <style>{`@keyframes ad{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}`}</style>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7c3aed',
                      display: 'inline-block', animation: `ad 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Upload choice buttons */}
          {pendingUpload && (
            <div style={{ display: 'flex', gap: 6, padding: '6px 12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleUploadChoice('element')}
                style={{
                  padding: '5px 14px', borderRadius: 16, border: '1px solid #BBF7D0',
                  background: '#F0FDF4', color: '#166534', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >Add as new image element</button>
              <button
                onClick={() => handleUploadChoice('background')}
                style={{
                  padding: '5px 14px', borderRadius: 16, border: '1px solid #DDD6FE',
                  background: '#EDE9FE', color: '#6D28D9', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >Set as background</button>
            </div>
          )}

          {/* Suggestions */}
          {!pendingUpload && (
          <div style={{ display: 'flex', gap: 6, padding: '6px 12px', flexWrap: 'wrap' }}>
            {suggestions.map(s => (
              <button
                key={s.label}
                onClick={() => s.prompt.endsWith(' ') ? setInput(s.prompt) : handleSend(s.prompt)}
                disabled={loading}
                style={{
                  padding: '3px 10px', borderRadius: 16, border: '1px solid #DDD6FE',
                  background: '#EDE9FE', color: '#6D28D9', fontSize: 11, fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >{s.label}</button>
            ))}
          </div>
          )}

          {/* Input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px 10px', borderTop: '1px solid #E5E7EB',
          }}>
            {/* File upload */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
              style={{
                width: 32, height: 32, borderRadius: '50%', border: '1px solid #E5E7EB',
                background: '#F9FAFB', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
              }}
            >+</button>

            <input
              type="text"
              placeholder={selectedNodeId ? `Edit ${getNodeLabel(selectedNodeId)}...` : 'Describe changes...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB',
                borderRadius: 20, fontSize: 12, outline: 'none', background: '#F9FAFB',
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: loading || !input.trim() ? '#D1D5DB' : '#7c3aed',
                color: '#fff', fontSize: 13, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >{'>'}</button>
          </div>
        </>
      )}
    </div>
  );
}

export { parseCommand, THEME_PRESETS };
export default AskAiraPanel;
