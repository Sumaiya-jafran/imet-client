export type MetricGroup = { total: number; counts: Record<string, number> };
export type AnalyticsOverview = {
  asOf: string;
  timeZone: string;
  current: Record<string, MetricGroup>;
  activity: {
    from: string;
    to: string;
    days: { date: string; counts: Record<string, number> }[];
  };
};
export type AuditEntry = {
  id: string;
  source: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actor: { id: string | null; displayName: string | null };
  createdAt: string;
  context: {
    changedFields: string[];
    before: Record<string, string | boolean | string[]>;
    after: Record<string, string | boolean | string[]>;
  };
};
export type AuditList = {
  entries: AuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  range: { from: string; to: string; timeZone: string };
};
