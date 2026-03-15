import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEMES, getTheme } from '@/constants/themes';
import { useGameStore } from '@/hooks/use-game-store';

// ─── Ad Unit IDs ─────────────────────────────────────────────────────────────
// ⚠  Replace with real IDs before publishing to the app store
const BANNER_ID =
  Platform.OS === 'ios'
    ? TestIds.BANNER // ca-app-pub-3940256099942544/2934735716
    : TestIds.BANNER; // ca-app-pub-3940256099942544/6300978111

// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [store, updateStore] = useGameStore();
  const theme = getTheme(store.selectedTheme);

  const handleStart = () => router.push('/game');

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────── */}
        <Text style={styles.bombIcon}>💣</Text>
        <Text style={[styles.title, { color: '#FFF' }]}>WORD{'\n'}BOMB</Text>
        <Text style={[styles.tagline, { color: '#555' }]}>
          Type the right word before the bomb explodes.
        </Text>

        {/* ── High Score ────────────────────────────────────────── */}
        {store.highScore > 0 && (
          <View
            style={[
              styles.hsBadge,
              { backgroundColor: theme.surface, borderColor: theme.accentDim },
            ]}
          >
            <Text style={[styles.hsLabel, { color: '#555' }]}>
              PERSONAL BEST
            </Text>
            <Text style={[styles.hsValue, { color: theme.accent }]}>
              {store.highScore}{' '}
              <Text style={styles.hsUnit}>
                word{store.highScore !== 1 ? 's' : ''}
              </Text>
            </Text>
          </View>
        )}

        {/* ── Theme Picker ──────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardLabel, { color: '#555' }]}>BOMB SKIN</Text>
          <View style={styles.themeRow}>
            {THEMES.map((t) => {
              const selected = t.id === store.selectedTheme;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => updateStore({ selectedTheme: t.id })}
                  style={[
                    styles.themePill,
                    {
                      backgroundColor: t.bombBody,
                      borderColor: selected ? t.accent : 'transparent',
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.themeEmoji}>{t.emoji}</Text>
                  <Text
                    style={[
                      styles.themeName,
                      { color: selected ? t.accent : '#555' },
                    ]}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── How to play ───────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardLabel, { color: '#555' }]}>HOW TO PLAY</Text>
          <Rule
            icon="💣"
            text="A challenge appears on the bomb — e.g. 4-letter word starting with GR"
          />
          <Rule
            icon="⌨️"
            text="Type a valid word matching the rule and press GO"
          />
          <Rule
            icon="⏱"
            text="Each correct word adds seconds back to the clock"
          />
          <Rule
            icon="⭐"
            text="Harder challenges (more stars) give more bonus time"
          />
          <Rule icon="🔥" text="The bomb speeds up as your score climbs" />
          <Rule icon="📴" text="Fully offline — no internet needed" />
        </View>

        {/* ── Star legend ───────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardLabel, { color: '#555' }]}>DIFFICULTY</Text>
          {(
            [
              [1, '3–4 letter words, simple starts / ends'],
              [2, '5-letter words, more combos'],
              [3, '6-letter words, 3-letter combos'],
              [4, '7-letter words, hard combos'],
              [5, '8–9 letter words, expert level'],
            ] as [number, string][]
          ).map(([stars, desc]) => (
            <View key={stars} style={styles.starRow}>
              <Text style={styles.starRowIcons}>
                {'★'.repeat(stars)}
                {'☆'.repeat(5 - stars)}
              </Text>
              <Text style={[styles.starRowDesc, { color: '#666' }]}>
                {desc}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Start button ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: theme.accent }]}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>START GAME</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Banner Ad ─────────────────────────────────────────────── */}
      <View
        style={[
          styles.bannerWrap,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <BannerAd
          unitId={BANNER_ID}
          size={BannerAdSize.BANNER}
          onAdFailedToLoad={() => {
            /* silent fail */
          }}
        />
      </View>
    </View>
  );
}

// ─── Tiny helper ─────────────────────────────────────────────────────────────
function Rule({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleIcon}>{icon}</Text>
      <Text style={[styles.ruleText, { color: '#888' }]}>{text}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },

  bombIcon: { fontSize: 64, lineHeight: 72, marginBottom: -8 },
  title: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
    lineHeight: 56,
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },

  // High score badge
  hsBadge: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  hsLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  hsValue: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  hsUnit: { fontSize: 14, fontWeight: '400' },

  // Cards
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 2,
  },

  // Theme picker
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  themePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
  },
  themeEmoji: { fontSize: 20 },
  themeName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Rules
  ruleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ruleIcon: { fontSize: 16, width: 24, marginTop: 1 },
  ruleText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Star legend
  starRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  starRowIcons: { fontSize: 12, color: '#F59E0B', letterSpacing: 1, width: 76 },
  starRowDesc: { flex: 1, fontSize: 12, lineHeight: 16 },

  // Start button
  startBtn: {
    marginTop: 4,
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 18,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  // Banner
  bannerWrap: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
