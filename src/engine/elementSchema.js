/**
 * elementSchema.js — Declarative element schema system for the CustomerGlu layout editor.
 *
 * Single source of truth for element types, their editable properties, style definitions,
 * game-specific schemas, node factories, and validation. The NodeEditorPanel and
 * AddElement UI consume these schemas to render controls and create nodes.
 *
 * Every element type declares:
 *   - label, icon, category, description (UI metadata)
 *   - type_id (the value stored in byId nodes; defaults to the key name)
 *   - properties (content fields the user can edit)
 *   - style (CSS fields the user can tweak)
 *
 * Property/style definition shape:
 *   { type, label, required?, default, min?, max?, unit?, options?, rows?, itemSchema? }
 *
 * Supported field types:
 *   string, color, image, select, size, number, boolean, textarea, array
 */

/* ── Internal helpers ───────────────────────────────────────── */

let _idCounters = {};

/**
 * Set a value at a dot-separated path inside an object (mutates in place).
 * Creates intermediate objects as needed.
 *
 *   setNestedValue(obj, 'ui.content.text', 'hello')
 */
function setNestedValue(obj, path, value) {
  const keys = typeof path === 'string' ? path.split('.') : path;
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (
      target[keys[i]] === undefined ||
      target[keys[i]] === null ||
      typeof target[keys[i]] !== 'object'
    ) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
}

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

/* ══════════════════════════════════════════════════════════════
   1. ELEMENT_TYPES — full schema for every element type
   ══════════════════════════════════════════════════════════════ */

