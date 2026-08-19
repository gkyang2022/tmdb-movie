export interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  rating: number;
  rating_count: number;
  poster: string;
  backdrop: string;
  year: string;
  genres: string[];
  overview: string;
  original_title: string;
  url: string;
}

export interface MediaDetail extends MediaItem {
  tagline?: string;
  status?: string;
  runtime?: number;
  languages?: string[];
  countries?: string[];
  directors: string[];
  cast: { name: string; character: string; profile: string }[];
  videos: { key: string; name: string; site: string; type: string }[];
  recommendations: MediaItem[];
}

export interface ListResponse {
  items: MediaItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface SettingsInfo {
  tmdb_api_key_masked: string;
  source: 'settings' | 'env' | 'none';
  language: string;
  image_proxy_base: string | null;
  // 网盘转存
  cookie_quark_masked: string;
  cookie_115_masked: string;
  folder_id_quark: string;
  folder_id_115: string;
  quark_folders?: { movie: string; tv: string; default: string };
  folders_115?: { movie: string; tv: string; default: string };
  // 通知
  telegram_bot_token_masked: string;
  telegram_chat_ids: string;
  discord_webhook_urls: string;
  notification_targets: string[];
  // 盘搜
  pansou_url: string;
}

export interface TrackerTask {
  id: number;
  type: 'share' | 'tmdb';
  name: string;
  shareUrl?: string;
  panType?: 'quark' | '115';
  targetFolderId?: string;
  lastFileIds?: string;
  tmdbId?: number;
  mediaType?: 'tv';
  lastKnownEpisode?: string;
  intervalValue: number;
  intervalUnit: 'minute' | 'hour' | 'day';
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'skipped';
  lastRunMessage?: string;
  status: 'active' | 'paused';
  createdAt: string;
}

export interface SearchResource {
  name: string;
  url: string;
  size?: string;
  source: string;
  time?: string;
  type: string; // 115 / quark / unknown
}

export interface TransferResult {
  ok: boolean;
  message: string;
  names?: string[];
  error?: string;
  errorType?: 'user' | 'system';
}

export interface FolderItem {
  id: string;
  name: string;
  isFolder: boolean;
}
