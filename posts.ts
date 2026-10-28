import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Author, FeedItem, NewPost, Post, PostRef, Profile } from '../types';
import { supabase } from './supabase';

// Deux sources de données, avec les mêmes fonctions :
// - le mode démo, qui garde tout sur le téléphone ;
// - Supabase, quand le serveur est configuré.
type Backend = {
  recent: () => Promise<Post[]>;
  byIds: (ids: string[]) => Promise<Post[]>;
  authors: (ids: string[]) => Promise<Record<string, Author>>;
  add: (user: Profile, input: NewPost) => Promise<string | null>;
};

// ---------- Mode démo ----------

const DEMO_KEY = 'mangi.demo.posts';
type DemoStore = { posts: Post[]; authors: Record<string, Author> };

function seed(): DemoStore {
  const now = Date.now();
  const base = { is_locked: false, coin_price: 0, original_post_id: null, linked_manga_id: null };
  return {
    authors: {
      'seed-mangaka': { id: 'seed-mangaka', username: 'kuro_exemple', role: 'mangaka' },
      'seed-eclaireur': { id: 'seed-eclaireur', username: 'theorie_exemple', role: 'eclaireur' },
    },
    posts: [
      {
        ...base,
        id: 'seed-1',
        user_id: 'seed-mangaka',
        type: 'manga_carousel',
        caption: 'Exemple : les planches de ton manga apparaîtront ici, à faire défiler.',
        media_urls: [],
        created_at: new Date(now - 3600000).toISOString(),
      },
      {
        ...base,
        id: 'seed-2',
        user_id: 'seed-eclaireur',
        type: 'text_status',
        caption: "Exemple : un éclaireur parle d'un manga et renvoie vers lui.",
        media_urls: [],
        linked_manga_id: 'seed-1',
        created_at: new Date(now - 1800000).toISOString(),
      },
    ],
  };
}

async function loadDemo(): Promise<DemoStore> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoStore;
  } catch {
    // Données illisibles : on repart des exemples.
  }
  const fresh = seed();
  await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(fresh));
  return fresh;
}

const demoBackend: Backend = {
  async recent() {
    const store = await loadDemo();
    return [...store.posts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50);
  },
  async byIds(ids) {
    const store = await loadDemo();
    return store.posts.filter((p) => ids.includes(p.id));
  },
  async authors(ids) {
    const store = await loadDemo();
    const out: Record<string, Author> = {};
    ids.forEach((id) => {
      if (store.authors[id]) out[id] = store.authors[id];
    });
    return out;
  },
  async add(user, input) {
    const store = await loadDemo();
    const post: Post = {
      id: `demo-post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: user.id,
      type: input.type,
      caption: input.caption,
      media_urls: input.images.map((i) => i.uri),
      is_locked: false,
      coin_price: 0,
      original_post_id: input.original_post_id,
      linked_manga_id: input.linked_manga_id,
      created_at: new Date().toISOString(),
    };
    store.posts.push(post);
    store.authors[user.id] = { id: user.id, username: user.username, role: user.role };
    await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(store));
    return null;
  },
};

// ---------- Supabase ----------

function extensionOf(mime: string | undefined): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function makeSupabaseBackend(client: SupabaseClient): Backend {
  return {
    async recent() {
      const { data, error } = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as Post[];
    },
    async byIds(ids) {
      const { data, error } = await client.from('posts').select('*').in('id', ids);
      if (error) throw new Error(error.message);
      return (data ?? []) as Post[];
    },
    async authors(ids) {
      const out: Record<string, Author> = {};
      if (ids.length === 0) return out;
      const { data, error } = await client.from('public_profiles').select('id, username, role').in('id', ids);
      if (error) throw new Error(error.message);
      ((data ?? []) as Author[]).forEach((a) => {
        out[a.id] = a;
      });
      return out;
    },
    async add(user, input) {
      const urls: string[] = [];
      for (let i = 0; i < input.images.length; i++) {
        const image = input.images[i];
        const mime = image.mimeType ?? 'image/jpeg';
        const path = `${user.id}/${Date.now()}-${i}.${extensionOf(mime)}`;
        const response = await fetch(image.uri);
        const bytes = await response.arrayBuffer();
        const { error } = await client.storage.from('posts').upload(path, bytes, { contentType: mime });
        if (error) return `Envoi de l'image ${i + 1} impossible : ${error.message}`;
        urls.push(client.storage.from('posts').getPublicUrl(path).data.publicUrl);
      }
      const { error } = await client.from('posts').insert({
        user_id: user.id,
        type: input.type,
        caption: input.caption,
        media_urls: urls,
        original_post_id: input.original_post_id,
        linked_manga_id: input.linked_manga_id,
      });
      if (error) {
        if (error.message.toLowerCase().includes('row-level security')) {
          return 'Publication refusée. Ton compte est peut-être restreint.';
        }
        return error.message;
      }
      return null;
    },
  };
}

const backend: Backend = supabase ? makeSupabaseBackend(supabase) : demoBackend;

// ---------- Fonctions utilisées par les écrans ----------

const UNKNOWN: Author = { id: 'inconnu', username: 'artiste inconnu', role: 'lecteur' };

async function assemble(rows: Post[]): Promise<FeedItem[]> {
  const known = new Map<string, Post>();
  rows.forEach((p) => known.set(p.id, p));

  const wanted = new Set<string>();
  rows.forEach((p) => {
    if (p.original_post_id) wanted.add(p.original_post_id);
    if (p.linked_manga_id) wanted.add(p.linked_manga_id);
  });
  const missing = Array.from(wanted).filter((id) => !known.has(id));
  if (missing.length > 0) {
    const extra = await backend.byIds(missing);
    extra.forEach((p) => known.set(p.id, p));
  }

  const authorIds = new Set<string>();
  known.forEach((p) => authorIds.add(p.user_id));
  const authors = await backend.authors(Array.from(authorIds));

  const ref = (id: string | null): PostRef | null => {
    if (!id) return null;
    const post = known.get(id);
    if (!post) return null;
    return { post, author: authors[post.user_id] ?? UNKNOWN };
  };

  return rows.map((post) => ({
    post,
    author: authors[post.user_id] ?? UNKNOWN,
    original: ref(post.original_post_id),
    linked: ref(post.linked_manga_id),
  }));
}

export async function listFeed(): Promise<FeedItem[]> {
  return assemble(await backend.recent());
}

export async function getFeedItem(id: string): Promise<FeedItem | null> {
  const rows = await backend.byIds([id]);
  if (rows.length === 0) return null;
  const items = await assemble(rows);
  return items[0] ?? null;
}

// Renvoie un message d'erreur, ou null si tout s'est bien passé.
export async function createPost(user: Profile, input: NewPost): Promise<string | null> {
  try {
    return await backend.add(user, input);
  } catch (e) {
    return e instanceof Error ? e.message : 'Publication impossible pour le moment.';
  }
}

// Smart Repost : une nouvelle publication qui pointe vers l'œuvre d'origine.
// Si on partage un repost, on pointe vers l'œuvre d'origine et non vers le repost.
export async function repostPost(user: Profile, item: FeedItem): Promise<string | null> {
  const origin = item.original ? item.original.post : item.post;
  return createPost(user, {
    type: origin.type,
    caption: null,
    images: [],
    original_post_id: origin.id,
    linked_manga_id: null,
  });
}
