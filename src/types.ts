export type ManagedApp = {
  id: string; name: string; slug: string; iosBundleId: string | null; androidPackage: string | null;
  appStoreUrl: string | null; playStoreUrl: string | null; asoBeastAppId: string | null;
  color: string; status: 'development' | 'review' | 'live'; createdAt: string; updatedAt: string;
};
export type DashboardData = {
  apps: ManagedApp[];
  asobeast: { configured: boolean; connected: boolean; remoteAppCount: number };
};

export type MapsStatus = {
  configured: boolean;
  connected: boolean;
  error?: string;
};

export type MapsJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type MapsJob = {
  id: string;
  status: MapsJobStatus;
  engine_job_id: string | null;
  result_count: number;
  error_message: string | null;
  params: {
    keywords?: string[];
    language?: string;
    depth?: number;
    fast_mode?: boolean;
    email?: boolean;
    extra_reviews?: boolean;
  };
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type MapsPlace = {
  id: number;
  place_id: string | null;
  cid: string | null;
  title: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  emails: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  review_count: number | null;
  review_rating: number | null;
  raw: Record<string, unknown>;
};

export type MapsResults = {
  total: number;
  limit: number;
  offset: number;
  items: MapsPlace[];
};
