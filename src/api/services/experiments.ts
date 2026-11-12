import client from '../client';

export type ExperimentKind = 'section' | 'theme_settings';
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'stopped';
export type OverrideValue = string | number | boolean;
export interface ExperimentRow {
  _id: string;
  name: string;
  kind: ExperimentKind;
  status: ExperimentStatus;
  trafficPercent: number;
  splitB: number;
  sectionId: string | null;
  variantBName: string;
  overrides: Record<string, OverrideValue>;
  startedAt: string | null;
  stoppedAt: string | null;
  winner: 'a' | 'b' | null;
  appliedAt: string | null;
}
export interface ExperimentInput { kind?: ExperimentKind; name: string; trafficPercent?: number; splitB?: number; sectionId?: string; variantBName?: string; overrides: Record<string, OverrideValue> }
export interface VariantResult { visits: number; addedToCart: number; reachedCheckout: number; orders: number; conversionRate: number }
export interface ExperimentResults {
  experimentId: string;
  status: ExperimentStatus;
  winner: 'a' | 'b' | null;
  startedAt: string | null;
  variants: { a: VariantResult; b: VariantResult };
  verdict: 'not_enough_data' | 'inconclusive' | 'leaning' | 'likely';
  z: number | null;
  p: number | null;
  leader: 'a' | 'b' | null;
}

const base = (storeId: string) => `/api/experiments/${storeId}`;
export const apiListExperiments = (storeId: string) => client.get(base(storeId)) as Promise<ExperimentRow[]>;
export const apiCreateExperiment = (storeId: string, body: ExperimentInput) => client.post(base(storeId), body) as Promise<ExperimentRow>;
export const apiUpdateExperiment = (storeId: string, id: string, body: Partial<ExperimentInput>) => client.patch(`${base(storeId)}/${id}`, body) as Promise<ExperimentRow>;
export const apiDeleteExperiment = (storeId: string, id: string) => client.delete(`${base(storeId)}/${id}`) as Promise<{ success: boolean }>;
export const apiExperimentAction = (storeId: string, id: string, action: 'start' | 'pause' | 'resume' | 'stop') => client.post(`${base(storeId)}/${id}/${action}`) as Promise<ExperimentRow>;
export const apiExperimentWinner = (storeId: string, id: string, winner: 'a' | 'b') => client.post(`${base(storeId)}/${id}/winner`, { winner }) as Promise<ExperimentRow>;
export const apiExperimentResults = (storeId: string, id: string) => client.get(`${base(storeId)}/${id}/results`) as Promise<ExperimentResults>;

// ── storefront (anonymous) ──
export interface ExperimentAssignment { experimentId: string; kind: ExperimentKind; sectionId: string | null; variant: 'a' | 'b' | 'winner'; overrides: Record<string, OverrideValue> }
export const apiExperimentAssignments = (storeId: string, visitorId?: string) =>
  client.get(`/api/public/experiments/${storeId}/assignments`, { params: visitorId ? { visitorId } : {} }) as Promise<ExperimentAssignment[]>;
export const apiExperimentExposure = (storeId: string, body: { sessionId: string; visitorId: string; experimentId: string }) =>
  client.post(`/api/public/experiments/${storeId}/exposure`, body) as Promise<{ recorded: boolean }>;
