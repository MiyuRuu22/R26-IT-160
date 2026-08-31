import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getRiskPropagation } from '../services/relationshipService';

const NodeDetailScreen = ({ route, navigation }) => {
  const { node, connectionContext } = route.params || {};
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node?.label || node?.name) {
      loadRiskPropagation();
    }
  }, [node]);

  const loadRiskPropagation = async () => {
    try {
      setLoading(true);
      const nodeName = node.label || node.name || node.id;
      const data = await getRiskPropagation(nodeName);
      setRiskData(data);
    } catch (error) {
      console.log('Risk data not available:', error.message);
      // Risk propagation is optional
    } finally {
      setLoading(false);
    }
  };

  if (!node) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No node data available</Text>
      </View>
    );
  }

  const nodeLabel = node.label || node.name || node.id || 'Unknown';
  const nodeType = node.type || 'Unknown';
  const searchableType = ['Person', 'Organization', 'Case'].includes(nodeType) ? nodeType : 'Person';
  const exploreNode = () => {
    navigation.navigate('Graph', {
      screen: 'GraphMain',
      params: { searchValue: nodeLabel, entityType: searchableType, depth: 2 },
    });
  };
  const formatRelationship = (relationship) => String(relationship || 'RELATED_TO').replace(/_/g, ' ').toLowerCase();
  const visibleProperties = {
    ...(node.properties || {}),
    ...Object.fromEntries(
      Object.entries(node).filter(([key]) => !['id', 'label', 'name', 'type', 'properties', 'distance', 'riskScore', 'riskLevel'].includes(key))
    ),
  };
  const sourceFile = node.properties?.sourceFile;
  const dataSource = node.properties?.dataSource;

  return (
    <ScrollView style={styles.container}>
      {/* Node Header */}
      <View style={styles.headerCard}>
        <View
          style={[
            styles.typeIcon,
            {
              backgroundColor: getColorForNodeType(nodeType),
            },
          ]}
        >
          <MaterialIcons
            name={getIconForNodeType(nodeType)}
            size={32}
            color="#fff"
          />
        </View>

        <Text style={styles.nodeTitle}>{nodeLabel}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{nodeType}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel={`Search ${nodeLabel} in the relationship graph`}
          style={styles.exploreButton}
          onPress={exploreNode}
        >
          <MaterialIcons name="account-tree" size={18} color="#fff" />
          <Text style={styles.exploreButtonText}>Explore {nodeType} network</Text>
        </TouchableOpacity>
      </View>

      {/* Why this node appears */}
      {connectionContext && (
        <View style={[styles.section, styles.explanationSection]}>
          <View style={styles.explanationHeader}>
            <View style={styles.explanationIcon}>
              <MaterialIcons name="account-tree" size={19} color="#1d4ed8" />
            </View>
            <View style={styles.explanationCopy}>
              <Text style={styles.sectionTitle}>Why this appears</Text>
              <Text style={styles.explanationLead}>
                {connectionContext.isRoot
                  ? `This is the searched ${String(connectionContext.rootType || 'entity').toLowerCase()} at the centre of the investigation.`
                  : `This ${nodeType.toLowerCase()} is connected to ${connectionContext.rootLabel} through the visible investigation path.`}
              </Text>
            </View>
          </View>

          {!connectionContext.isRoot && connectionContext.path?.length > 0 && (
            <View style={styles.pathCard}>
              <Text style={styles.pathEyebrow}>SHORTEST VISIBLE PATH · {connectionContext.path.length} HOP{connectionContext.path.length === 1 ? '' : 'S'}</Text>
              {connectionContext.path.map((step, index) => (
                <View key={`${step.from}-${step.relationship}-${index}`} style={styles.pathStep}>
                  <Text style={styles.pathEntity}>{step.from}</Text>
                  <View style={styles.pathRelationRow}>
                    <View style={[styles.pathLine, { backgroundColor: getRiskColor(step.riskLevel) }]} />
                    <Text style={styles.pathRelationship}>{formatRelationship(step.relationship)}</Text>
                  </View>
                  <Text style={styles.pathEntity}>{step.to}</Text>
                </View>
              ))}
            </View>
          )}

          {connectionContext.directConnections?.length > 0 && (
            <View style={styles.evidenceBlock}>
              <Text style={styles.evidenceTitle}>Immediate relationship evidence</Text>
              {connectionContext.directConnections.map((connection, index) => (
                <View key={`${connection.entity}-${connection.label}-${index}`} style={styles.evidenceRow}>
                  <View style={[styles.evidenceDot, { backgroundColor: getRiskColor(connection.riskLevel) }]} />
                  <Text style={styles.evidenceText}>
                    {formatRelationship(connection.label)} · {connection.entity}
                  </Text>
                  <Text style={styles.evidenceType}>{connection.entityType}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {(sourceFile || dataSource) && (
        <View style={styles.provenanceCard}>
          <MaterialIcons name="verified-user" size={19} color="#0f766e" />
          <View style={styles.provenanceCopy}>
            <Text style={styles.provenanceTitle}>Graph evidence</Text>
            <Text style={styles.provenanceText}>{dataSource || 'Extracted relationship record'}</Text>
            {sourceFile && <Text style={styles.provenanceFile}>{sourceFile}</Text>}
          </View>
        </View>
      )}

      {/* Node Properties */}
      {Object.keys(visibleProperties).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties</Text>
          <View style={styles.propertiesContainer}>
            {Object.entries(visibleProperties)
              .map(([key, value]) => (
                <View key={key} style={styles.propertyRow}>
                  <Text style={styles.propertyKey}>{key}</Text>
                  <Text style={styles.propertyValue}>
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Risk Propagation */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading risk analysis...</Text>
        </View>
      ) : riskData ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Propagation</Text>
          {riskData.riskScore && (
            <View style={styles.riskCard}>
              <View style={styles.riskHeader}>
                <Text style={styles.riskLabel}>Overall Risk Score</Text>
                <View
                  style={[
                    styles.riskScore,
                    {
                      backgroundColor: getRiskColor(riskData.riskScore),
                    },
                  ]}
                >
                  <Text style={styles.riskScoreText}>
                    {riskData.riskScore.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {riskData.connectedEntities && (
            <View style={styles.entitiesContainer}>
              <Text style={styles.subTitle}>Connected Entities</Text>
              {riskData.connectedEntities.map((entity, idx) => (
                <TouchableOpacity key={idx} style={styles.entityItem}>
                  <View style={styles.entityBullet} />
                  <View style={styles.entityInfo}>
                    <Text style={styles.entityName}>{entity.name}</Text>
                    <Text style={styles.entityType}>{entity.type}</Text>
                  </View>
                  {entity.riskLevel && (
                    <View
                      style={[
                        styles.riskBadge,
                        {
                          backgroundColor: getRiskColor(entity.riskLevel),
                        },
                      ]}
                    >
                      <Text style={styles.riskBadgeText}>
                        {entity.riskLevel}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="share" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="file-download" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

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

const getRiskColor = (score) => {
  if (typeof score === 'number') {
    if (score > 10) {
      if (score >= 90) return '#dc2626';
      if (score >= 70) return '#f97316';
      if (score >= 40) return '#eab308';
      return '#22c55e';
    }
    if (score >= 7) return '#FF3B30';
    if (score >= 4) return '#FF9500';
    return '#34C759';
  }
  if (typeof score === 'string') {
    const lower = score.toLowerCase();
    if (lower.includes('critical')) return '#dc2626';
    if (lower.includes('high')) return '#FF3B30';
    if (lower.includes('medium')) return '#FF9500';
    if (lower.includes('low')) return '#34C759';
  }
  return '#999';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  typeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nodeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
  },
  explanationSection: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
  },
  explanationHeader: {
    flexDirection: 'row',
    gap: 11,
  },
  explanationIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  explanationCopy: {
    flex: 1,
  },
  explanationLead: {
    color: '#52627b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: -7,
  },
  pathCard: {
    backgroundColor: '#fff',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#dbe5f4',
    padding: 11,
    marginTop: 14,
  },
  pathEyebrow: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.65,
    marginBottom: 8,
  },
  pathStep: {
    paddingVertical: 6,
  },
  pathEntity: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },
  pathRelationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginVertical: 4,
  },
  pathLine: {
    width: 2,
    height: 13,
    borderRadius: 2,
    marginLeft: 5,
  },
  pathRelationship: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  evidenceBlock: {
    marginTop: 14,
  },
  evidenceTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef8',
  },
  evidenceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  evidenceText: {
    flex: 1,
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1d4ed8',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 15,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  evidenceType: {
    color: '#71809a',
    fontSize: 10,
    fontWeight: '700',
  },
  provenanceCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 13,
    marginTop: 12,
    marginHorizontal: 12,
  },
  provenanceCopy: {
    flex: 1,
  },
  provenanceTitle: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },
  provenanceText: {
    color: '#287a49',
    fontSize: 11,
    marginTop: 2,
  },
  provenanceFile: {
    color: '#4b8e64',
    fontSize: 10,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  propertiesContainer: {
    gap: 12,
  },
  propertyRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  propertyKey: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  riskCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  riskScore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskScoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  entitiesContainer: {
    marginTop: 16,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  entityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  entityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  entityType: {
    fontSize: 11,
    color: '#999',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#999',
  },
});

export default NodeDetailScreen;
