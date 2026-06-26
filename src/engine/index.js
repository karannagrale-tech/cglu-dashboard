/**
 * engine/index.js — Public API for the layout state engine.
 * Re-exports everything from layoutState.js.
 */
export {
  ACTION_TYPES,
  createInitialState,
  layoutReducer,
  getNodeById,
  getSelectedNode,
  getNodeTree,
  getFragmentMapForSave,
} from './layoutState.js';
