import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, SectionHeader } from "../components";
import { useI18n } from "../i18n";
import { FAQ_ITEMS } from "../data/faq";
import { COLORS, FONTS, RADII, SHADOW, SPACING } from "../theme/theme";

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Correspondance par mots-clés, 100% locale (aucun appel réseau, aucune clé API).
const answerFor = (question, lang) => {
  const q = normalize(question);
  let best = null;
  let bestScore = 0;
  for (const item of FAQ_ITEMS) {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(normalize(kw))) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (best && bestScore >= 4) return best.answer[lang] || best.answer.fr;
  return null;
};

// Assistant IA (maquette) : carte de bienvenue en dégradé simulé,
// questions fréquentes cliquables et champ libre avec réponses locales.
export default function AssistantIAScreen({ navigation }) {
  const { t, lang } = useI18n();
  const [input, setInput] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [messages, setMessages] = useState([]);

  const send = useCallback(() => {
    const question = input.trim();
    if (!question) return;
    const answer =
      answerFor(question, lang) || t("assistant.fallback");
    setMessages((prev) =>
      [
        ...prev,
        { id: `u${Date.now()}`, from: "user", text: question },
        { id: `b${Date.now()}`, from: "bot", text: answer },
      ].slice(-20),
    );
    setInput("");
  }, [input, lang, t]);

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <View style={styles.pad}>
          <AppHeader showBell onBell={() => navigation?.navigate("Notifications")} />
          <SectionHeader
            icon="chatbubbles"
            tone="purple"
            title={t("assistant.title")}
            subtitle={t("assistant.subtitle")}
            langBadge
          />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.welcomeCard}>
            <View style={[styles.welcomeLayer, styles.welcomeGreen]} />
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>{t("assistant.title")}</Text>
              <Text style={styles.welcomeText}>{t("assistant.welcome")}</Text>
              {t("assistant.bullets").map((b) => (
                <Text key={b} style={styles.bullet}>
                  • {b}
                </Text>
              ))}
              <Text style={styles.ask}>{t("assistant.ask")}</Text>
            </View>
          </View>

          {messages.map((m) =>
            m.from === "user" ? (
              <View key={m.id} style={[styles.bubble, styles.bubbleUser]}>
                <Text style={styles.bubbleUserText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={[styles.bubble, styles.bubbleBot]}>
                <Text style={styles.bubbleBotText}>{m.text}</Text>
              </View>
            ),
          )}

          <Text style={styles.faqTitle}>{t("assistant.faqTitle")}</Text>

          {FAQ_ITEMS.map((item, index) => {
            const open = openFaq === index;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.faqCard}
                activeOpacity={0.85}
                onPress={() => setOpenFaq(open ? null : index)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <View style={styles.faqIcon}>
                  <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.faqBody}>
                  <Text style={styles.faqQuestion}>
                    {item.question[lang] || item.question.fr}
                  </Text>
                  {open ? (
                    <Text style={styles.faqAnswer}>
                      {item.answer[lang] || item.answer.fr}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-forward"}
                  size={16}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            );
          })}

          <Text style={styles.disclaimer}>{t("assistant.disclaimer")}</Text>
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t("assistant.inputPlaceholder")}
            placeholderTextColor={COLORS.mutedLight}
            multiline
          />
          <TouchableOpacity
            style={styles.send}
            onPress={send}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t("assistant.send")}
          >
            <Ionicons name="send" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  pad: { paddingHorizontal: SPACING.lg },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  welcomeCard: {
    borderRadius: RADII.lg,
    overflow: "hidden",
    backgroundColor: "#EFE7D8",
    marginBottom: SPACING.lg,
  },
  welcomeLayer: { ...StyleSheet.absoluteFillObject },
  welcomeGreen: {
    backgroundColor: COLORS.greenSoft,
    top: "45%",
    opacity: 0.9,
  },
  welcomeContent: { padding: SPACING.xl },
  welcomeTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 20,
    textAlign: "center",
  },
  welcomeText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 10,
  },
  bullet: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 26,
    textAlign: "center",
  },
  ask: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  bubbleUserText: { color: "#FFFFFF", fontFamily: FONTS.regular, fontSize: 14 },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    ...SHADOW.card,
  },
  bubbleBotText: { color: COLORS.ink, fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21 },
  faqTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  faqCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  faqIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.tileBeige,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  faqBody: { flex: 1 },
  faqQuestion: {
    color: COLORS.ink,
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  faqAnswer: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  disclaimer: {
    color: COLORS.mutedLight,
    fontFamily: FONTS.regular,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.field,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    color: COLORS.ink,
    fontFamily: FONTS.regular,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    minHeight: 52,
    maxHeight: 110,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
