import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GraphNetwork from '../components/GraphNetwork';
import { getNetworkData } from '../services/relationshipService';
import { useAppStore } from '../store/appStore';

const NetworkScreen = ({ navigation }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedNode } = useAppStore();

  const loadNetwork = async () => {
    setLoading(true);
    try {
      const data = await getNetworkData();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNetwork(); }, []);

  const openNode = (node) => {
    setSelectedNode(node);
    navigation.navigate('NodeDetail', { node });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><MaterialIcons name="public" size={21} color="#dbeafe" /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AURA DATABASE</Text>
          <Text style={styles.title}>Entire Legal Network</Text>
          <Text style={styles.subtitle}>Every available entity, brought together in one map.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color="#1d4ed8" size="large" /><Text style={styles.loadingText}>Loading Aura network...</Text></View>
      ) : nodes.length ? (
        <>
          <View style={styles.stats}>
            <Stat value={nodes.length} label="ENTITIES" />
            <Stat value={edges.length} label="VISIBLE LINKS" />
            <TouchableOpacity style={styles.refresh} onPress={loadNetwork} accessibilityLabel="Refresh complete network">
              <MaterialIcons name="refresh" size={20} color="#1d4ed8" />
            </TouchableOpacity>
          </View>
          <GraphNetwork nodes={nodes} edges={edges} onNodePress={openNode} />
          <View style={styles.note}>
            <MaterialIcons name="info-outline" size={17} color="#36517d" />
            <Text style={styles.noteText}>All available Aura entities are shown. Tap a node to inspect it, or use the focused Graph tab to investigate one case or party.</Text>
          </View>
        </>
      ) : (
        <View style={styles.loading}><MaterialIcons name="hub" size={42} color="#94a3b8" /><Text style={styles.loadingText}>No graph entities are available yet.</Text><TouchableOpacity style={styles.retry} onPress={loadNetwork}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View>
      )}
    </ScrollView>
  );
};

const Stat = ({ value, label }) => <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f8' },
  content: { paddingBottom: 22 },
  header: { backgroundColor: '#101b34', paddingHorizontal: 20, paddingTop: 23, paddingBottom: 22, flexDirection: 'row', gap: 12 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#263f79' },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#91a8da', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#f8fbff', fontSize: 21, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#b8c8e8', fontSize: 12, lineHeight: 17, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 9, padding: 18, paddingBottom: 14 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#dce3ef', alignItems: 'center', paddingVertical: 11 },
  statValue: { color: '#1e293b', fontSize: 19, fontWeight: '800' },
  statLabel: { color: '#72809a', fontSize: 8, fontWeight: '800', letterSpacing: 0.55, marginTop: 2 },
  refresh: { width: 48, borderRadius: 12, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', gap: 9, marginHorizontal: 18, marginTop: 2, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  noteText: { flex: 1, color: '#36517d', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 90 },
  loadingText: { color: '#64748b', fontSize: 13, marginTop: 12 },
  retry: { marginTop: 14, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 9, backgroundColor: '#dbeafe' },
  retryText: { color: '#1d4ed8', fontWeight: '800', fontSize: 12 },
});

export default NetworkScreen;
