/**
 * layoutState.js — Single source of truth for the CustomerGlu layout editor.
 *
 * This module owns ALL layout state. No other file should hold fragmentMap,
 * byId, selection, or history data. Every mutation flows through layoutReducer.
 *
 * Node shape (from fragmentMap.fragments.reward.game.byId):
 *   {
 *     type_id: string,
 *     ui: {
 *       content: { text?, children?: string[], ...game-specific },
 *       css: { container?: {...}, text?: {...}, button?: {...} }
 *     }
 *   }
 */

import { validateNode, createDefaultNode, ELEMENT_TYPES } from './elementSchema';

/* ── Helpers ─────────────────────────────────────────────────── */

function deepClone(obj) {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Immutably set a value at a nested path inside an object.
 * Creates intermediate objects as needed. Never mutates the original.
 *
 *   setIn({ a: { b: 1 } }, ['a', 'b'], 2)  =>  { a: { b: 2 } }
 *   setIn({}, ['x', 'y'], 3)                =>  { x: { y: 3 } }
 */
function setIn(obj, path, value) {
  if (!path || path.length === 0) return value;
  const [head, ...rest] = path;
  const child = obj && typeof obj === 'object' ? obj[head] : undefined;
  return {
    ...(obj || {}),
    [head]: rest.length === 0 ? value : setIn(child, rest, value),
  };
}

/**
 * Extract fragments.reward.game from a fragmentMap,
 * handling both { fragments: { reward: ... } } and { reward: ... } shapes.
 */
function extractGame(fragmentMap) {
  if (!fragmentMap) return null;
  const frags = fragmentMap.fragments || fragmentMap;
  return frags?.reward?.game || null;
}

/**
 * Extract the rootId from a fragmentMap.
 */
function extractRootId(fragmentMap) {
  const game = extractGame(fragmentMap);
  return game?.rootId || 'ROOT';
}

/**
 * Collect a node and all its descendants (BFS). Returns a Set of ids.
 */
function collectSubtree(nodeId, byId) {
  const ids = new Set();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (ids.has(current) || !byId[current]) continue;
    ids.add(current);
    const children = byId[current]?.ui?.content?.children;
    if (Array.isArray(children)) {
      for (const childId of children) {
        if (!ids.has(childId)) queue.push(childId);
      }
    }
  }
  return ids;
}

/**
 * Check if potentialDescendant is inside the subtree rooted at ancestorId.
 */
function isDescendantOf(ancestorId, potentialDescendant, byId) {
  const children = byId[ancestorId]?.ui?.content?.children || [];
  for (const childId of children) {
    if (childId === potentialDescendant) return true;
    if (byId[childId] && isDescendantOf(childId, potentialDescendant, byId)) return true;
  }
  return false;
}

/* ── Constants ───────────────────────────────────────────────── */

const MAX_HISTORY = 50;

const ACTION_TYPES = Object.freeze({
  LOAD_FRAGMENT_MAP:    'LOAD_FRAGMENT_MAP',
  UPDATE_NODE:          'UPDATE_NODE',
  UPDATE_NODE_CSS:      'UPDATE_NODE_CSS',
  UPDATE_NODE_CONTENT:  'UPDATE_NODE_CONTENT',
  ADD_NODE:             'ADD_NODE',
  REMOVE_NODE:          'REMOVE_NODE',
  MOVE_NODE:            'MOVE_NODE',
  SELECT_NODE:          'SELECT_NODE',
  SET_SCREEN:           'SET_SCREEN',
  SET_REWARD_STATE:     'SET_REWARD_STATE',
  APPLY_THEME:          'APPLY_THEME',
  REPLACE_ASSET:        'REPLACE_ASSET',
  UPDATE_NODE_FULL:     'UPDATE_NODE_FULL',
  DELETE_NODE:          'DELETE_NODE',
  REPLACE_FRAGMENT_MAP: 'REPLACE_FRAGMENT_MAP',
  UNDO:                 'UNDO',
  REDO:                 'REDO',
  MARK_SAVED:           'MARK_SAVED',
  SET_ERROR:            'SET_ERROR',
  ADD_ELEMENT:          'ADD_ELEMENT',
});

