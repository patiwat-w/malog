import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, Stack, Divider, TextField, Button, MenuItem
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import { getIncidentByCase, updateIncidentFull, type IncidentReportDto } from '../api/client';
import { getDomainLabel, getSeverityLabel } from '../constants/incidentOptions';
import TurndownService from 'turndown';

interface Incident extends Omit<IncidentReportDto,
  'additional_info' | 'responsible_name' | 'responsible_lineid' | 'responsible_email' | 'responsible_phone'> {
  id: number;
}

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
  caseNo?: string;
}

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
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const editorHtmlRef = React.useRef<string>(''); // optional: keep latest HTML if needed
  const savedSelectionRef = React.useRef<Range | null>(null); // NEW: keep last caret/selection
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const turndownRef = React.useRef<TurndownService | null>(null);

  // NEW: image resize states
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imgToolbarPos, setImgToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [imgWidthPercent, setImgWidthPercent] = useState<number>(100);

  const severityColorMap: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    Low: 'primary',
    Medium: 'warning',
    High: 'error',
    Critical: 'error'
  };

  const getStatusChipColor = (s: string) => {
    if (!s) return 'default' as const;
    if (s === 'Resolved' || s === 'Closed') return 'success' as const;
    if (s === 'In Progress' || s === 'Pending') return 'warning' as const;
    if (s === 'Open') return 'primary' as const;
    return 'default' as const;
  };

  const DetailField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
    const childText = typeof children === 'string' ? children : undefined;
    const isSeverity = label.toLowerCase() === 'severity';
    return (
      <Box sx={{ minWidth: { xs: '48%', sm: 160 }, flexGrow: 1, mb: { xs: 1.25, sm: 0 } }}>
        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            fontWeight: 700,
            letterSpacing: '.6px',
            color: 'text.secondary',
            textTransform: 'uppercase',
            backgroundColor: 'rgba(0,0,0,0.03)',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            mb: 0.5
          }}
        >
          {label}
        </Typography>

        {isSeverity && childText ? (
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={childText || '-'}
              color={severityColorMap[childText ?? ''] ?? 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              mt: 0.5,
              p: 1,
              bgcolor: 'background.default',
              borderLeft: '4px solid',
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Typography sx={{ fontSize: '.95rem', fontWeight: 500, color: 'text.primary', wordBreak: 'break-word' }}>
              {children || '-'}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (!case_no) return;
    (async () => {
      try {
        const data = await getIncidentByCase(case_no);
        if (!data) return;
        const mapped: Incident = {
          case_no: data.case_no || '',
          status: data.status || '',
          asset: data.asset || '',
          center: data.center || '',
          incident_date: data.incident_date || '',
          symptoms: data.symptoms || '',
          severity: data.severity || '',
          impact: data.impact || '',
          domain: data.domain || '',
          sub_domain: data.sub_domain || '',
          vendor: data.vendor || '',
          manufacturer: data.manufacturer || '',
          part_number: data.part_number || '',
          interim_action: data.interim_action || '',
          intermediate_action: data.intermediate_action || '',
          long_term_action: data.long_term_action || '',
          created_by: data.created_by || '',
          id: data.id ?? 0
        };
        setIncident(mapped);
        setStatus(mapped.status ?? '');
        const cmt = await mockFetchComments(case_no);
        setComments(cmt);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [case_no]);

  useEffect(() => {
    turndownRef.current = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      keepReplacement: (content) => content
    });

    // Keep <img> with style for size
    turndownRef.current.addRule('imageKeepStyle', {
      filter: 'img',
      replacement: (_content, node: any) => {
        const src = node.getAttribute('src') || '';
        const alt = (node.getAttribute('alt') || '').replace(/"/g, "'");
        const style = node.getAttribute('style') || '';
        // If style has width keep as HTML, else normal markdown
        if (/width\s*:/.test(style)) {
          return `<img src="${src}" alt="${alt}" style="${style}" />`;
        }
        return `![${alt}](${src})`;
      }
    });
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.startContainer)) {
        savedSelectionRef.current = range;
      }
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const handleSubmitAction = async () => {
    if (!incident) return;
    const hasComment = newComment.trim().length > 0;
    const statusChanged = status !== incident.status;
    if (!hasComment && !statusChanged) return;

    setSubmitting(true);
    try {
      if (statusChanged) {
        await updateIncidentFull({
          id: incident.id,
          case_no: incident.case_no,
          status,
          asset: incident.asset,
          center: incident.center,
          incident_date: incident.incident_date,
          symptoms: incident.symptoms,
          severity: incident.severity,
          impact: incident.impact,
          domain: incident.domain,
          sub_domain: incident.sub_domain,
          vendor: incident.vendor,
          manufacturer: incident.manufacturer,
          part_number: incident.part_number,
          interim_action: incident.interim_action,
          intermediate_action: incident.intermediate_action,
          long_term_action: incident.long_term_action,
          created_by: incident.created_by
        });
        setIncident(prev => prev ? { ...prev, status } : prev);
      }
      if (hasComment) {
        const newItem: Comment = {
          id: Math.random().toString(36).slice(2),
          author: 'CurrentUser',
          body: newComment.trim(), // store markdown
          created_at: new Date().toISOString()
        };
        setComments(prev => [newItem, ...prev]);
        setNewComment('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
          editorHtmlRef.current = '';
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const format = (cmd: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(cmd, false, value);
    syncFromEditor();
  };

  const syncFromEditor = () => {
    const html = editorRef.current?.innerHTML || '';
    editorHtmlRef.current = html; // store but do NOT setState causing re-render
    const td = turndownRef.current;
    if (td) {
      const md = td.turndown(html
        .replace(/<div><br><\/div>/g, '<br>')
        .replace(/<div>/g, '\n')
        .replace(/<\/div>/g, ''));
      setNewComment(md.trim());
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    syncFromEditor();
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      insertHtmlAtCursor(`<img src="${dataUrl}" alt="image" style="max-width:100%;border-radius:4px;" />`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEditorClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      // derive width %
      const editor = editorRef.current!;
      const editorRect = editor.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const percent = (() => {
        const wStyle = img.style.width;
        if (wStyle && wStyle.endsWith('%')) return parseInt(wStyle);
        return Math.round((imgRect.width / editorRect.width) * 100);
      })();
      setImgWidthPercent(Math.min(100, Math.max(5, percent)));
      setImgToolbarPos({
        x: imgRect.left - editorRect.left,
        y: imgRect.bottom - editorRect.top + 4
      });
    } else {
      setSelectedImage(null);
      setImgToolbarPos(null);
    }
  };

  const applyImageWidth = (pct: number) => {
    if (!selectedImage) return;
    const clamped = Math.min(100, Math.max(5, pct));
    selectedImage.style.width = clamped + '%';
    selectedImage.style.maxWidth = '100%';
    selectedImage.style.borderRadius = selectedImage.style.borderRadius || '4px';
    setImgWidthPercent(clamped);
    syncFromEditor();
  };

  const clearImageWidth = () => {
    if (!selectedImage) return;
    selectedImage.style.removeProperty('width');
    syncFromEditor();
    setImgWidthPercent(100);
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
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Incident #{incident.case_no}
        </Typography>
        <Chip label={incident.status} color={getStatusChipColor(incident.status || '')} size="small" sx={{ fontWeight: 700 }} />
      </Stack>

      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Created by <strong>{incident.created_by}</strong> &nbsp;|&nbsp; Incident Date: {incident.incident_date}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Symptoms */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          position: 'relative',
          bgcolor: 'background.default',
          '&:before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            bgcolor: 'primary.main',
            opacity: 0.4
          }
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          Symptoms
        </Typography>
        <Typography sx={{ mt: .5, fontSize: '.95rem' }}>
          {incident.symptoms || '-'}
        </Typography>
      </Box>

      {/* Meta Fields */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 600 }}>
          Details
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
          <DetailField label="Severity">{getSeverityLabel(incident.severity)}</DetailField>
          <DetailField label="Impact">{incident.impact}</DetailField>
          <DetailField label="Domain">{getDomainLabel(incident.domain)}</DetailField>
          <DetailField label="Sub-domain">{incident.sub_domain}</DetailField>
        </Stack>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 600 }}>
          Actions
        </Typography>
        <Stack spacing={1.2} sx={{ mt: 1 }}>
          <DetailField label="Interim">{incident.interim_action}</DetailField>
          <DetailField label="Intermediate">{incident.intermediate_action}</DetailField>
          <DetailField label="Long-term">{incident.long_term_action}</DetailField>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Conversation stays the same below */}
      <Typography variant="h6" sx={{ mb: 1 }}>Discussions</Typography>
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
                rehypePlugins={[rehypeRaw]}                // NEW: allow raw <img> with style
                components={{
                  img: (props) => <img {...props} style={{ maxWidth: '100%', borderRadius: 4, ...(props.style || {}) }} />
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

      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={() => format('bold')} startIcon={<FormatBoldIcon />}>Bold</Button>
        <Button size="small" variant="outlined" onClick={() => format('italic')} startIcon={<FormatItalicIcon />}>Italic</Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => format('insertUnorderedList')}   // CHANGED: use native list command
          startIcon={<ListIcon />}
        >
          List
        </Button>
        {/* Optional: add ordered list
        <Button size="small" variant="outlined" onClick={() => format('insertOrderedList')}>OL</Button>
        */}
       
        <Button size="small" variant="outlined" onClick={handlePickImage} startIcon={<ImageIcon />}>Image</Button>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </Stack>

      <Box sx={{ mb: 2, position: 'relative' }}>     {/* position relative for toolbar */}
        <Box
          id="comment-editor"
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { syncFromEditor(); saveSelection(); }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onClick={handleEditorClick}                 // NEW
          sx={{
            minHeight: 140,
            padding: '12px 14px',
            border: '1px solid rgba(0,0,0,0.23)',
            borderRadius: 4,
            fontFamily: 'inherit',
            fontSize: '.95rem',
            outline: 'none',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            background: '#fff',
            cursor: 'text',
            '& img': {
              maxWidth: '100%',
              borderRadius: 1,
              outline: (theme) => selectedImage ? `2px solid ${theme.palette.primary.main}` : 'none'
            }
          }}
          data-placeholder="พิมพ์คอมเมนต์ (WYSIWYG จะถูกแปลงเป็น Markdown อัตโนมัติ)"
        />

        {selectedImage && imgToolbarPos && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              left: imgToolbarPos.x,
              top: imgToolbarPos.y,
              p: 1,
              zIndex: 10,
              minWidth: 220,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Image width: {imgWidthPercent}%
            </Typography>
            <Box sx={{ px: 1 }}>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={imgWidthPercent}
                onChange={(e) => applyImageWidth(parseInt(e.target.value))}
                className="image-width-range"
                title="Adjust image width"
                placeholder="Set image width"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: .5, flexWrap: 'wrap' }}>
              {[25, 50, 75, 100].map(v => (
                <Button
                  key={v}
                  size="small"
                  variant={imgWidthPercent === v ? 'contained' : 'outlined'}
                  onClick={() => applyImageWidth(v)}
                >
                  {v}%
                </Button>
              ))}
              <Button size="small" onClick={clearImageWidth}>Reset</Button>
              <Button
                size="small"
                color="error"
                onClick={() => { setSelectedImage(null); setImgToolbarPos(null); }}
              >
                Close
              </Button>
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