import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Box, Button, Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Table, TableBody, TableCell, TableHead,
    TableRow, TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

// add: use api client functions + types
import type { IncidentAttachmentDto } from '../api/client';
import {
    deleteIncidentAttachment,
    downloadIncidentAttachmentBlob,
    getIncidentAttachmentsByIncident,
    uploadFileUpload,
    uploadIncidentAttachment
} from '../api/client';

type Props = {
  incidentId: number;
 
};

export default function IncidentAttachments({
  incidentId
}: Props) {
  const [items, setItems] = useState<IncidentAttachmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState('File');
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const previewWindowRef = useRef<Window | null>(null);

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
  };

  async function onUpload(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      // use client helper for multipart upload
      await uploadIncidentAttachment({ file: selectedFile, incidentId, description: description || undefined, kind: kind || undefined });
      setSelectedFile(null);
      setDescription('');
      setKind('File');
      // reload list (or optimistically add)
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

  // fetch raw file blob and show inline
  async function onPreview(id?: number, contentType?: string | null) {
    if (!id) return;
    try {
      const blob = await downloadIncidentAttachmentBlob(id);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setPreviewMime(contentType ?? blob.type ?? 'application/octet-stream');
    } catch (e) {
      console.error(e);
      alert('Preview failed');
    }
  }

  // open detach window using blob
  async function onOpenDetached(id?: number, contentType?: string | null, fileName?: string | null) {
    if (!id) return;
    try {
      const blob = await downloadIncidentAttachmentBlob(id);
      const url = URL.createObjectURL(blob);
      const w = window.open('', '_blank');
      if (!w) {
        // fallback to open object URL directly
        window.open(url);
        return;
      }
      previewWindowRef.current = w;
      // if previewable (image/pdf/video) embed; otherwise prompt download
      const mime = contentType ?? blob.type;
      if (mime?.startsWith('image/') || mime?.startsWith('video/') || mime?.startsWith('audio/') || mime === 'application/pdf') {
        w.document.title = fileName ?? 'Attachment';
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
        // download
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

  // download directly (stream)
  async function onDownload(id?: number, fileName?: string | null) {
    if (!id) return;
    try {
      const blob = await downloadIncidentAttachmentBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName ?? 'file';
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
    }
    if (previewWindowRef.current && !previewWindowRef.current.closed) {
      previewWindowRef.current.close();
      previewWindowRef.current = null;
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>Attachments</Typography>

      <Box component="form" onSubmit={onUpload} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <input type="file" onChange={onPickFile} title='file' />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="attach-kind-label">Kind</InputLabel>
          <Select labelId="attach-kind-label" value={kind} label="Kind" onChange={(e) => setKind(String(e.target.value))}>
            <MenuItem value="File">File</MenuItem>
            <MenuItem value="Image">Image</MenuItem>
            <MenuItem value="Video">Video</MenuItem>
            <MenuItem value="Audio">Audio</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button type="submit" variant="contained" startIcon={<UploadFileIcon />} disabled={!selectedFile || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

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

      {/* Preview dialog */}
      <Dialog open={!!previewBlobUrl} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>Preview</DialogTitle>
        <DialogContent sx={{ minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
          {previewBlobUrl && previewMime && !(
            previewMime.startsWith('image/') || previewMime.startsWith('video/') || previewMime.startsWith('audio/') || previewMime === 'application/pdf'
          ) && (
            <Box>
              <Typography>Preview not available for this file type.</Typography>
              <Button startIcon={<DownloadIcon />} onClick={() => {
                // prompt download
                const a = document.createElement('a');
                a.href = previewBlobUrl;
                a.download = 'file';
                document.body.appendChild(a); a.click(); a.remove();
              }}>Download</Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}