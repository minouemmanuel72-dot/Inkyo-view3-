import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Field } from '../src/components/Field';
import { Screen } from '../src/components/Screen';
import { useAuth } from '../src/context/AuthContext';
import { createPost, listFeed } from '../src/lib/posts';
import { useTheme } from '../src/lib/theme';
import type { FeedItem, LocalImage } from '../src/types';

type Kind = 'planches' | 'statut';

const MAX_IMAGES = 8;

export default function Publier() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTheme();

  const isMangaka = user ? user.role === 'mangaka' : false;
  const isEclaireur = user ? user.role === 'eclaireur' : false;

  const [kind, setKind] = useState<Kind>(isMangaka ? 'planches' : 'statut');
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [mangas, setMangas] = useState<FeedItem[]>([]);
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Un éclaireur doit choisir le manga dont il parle.
  useEffect(() => {
    if (!isEclaireur) return;
    let active = true;
    listFeed()
      .then((items) => {
        if (active) setMangas(items.filter((i) => i.post.type === 'manga_carousel' && !i.original).slice(0, 20));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isEclaireur]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function pick() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorise l'accès aux photos pour ajouter des planches.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    const added: LocalImage[] = result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? undefined }));
    setImages((prev) => [...prev, ...added].slice(0, MAX_IMAGES));
  }

  async function submit() {
    if (!user) return;
    setError(null);
    if (user.is_restricted) return setError("Ton compte est restreint, tu ne peux pas publier pour l'instant.");
    if (kind === 'planches' && images.length === 0) return setError('Ajoute au moins une planche.');
    if (kind === 'statut' && caption.trim().length < 3) return setError('Écris au moins quelques mots.');
    if (isEclaireur && !linkedId) return setError('Choisis le manga dont tu parles.');

    setBusy(true);
    const problem = await createPost(user, {
      type: kind === 'planches' ? 'manga_carousel' : 'text_status',
      caption: caption.trim() ? caption.trim() : null,
      images: kind === 'planches' ? images : [],
      original_post_id: null,
      linked_manga_id: isEclaireur ? linkedId : null,
    });
    setBusy(false);
    if (problem) setError(problem);
    else close();
  }

  if (!user) return null;

  return (
    <Screen title="Publier" subtitle="Partage tes planches ou ton avis.">
      {isMangaka ? (
        <View style={styles.row}>
          {(['planches', 'statut'] as Kind[]).map((k) => {
            const selected = k === kind;
            return (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setKind(k)}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? t.accent : t.surface, borderColor: selected ? t.accent : t.line },
                ]}
              >
                <Text style={{ color: selected ? t.accentInk : t.ink, fontWeight: '700' }}>
                  {k === 'planches' ? 'Planches' : 'Statut'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={{ color: t.muted }}>
          {isEclaireur
            ? 'Éclaireur : tu parles d’un manga, la publication renvoie vers lui.'
            : 'Lecteur : tu peux publier un statut. Les planches sont réservées aux mangakas.'}
        </Text>
      )}

      {kind === 'planches' ? (
        <View style={styles.gap}>
          <View style={styles.thumbs}>
            {images.map((img, i) => (
              <View key={`${i}-${img.uri}`} style={[styles.thumb, { borderColor: t.ink }]}>
                <Image source={{ uri: img.uri }} style={styles.thumbImg} resizeMode="cover" />
                <Pressable
                  accessibilityLabel={`Retirer la planche ${i + 1}`}
                  onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  style={styles.remove}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
          <Button
            title={images.length === 0 ? 'Choisir des planches' : `Ajouter des planches (${images.length}/${MAX_IMAGES})`}
            variant="ghost"
            onPress={pick}
            disabled={images.length >= MAX_IMAGES}
          />
        </View>
      ) : null}

      {isEclaireur ? (
        <View style={styles.gap}>
          <Text style={[styles.label, { color: t.ink }]}>Manga concerné</Text>
          {mangas.length === 0 ? (
            <Text style={{ color: t.muted }}>Aucun manga publié pour l'instant. Reviens quand un mangaka aura publié.</Text>
          ) : (
            mangas.map((m) => {
              const selected = m.post.id === linkedId;
              return (
                <Pressable
                  key={m.post.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setLinkedId(m.post.id)}
                  style={[
                    styles.manga,
                    { backgroundColor: selected ? t.soft : t.surface, borderColor: selected ? t.accent : t.line },
                  ]}
                >
                  <Text style={{ color: t.ink, fontWeight: '700' }}>{m.author.username}</Text>
                  <Text style={{ color: t.muted }} numberOfLines={2}>
                    {m.post.caption ?? 'Sans description'}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}

      <Field
        label={kind === 'planches' ? 'Description (facultatif)' : 'Ton texte'}
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={400}
        style={styles.multiline}
      />

      {error ? (
        <Text accessibilityRole="alert" style={{ color: t.danger, fontWeight: '700' }}>
          {error}
        </Text>
      ) : null}
      <Button title="Publier" onPress={submit} loading={busy} />
      <Button title="Annuler" variant="ghost" onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  gap: { gap: 10 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10 },
  label: { fontSize: 14, fontWeight: '700' },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 84, aspectRatio: 5 / 7, borderWidth: 1.5, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manga: { borderWidth: 2, borderRadius: 12, padding: 12, gap: 2 },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
});
