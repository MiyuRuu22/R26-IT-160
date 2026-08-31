import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { buildGraphLayout } from '../utils/graphNetwork';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const HEIGHT = 460;
const WIDTH = 680;
const hash = (value) => String(value).split('').reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 7);
const nodeColor = (node) => node.type === 'Person' ? '#2563eb' : node.type === 'Organization' ? '#7c3aed' : '#0f766e';
const riskColor = (edge) => edge.riskScore >= 90 ? '#dc2626' : edge.riskScore >= 70 ? '#f97316' : edge.riskScore >= 40 ? '#eab308' : '#22c55e';
const metricsFor = (count) => count > 20 ? { width: 64, height: 34, name: 7.5, type: 5.5 } : count > 10 ? { width: 78, height: 40, name: 8.5, type: 6.5 } : { width: 96, height: 46, name: 10, type: 7 };
const profile = (id, index, root) => {
  const seed = hash(`${id}-${index}`); const maximum = root ? 0.8 : 3;
  return { x: 1 + seed % 100 / 100 * maximum, y: 1 + (seed >>> 7) % 100 / 100 * maximum, px: seed % 628 / 100, py: (seed >>> 9) % 628 / 100, sx: 1 + (seed >>> 15) % 2, sy: 1 + (seed >>> 21) % 2 };
};

const FocusedNode = ({ node, index, position, rootId, metrics, clock, reducedMotion, onPress }) => {
  const motion = useMemo(() => profile(node.id, index, node.id === rootId), [node.id, index, rootId]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: reducedMotion ? 0 : Math.sin(clock.value * motion.sx + motion.px) * motion.x }, { translateY: reducedMotion ? 0 : Math.cos(clock.value * motion.sy + motion.py) * motion.y }] }), [reducedMotion, motion]);
  return <Animated.View style={[styles.nodeWrap, { width: metrics.width, height: metrics.height, left: position.x - metrics.width / 2, top: position.y - metrics.height / 2 }, style]}>
    <TouchableOpacity accessibilityLabel={`Open ${node.label}`} style={[styles.node, node.id === rootId && styles.rootNode, { backgroundColor: nodeColor(node) }]} onPress={() => onPress(node)}>
      <Text numberOfLines={2} style={[styles.nodeName, { fontSize: metrics.name }]}>{node.label}</Text>
      <Text style={[styles.nodeType, { fontSize: metrics.type }]}>{node.id === rootId ? 'SEARCH FOCUS' : node.type}</Text>
    </TouchableOpacity>
  </Animated.View>;
};

const FocusedEdge = ({ edge, source, target, sourceProfile, targetProfile, clock, reducedMotion }) => {
  const path = (sx, sy, tx, ty) => { 'worklet'; return `M ${sx} ${sy} Q ${(sx + tx) / 2 + (ty - sy) * 0.1} ${(sy + ty) / 2 - (tx - sx) * 0.1} ${tx} ${ty}`; };
  const initial = path(source.x, source.y, target.x, target.y);
  const props = useAnimatedProps(() => {
    const drift = (item) => ({ x: reducedMotion ? 0 : Math.sin(clock.value * item.sx + item.px) * item.x, y: reducedMotion ? 0 : Math.cos(clock.value * item.sy + item.py) * item.y });
    const first = drift(sourceProfile); const second = drift(targetProfile);
    return { d: path(source.x + first.x, source.y + first.y, target.x + second.x, target.y + second.y) };
  }, [source, target, sourceProfile, targetProfile, reducedMotion]);
  const color = riskColor(edge);
  return <><AnimatedPath d={initial} animatedProps={props} stroke={color} strokeWidth={4} strokeOpacity={0.14} fill="none" /><AnimatedPath d={initial} animatedProps={props} stroke={color} strokeWidth={1.5} strokeOpacity={0.88} strokeLinecap="round" fill="none" /></>;
};

