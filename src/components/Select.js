import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, FONTS, RADII, SHADOW } from "../theme/theme";
import { useI18n } from "../i18n";

// Sélecteur stylé « champ à icône + chevron », feuille d'options en Modal natif
// (pas de dépendance picker). options : [{ value, label }]
export default function Select({
  label,
  icon,
  value,
  options = [],
  onChange,
  placeholder = "",
  disabled = false,
  style,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.box, disabled && styles.boxLocked]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        {icon ? (
          <Ionicons name={icon} size={19} color={COLORS.muted} style={styles.icon} />
        ) : null}
        <Text
          style={[styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <SafeAreaView edges={["bottom"]} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {label || placeholder || t("common.choose")}
              </Text>
              <View style={styles.options}>
                {options.map((option) => {
                  const active = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.option, active && styles.optionActive]}
                      onPress={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          active && styles.optionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                      {active ? (
                        <Ionicons name="checkmark" size={18} color={COLORS.green} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => setOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  boxLocked: { backgroundColor: "#EDE7DC" },
  icon: { marginRight: 10 },
  value: {
    flex: 1,
    color: COLORS.ink,
    fontFamily: FONTS.medium,
    fontSize: 15,
  },
  placeholder: { color: COLORS.mutedLight, fontFamily: FONTS.regular },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(62, 42, 31, 0.45)",
    justifyContent: "flex-end",
  },
  sheetWrap: { backgroundColor: COLORS.surface, ...SHADOW.fab },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  sheetTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginBottom: 10,
  },
  options: { maxHeight: 380 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: COLORS.greenSoft },
  optionText: {
    color: COLORS.ink,
    fontFamily: FONTS.regular,
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  optionTextActive: { color: COLORS.greenDark, fontFamily: FONTS.semiBold },
  cancel: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
});