/* ── Initial state factory ───────────────────────────────────── */

/**
 * Create a fresh state object from a fragmentMap (as returned by the API).
 * If fragmentMap is null/undefined, returns an empty-but-valid state.
 */
function createInitialState(fragmentMap) {
  const game = extractGame(fragmentMap);
  const byId = game?.byId ? deepClone(game.byId) : {};
  const rootId = game?.rootId || 'ROOT';

  return {
    fragmentMap: fragmentMap ? deepClone(fragmentMap) : null,
    byId,
    selectedNodeId: null,
    activeScreen: 'game',
    rewardState: 'redeemable-unseen',
    isDirty: false,
    history: {
      undo: [],   // Array<byId snapshots>, most recent last
      redo: [],   // Array<byId snapshots>, most recent first
    },
    error: null,
    validationWarnings: [],
    // Internal bookkeeping (not part of the public contract but needed)
    _rootId: rootId,
  };
}

/* ── History helpers ─────────────────────────────────────────── */

/**
 * Push current byId onto the undo stack and clear redo.
 * Returns a new history object.
 */
function pushHistory(history, currentById) {
  const undo = [...history.undo, deepClone(currentById)];
  // Trim to MAX_HISTORY (drop oldest)
  if (undo.length > MAX_HISTORY) {
    undo.splice(0, undo.length - MAX_HISTORY);
  }
  return { undo, redo: [] };
}

/**
 * Clamp an insertion position to valid bounds for a children array.
 */
function clampPosition(position, length) {
  if (typeof position !== 'number' || position < 0) return length;
  return Math.min(position, length);
}

/* ── Reducer ─────────────────────────────────────────────────── */

/**
 * The single reducer for all layout state mutations.
 * Every action returns a new state object (never mutates).
 */
