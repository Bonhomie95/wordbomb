import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildSlots,
  Challenge,
  challengeHint,
  pickChallenge,
  starTimeBonus,
  validateAnswer,
} from '@/constants/challenges';
import { getTheme } from '@/constants/themes';
import { useGameStore } from '@/hooks/use-game-store';

// Offline dictionary — 66k+ words loaded once as a Set (O(1) lookups)
import WORDS from '../assets/dictionary.json';
const WORD_SET = new Set<string>(
  (WORDS as string[]).map((w) => w.toUpperCase()),
);

// ─── Ad Unit IDs ─────────────────────────────────────────────────────────────
// ⚠  Replace TestIds with your real ad unit IDs before publishing
const INTERSTITIAL_ID =
  Platform.OS === 'ios'
    ? TestIds.INTERSTITIAL // ca-app-pub-3940256099942544/4411468910
    : TestIds.INTERSTITIAL; // ca-app-pub-3940256099942544/1033173712

// ─── Layout constants ────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const BOMB_R = Math.min(SW * 0.36, 148);
const TICK_MS = 80;
const INITIAL_TIME = 30;

// ─── Game config ─────────────────────────────────────────────────────────────
function drainRate(score: number): number {
  return 1 + Math.min(score * 0.045, 1.8); // caps at 2.8×
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Phase = 'playing' | 'exploding' | 'gameover';
type Feedback = 'correct' | 'wrong' | 'used' | 'length' | null;

// ─────────────────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [store, updateStore] = useGameStore();
  const theme = getTheme(store.selectedTheme);

  // ── Game state ─────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('playing');
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [challenge, setChallenge] = useState<Challenge>(() => pickChallenge(0));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [lastWord, setLastWord] = useState('');
  const [lastBonus, setLastBonus] = useState(0);

  // Mutable refs to avoid stale closures inside the tick interval
  const phaseRef = useRef<Phase>('playing');
  const scoreRef = useRef(0);
  const timeRef = useRef(INITIAL_TIME);
  const challengeRef = useRef(challenge);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedWords = useRef<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);
  const explodingRef = useRef(false);
  const finalScore = useRef(0); // snapshot at game over

  // ── Animations ─────────────────────────────────────────────────────────────
  const bombScale = useRef(new Animated.Value(1)).current;
  const bombShakeX = useRef(new Animated.Value(0)).current;
  const feedbackOpac = useRef(new Animated.Value(0)).current;
  const explosionScale = useRef(new Animated.Value(0)).current;
  const explosionOpac = useRef(new Animated.Value(0)).current;
  const flashOpac = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);
  const panicAnim = useRef<Animated.CompositeAnimation | null>(null);

  // ── Interstitial ad setup ──────────────────────────────────────────────────
  const interstitial = useRef(
    InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    }),
  );
  const interstitialReady = useRef(false);
  const pendingAction = useRef<'replay' | 'home' | null>(null);

  useEffect(() => {
    const sub1 = interstitial.current.addAdEventListener(
      AdEventType.LOADED,
      () => {
        interstitialReady.current = true;
      },
    );
    const sub2 = interstitial.current.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        interstitialReady.current = false;
        interstitial.current.load(); // reload for next time
        const action = pendingAction.current;
        pendingAction.current = null;
        if (action === 'replay') startGame();
        else if (action === 'home') router.replace('/');
      },
    );
    const sub3 = interstitial.current.addAdEventListener(
      AdEventType.ERROR,
      () => {
        // Ad failed — just continue
        const action = pendingAction.current;
        pendingAction.current = null;
        if (action === 'replay') startGame();
        else if (action === 'home') router.replace('/');
      },
    );

    interstitial.current.load();

    return () => {
      sub1();
      sub2();
      sub3();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync refs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    challengeRef.current = challenge;
  }, [challenge]);

  // ── Pulse (speed scales with drain rate) ───────────────────────────────────
  const startPulse = useCallback(
    (rate: number) => {
      pulseAnim.current?.stop();
      const half = Math.max(120, 600 / rate);
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bombScale, {
            toValue: 1 + 0.055 * rate,
            duration: half,
            useNativeDriver: true,
          }),
          Animated.timing(bombScale, {
            toValue: 1,
            duration: half,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnim.current.start();
    },
    [bombScale],
  );

  // ── Panic shake (< 5 s) ────────────────────────────────────────────────────
  const startPanic = useCallback(() => {
    if (panicAnim.current) return;
    panicAnim.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bombShakeX, {
          toValue: -9,
          duration: 52,
          useNativeDriver: true,
        }),
        Animated.timing(bombShakeX, {
          toValue: 9,
          duration: 52,
          useNativeDriver: true,
        }),
        Animated.timing(bombShakeX, {
          toValue: -5,
          duration: 52,
          useNativeDriver: true,
        }),
        Animated.timing(bombShakeX, {
          toValue: 0,
          duration: 52,
          useNativeDriver: true,
        }),
      ]),
    );
    panicAnim.current.start();
  }, [bombShakeX]);

  const stopPanic = useCallback(() => {
    panicAnim.current?.stop();
    panicAnim.current = null;
    bombShakeX.setValue(0);
  }, [bombShakeX]);

  // ── Feedback fade ──────────────────────────────────────────────────────────
  const showFeedback = useCallback(
    (type: Feedback) => {
      setFeedback(type);
      feedbackOpac.setValue(1);
      Animated.timing(feedbackOpac, {
        toValue: 0,
        duration: 950,
        useNativeDriver: true,
      }).start(() => setFeedback(null));
    },
    [feedbackOpac],
  );

  // ── Wrong-answer jolt ──────────────────────────────────────────────────────
  const joltBomb = useCallback(() => {
    Animated.sequence([
      Animated.timing(bombShakeX, {
        toValue: -14,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(bombShakeX, {
        toValue: 14,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(bombShakeX, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(bombShakeX, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bombShakeX]);

  // ── Explosion ──────────────────────────────────────────────────────────────
  const triggerExplosion = useCallback(() => {
    if (explodingRef.current) return;
    explodingRef.current = true;

    pulseAnim.current?.stop();
    panicAnim.current?.stop();
    panicAnim.current = null;
    bombShakeX.setValue(0);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    setPhase('exploding');
    phaseRef.current = 'exploding';

    Animated.sequence([
      Animated.timing(flashOpac, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpac, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(explosionScale, {
          toValue: 6,
          speed: 4,
          bounciness: 0,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(explosionOpac, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(explosionOpac, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      explosionScale.setValue(0);
      finalScore.current = scoreRef.current;
      setPhase('gameover');
      phaseRef.current = 'gameover';
    });
  }, [bombShakeX, flashOpac, explosionScale, explosionOpac]);

  // ── Maybe show interstitial or execute action immediately ──────────────────
  const handlePostGame = useCallback(
    (action: 'replay' | 'home') => {
      const newGamesPlayed = store.gamesPlayed + 1;
      updateStore({ gamesPlayed: newGamesPlayed });

      if (newGamesPlayed % 3 === 0 && interstitialReady.current) {
        pendingAction.current = action;
        interstitial.current.show().catch(() => {
          // Show failed — proceed directly
          pendingAction.current = null;
          if (action === 'replay') startGame();
          else router.replace('/');
        });
      } else {
        if (action === 'replay') startGame();
        else router.replace('/');
      }
    },
    [store.gamesPlayed, updateStore],
  );

  // ── Start / Restart ────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const first = pickChallenge(0);
    usedWords.current = new Set();
    scoreRef.current = 0;
    timeRef.current = INITIAL_TIME;
    explodingRef.current = false;

    setPhase('playing');
    phaseRef.current = 'playing';
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setChallenge(first);
    setInput('');
    setFeedback(null);
    setLastWord('');
    setLastBonus(0);

    bombScale.setValue(1);
    bombShakeX.setValue(0);
    feedbackOpac.setValue(0);
    flashOpac.setValue(0);
    explosionScale.setValue(0);
    explosionOpac.setValue(0);

    stopPanic();
    startPulse(1);

    setTimeout(() => inputRef.current?.focus(), 160);

    timerRef.current = setInterval(() => {
      if (phaseRef.current !== 'playing') {
        clearInterval(timerRef.current!);
        return;
      }
      const rate = drainRate(scoreRef.current);
      timeRef.current -= (TICK_MS / 1000) * rate;
      const t = Math.max(0, timeRef.current);
      setTimeLeft(t);
      startPulse(rate);

      if (t <= 5 && t > 0) startPanic();
      else if (t > 5) stopPanic();

      if (t <= 0) {
        clearInterval(timerRef.current!);
        triggerExplosion();
      }
    }, TICK_MS);
  }, [
    bombScale,
    bombShakeX,
    feedbackOpac,
    flashOpac,
    explosionScale,
    explosionOpac,
    startPulse,
    startPanic,
    stopPanic,
    triggerExplosion,
  ]);

  // Start immediately when screen mounts
  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      pulseAnim.current?.stop();
      panicAnim.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit word ────────────────────────────────────────────────────────────
  const submitWord = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const word = input.trim();
    if (!word) return;

    const up = word.toUpperCase();
    const ch = challengeRef.current;

    if (usedWords.current.has(up)) {
      showFeedback('used');
      setInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    // Wrong length gives a specific hint
    if (up.length !== ch.length && WORD_SET.has(up)) {
      showFeedback('length');
      joltBomb();
      setInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    if (!validateAnswer(word, ch, WORD_SET)) {
      showFeedback('wrong');
      joltBomb();
      setInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    // ── Correct! ──────────────────────────────────────────────────────────
    usedWords.current.add(up);
    scoreRef.current += 1;
    const newScore = scoreRef.current;
    const bonus = starTimeBonus(ch.stars);
    timeRef.current = Math.min(INITIAL_TIME + 10, timeRef.current + bonus);

    setScore(newScore);
    setLastWord(word.toLowerCase());
    setLastBonus(bonus);
    setInput('');
    setChallenge(pickChallenge(newScore, ch));
    showFeedback('correct');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);

    Animated.sequence([
      Animated.timing(bombScale, {
        toValue: 0.8,
        duration: 65,
        useNativeDriver: true,
      }),
      Animated.spring(bombScale, {
        toValue: 1,
        speed: 20,
        bounciness: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, [input, showFeedback, joltBomb, bombScale]);

  // ── Update high score ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'gameover') {
      if (finalScore.current > store.highScore) {
        updateStore({ highScore: finalScore.current });
      }
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const pct = timeLeft / INITIAL_TIME;
  const fuseH = pct * 62;
  const sparkBtm = pct * 56;
  const timerColor =
    timeLeft > 12
      ? theme.timerSafe
      : timeLeft > 5
        ? theme.timerWarn
        : theme.timerDanger;
  const isNewHigh =
    phase === 'gameover' &&
    finalScore.current > 0 &&
    finalScore.current >= store.highScore;
  const slots = buildSlots(challenge);

  // Dynamic combo font size (scales with combo length)
  const comboFontSize = Math.max(
    28,
    BOMB_R * (0.68 - challenge.combo.length * 0.07),
  );
  // Slot cell width
  const slotCellW = Math.min(32, Math.floor(160 / slots.length));

  // Feedback message
  const feedbackMsg =
    feedback === 'correct'
      ? `✓  "${lastWord}"  +${lastBonus}s`
      : feedback === 'wrong'
        ? `✗  Not valid — needs "${challenge.combo}"`
        : feedback === 'used'
          ? `⚠  Already used`
          : feedback === 'length'
            ? `↔  Must be ${challenge.length} letters`
            : '';

  const feedbackColor =
    feedback === 'correct'
      ? theme.timerSafe
      : feedback === 'wrong' || feedback === 'length'
        ? theme.timerDanger
        : theme.timerWarn;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* Flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpac }]}
        pointerEvents="none"
      />

      {/* Explosion burst */}
      <Animated.View
        style={[
          styles.burst,
          {
            backgroundColor: theme.accent,
            opacity: explosionOpac,
            transform: [{ scale: explosionScale }],
            left: SW / 2 - BOMB_R,
            top: SH * 0.37 - BOMB_R,
          },
        ]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom + 8, 20),
            },
          ]}
        >
          {/* ══════════ PLAYING / EXPLODING ══════════════════════════ */}
          {(phase === 'playing' || phase === 'exploding') && (
            <>
              {/* Timer rail */}
              <View style={styles.timerRail}>
                <View
                  style={[
                    styles.timerFill,
                    {
                      width: `${pct * 100}%`,
                      backgroundColor: timerColor,
                    },
                  ]}
                />
              </View>

              {/* HUD */}
              <View style={styles.hudRow}>
                <HudCell label="SCORE" value={String(score)} />
                <Text style={[styles.hudTime, { color: timerColor }]}>
                  {timeLeft.toFixed(1)}
                  <Text style={styles.hudTimeUnit}> s</Text>
                </Text>
                <HudCell label="BEST" value={String(store.highScore)} right />
              </View>

              {/* ── Bomb stage ────────────────────────────────────── */}
              <View style={styles.bombStage}>
                {/* Fuse assembly */}
                <View style={styles.fuseWrap}>
                  {/* Spark */}
                  <View
                    style={[
                      styles.spark,
                      {
                        bottom: sparkBtm,
                        backgroundColor: theme.sparkColor,
                        shadowColor: theme.sparkGlow,
                      },
                    ]}
                  />
                  {/* Rope */}
                  <View
                    style={[
                      styles.fuseRope,
                      {
                        height: fuseH,
                        backgroundColor: theme.fuseColor,
                      },
                    ]}
                  />
                </View>

                {/* Bomb body */}
                <Animated.View
                  style={[
                    styles.bomb,
                    {
                      width: BOMB_R * 2,
                      height: BOMB_R * 2,
                      borderRadius: BOMB_R,
                      backgroundColor: theme.bombBody,
                      borderColor: theme.bombBorder,
                      shadowColor: theme.bombShadow,
                      transform: [
                        { scale: bombScale },
                        { translateX: bombShakeX },
                      ],
                    },
                  ]}
                >
                  {/* Gloss */}
                  <View
                    style={[
                      styles.bombGloss,
                      { backgroundColor: theme.bombHighlight },
                    ]}
                  />

                  {/* Stars */}
                  <View style={styles.starsBadge}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Text
                        key={n}
                        style={[
                          styles.starChar,
                          {
                            color:
                              n <= challenge.stars ? theme.accent : '#282836',
                          },
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>

                  {/* Length label */}
                  <Text style={[styles.lengthLabel, { color: '#404055' }]}>
                    {challenge.length} LETTERS
                  </Text>

                  {/* Combo text */}
                  <Text
                    style={[
                      styles.comboText,
                      {
                        fontSize: comboFontSize,
                        color: theme.comboText,
                      },
                    ]}
                  >
                    {challenge.combo}
                  </Text>

                  {/* Slot row */}
                  <View style={styles.slotRow}>
                    {slots.map((s, i) => (
                      <View
                        key={i}
                        style={[
                          styles.slotCell,
                          {
                            width: slotCellW,
                            borderColor: s.filled ? theme.accent : '#2A2A3A',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotChar,
                            {
                              color: s.filled ? theme.accent : '#2A2A3A',
                              fontSize: Math.max(9, slotCellW * 0.44),
                            },
                          ]}
                        >
                          {s.char}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Type label */}
                  <Text style={[styles.typeLabel, { color: '#404055' }]}>
                    {challenge.type === 'starts'
                      ? 'STARTS WITH'
                      : challenge.type === 'ends'
                        ? 'ENDS WITH'
                        : 'CONTAINS'}
                  </Text>
                </Animated.View>
              </View>

              {/* Feedback row */}
              <View style={styles.feedbackRow}>
                <Animated.Text
                  style={[
                    styles.feedbackText,
                    { opacity: feedbackOpac, color: feedbackColor },
                  ]}
                >
                  {feedbackMsg}
                </Animated.Text>
              </View>

              {/* Input row */}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.bombBorder,
                      color: '#FFF',
                    },
                  ]}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={submitWord}
                  placeholder={
                    phase === 'playing' ? challengeHint(challenge) : ''
                  }
                  placeholderTextColor="#333"
                  autoCorrect={false}
                  autoCapitalize="none"
                  spellCheck={false}
                  returnKeyType="go"
                  editable={phase === 'playing'}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[
                    styles.goBtn,
                    {
                      backgroundColor: theme.accent,
                      opacity: phase !== 'playing' ? 0.3 : 1,
                    },
                  ]}
                  onPress={submitWord}
                  disabled={phase !== 'playing'}
                  activeOpacity={0.75}
                >
                  <Text style={styles.goBtnText}>GO</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ══════════ GAME OVER ════════════════════════════════════ */}
          {phase === 'gameover' && (
            <View style={styles.gameOverPane}>
              <Text style={styles.boomEmoji}>💥</Text>
              <Text style={[styles.boomText, { color: theme.timerDanger }]}>
                BOOM!
              </Text>

              <Text style={[styles.finalScore, { color: '#FFF' }]}>
                {finalScore.current}
              </Text>
              <Text style={[styles.finalScoreUnit, { color: '#444' }]}>
                {finalScore.current === 1 ? 'WORD' : 'WORDS'}
              </Text>

              {isNewHigh && finalScore.current > 0 ? (
                <Text style={[styles.newHighText, { color: theme.accent }]}>
                  🏆 NEW PERSONAL BEST!
                </Text>
              ) : store.highScore > 0 ? (
                <Text style={[styles.prevHighText, { color: '#444' }]}>
                  BEST {store.highScore}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                onPress={() => handlePostGame('replay')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>PLAY AGAIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: theme.accentDim }]}
                onPress={() => handlePostGame('home')}
                activeOpacity={0.75}
              >
                <Text style={[styles.secondaryBtnText, { color: '#555' }]}>
                  HOME
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────
function HudCell({
  label,
  value,
  right,
}: {
  label: string;
  value: string;
  right?: boolean;
}) {
  return (
    <View style={[styles.hudCell, right && { alignItems: 'flex-end' }]}>
      <Text style={styles.hudCellLabel}>{label}</Text>
      <Text style={styles.hudCellValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Overlays
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 200,
  },
  burst: {
    position: 'absolute',
    width: BOMB_R * 2,
    height: BOMB_R * 2,
    borderRadius: BOMB_R,
    zIndex: 100,
  },

  // Timer
  timerRail: {
    height: 5,
    backgroundColor: '#111120',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },

  // HUD
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hudCell: { minWidth: 56 },
  hudCellLabel: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  hudCellValue: { fontSize: 22, color: '#FFF', fontWeight: '900' },
  hudTime: { fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  hudTimeUnit: { fontSize: 14, fontWeight: '400' },

  // Bomb stage
  bombStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuseWrap: {
    height: 68,
    width: 14,
    alignItems: 'center',
    position: 'relative',
    marginBottom: -2,
  },
  fuseRope: {
    position: 'absolute',
    bottom: 0,
    width: 5,
    borderRadius: 3,
  },
  spark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },

  // Bomb
  bomb: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 18,
    gap: 2,
  },
  bombGloss: {
    position: 'absolute',
    top: BOMB_R * 0.12,
    left: BOMB_R * 0.22,
    width: BOMB_R * 0.52,
    height: BOMB_R * 0.22,
    borderRadius: BOMB_R * 0.12,
    transform: [{ rotate: '-22deg' }],
  },

  // Bomb internals
  starsBadge: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: -2,
  },
  starChar: { fontSize: 11 },
  lengthLabel: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: -4,
  },
  comboText: {
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  slotCell: {
    height: 22,
    borderBottomWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 1,
  },
  slotChar: {
    fontWeight: '900',
    letterSpacing: 0,
  },
  typeLabel: {
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 2,
  },

  // Feedback
  feedbackRow: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    borderWidth: 1.5,
    fontWeight: '600',
  },
  goBtn: {
    width: 66,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
  },

  // Game over
  gameOverPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  boomEmoji: { fontSize: 72, lineHeight: 80 },
  boomText: { fontSize: 52, fontWeight: '900', letterSpacing: 8 },
  finalScore: { fontSize: 90, fontWeight: '900', lineHeight: 96 },
  finalScoreUnit: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: -10,
  },
  newHighText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  prevHighText: { fontSize: 13, letterSpacing: 2, fontWeight: '600' },
  primaryBtn: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 52,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1.5,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
