import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, SPACING } from "../theme/theme";

// Conteneur d'écran : fond crème, zones sûres, scroll optionnel.
export default function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ["top", "left", "right"],
  refreshControl,
  style,
  contentStyle,
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[padded && styles.padded, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  padded: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
});
