export type Role = 'mangaka' | 'eclaireur' | 'lecteur';

export type Profile = {
  id: string;
  username: string;
  role: Role;
  strikes_count: number;
  is_restricted: boolean;
  restriction_end_date: string | null;
  coins_balance: number;
  mobile_money_number: string | null;
  consistency_score: number;
};

export type PostType = 'manga_carousel' | 'short_video' | 'text_status';

export type Post = {
  id: string;
  user_id: string;
  type: PostType;
  caption: string | null;
  media_urls: string[];
  is_locked: boolean;
  coin_price: number;
  original_post_id: string | null; // Smart Repost : renvoie vers l'œuvre d'origine
  linked_manga_id: string | null; // contenu des éclaireurs : renvoie vers un manga
  created_at: string;
};

export type Author = { id: string; username: string; role: Role };

export type PostRef = { post: Post; author: Author };

// Une publication prête à afficher, avec son auteur et ses renvois.
export type FeedItem = {
  post: Post;
  author: Author;
  original: PostRef | null;
  linked: PostRef | null;
};

export type LocalImage = { uri: string; mimeType?: string };

export type NewPost = {
  type: PostType;
  caption: string | null;
  images: LocalImage[];
  original_post_id: string | null;
  linked_manga_id: string | null;
};

export const ROLES: { value: Role; label: string; help: string }[] = [
  { value: 'mangaka', label: 'Mangaka', help: 'Je crée et publie mes planches.' },
  { value: 'eclaireur', label: 'Éclaireur', help: 'Je fais découvrir des mangas par des vidéos, théories et réactions.' },
  { value: 'lecteur', label: 'Lecteur', help: 'Je lis, je soutiens et je commente.' },
];

export function roleLabel(role: Role): string {
  const found = ROLES.find((r) => r.value === role);
  return found ? found.label : role;
}
