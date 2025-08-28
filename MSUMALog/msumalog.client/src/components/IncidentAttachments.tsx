import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box, Button, Dialog,
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
  Table, TableBody, TableCell, TableHead,
  TableRow, TextField,
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
  uploadIncidentAttachment
} from '../api/client';

type Props = {
  incidentId: number;
};

export default function IncidentAttachments({
  incidentId
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
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [previewDescription, setPreviewDescription] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const previewWindowRef = useRef<Window | null>(null);

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

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setKind(detectKindFromMime(f?.type ?? null));
  };

  async function onUpload(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadIncidentAttachment({ file: selectedFile, incidentId, description: description || undefined, kind: kind || undefined });
      setSelectedFile(null);
      setDescription('');
      setKind('File');
      await loadList();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id?: number) {
    if (!id) return;
    if (!confirm('Delete attachment?')) return;
    try {
      await deleteIncidentAttachment(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  }

  async function onPreview(id?: number, contentType?: string | null) {
    if (!id) return;
    try {
      setSelectedId(id);
      const meta = items.find(x => x.id === id);
      setPreviewDescription(meta?.description ?? null);
      setPreviewFileName(meta?.fileName ?? meta?.storageKey ?? null);
      const res = await downloadIncidentAttachmentBlob(id, { fetchExternal: true });
      if (typeof res === 'string') {
        window.open(res, '_blank');
        return;
      }
      const blob = res as Blob;
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setPreviewMime(contentType ?? blob.type ?? 'application/octet-stream');
    } catch (e) {
      console.error(e);
      alert('Preview failed');
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
      alert('Open failed');
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
        if (confirm('This file is hosted externally. Open external URL? (OK=Open, Cancel=Download via CORS if supported)')) {
          window.open(info.externalUrl, '_blank');
          return;
        }
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
      alert('Download failed');
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
      alert('Detach failed');
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
      alert('Download failed');
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
                    <IconButton size="small" onClick={() => onDownload(it.id, it.fileName)} aria-label="download">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemButton onClick={() => onPreview(it.id, it.contentType)} selected={selectedId === it.id} sx={{ py: 1.25 }}>
                  <ListItemText
                    primary={<Typography variant="body1" noWrap sx={{ fontSize: 15 }}>{it.fileName ?? it.storageKey ?? '-'}</Typography>}
                    secondary={
                      <Stack direction="column" spacing={0.25}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 12 }}>{it.description}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{fmtSize(it.sizeBytes)} • {it.createdUtc ? new Date(it.createdUtc).toLocaleString() : '-'}</Typography>
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
            <TableCell>Uploaded</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(it => (
            <TableRow key={it.id}>
              <TableCell>
                <Typography variant="body2">{it.fileName ?? it.storageKey ?? '-'}</Typography>
                <Typography variant="caption" color="text.secondary">{it.description}</Typography>
              </TableCell>
              <TableCell>{it.kind ?? (it.contentType?.split('/')[0] ?? '-')}</TableCell>
              <TableCell>{fmtSize(it.sizeBytes)}</TableCell>
              <TableCell>{it.createdUtc ? new Date(it.createdUtc).toLocaleString() : '-'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Preview inline">
                  <span>
                    <IconButton size="small" onClick={() => onPreview(it.id, it.contentType)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Open (detached)">
                  <IconButton size="small" onClick={() => onOpenDetached(it.id, it.contentType, it.fileName)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={() => onDownload(it.id, it.fileName)}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => onDelete(it.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>Attachments</Typography>

      <Box component="form" onSubmit={onUpload} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <input type="file" onChange={onPickFile} title="file" />
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 140, gap: 0 }}>
          <Typography variant="caption" color="text.secondary">Detected</Typography>
          <Typography variant="body2">{kind ?? '-'}</Typography>
        </Box>
        <TextField size="small" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button type="submit" variant="contained" startIcon={<UploadFileIcon />} disabled={!selectedFile || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {isSmall ? renderListView() : renderTableView()}

      <Dialog open={!!previewBlobUrl || selectedId !== null} onClose={closePreview} maxWidth="md" fullWidth fullScreen={dialogFullScreen}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>Preview {previewFileName ? `— ${previewFileName}` : ''}</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadFromDialog(selectedId ?? undefined)}>Download</Button>
              <Button size="small" startIcon={<OpenWithIcon />} onClick={() => detachPreview(selectedId ?? undefined)}>Detach</Button>
              <IconButton size="small" onClick={closePreview}><CloseIcon /></IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {previewDescription && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{previewDescription}</Typography>
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
      </Dialog>
    </Box>
  );
}