export const ELEMENT_TYPES = {

  /* ── Content ─────────────────────────────────────────────── */

  TEXT: {
    label: 'Text',
    icon: '📝',
    category: 'content',
    type_id: 'TEXT',
    description: 'Editable text block',
    properties: {
      'ui.content.text': {
        type: 'string', label: 'Text', required: true, default: 'New text',
      },
    },
    style: {
      'ui.css.text.fontSize':       { type: 'size', label: 'Font Size', default: '16px', min: 8, max: 72, unit: 'px' },
      'ui.css.text.fontWeight':     { type: 'select', label: 'Font Weight', default: '400', options: ['300', '400', '500', '600', '700', '800'] },
      'ui.css.text.color':          { type: 'color', label: 'Text Color', default: '#FFFFFF' },
      'ui.css.text.margin':         { type: 'string', label: 'Margin', default: '8px 0' },
      'ui.css.text.lineHeight':     { type: 'string', label: 'Line Height', default: '1.4' },
      'ui.css.text.textAlign':      { type: 'select', label: 'Align', default: 'center', options: ['left', 'center', 'right'] },
      'ui.css.text.fontFamily':     { type: 'string', label: 'Font Family', default: 'inherit' },
      'ui.css.text.letterSpacing':  { type: 'string', label: 'Letter Spacing', default: 'normal' },
    },
  },

  REWARD_BODY: {
    label: 'Reward Text',
    icon: '🎁',
    category: 'content',
    type_id: 'REWARD_BODY',
    description: 'Reward message display',
    properties: {
      'ui.content.text': {
        type: 'string', label: 'Reward Text', required: true,
        default: 'Congratulations! You won a reward!',
      },
    },
    style: {
      'ui.css.text.fontSize':   { type: 'size', label: 'Font Size', default: '18px', min: 10, max: 48, unit: 'px' },
      'ui.css.text.fontWeight': { type: 'select', label: 'Font Weight', default: '600', options: ['400', '500', '600', '700', '800'] },
      'ui.css.text.color':      { type: 'color', label: 'Text Color', default: '#FFFFFF' },
      'ui.css.text.margin':     { type: 'string', label: 'Margin', default: '16px 0 8px' },
      'ui.css.text.textAlign':  { type: 'select', label: 'Align', default: 'center', options: ['left', 'center', 'right'] },
    },
  },

  /* ── Media ───────────────────────────────────────────────── */

  IMAGE: {
    label: 'Image / GIF',
    icon: '🖼️',
    category: 'media',
    type_id: 'IMAGE',
    description: 'Image or animated GIF',
    properties: {
      'ui.content.src': { type: 'image', label: 'Image URL', required: true, default: '' },
      'ui.content.alt': { type: 'string', label: 'Alt Text', default: '' },
    },
    style: {
      'ui.css.image.width':        { type: 'string', label: 'Width', default: '100%' },
      'ui.css.image.maxWidth':     { type: 'string', label: 'Max Width', default: '280px' },
      'ui.css.image.height':       { type: 'string', label: 'Height', default: 'auto' },
      'ui.css.image.borderRadius': { type: 'string', label: 'Border Radius', default: '8px' },
      'ui.css.image.margin':       { type: 'string', label: 'Margin', default: '12px auto' },
      'ui.css.image.objectFit':    { type: 'select', label: 'Fit', default: 'cover', options: ['cover', 'contain', 'fill', 'none'] },
      'ui.css.image.display':      { type: 'string', label: 'Display', default: 'block' },
    },
  },

  /* ── Interactive ─────────────────────────────────────────── */

  BUTTON: {
    label: 'Button',
    icon: '👆',
    category: 'interactive',
    type_id: 'REWARD_BUTTON',
    description: 'CTA button with configurable text, color, and link',
    properties: {
      'ui.content.text':   { type: 'string', label: 'Button Text', required: true, default: 'Click Here' },
      'ui.content.link':   { type: 'string', label: 'Link URL', default: '' },
      'ui.content.target': { type: 'select', label: 'Open In', default: '_self', options: ['_self', '_blank'] },
    },
    style: {
      'ui.css.button.backgroundColor': { type: 'color', label: 'Background', default: '#EC4899' },
      'ui.css.button.color':           { type: 'color', label: 'Text Color', default: '#FFFFFF' },
      'ui.css.button.borderRadius':    { type: 'string', label: 'Border Radius', default: '8px' },
      'ui.css.button.padding':         { type: 'string', label: 'Padding', default: '12px 32px' },
      'ui.css.button.fontSize':        { type: 'size', label: 'Font Size', default: '16px', min: 10, max: 32, unit: 'px' },
      'ui.css.button.fontWeight':      { type: 'select', label: 'Font Weight', default: '600', options: ['400', '500', '600', '700', '800'] },
      'ui.css.button.margin':          { type: 'string', label: 'Margin', default: '16px auto' },
      'ui.css.button.display':         { type: 'string', label: 'Display', default: 'block' },
      'ui.css.button.border':          { type: 'string', label: 'Border', default: 'none' },
      'ui.css.button.cursor':          { type: 'string', label: 'Cursor', default: 'pointer' },
      'ui.css.button.maxWidth':        { type: 'string', label: 'Max Width', default: '280px' },
      'ui.css.button.width':           { type: 'string', label: 'Width', default: '100%' },
    },
  },

  /* ── Layout ──────────────────────────────────────────────── */

  DIVIDER: {
    label: 'Divider / Spacer',
    icon: '➖',
    category: 'layout',
    type_id: 'DIVIDER',
    description: 'Horizontal separator or vertical spacer',
    properties: {
      'ui.content.variant': {
        type: 'select', label: 'Variant', default: 'line',
        options: ['line', 'spacer', 'dashed', 'dotted'],
      },
    },
    style: {
      'ui.css.container.height':          { type: 'string', label: 'Height', default: '1px' },
      'ui.css.container.backgroundColor': { type: 'color', label: 'Color', default: 'rgba(255,255,255,0.2)' },
      'ui.css.container.margin':          { type: 'string', label: 'Margin', default: '16px auto' },
      'ui.css.container.maxWidth':        { type: 'string', label: 'Max Width', default: '280px' },
      'ui.css.container.width':           { type: 'string', label: 'Width', default: '80%' },
      'ui.css.container.borderStyle':     { type: 'select', label: 'Border Style', default: 'solid', options: ['solid', 'dashed', 'dotted', 'none'] },
    },
  },

  CONTAINER: {
    label: 'Container',
    icon: '📦',
    category: 'layout',
    type_id: 'CONTAINER',
    description: 'Generic container that holds child elements',
    properties: {
      'ui.content.children': { type: 'array', label: 'Children', default: [] },
    },
    style: {
      'ui.css.container.display':         { type: 'select', label: 'Display', default: 'flex', options: ['flex', 'block', 'grid'] },
      'ui.css.container.flexDirection':   { type: 'select', label: 'Direction', default: 'column', options: ['column', 'row', 'column-reverse', 'row-reverse'] },
      'ui.css.container.alignItems':      { type: 'select', label: 'Align Items', default: 'center', options: ['flex-start', 'center', 'flex-end', 'stretch'] },
      'ui.css.container.justifyContent':  { type: 'select', label: 'Justify', default: 'flex-start', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] },
      'ui.css.container.gap':             { type: 'string', label: 'Gap', default: '0px' },
      'ui.css.container.padding':         { type: 'string', label: 'Padding', default: '0px' },
      'ui.css.container.margin':          { type: 'string', label: 'Margin', default: '0px' },
      'ui.css.container.backgroundColor': { type: 'color', label: 'Background', default: 'transparent' },
      'ui.css.container.borderRadius':    { type: 'string', label: 'Border Radius', default: '0px' },
    },
  },

  CONDITIONAL_WRAPPER: {
    label: 'Conditional Wrapper',
    icon: '🔀',
    category: 'layout',
    type_id: 'CONDITIONAL_WRAPPER',
    description: 'Wrapper that shows/hides children based on reward state',
    properties: {
      'ui.content.children': { type: 'array', label: 'Children', default: [] },
    },
    style: {
      'ui.css.container.padding': { type: 'string', label: 'Padding', default: '0px' },
      'ui.css.container.margin':  { type: 'string', label: 'Margin', default: '0px' },
    },
  },

  /* ── Data display ────────────────────────────────────────── */

  COUPON_CODE: {
    label: 'Coupon Code',
    icon: '🎟️',
    category: 'data',
    type_id: 'CARD_CODE',
    description: 'Coupon code display block with copy functionality',
    properties: {
      'ui.content.label':       { type: 'string', label: 'Label', default: 'Your Code' },
      'ui.content.placeholder': { type: 'string', label: 'Placeholder', default: 'COUPON CODE' },
      'ui.content.showCopy':    { type: 'boolean', label: 'Show Copy Button', default: true },
    },
    style: {
      'ui.css.container.background':   { type: 'color', label: 'Background', default: 'rgba(255,255,255,0.15)' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '8px' },
      'ui.css.container.padding':      { type: 'string', label: 'Padding', default: '12px' },
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '12px auto' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '280px' },
      'ui.css.container.border':       { type: 'string', label: 'Border', default: '1px dashed rgba(255,255,255,0.3)' },
      'ui.css.text.fontSize':          { type: 'size', label: 'Code Font Size', default: '14px', min: 10, max: 24, unit: 'px' },
      'ui.css.text.fontWeight':        { type: 'select', label: 'Code Font Weight', default: '700', options: ['400', '500', '600', '700'] },
      'ui.css.text.color':             { type: 'color', label: 'Code Color', default: '#FFFFFF' },
      'ui.css.text.letterSpacing':     { type: 'string', label: 'Letter Spacing', default: '2px' },
    },
  },

  TERMS: {
    label: 'Terms & Conditions',
    icon: '📋',
    category: 'data',
    type_id: 'REWARD_TNC',
    description: 'Terms and conditions text list',
    properties: {
      'ui.content.items': {
        type: 'array', label: 'T&C Items', required: true,
        default: ['Valid for 7 days', 'Cannot be combined with other offers'],
      },
    },
    style: {
      'ui.css.text.fontSize':   { type: 'size', label: 'Font Size', default: '11px', min: 8, max: 16, unit: 'px' },
      'ui.css.text.color':      { type: 'color', label: 'Text Color', default: 'rgba(255,255,255,0.5)' },
      'ui.css.text.marginTop':  { type: 'string', label: 'Top Margin', default: '16px' },
      'ui.css.text.textAlign':  { type: 'select', label: 'Align', default: 'center', options: ['left', 'center', 'right'] },
      'ui.css.text.lineHeight': { type: 'string', label: 'Line Height', default: '1.6' },
    },
  },

  COUNTDOWN: {
    label: 'Countdown Timer',
    icon: '⏱️',
    category: 'data',
    type_id: 'COUNTDOWN',
    description: 'Countdown timer display',
    properties: {
      'ui.content.duration':    { type: 'number', label: 'Duration (seconds)', required: true, default: 3600, min: 60, max: 86400 },
      'ui.content.format':      { type: 'select', label: 'Format', default: 'hh:mm:ss', options: ['hh:mm:ss', 'mm:ss', 'ss', 'descriptive'] },
      'ui.content.expiredText': { type: 'string', label: 'Expired Text', default: "Time's up!" },
      'ui.content.showLabels':  { type: 'boolean', label: 'Show Labels', default: true },
    },
    style: {
      'ui.css.text.fontSize':          { type: 'size', label: 'Font Size', default: '28px', min: 14, max: 64, unit: 'px' },
      'ui.css.text.fontWeight':        { type: 'select', label: 'Font Weight', default: '700', options: ['400', '500', '600', '700', '800'] },
      'ui.css.text.color':             { type: 'color', label: 'Color', default: '#FFFFFF' },
      'ui.css.text.textAlign':         { type: 'select', label: 'Align', default: 'center', options: ['left', 'center', 'right'] },
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '16px auto' },
      'ui.css.container.padding':      { type: 'string', label: 'Padding', default: '8px 16px' },
      'ui.css.container.background':   { type: 'color', label: 'Background', default: 'rgba(0,0,0,0.2)' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '8px' },
    },
  },

  EXPIRY: {
    label: 'Expiry Date',
    icon: '📅',
    category: 'data',
    type_id: 'EXPIRY',
    description: 'Reward expiry date display',
    properties: {
      'ui.content.prefix': { type: 'string', label: 'Prefix Text', default: 'Expires on' },
      'ui.content.format': { type: 'select', label: 'Date Format', default: 'MMM DD, YYYY', options: ['MMM DD, YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
    },
    style: {
      'ui.css.text.fontSize':   { type: 'size', label: 'Font Size', default: '12px', min: 8, max: 20, unit: 'px' },
      'ui.css.text.color':      { type: 'color', label: 'Text Color', default: 'rgba(255,255,255,0.6)' },
      'ui.css.text.fontWeight': { type: 'select', label: 'Font Weight', default: '400', options: ['400', '500', '600'] },
      'ui.css.text.margin':     { type: 'string', label: 'Margin', default: '8px 0' },
      'ui.css.text.textAlign':  { type: 'select', label: 'Align', default: 'center', options: ['left', 'center', 'right'] },
    },
  },

  /* ── Game Components ─────────────────────────────────────── */

  SLOT_MACHINE: {
    label: 'Slot Machine',
    icon: '🎰',
    category: 'game',
    type_id: 'SLOT_MACHINE_GAME_1',
    description: 'Slot machine game component',
    properties: {
      'ui.content.reelCount':    { type: 'number', label: 'Reel Count', default: 3, min: 2, max: 5 },
      'ui.content.spinDuration': { type: 'number', label: 'Spin Duration (s)', default: 3, min: 1, max: 10 },
      'ui.content.symbolSet':    { type: 'select', label: 'Symbol Set', default: 'fruits', options: ['fruits', 'gems', 'cards', 'emojis', 'custom'] },
      'ui.content.enableSound':  { type: 'boolean', label: 'Enable Sound', default: true },
      'ui.content.spinButtonText': { type: 'string', label: 'Spin Button Text', default: 'PULL' },
    },
    style: {
      'ui.css.container.width':        { type: 'string', label: 'Width', default: '300px' },
      'ui.css.container.height':       { type: 'string', label: 'Height', default: '200px' },
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '16px' },
      'ui.css.container.background':   { type: 'color', label: 'Background', default: '#1a1a2e' },
    },
  },

  MEMORY_GAME: {
    label: 'Memory Game',
    icon: '🧠',
    category: 'game',
    type_id: 'MEMORY_GAME_1',
    description: 'Memory card matching game component',
    properties: {
      'ui.content.gridRows':    { type: 'number', label: 'Grid Rows', default: 3, min: 2, max: 6 },
      'ui.content.gridCols':    { type: 'number', label: 'Grid Columns', default: 4, min: 2, max: 6 },
      'ui.content.timeLimit':   { type: 'number', label: 'Time Limit (s)', default: 60, min: 15, max: 300 },
      'ui.content.symbolSet':   { type: 'select', label: 'Card Symbols', default: 'emojis', options: ['emojis', 'shapes', 'animals', 'foods', 'custom'] },
      'ui.content.difficulty':  { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.cardBackImage': { type: 'image', label: 'Card Back Image', default: '' },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.card.borderRadius':      { type: 'string', label: 'Card Radius', default: '8px' },
      'ui.css.card.background':        { type: 'color', label: 'Card Back Color', default: '#6366F1' },
    },
  },

  DIRECT_REWARD: {
    label: 'Direct Reward',
    icon: '🎁',
    category: 'game',
    type_id: 'DIRECT_REWARD_1',
    description: 'Direct reward with no game mechanics',
    properties: {
      'ui.content.autoDismissTime': { type: 'number', label: 'Auto-dismiss (s)', default: 0, min: 0, max: 60 },
      'ui.content.showAnimation':   { type: 'boolean', label: 'Show Reward Animation', default: true },
      'ui.content.animationType':   { type: 'select', label: 'Animation Type', default: 'confetti', options: ['confetti', 'fireworks', 'glow', 'none'] },
    },
    style: {
      'ui.css.container.margin':   { type: 'string', label: 'Margin', default: '0 auto' },
      'ui.css.container.maxWidth': { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.container.padding':  { type: 'string', label: 'Padding', default: '24px' },
    },
  },

  REFERRAL: {
    label: 'Referral Program',
    icon: '🤝',
    category: 'game',
    type_id: 'REFERRAL_GAME_1',
    description: 'Referral sharing component',
    properties: {
      'ui.content.sharePlatforms': {
        type: 'array', label: 'Share Platforms',
        default: ['whatsapp', 'email', 'copy_link', 'sms'],
      },
      'ui.content.referralMessage':    { type: 'textarea', label: 'Referral Message', default: 'Hey! Use my referral code to get a special discount!', rows: 3 },
      'ui.content.referrerRewardText': { type: 'string', label: 'Referrer Reward Text', default: 'You get 10% off' },
      'ui.content.refereeRewardText':  { type: 'string', label: 'Referee Reward Text', default: 'Your friend gets 10% off' },
      'ui.content.shareButtonText':    { type: 'string', label: 'Share Button Text', default: 'Share & Earn' },
    },
    style: {
      'ui.css.container.margin':        { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':      { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.shareButton.background':  { type: 'color', label: 'Share Button Color', default: '#25D366' },
      'ui.css.shareButton.color':       { type: 'color', label: 'Share Button Text', default: '#FFFFFF' },
      'ui.css.shareButton.borderRadius': { type: 'string', label: 'Button Radius', default: '8px' },
    },
  },

  MULTISTEP: {
    label: 'Multi-Step Challenge',
    icon: '📊',
    category: 'game',
    type_id: 'MULTISTEP_GAME_1',
    description: 'Multi-step progressive challenge component',
    properties: {
      'ui.content.stepCount':          { type: 'number', label: 'Number of Steps', default: 3, min: 2, max: 10 },
      'ui.content.stepTypes':          { type: 'select', label: 'Step Type', default: 'action', options: ['action', 'quiz', 'purchase', 'social', 'mixed'] },
      'ui.content.completionCriteria': { type: 'select', label: 'Completion', default: 'all', options: ['all', 'any', 'minimum'] },
      'ui.content.minimumSteps':       { type: 'number', label: 'Min Steps Required', default: 2, min: 1, max: 10 },
      'ui.content.showProgress':       { type: 'boolean', label: 'Show Progress Bar', default: true },
    },
    style: {
      'ui.css.container.margin':          { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':        { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.progressBar.background':    { type: 'color', label: 'Progress Track Color', default: '#E2E8F0' },
      'ui.css.progressBar.fillColor':     { type: 'color', label: 'Progress Fill Color', default: '#6366F1' },
      'ui.css.progressBar.height':        { type: 'string', label: 'Progress Bar Height', default: '8px' },
      'ui.css.progressBar.borderRadius':  { type: 'string', label: 'Progress Bar Radius', default: '4px' },
    },
  },

  STREAK: {
    label: 'Streak / Daily Check-in',
    icon: '🔥',
    category: 'game',
    type_id: 'STREAK_GAME_1',
    description: 'Streak-based daily check-in component',
    properties: {
      'ui.content.streakLength':   { type: 'number', label: 'Streak Length (days)', default: 7, min: 2, max: 30 },
      'ui.content.gracePeriod':    { type: 'number', label: 'Grace Period (hours)', default: 0, min: 0, max: 48 },
      'ui.content.resetPolicy':    { type: 'select', label: 'Reset Policy', default: 'reset', options: ['reset', 'continue', 'penalty'] },
      'ui.content.allowSkipDays':  { type: 'boolean', label: 'Allow Skip Days', default: false },
      'ui.content.maxSkips':       { type: 'number', label: 'Max Skips Allowed', default: 1, min: 0, max: 5 },
      'ui.content.showCalendar':   { type: 'boolean', label: 'Show Calendar View', default: true },
      'ui.content.checkinButtonText': { type: 'string', label: 'Check-in Button Text', default: 'Check In' },
    },
    style: {
      'ui.css.container.margin':     { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':   { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.day.size':             { type: 'string', label: 'Day Circle Size', default: '40px' },
      'ui.css.day.activeColor':      { type: 'color', label: 'Active Day Color', default: '#F59E0B' },
      'ui.css.day.inactiveColor':    { type: 'color', label: 'Inactive Day Color', default: '#374151' },
      'ui.css.day.completedColor':   { type: 'color', label: 'Completed Day Color', default: '#10B981' },
    },
  },

  GAME_CHALLENGE: {
    label: 'Game Challenge',
    icon: '🏆',
    category: 'game',
    type_id: 'GAME_CHALLENGE_1',
    description: 'Activity-based game challenge component',
    properties: {
      'ui.content.activityCount':  { type: 'number', label: 'Activities Required', default: 5, min: 1, max: 50 },
      'ui.content.timeLimit':      { type: 'number', label: 'Time Limit (hours)', default: 24, min: 1, max: 720 },
      'ui.content.scoringType':    { type: 'select', label: 'Scoring', default: 'count', options: ['count', 'points', 'time', 'accuracy'] },
      'ui.content.targetScore':    { type: 'number', label: 'Target Score', default: 100, min: 1, max: 10000 },
      'ui.content.showLeaderboard': { type: 'boolean', label: 'Show Leaderboard', default: false },
      'ui.content.showProgress':   { type: 'boolean', label: 'Show Progress', default: true },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.progressBar.background': { type: 'color', label: 'Progress Track Color', default: '#E2E8F0' },
      'ui.css.progressBar.fillColor':  { type: 'color', label: 'Progress Fill Color', default: '#10B981' },
    },
  },

  STAMP_COLLECTION: {
    label: 'Stamp Collection',
    icon: '📬',
    category: 'game',
    type_id: 'STAMP_COLLECTION_GAME_1',
    description: 'Stamp collection / loyalty card component',
    properties: {
      'ui.content.totalStamps':     { type: 'number', label: 'Total Stamps', default: 10, min: 2, max: 30 },
      'ui.content.stampsPerActivity': { type: 'number', label: 'Stamps per Activity', default: 1, min: 1, max: 5 },
      'ui.content.expiryDays':      { type: 'number', label: 'Expiry (days)', default: 30, min: 0, max: 365 },
      'ui.content.stampImage':       { type: 'image', label: 'Stamp Image', default: '' },
      'ui.content.emptyStampImage':  { type: 'image', label: 'Empty Stamp Image', default: '' },
      'ui.content.showCount':        { type: 'boolean', label: 'Show Stamp Count', default: true },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.stamp.size':             { type: 'string', label: 'Stamp Size', default: '48px' },
      'ui.css.stamp.gap':              { type: 'string', label: 'Stamp Gap', default: '8px' },
      'ui.css.stamp.activeColor':      { type: 'color', label: 'Filled Stamp Color', default: '#F59E0B' },
      'ui.css.stamp.inactiveColor':    { type: 'color', label: 'Empty Stamp Color', default: '#374151' },
    },
  },

  ACTIVITY_SCRATCH_CARD: {
    label: 'Activity + Scratch Card',
    icon: '🎴',
    category: 'game',
    type_id: 'ACTIVITY_SCRATCH_CARD_1',
    description: 'Activity-gated scratch card component',
    properties: {
      'ui.content.activityType':   { type: 'select', label: 'Activity Type', default: 'purchase', options: ['purchase', 'visit', 'social', 'survey', 'custom'] },
      'ui.content.activityTarget': { type: 'number', label: 'Activities Required', default: 1, min: 1, max: 10 },
      'ui.content.coverColor':     { type: 'color', label: 'Cover Color', default: '#9333EA' },
      'ui.content.coverText':      { type: 'string', label: 'Cover Text', default: 'Scratch Here!' },
      'ui.content.coverImage':     { type: 'image', label: 'Cover Image', default: '' },
      'ui.content.scratchThreshold': { type: 'number', label: 'Scratch Threshold (%)', default: 50, min: 10, max: 100 },
    },
    style: {
      'ui.css.container.width':        { type: 'string', label: 'Width', default: '280px' },
      'ui.css.container.height':       { type: 'string', label: 'Height', default: '200px' },
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '16px' },
      'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
    },
  },

  FLAPPY_BIRD: {
    label: 'Flappy Bird',
    icon: '🐦',
    category: 'game',
    type_id: 'FLAPPY_BIRD_GAME_1',
    description: 'Flappy Bird mini-game component',
    properties: {
      'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
      'ui.content.targetScore':   { type: 'number', label: 'Target Score', default: 10, min: 1, max: 100 },
      'ui.content.lives':         { type: 'number', label: 'Lives', default: 1, min: 1, max: 5 },
      'ui.content.pipeGap':       { type: 'number', label: 'Pipe Gap', default: 150, min: 80, max: 300 },
      'ui.content.birdImage':     { type: 'image', label: 'Bird Image', default: '' },
      'ui.content.enableSound':   { type: 'boolean', label: 'Enable Sound', default: true },
    },
    style: {
      'ui.css.container.width':        { type: 'string', label: 'Width', default: '320px' },
      'ui.css.container.height':       { type: 'string', label: 'Height', default: '480px' },
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
      'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
      'ui.css.container.background':   { type: 'color', label: 'Sky Color', default: '#87CEEB' },
    },
  },

  WORD_SCRAMBLE: {
    label: 'Word Scramble',
    icon: '🔤',
    category: 'game',
    type_id: 'WORD_SCRAMBLE_GAME_1',
    description: 'Word scramble puzzle component',
    properties: {
      'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 45, min: 10, max: 180 },
      'ui.content.targetScore':   { type: 'number', label: 'Words to Solve', default: 3, min: 1, max: 20 },
      'ui.content.lives':         { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
      'ui.content.hintEnabled':   { type: 'boolean', label: 'Enable Hints', default: true },
      'ui.content.maxHints':      { type: 'number', label: 'Max Hints', default: 2, min: 0, max: 5 },
      'ui.content.wordList':      { type: 'textarea', label: 'Custom Word List (comma-separated)', default: '' },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.tile.background':        { type: 'color', label: 'Letter Tile Color', default: '#6366F1' },
      'ui.css.tile.color':             { type: 'color', label: 'Letter Text Color', default: '#FFFFFF' },
      'ui.css.tile.borderRadius':      { type: 'string', label: 'Tile Radius', default: '8px' },
    },
  },

  BALLOON_POP: {
    label: 'Balloon Pop',
    icon: '🎈',
    category: 'game',
    type_id: 'BALLOON_POP_GAME_1',
    description: 'Balloon pop mini-game component',
    properties: {
      'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
      'ui.content.targetScore':   { type: 'number', label: 'Balloons to Pop', default: 15, min: 5, max: 100 },
      'ui.content.lives':         { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
      'ui.content.balloonSpeed':  { type: 'select', label: 'Balloon Speed', default: 'medium', options: ['slow', 'medium', 'fast'] },
      'ui.content.enableSound':   { type: 'boolean', label: 'Enable Sound', default: true },
      'ui.content.balloonColors': { type: 'string', label: 'Balloon Colors (comma-separated hex)', default: '#EF4444,#F59E0B,#10B981,#6366F1,#EC4899' },
    },
    style: {
      'ui.css.container.width':        { type: 'string', label: 'Width', default: '320px' },
      'ui.css.container.height':       { type: 'string', label: 'Height', default: '480px' },
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
      'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
      'ui.css.container.background':   { type: 'color', label: 'Background', default: '#1E293B' },
    },
  },

  COLOR_MATCH: {
    label: 'Color Match',
    icon: '🎨',
    category: 'game',
    type_id: 'COLOR_MATCH_GAME_1',
    description: 'Color matching game component',
    properties: {
      'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
      'ui.content.targetScore':   { type: 'number', label: 'Matches to Win', default: 10, min: 3, max: 50 },
      'ui.content.lives':         { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
      'ui.content.colorCount':    { type: 'number', label: 'Number of Colors', default: 4, min: 2, max: 8 },
      'ui.content.enableSound':   { type: 'boolean', label: 'Enable Sound', default: true },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.container.padding':      { type: 'string', label: 'Padding', default: '20px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
      'ui.css.container.background':   { type: 'color', label: 'Background', default: '#1E293B' },
    },
  },

  WHACK_A_MOLE: {
    label: 'Whack-a-Mole',
    icon: '🔨',
    category: 'game',
    type_id: 'WHACK_A_MOLE_GAME_1',
    description: 'Whack-a-mole mini-game component',
    properties: {
      'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
      'ui.content.targetScore':   { type: 'number', label: 'Target Whacks', default: 15, min: 5, max: 100 },
      'ui.content.lives':         { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
      'ui.content.gridSize':      { type: 'select', label: 'Grid Size', default: '3x3', options: ['2x2', '3x3', '4x3', '4x4'] },
      'ui.content.moleSpeed':     { type: 'select', label: 'Mole Speed', default: 'medium', options: ['slow', 'medium', 'fast'] },
      'ui.content.moleImage':     { type: 'image', label: 'Mole Image', default: '' },
      'ui.content.enableSound':   { type: 'boolean', label: 'Enable Sound', default: true },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
      'ui.css.container.padding':      { type: 'string', label: 'Padding', default: '16px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
      'ui.css.container.background':   { type: 'color', label: 'Background', default: '#4ADE80' },
      'ui.css.hole.background':        { type: 'color', label: 'Hole Color', default: '#1a3a1a' },
    },
  },

  PICTURE_PUZZLE: {
    label: 'Picture Puzzle',
    icon: '🧩',
    category: 'game',
    type_id: 'PICTURE_PUZZLE_GAME_1',
    description: 'Picture sliding puzzle component',
    properties: {
      'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
      'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 60, min: 15, max: 300 },
      'ui.content.targetScore':   { type: 'number', label: 'Puzzles to Solve', default: 1, min: 1, max: 5 },
      'ui.content.lives':         { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
      'ui.content.gridSize':      { type: 'select', label: 'Grid Size', default: '3x3', options: ['2x2', '3x3', '4x4', '5x5'] },
      'ui.content.puzzleImage':   { type: 'image', label: 'Puzzle Image', default: '' },
      'ui.content.showPreview':   { type: 'boolean', label: 'Show Preview Image', default: true },
      'ui.content.enableSound':   { type: 'boolean', label: 'Enable Sound', default: true },
    },
    style: {
      'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
      'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '320px' },
      'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
      'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
      'ui.css.tile.borderColor':       { type: 'color', label: 'Tile Border Color', default: '#FFFFFF' },
      'ui.css.tile.gap':               { type: 'string', label: 'Tile Gap', default: '2px' },
    },
  },

  /* ── Background / Root ──────────────────────────────────── */

  BACKGROUND: {
    label: 'Background',
    icon: '🎨',
    category: 'root',
    type_id: 'ROOT',
    description: 'Page background and root container settings',
    properties: {},
    style: {
      'ui.css.container.backgroundColor':    { type: 'color', label: 'Background Color', default: '#7B2D8E' },
      'ui.css.container.backgroundImage':    { type: 'string', label: 'Background Image', default: '' },
      'ui.css.container.backgroundSize':     { type: 'select', label: 'Background Size', default: 'cover', options: ['cover', 'contain', 'auto', '100% 100%'] },
      'ui.css.container.backgroundPosition': { type: 'select', label: 'Background Position', default: 'center', options: ['center', 'top', 'bottom', 'left', 'right'] },
      'ui.css.container.backgroundRepeat':   { type: 'select', label: 'Background Repeat', default: 'no-repeat', options: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'] },
      'ui.css.container.padding':            { type: 'string', label: 'Padding', default: '40px 16px' },
      'ui.css.container.textAlign':          { type: 'select', label: 'Text Align', default: 'center', options: ['left', 'center', 'right'] },
      'ui.css.container.minHeight':          { type: 'string', label: 'Min Height', default: '100vh' },
    },
  },
};


/* ══════════════════════════════════════════════════════════════
   2. TYPE_ID <-> ELEMENT_TYPE mapping
   ══════════════════════════════════════════════════════════════ */

/**
 * Maps the type_id stored in byId nodes back to ELEMENT_TYPES keys.
 * Many type_ids map 1:1 (TEXT -> TEXT), but some differ
 * (REWARD_BUTTON -> BUTTON, CARD_CODE -> COUPON_CODE, etc.).
 */
const TYPE_ID_MAP = {
  TEXT:                  'TEXT',
  IMAGE:                 'IMAGE',
  REWARD_BUTTON:         'BUTTON',
  CARD_CODE:             'COUPON_CODE',
  REWARD_TNC:            'TERMS',
  REWARD_BODY:           'REWARD_BODY',
  DIVIDER:               'DIVIDER',
  CONTAINER:             'CONTAINER',
  CONDITIONAL_WRAPPER:   'CONDITIONAL_WRAPPER',
  COUNTDOWN:             'COUNTDOWN',
  EXPIRY:                'EXPIRY',
  // Game component type_ids
  SLOT_MACHINE_GAME_1:       'SLOT_MACHINE',
  MEMORY_GAME_1:             'MEMORY_GAME',
  DIRECT_REWARD_1:           'DIRECT_REWARD',
  REFERRAL_GAME_1:           'REFERRAL',
  MULTISTEP_GAME_1:          'MULTISTEP',
  STREAK_GAME_1:             'STREAK',
  GAME_CHALLENGE_1:          'GAME_CHALLENGE',
  STAMP_COLLECTION_GAME_1:   'STAMP_COLLECTION',
  ACTIVITY_SCRATCH_CARD_1:   'ACTIVITY_SCRATCH_CARD',
  FLAPPY_BIRD_GAME_1:        'FLAPPY_BIRD',
  WORD_SCRAMBLE_GAME_1:      'WORD_SCRAMBLE',
  BALLOON_POP_GAME_1:        'BALLOON_POP',
  COLOR_MATCH_GAME_1:        'COLOR_MATCH',
  WHACK_A_MOLE_GAME_1:       'WHACK_A_MOLE',
  PICTURE_PUZZLE_GAME_1:     'PICTURE_PUZZLE',
  // Root type_ids all map to BACKGROUND
  ROOT:                  'BACKGROUND',
  SCRATCH_CARD_ROOT:     'BACKGROUND',
  SPIN_WHEEL_ROOT:       'BACKGROUND',
  QUIZ_ROOT:             'BACKGROUND',
  SLOT_MACHINE_ROOT:     'BACKGROUND',
  MEMORY_GAME_ROOT:      'BACKGROUND',
  DIRECT_REWARD_ROOT:    'BACKGROUND',
  REFERRAL_ROOT:         'BACKGROUND',
  MULTISTEP_ROOT:        'BACKGROUND',
  STREAK_ROOT:           'BACKGROUND',
  GAME_CHALLENGE_ROOT:   'BACKGROUND',
  STAMP_COLLECTION_ROOT: 'BACKGROUND',
  ACTIVITY_SC_ROOT:      'BACKGROUND',
  FLAPPY_BIRD_ROOT:      'BACKGROUND',
  WORD_SCRAMBLE_ROOT:    'BACKGROUND',
  BALLOON_POP_ROOT:      'BACKGROUND',
  COLOR_MATCH_ROOT:      'BACKGROUND',
  WHACK_A_MOLE_ROOT:     'BACKGROUND',
  PICTURE_PUZZLE_ROOT:   'BACKGROUND',
  // Legacy compat: old schema used BUTTON/COUPON_CODE/TERMS as type_id directly
  BUTTON:                'BUTTON',
  COUPON_CODE:           'COUPON_CODE',
  TERMS:                 'TERMS',
};

/**
 * Map a node's type_id (e.g. 'REWARD_BUTTON') to its ELEMENT_TYPES key (e.g. 'BUTTON').
 * Returns null for unknown/game-specific type_ids.
 */
export function mapTypeIdToElementType(typeId) {
  if (!typeId) return null;
  return TYPE_ID_MAP[typeId] || null;
}


/* ══════════════════════════════════════════════════════════════
   3. GAME_SCHEMAS — per-game-type schema
   ══════════════════════════════════════════════════════════════ */

export const GAME_SCHEMAS = {

  scratchcard: {
    label: 'Scratch Card',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'SC'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'SCRATCH_CARD_GAME_1',
      nodeIdPrefix: 'SC',
      properties: {
        'ui.content.coverColor': { type: 'color', label: 'Cover Color', default: '#9333EA' },
        'ui.content.coverText':  { type: 'string', label: 'Cover Text', default: 'Scratch Here!' },
        'ui.content.coverImage': { type: 'image', label: 'Cover Image', default: '' },
      },
      style: {
        'ui.css.container.width':        { type: 'string', label: 'Width', default: '280px' },
        'ui.css.container.height':       { type: 'string', label: 'Height', default: '200px' },
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '16px' },
        'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
      },
    },
  },

  spinthewheel: {
    label: 'Spin the Wheel',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'STW_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'SPIN_THE_WHEEL_GAME_1',
      nodeIdPrefix: 'STW',
      properties: {
        'ui.content.slices': {
          type: 'array',
          label: 'Wheel Slices',
          required: true,
          default: [
            { label: '10% Off', backgroundColor: '#EF4444', textColor: '#FFFFFF' },
            { label: 'Free Shipping', backgroundColor: '#F59E0B', textColor: '#FFFFFF' },
            { label: '20% Off', backgroundColor: '#10B981', textColor: '#FFFFFF' },
            { label: 'Try Again', backgroundColor: '#6366F1', textColor: '#FFFFFF' },
            { label: '₹100 Off', backgroundColor: '#EC4899', textColor: '#FFFFFF' },
            { label: 'Mystery Gift', backgroundColor: '#8B5CF6', textColor: '#FFFFFF' },
          ],
          itemSchema: {
            label:           { type: 'string', label: 'Label', required: true },
            backgroundColor: { type: 'color', label: 'Slice Color', required: true },
            textColor:       { type: 'color', label: 'Text Color', default: '#FFFFFF' },
          },
        },
        'ui.content.spinButtonText': { type: 'string', label: 'Spin Button Text', default: 'SPIN' },
        'ui.content.pointerColor':   { type: 'color', label: 'Pointer Color', default: '#FFD700' },
      },
      style: {
        'ui.css.container.margin':   { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth': { type: 'string', label: 'Max Width', default: '320px' },
      },
    },
  },

  quiz: {
    label: 'Quiz',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'QUIZ_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'QUIZ_GAME_1',
      nodeIdPrefix: 'QUIZ',
      properties: {
        'ui.content.questions': {
          type: 'array',
          label: 'Questions',
          required: true,
          default: [
            {
              question: 'What is the capital of India?',
              options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
              answer: 'New Delhi',
              time: 15,
            },
          ],
          itemSchema: {
            question: { type: 'string', label: 'Question', required: true },
            options:  { type: 'array', label: 'Options', required: true },
            answer:   { type: 'string', label: 'Correct Answer', required: true },
            time:     { type: 'number', label: 'Time Limit (s)', default: 15, min: 5, max: 120 },
          },
        },
        'ui.content.showTimer':        { type: 'boolean', label: 'Show Timer', default: true },
        'ui.content.defaultTimeLimit': { type: 'number', label: 'Default Time Limit (s)', default: 15, min: 5, max: 120 },
      },
      style: {
        'ui.css.container.margin':          { type: 'string', label: 'Margin', default: '0 auto' },
        'ui.css.container.maxWidth':        { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.questionCard.background':   { type: 'color', label: 'Card Background', default: '#374151' },
        'ui.css.questionCard.borderRadius': { type: 'string', label: 'Card Radius', default: '12px' },
        'ui.css.questionCard.padding':      { type: 'string', label: 'Card Padding', default: '20px' },
        'ui.css.optionButton.background':   { type: 'color', label: 'Option Background', default: '#4B5563' },
        'ui.css.optionButton.color':        { type: 'color', label: 'Option Text Color', default: '#FFFFFF' },
        'ui.css.optionButton.borderRadius': { type: 'string', label: 'Option Radius', default: '8px' },
        'ui.css.optionButton.padding':      { type: 'string', label: 'Option Padding', default: '12px' },
      },
    },
  },

  slotmachine: {
    label: 'Slot Machine',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'SLOT_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'SLOT_MACHINE_GAME_1',
      nodeIdPrefix: 'SLOT',
      properties: {
        'ui.content.reelCount':      { type: 'number', label: 'Reel Count', default: 3, min: 2, max: 5 },
        'ui.content.spinDuration':   { type: 'number', label: 'Spin Duration (s)', default: 3, min: 1, max: 10 },
        'ui.content.symbolSet':      { type: 'select', label: 'Symbol Set', default: 'fruits', options: ['fruits', 'gems', 'cards', 'emojis', 'custom'] },
        'ui.content.enableSound':    { type: 'boolean', label: 'Enable Sound', default: true },
        'ui.content.spinButtonText': { type: 'string', label: 'Spin Button Text', default: 'PULL' },
      },
      style: {
        'ui.css.container.width':        { type: 'string', label: 'Width', default: '300px' },
        'ui.css.container.height':       { type: 'string', label: 'Height', default: '200px' },
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '16px' },
        'ui.css.container.background':   { type: 'color', label: 'Background', default: '#1a1a2e' },
      },
    },
  },

  memorygame: {
    label: 'Memory Game',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'MEM_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'MEMORY_GAME_1',
      nodeIdPrefix: 'MEM',
      properties: {
        'ui.content.gridRows':      { type: 'number', label: 'Grid Rows', default: 3, min: 2, max: 6 },
        'ui.content.gridCols':      { type: 'number', label: 'Grid Columns', default: 4, min: 2, max: 6 },
        'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 60, min: 15, max: 300 },
        'ui.content.symbolSet':     { type: 'select', label: 'Card Symbols', default: 'emojis', options: ['emojis', 'shapes', 'animals', 'foods', 'custom'] },
        'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.cardBackImage': { type: 'image', label: 'Card Back Image', default: '' },
      },
      style: {
        'ui.css.container.margin':   { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth': { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.card.borderRadius':  { type: 'string', label: 'Card Radius', default: '8px' },
        'ui.css.card.background':    { type: 'color', label: 'Card Back Color', default: '#6366F1' },
      },
    },
  },

  direct: {
    label: 'Direct Reward',
    screens: {
      game: {
        label: 'Reward Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'DIRECT_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Details',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'DIRECT_REWARD_1',
      nodeIdPrefix: 'DIRECT',
      properties: {
        'ui.content.autoDismissTime': { type: 'number', label: 'Auto-dismiss (s)', default: 0, min: 0, max: 60 },
        'ui.content.showAnimation':   { type: 'boolean', label: 'Show Reward Animation', default: true },
        'ui.content.animationType':   { type: 'select', label: 'Animation Type', default: 'confetti', options: ['confetti', 'fireworks', 'glow', 'none'] },
      },
      style: {
        'ui.css.container.margin':   { type: 'string', label: 'Margin', default: '0 auto' },
        'ui.css.container.maxWidth': { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.container.padding':  { type: 'string', label: 'Padding', default: '24px' },
      },
    },
  },

  referral: {
    label: 'Referral Program',
    screens: {
      game: {
        label: 'Referral Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'REF_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY'],
      },
    },
    gameComponent: {
      type_id: 'REFERRAL_GAME_1',
      nodeIdPrefix: 'REF',
      properties: {
        'ui.content.sharePlatforms': {
          type: 'array', label: 'Share Platforms',
          default: ['whatsapp', 'email', 'copy_link', 'sms'],
        },
        'ui.content.referralMessage':    { type: 'textarea', label: 'Referral Message', default: 'Hey! Use my referral code to get a special discount!', rows: 3 },
        'ui.content.referrerRewardText': { type: 'string', label: 'Referrer Reward Text', default: 'You get 10% off' },
        'ui.content.refereeRewardText':  { type: 'string', label: 'Referee Reward Text', default: 'Your friend gets 10% off' },
        'ui.content.shareButtonText':    { type: 'string', label: 'Share Button Text', default: 'Share & Earn' },
      },
      style: {
        'ui.css.container.margin':         { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':       { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.shareButton.background':   { type: 'color', label: 'Share Button Color', default: '#25D366' },
        'ui.css.shareButton.color':        { type: 'color', label: 'Share Button Text', default: '#FFFFFF' },
        'ui.css.shareButton.borderRadius': { type: 'string', label: 'Button Radius', default: '8px' },
      },
    },
  },

  multistep: {
    label: 'Multi-Step Challenge',
    screens: {
      game: {
        label: 'Challenge Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'MSTEP_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'MULTISTEP_GAME_1',
      nodeIdPrefix: 'MSTEP',
      properties: {
        'ui.content.stepCount':          { type: 'number', label: 'Number of Steps', default: 3, min: 2, max: 10 },
        'ui.content.stepTypes':          { type: 'select', label: 'Step Type', default: 'action', options: ['action', 'quiz', 'purchase', 'social', 'mixed'] },
        'ui.content.completionCriteria': { type: 'select', label: 'Completion', default: 'all', options: ['all', 'any', 'minimum'] },
        'ui.content.minimumSteps':       { type: 'number', label: 'Min Steps Required', default: 2, min: 1, max: 10 },
        'ui.content.showProgress':       { type: 'boolean', label: 'Show Progress Bar', default: true },
      },
      style: {
        'ui.css.container.margin':         { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':       { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.progressBar.background':   { type: 'color', label: 'Progress Track Color', default: '#E2E8F0' },
        'ui.css.progressBar.fillColor':    { type: 'color', label: 'Progress Fill Color', default: '#6366F1' },
        'ui.css.progressBar.height':       { type: 'string', label: 'Progress Bar Height', default: '8px' },
        'ui.css.progressBar.borderRadius': { type: 'string', label: 'Progress Bar Radius', default: '4px' },
      },
    },
  },

  streak: {
    label: 'Streak / Daily Check-in',
    screens: {
      game: {
        label: 'Streak Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'STREAK_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY'],
      },
    },
    gameComponent: {
      type_id: 'STREAK_GAME_1',
      nodeIdPrefix: 'STREAK',
      properties: {
        'ui.content.streakLength':      { type: 'number', label: 'Streak Length (days)', default: 7, min: 2, max: 30 },
        'ui.content.gracePeriod':       { type: 'number', label: 'Grace Period (hours)', default: 0, min: 0, max: 48 },
        'ui.content.resetPolicy':       { type: 'select', label: 'Reset Policy', default: 'reset', options: ['reset', 'continue', 'penalty'] },
        'ui.content.allowSkipDays':     { type: 'boolean', label: 'Allow Skip Days', default: false },
        'ui.content.maxSkips':          { type: 'number', label: 'Max Skips Allowed', default: 1, min: 0, max: 5 },
        'ui.content.showCalendar':      { type: 'boolean', label: 'Show Calendar View', default: true },
        'ui.content.checkinButtonText': { type: 'string', label: 'Check-in Button Text', default: 'Check In' },
      },
      style: {
        'ui.css.container.margin':    { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':  { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.day.size':            { type: 'string', label: 'Day Circle Size', default: '40px' },
        'ui.css.day.activeColor':     { type: 'color', label: 'Active Day Color', default: '#F59E0B' },
        'ui.css.day.inactiveColor':   { type: 'color', label: 'Inactive Day Color', default: '#374151' },
        'ui.css.day.completedColor':  { type: 'color', label: 'Completed Day Color', default: '#10B981' },
      },
    },
  },

  gamechallenge: {
    label: 'Game Challenge',
    screens: {
      game: {
        label: 'Challenge Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'GCHAL_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'GAME_CHALLENGE_1',
      nodeIdPrefix: 'GCHAL',
      properties: {
        'ui.content.activityCount':    { type: 'number', label: 'Activities Required', default: 5, min: 1, max: 50 },
        'ui.content.timeLimit':        { type: 'number', label: 'Time Limit (hours)', default: 24, min: 1, max: 720 },
        'ui.content.scoringType':      { type: 'select', label: 'Scoring', default: 'count', options: ['count', 'points', 'time', 'accuracy'] },
        'ui.content.targetScore':      { type: 'number', label: 'Target Score', default: 100, min: 1, max: 10000 },
        'ui.content.showLeaderboard':  { type: 'boolean', label: 'Show Leaderboard', default: false },
        'ui.content.showProgress':     { type: 'boolean', label: 'Show Progress', default: true },
      },
      style: {
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.progressBar.background': { type: 'color', label: 'Progress Track Color', default: '#E2E8F0' },
        'ui.css.progressBar.fillColor':  { type: 'color', label: 'Progress Fill Color', default: '#10B981' },
      },
    },
  },

  collectthestamps: {
    label: 'Stamp Collection',
    screens: {
      game: {
        label: 'Stamp Card Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'STAMP_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY'],
      },
    },
    gameComponent: {
      type_id: 'STAMP_COLLECTION_GAME_1',
      nodeIdPrefix: 'STAMP',
      properties: {
        'ui.content.totalStamps':       { type: 'number', label: 'Total Stamps', default: 10, min: 2, max: 30 },
        'ui.content.stampsPerActivity': { type: 'number', label: 'Stamps per Activity', default: 1, min: 1, max: 5 },
        'ui.content.expiryDays':        { type: 'number', label: 'Expiry (days)', default: 30, min: 0, max: 365 },
        'ui.content.stampImage':        { type: 'image', label: 'Stamp Image', default: '' },
        'ui.content.emptyStampImage':   { type: 'image', label: 'Empty Stamp Image', default: '' },
        'ui.content.showCount':         { type: 'boolean', label: 'Show Stamp Count', default: true },
      },
      style: {
        'ui.css.container.margin':    { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':  { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.stamp.size':          { type: 'string', label: 'Stamp Size', default: '48px' },
        'ui.css.stamp.gap':           { type: 'string', label: 'Stamp Gap', default: '8px' },
        'ui.css.stamp.activeColor':   { type: 'color', label: 'Filled Stamp Color', default: '#F59E0B' },
        'ui.css.stamp.inactiveColor': { type: 'color', label: 'Empty Stamp Color', default: '#374151' },
      },
    },
  },

  'activity-scratchcard': {
    label: 'Activity + Scratch Card',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'ASC_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'ACTIVITY_SCRATCH_CARD_1',
      nodeIdPrefix: 'ASC',
      properties: {
        'ui.content.activityType':     { type: 'select', label: 'Activity Type', default: 'purchase', options: ['purchase', 'visit', 'social', 'survey', 'custom'] },
        'ui.content.activityTarget':   { type: 'number', label: 'Activities Required', default: 1, min: 1, max: 10 },
        'ui.content.coverColor':       { type: 'color', label: 'Cover Color', default: '#9333EA' },
        'ui.content.coverText':        { type: 'string', label: 'Cover Text', default: 'Scratch Here!' },
        'ui.content.coverImage':       { type: 'image', label: 'Cover Image', default: '' },
        'ui.content.scratchThreshold': { type: 'number', label: 'Scratch Threshold (%)', default: 50, min: 10, max: 100 },
      },
      style: {
        'ui.css.container.width':        { type: 'string', label: 'Width', default: '280px' },
        'ui.css.container.height':       { type: 'string', label: 'Height', default: '200px' },
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '16px' },
        'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
      },
    },
  },

  'flappy-bird': {
    label: 'Flappy Bird',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'FLAP_1'],
        optionalElements: ['TEXT_2', 'IMG_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'FLAPPY_BIRD_GAME_1',
      nodeIdPrefix: 'FLAP',
      properties: {
        'ui.content.difficulty':  { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.timeLimit':   { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
        'ui.content.targetScore': { type: 'number', label: 'Target Score', default: 10, min: 1, max: 100 },
        'ui.content.lives':       { type: 'number', label: 'Lives', default: 1, min: 1, max: 5 },
        'ui.content.pipeGap':     { type: 'number', label: 'Pipe Gap', default: 150, min: 80, max: 300 },
        'ui.content.birdImage':   { type: 'image', label: 'Bird Image', default: '' },
        'ui.content.enableSound': { type: 'boolean', label: 'Enable Sound', default: true },
      },
      style: {
        'ui.css.container.width':        { type: 'string', label: 'Width', default: '320px' },
        'ui.css.container.height':       { type: 'string', label: 'Height', default: '480px' },
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
        'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
        'ui.css.container.background':   { type: 'color', label: 'Sky Color', default: '#87CEEB' },
      },
    },
  },

  'word-scramble': {
    label: 'Word Scramble',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'WSCR_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'WORD_SCRAMBLE_GAME_1',
      nodeIdPrefix: 'WSCR',
      properties: {
        'ui.content.difficulty':  { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.timeLimit':   { type: 'number', label: 'Time Limit (s)', default: 45, min: 10, max: 180 },
        'ui.content.targetScore': { type: 'number', label: 'Words to Solve', default: 3, min: 1, max: 20 },
        'ui.content.lives':       { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
        'ui.content.hintEnabled': { type: 'boolean', label: 'Enable Hints', default: true },
        'ui.content.maxHints':    { type: 'number', label: 'Max Hints', default: 2, min: 0, max: 5 },
        'ui.content.wordList':    { type: 'textarea', label: 'Custom Word List (comma-separated)', default: '' },
      },
      style: {
        'ui.css.container.margin':   { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth': { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.tile.background':    { type: 'color', label: 'Letter Tile Color', default: '#6366F1' },
        'ui.css.tile.color':         { type: 'color', label: 'Letter Text Color', default: '#FFFFFF' },
        'ui.css.tile.borderRadius':  { type: 'string', label: 'Tile Radius', default: '8px' },
      },
    },
  },

  'balloon-pop': {
    label: 'Balloon Pop',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'BPOP_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'BALLOON_POP_GAME_1',
      nodeIdPrefix: 'BPOP',
      properties: {
        'ui.content.difficulty':    { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.timeLimit':     { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
        'ui.content.targetScore':   { type: 'number', label: 'Balloons to Pop', default: 15, min: 5, max: 100 },
        'ui.content.lives':         { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
        'ui.content.balloonSpeed':  { type: 'select', label: 'Balloon Speed', default: 'medium', options: ['slow', 'medium', 'fast'] },
        'ui.content.enableSound':   { type: 'boolean', label: 'Enable Sound', default: true },
        'ui.content.balloonColors': { type: 'string', label: 'Balloon Colors (comma-separated hex)', default: '#EF4444,#F59E0B,#10B981,#6366F1,#EC4899' },
      },
      style: {
        'ui.css.container.width':        { type: 'string', label: 'Width', default: '320px' },
        'ui.css.container.height':       { type: 'string', label: 'Height', default: '480px' },
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
        'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
        'ui.css.container.background':   { type: 'color', label: 'Background', default: '#1E293B' },
      },
    },
  },

  'color-match': {
    label: 'Color Match',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'CMATCH_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'COLOR_MATCH_GAME_1',
      nodeIdPrefix: 'CMATCH',
      properties: {
        'ui.content.difficulty':  { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.timeLimit':   { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
        'ui.content.targetScore': { type: 'number', label: 'Matches to Win', default: 10, min: 3, max: 50 },
        'ui.content.lives':       { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
        'ui.content.colorCount':  { type: 'number', label: 'Number of Colors', default: 4, min: 2, max: 8 },
        'ui.content.enableSound': { type: 'boolean', label: 'Enable Sound', default: true },
      },
      style: {
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.container.padding':      { type: 'string', label: 'Padding', default: '20px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
        'ui.css.container.background':   { type: 'color', label: 'Background', default: '#1E293B' },
      },
    },
  },

  'whack-a-mole': {
    label: 'Whack-a-Mole',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'WAM_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'WHACK_A_MOLE_GAME_1',
      nodeIdPrefix: 'WAM',
      properties: {
        'ui.content.difficulty':  { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.timeLimit':   { type: 'number', label: 'Time Limit (s)', default: 30, min: 10, max: 120 },
        'ui.content.targetScore': { type: 'number', label: 'Target Whacks', default: 15, min: 5, max: 100 },
        'ui.content.lives':       { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
        'ui.content.gridSize':    { type: 'select', label: 'Grid Size', default: '3x3', options: ['2x2', '3x3', '4x3', '4x4'] },
        'ui.content.moleSpeed':   { type: 'select', label: 'Mole Speed', default: 'medium', options: ['slow', 'medium', 'fast'] },
        'ui.content.moleImage':   { type: 'image', label: 'Mole Image', default: '' },
        'ui.content.enableSound': { type: 'boolean', label: 'Enable Sound', default: true },
      },
      style: {
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '340px' },
        'ui.css.container.padding':      { type: 'string', label: 'Padding', default: '16px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
        'ui.css.container.background':   { type: 'color', label: 'Background', default: '#4ADE80' },
        'ui.css.hole.background':        { type: 'color', label: 'Hole Color', default: '#1a3a1a' },
      },
    },
  },

  'picture-puzzle': {
    label: 'Picture Puzzle',
    screens: {
      game: {
        label: 'Game Screen',
        requiredElements: ['ROOT', 'TEXT_1', 'PPUZ_1'],
        optionalElements: ['TEXT_2', 'IMG_1', 'TIMER_1'],
      },
      reward: {
        label: 'Reward Screen',
        requiredElements: ['REWARD_BODY', 'CTA'],
        optionalElements: ['CC', 'TNC', 'EXPIRY', 'COUNTDOWN'],
      },
    },
    gameComponent: {
      type_id: 'PICTURE_PUZZLE_GAME_1',
      nodeIdPrefix: 'PPUZ',
      properties: {
        'ui.content.difficulty':  { type: 'select', label: 'Difficulty', default: 'medium', options: ['easy', 'medium', 'hard'] },
        'ui.content.timeLimit':   { type: 'number', label: 'Time Limit (s)', default: 60, min: 15, max: 300 },
        'ui.content.targetScore': { type: 'number', label: 'Puzzles to Solve', default: 1, min: 1, max: 5 },
        'ui.content.lives':       { type: 'number', label: 'Lives', default: 3, min: 1, max: 5 },
        'ui.content.gridSize':    { type: 'select', label: 'Grid Size', default: '3x3', options: ['2x2', '3x3', '4x4', '5x5'] },
        'ui.content.puzzleImage': { type: 'image', label: 'Puzzle Image', default: '' },
        'ui.content.showPreview': { type: 'boolean', label: 'Show Preview Image', default: true },
        'ui.content.enableSound': { type: 'boolean', label: 'Enable Sound', default: true },
      },
      style: {
        'ui.css.container.margin':       { type: 'string', label: 'Margin', default: '0 auto 24px' },
        'ui.css.container.maxWidth':     { type: 'string', label: 'Max Width', default: '320px' },
        'ui.css.container.borderRadius': { type: 'string', label: 'Border Radius', default: '12px' },
        'ui.css.container.overflow':     { type: 'string', label: 'Overflow', default: 'hidden' },
        'ui.css.tile.borderColor':       { type: 'color', label: 'Tile Border Color', default: '#FFFFFF' },
        'ui.css.tile.gap':               { type: 'string', label: 'Tile Gap', default: '2px' },
      },
    },
  },
};


/* ══════════════════════════════════════════════════════════════
   4. ADDABLE_ELEMENTS — elements shown in "Add Element" UI
   ══════════════════════════════════════════════════════════════ */

export const ADDABLE_ELEMENTS = [
  { type: 'TEXT',        label: 'Text Block',         icon: '📝',  description: 'Add editable text' },
  { type: 'IMAGE',       label: 'Image / GIF',        icon: '🖼️', description: 'Upload or paste image URL' },
  { type: 'BUTTON',      label: 'Button',             icon: '👆',  description: 'CTA button with link' },
  { type: 'DIVIDER',     label: 'Divider / Spacer',   icon: '➖',  description: 'Horizontal separator' },
  { type: 'COUPON_CODE', label: 'Coupon Code',        icon: '🎟️', description: 'Coupon display block' },
  { type: 'TERMS',       label: 'Terms & Conditions', icon: '📋',  description: 'T&C text list' },
  { type: 'COUNTDOWN',   label: 'Countdown Timer',    icon: '⏱️',  description: 'Countdown timer display' },
  { type: 'EXPIRY',      label: 'Expiry Date',        icon: '📅',  description: 'Reward expiry date' },
  { type: 'CONTAINER',   label: 'Container',          icon: '📦',  description: 'Group elements together' },
];


/* ══════════════════════════════════════════════════════════════
   5. CATEGORY_LABELS — display names for categories
   ══════════════════════════════════════════════════════════════ */

export const CATEGORY_LABELS = {
  content:     'Content',
  media:       'Media',
  interactive: 'Interactive',
  layout:      'Layout',
  data:        'Data Display',
  game:        'Game Components',
  root:        'Background',
};


/* ══════════════════════════════════════════════════════════════
   6. ID generation
   ══════════════════════════════════════════════════════════════ */

const ID_PREFIX_MAP = {
  TEXT:                'TEXT',
  IMAGE:              'IMG',
  BUTTON:             'CTA',
  DIVIDER:            'DIV',
  COUPON_CODE:        'CC',
  TERMS:              'TNC',
  REWARD_BODY:        'REWARD_BODY',
  COUNTDOWN:          'TIMER',
  EXPIRY:             'EXPIRY',
  CONTAINER:          'CONT',
  CONDITIONAL_WRAPPER: 'CONDITIONAL',
  BACKGROUND:         'ROOT',
};

/**
 * Generate a unique node ID like 'TEXT_3', 'IMG_2', 'CTA_1'.
 * Uses an internal counter per prefix. Pass existingIds (array or object-keys)
 * to avoid collisions with nodes already in byId.
 *
 * @param {string} elementType — key from ELEMENT_TYPES (e.g. 'TEXT', 'BUTTON')
 * @param {Object|string[]} [existingIds] — existing byId map or array of IDs
 * @returns {string}
 */
export function generateNodeId(elementType, existingIds) {
  const prefix = ID_PREFIX_MAP[elementType] || elementType;
  const existingSet = new Set(
    existingIds
      ? (Array.isArray(existingIds) ? existingIds : Object.keys(existingIds))
      : []
  );

  if (!_idCounters[prefix]) {
    _idCounters[prefix] = 0;
  }

  let id;
  do {
    _idCounters[prefix]++;
    id = `${prefix}_${_idCounters[prefix]}`;
  } while (existingSet.has(id));

  return id;
}

/**
 * Reset ID counters. Call when loading a new fragmentMap so counters sync
 * with the existing node IDs and avoid collisions.
 *
 * @param {Object} [byId] — the current byId map
 */
export function resetIdCounters(byId) {
  _idCounters = {};
  if (!byId) return;

  for (const nodeId of Object.keys(byId)) {
    const match = nodeId.match(/^(.+)_(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      if (!_idCounters[prefix] || _idCounters[prefix] < num) {
        _idCounters[prefix] = num;
      }
    }
  }
}


/* ══════════════════════════════════════════════════════════════
   7. createDefaultNode — node factory
   ══════════════════════════════════════════════════════════════ */

/**
 * Create a new node from an ELEMENT_TYPES key, populated with schema defaults.
 * Returns { id, type_id, ui: { content: {...}, css: {...} } }.
 *
 * Supports two override formats for backward compatibility:
 *
 *   Dot-path format (new):
 *     createDefaultNode('TEXT', { 'ui.content.text': 'Hello' })
 *
 *   Structured format (legacy):
 *     createDefaultNode('TEXT', { content: { text: 'Hello' }, css: { text: { color: '#000' } } })
 *
 * @param {string} elementType — key from ELEMENT_TYPES (e.g. 'TEXT', 'BUTTON')
 * @param {Object} [overrides] — optional overrides (dot-path keys or { content, css })
 * @param {Object|string[]} [existingIds] — existing byId map or array of IDs
 * @returns {{ id: string, type_id: string, ui: Object } | null}
 */
export function createDefaultNode(elementType, overrides, existingIds) {
  const schema = ELEMENT_TYPES[elementType];
  if (!schema) {
    // Throw for backward compat — layoutState.js catches this
    throw new Error(
      `Unknown element type: "${elementType}". Valid types: ${Object.keys(ELEMENT_TYPES).join(', ')}`
    );
  }

  const id = generateNodeId(elementType, existingIds);
  const node = {
    type_id: schema.type_id || elementType,
    ui: { content: {}, css: {} },
  };

  // Fill defaults from schema properties
  for (const [path, def] of Object.entries(schema.properties)) {
    const val = def.default;
    setNestedValue(
      node,
      path,
      typeof val === 'object' && val !== null ? JSON.parse(JSON.stringify(val)) : val
    );
  }

  // Fill defaults from schema style
  for (const [path, def] of Object.entries(schema.style)) {
    setNestedValue(node, path, def.default);
  }

  // Apply overrides
  if (overrides && typeof overrides === 'object') {
    // Detect legacy format: { content: {...}, css: {...} }
    const isLegacy =
      (overrides.content && typeof overrides.content === 'object') ||
      (overrides.css && typeof overrides.css === 'object');

    if (isLegacy) {
      // Legacy structured overrides
      if (overrides.content) {
        for (const [key, val] of Object.entries(overrides.content)) {
          setNestedValue(node, `ui.content.${key}`, val);
        }
      }
      if (overrides.css) {
        for (const [section, props] of Object.entries(overrides.css)) {
          if (typeof props === 'object' && props !== null) {
            for (const [prop, val] of Object.entries(props)) {
              setNestedValue(node, `ui.css.${section}.${prop}`, val);
            }
          }
        }
      }
    } else {
      // Dot-path overrides
      for (const [path, val] of Object.entries(overrides)) {
        if (path === 'content' || path === 'css') continue; // skip accidental bare keys
        setNestedValue(node, path, val);
      }
    }
  }

  return { id, ...node };
}


/* ══════════════════════════════════════════════════════════════
   8. validateNode — schema-based validation
   ══════════════════════════════════════════════════════════════ */

/**
 * Validate a node against its element type schema.
 *
 * Supports two call signatures for backward compatibility:
 *   validateNode(nodeData)                — legacy (returns { valid, errors: string[] })
 *   validateNode(nodeId, nodeData)        — new    (returns { valid, errors: Array<{nodeId, path, message}> })
 *
 * Unknown type_ids pass validation (they may be game-specific components).
 */
export function validateNode(nodeIdOrData, maybeNodeData) {
  let nodeId, nodeData;

  // Detect call signature
  if (maybeNodeData !== undefined) {
    // New signature: validateNode(nodeId, nodeData)
    nodeId = nodeIdOrData;
    nodeData = maybeNodeData;
  } else {
    // Legacy signature: validateNode(nodeData)
    nodeData = nodeIdOrData;
    nodeId = null;
  }

  if (!nodeData) {
    const msg = 'Node is null or undefined';
    return nodeId !== null
      ? { valid: false, errors: [{ nodeId, path: 'type_id', message: msg }] }
      : { valid: false, errors: [msg] };
  }

  if (!nodeData.type_id) {
    const msg = 'Missing type_id';
    return nodeId !== null
      ? { valid: false, errors: [{ nodeId, path: 'type_id', message: msg }] }
      : { valid: false, errors: [msg] };
  }

  const elementType = mapTypeIdToElementType(nodeData.type_id);
  const schema = ELEMENT_TYPES[elementType];

  // Unknown type — pass validation (game-specific components, etc.)
  if (!schema) return { valid: true, errors: [] };

  const errors = [];

  for (const [path, def] of Object.entries(schema.properties)) {
    const value = getNestedValue(nodeData, path);

    // Required check
    if (def.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        const msg = `${def.label} is required`;
        errors.push(nodeId !== null ? { nodeId, path, message: msg } : msg);
      }
    }

    // Type-specific validation (only if value is present)
    if (value !== undefined && value !== null && value !== '') {
      if (def.type === 'number' && typeof value === 'number') {
        if (def.min !== undefined && value < def.min) {
          const msg = `${def.label} must be at least ${def.min}`;
          errors.push(nodeId !== null ? { nodeId, path, message: msg } : msg);
        }
        if (def.max !== undefined && value > def.max) {
          const msg = `${def.label} must be at most ${def.max}`;
          errors.push(nodeId !== null ? { nodeId, path, message: msg } : msg);
        }
      }

      if (def.type === 'select' && def.options && !def.options.includes(String(value))) {
        const msg = `${def.label} must be one of: ${def.options.join(', ')}`;
        errors.push(nodeId !== null ? { nodeId, path, message: msg } : msg);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}


/* ══════════════════════════════════════════════════════════════
   9. validateLayout — validate all nodes in a byId map
   ══════════════════════════════════════════════════════════════ */

/**
 * Validates every node in a byId map. Returns aggregate results.
 *
 * @param {Object} byId — the full byId node map
 * @returns {{ valid: boolean, errors: Array<{ nodeId: string, path: string, message: string }> }}
 */
export function validateLayout(byId) {
  if (!byId) return { valid: true, errors: [] };

  const allErrors = [];
  for (const [nodeId, nodeData] of Object.entries(byId)) {
    const result = validateNode(nodeId, nodeData);
    allErrors.push(...result.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}


/* ══════════════════════════════════════════════════════════════
   10. getEditableProperties — for NodeEditorPanel
   ══════════════════════════════════════════════════════════════ */

/**
 * Returns the property and style definitions for a node based on its type_id.
 * This is what the NodeEditorPanel uses to render typed controls instead of
 * generic text fields.
 *
 * For game components (SCRATCH_CARD_GAME_1, SPIN_THE_WHEEL_GAME_1, QUIZ_GAME_1),
 * returns from GAME_SCHEMAS.
 *
 * @param {Object} nodeData — the node data from byId[nodeId]
 * @returns {{ properties: Object, style: Object, label: string, icon: string }}
 */
export function getEditableProperties(nodeData) {
  if (!nodeData || !nodeData.type_id) {
    return { properties: {}, style: {}, label: 'Unknown', icon: '?' };
  }

  // Check game component schemas first
  for (const gameSchema of Object.values(GAME_SCHEMAS)) {
    if (gameSchema.gameComponent.type_id === nodeData.type_id) {
      return {
        properties: gameSchema.gameComponent.properties,
        style: gameSchema.gameComponent.style || {},
        label: gameSchema.label,
        icon: '🎮',
      };
    }
  }

  // Check standard element types
  const elementType = mapTypeIdToElementType(nodeData.type_id);
  const schema = ELEMENT_TYPES[elementType];

  if (!schema) {
    return { properties: {}, style: {}, label: nodeData.type_id, icon: '?' };
  }

  return {
    properties: schema.properties,
    style: schema.style,
    label: schema.label,
    icon: schema.icon,
  };
}


/* ══════════════════════════════════════════════════════════════
   11. getAddableByCategory — grouped for UI display
   ══════════════════════════════════════════════════════════════ */

/**
 * Returns ADDABLE_ELEMENTS grouped by category for rendering in the UI.
 *
 * @returns {Object.<string, Array>} — e.g. { content: [...], media: [...] }
 */
export function getAddableByCategory() {
  const groups = {};
  for (const item of ADDABLE_ELEMENTS) {
    const schema = ELEMENT_TYPES[item.type];
    const category = schema?.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
  }
  return groups;
}


/* ══════════════════════════════════════════════════════════════
   12. Legacy compat: ELEMENT_SCHEMAS (flat schema registry)
   ══════════════════════════════════════════════════════════════ */

/**
 * ELEMENT_SCHEMAS provides backward compatibility for any code that imported
 * the old { [type_id]: { type_id, defaultContent, defaultCss, validate } } shape.
 * Built dynamically from ELEMENT_TYPES.
 */
function _buildLegacySchemas() {
  const schemas = {};
  for (const [key, schema] of Object.entries(ELEMENT_TYPES)) {
    const typeId = schema.type_id || key;

    // Build defaultContent from properties
    const defaultContent = {};
    for (const [path, def] of Object.entries(schema.properties)) {
      // path is like 'ui.content.text' — extract the last segment
      const parts = path.split('.');
      if (parts[0] === 'ui' && parts[1] === 'content' && parts.length === 3) {
        const val = def.default;
        defaultContent[parts[2]] =
          typeof val === 'object' && val !== null ? JSON.parse(JSON.stringify(val)) : val;
      }
    }

    // Build defaultCss from style
    const defaultCss = {};
    for (const [path, def] of Object.entries(schema.style)) {
      const parts = path.split('.');
      if (parts[0] === 'ui' && parts[1] === 'css' && parts.length === 4) {
        const section = parts[2];
        const prop = parts[3];
        if (!defaultCss[section]) defaultCss[section] = {};
        defaultCss[section][prop] = def.default;
      }
    }

    schemas[key] = {
      type_id: typeId,
      defaultContent,
      defaultCss,
      validate(node) {
        const result = validateNode(node);
        return result;
      },
    };

    // Also register under the type_id if different from key
    if (typeId !== key && !schemas[typeId]) {
      schemas[typeId] = schemas[key];
    }
  }
  return schemas;
}

export const ELEMENT_SCHEMAS = _buildLegacySchemas();
