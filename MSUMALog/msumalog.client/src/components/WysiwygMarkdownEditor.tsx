import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import TurndownService from 'turndown';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import { marked } from 'marked'; // เพิ่มบรรทัดนี้ (ติดตั้งด้วย: npm install marked)
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface Props {
  value?: string | null;
  onChange?: (md: string) => void;
  minHeight?: number;
  placeholder?: string;
  readOnly?: boolean; // เพิ่มตรงนี้
}

const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB
const MAX_IMAGE_WIDTH = 1024; // px

const resizeImageFile = (file: File, mimeType = 'image/jpeg'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas error');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // quality 0.8 for jpeg
        const dataUrl = canvas.toDataURL(mimeType, 0.8);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const WysiwygMarkdownEditor: React.FC<Props> = ({
  value,
  onChange,
  minHeight = 140,
  placeholder = 'พิมพ์คอมเมนต์ (WYSIWYG จะถูกแปลงเป็น Markdown อัตโนมัติ)',
  readOnly = false // เพิ่มตรงนี้
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
  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // เพิ่ม state สำหรับ zoom

  useEffect(() => {
    if (!zoomImageSrc) setZoomLevel(1); // reset zoom เมื่อปิด Dialog
  }, [zoomImageSrc]);

  const handleZoomIn = () => setZoomLevel(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(z => Math.max(z - 0.2, 0.2));

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
      if (onChange) {
        onChange(md);
      }
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

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบชนิดไฟล์
    if (!file.type.startsWith('image/')) {
      alert('ไฟล์ที่เลือกไม่ใช่รูปภาพ');
      e.target.value = '';
      return;
    }

    let dataUrl: string;
    // Resize ทุกรูปที่ขนาดเกิน 500 KB หรือไม่ใช่ JPEG
    if (file.size > MAX_IMAGE_SIZE || file.type !== 'image/jpeg') {
      try {
        dataUrl = await resizeImageFile(file, 'image/jpeg');
      } catch {
        alert('ไม่สามารถปรับขนาดภาพได้');
        e.target.value = '';
        return;
      }
    } else {
      // ขนาดไม่เกิน ใช้ไฟล์เดิม
      const reader = new FileReader();
      dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    insertHtmlAtCursor(`<img src="${dataUrl}" alt="image" style="max-width:100%;border-radius:4px;" />`);
    e.target.value = '';
  };

  const handleEditorClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (readOnly) {
        setZoomImageSrc(img.src);
        return;
      }
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
      const updateEditorHtml = async () => {
        if (!editorRef.current) return;
        if (isLocalChangeRef.current) {
          if (value === lastLocalValueRef.current) {
            isLocalChangeRef.current = false;
            return;
          }
          isLocalChangeRef.current = false;
        }
        // Only update when the visible text differs to avoid unnecessary DOM writes.
        // เปลี่ยนจาก innerText เป็น innerHTML โดยแปลง markdown เป็น html
        const html = await marked(value || ''); // ใช้ marked() แทน marked.parse()
        if (editorRef.current.innerHTML !== html) {
          editorRef.current.innerHTML = html;
        }
      };
  
      updateEditorHtml();
    }, [value]);
  
  return (
    <Box>
      <Box sx={{ mb: 1, flexWrap: 'wrap', display: 'flex', gap: 1 }}>
        {!readOnly && (
          <>
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
          </>
        )}
      </Box>
      <Box sx={{ position: 'relative' }}>
        <Box
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={readOnly ? undefined : syncFromEditor}
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
            background: readOnly ? '#f5f5f5' : '#fff',
            cursor: readOnly ? 'default' : 'text',
            '& img': {
              maxWidth: '100%',
              borderRadius: 1,
              outline: (theme) => selectedImage ? `2px solid ${theme.palette.primary.main}` : 'none'
            }
          }}
          data-placeholder={placeholder}
        />
        {!readOnly && selectedImage && imgToolbarPos && (
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
      {/* --- Image Zoom Dialog --- */}
      <Dialog open={!!zoomImageSrc} onClose={() => setZoomImageSrc(null)} maxWidth="md" fullScreen>
        <Box sx={{ position: 'relative', bgcolor: '#222', minHeight: '100vh', width: '100vw' }}>
          <IconButton
            onClick={() => setZoomImageSrc(null)}
            sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          {/* ปุ่ม Zoom */}
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleZoomOut}
              sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.3)' }}
              size="large"
              aria-label="Zoom out"
            >
              <RemoveIcon />
            </IconButton>
            <IconButton
              onClick={handleZoomIn}
              sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.3)' }}
              size="large"
              aria-label="Zoom in"
            >
              <AddIcon />
            </IconButton>
          </Box>
          {zoomImageSrc && (
            <img
              src={zoomImageSrc}
              alt="zoom"
              style={{
                maxWidth: `${98 * zoomLevel}vw`,
                maxHeight: `${90 * zoomLevel}vh`,
                width: 'auto',
                height: 'auto',
                display: 'block',
                margin: 'auto',
                borderRadius: 8,
                background: '#222',
                transition: 'max-width 0.2s, max-height 0.2s'
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default WysiwygMarkdownEditor;