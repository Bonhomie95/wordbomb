export interface Theme {
  id: string;
  name: string;
  emoji: string;
  // Layout
  bg: string;
  surface: string;
  // Accent (buttons, active elements, progress)
  accent: string;
  accentDim: string;  // 25% opacity accent for borders/rings
  // Bomb
  bombBody: string;
  bombBorder: string;
  bombShadow: string;
  bombHighlight: string;
  // Text
  comboText: string;
  // Fuse
  fuseColor: string;
  sparkColor: string;
  sparkGlow: string;
  // Timer colours
  timerSafe: string;
  timerWarn: string;
  timerDanger: string;
}

export const THEMES: Theme[] = [
  {
    id: 'void',
    name: 'Void',
    emoji: '🌑',
    bg: '#0F0F14',
    surface: '#16161F',
    accent: '#7C6FFF',
    accentDim: 'rgba(124,111,255,0.2)',
    bombBody: '#1B1B27',
    bombBorder: '#252535',
    bombShadow: '#000',
    bombHighlight: 'rgba(255,255,255,0.06)',
    comboText: '#FFFFFF',
    fuseColor: '#7A6040',
    sparkColor: '#FFD700',
    sparkGlow: '#FFD700',
    timerSafe: '#22C55E',
    timerWarn: '#F59E0B',
    timerDanger: '#EF4444',
  },
  {
    id: 'inferno',
    name: 'Inferno',
    emoji: '🔥',
    bg: '#100500',
    surface: '#1C0A00',
    accent: '#FF5200',
    accentDim: 'rgba(255,82,0,0.2)',
    bombBody: '#200900',
    bombBorder: '#3E1500',
    bombShadow: '#600',
    bombHighlight: 'rgba(255,120,0,0.08)',
    comboText: '#FFBA70',
    fuseColor: '#8B3A00',
    sparkColor: '#FF4500',
    sparkGlow: '#FF4500',
    timerSafe: '#FF9900',
    timerWarn: '#FF5500',
    timerDanger: '#FF1100',
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    bg: '#020210',
    surface: '#07071A',
    accent: '#00FFAA',
    accentDim: 'rgba(0,255,170,0.15)',
    bombBody: '#07081E',
    bombBorder: '#0F1035',
    bombShadow: '#001020',
    bombHighlight: 'rgba(0,255,170,0.07)',
    comboText: '#00FFAA',
    fuseColor: '#006633',
    sparkColor: '#00FFFF',
    sparkGlow: '#00FFFF',
    timerSafe: '#00FF88',
    timerWarn: '#FFEE00',
    timerDanger: '#FF00AA',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    emoji: '❄️',
    bg: '#04090F',
    surface: '#081320',
    accent: '#38BDF8',
    accentDim: 'rgba(56,189,248,0.15)',
    bombBody: '#091625',
    bombBorder: '#0C2235',
    bombShadow: '#001830',
    bombHighlight: 'rgba(186,230,253,0.07)',
    comboText: '#E0F2FE',
    fuseColor: '#1E3A5F',
    sparkColor: '#BAE6FD',
    sparkGlow: '#7DD3FC',
    timerSafe: '#34D399',
    timerWarn: '#38BDF8',
    timerDanger: '#F87171',
  },
  {
    id: 'gold',
    name: 'Gold',
    emoji: '✨',
    bg: '#0A0800',
    surface: '#151100',
    accent: '#F59E0B',
    accentDim: 'rgba(245,158,11,0.18)',
    bombBody: '#1C1600',
    bombBorder: '#2D2400',
    bombShadow: '#1A0',
    bombHighlight: 'rgba(253,224,71,0.07)',
    comboText: '#FDE68A',
    fuseColor: '#6B4C00',
    sparkColor: '#FBBF24',
    sparkGlow: '#FDE68A',
    timerSafe: '#84CC16',
    timerWarn: '#F59E0B',
    timerDanger: '#EF4444',
  },
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? DEFAULT_THEME;
}
