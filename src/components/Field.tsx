import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../lib/theme';

type Props = TextInputProps & { label: string };

export function Field({ label, style, ...props }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: t.ink }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.muted}
        accessibilityLabel={label}
        {...props}
        style={[styles.input, { borderColor: t.line, backgroundColor: t.surface, color: t.ink }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
