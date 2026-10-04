import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADII } from "../theme/theme";
import StatusPill from "./StatusPill";

// Frise verticale des maquettes : pastille verte (faite / en cours) ou beige
// (à venir), trait de liaison vert après une étape faite, carte blanche
// (surlignée vert pour l'étape en cours).
// steps : [{ title, description?, icon?, state: "done"|"current"|"upcoming" }]
export default function Timeline({ steps = [] }) {
  return (
    <View>
      {steps.map((step, index) => {
        const state = step.state || "upcoming";
        const isLast = index === steps.length - 1;
        const circleBg = state === "upcoming" ? COLORS.tileBeige : COLORS.green;
        const iconName =
          step.icon ||
          (state === "done" ? "checkmark" : state === "current" ? "time" : "ellipse-outline");

        return (
          <View key={`${step.title}-${index}`} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.circle, { backgroundColor: circleBg }]}>
                <Ionicons
                  name={iconName}
                  size={15}
                  color={state === "upcoming" ? COLORS.muted : "#FFFFFF"}
                />
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: state === "done" ? COLORS.green : "#E4DACA" },
                  ]}
                />
              ) : null}
            </View>

            <View style={[styles.card, state === "current" && styles.cardCurrent]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {step.title}
                </Text>
                {state === "current" ? <StatusPill status="en_cours" small /> : null}
              </View>
              {step.description ? (
                <Text style={styles.cardDesc}>{step.description}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  rail: { width: 40, alignItems: "center" },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { width: 3, flex: 1, borderRadius: 2, marginVertical: 4 },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 14,
    marginLeft: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardCurrent: {
    backgroundColor: "#F0F6EF",
    borderColor: COLORS.green,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    flexShrink: 1,
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginRight: 8,
  },
  cardDesc: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});
