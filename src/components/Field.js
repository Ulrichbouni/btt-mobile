import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADII } from "../theme/theme";

// Champ de formulaire beige à icône, avec label « encoché » optionnel
// et bascule œil pour les mots de passe (comme les maquettes).
export default function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  password = false,
  multiline = false,
  keyboardType,
  autoCapitalize = "none",
  editable = true,
  error = false,
  maxLength,
  style,
  inputStyle,
}) {
  const [show, setShow] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          error && styles.boxError,
          !editable && styles.boxLocked,
          multiline && styles.boxMultiline,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={19} color={COLORS.muted} style={styles.icon} />
        ) : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mutedLight}
          secureTextEntry={password && !show}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          maxLength={maxLength}
        />
        {password ? (
          <TouchableOpacity
            onPress={() => setShow((s) => !s)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={show ? "Masquer" : "Afficher"}
          >
            <Ionicons
              name={show ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    position: "absolute",
    top: -9,
    left: 18,
    backgroundColor: COLORS.bg,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 12,
    paddingHorizontal: 6,
    zIndex: 1,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.field,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  boxMultiline: { minHeight: 120, alignItems: "flex-start", paddingVertical: 12 },
  boxError: { borderColor: COLORS.red },
  boxLocked: { backgroundColor: "#EDE7DC" },
  icon: { marginRight: 10, marginTop: multiline ? 6 : 0 },
  input: {
    flex: 1,
    color: COLORS.ink,
    fontFamily: FONTS.regular,
    fontSize: 15,
    paddingVertical: 14,
  },
  inputMultiline: {
    textAlignVertical: "top",
    paddingVertical: 0,
    marginTop: 2,
  },
});
