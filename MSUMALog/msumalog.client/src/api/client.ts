import axios from 'axios';
import type { components } from './types';

const http = axios.create({ baseURL: '/api' });

export type IncidentReportDto = components['schemas']['IncidentReportDto'];
export type User = components['schemas']['User'];

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

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await http.get('/auth/me', { withCredentials: true });
    return response.status === 200; // Return true if authenticated
  } catch (error) {
    console.error('[api] GET /auth/me error', error);
    return false; // Return false if not authenticated
  }
}

export async function getCurrentUser(): Promise<User> {
  try {
    const response = await http.get<User>('/auth/me', { withCredentials: true });
    return response.data; // ข้อมูล user ที่ backend ส่งกลับมา
  } catch (error) {
    console.error('[api] GET /auth/me error', error);
    throw error;
  }
}

// New: basic-login using email/password -> returns User and sets cookie
export async function basicLogin(email: string, password: string): Promise<User> {
  const res = await http.post<User>('/auth/basic-login', { email, password }, { withCredentials: true });
  return res.data;
}

// New: set-password for currently authenticated user (password only)
export async function setPassword(password: string) {
  const res = await http.post<{ email: string }>('/auth/set-password', { password }, { withCredentials: true });
  return res.data;
}