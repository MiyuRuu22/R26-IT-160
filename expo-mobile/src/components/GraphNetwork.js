import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { buildGraphLayout } from '../utils/graphNetwork';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const VIEWPORT_HEIGHT = 460;
const CANVAS_WIDTH = 680;
const CANVAS_HEIGHT = 880;
const HIT_SIZE = 42;

const hash = (value) => String(value).split('').reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 17);
const entityColor = (node) => node.type === 'Person' ? '#4f8cff' : node.type === 'Organization' ? '#b085ff' : '#38c9b2';
const riskColor = (edge) => edge.riskScore >= 90 || edge.riskLevel === 'CRITICAL' ? '#ef4444' : edge.riskScore >= 70 || edge.riskLevel === 'HIGH' ? '#fb923c' : '#7f96ba';

const motion = (id, index, root) => {
  const seed = hash(`${id}-${index}`);
  const maximum = root ? 1.4 : index < 5 ? 3.4 : 6;
  return {
    x: Math.min(maximum, 1 + (seed % 100) / 100 * maximum),
    y: Math.min(maximum, 1 + ((seed >>> 7) % 100) / 100 * maximum),
    phaseX: (seed % 628) / 100,
    phaseY: ((seed >>> 9) % 628) / 100,
    speedX: 1 + ((seed >>> 15) % 2),
    speedY: 1 + ((seed >>> 21) % 2),
  };
};

const DotNode = ({ node, index, position, radius, rootId, activeId, clock, reducedMotion, onPress, onHover }) => {
  const profile = useMemo(() => motion(node.id, index, node.id === rootId), [node.id, index, rootId]);
  const drift = useAnimatedStyle(() => ({
    transform: [
      { translateX: reducedMotion ? 0 : Math.sin(clock.value * profile.speedX + profile.phaseX) * profile.x },
      { translateY: reducedMotion ? 0 : Math.cos(clock.value * profile.speedY + profile.phaseY) * profile.y },
    ],
  }), [reducedMotion, profile]);
  const focused = activeId === node.id;
  const dimmed = activeId && !focused;
  const showLabel = node.id === rootId || focused;

  return (
    <Animated.View style={[styles.hitTarget, { left: position.x - HIT_SIZE / 2, top: position.y - HIT_SIZE / 2, opacity: dimmed ? 0.24 : 1 }, drift]}>
      <Pressable
        accessibilityLabel={`Open ${node.label}, ${node.type}`}
        onPress={() => onPress(node)}
        onHoverIn={() => onHover(node.id)}
        onHoverOut={() => onHover(null)}
        style={styles.pressable}
      >
        {node.id === rootId && <View style={[styles.rootHalo, { width: radius * 3.2, height: radius * 3.2, borderRadius: radius * 1.6, borderColor: entityColor(node) }]} />}
        <View style={[styles.dot, { width: radius * 2, height: radius * 2, borderRadius: radius, backgroundColor: entityColor(node), transform: [{ scale: focused ? 1.45 : 1 }] }]} />
        {showLabel && <View pointerEvents="none" style={styles.tooltip}><Text numberOfLines={1} style={styles.tooltipName}>{node.label}</Text><Text style={styles.tooltipType}>{node.type}</Text></View>}
      </Pressable>
    </Animated.View>
  );
};

const LivingEdge = ({ edge, source, target, sourceProfile, targetProfile, sourceRadius, targetRadius, activeId, clock, reducedMotion }) => {
  const isRelated = activeId && (edge.source === activeId || edge.target === activeId);
  const dimmed = activeId && !isRelated;
  const pathFor = (sourceX, sourceY, targetX, targetY) => {
    'worklet';
    const dx = targetX - sourceX; const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    return `M ${sourceX + dx / distance * sourceRadius} ${sourceY + dy / distance * sourceRadius} L ${targetX - dx / distance * targetRadius} ${targetY - dy / distance * targetRadius}`;
  };
  const initialPath = pathFor(source.x, source.y, target.x, target.y);
  const animatedProps = useAnimatedProps(() => {
    const offset = (profile) => ({
      x: reducedMotion ? 0 : Math.sin(clock.value * profile.speedX + profile.phaseX) * profile.x,
      y: reducedMotion ? 0 : Math.cos(clock.value * profile.speedY + profile.phaseY) * profile.y,
    });
    const first = offset(sourceProfile); const second = offset(targetProfile);
    return { d: pathFor(source.x + first.x, source.y + first.y, target.x + second.x, target.y + second.y) };
  }, [source, target, sourceProfile, targetProfile, sourceRadius, targetRadius, reducedMotion]);
  return <AnimatedPath d={initialPath} animatedProps={animatedProps} stroke={isRelated ? riskColor(edge) : '#7890b5'} strokeWidth={isRelated ? 1.35 : 0.8} strokeOpacity={dimmed ? 0.06 : isRelated ? 0.95 : 0.3} fill="none" />;
};

