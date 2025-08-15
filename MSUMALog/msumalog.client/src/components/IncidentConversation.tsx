import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Stack, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import TurndownService from 'turndown';

interface Comment {
  id: string;
  author: string;
  body: string;       // markdown or raw <img> html snippet
  created_at: string;
  caseNo?: string;
}

// TODO: replace with real API
const fetchComments = async (caseNo: string): Promise<Comment[]> => {
  return [
    { id: 'c1', author: 'Admin', body: 'รับทราบ เคสกำลังตรวจสอบ', created_at: '2025-08-11 09:10', caseNo },
    { id: 'c2', author: 'Reporter', body: 'อัปเดตล่าสุดเปลี่ยนอะไหล่แล้ว', created_at: '2025-08-12 14:22', caseNo }
  ];
};

// TODO: replace with real POST API
const postComment = async (_caseNo: string, comment: Omit<Comment, 'id' | 'created_at'>) => {
  await new Promise(r => setTimeout(r, 150));
  return {
    id: Math.random().toString(36).slice(2),
    created_at: new Date().toISOString(),
    ...comment
  } as Comment;
};

interface Props {
  caseNo: string;
  currentUser?: string;
  heightMin?: number;
}

const IncidentConversation: React.FC<Props> = ({ caseNo, currentUser = 'CurrentUser', heightMin = 140 }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!caseNo) return;
    (async () => {
      const list = await fetchComments(caseNo);
      setComments(list);
    })();
  }, [caseNo]);

  useEffect(() => {
    turndownRef.current = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      keepReplacement: (content) => content
    });
    // Preserve styled <img>
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
    if (!hasComment) return;
    setSubmitting(true);
    try {
      const created = await postComment(caseNo, {
        author: currentUser,
        body: newComment.trim(),
        caseNo
      });
      setComments(prev => [created, ...prev]);
      setNewComment('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        editorHtmlRef.current = '';
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
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
                rehypePlugins={[rehypeRaw]}
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
                className="range-input"
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
        disabled={!hasComment || submitting}
        onClick={submitComment}
      >
        {submitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </Box>
  );
};

export default IncidentConversation;