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
import { useI18n } from "../i18n";

// Champ de formulaire beige à icône, avec label « encoché » optionnel,
// bascule œil pour les mots de passe, autofill (gestionnaires de mots de
// passe) et enchaînement clavier entre les champs.
export default function Field({
  label,
  labelBg = COLORS.bg,
  icon,
  value,
  onChangeText,
  placeholder,
  password = false,
  multiline = false,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  autoFocus = false,
  editable = true,
  error = false,
  maxLength,
  style,
  inputStyle,
}) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text style={[styles.label, { backgroundColor: labelBg }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.box,
          error && styles.boxError,
          !editable && styles.boxLocked,
          multiline && styles.boxMultiline,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={COLORS.muted}
            style={[styles.icon, multiline && styles.iconMultiline]}
          />
        ) : null}
        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mutedLight}
          secureTextEntry={password && !show}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          autoCorrect={false}
          editable={editable}
          maxLength={maxLength}
        />
        {password ? (
          <TouchableOpacity
            onPress={() => setShow((s) => !s)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={show ? t("common.hide") : t("common.show")}
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
  icon: { marginRight: 10 },
  iconMultiline: { marginTop: 6 },
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
