import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, Stack, Divider, TextField, Button, MenuItem
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import PreviewIcon from '@mui/icons-material/Preview';

interface Incident {
  case_no: string;
  status: string;
  asset: string;
  center: string;
  incident_date: string;
  symptoms: string;
  severity: string;
  impact: string;
  domain: string;
  sub_domain: string;
  vendor: string;
  manufacturer: string;
  part_number: string;
  interim_action: string;
  intermediate_action: string;
  long_term_action: string;
  created_by: string;
}

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
  caseNo?: string;
}

const mockFetchIncident = async (caseNo: string): Promise<Incident> => {
  // TODO: replace with real fetch(`/api/incidents/${caseNo}`)
  return new Promise(resolve =>
    setTimeout(() => resolve({
      case_no: caseNo,
      status: 'In Progress',
      asset: 'รถ MSU-6',
      center: 'รพร.ปัว',
      incident_date: '2025-08-10',
      symptoms: 'คลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ รถขับไม่ได้',
      severity: 'สูงที่สุด (5)',
      impact: 'หยุดการให้บริการ',
      domain: '001',
      sub_domain: 'ตัวรถและเครื่องยนต์',
      vendor: 'RMA',
      manufacturer: 'Mecedenz-Benz',
      part_number: 'OF-917 version Euro3',
      interim_action: 'เติมน้ำมันคลัช / ไล่ลม',
      intermediate_action: 'ตรวจระบบคลัช / ขอใบเสนอราคา',
      long_term_action: 'วางแผน PM + Training',
      created_by: 'Pornchai Chanyagorn'
    }), 300)
  );
};

const mockFetchComments = async (caseNo: string): Promise<Comment[]> => {
    // TODO: replace with real fetch(`/api/incidents/${caseNo}/comments`)
    console.log('Fetching comments for case:', caseNo);
  return [
      { id: 'c1', author: 'Admin', body: 'รับทราบ เคสกำลังตรวจสอบ', created_at: '2025-08-11 09:10', caseNo: caseNo },
      { id: 'c2', author: 'Reporter', body: 'อัปเดตล่าสุดเปลี่ยนอะไหล่แล้ว', created_at: '2025-08-12 14:22', caseNo: caseNo }
  ];
};

const statusOptions = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

