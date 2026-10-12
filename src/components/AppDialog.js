import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Button from "./Button";
import { useI18n } from "../i18n";
import { COLORS, FONTS, RADII, SHADOW, SPACING } from "../theme/theme";

// Remplace Alert.alert sur le web : le composant natif utilise window.confirm()
// (invisible et inclicable dans le preview navigateur), cette modale React est
// réellement rendue dans le DOM.
//
// API compatible Alert.alert :
//   alert(titre)                                  → bouton "Fermer" unique
//   alert(titre, message)                         → bouton "Fermer" unique
//   alert(titre, message, [{ text, style, onPress }]) → boutons personnalisés
// `style` accepte "cancel" | "destructive" | "default" (défaut).
export default function AppDialog({ visible, title, message, buttons, onRequestClose }) {
  const { t } = useI18n();

  // Échap = même effet qu'Annuler (UX web ; Alert natif ferme aussi sur Échap).
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onRequestClose]);

  if (!visible) return null;

  const resolved =
    Array.isArray(buttons) && buttons.length
      ? buttons
      : [{ text: t("common.close"), style: "default" }];
  // Bouton par défaut utilisé quand on ferme sans choisir (fond, Échap) :
  // le premier "cancel" s'il existe, sinon le premier bouton.
  const dismissButton =
    resolved.find((b) => b.style === "cancel") || resolved[0];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => onRequestClose(dismissButton)}
    >
      <TouchableWithoutFeedback onPress={() => onRequestClose(dismissButton)}>
        <View style={styles.overlay}>
          {/* stopPropagation : un clic dans la boîte ne doit pas fermer. */}
          <View style={styles.box} onStartShouldSetResponder={() => true}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.actions}>
            {resolved.map((btn, i) => (
              <Button
                key={i}
                label={btn.text}
                variant={
                  btn.style === "cancel"
                    ? "soft"
                    : btn.style === "destructive"
                      ? "danger"
                      : "primary"
                }
                onPress={() => onRequestClose(btn)}
                style={styles.btn}
              />
            ))}
          </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Hook à instancier dans l'écran : const { alert, dialog } = useAppDialog();
// Rendre {dialog} dans le JSX, puis remplacer chaque Alert.alert( par alert(.
export function useAppDialog() {
  const [state, setState] = useState(null); // { title, message, buttons }

  const alert = useCallback((title, message, buttons) => {
    setState({ title, message, buttons });
  }, []);

  // Ferme la modale puis déclenche le onPress du bouton (comme Alert natif).
  const close = useCallback((button) => {
    setState(null);
    button?.onPress?.();
  }, []);

  const dialog = (
    <AppDialog
      visible={!!state}
      title={state?.title}
      message={state?.message}
      buttons={state?.buttons}
      onRequestClose={close}
    />
  );

  return { alert, dialog };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(62, 42, 31, 0.45)", // ink translucide
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: 22,
    ...SHADOW.card,
  },
  title: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 17,
    marginBottom: 8,
  },
  message: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  btn: { flex: 1 },
});
