import { useMemo, useRef } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

const nodeWidth = 180;
const nodeHeight = 60;

const getLayoutedPositions = (nodes, edges) => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 88, ranksep: 130, edgesep: 26 });
  nodes.forEach((node) => graph.setNode(node.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);
  return nodes.reduce((positions, node) => {
      const placed = graph.node(node.id);
      positions[node.id] = { x: placed.x - nodeWidth / 2, y: placed.y - nodeHeight / 2 };
      return positions;
    }, {});
};

const quietGraph = (elements) => ({
  nodes: elements.nodes.map((node) => ({
    ...node,
    style: { ...node.style, opacity: 1, border: "1px solid rgba(255,255,255,0.08)" },
  })),
  edges: elements.edges.map((edge) => ({
    ...edge,
    animated: false,
    label: edge.data?.important ? edge.data.relationshipLabel : "",
    style: { ...edge.style, opacity: 0.72, strokeWidth: 2 },
  })),
});

function GraphView({ elements, setElements, setSelectedNode }) {
  const selectedId = useRef(null);
  const positionCache = useRef({ key: "", positions: {} });
  const structureKey = useMemo(
    () => `${elements.nodes.map((node) => node.id).sort().join("|")}::${elements.edges.map((edge) => `${edge.source}-${edge.target}`).sort().join("|")}`,
    [elements.nodes, elements.edges]
  );

  if (positionCache.current.key !== structureKey) {
    selectedId.current = null;
    positionCache.current = {
      key: structureKey,
      positions: getLayoutedPositions(elements.nodes, elements.edges),
    };
  }

  const layouted = {
    nodes: elements.nodes.map((node) => ({
      ...node,
      position: positionCache.current.positions[node.id] || node.position,
    })),
    edges: elements.edges,
  };

  const focusNeighbourhood = (node, select = false) => {
    const relatedIds = new Set([node.id]);
    const edges = elements.edges.map((edge) => {
      const related = edge.source === node.id || edge.target === node.id;
      if (related) {
        relatedIds.add(edge.source);
        relatedIds.add(edge.target);
      }
      return {
        ...edge,
        animated: related,
        label: related ? edge.data?.relationshipLabel || edge.label : edge.data?.important ? edge.data.relationshipLabel : "",
        style: { ...edge.style, opacity: related ? 1 : 0.1, strokeWidth: related ? 4 : 1 },
      };
    });
    const nodes = elements.nodes.map((candidate) => ({
      ...candidate,
      style: {
        ...candidate.style,
        opacity: relatedIds.has(candidate.id) ? 1 : 0.18,
        border: candidate.id === node.id ? "3px solid #bfdbfe" : "1px solid rgba(255,255,255,0.08)",
      },
    }));
    setElements({ nodes, edges });
    if (select) {
      selectedId.current = node.id;
      setSelectedNode(node);
    }
  };

  const handleNodeDragStop = (event, node) => {
    positionCache.current.positions[node.id] = node.position;
    setElements({
      ...elements,
      nodes: elements.nodes.map((candidate) => candidate.id === node.id
        ? { ...candidate, position: node.position }
        : candidate),
    });
  };

  const clearSelection = () => {
    selectedId.current = null;
    setSelectedNode(null);
    setElements(quietGraph(elements));
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {elements.nodes.length === 0 && (
        <div className="graph-empty-state">
          Search for an entity such as <strong>Kamal Rodrigo</strong> to map its legal connections.
        </div>
      )}
      <ReactFlow
        nodes={layouted.nodes}
        edges={layouted.edges}
        onNodeClick={(event, node) => focusNeighbourhood(node, true)}
        onNodeMouseEnter={(event, node) => {
          if (!selectedId.current) focusNeighbourhood(node);
        }}
        onNodeMouseLeave={() => {
          if (!selectedId.current) setElements(quietGraph(elements));
        }}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={clearSelection}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls />
        <Background gap={24} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
}

export default GraphView;