function layoutReducer(state, action) {
  if (!state) state = createInitialState(null);
  if (!action || !action.type) return state;

  switch (action.type) {

    /* ── LOAD_FRAGMENT_MAP ──────────────────────────────────── */
    case ACTION_TYPES.LOAD_FRAGMENT_MAP: {
      return createInitialState(action.fragmentMap);
    }

    /* ── UPDATE_NODE ────────────────────────────────────────── */
    // Generic: set any nested property on a node.
    // action: { nodeId, path: string[], value }
    case ACTION_TYPES.UPDATE_NODE: {
      const { nodeId, path, value } = action;
      if (!nodeId || !state.byId[nodeId]) return state;
      if (!Array.isArray(path) || path.length === 0) return state;

      const updatedNode = setIn(state.byId[nodeId], path, value);

      return {
        ...state,
        byId: { ...state.byId, [nodeId]: updatedNode },
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── UPDATE_NODE_CSS ────────────────────────────────────── */
    // Shortcut: set state.byId[nodeId].ui.css[cssSection][property] = value
    // action: { nodeId, cssSection, property, value }
    case ACTION_TYPES.UPDATE_NODE_CSS: {
      const { nodeId, cssSection, property, value } = action;
      if (!nodeId || !state.byId[nodeId]) return state;
      if (!cssSection || !property) return state;

      const path = ['ui', 'css', cssSection, property];
      const updatedNode = setIn(state.byId[nodeId], path, value);

      // Validate after update — warn but don't block
      const cssValidation = validateNode(updatedNode);

      return {
        ...state,
        byId: { ...state.byId, [nodeId]: updatedNode },
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
        validationWarnings: cssValidation.valid ? [] : cssValidation.errors,
      };
    }

    /* ── UPDATE_NODE_CONTENT ────────────────────────────────── */
    // Shortcut: set state.byId[nodeId].ui.content[key] = value
    // action: { nodeId, key, value }
    case ACTION_TYPES.UPDATE_NODE_CONTENT: {
      const { nodeId, key, value } = action;
      if (!nodeId || !state.byId[nodeId]) return state;
      if (!key) return state;

      const path = ['ui', 'content', key];
      const updatedNode = setIn(state.byId[nodeId], path, value);

      // Validate after update — warn but don't block
      const contentValidation = validateNode(updatedNode);

      return {
        ...state,
        byId: { ...state.byId, [nodeId]: updatedNode },
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
        validationWarnings: contentValidation.valid ? [] : contentValidation.errors,
      };
    }

    /* ── ADD_NODE ────────────────────────────────────────────── */
    // action: { parentId, position, nodeData | elementType }
    // When elementType is provided (no nodeData), creates node from schema.
    case ACTION_TYPES.ADD_NODE: {
      const { parentId, position, elementType } = action;
      let { nodeData } = action;

      // If elementType provided instead of nodeData, create from schema
      if (!nodeData && elementType) {
        try {
          nodeData = createDefaultNode(elementType);
        } catch (e) {
          return { ...state, error: e.message };
        }
      }

      if (!nodeData) return state;

      // Determine the new node's id
      const newNodeId = nodeData.id || nodeData.nodeId;
      if (!newNodeId) return state;

      // Must not collide with existing ids
      if (state.byId[newNodeId]) return state;

      // If parentId specified, it must exist
      if (parentId && !state.byId[parentId]) return state;

      // Build the new byId
      const newById = { ...state.byId };

      // Strip the id/nodeId field from the stored node data (byId keys ARE the ids)
      const { id: _id, nodeId: _nid, ...nodeBody } = nodeData;
      newById[newNodeId] = deepClone(nodeBody);

      // Ensure the new node has at minimum a ui object
      if (!newById[newNodeId].ui) {
        newById[newNodeId].ui = { content: {}, css: {} };
      }

      // Insert into parent's children array
      if (parentId) {
        const parent = deepClone(newById[parentId]);
        if (!parent.ui) parent.ui = {};
        if (!parent.ui.content) parent.ui.content = {};
        const children = parent.ui.content.children || [];
        const idx = clampPosition(position, children.length);
        const updatedChildren = [...children];
        updatedChildren.splice(idx, 0, newNodeId);
        parent.ui.content.children = updatedChildren;
        newById[parentId] = parent;
      }

      return {
        ...state,
        byId: newById,
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── ADD_ELEMENT ─────────────────────────────────────────── */
    // Friendlier API: creates + validates from schema.
    // action: { parentId, position, elementType, overrides }
    case ACTION_TYPES.ADD_ELEMENT: {
      const { parentId, position, elementType, overrides } = action;

      // Create node from schema — pass existing IDs to avoid collisions
      let nodeData;
      try {
        nodeData = createDefaultNode(elementType, overrides, state.byId);
      } catch (e) {
        return { ...state, error: e.message };
      }

      // Validate before inserting
      const { id: newNodeId, ...nodeBody } = nodeData;
      const validation = validateNode(nodeBody);
      if (!validation.valid) {
        const errMsgs = validation.errors.map(e => typeof e === 'string' ? e : e.message || JSON.stringify(e));
        return { ...state, error: `Validation failed: ${errMsgs.join(', ')}` };
      }

      // Must not collide with existing ids — generate a new one if collision
      let finalNodeId = newNodeId;
      if (state.byId[finalNodeId]) {
        let counter = 1;
        while (state.byId[`${newNodeId}_${counter}`]) counter++;
        finalNodeId = `${newNodeId}_${counter}`;
      }

      // Parent must exist if specified
      if (parentId && !state.byId[parentId]) return state;

      const newById = { ...state.byId };
      newById[finalNodeId] = deepClone(nodeBody);

      // Insert into parent's children array
      const actualParent = parentId && state.byId[parentId] ? parentId : 'ROOT';
      if (newById[actualParent]) {
        const parent = deepClone(newById[actualParent]);
        if (!parent.ui) parent.ui = {};
        if (!parent.ui.content) parent.ui.content = {};
        const children = parent.ui.content.children || [];
        const idx = clampPosition(position, children.length);
        const updatedChildren = [...children];
        updatedChildren.splice(idx, 0, finalNodeId);
        parent.ui.content.children = updatedChildren;
        newById[actualParent] = parent;
      }

      return {
        ...state,
        byId: newById,
        selectedNodeId: finalNodeId, // Auto-select the new node
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
        validationWarnings: [],
      };
    }

    /* ── REMOVE_NODE ────────────────────────────────────────── */
    // Removes a node AND all its descendants. Cleans up parent references.
    // action: { nodeId }
    case ACTION_TYPES.REMOVE_NODE: {
      const { nodeId } = action;
      if (!nodeId || !state.byId[nodeId]) return state;

      // Prevent removing the root node
      const rootId = state._rootId || extractRootId(state.fragmentMap);
      if (nodeId === rootId) return state;

      // Collect all nodes to remove
      const toRemove = collectSubtree(nodeId, state.byId);

      const newById = {};

      // Copy surviving nodes, cleaning up children arrays
      for (const [id, node] of Object.entries(state.byId)) {
        if (toRemove.has(id)) continue;

        const children = node?.ui?.content?.children;
        if (Array.isArray(children) && children.some((c) => toRemove.has(c))) {
          const cleaned = deepClone(node);
          cleaned.ui.content.children = children.filter((c) => !toRemove.has(c));
          newById[id] = cleaned;
        } else {
          newById[id] = node;
        }
      }

      // Clear selection if removed node was selected
      const newSelectedId = toRemove.has(state.selectedNodeId)
        ? null
        : state.selectedNodeId;

      return {
        ...state,
        byId: newById,
        selectedNodeId: newSelectedId,
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── MOVE_NODE ──────────────────────────────────────────── */
    // action: { nodeId, newParentId, position }
    case ACTION_TYPES.MOVE_NODE: {
      const { nodeId, newParentId, position } = action;
      if (!nodeId || !state.byId[nodeId]) return state;
      if (!newParentId || !state.byId[newParentId]) return state;
      if (nodeId === newParentId) return state;

      // Prevent moving a node into its own subtree (would create a cycle)
      if (isDescendantOf(nodeId, newParentId, state.byId)) return state;

      const newById = deepClone(state.byId);

      // Remove from all current parents
      for (const id of Object.keys(newById)) {
        const children = newById[id]?.ui?.content?.children;
        if (Array.isArray(children) && children.includes(nodeId)) {
          newById[id].ui.content.children = children.filter((c) => c !== nodeId);
        }
      }

      // Insert into new parent
      const parent = newById[newParentId];
      if (!parent.ui) parent.ui = {};
      if (!parent.ui.content) parent.ui.content = {};
      if (!Array.isArray(parent.ui.content.children)) parent.ui.content.children = [];

      const idx = clampPosition(position, parent.ui.content.children.length);
      parent.ui.content.children.splice(idx, 0, nodeId);

      return {
        ...state,
        byId: newById,
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── SELECT_NODE ────────────────────────────────────────── */
    // action: { nodeId } — pass null/undefined to deselect
    case ACTION_TYPES.SELECT_NODE: {
      const { nodeId } = action;
      // Allow null (deselect) or any existing node
      if (nodeId != null && !state.byId[nodeId]) return state;
      return { ...state, selectedNodeId: nodeId || null };
    }

    /* ── SET_SCREEN ─────────────────────────────────────────── */
    // action: { screen: 'game' | 'banner' | 'rewardCard' }
    case ACTION_TYPES.SET_SCREEN: {
      const { screen } = action;
      const valid = ['game', 'banner', 'rewardCard'];
      if (!valid.includes(screen)) return state;
      return { ...state, activeScreen: screen };
    }

    /* ── SET_REWARD_STATE ───────────────────────────────────── */
    // action: { rewardState: 'redeemable-unseen' | 'redeemable-seen' }
    case ACTION_TYPES.SET_REWARD_STATE: {
      const { rewardState } = action;
      const valid = ['redeemable-unseen', 'redeemable-seen'];
      if (!valid.includes(rewardState)) return state;
      return { ...state, rewardState };
    }

    /* ── APPLY_THEME ────────────────────────────────────────── */
    // Apply a batch of patches across multiple nodes in one history entry.
    //
    // action.themePatches shape — supports two formats per node:
    //
    //   Array format:  { [nodeId]: [{ path: [...], value }, ...] }
    //   Object format: { [nodeId]: { css?: { section: { prop: val } }, content?: { key: val } } }
    case ACTION_TYPES.APPLY_THEME: {
      const themePatches = action.themePatches || action.patches;
      if (!themePatches || typeof themePatches !== 'object') return state;

      let newById = { ...state.byId };
      let changed = false;

      for (const [nodeId, patches] of Object.entries(themePatches)) {
        if (!newById[nodeId]) continue;

        if (Array.isArray(patches)) {
          // Array-of-patches format
          let node = newById[nodeId];
          for (const patch of patches) {
            if (Array.isArray(patch.path) && patch.path.length > 0) {
              node = setIn(node, patch.path, patch.value);
              changed = true;
            }
          }
          newById[nodeId] = node;
        } else if (typeof patches === 'object') {
          // Object-merge format
          const node = deepClone(newById[nodeId]);
          if (!node.ui) node.ui = {};

          if (patches.css && typeof patches.css === 'object') {
            if (!node.ui.css) node.ui.css = {};
            for (const [section, props] of Object.entries(patches.css)) {
              if (typeof props !== 'object' || props === null) continue;
              if (!node.ui.css[section]) node.ui.css[section] = {};
              Object.assign(node.ui.css[section], props);
            }
            changed = true;
          }

          if (patches.content && typeof patches.content === 'object') {
            if (!node.ui.content) node.ui.content = {};
            Object.assign(node.ui.content, patches.content);
            changed = true;
          }

          if (patches.visible !== undefined) {
            node.ui.visible = patches.visible;
            changed = true;
          }

          newById[nodeId] = node;
        }
      }

      if (!changed) return state;

      return {
        ...state,
        byId: newById,
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── REPLACE_ASSET ──────────────────────────────────────── */
    // Replace an image/asset URL on a node.
    // action: { nodeId, cssSection, property, url }
    //
    // If cssSection is provided: sets ui.css[cssSection][property] = url
    // If cssSection is null/undefined: sets ui.content[property] = url
    case ACTION_TYPES.REPLACE_ASSET: {
      const { nodeId, cssSection, property, url } = action;
      if (!nodeId || !state.byId[nodeId]) return state;
      if (!property || !url) return state;

      // Wrap in url() for CSS background properties
      let value = url;
      if (cssSection && property === 'backgroundImage' && !url.startsWith('url(')) {
        value = `url("${url}")`;
      }

      const path = cssSection
        ? ['ui', 'css', cssSection, property]
        : ['ui', 'content', property];

      const updatedNode = setIn(state.byId[nodeId], path, value);

      return {
        ...state,
        byId: { ...state.byId, [nodeId]: updatedNode },
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── UPDATE_NODE_FULL — replace entire node data ──────── */
    case ACTION_TYPES.UPDATE_NODE_FULL: {
      const { nodeId, nodeData } = action;
      if (!nodeId || !state.byId[nodeId] || !nodeData) return state;
      return {
        ...state,
        byId: { ...state.byId, [nodeId]: deepClone(nodeData) },
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── DELETE_NODE — alias for REMOVE_NODE ────────────── */
    case ACTION_TYPES.DELETE_NODE: {
      const { nodeId } = action;
      if (!nodeId || !state.byId[nodeId] || nodeId === 'ROOT') return state;
      const newById = deepClone(state.byId);
      // Remove from parent's children
      for (const [id, node] of Object.entries(newById)) {
        const children = node?.ui?.content?.children;
        if (Array.isArray(children) && children.includes(nodeId)) {
          newById[id].ui.content.children = children.filter(c => c !== nodeId);
        }
      }
      delete newById[nodeId];
      return {
        ...state,
        byId: newById,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── REPLACE_FRAGMENT_MAP — wholesale replace (JSON edit) */
    case ACTION_TYPES.REPLACE_FRAGMENT_MAP: {
      const { fragmentMap } = action;
      if (!fragmentMap) return state;
      const newById = fragmentMap?.fragments?.reward?.game?.byId || {};
      return {
        ...state,
        fragmentMap: deepClone(fragmentMap),
        byId: deepClone(newById),
        isDirty: true,
        history: pushHistory(state.history, state.byId),
        error: null,
      };
    }

    /* ── UNDO ───────────────────────────────────────────────── */
    case ACTION_TYPES.UNDO: {
      if (state.history.undo.length === 0) return state;

      const undoStack = [...state.history.undo];
      const previousById = undoStack.pop();

      const redoStack = [deepClone(state.byId), ...state.history.redo];
      if (redoStack.length > MAX_HISTORY) redoStack.length = MAX_HISTORY;

      return {
        ...state,
        byId: previousById,
        isDirty: true,
        history: { undo: undoStack, redo: redoStack },
      };
    }

    /* ── REDO ───────────────────────────────────────────────── */
    case ACTION_TYPES.REDO: {
      if (state.history.redo.length === 0) return state;

      const redoStack = [...state.history.redo];
      const nextById = redoStack.shift();

      const undoStack = [...state.history.undo, deepClone(state.byId)];
      if (undoStack.length > MAX_HISTORY) {
        undoStack.splice(0, undoStack.length - MAX_HISTORY);
      }

      return {
        ...state,
        byId: nextById,
        isDirty: true,
        history: { undo: undoStack, redo: redoStack },
      };
    }

    /* ── MARK_SAVED ─────────────────────────────────────────── */
    // Optionally accepts a new fragmentMap to store (e.g. after API confirms save).
    case ACTION_TYPES.MARK_SAVED: {
      return {
        ...state,
        isDirty: false,
        fragmentMap: action.fragmentMap
          ? deepClone(action.fragmentMap)
          : state.fragmentMap,
      };
    }

    /* ── SET_ERROR ──────────────────────────────────────────── */
    case ACTION_TYPES.SET_ERROR: {
      return { ...state, error: action.error || null };
    }

    default:
      return state;
  }
}

/* ── Selectors / Helpers ─────────────────────────────────────── */

/**
 * Get a single node by id. Returns undefined if not found.
 */
function getNodeById(state, nodeId) {
  if (!state || !state.byId || !nodeId) return undefined;
  return state.byId[nodeId] || undefined;
}

/**
 * Get the currently selected node, or undefined.
 */
function getSelectedNode(state) {
  if (!state || !state.selectedNodeId) return undefined;
  return getNodeById(state, state.selectedNodeId);
}

/**
 * Build a renderable tree from state.byId for the StructureTree component.
 *
 * Returns:
 *   { id, type_id, ui, content, css, children: [...recursive] }
 *
 * or null if byId is empty / missing.
 */
function getNodeTree(state) {
  if (!state || !state.byId || Object.keys(state.byId).length === 0) return null;

  const rootId = state._rootId || extractRootId(state.fragmentMap);
  const byId = state.byId;

  function buildNode(id, visited) {
    if (!byId[id]) return null;
    // Guard against circular references
    if (visited.has(id)) return null;
    visited.add(id);

    const raw = byId[id];
    const childIds = raw.ui?.content?.children || [];
    const children = childIds
      .map((childId) => buildNode(childId, visited))
      .filter(Boolean);

    return {
      id,
      nodeId: id,
      type_id: raw.type_id || id,
      ui: raw.ui || {},
      content: raw.ui?.content || {},
      css: raw.ui?.css || {},
      children,
    };
  }

  return buildNode(rootId, new Set());
}

/**
 * Reconstruct the full fragmentMap with the current byId,
 * ready to be sent to the API for saving.
 *
 * Returns a deep clone so the caller cannot accidentally mutate state.
 * Returns null if fragmentMap or byId is missing.
 */
function getFragmentMapForSave(state) {
  if (!state || !state.fragmentMap || !state.byId) return null;

  const output = deepClone(state.fragmentMap);
  const frags = output.fragments || output;

  if (frags?.reward?.game) {
    frags.reward.game.byId = deepClone(state.byId);
  }

  return output;
}

/**
 * Get current validation warnings from state.
 * Returns an array of warning strings (empty if no warnings).
 */
function getValidationWarnings(state) {
  if (!state) return [];
  return state.validationWarnings || [];
}

/* ── Exports ─────────────────────────────────────────────────── */

export {
  ACTION_TYPES,
  createInitialState,
  layoutReducer,
  getNodeById,
  getSelectedNode,
  getNodeTree,
  getFragmentMapForSave,
  getValidationWarnings,
};
