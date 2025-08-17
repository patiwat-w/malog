import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import TurndownService from 'turndown';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import ListIcon from '@mui/icons-material/FormatListBulleted';

interface Props {
  value: string;
  onChange: (md: string) => void;
  minHeight?: number;
  placeholder?: string;
}

const WysiwygMarkdownEditor: React.FC<Props> = ({
  value,
  onChange,
  minHeight = 140,
  placeholder = 'พิมพ์คอมเมนต์ (WYSIWYG จะถูกแปลงเป็น Markdown อัตโนมัติ)'
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const turndownRef = useRef<TurndownService | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Refs used to avoid updating the editor DOM when the change originated here.
  // This prevents the caret from jumping to the start when parent echoes value prop.
  const isLocalChangeRef = useRef(false);
  const lastLocalValueRef = useRef<string>('');
  
  // Image resize states
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imgToolbarPos, setImgToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [imgWidthPercent, setImgWidthPercent] = useState<number>(100);

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

  const syncFromEditor = () => {
    const html = editorRef.current?.innerHTML || '';
    const td = turndownRef.current;
    if (td) {
      const md = td.turndown(
        html
          .replace(/<div><br><\/div>/g, '<br>')
          .replace(/<div>/g, '\n')
          .replace(/<\/div>/g, '')
      ).trim();
      // mark this as a local change so the prop update echo does not reset caret
      lastLocalValueRef.current = md;
      isLocalChangeRef.current = true;
      onChange(md);
    }
  };
  
  const format = (cmd: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    syncFromEditor();
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand('insertHTML', false, html);
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

  // Set editor html from value (markdown) when value changes
  useEffect(() => {
    if (!editorRef.current) return;
    // If the change originated from this editor, and the parent echoed the same value,
    // consume the flag and avoid writing back to the DOM (prevents caret reset).
    if (isLocalChangeRef.current) {
      if (value === lastLocalValueRef.current) {
        isLocalChangeRef.current = false;
        return;
      }
      // If different, treat as external override: clear the flag and continue to update.
      isLocalChangeRef.current = false;
    }
    // Only update when the visible text differs to avoid unnecessary DOM writes.
    if (editorRef.current.innerText !== value) {
      // You may want to use a markdown-to-html converter here for richer display.
      editorRef.current.innerText = value;
    }
  }, [value]);
  
  return (
    <Box>
      <Box sx={{ mb: 1, flexWrap: 'wrap', display: 'flex', gap: 1 }}>
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
      </Box>
      <Box sx={{ position: 'relative' }}>
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEditor}
          onClick={handleEditorClick}
          sx={{
            minHeight,
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
          data-placeholder={placeholder}
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
    </Box>
  );
};

export default WysiwygMarkdownEditor;