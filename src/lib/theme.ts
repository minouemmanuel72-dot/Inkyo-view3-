import { useColorScheme } from 'react-native';

const light = {
  bg: '#F3F4F8',
  surface: '#FFFFFF',
  ink: '#15161C',
  muted: '#646876',
  line: '#D9DCE5',
  accent: '#3446DC',
  accentInk: '#FFFFFF',
  soft: '#E5E8FC',
  danger: '#B3261E',
};

const dark: typeof light = {
  bg: '#0E0F14',
  surface: '#171922',
  ink: '#F1F2F6',
  muted: '#9A9DAD',
  line: '#2B2E3B',
  accent: '#909DFF',
  accentInk: '#0E0F14',
  soft: '#24284A',
  danger: '#FF8A80',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
