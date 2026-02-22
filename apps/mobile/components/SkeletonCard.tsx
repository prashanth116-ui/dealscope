import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

interface Props {
  lines?: number;
  showMetrics?: boolean;
}

function SkeletonLine({ width, height = 14 }: { width: string | number; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.line,
        {
          width: width as number | `${number}%`,
          height,
          opacity,
        },
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3, showMetrics = true }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonLine width="65%" height={16} />
        <SkeletonLine width={60} height={20} />
      </View>
      <View style={styles.details}>
        <SkeletonLine width="45%" />
        <SkeletonLine width={70} />
      </View>
      {showMetrics && (
        <View style={styles.metrics}>
          <SkeletonLine width={60} height={18} />
          <SkeletonLine width={50} height={18} />
          <SkeletonLine width={65} height={18} />
        </View>
      )}
      {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
        <SkeletonLine key={i} width={`${70 + Math.random() * 25}%`} />
      ))}
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  line: {
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 4,
  },
});
