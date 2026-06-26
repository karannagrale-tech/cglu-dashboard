import { useState, useMemo, useCallback } from 'react';
import { NODE_LABELS } from '../constants/gameTypes';

/**
 * Build a renderable tree from the fragmentMap byId map.
 * Returns { id, nodeId, type_id, ui, children: [...] } recursively.
 */
export function buildTreeFromByIdMap(byId) {
  if (!byId || typeof byId !== 'object') return null;

  const rootEntry = byId.ROOT || byId.root;
  if (!rootEntry) return null;

  function buildNode(nodeId) {
    const raw = byId[nodeId];
    if (!raw) return null;

    const childIds =
      raw.ui?.content?.children ||
      raw.ui?.content?.slices?.map((_, i) => `SLICE_${i}`) ||
      [];

    const children = childIds
      .map((cid) => buildNode(cid))
      .filter(Boolean);

    return {
      id: nodeId,
      nodeId,
      type_id: raw.type_id || nodeId,
      ui: raw.ui || {},
      raw,
      children,
    };
  }

  return buildNode('ROOT');
}

/**
 * Flatten the byId map into a flat array of { id, type_id } for searching.
 */
export function flattenByIdMap(byId) {
  if (!byId || typeof byId !== 'object') return [];
  return Object.entries(byId).map(([id, node]) => ({
    id,
    type_id: node.type_id || id,
    label: NODE_LABELS[id] || NODE_LABELS[node.type_id] || node.type_id || id,
  }));
}

function TreeNode({ node, depth, selectedId, onSelect, searchTerm, expandedMap, toggleExpanded }) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const label = NODE_LABELS[node.id] || NODE_LABELS[node.type_id] || node.type_id || node.id;
  const isSelected = selectedId === node.id;
  const isExpanded = expandedMap[node.id] !== undefined ? expandedMap[node.id] : depth < 2;

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      node.id.toLowerCase().includes(s) ||
      label.toLowerCase().includes(s) ||
      (node.type_id || '').toLowerCase().includes(s)
    );
  }, [node.id, node.type_id, label, searchTerm]);

  const childMatchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    function check(n) {
      const s = searchTerm.toLowerCase();
      const l = NODE_LABELS[n.id] || NODE_LABELS[n.type_id] || n.type_id || n.id;
      if (n.id.toLowerCase().includes(s) || l.toLowerCase().includes(s)) return true;
      return (n.children || []).some(check);
    }
    return check(node);
  }, [node, searchTerm]);

  if (searchTerm && !matchesSearch && !childMatchesSearch) {
    return null;
  }

  return (
    <>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(node)}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        <span
          className={`tree-node-toggle ${hasChildren && isExpanded ? 'expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpanded(node.id);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            cursor: hasChildren ? 'pointer' : 'default',
            transition: 'transform 0.15s ease',
            transform: hasChildren && isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: hasChildren ? 'var(--text-secondary, #6B7280)' : 'transparent',
            fontSize: 10,
            flexShrink: 0,
          }}
        >
          {hasChildren ? '▶' : ' '}
        </span>
        <span className="tree-node-id" style={{
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 600,
          color: isSelected ? '#7c3aed' : 'var(--text-heading, #1F2937)',
          marginRight: 6,
        }}>
          {node.id}
        </span>
        <span className="tree-node-label" style={{
          fontSize: 11,
          color: 'var(--text-muted, #9CA3AF)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.type_id !== node.id ? node.type_id : ''}
        </span>
      </div>
      {hasChildren && isExpanded && children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          searchTerm={searchTerm}
          expandedMap={expandedMap}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </>
  );
}

function StructureTree({ fragmentMap, selectedNode, onSelectNode }) {
  const [search, setSearch] = useState('');
  const [expandedMap, setExpandedMap] = useState({});
  const searchTerm = search.toLowerCase().trim();

  const toggleExpanded = useCallback((nodeId) => {
    setExpandedMap((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] !== undefined ? !prev[nodeId] : false,
    }));
  }, []);

  const byId = useMemo(() => {
    if (!fragmentMap) return null;
    // Support both direct byId and nested fragmentMap structures
    const game = fragmentMap?.fragments?.reward?.game;
    if (game?.byId) return game.byId;
    // Fallback: if fragmentMap itself has byId
    if (fragmentMap.byId) return fragmentMap.byId;
    return null;
  }, [fragmentMap]);

  const tree = useMemo(() => {
    if (!byId) return null;
    return buildTreeFromByIdMap(byId);
  }, [byId]);

  const nodeCount = useMemo(() => {
    if (!byId) return 0;
    return Object.keys(byId).length;
  }, [byId]);

  if (!tree) {
    return (
      <div className="no-layout-msg" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        color: 'var(--text-muted, #9CA3AF)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>&#128450;</div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary, #6B7280)' }}>
          No layout configured
        </div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          This campaign does not have a fragment map yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tree-search" style={{
        padding: '8px',
        borderBottom: '1px solid var(--border, #E5E7EB)',
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 13,
            color: 'var(--text-muted, #9CA3AF)',
            pointerEvents: 'none',
          }}>
            &#128269;
          </span>
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              border: '1px solid var(--border, #E5E7EB)',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none',
              background: 'var(--bg-input, #F9FAFB)',
            }}
          />
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted, #9CA3AF)',
          marginTop: 4,
          paddingLeft: 2,
        }}>
          {nodeCount} nodes
        </div>
      </div>
      <div className="panel-body" role="tree" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0',
      }}>
        <TreeNode
          node={tree}
          depth={0}
          selectedId={selectedNode?.id || selectedNode?.nodeId}
          onSelect={onSelectNode}
          searchTerm={searchTerm}
          expandedMap={expandedMap}
          toggleExpanded={toggleExpanded}
        />
      </div>
    </div>
  );
}

export { flattenByIdMap as flattenTree };
export default StructureTree;
