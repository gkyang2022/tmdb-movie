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
}