const IncidentReportDetail: React.FC = () => {
  const { case_no } = useParams<{ case_no: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!case_no) return;
    (async () => {
      const data = await mockFetchIncident(case_no);
      setIncident(data);
      setStatus(data.status);
      const cmt = await mockFetchComments(case_no);
      setComments(cmt);
    })();
  }, [case_no]);

  const handleSubmitAction = async () => {
    if (!incident) return;
    const hasComment = newComment.trim().length > 0;
    const statusChanged = status !== incident.status;
    if (!hasComment && !statusChanged) return;

    setSubmitting(true);
    try {
      if (statusChanged) {
        // TODO: PATCH /api/incidents/{case_no} { status }
        console.log('PATCH status =>', status);
        setIncident(prev => prev ? { ...prev, status } : prev);
      }
      if (hasComment) {
        // TODO: POST /api/incidents/{case_no}/comments
        const newItem: Comment = {
          id: Math.random().toString(36).slice(2),
          author: 'CurrentUser',
          body: newComment.trim(),
          created_at: new Date().toISOString()
        };
        setComments(prev => [newItem, ...prev]);
        setNewComment('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const applyWrap = (wrapper: { prefix: string; suffix?: string }) => {
    const textarea = document.getElementById('comment-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newComment.substring(0, start);
    const selected = newComment.substring(start, end);
    const after = newComment.substring(end);
    const suffix = wrapper.suffix ?? wrapper.prefix;
    const next = before + wrapper.prefix + selected + suffix + after;
    setNewComment(next);
    // restore selection roughly
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + wrapper.prefix.length;
      textarea.selectionEnd = start + wrapper.prefix.length + selected.length;
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById('comment-editor') as HTMLTextAreaElement | null;
    if (!textarea) {
      setNewComment(prev => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newComment.substring(0, start);
    const after = newComment.substring(end);
    const next = before + text + after;
    setNewComment(next);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      insertAtCursor(`\n![image](${dataUrl})\n`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasComment = newComment.trim().length > 0;
  const statusChanged = status !== incident?.status;
  const actionLabel = statusChanged && hasComment
    ? 'Update Status & Comment'
    : statusChanged
      ? 'Update Status'
      : hasComment
        ? 'Comment'
        : 'Nothing to submit';

  if (!incident) {
    return <Typography sx={{ mt: 4 }}>Loading incident...</Typography>;
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5">Incident #{incident.case_no}</Typography>
        <Chip label={incident.status} color="primary" />
      </Stack>

      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Created by {incident.created_by} | Incident Date: {incident.incident_date}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2">Symptoms</Typography>
      <Typography sx={{ mb: 2 }}>{incident.symptoms}</Typography>

      <Stack direction="row" spacing={4} flexWrap="wrap" sx={{ mb: 2 }}>
        <Box><Typography variant="caption">Severity</Typography><Typography>{incident.severity}</Typography></Box>
        <Box><Typography variant="caption">Impact</Typography><Typography>{incident.impact}</Typography></Box>
        <Box><Typography variant="caption">Domain</Typography><Typography>{incident.domain}</Typography></Box>
        <Box><Typography variant="caption">Sub-domain</Typography><Typography>{incident.sub_domain}</Typography></Box>
      </Stack>

      <Typography variant="subtitle2">Actions</Typography>
      <Box sx={{ pl: 1, mb: 2 }}>
        <Typography variant="caption">Interim</Typography><Typography>{incident.interim_action}</Typography>
        <Typography variant="caption">Intermediate</Typography><Typography>{incident.intermediate_action}</Typography>
        <Typography variant="caption">Long-term</Typography><Typography>{incident.long_term_action}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Comments list BEFORE form & status (GitHub style) */}
      <Typography variant="h6" sx={{ mb: 1 }}>Conversation</Typography>
      <Stack spacing={2} sx={{ mb: 4 }}>
        {comments.map(c => (
          <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2">
              {c.author}{' '}
              <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                {c.created_at}
              </Typography>
            </Typography>
            <Box sx={{ mt: 0.5, fontSize: '.9rem' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: (props) => <img {...props} style={{ maxWidth: '100%', borderRadius: 4 }} />
                }}
              >
                {c.body}
              </ReactMarkdown>
            </Box>
          </Paper>
        ))}
        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No comments yet.
          </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>Comment / Status</Typography>

      {/* Toolbar */}
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={() => applyWrap({ prefix: '**' })} startIcon={<FormatBoldIcon />}>Bold</Button>
        <Button size="small" variant="outlined" onClick={() => applyWrap({ prefix: '_', suffix: '_' })} startIcon={<FormatItalicIcon />}>Italic</Button>
        <Button size="small" variant="outlined" onClick={() => insertAtCursor('\n- List item\n- List item\n')} startIcon={<ListIcon />}>List</Button>
        <Button size="small" variant="outlined" onClick={() => applyWrap({ prefix: '`' })} startIcon={<CodeIcon />}>Code</Button>
        <Button size="small" variant="outlined" onClick={handlePickImage} startIcon={<ImageIcon />}>Image</Button>
        <Button
          size="small"
          variant={preview ? 'contained' : 'outlined'}
          color="secondary"
          onClick={() => setPreview(p => !p)}
          startIcon={<PreviewIcon />}
        >
          {preview ? 'Editing' : 'Preview'}
        </Button>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </Stack>

      <Box sx={{ mb: 2 }}>
        {!preview ? (
          <TextField
            id="comment-editor"
            label="Write a comment (Markdown supported)"
            multiline
            minRows={5}
            fullWidth
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="You can use **bold**, _italic_, lists, code, and paste images."
          />
        ) : (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Preview</Typography>
            <Box sx={{ mt: 1, fontSize: '.9rem' }}>
              {newComment.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: (props) => <img {...props} style={{ maxWidth: '100%', borderRadius: 4 }} />
                  }}
                >
                  {newComment}
                </ReactMarkdown>
              ) : (
                <Typography variant="body2" color="text.secondary">Nothing to preview.</Typography>
              )}
            </Box>
          </Paper>
        )}
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        sx={{ mb: 2 }}
      >
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 200 } }}
        >
          {statusOptions.map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>

        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Button
            variant="contained"
            color={statusChanged ? 'success' : 'primary'}
            disabled={!(statusChanged || hasComment) || submitting}
            onClick={handleSubmitAction}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}
          >
            {submitting ? 'Saving...' : actionLabel}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default IncidentReportDetail;