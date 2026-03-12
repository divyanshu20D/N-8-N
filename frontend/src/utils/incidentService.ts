import type {
  IncidentItem,
  IncidentListResponse,
  IncidentSeverity,
  IncidentStatus,
} from "../types/workflow";
import { api } from "./api";

export interface IncidentListQuery {
  page?: number;
  limit?: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
}

export async function listIncidents(
  query: IncidentListQuery = {},
): Promise<IncidentListResponse> {
  const { data } = await api.get<IncidentListResponse>("/incidents", {
    params: query,
  });
  return data;
}

export async function getIncident(id: string): Promise<IncidentItem> {
  const { data } = await api.get<IncidentItem>(`/incidents/${id}`);
  return data;
}
