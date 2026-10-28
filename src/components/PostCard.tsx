import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { roleLabel, type FeedItem } from '../types';
import { Button } from './Button';

function Pages({ uris, width }: { uris: string[]; width: number }) {
  const t = useTheme();
  const [index, setIndex] = useState(0);
  const height = Math.round(width * 1.4);

  if (uris.length === 0) {
    return (
      <View style={[styles.placeholder, { width, height, backgroundColor: t.soft, borderColor: t.ink }]}>
        <Text style={{ color: t.accent, fontWeight: '800', fontSize: 18 }}>Planche d'exemple</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={uris}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height, backgroundColor: t.soft }}
            resizeMode="cover"
            accessibilityLabel="Planche de manga"
          />
        )}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      />
      {uris.length > 1 ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1}/{uris.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type Props = {
  item: FeedItem;
  meId: string;
  onRepost?: (item: FeedItem) => void;
};

export function PostCard({ item, meId, onRepost }: Props) {
  const t = useTheme();
  const router = useRouter();
  const { width: screen } = useWindowDimensions();
  const width = screen - 32 - 2;

  // Pour un repost, on affiche l'œuvre d'origine et son créateur.
  const shown = item.original ? item.original.post : item.post;
  const owner = item.original ? item.original.author : item.author;
  const isRepost = item.original !== null;
  const canRepost = Boolean(onRepost) && owner.id !== meId && item.author.id !== meId;

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}>
      <View style={styles.pad}>
        {isRepost ? (
          <Text style={{ color: t.muted, fontWeight: '700', fontSize: 12 }}>↻ Partagé par {item.author.username}</Text>
        ) : null}
        <View style={styles.head}>
          <View style={[styles.avatar, { backgroundColor: t.accent }]}>
            <Text style={{ color: t.accentInk, fontWeight: '800', fontSize: 16 }}>
              {owner.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text style={{ color: t.ink, fontWeight: '800', fontSize: 15 }}>{owner.username}</Text>
            <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>{roleLabel(owner.role)}</Text>
          </View>
        </View>
      </View>

      {shown.type === 'manga_carousel' ? <Pages uris={shown.media_urls} width={width} /> : null}

      <View style={styles.pad}>
        {shown.caption ? <Text style={{ color: t.ink, fontSize: 15, lineHeight: 21 }}>{shown.caption}</Text> : null}

        {item.linked ? (
          <View style={[styles.linked, { borderColor: t.line, backgroundColor: t.bg }]}>
            <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>MANGA CONCERNÉ</Text>
            <Text style={{ color: t.ink, fontWeight: '700' }} numberOfLines={2}>
              {item.linked.author.username}
              {item.linked.post.caption ? ` · ${item.linked.post.caption}` : ''}
            </Text>
            <Button
              title="Ouvrir le manga"
              variant="ghost"
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.linked ? item.linked.post.id : '' } })}
            />
          </View>
        ) : null}

        {canRepost ? <Button title="Partager sur mon profil" variant="ghost" onPress={() => onRepost && onRepost(item)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  pad: { padding: 14, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  placeholder: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  counter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#111111',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  linked: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
});