const GraphNetwork = ({ nodes, edges, onNodePress }) => {
  const [viewport, setViewport] = useState({ width: 340 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const clock = useSharedValue(0);
  const scale = useSharedValue(1); const savedScale = useSharedValue(1);
  const panX = useSharedValue(0); const panY = useSharedValue(0); const savedPanX = useSharedValue(0); const savedPanY = useSharedValue(0);
  const canvasWidth = Math.max(viewport.width, CANVAS_WIDTH);
  const fitScale = Math.min(1, viewport.width / canvasWidth, VIEWPORT_HEIGHT / CANVAS_HEIGHT);
  const rootId = nodes[0]?.id;
  const degree = useMemo(() => nodes.reduce((map, node) => ({ ...map, [node.id]: edges.filter((edge) => edge.source === node.id || edge.target === node.id).length }), {}), [nodes, edges]);
  const radiusFor = (id) => id === rootId ? 7.5 : degree[id] >= 6 ? 5.5 : degree[id] >= 3 ? 4.7 : 4;
  const layout = useMemo(() => rootId ? buildGraphLayout(nodes, edges, rootId, { width: canvasWidth, height: CANVAS_HEIGHT, nodeWidth: 34, nodeHeight: 34 }) : { positions: {} }, [nodes, edges, rootId, canvasWidth]);
  const profiles = useMemo(() => nodes.reduce((map, node, index) => ({ ...map, [node.id]: motion(node.id, index, node.id === rootId) }), {}), [nodes, rootId]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion);
    return () => subscription?.remove?.();
  }, []);
  useEffect(() => {
    cancelAnimation(clock);
    if (!reducedMotion) clock.value = withRepeat(withTiming(Math.PI * 2, { duration: 16000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [clock, reducedMotion]);
  useEffect(() => { scale.value = withTiming(fitScale, { duration: 900, easing: Easing.out(Easing.cubic) }); panX.value = 0; panY.value = 0; }, [fitScale, scale, panX, panY]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: panX.value }, { translateY: panY.value }] }));
  const pinch = Gesture.Pinch().onBegin(() => { savedScale.value = scale.value; }).onUpdate((event) => { scale.value = Math.min(2.5, Math.max(fitScale, savedScale.value * event.scale)); }).onEnd(() => { scale.value = withTiming(Math.max(fitScale, scale.value), { duration: 180 }); });
  const pan = Gesture.Pan().minPointers(2).onBegin(() => { savedPanX.value = panX.value; savedPanY.value = panY.value; }).onUpdate((event) => {
    const xLimit = Math.max(0, (canvasWidth * scale.value - viewport.width) / 2);
    const yLimit = Math.max(0, (CANVAS_HEIGHT * scale.value - VIEWPORT_HEIGHT) / 2);
    panX.value = Math.min(xLimit, Math.max(-xLimit, savedPanX.value + event.translationX));
    panY.value = Math.min(yLimit, Math.max(-yLimit, savedPanY.value + event.translationY));
  });
  if (!rootId) return null;

  return <View style={[styles.viewport, { height: VIEWPORT_HEIGHT }]} onLayout={(event) => { const width = event.nativeEvent.layout.width; if (width && width !== viewport.width) setViewport({ width }); }}>
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <Animated.View style={[styles.canvas, { width: canvasWidth, height: CANVAS_HEIGHT, left: (viewport.width - canvasWidth) / 2, top: (VIEWPORT_HEIGHT - CANVAS_HEIGHT) / 2 }, zoomStyle]}>
        <View style={styles.ambientGlow} />
        <View style={styles.meta} pointerEvents="none"><Text style={styles.metaTitle}>LIVE RELATIONSHIP MAP</Text><Text style={styles.metaValue}>{nodes.length} ENTITIES · {edges.length} LINKS</Text><Text style={styles.metaHint}>PINCH TO ZOOM · TWO-FINGER DRAG TO EXPLORE</Text></View>
        <Svg width={canvasWidth} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
          {edges.map((edge) => {
            const source = layout.positions[edge.source]; const target = layout.positions[edge.target];
            if (!source || !target) return null;
            return <LivingEdge key={edge.id || `${edge.source}-${edge.target}-${edge.label}`} edge={edge} source={source} target={target} sourceProfile={profiles[edge.source]} targetProfile={profiles[edge.target]} sourceRadius={radiusFor(edge.source)} targetRadius={radiusFor(edge.target)} activeId={activeId} clock={clock} reducedMotion={reducedMotion} />;
          })}
        </Svg>
        {nodes.map((node, index) => layout.positions[node.id] && <DotNode key={node.id} node={node} index={index} position={layout.positions[node.id]} radius={radiusFor(node.id)} rootId={rootId} activeId={activeId} clock={clock} reducedMotion={reducedMotion} onPress={onNodePress} onHover={setActiveId} />)}
      </Animated.View>
    </GestureDetector>
  </View>;
};

const styles = StyleSheet.create({
  viewport: { marginBottom: 14, overflow: 'hidden', borderRadius: 22 },
  canvas: { position: 'absolute', overflow: 'hidden', borderRadius: 22, backgroundColor: '#0b1225', borderWidth: 1, borderColor: '#263a61', transformOrigin: 'center' },
  ambientGlow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: '#173766', opacity: 0.28, top: -210, right: -110 },
  meta: { position: 'absolute', top: 16, left: 17, zIndex: 3 },
  metaTitle: { color: '#8ba4d5', fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  metaValue: { color: '#d9e6ff', fontWeight: '700', fontSize: 10, marginTop: 3, letterSpacing: 0.6 },
  metaHint: { color: '#6f85ad', fontWeight: '700', fontSize: 7.5, marginTop: 5, letterSpacing: 0.5 },
  hitTarget: { position: 'absolute', width: HIT_SIZE, height: HIT_SIZE, zIndex: 2 },
  pressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#7da7ff', shadowOpacity: 0.5, shadowRadius: 5, elevation: 3 },
  rootHalo: { position: 'absolute', borderWidth: 1, opacity: 0.5 },
  tooltip: { position: 'absolute', top: HIT_SIZE - 2, minWidth: 75, maxWidth: 150, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(8, 17, 36, 0.92)', borderWidth: 1, borderColor: 'rgba(148, 180, 235, 0.35)' },
  tooltipName: { color: '#f4f8ff', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  tooltipType: { color: '#9fb4d7', fontSize: 6.5, fontWeight: '700', marginTop: 1 },
});

export default GraphNetwork;
