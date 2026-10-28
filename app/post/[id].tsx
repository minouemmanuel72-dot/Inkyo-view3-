import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/Card';
import { PostCard } from '../../src/components/PostCard';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { getFeedItem } from '../../src/lib/posts';
import { useTheme } from '../../src/lib/theme';
import type { FeedItem } from '../../src/types';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getFeedItem(String(id))
      .then((found) => {
        if (active) setItem(found);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Chargement impossible.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <Screen title="Manga">
      <Button title="Retour" variant="ghost" onPress={back} />
      {loading ? <Text style={{ color: t.muted }}>Chargement…</Text> : null}
      {error ? <Text style={{ color: t.danger, fontWeight: '700' }}>{error}</Text> : null}
      {!loading && !item && !error ? (
        <EmptyState title="Publication introuvable" text="Elle a peut-être été supprimée par son créateur." />
      ) : null}
      {item && user ? <PostCard item={item} meId={user.id} /> : null}
    </Screen>
  );
}
