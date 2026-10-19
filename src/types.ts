export type ManagedApp = {
  id: string; name: string; slug: string; iosBundleId: string | null; androidPackage: string | null;
  appStoreUrl: string | null; playStoreUrl: string | null; asoBeastAppId: string | null;
  color: string; status: 'development' | 'review' | 'live'; createdAt: string; updatedAt: string;
};
export type DashboardData = {
  apps: ManagedApp[];
  asobeast: { configured: boolean; connected: boolean; remoteAppCount: number };
};
