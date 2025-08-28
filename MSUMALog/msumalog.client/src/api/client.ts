import axios from 'axios';
import type { components } from './types';

// set axios to include credentials (cookies) if your backend uses cookie auth
const http = axios.create({ baseURL: '/api', withCredentials: true });

// export helper to set/remove Bearer token when using token auth
export function setAuthToken(token?: string) {
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common['Authorization'];
  }
}

export type IncidentReportDto = components['schemas']['IncidentReportDto'];
export type IncidentReportPatchDto = components['schemas']['IncidentReportPatchDto'];
export type User = components['schemas']['User'];
export type IncidentCommentDto = components['schemas']['IncidentCommentDto'];
export type PagedResultDto<T extends Record<string, unknown> = Record<string, unknown>> = components['schemas']['StringObjectIDictionaryPagedResultDto'] & { items: T[] };

export type AuditTimelineDto = components['schemas']['AuditTimelineDto'];
export type AuditFieldChangeDto = components['schemas']['AuditFieldChangeDto'];
export type AuditTimelineDtoPagedResultDto = components['schemas']['AuditTimelineDtoPagedResultDto'];

// เพิ่ม type สำหรับ Admin user DTO (จาก swagger)
export type AdminUserDto = components['schemas']['UserDto'];

// เพิ่ม export ของ schema types ที่ยังขาด
export type UserDto = components['schemas']['UserDto'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type SetPasswordRequest = components['schemas']['SetPasswordRequest'];
export type ProblemDetails = components['schemas']['ProblemDetails'];
export type StringObjectIDictionaryPagedResultDto = components['schemas']['StringObjectIDictionaryPagedResultDto'];
export type WeatherForecast = components['schemas']['WeatherForecast'];
export type AuditActionType = components['schemas']['AuditActionType'];
export type AuditEntityType = components['schemas']['AuditEntityType'];

// ฟังก์ชัน API สำหรับ AdminUsers
export async function getAdminUsers(): Promise<AdminUserDto[]> {
  const res = await http.get<AdminUserDto[]>('/AdminUsers');
  return res.data;
}

export async function getAdminUsersPaged(params: {
  page?: number;
  limit?: number;
  select?: string;
  order?: string;
  filter?: Record<string, string>;
}) {
  const res = await http.get<PagedResultDto<AdminUserDto>>('/AdminUsers/paged', { params });
  return res.data;
}

export async function getAdminUserById(id: number): Promise<AdminUserDto> {
  const res = await http.get<AdminUserDto>(`/AdminUsers/${id}`);
  return res.data;
}

export async function updateAdminUser(id: number, body: AdminUserDto) {
  await http.put(`/AdminUsers/${id}`, body);
  return true;
}

export async function deleteAdminUser(id: number) {
  await http.delete(`/AdminUsers/${id}`);
  return true;
}

export async function blockAdminUser(id: number) {
  await http.post(`/AdminUsers/${id}/block`);
  return true;
}

export async function unblockAdminUser(id: number) {
  await http.post(`/AdminUsers/${id}/unblock`);
  return true;
}

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
export async function updateIncidentFull(dto: Partial<IncidentReportPatchDto> & { id: number }) {
  await http.put(`/IncidentReports/${dto.id}`, dto);
  return true;
}

// Update only partial fields (PATCH)
export async function updateIncidentPartial(dto: Partial<IncidentReportDto> & { id: number }) {
  await http.patch(`/IncidentReports/${dto.id}`, dto);
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

/**
 * IncidentAttachments APIs (ตาม OpenAPI types)
 */
export type IncidentAttachmentDto = components['schemas']['IncidentAttachmentDto'];

export async function getIncidentAttachmentsByIncident(incidentId: number): Promise<IncidentAttachmentDto[]> {
  const res = await http.get<IncidentAttachmentDto[]>(`/IncidentAttachments/by-incident/${incidentId}`);
  return res.data;
}

export async function getIncidentAttachmentById(id: number): Promise<IncidentAttachmentDto> {
  const res = await http.get<IncidentAttachmentDto>(`/IncidentAttachments/${id}`);
  return res.data;
}

/**
 * Create attachment metadata (JSON) - OpenAPI ระบุ POST /api/IncidentAttachments with JSON body
 * If your backend expects multipart upload, use uploadIncidentAttachmentForm below instead.
 */
export async function createIncidentAttachment(body: IncidentAttachmentDto): Promise<IncidentAttachmentDto> {
  const res = await http.post<IncidentAttachmentDto>('/IncidentAttachments', body);
  return res.data;
}

export async function deleteIncidentAttachment(id: number) {
  await http.delete(`/IncidentAttachments/${id}`);
}

/**
 * Try to download raw file blob. Tries a few common endpoints:
 * - /IncidentAttachments/{id}/download
 * - /IncidentAttachments/{id}/raw
 * - /IncidentAttachments/{id} (if server returns file directly)
 */
// export async function downloadIncidentAttachmentBlob(id: number): Promise<Blob> {
//   const tryUrls = [
//     `/IncidentAttachments/${id}/download`,
//     `/IncidentAttachments/${id}/raw`,
//     `/IncidentAttachments/${id}`
//   ];
//   for (const u of tryUrls) {
//     try {
//       const res = await http.get(u, { responseType: 'blob' as const });
//       if (res.status >= 200 && res.status < 300) return res.data as Blob;
//     } catch {
//       // ignore and try next
//     }
//   }
//   throw new Error('Download failed: no endpoint returned a file blob');
// }

/**
 * Optional: multipart upload helper (if backend provides /IncidentAttachments/upload)
 * Use when server supports multipart/form-data upload route.
 */
export async function uploadIncidentAttachment(data: {
  file: File;
  incidentId: number;
  description?: string;
  kind?: string;
}) {
  const form = new FormData();
  form.append("File", data.file);
  form.append("IncidentId", data.incidentId.toString());
  if (data.description) form.append("Description", data.description);
  if (data.kind) form.append("Kind", data.kind);

  const res = await http.post<components["schemas"]["IncidentAttachmentDto"]>(
    "/IncidentAttachments/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

// ----------------- NEW: additional helpers based on updated types -----------------

// Upload generic file to /UploadFile/Upload (multipart). Returns true on HTTP 200.
export async function uploadFileUpload(data: {
  file: File;
  subjectId?: number;
  userId?: number;
  fileType?: string;
}): Promise<boolean> {
  const form = new FormData();
  form.append("File", data.file);
  if (typeof data.subjectId !== "undefined") form.append("SubjectId", data.subjectId.toString());
  if (typeof data.userId !== "undefined") form.append("UserId", data.userId.toString());
  if (data.fileType) form.append("FileType", data.fileType);

  const res = await http.post("/UploadFile/Upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.status >= 200 && res.status < 300;
}

// Thin wrapper for /auth/claims — returns backend payload as-is (type unknown because OpenAPI doesn't define content)
export async function getAuthClaims(): Promise<unknown> {
  const res = await http.get("/auth/claims", { withCredentials: true });
  return res.data;
}

// เพิ่ม type alias (ถ้ายังไม่มี)
export type StoredFileInfoDto = components['schemas']['StoredFileInfoDto'];

// ดึง metadata ของไฟล์ (no stream)
export async function getIncidentAttachmentFileInfo(id: number): Promise<StoredFileInfoDto> {
  const res = await http.get<StoredFileInfoDto>(`/IncidentAttachments/file-info/${id}`);
  return res.data;
}

/**
 * ดาวน์โหลดไฟล์:
 * - ถ้าไฟล์เป็น external และ fetchExternal=true -> จะดาวน์โหลด blob จาก external URL (ต้องการ CORS จาก host นั้น)
 * - ถ้าไฟล์เป็น external และ fetchExternal=false -> คืน externalUrl (caller สามารถ open ใน new tab)
 * - ถ้าไฟล์เป็น local -> เรียก /IncidentAttachments/download/{id} (เพิ่ม ?proxy=true เพื่อให้เซิร์ฟเวอร์ proxy แทน redirect ถ้าต้องการ)
 *
 * Returns Blob for downloaded content or string (externalUrl) if caller should open it.
 */
export async function downloadIncidentAttachmentBlob(
  id: number,
  options?: { proxy?: boolean; fetchExternal?: boolean }
): Promise<Blob | string> {
  // อ่าน metadata ก่อน
  let info: StoredFileInfoDto;
  try {
    info = await getIncidentAttachmentFileInfo(id);
  } catch {
    // fall back to old strategy if file-info endpoint not available
    // try direct download endpoints
    const tryUrls = [
      `/IncidentAttachments/${id}/download`,
      `/IncidentAttachments/${id}/raw`,
      `/IncidentAttachments/${id}`
    ];
    for (const u of tryUrls) {
      try {
        const res = await http.get(u, { responseType: 'blob' as const });
        if (res.status >= 200 && res.status < 300) return res.data as Blob;
      } catch {
        // ignore and try next
      }
    }
    throw new Error('Download failed: no endpoint returned a file blob');
  }

  // If external
  if (info.isExternal && info.externalUrl) {
    if (options?.fetchExternal) {
      // Try to fetch external URL as blob (requires CORS on external host)
      const res = await axios.get(info.externalUrl, { responseType: 'blob' });
      return res.data as Blob;
    }
    // return the external URL so UI can open it
    return info.externalUrl;
  }

  // Local file -> request the download endpoint (allow proxy)
  const url = `/IncidentAttachments/download/${id}` + (options?.proxy ? '?proxy=true' : '');
  const res = await http.get(url, { responseType: 'blob' as const });
  if (res.status >= 200 && res.status < 300) return res.data as Blob;
  throw new Error(`Download failed with status ${res.status}`);
}


