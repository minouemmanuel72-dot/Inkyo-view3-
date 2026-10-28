import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../lib/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const t = useTheme();
  const primary = variant === 'primary';
  const off = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: primary ? t.accent : 'transparent',
          borderColor: primary ? t.accent : t.line,
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? t.accentInk : t.ink} />
      ) : (
        <Text style={[styles.text, { color: primary ? t.accentInk : t.ink }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: { fontSize: 16, fontWeight: '700' },
});
