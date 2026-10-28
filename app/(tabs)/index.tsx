import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/Card';
import { PostCard } from '../../src/components/PostCard';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { confirmAction, notify } from '../../src/lib/confirm';
import { useTheme } from '../../src/lib/theme';
import { listFeed, repostPost } from '../../src/lib/posts';
import type { FeedItem } from '../../src/types';

export default function PourToi() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await listFeed());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le fil.');
    }
    setLoading(false);
  }, []);

  // Recharge le fil à chaque fois qu'on revient sur cet onglet.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function askRepost(item: FeedItem) {
    if (!user) return;
    const owner = item.original ? item.original.author.username : item.author.username;
    const ok = await confirmAction(
      'Partager',
      `Partager la publication de ${owner} sur ton profil ? Le crédit reste à son créateur.`,
      'Partager',
    );
    if (!ok) return;
    const problem = await repostPost(user, item);
    if (problem) notify('Partage impossible', problem);
    else load();
  }

  return (
    <Screen title="Pour toi" subtitle="Le fil des publications des artistes.">
      <Button title="Publier" onPress={() => router.push('/publier')} />
      {error ? <Text style={{ color: t.danger, fontWeight: '700' }}>{error}</Text> : null}
      {loading ? <Text style={{ color: t.muted }}>Chargement…</Text> : null}
      {!loading && items.length === 0 && !error ? (
        <EmptyState title="Le fil est vide" text="Publie la première planche pour lancer la communauté." />
      ) : null}
      {user
        ? items.map((item) => <PostCard key={item.post.id} item={item} meId={user.id} onRepost={askRepost} />)
        : null}
      <Button title="Actualiser" variant="ghost" onPress={load} />
    </Screen>
  );
}
