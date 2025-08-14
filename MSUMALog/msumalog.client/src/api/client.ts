import axios from 'axios';
import type { components } from './types';

const http = axios.create({ baseURL: '/api' });

export type IncidentReportDto = components['schemas']['IncidentReportDto'];

export async function getIncidentReports() {
  // สมมติ API คืน array ของ IncidentReportDto
  const res = await http.get<IncidentReportDto[]>('/IncidentReports');
  return res.data;
}

export async function createIncident(body: IncidentReportDto) {
  const res = await http.post<IncidentReportDto>('/IncidentReports', body);
  return res.data;
}

export async function getIncidentByCase(caseNo: string) {
  const res = await http.get<IncidentReportDto>(`/IncidentReports/by-case/${encodeURIComponent(caseNo)}`);
  return res.data;
}

export async function updateIncidentFull(dto: IncidentReportDto) {
  if (!dto.id) throw new Error('Missing id');
  await http.put(`/IncidentReports/${dto.id}`, dto);
  return true;
}

export async function deleteIncident(id: number) {
  await http.delete(`/IncidentReports/${id}`);
  return true;
}