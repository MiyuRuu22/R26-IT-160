export const calculateShortestDistances = (rootId, nodes, edges) => {
  const adjacency = nodes.reduce((map, node) => ({ ...map, [node.id]: [] }), {});
  edges.forEach((edge) => {
    if (adjacency[edge.source] && adjacency[edge.target]) {
      adjacency[edge.source].push(edge.target);
      adjacency[edge.target].push(edge.source);
    }
  });
  const distances = { [rootId]: 0 };
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift();
    adjacency[current].forEach((neighbour) => {
      if (distances[neighbour] === undefined) {
        distances[neighbour] = distances[current] + 1;
        queue.push(neighbour);
      }
    });
  }
  return distances;
};

const hash = (value) => String(value).split('').reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 17);

// A deterministic force layout. It settles once and supplies stable base
// positions; the renderer adds ambient drift without feeding it back here.
export const buildGraphLayout = (nodes, edges, rootId, dimensions = {}) => {
  const width = dimensions.width || 680;
  const height = dimensions.height || 880;
  const nodeWidth = dimensions.nodeWidth || 34;
  const nodeHeight = dimensions.nodeHeight || 34;
  const centre = { x: width / 2, y: height / 2 };
  const padding = Math.max(nodeWidth, nodeHeight) / 2 + 18;
  const distances = calculateShortestDistances(rootId, nodes, edges);
  const positions = {};
  const velocities = {};
  const maxRadius = Math.min(width, height) * 0.42;

  nodes.forEach((node) => {
    if (node.id === rootId) {
      positions[node.id] = { ...centre };
    } else {
      const seed = hash(node.id);
      const depth = distances[node.id] === undefined ? 3 : distances[node.id];
      const angle = ((seed % 360) * Math.PI) / 180;
      const radius = Math.min(maxRadius, 105 + depth * 92 + ((seed >>> 9) % 30));
      positions[node.id] = { x: centre.x + Math.cos(angle) * radius, y: centre.y + Math.sin(angle) * radius * 0.82 };
    }
    velocities[node.id] = { x: 0, y: 0 };
  });

  const minSeparation = Math.max(nodeWidth, nodeHeight) + 12;
  const linkDistance = Math.max(88, Math.min(138, Math.min(width, height) * 0.19));
  const iterations = Math.min(280, 120 + nodes.length * 3);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const cooling = 1 - (iteration / iterations) * 0.45;
    nodes.forEach((node) => {
      if (node.id === rootId) return;
      velocities[node.id].x += (centre.x - positions[node.id].x) * 0.0018;
      velocities[node.id].y += (centre.y - positions[node.id].y) * 0.0018;
    });

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const first = nodes[left];
        const second = nodes[right];
        const firstPosition = positions[first.id];
        const secondPosition = positions[second.id];
        let dx = secondPosition.x - firstPosition.x;
        let dy = secondPosition.y - firstPosition.y;
        let distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        if (distance < 0.01) {
          const angle = (hash(`${first.id}-${second.id}`) % 360) * Math.PI / 180;
          dx = Math.cos(angle); dy = Math.sin(angle); distance = 1;
        }
        const unitX = dx / distance;
        const unitY = dy / distance;
        const push = Math.min(7.5, 1800 / (distance * distance)) + (distance < minSeparation ? (minSeparation - distance) * 0.12 : 0);
        if (first.id !== rootId) { velocities[first.id].x -= unitX * push; velocities[first.id].y -= unitY * push; }
        if (second.id !== rootId) { velocities[second.id].x += unitX * push; velocities[second.id].y += unitY * push; }
      }
    }

    edges.forEach((edge) => {
      const source = positions[edge.source];
      const target = positions[edge.target];
      if (!source || !target) return;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const pull = (distance - linkDistance) * 0.012;
      if (edge.source !== rootId) { velocities[edge.source].x += (dx / distance) * pull; velocities[edge.source].y += (dy / distance) * pull; }
      if (edge.target !== rootId) { velocities[edge.target].x -= (dx / distance) * pull; velocities[edge.target].y -= (dy / distance) * pull; }
    });

    nodes.forEach((node) => {
      const position = positions[node.id];
      if (node.id === rootId) {
        position.x += (centre.x - position.x) * 0.2;
        position.y += (centre.y - position.y) * 0.2;
        return;
      }
      const velocity = velocities[node.id];
      velocity.x *= 0.78; velocity.y *= 0.78;
      position.x = Math.max(padding, Math.min(width - padding, position.x + velocity.x * cooling));
      position.y = Math.max(padding, Math.min(height - padding, position.y + velocity.y * cooling));
    });
  }

  // Safety net for compact canvases: preserve the organic result whenever it
  // is clear, and only seek a nearby open slot if two visual hit areas meet.
  const ids = Object.keys(positions);
  const overlaps = (first, second) => Math.abs(first.x - second.x) < nodeWidth && Math.abs(first.y - second.y) < nodeHeight;
  for (let pass = 0; pass < 3; pass += 1) {
    ids.forEach((id, index) => {
      if (!index) return;
      const current = positions[id];
      if (!ids.some((otherId) => otherId !== id && overlaps(current, positions[otherId]))) return;
      let replacement = null;
      for (let ring = 1; ring <= 30 && !replacement; ring += 1) {
        for (let step = 0; step < 20; step += 1) {
          const angle = (step / 20) * Math.PI * 2 + (hash(id) % 20) * 0.1;
          const candidate = {
            x: Math.max(padding, Math.min(width - padding, current.x + Math.cos(angle) * ring * nodeWidth)),
            y: Math.max(padding, Math.min(height - padding, current.y + Math.sin(angle) * ring * nodeHeight)),
          };
          if (!ids.some((otherId) => otherId !== id && overlaps(candidate, positions[otherId]))) {
            replacement = candidate;
            break;
          }
        }
      }
      if (replacement) positions[id] = replacement;
    });
  }

  return { positions, distances };
};
