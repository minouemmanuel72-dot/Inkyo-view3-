import { Link } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Field } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/lib/theme';

export default function Connexion() {
  const { signIn, demo } = useAuth();
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <Screen title="Mangi" subtitle="Le réseau des mangakas.">
      {demo ? (
        <Card>
          <Text style={[styles.bold, { color: t.ink }]}>Mode démo</Text>
          <Text style={{ color: t.muted }}>
            Aucun serveur n'est configuré. Ton compte reste sur ce téléphone et rien n'est envoyé sur Internet.
          </Text>
        </Card>
      ) : null}
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
        autoComplete="password"
      />
      {error ? (
        <Text accessibilityRole="alert" style={[styles.bold, { color: t.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button title="Se connecter" onPress={submit} loading={busy} />
      <Link href="/inscription" style={[styles.link, { color: t.accent }]}>
        Pas encore de compte ? Crée le tien
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  link: { fontSize: 16, fontWeight: '700', textAlign: 'center', paddingVertical: 8 },
});
