import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/lib/theme';
import { ROLES, type Role } from '../../src/types';

export default function Inscription() {
  const { signUp } = useAuth();
  const t = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mangaka');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setInfo(null);
    const name = username.trim();
    if (name.length < 3) return setError('Choisis un pseudo de 3 caractères minimum.');
    if (!email.includes('@')) return setError('Entre une adresse e-mail valide.');
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    setBusy(true);
    const result = await signUp({ email: email.trim(), password, username: name, role });
    setBusy(false);
    if (result.error) setError(result.error);
    if (result.info) setInfo(result.info);
  }

  return (
    <Screen title="Créer mon compte" subtitle="Choisis ton rôle, tu pourras le préciser plus tard.">
      <Field label="Pseudo" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
      />

      <Text style={[styles.label, { color: t.ink }]}>Ton rôle</Text>
      <View style={styles.roles}>
        {ROLES.map((r) => {
          const selected = r.value === role;
          return (
            <Pressable
              key={r.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setRole(r.value)}
              style={[
                styles.role,
                {
                  backgroundColor: selected ? t.soft : t.surface,
                  borderColor: selected ? t.accent : t.line,
                },
              ]}
            >
              <Text style={[styles.roleTitle, { color: t.ink }]}>{r.label}</Text>
              <Text style={{ color: t.muted }}>{r.help}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={[styles.label, { color: t.danger }]}>
          {error}
        </Text>
      ) : null}
      {info ? <Text style={[styles.label, { color: t.accent }]}>{info}</Text> : null}
      <Button title="Créer mon compte" onPress={submit} loading={busy} />
      <Link href="/connexion" style={[styles.link, { color: t.accent }]}>
        J'ai déjà un compte
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700' },
  roles: { gap: 10 },
  role: { borderWidth: 2, borderRadius: 14, padding: 14, gap: 4 },
  roleTitle: { fontSize: 16, fontWeight: '700' },
  link: { fontSize: 16, fontWeight: '700', textAlign: 'center', paddingVertical: 8 },
});
