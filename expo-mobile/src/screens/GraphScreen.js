import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { getGraphData } from '../services/relationshipService';
import { handleAPIError } from '../utils/errorHandling';
import FocusedGraphNetwork from '../components/FocusedGraphNetwork';

const GraphScreen = ({ navigation, route }) => {
  const [searchValue, setSearchValue] = useState('');
  const [entityType, setEntityType] = useState('Case');
  const [depth, setDepth] = useState(2);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setSelectedNode } = useAppStore();

  const entityTypes = ['Case', 'Person', 'Organization'];
  const highRiskLinks = edges.filter(
    (edge) => edge.riskLevel === 'HIGH' || edge.riskLevel === 'CRITICAL' || edge.riskScore >= 70
  ).length;

  const runSearch = async (query = searchValue, type = entityType, requestedDepth = depth) => {
    const normalizedQuery = String(query || '').trim();
    if (!normalizedQuery) {
      Alert.alert('Input Required', 'Please enter a search value');
      return;
    }

    setLoading(true);
    try {
      const data = await getGraphData(type, normalizedQuery, requestedDepth);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (error) {
      Alert.alert(
        'Unable to load graph',
        `${handleAPIError(error)}\n\nFor the live demo, keep this phone and the laptop on the same Wi-Fi network and confirm the backend is running.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => runSearch();

  // Node Details can send an investigator straight back into a new, focused
  // search. Consume the params after use so returning to this tab is quiet.
  useEffect(() => {
    const requestedName = route.params?.searchValue;
    if (!requestedName) return;

    const requestedType = entityTypes.includes(route.params?.entityType)
      ? route.params.entityType
      : 'Person';
    const requestedDepth = route.params?.depth || 2;
    setSearchValue(requestedName);
    setEntityType(requestedType);
    setDepth(requestedDepth);
    runSearch(requestedName, requestedType, requestedDepth);
    navigation.setParams({ searchValue: undefined, entityType: undefined, depth: undefined });
  }, [route.params?.searchValue]);

  const buildConnectionContext = (selectedNode) => {
    const root = nodes[0];
    if (!root) return null;

    const nodeById = nodes.reduce((map, item) => ({ ...map, [item.id]: item }), {});
    const adjacency = edges.reduce((map, edge) => {
      if (!map[edge.source]) map[edge.source] = [];
      if (!map[edge.target]) map[edge.target] = [];
      map[edge.source].push({ next: edge.target, edge });
      map[edge.target].push({ next: edge.source, edge });
      return map;
    }, {});
    const queue = [{ id: root.id, path: [] }];
    const visited = new Set([root.id]);
    let path = [];

    while (queue.length) {
      const current = queue.shift();
      if (current.id === selectedNode.id) {
        path = current.path;
        break;
      }
      (adjacency[current.id] || []).forEach(({ next, edge }) => {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({
            id: next,
            path: [...current.path, {
              from: nodeById[current.id]?.label || current.id,
              relationship: edge.label,
              to: nodeById[next]?.label || next,
              riskLevel: edge.riskLevel,
              riskScore: edge.riskScore,
            }],
          });
        }
      });
    }

    const directConnections = edges
      .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
      .map((edge) => {
        const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
        return {
          label: edge.label,
          entity: nodeById[otherId]?.label || otherId,
          entityType: nodeById[otherId]?.type || 'Entity',
          riskLevel: edge.riskLevel,
          riskScore: edge.riskScore,
        };
      });

    return {
      rootLabel: root.label || root.id,
      rootType: root.type,
      isRoot: root.id === selectedNode.id,
      path,
      directConnections,
    };
  };

  const handleNodePress = (node) => {
    setSelectedNode(node);
    navigation.navigate('NodeDetail', {
      node,
      connectionContext: buildConnectionContext(node),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.appHeader}>
        <View style={styles.brandMark}>
          <MaterialIcons name="hub" size={19} color="#dbeafe" />
        </View>
        <View>
          <Text style={styles.appEyebrow}>LEGAL INTELLIGENCE</Text>
          <Text style={styles.appTitle}>Relationship Explorer</Text>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.label}>Search entity type</Text>
        <View style={styles.entityTypeContainer}>
          {entityTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.entityTypeBtn,
                entityType === type && styles.entityTypeBtnActive,
              ]}
              onPress={() => setEntityType(type)}
            >
              <Text
                style={[
                  styles.entityTypeBtnText,
                  entityType === type && styles.entityTypeBtnTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.precisionHint}>
          <MaterialIcons name="tips-and-updates" size={15} color="#1d4ed8" />
          <Text style={styles.precisionHintText}>For the most accurate investigation, search by case number.</Text>
        </View>

        <Text style={styles.label}>Investigation query</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search by ${entityType}...`}
            value={searchValue}
            onChangeText={setSearchValue}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.depthRow}>
          {[1, 2, 3].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.depthBtn, depth === option && styles.depthBtnActive]}
              onPress={() => setDepth(option)}
            >
              <Text style={[styles.depthBtnText, depth === option && styles.depthBtnTextActive]}>
                {option === 1 ? 'Direct' : option === 2 ? 'Focused' : 'Extended'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading graph data...</Text>
        </View>
      ) : nodes.length > 0 ? (
        <View style={styles.resultsSection}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultEyebrow}>INVESTIGATION NETWORK</Text>
              <Text style={styles.sectionTitle}>{searchValue.trim()} connections</Text>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{nodes.length}</Text>
              <Text style={styles.statLabel}>ENTITIES</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{edges.length}</Text>
              <Text style={styles.statLabel}>CONNECTIONS</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, highRiskLinks > 0 && styles.riskStatValue]}>{highRiskLinks}</Text>
              <Text style={styles.statLabel}>HIGH RISK</Text>
            </View>
          </View>

          <FocusedGraphNetwork
            nodes={nodes}
            edges={edges}
            onNodePress={handleNodePress}
          />

          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Connection risk</Text>
            <View style={styles.legendItems}>
              <LegendItem color="#22c55e" label="Low" />
              <LegendItem color="#eab308" label="Medium" />
              <LegendItem color="#f97316" label="High" />
              <LegendItem color="#dc2626" label="Critical" />
            </View>
            <Text style={styles.graphHint}>
              Longer indirect routes receive a higher risk score. Tap any node to inspect the legal connection.
            </Text>
            <View style={styles.legendDivider} />
            <Text style={styles.legendTitle}>Entity type</Text>
            <View style={styles.legendItems}>
              <LegendItem color="#2563eb" label="Person" />
              <LegendItem color="#7c3aed" label="Organisation" />
              <LegendItem color="#0f766e" label="Case" />
            </View>
          </View>

          <Text style={styles.detailHeading}>Connected entities</Text>
          {nodes.map((node) => (
            <TouchableOpacity
              key={node.id}
              style={styles.nodeCard}
              onPress={() => handleNodePress(node)}
            >
              <View style={styles.nodeHeader}>
                <MaterialIcons
                  name={getIconForNodeType(node.type)}
                  size={24}
                  color={getColorForNodeType(node.type)}
                />
                <View style={styles.nodeInfo}>
                  <Text style={styles.nodeTitle}>{node.label || node.id}</Text>
                  <Text style={styles.nodeType}>{node.type}</Text>
                </View>
              </View>
              {node.description && (
                <Text style={styles.nodeDescription}>{node.description}</Text>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.detailHeading}>Relationship evidence</Text>
          {edges.slice(0, 5).map((edge, idx) => (
            <View key={idx} style={styles.edgeCard}>
              <Text style={styles.edgeText}>
                {edge.source} → {edge.target}
              </Text>
              <Text style={styles.edgeLabel}>{edge.label}</Text>
            </View>
          ))}
          {edges.length > 5 && (
            <Text style={styles.moreText}>
              +{edges.length - 5} more connections
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <MaterialIcons name="search-off" size={48} color="#ddd" />
          <Text style={styles.emptyText}>
            Search for an entity to view the graph
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const LegendItem = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const getIconForNodeType = (type) => {
  switch (type) {
    case 'Person':
      return 'person';
    case 'Organization':
      return 'business';
    case 'Case':
      return 'description';
    default:
      return 'circle';
  }
};

const getColorForNodeType = (type) => {
  switch (type) {
    case 'Person':
      return '#007AFF';
    case 'Organization':
      return '#34C759';
    case 'Case':
      return '#FF9500';
    default:
      return '#999';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f8',
  },
  appHeader: {
    backgroundColor: '#101b34',
    paddingHorizontal: 20,
    paddingTop: 21,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#263f79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appEyebrow: {
    color: '#91a8da',
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: '800',
  },
  appTitle: {
    color: '#f8fbff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#dce3ef',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#344054',
    letterSpacing: 0.1,
  },
  entityTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  precisionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: -7,
    marginBottom: 16,
  },
  precisionHintText: {
    flex: 1,
    color: '#36517d',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  entityTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4ddeb',
    backgroundColor: '#f8faff',
  },
  entityTypeBtnActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  entityTypeBtnText: {
    fontSize: 12,
    color: '#52627b',
    fontWeight: '700',
  },
  entityTypeBtnTextActive: {
    color: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#d4ddeb',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#f8faff',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  resultsSection: {
    padding: 18,
  },
  depthRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 11,
  },
  depthBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  depthBtnActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  depthBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  depthBtnTextActive: {
    color: '#1d4ed8',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultEyebrow: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#172033',
    marginTop: 3,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  liveText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce3ef',
    alignItems: 'center',
  },
  statValue: {
    color: '#1e293b',
    fontSize: 19,
    fontWeight: '800',
  },
  riskStatValue: {
    color: '#ea580c',
  },
  statLabel: {
    color: '#72809a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  graphHint: {
    fontSize: 12,
    color: '#61708b',
    lineHeight: 18,
    marginTop: 10,
  },
  legendCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce3ef',
    padding: 14,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#24324c',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  legendDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 13,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: '#52627b',
    fontWeight: '700',
  },
  detailHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 10,
    marginTop: 4,
  },
  nodeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#365ec5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24324c',
  },
  nodeType: {
    fontSize: 12,
    color: '#71809a',
    marginTop: 2,
  },
  nodeDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  edgeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  edgeText: {
    fontSize: 12,
    color: '#24324c',
    fontWeight: '500',
  },
  edgeLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default GraphScreen;
