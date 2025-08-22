import axios from 'axios';
import type { components } from './types';

const http = axios.create({ baseURL: '/api' });

export type IncidentReportDto = components['schemas']['IncidentReportDto'];
export type User = components['schemas']['User'];
export type IncidentCommentDto = components['schemas']['IncidentCommentDto'];
export type PagedResultDto<T extends Record<string, unknown> = Record<string, unknown>> = components['schemas']['StringObjectIDictionaryPagedResultDto'] & { items: T[] };

export type AuditTimelineDto = components['schemas']['AuditTimelineDto'];
export type AuditFieldChangeDto = components['schemas']['AuditFieldChangeDto'];
export type AuditTimelineDtoPagedResultDto = components['schemas']['AuditTimelineDtoPagedResultDto'];

// helper: convert UTC ISO string -> user's local display string (or undefined)
function utcToLocal(utc?: string | null): string | undefined {
  if (!utc) return undefined;
  const d = new Date(utc);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleString(); // localized date+time for user's timezone
}

export async function getIncidentReports() {
  console.log('[api] GET /IncidentReports start');
  try {
    const res = await http.get<IncidentReportDto[]>('/IncidentReports');
    // convert created/updated UTC -> local display strings
    const data = res.data.map(dto => ({
      ...dto,
      createdUtc: utcToLocal(dto.createdUtc) ?? dto.createdUtc,
      updatedUtc: utcToLocal(dto.updatedUtc) ?? dto.updatedUtc
    }));
    console.log('[api] GET /IncidentReports status', res.status, 'data', data);
    return data;
  } catch (e) {
    console.error('[api] GET /IncidentReports error', e);
    throw e;
  }
}

// ฟังก์ชันสำหรับเรียก IncidentReports/paged
export async function getIncidentReportsPaged(params: {
  page?: number;
  limit?: number;
  select?: string;
  order?: string;
  filter?: Record<string, string>;
}) {
  const res = await http.get<PagedResultDto<Record<string, unknown>>>('/IncidentReports/paged', {
    params,
  });
  // แปลงวันที่ถ้ามี field createdUtc/updatedUtc ในแต่ละ item
  interface PagedItem extends Record<string, unknown> {
    createdUtc?: string;
    updatedUtc?: string;
  }

  const items = res.data.items.map((item: PagedItem) => ({
    ...item,
    createdUtc: item.createdUtc ? utcToLocal(item.createdUtc) : item.createdUtc,
    updatedUtc: item.updatedUtc ? utcToLocal(item.updatedUtc) : item.updatedUtc,
  }));
  return {
    ...res.data,
    items,
  };
}

// Accept partial DTO (client should only send writable fields)
export async function createIncident(body: Partial<IncidentReportDto>) {
  const res = await http.post<IncidentReportDto>('/IncidentReports', body);
  // convert timestamps on response
  const dto = {
    ...res.data,
    createdUtc: utcToLocal(res.data.createdUtc) ?? res.data.createdUtc,
    updatedUtc: utcToLocal(res.data.updatedUtc) ?? res.data.updatedUtc
  };
  return dto;
}

// Update expects an object that includes the id (other fields may be partial)
export async function updateIncidentFull(dto: Partial<IncidentReportDto> & { id: number }) {
  await http.put(`/IncidentReports/${dto.id}`, dto);
  return true;
}

export async function getIncidentByCase(caseNo: string) {
  const res = await http.get<IncidentReportDto>(`/IncidentReports/by-case/${encodeURIComponent(caseNo)}`);
  const dto = {
    ...res.data,
    createdUtc: utcToLocal(res.data.createdUtc) ?? res.data.createdUtc,
    updatedUtc: utcToLocal(res.data.updatedUtc) ?? res.data.updatedUtc
  };
  return dto;
}

export async function deleteIncident(id: number) {
  await http.delete(`/IncidentReports/${id}`);
  return true;
}



export async function getCommentsByCase(caseNo: string) {
  const res = await http.get<IncidentCommentDto[]>(`/IncidentComments/by-case/${encodeURIComponent(caseNo)}`);
  // convert comment createdUtc to local string
  const data = res.data.map(c => ({ ...c, createdUtc: utcToLocal(c.createdUtc) ?? c.createdUtc }));
  return data;
}

//getCommentsByCaseId
export async function getCommentsByCaseId(incidentId: number) {
  const res = await http.get<IncidentCommentDto[]>(`/IncidentComments/by-incident/${incidentId}`);
  // convert comment createdUtc to local string
  const data = res.data.map(c => ({ ...c, createdUtc: utcToLocal(c.createdUtc) ?? c.createdUtc }));
  return data;
}

export async function createComment(data: Omit<IncidentCommentDto, 'id' | 'createdUtc' | 'caseNo'>) {
  const res = await http.post<IncidentCommentDto>('/IncidentComments', data);
  return { ...res.data, createdUtc: utcToLocal(res.data.createdUtc) ?? res.data.createdUtc };
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

// ดึง timeline ด้วย incidentId (แบบเดิม)
export async function getAuditTimelineByIncidentId(params: {
  incidentId: number;
  page?: number;
  limit?: number;
}) {
  const res = await http.get<AuditTimelineDtoPagedResultDto>('/Audit/timeline', { params });
  return res.data;
}

// ดึง timeline ด้วย ReferenceEntityName/ReferenceId
export async function getAuditTimelineByReference(params: {
  referenceEntityName: string;
  referenceId: number;
  page?: number;
  limit?: number;
}) {
  const { referenceEntityName, referenceId, page, limit } = params;
  const res = await http.get<AuditTimelineDtoPagedResultDto>(
    `/Audit/${encodeURIComponent(referenceEntityName)}/${referenceId}/timeline`,
    { params: { page, limit } }
  );
  return res.data;
}

// ดึงรายละเอียดการแก้ไขใน batch เดียวกัน
export async function getAuditBatchDetail(batchId: string) {
  const res = await http.get<AuditFieldChangeDto[]>(`/Audit/batch/${batchId}`);
  return res.data;
}