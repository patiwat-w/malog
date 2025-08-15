import axios from 'axios';
import type { components } from './types';

const http = axios.create({ baseURL: '/api' });

export type IncidentReportDto = components['schemas']['IncidentReportDto'];

export async function getIncidentReports() {
  console.log('[api] GET /IncidentReports start');
  try {
    const res = await http.get<IncidentReportDto[]>('/IncidentReports');
    console.log('[api] GET /IncidentReports status', res.status, 'data', res.data);
    return res.data;
  } catch (e) {
    console.error('[api] GET /IncidentReports error', e);
    throw e;
  }
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

export interface IncidentCommentDto {
  id: number;
  incidentReportId: number;
  caseNo?: string;
  author: string;
  body: string;
  createdUtc: string;
}

export async function getCommentsByCase(caseNo: string) {
  const res = await http.get<IncidentCommentDto[]>(`/IncidentComments/by-case/${encodeURIComponent(caseNo)}`);
  return res.data;
}

export async function createComment(data: Omit<IncidentCommentDto, 'id' | 'createdUtc' | 'caseNo'>) {
  const res = await http.post<IncidentCommentDto>('/IncidentComments', data);
  return res.data;
}

export async function deleteComment(id: number) {
  await http.delete(`/IncidentComments/${id}`);
}

export async function logout() {
  try {
    const response = await http.post('/auth/logout', {}, { withCredentials: true });
    return response.status === 204; // ตรวจสอบว่า logout สำเร็จ (204 No Content)
  } catch (error) {
    console.error('[api] POST /auth/logout error', error);
    throw error;
  }
}