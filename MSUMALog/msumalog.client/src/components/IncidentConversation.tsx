import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TurndownService from 'turndown';
import {
  getCommentsByCase,
  createComment,
  deleteComment,
  getIncidentByCase,
  type IncidentCommentDto
} from '../api/client';

interface Props {
  caseNo: string;
  incidentId?: number;          // optional (ถ้าไม่ส่งมาจะโหลดเองจาก caseNo)
  currentUser?: string;
  heightMin?: number;
  enableDelete?: boolean;
}

const IncidentConversation: React.FC<Props> = ({
  caseNo,
  incidentId: incidentIdProp,
  currentUser = 'CurrentUser',
  heightMin = 140,
  enableDelete = true
}) => {
  const [incidentId, setIncidentId] = useState<number | null>(incidentIdProp ?? null);
  const [comments, setComments] = useState<IncidentCommentDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor refs/state
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorHtmlRef = useRef<string>('');
  const savedSelectionRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const turndownRef = useRef<TurndownService | null>(null);

  // Image resize states
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imgToolbarPos, setImgToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [imgWidthPercent, setImgWidthPercent] = useState<number>(100);

  // Load incident id if not provided
  useEffect(() => {
    let ignore = false;
    const resolveIncident = async () => {
      if (incidentIdProp) {
        setIncidentId(incidentIdProp);
        return;
      }
      if (!caseNo) return;
      setLoading(true);
      setError(null);
      try {
        const dto = await getIncidentByCase(caseNo);
        if (ignore) return;
        setIncidentId(dto.id!);
      } catch (e: any) {
        if (!ignore) setError(e?.response?.data?.message || e?.message || 'Load incident failed');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    resolveIncident();
    return () => { ignore = true; };
  }, [caseNo, incidentIdProp]);

  // Load comments by case
  useEffect(() => {
    if (!caseNo) return;
    let ignore = false;
    const loadComments = async () => {
      setLoadingComments(true);
      setError(null);
      try {
        const list = await getCommentsByCase(caseNo);
        if (!ignore) setComments(list);
      } catch (e: any) {
        if (!ignore) setError(e?.response?.data?.message || e?.message || 'Load comments failed');
      } finally {
        if (!ignore) setLoadingComments(false);
      }
    };
    loadComments();
    return () => { ignore = true; };
  }, [caseNo]);

  useEffect(() => {
    turndownRef.current = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      keepReplacement: (content) => content
    });
    turndownRef.current.addRule('imageKeepStyle', {
      filter: 'img',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      replacement: (_c, node: any) => {
        const src = node.getAttribute('src') || '';
        const alt = (node.getAttribute('alt') || '').replace(/"/g, "'");
        const style = node.getAttribute('style') || '';
        if (/width\s*:/.test(style)) return `<img src="${src}" alt="${alt}" style="${style}" />`;
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

  const format = (cmd: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    syncFromEditor();
  };

  const syncFromEditor = () => {
    const html = editorRef.current?.innerHTML || '';
    editorHtmlRef.current = html;
    const td = turndownRef.current;
    if (td) {
      const md = td.turndown(
        html
          .replace(/<div><br><\/div>/g, '<br>')
          .replace(/<div>/g, '\n')
          .replace(/<\/div>/g, '')
      );
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

  const submitComment = async () => {
    if (!hasComment || submitting || !incidentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createComment({
        incidentReportId: incidentId,
        author: currentUser,
        body: newComment.trim()
      });
      setComments(prev => [created, ...prev]);
      setNewComment('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        editorHtmlRef.current = '';
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Create comment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!enableDelete) return;
    const yes = window.confirm('Delete this comment?');
    if (!yes) return;
    try {
      await deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Discussions</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {(loading || loadingComments) && comments.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">Loading...</Typography>
        </Box>
      )}

      <Stack spacing={2} sx={{ mb: 4 }}>
        {comments.map(c => {
          const createdLocal = new Date(c.createdUtc).toLocaleString();
          return (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  {c.author}{' '}
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                    {createdLocal}
                  </Typography>
                </Typography>
                {enableDelete && (
                  <Tooltip title="Delete comment">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(c.id)}
                      sx={{ ml: 'auto' }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Box sx={{ mt: 0.5, fontSize: '.9rem' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: (props) => <img {...props} style={{ maxWidth: '100%', borderRadius: 4, ...(props.style || {}) }} />
                  }}
                >
                  {c.body}
                </ReactMarkdown>
              </Box>
            </Paper>
          );
        })}
        {!loadingComments && comments.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No comments yet.
          </Typography>
        )}
      </Stack>

      <Typography variant="h6" sx={{ mb: 2 }}>New Comment</Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={() => format('bold')} startIcon={<FormatBoldIcon />}>Bold</Button>
        <Button size="small" variant="outlined" onClick={() => format('italic')} startIcon={<FormatItalicIcon />}>Italic</Button>
        <Button size="small" variant="outlined" onClick={() => format('insertUnorderedList')} startIcon={<ListIcon />}>List</Button>
        <Button size="small" variant="outlined" onClick={handlePickImage} startIcon={<ImageIcon />}>Image</Button>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </Stack>

      <Box sx={{ mb: 2, position: 'relative' }}>
        <Box
          id="conversation-comment-editor"
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { syncFromEditor(); saveSelection(); }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onClick={handleEditorClick}
          sx={{
            minHeight: heightMin,
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
              <label htmlFor="image-width-range" className="hidden-label">Image Width</label>
              <input
                id="image-width-range"
                type="range"
                min={10}
                max={100}
                step={5}
                value={imgWidthPercent}
                onChange={(e) => applyImageWidth(parseInt(e.target.value))}
                className="image-width-range"
                placeholder="Adjust image width"
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

      <Button
        variant="contained"
        disabled={!hasComment || submitting || !incidentId}
        onClick={submitComment}
      >
        {submitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </Box>
  );
};

export default IncidentConversation;