import { useRef } from "react";
import { Animated, StyleSheet, Text, View, Pressable, type LayoutChangeEvent } from "react-native";

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(0);
  const startX = useRef(0);
  const currentX = useRef(0);

  const onLayout = (e: LayoutChangeEvent) => {
    rowHeight.current = e.nativeEvent.layout.height;
  };

  const DELETE_THRESHOLD = -80;

  const onTouchStart = (e: { nativeEvent: { pageX: number } }) => {
    startX.current = e.nativeEvent.pageX;
    currentX.current = 0;
  };

  const onTouchMove = (e: { nativeEvent: { pageX: number } }) => {
    const dx = e.nativeEvent.pageX - startX.current;
    if (dx < 0) {
      currentX.current = dx;
      translateX.setValue(Math.max(dx, -120));
    }
  };

  const onTouchEnd = () => {
    if (currentX.current < DELETE_THRESHOLD) {
      // Snap to show delete button
      Animated.spring(translateX, {
        toValue: -100,
        useNativeDriver: true,
      }).start();
    } else {
      // Snap back
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const snapBack = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Delete button behind */}
      <View style={styles.deleteContainer}>
        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            snapBack();
            onDelete();
          }}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      {/* Swipeable content */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  deleteContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#c00",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "80%",
    borderRadius: 8,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  content: {
    backgroundColor: "transparent",
  },
});
