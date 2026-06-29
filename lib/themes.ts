export interface Theme {
  id: string;
  label: string;
  headerFrom: string;
  headerTo: string;
  accent: string;
  accentDeep: string;
  soft: string;
  track: string;
  screenBg?: string;
}

export const THEMES: Theme[] = [
  {
    id: 'teal',
    label: 'ターコイズ',
    headerFrom: '#17A399',
    headerTo: '#076B63',
    accent: '#0A938C',
    accentDeep: '#07615C',
    soft: '#EAF6F5',
    track: '#D8EEED',
  },
  {
    id: 'pink',
    label: 'ピンク',
    headerFrom: '#C2185B',
    headerTo: '#880E4F',
    accent: '#E91E63',
    accentDeep: '#AD1457',
    soft: '#FCE4EC',
    track: '#F8BBD0',
  },
  {
    id: 'blue',
    label: 'オーシャンブルー',
    headerFrom: '#1565C0',
    headerTo: '#0D47A1',
    accent: '#1976D2',
    accentDeep: '#1565C0',
    soft: '#E3F2FD',
    track: '#BBDEFB',
  },
  {
    id: 'orange',
    label: 'サンセットオレンジ',
    headerFrom: '#E64A19',
    headerTo: '#BF360C',
    accent: '#FF5722',
    accentDeep: '#E64A19',
    soft: '#FBE9E7',
    track: '#FFCCBC',
  },
  {
    id: 'purple',
    label: 'ラベンダー',
    headerFrom: '#6A1B9A',
    headerTo: '#4A148C',
    accent: '#8E24AA',
    accentDeep: '#6A1B9A',
    soft: '#F3E5F5',
    track: '#E1BEE7',
  },
  {
    id: 'green',
    label: 'フォレストグリーン',
    headerFrom: '#2E7D32',
    headerTo: '#1B5E20',
    accent: '#388E3C',
    accentDeep: '#2E7D32',
    soft: '#E8F5E9',
    track: '#C8E6C9',
  },
  {
    id: 'shibuya-fes',
    label: 'シブヤフェス',
    headerFrom: '#F06EA0',
    headerTo: '#5BC8D8',
    accent: '#F06EA0',
    accentDeep: '#C43E7E',
    soft: '#FDF0F7',
    track: '#F4C6D8',
    screenBg: '#FBF0F5',
  },
  {
    id: 'street-live',
    label: 'ストリートライブ',
    headerFrom: '#111111',
    headerTo: '#1a1a1a',
    accent: '#9BF238',
    accentDeep: '#E84E68',
    soft: '#141a0e',
    track: '#2a2a2a',
    screenBg: '#0e0e0e',
  },
];

export const DEFAULT_THEME_ID = 'teal';

export function getTheme(themeId?: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

export function headerGradient(theme: Theme): string {
  return `linear-gradient(160deg, ${theme.headerFrom} 0%, ${theme.headerTo} 100%)`;
}
