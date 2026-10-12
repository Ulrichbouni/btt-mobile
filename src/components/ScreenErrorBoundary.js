import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, SPACING } from "../theme/theme";

const FALLBACK_TITLE = " Screen inaccessible";
const FALLBACK_MESSAGE =
  "Une erreur est survenue lors de l'affichage de cette écran. Réessayez ou rechargez l'application.";

// Erreur de rendu isolée : affiche un écran lisible au lieu du blanc.
export default class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En environnement de débogage uniquement : consigne l'erreur et le stack.
    // En production, on évite de polluer la console avec des traces brutes.
    if (process.env.NODE_ENV !== "production") {
      console.error("[ScreenErrorBoundary] caught render error:", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <View style={styles.iconRow}>
            <Ionicons name="warning" size={44} color={COLORS.red} />
          </View>

          <Text style={styles.title}>
            {this.props.fallbackTitle || FALLBACK_TITLE}
          </Text>

          <Text style={styles.message} numberOfLines={4}>
            {this.props.fallbackMessage || FALLBACK_MESSAGE}
          </Text>

          {this.props.children && (
            <Text style={styles.detail} numberOfLines={5}>
              {this.props.children}
            </Text>
          )}

          <View style={styles.actions}>
            <Text
              style={styles.retry}
              accessible={true}
              accessibilityRole="button"
              onPress={this.handleRetry}
            >
              {this.props.retryLabel || " Réessayer"}
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl * 2,
  },
  iconRow: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 18,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  message: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  detail: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  actions: {
    marginTop: SPACING.md,
  },
  retry: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    textDecorationLine: "underline",
  },
});
