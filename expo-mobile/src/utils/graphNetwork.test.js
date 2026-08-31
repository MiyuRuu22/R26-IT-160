const { calculateShortestDistances, buildGraphLayout } = require('./graphNetwork');

describe('graph network utilities', () => {
  it('calculates shortest distances from the selected entity', () => {
    const nodes = [
      { id: 'root', label: 'Kamal Rodrigo', type: 'Person' },
      { id: 'org', label: 'National Development Bank', type: 'Organization' },
      { id: 'case', label: 'DC552025', type: 'Case' },
    ];

    const edges = [
      { source: 'root', target: 'org', label: 'EMPLOYED_BY' },
      { source: 'root', target: 'case', label: 'PETITIONER_IN' },
    ];

    const distances = calculateShortestDistances('root', nodes, edges);

    expect(distances.root).toBe(0);
    expect(distances.org).toBe(1);
    expect(distances.case).toBe(1);
  });

  it('positions deeper nodes at larger radii', () => {
    const nodes = [
      { id: 'root', label: 'Kamal Rodrigo', type: 'Person' },
      { id: 'org', label: 'National Development Bank', type: 'Organization' },
      { id: 'case', label: 'DC552025', type: 'Case' },
      { id: 'bank2', label: 'Commercial Bank', type: 'Organization' },
    ];

    const edges = [
      { source: 'root', target: 'org', label: 'EMPLOYED_BY' },
      { source: 'org', target: 'case', label: 'PARTICIPANT_IN' },
      { source: 'root', target: 'bank2', label: 'CONNECTED_TO' },
    ];

    const layout = buildGraphLayout(nodes, edges, 'root');

    expect(layout.positions.root.x).toBeGreaterThan(0);
    expect(layout.positions.org.x).not.toBe(layout.positions.root.x);
    expect(layout.positions.case.y).not.toBe(layout.positions.root.y);
  });

  it('keeps a dense three-hop network readable on a phone canvas', () => {
    const nodes = Array.from({ length: 10 }, (_, index) => ({
      id: `n${index}`,
      label: `Entity ${index}`,
      type: 'Person',
    }));
    const edges = [
      { source: 'n0', target: 'n1' }, { source: 'n0', target: 'n2' },
      { source: 'n1', target: 'n3' }, { source: 'n1', target: 'n4' }, { source: 'n2', target: 'n5' },
      { source: 'n3', target: 'n6' }, { source: 'n3', target: 'n7' }, { source: 'n4', target: 'n8' }, { source: 'n5', target: 'n9' },
    ];
    const { positions } = buildGraphLayout(nodes, edges, 'n0', {
      width: 340,
      height: 520,
      nodeWidth: 82,
      nodeHeight: 42,
    });

    const placed = Object.values(positions);
    for (let index = 0; index < placed.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < placed.length; otherIndex += 1) {
        const horizontalOverlap = Math.abs(placed[index].x - placed[otherIndex].x) < 82;
        const verticalOverlap = Math.abs(placed[index].y - placed[otherIndex].y) < 42;
        expect(horizontalOverlap && verticalOverlap).toBe(false);
      }
    }
  });
});
