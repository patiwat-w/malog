import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  getCommentsByCase,
  createComment,
  deleteComment,
  getIncidentByCase
} from '../api/client';
import type { IncidentCommentDto } from '../api/client';
import SnackbarAlert from './SnackbarAlert';
import PageLoading from './PageLoading';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';
import WysiwygMarkdownEditor from './WysiwygMarkdownEditor';

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

  // New states for dialogs/snackbar/delete
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '', severity: 'info' });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!ignore) {
          const msg = e?.response?.data?.message || e?.message || 'Load incident failed';
          setError(msg);
          setAlertMsg(msg);
          setAlertOpen(true);
        }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!ignore) {
          const msg = e?.response?.data?.message || e?.message || 'Load comments failed';
          setError(msg);
          setAlertMsg(msg);
          setAlertOpen(true);
        }
      } finally {
        if (!ignore) setLoadingComments(false);
      }
    };
    loadComments();
    return () => { ignore = true; };
  }, [caseNo]);

  const hasComment = newComment.trim().length > 0;

  const submitComment = async () => {
    if (!hasComment || submitting || !incidentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createComment({
        incidentReportId: incidentId,
        authorUserId: Number(currentUser),
        body: newComment.trim()
      });
      setComments(prev => [created, ...prev]);
      setNewComment('');
      setSnackbar({ open: true, message: 'Comment posted', severity: 'success' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Create comment failed';
      setError(msg);
      setAlertMsg(msg);
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    if (!enableDelete) return;
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    const id = confirmTargetId;
    if (!id) {
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    setDeleting(true);
    setError(null);
    try {
      await deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      setSnackbar({ open: true, message: 'Comment deleted', severity: 'success' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Delete failed';
      setError(msg);
      setAlertMsg(msg);
      setAlertOpen(true);
    } finally {
      setDeleting(false);
      setConfirmTargetId(null);
    }
  };

  const pageLoadingOpen = loading || loadingComments || submitting || deleting;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Discussions</Typography>

      <PageLoading open={pageLoadingOpen} />

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
          const createdLocal = c.createdUtc ? new Date(c.createdUtc).toLocaleString() : 'Invalid date';
          return (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  {c.authorUserName  ?? '-'}{' '}
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                    {createdLocal}
                  </Typography>
                </Typography>
                {enableDelete && (
                  <Tooltip title="Delete comment">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(c.id!)}
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

      <Box sx={{ mb: 2 }}>
        <WysiwygMarkdownEditor
          value={newComment}
          onChange={(md) => setNewComment(md)}
          minHeight={heightMin}
          placeholder="พิมพ์คอมเมนต์ (WYSIWYG จะถูกแปลงเป็น Markdown อัตโนมัติ)"
        />
      </Box>

      <Button
        variant="contained"
        disabled={!hasComment || submitting || !incidentId}
        onClick={submitComment}
      >
        {submitting ? 'Posting...' : 'Post Comment'}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete comment"
        message="Delete this comment?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />

      <AlertDialog
        open={alertOpen}
        title="Error"
        message={alertMsg}
        onClose={() => setAlertOpen(false)}
      />
    </Box>
  );
};

export default IncidentConversation;