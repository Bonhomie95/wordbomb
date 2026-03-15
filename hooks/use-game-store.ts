import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────
export interface GameStore {
  highScore: number;
  gamesPlayed: number;   // total completed games (used for interstitial gating)
  selectedTheme: string;
}

// Module-level mutable singleton — single source of truth across navigation
const STATE: GameStore = {
  highScore: 0,
  gamesPlayed: 0,
  selectedTheme: 'void',
};

const STORAGE_KEY = '@wordbomb_store_v1';

// ─────────────────────────────────────────────────────────────────────────────
// Internal event bus so components re-render on changes
// ─────────────────────────────────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach(l => l()); }

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Load persisted state once at app start (call from _layout) */
export async function loadStore(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(STATE, JSON.parse(raw));
  } catch { /* ignore */ }
}

/** Merge a partial update into the store and persist */
export function updateStore(patch: Partial<GameStore>): void {
  Object.assign(STATE, patch);
  notify();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)).catch(() => {});
}

/** React hook — re-renders on any store change */
export function useGameStore(): [GameStore, typeof updateStore] {
  const [, tick] = useState(0);

  useEffect(() => {
    const listener: Listener = () => tick(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  // Return a snapshot (spread) so value equality checks work correctly
  return [{ ...STATE }, updateStore];
}

/** Read current store value without subscribing (for callbacks) */
export function readStore(): Readonly<GameStore> {
  return STATE;
}