const FocusedGraphNetwork = ({ nodes, edges, onNodePress }) => {
  const [viewport, setViewport] = useState({ width: 340 }); const [reducedMotion, setReducedMotion] = useState(false);
  const clock = useSharedValue(0); const scale = useSharedValue(1); const savedScale = useSharedValue(1); const panX = useSharedValue(0); const panY = useSharedValue(0); const savedPanX = useSharedValue(0); const savedPanY = useSharedValue(0);
  const rootId = nodes[0]?.id; const metrics = metricsFor(nodes.length); const canvasWidth = Math.max(viewport.width, WIDTH); const fit = Math.min(1, viewport.width / canvasWidth, HEIGHT / 880);
  const layout = useMemo(() => rootId ? buildGraphLayout(nodes, edges, rootId, { width: canvasWidth, height: 880, nodeWidth: metrics.width + 10, nodeHeight: metrics.height + 10 }) : { positions: {} }, [nodes, edges, rootId, canvasWidth, metrics.width, metrics.height]);
  const profiles = useMemo(() => nodes.reduce((map, node, index) => ({ ...map, [node.id]: profile(node.id, index, node.id === rootId) }), {}), [nodes, rootId]);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion); const event = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion); return () => event?.remove?.(); }, []);
  useEffect(() => { cancelAnimation(clock); if (!reducedMotion) clock.value = withRepeat(withTiming(Math.PI * 2, { duration: 18000, easing: Easing.linear }), -1, false); return () => cancelAnimation(clock); }, [clock, reducedMotion]);
  useEffect(() => { scale.value = withTiming(fit, { duration: 500 }); panX.value = 0; panY.value = 0; }, [fit, scale, panX, panY]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: panX.value }, { translateY: panY.value }] }));
  const pinch = Gesture.Pinch().onBegin(() => { savedScale.value = scale.value; }).onUpdate((event) => { scale.value = Math.min(2.4, Math.max(fit, savedScale.value * event.scale)); });
  const pan = Gesture.Pan().minPointers(2).onBegin(() => { savedPanX.value = panX.value; savedPanY.value = panY.value; }).onUpdate((event) => { const x = Math.max(0, (canvasWidth * scale.value - viewport.width) / 2); const y = Math.max(0, (880 * scale.value - HEIGHT) / 2); panX.value = Math.min(x, Math.max(-x, savedPanX.value + event.translationX)); panY.value = Math.min(y, Math.max(-y, savedPanY.value + event.translationY)); });
  if (!rootId) return null;
  return <View style={[styles.viewport, { height: HEIGHT }]} onLayout={(event) => { const width = event.nativeEvent.layout.width; if (width && width !== viewport.width) setViewport({ width }); }}><GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}><Animated.View style={[styles.canvas, { width: canvasWidth, height: 880, left: (viewport.width - canvasWidth) / 2, top: (HEIGHT - 880) / 2 }, zoomStyle]}><View style={styles.glow} /><View style={styles.meta} pointerEvents="none"><Text style={styles.metaTitle}>LIVE RELATIONSHIP MAP</Text><Text style={styles.metaValue}>{nodes.length} ENTITIES · {edges.length} LINKS</Text></View><Svg width={canvasWidth} height={880} style={StyleSheet.absoluteFill}>{edges.map((edge) => { const source = layout.positions[edge.source]; const target = layout.positions[edge.target]; return source && target ? <FocusedEdge key={edge.id || `${edge.source}-${edge.target}`} edge={edge} source={source} target={target} sourceProfile={profiles[edge.source]} targetProfile={profiles[edge.target]} clock={clock} reducedMotion={reducedMotion} /> : null; })}</Svg>{nodes.map((node, index) => layout.positions[node.id] && <FocusedNode key={node.id} node={node} index={index} position={layout.positions[node.id]} rootId={rootId} metrics={metrics} clock={clock} reducedMotion={reducedMotion} onPress={onNodePress} />)}</Animated.View></GestureDetector></View>;
};

const styles = StyleSheet.create({ viewport: { marginBottom: 14, overflow: 'hidden', borderRadius: 22 }, canvas: { position: 'absolute', overflow: 'hidden', borderRadius: 22, backgroundColor: '#0b1225', borderWidth: 1, borderColor: '#263a61', transformOrigin: 'center' }, glow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#172f63', opacity: 0.5, top: -145, right: -70 }, meta: { position: 'absolute', top: 16, left: 16, zIndex: 2 }, metaTitle: { color: '#8ba4d5', fontWeight: '800', fontSize: 10, letterSpacing: 1 }, metaValue: { color: '#eef4ff', fontWeight: '600', fontSize: 11, marginTop: 3 }, nodeWrap: { position: 'absolute' }, node: { flex: 1, borderRadius: 13, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 7, elevation: 5 }, rootNode: { borderWidth: 2, borderColor: '#fff' }, nodeName: { color: '#fff', lineHeight: 12, fontWeight: '700', textAlign: 'center' }, nodeType: { color: 'rgba(255,255,255,0.76)', fontWeight: '800', letterSpacing: 0.5, marginTop: 2 } });

export default FocusedGraphNetwork;
