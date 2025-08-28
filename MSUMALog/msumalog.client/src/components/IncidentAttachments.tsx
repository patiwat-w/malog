import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import MovieIcon from '@mui/icons-material/Movie';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box, Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List, ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Table, TableBody, TableCell, TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery, useTheme
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import type { IncidentAttachmentDto } from '../api/client';
import {
  deleteIncidentAttachment,
  downloadIncidentAttachmentBlob,
  getIncidentAttachmentFileInfo,
  getIncidentAttachmentsByIncident,
  uploadIncidentAttachment,
  type User
} from '../api/client';
// Add dialog/snackbar components
import AlertDialog from './AlertDialog';
import ConfirmDialog from './ConfirmDialog';
import SnackbarAlert from './SnackbarAlert';



type Props = {
  incidentId: number;
  readOnly?: boolean;
  currentUser?: User;
};

export default function IncidentAttachments({
  incidentId,
  readOnly = false,
  currentUser
}: Props) {
  const theme = useTheme();
  // treat tablet and smaller as "mobile" (use theme.breakpoint 'md' ~ 960px)
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const dialogFullScreen = isSmall;

  const [items, setItems] = useState<IncidentAttachmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadMode, setUploadMode] = useState<'upload' | 'link'>('upload');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [previewDescription, setPreviewDescription] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [previewExternalUrl, setPreviewExternalUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const previewWindowRef = useRef<Window | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dialog / snackbar states and refs for pending actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState<string | undefined>(undefined);
  const [confirmMessage, setConfirmMessage] = useState<string | undefined>(undefined);
  const pendingConfirmActionRef = useRef<(() => Promise<void>) | null>(null);
  const pendingConfirmCancelRef = useRef<(() => Promise<void>) | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<string | undefined>(undefined);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  // open a new window with a blob URL and auto-revoke when closed
  async function openDetachedWindowWithBlob(blob: Blob, fileName?: string | null, descriptionText?: string | null) {
    const url = URL.createObjectURL(blob);
    const w = window.open('', '_blank');
    if (!w) {
      // fallback: open blob url directly (will be revoked shortly)
      window.open(url, '_blank');
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch { } }, 5000);
      return;
    }

    previewWindowRef.current = w;
    w.document.title = fileName ?? 'Attachment';
    const container = w.document.createElement('div');
    container.style.padding = '12px';
    container.style.fontFamily = 'system-ui, sans-serif';
    if (descriptionText) {
      const p = w.document.createElement('p');
      p.textContent = descriptionText;
      p.style.margin = '8px 0';
      p.style.fontSize = '14px';
      p.style.color = '#444';
      container.appendChild(p);
    }

    const mime = previewMime ?? '';
    if (mime.startsWith('image/')) {
      const img = w.document.createElement('img');
      img.src = url;
      img.style.maxWidth = '100%';
      container.appendChild(img);
    } else if (mime.startsWith('video/')) {
      const v = w.document.createElement('video');
      v.src = url;
      v.controls = true;
      v.style.maxWidth = '100%';
      container.appendChild(v);
    } else if (mime.startsWith('audio/')) {
      const a = w.document.createElement('audio');
      a.src = url;
      a.controls = true;
      container.appendChild(a);
    } else if (mime === 'application/pdf') {
      const iframe = w.document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      container.appendChild(iframe);
    } else {
      const a = w.document.createElement('a');
      a.href = url;
      a.download = fileName ?? 'file';
      a.textContent = 'Download file';
      container.appendChild(a);
    }

    w.document.body.appendChild(container);

    // revoke object URL when opened window closes
    const interval = setInterval(() => {
      if (w.closed) {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
        clearInterval(interval);
        if (previewWindowRef.current === w) previewWindowRef.current = null;
      }
    }, 500);
  }

  function detectKindFromMime(mime?: string | null) {
    if (!mime) return 'File';
    if (mime.startsWith('image/')) return 'Image';
    if (mime.startsWith('video/')) return 'Video';
    if (mime.startsWith('audio/')) return 'Audio';
    return 'File';
  }

  useEffect(() => { loadList(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [incidentId]);

  async function loadList() {
    setLoading(true);
    try {
      const list = await getIncidentAttachmentsByIncident(incidentId);
      setItems(list ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function fmtSize(bytes?: number | null) {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // handle file selection (used by file input and dropzone)
  // NOTE: do NOT auto-upload here — just set selectedFile/kind. Upload happens when user clicks Upload.
  function handleFile(file: File) {
    if (!file) return;
    setSelectedFile(file);
    const detected = detectKindFromMime(file.type ?? null);
    setKind(detected);
    setUploadMode('upload');
  }

  // hidden file input handler: just set selected file
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement> | null) => {
    const f = e?.target?.files?.[0] ?? null;
    if (!f) return;
    handleFile(f);
  };

  async function createLinkAttachment(payload: { incidentId: number; url: string; description?: string }) {
    const body = {
      incidentId: payload.incidentId,
      storageKey: payload.url,
      isExternal: true,
      description: payload.description ?? null,
      kind: 'Link'
    };
    const res = await fetch('/api/IncidentAttachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Create link failed: ${res.status}`);
    return res.json();
  }

  // helper to show confirm with optional cancel action
  function openConfirm(title: string, message: string, confirmAction?: () => Promise<void>, cancelAction?: () => Promise<void>) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    pendingConfirmActionRef.current = confirmAction ?? null;
    pendingConfirmCancelRef.current = cancelAction ?? null;
    setConfirmOpen(true);
  }

  async function handleConfirmOk() {
    setConfirmOpen(false);
    const a = pendingConfirmActionRef.current;
    pendingConfirmActionRef.current = null;
    pendingConfirmCancelRef.current = null;
    if (a) {
      try { await a(); } catch (e) { console.error(e); openAlert('ผิดพลาด', (e as Error)?.message ?? 'ไม่สำเร็จ'); }
    }
  }

  async function handleConfirmClose() {
    setConfirmOpen(false);
    const c = pendingConfirmCancelRef.current;
    pendingConfirmActionRef.current = null;
    pendingConfirmCancelRef.current = null;
    if (c) {
      try { await c(); } catch (e) { console.error(e); openAlert('ผิดพลาด', (e as Error)?.message ?? 'ไม่สำเร็จ'); }
    }
  }

  function openAlert(title?: string, message?: string) {
    setAlertTitle(title ?? 'แจ้งเตือน');
    setAlertMessage(message ?? '');
    setAlertOpen(true);
  }

  function showSnackbar(message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }

  // map error -> short friendly message for users
  async function getFriendlyErrorMessage(err: any) {
    try {
      if (err instanceof Response) {
        const status = err.status;
        if (status === 413) return 'ไฟล์ใหญ่เกินขนาดที่ระบบรับได้ (413).';
        if (status === 401) return 'ต้องเข้าสู่ระบบก่อน (401).';
        if (status === 403) return 'คุณไม่มีสิทธิ์ทำรายการนี้ (403).';
        if (status === 404) return 'ไม่พบทรัพยากรที่ขอ (404).';
        if (status >= 500) return 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ (5xx).';
        return `คำขอผิดพลาด (${status}).`;
      }

      if (err?.response?.status) {
        const status = err.response.status;
        if (status === 413) return 'ไฟล์ใหญ่เกินขนาดที่ระบบรับได้ (413).';
        if (status === 401) return 'ต้องเข้าสู่ระบบก่อน (401).';
        if (status === 403) return 'คุณไม่มีสิทธิ์ทำรายการนี้ (403).';
        if (status === 404) return 'ไม่พบทรัพยากรที่ขอ (404).';
        if (status >= 500) return 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ (5xx).';
        return `คำขอผิดพลาด (${status}).`;
      }

      const msg = String(err?.message ?? err ?? '');
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('connection') || msg.toLowerCase().includes('reset')) {
        return 'เชื่อมต่อกับเซิร์ฟเวอร์ไม่สำเร็จ — ตรวจสอบว่าเซิร์ฟเวอร์รัน/เครือข่าย/ใบรับรอง.';
      }

      return msg || 'เกิดข้อผิดพลาด';
    } catch {
      return 'เกิดข้อผิดพลาด';
    }
  }

  async function performUploadAction() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadIncidentAttachment({ file: selectedFile, incidentId, description: description || undefined, kind: kind || undefined });
      setSelectedFile(null);
      setDescription('');
      setKind('File');
      await loadList();
      showSnackbar('อัปโหลดแล้ว', 'success');
    } catch (err) {
      console.error(err);
      const friendly = await getFriendlyErrorMessage(err);
      openAlert('อัปโหลดไม่สำเร็จ', friendly);
    } finally {
      setUploading(false);
    }
  }

  async function performCreateLinkAction() {
    if (!linkUrl) return;
    setUploading(true);
    try {
      await createLinkAttachment({ incidentId, url: linkUrl, description });
      setLinkUrl('');
      setDescription('');
      await loadList();
      showSnackbar('แนบลิงก์แล้ว', 'success');
    } catch (err) {
      console.error(err);
      const friendly = await getFriendlyErrorMessage(err);
      openAlert('แนบลิงก์ไม่สำเร็จ', friendly);
    } finally {
      setUploading(false);
    }
  }

  async function onUpload(e?: React.FormEvent) {
    e?.preventDefault();

    if (uploadMode === 'upload') {
      if (!selectedFile) return;

      // duplicate check (case-insensitive)
      const nameLower = selectedFile.name?.toLowerCase() ?? '';
      const existingFile = items.find(it =>
        (it.fileName && it.fileName.toLowerCase() === nameLower) ||
        (it.storageKey && it.storageKey.toLowerCase() === nameLower)
      );
      if (existingFile) {
        // ask via ConfirmDialog; if confirmed -> perform upload, else do nothing
        openConfirm('ไฟล์ซ้ำ', `ไฟล์ชื่อ "${selectedFile.name}" มีอยู่แล้ว อัปโหลดต่อหรือไม่?`, async () => {
          await performUploadAction();
        }, async () => { /* cancel => do nothing */ });
        return;
      }

      // no duplicate -> perform upload immediately
      await performUploadAction();
      return;
    }

    // link mode
    if (uploadMode === 'link') {
      if (!linkUrl) { openAlert('ขาด URL', 'กรุณาใส่ URL'); return; }

      // duplicate check for link (normalize)
      const u = linkUrl.trim().toLowerCase();
      const existingLink = items.find(it =>
        (it.storageKey && it.storageKey.trim().toLowerCase() === u) ||
        (it.externalUrl && it.externalUrl.trim().toLowerCase() === u)
      );
      if (existingLink) {
        openConfirm('ลิงก์ซ้ำ', `ลิงก์ "${linkUrl}" มีอยู่แล้ว แนบต่อหรือไม่?`, async () => {
          await performCreateLinkAction();
        }, async () => { /* cancel */ });
        return;
      }

      // no duplicate
      await performCreateLinkAction();
      return;
    }
  }

  async function onDelete(id?: number) {
    if (!id) return;
    // use confirm dialog; actual delete happens in confirm action
    openConfirm('ลบไฟล์', 'ต้องการลบไฟล์หรือไม่?', async () => {
      try {
        await deleteIncidentAttachment(id);
        setItems(prev => prev.filter(x => x.id !== id));
        showSnackbar('ลบแล้ว', 'success');
      } catch (e) {
        console.error(e);
        openAlert('ลบไม่สำเร็จ', (e as Error)?.message ?? 'ลบไม่สำเร็จ');
      }
    }, undefined);
  }

  async function onPreview(id?: number, contentType?: string | null) {
    if (!id) return;
    try {
      setSelectedId(id);
      const meta = items.find(x => x.id === id);
      setPreviewDescription(meta?.description ?? null);
      setPreviewFileName(meta?.fileName ?? meta?.storageKey ?? null);

      // If record is external, prefer metadata URL (storageKey or externalUrl)
      if (meta?.isExternal) {
        const url = meta.externalUrl ?? meta.storageKey ?? null;
        if (url) {
          setPreviewExternalUrl(url);
          setPreviewBlobUrl(null);
          setPreviewMime('text/link');
          return;
        }
        // fall through to try server-provided external URL via API
      }

      const res = await downloadIncidentAttachmentBlob(id, { fetchExternal: true });
      if (typeof res === 'string') {
        // API returned external URL
        setPreviewExternalUrl(res);
        setPreviewBlobUrl(null);
        setPreviewMime('text/link');
        return;
      }
      const blob = res as Blob;
      const url = URL.createObjectURL(blob);
      setPreviewExternalUrl(null);
      setPreviewBlobUrl(url);
      setPreviewMime(contentType ?? blob.type ?? 'application/octet-stream');
    } catch (e) {
      console.error(e);
      openAlert('ดูตัวอย่างไม่สำเร็จ', (e as Error)?.message ?? 'ดูตัวอย่างไม่สำเร็จ');
    }
  }

  async function onOpenDetached(id?: number, contentType?: string | null, fileName?: string | null) {
    if (!id) return;
    try {
      const meta = items.find(x => x.id === id);
      const description = meta?.description ?? null;
      const res = await downloadIncidentAttachmentBlob(id, { fetchExternal: false });
      if (typeof res === 'string') {
        window.open(res, '_blank');
        return;
      }
      const blob = res as Blob;
      const url = URL.createObjectURL(blob);
      const w = window.open('', '_blank');
      if (!w) {
        window.open(url);
        return;
      }
      previewWindowRef.current = w;
      const mime = contentType ?? blob.type;
      if (mime?.startsWith('image/') || mime?.startsWith('video/') || mime?.startsWith('audio/') || mime === 'application/pdf') {
        w.document.title = fileName ?? 'Attachment';
        if (description) {
          const p = w.document.createElement('p');
          p.textContent = description;
          p.style.margin = '8px';
          p.style.fontSize = '14px';
          p.style.color = '#444';
          w.document.body.appendChild(p);
        }
        if (mime.startsWith('image/')) {
          w.document.body.style.margin = '0';
          const img = w.document.createElement('img');
          img.src = url;
          img.style.maxWidth = '100%';
          img.style.display = 'block';
          img.style.margin = '0 auto';
          w.document.body.appendChild(img);
        } else if (mime.startsWith('video/')) {
          const v = w.document.createElement('video');
          v.src = url;
          v.controls = true;
          v.style.width = '100%';
          w.document.body.appendChild(v);
        } else if (mime.startsWith('audio/')) {
          const a = w.document.createElement('audio');
          a.src = url;
          a.controls = true;
          w.document.body.appendChild(a);
        } else if (mime === 'application/pdf') {
          const iframe = w.document.createElement('iframe');
          iframe.src = url;
          iframe.style.width = '100%';
          iframe.style.height = '100vh';
          iframe.style.border = 'none';
          w.document.body.appendChild(iframe);
        } else {
          w.location.href = url;
        }
      } else {
        const a = w.document.createElement('a');
        a.href = url;
        a.download = fileName ?? 'file';
        w.document.body.appendChild(a);
        a.click();
      }
    } catch (e) {
      console.error(e);
      openAlert('เปิดไฟล์ไม่สำเร็จ', (e as Error)?.message ?? 'เปิดไฟล์ไม่สำเร็จ');
    }
  }

  async function onDownload(id?: number, fileName?: string | null) {
    if (!id) return;
    try {
      let info;
      try {
        info = await getIncidentAttachmentFileInfo(id);
      } catch {
        info = null;
      }

      if (info?.isExternal && info.externalUrl) {
        // Ask whether to open external URL (OK=Open external, Cancel=Download via CORS)
        const externalUrl = info.externalUrl;
        const downloadViaCors = async () => {
          try {
            const res = await downloadIncidentAttachmentBlob(id, { fetchExternal: true });
            if (typeof res === 'string') {
              window.open(res, '_blank');
              return;
            }
            const blob = res as Blob;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName ?? info.fileName ?? 'file';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            console.error(e);
            openAlert('ดาวน์โหลดไม่สำเร็จ', (e as Error)?.message ?? 'ดาวน์โหลดไม่สำเร็จ');
          }
        };

        openConfirm('ไฟล์ภายนอก', 'ไฟล์นี้โฮสต์ภายนอก เปิด URL ภายนอกหรือดาวน์โหลดผ่านระบบ? (ตกลง=เปิด, ยกเลิก=ดาวน์โหลด)', async () => {
          window.open(externalUrl, '_blank');
        }, async () => {
          await downloadViaCors();
        });
        return;
      }

      const res = await downloadIncidentAttachmentBlob(id, { proxy: false });
      if (typeof res === 'string') {
        window.open(res, '_blank');
        return;
      }
      const blob = res as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName ?? (info?.fileName ?? 'file');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      openAlert('ดาวน์โหลดไม่สำเร็จ', (e as Error)?.message ?? 'ดาวน์โหลดไม่สำเร็จ');
    }
  }

  async function downloadFromDialog(id?: number) {
    if (!id) return;
    try {
      const res = await downloadIncidentAttachmentBlob(id, { proxy: false, fetchExternal: true });
      if (typeof res === 'string') {
        window.open(res, '_blank');
        return;
      }
      const blob = res as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = previewFileName ?? 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      openAlert('ดาวน์โหลดไม่สำเร็จ', (e as Error)?.message ?? 'ดาวน์โหลดไม่สำเร็จ');
    }
  }

  function closePreview() {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      setPreviewMime(null);
      setPreviewDescription(null);
    }
    if (previewWindowRef.current && !previewWindowRef.current.closed) {
      previewWindowRef.current.close();
      previewWindowRef.current = null;
    }
    setSelectedId(null);
  }

  async function detachPreview(id?: number) {
    if (!id) return;
    try {
      const res = await downloadIncidentAttachmentBlob(id, { fetchExternal: true });
      if (typeof res === 'string') {
        window.open(res, '_blank');
        return;
      }
      const blob = res as Blob;
      await openDetachedWindowWithBlob(blob, items.find(x => x.id === id)?.fileName, items.find(x => x.id === id)?.description ?? null);
    } catch (e) {
      console.error(e);
      openAlert('เปิดแยกไม่สำเร็จ', (e as Error)?.message ?? 'เปิดแยกไม่สำเร็จ');
    }
  }

  function renderListView() {
    return (
      <Paper variant="outlined">
        <List>
          {items.map(it => (
            <div key={it.id}>
              <ListItem
                disablePadding
                sx={{ px: 1 }}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => onOpenDetached(it.id, it.contentType, it.fileName)} aria-label="open">
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                    { !readOnly && (() => {
                      const isCreator = !!currentUser && (currentUser.id === (it.createdUserId ??  null));
                      return (
                        <Tooltip title={isCreator ? 'ลบ' : 'ไม่มีสิทธิ์ลบ'}>
                          <span>
                            <IconButton size="small" onClick={() => onDelete(it.id)} aria-label="delete" disabled={!isCreator}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </Stack>
                }
              >
                <ListItemButton onClick={() => onPreview(it.id, it.contentType)} selected={selectedId === it.id} sx={{ py: 1.25 }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        { (it.isExternal || (it.kind && it.kind.toLowerCase() === 'link')) ? <LinkIcon fontSize="small" /> :
                          (it.contentType?.startsWith('image/') ? <ImageIcon fontSize="small" /> :
                            (it.contentType?.startsWith('video/') ? <MovieIcon fontSize="small" /> : <InsertDriveFileIcon fontSize="small" />))
                        }
                        <Typography variant="body1" noWrap sx={{ fontSize: 15 }}>{it.fileName ?? it.storageKey ?? '-'}</Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="column" spacing={0.25}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 12 }}>{it.description}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 12 }}>
                          By {it.createdUserName ?? '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                          {fmtSize(it.sizeBytes)} • {it.createdUtc ? new Date(it.createdUtc).toLocaleString() : '-'}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </div>
          ))}
          {items.length === 0 && !loading && (
            <Box p={2}><Typography color="text.secondary">No attachments</Typography></Box>
          )}
        </List>
      </Paper>
    );
  }

  function renderTableView() {
    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>File</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">...</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(it => (
            <TableRow key={it.id}>
              <TableCell
                onClick={() => onPreview(it.id, it.contentType)}
                sx={{ cursor: 'pointer', p: 1 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPreview(it.id, it.contentType); }}
              >
                <Typography variant="body2" noWrap sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                  {it.fileName ?? it.storageKey ?? '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {it.description}
                </Typography>
              </TableCell>
              <TableCell>{it.kind ?? (it.contentType?.split('/')[0] ?? '-')}</TableCell>
              <TableCell>{fmtSize(it.sizeBytes)}</TableCell>
              <TableCell>
                <Stack direction="column" spacing={0.25}>
                  <Typography variant="body2">{it.createdUserName ?? '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{it.createdUtc ? new Date(it.createdUtc).toLocaleString() : '-'}</Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                {/* <Tooltip title="Preview inline">
                  <span>
                    <IconButton size="small" onClick={() => onPreview(it.id, it.contentType)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip> */}
                {/* <Tooltip title="Open (detached)">
                  <IconButton size="small" onClick={() => onOpenDetached(it.id, it.contentType, it.fileName)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip> */}
                {/* <Tooltip title="Download">
                  <IconButton size="small" onClick={() => onDownload(it.id, it.fileName)}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip> */}
                { !readOnly && (() => {
                  const isCreator = !!currentUser && (currentUser.id === (it.createdUserId ?? null));
                  return (
                    <Tooltip title={isCreator ? 'ลบ' : 'ไม่สามารถลบได้'}>
                      <span>
                        <IconButton size="small" onClick={() => onDelete(it.id)} disabled={!isCreator}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })()}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={5}><Typography color="text.secondary">No attachments</Typography></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  // build form panel once so we can place it left/right responsively
  const formPanel = (
    // render as div to avoid nested <form> when this component is placed inside another form
    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Tabs
        value={uploadMode}
        onChange={(_, v) => setUploadMode(v as 'upload' | 'link')}
        aria-label="Attachment mode"
        variant="standard"
        textColor="primary"
        indicatorColor="primary"
        sx={{ alignSelf: 'flex-start' }}
      >
        <Tab icon={<UploadFileIcon />} iconPosition="start" label="File" value="upload" />
        <Tab icon={<LinkIcon />} iconPosition="start" label="Link" value="link" />
      </Tabs>

      {uploadMode === 'upload' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Dropzone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer?.files?.[0];
              if (f) handleFile(f);
            }}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              textAlign: 'center',
              bgcolor: 'background.paper',
              '&:hover': { borderColor: 'primary.main' },
              minHeight: 96,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Drop file here</Typography>
            <Typography variant="caption" color="text.secondary">or</Typography>
            <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()} startIcon={<UploadFileIcon />}>
              Choose file
            </Button>
            <Typography variant="caption" color="text.secondary">Supported: images, audio, video, pdf, other files</Typography>
          </Box>

          {/* show selected file as first row (icon, name, size, remove) */}
          {selectedFile && (
            <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: 36, justifyContent: 'center' }}>
                { selectedFile.type.startsWith('image/') ? <ImageIcon /> :
                  selectedFile.type.startsWith('video/') ? <MovieIcon /> :
                  selectedFile.type.startsWith('audio/') ? <InsertDriveFileIcon /> :
                  <InsertDriveFileIcon /> }
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography variant="body2" noWrap>{selectedFile.name}</Typography>
                <Typography variant="caption" color="text.secondary">{fmtSize(selectedFile.size)} • {kind ?? '-'}</Typography>
              </Box>
              <IconButton size="small" onClick={() => { setSelectedFile(null); setKind(undefined); }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Paper>
          )}

          {/* no progress bar; button shows loading state */}

          {/* description separate row (full width textarea) */}
          <Box>
            <TextField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" multiline minRows={3} fullWidth size="small" />
          </Box>

          {/* Upload + Clear buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              disabled={uploading || !selectedFile}
              onClick={async () => {
                if (!selectedFile) {
                  openAlert('ผิดพลาด', 'กรุณาเลือกไฟล์ก่อน');
                  return;
                }
                await onUpload();
              }}
            >
              {uploading ? <CircularProgress size={16} color="inherit" /> : 'Upload'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => { setSelectedFile(null); setKind(undefined); setDescription(''); }}
              disabled={!selectedFile || uploading}
            >
              CLEAR
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link URL" fullWidth size="small" />
          <TextField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" multiline minRows={3} fullWidth size="small" />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<LinkIcon />} disabled={!linkUrl || uploading} onClick={async () => await onUpload()}>{uploading ? 'Uploading...' : 'Upload'}</Button>
            <Button variant="outlined" onClick={() => { setLinkUrl(''); setDescription(''); }} disabled={!linkUrl || uploading}>CLEAR</Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      {/* hidden file input */}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => onPickFile(e)} />

      {/* <Typography variant="h6" sx={{ mb: 1 }}>Attachments</Typography> */}

      {/* List first (top), form below */}
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {/* show list view (table on large, list on small) */}
      {isSmall ? renderListView() : renderTableView()}

      {/* form placed under the list */}
      {/* show toggle button and reveal form only when not readonly */}
      {!readOnly && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: showForm ? 1 : 0 }}>
            <Button
              variant={showForm ? 'outlined' : 'contained'}
              startIcon={showForm ? <CloseIcon /> : <UploadFileIcon />}
              onClick={() => setShowForm(s => !s)}
            >
              {showForm ? 'Close' : 'Add Attachment'}
            </Button>
          </Box>
          {showForm && formPanel}
        </Box>
      )}

      <Dialog open={!!previewBlobUrl || selectedId !== null} onClose={closePreview} maxWidth="md" fullWidth fullScreen={dialogFullScreen}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>Preview {previewFileName ? `— ${previewFileName}` : ''}</Typography>
            {/* keep only title here to avoid overflow on small screens */}
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {previewDescription && (
            <Paper variant="outlined" sx={{ width: '100%', p: 2, bgcolor: 'background.paper' }}>
              <Typography
                variant="body1"
                component="div"
                sx={{
                  color: 'text.primary',
                  whiteSpace: 'pre-wrap',
                  fontSize: { xs: 14, sm: 15 },
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}
              >
                {previewDescription}
              </Typography>
            </Paper>
          )}
          {previewExternalUrl && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', p: 1 }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{previewExternalUrl}</Typography>
              <Stack direction="row" spacing={1}>
                <Button startIcon={<OpenInNewIcon />} onClick={() => window.open(previewExternalUrl, '_blank')}>Open</Button>
                <Button onClick={() => navigator.clipboard?.writeText(previewExternalUrl)}>Copy</Button>
              </Stack>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {previewBlobUrl && previewMime && previewMime.startsWith('image/') && (
              <img src={previewBlobUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            )}
            {previewBlobUrl && previewMime && previewMime.startsWith('video/') && (
              <video src={previewBlobUrl} controls style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            )}
            {previewBlobUrl && previewMime && previewMime.startsWith('audio/') && (
              <audio src={previewBlobUrl} controls style={{ width: '100%' }} />
            )}
            {previewBlobUrl && previewMime && previewMime === 'application/pdf' && (
              <iframe src={previewBlobUrl} title="pdf" style={{ width: '100%', height: '80vh', border: 'none' }} />
            )}
            {(!previewBlobUrl && !previewMime) && <Typography color="text.secondary">No preview available</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 2, pb: 2 }}>
          <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadFromDialog(selectedId ?? undefined)}>Download</Button>
          <Button size="small" startIcon={<OpenWithIcon />} onClick={() => detachPreview(selectedId ?? undefined)}>Detach</Button>
          <Box sx={{ flex: 1 }} /> {/* push close to right */}
          <IconButton size="small" onClick={closePreview}><CloseIcon /></IconButton>
        </DialogActions>
      </Dialog>

      {/* Confirm / Alert / Snackbar components */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmOk}
        confirmLabel="ตกลง"
        cancelLabel="ยกเลิก"
      />
      <AlertDialog open={alertOpen} title={alertTitle ?? 'แจ้งเตือน'} message={alertMessage ?? ''} onClose={() => setAlertOpen(false)} />
      <SnackbarAlert open={snackbarOpen} message={snackbarMessage} severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} />
    </Box>
  );
}