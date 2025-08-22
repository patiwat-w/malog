import React from "react";
import { Box, Typography, Paper, Divider, Button, ToggleButtonGroup, ToggleButton, Stack, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert } from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getAuditTimelineByReference, deleteComment, getCommentsByCaseId } from "../api/client";
import type { AuditTimelineDto } from "../api/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import WysiwygMarkdownEditor from './WysiwygMarkdownEditor';

interface Props {
  referenceEntityName: string;
  referenceId: number;
  reloadKey?: number;
  currentUser?: { id: number; name?: string }; // เพิ่ม currentUser สำหรับเช็คสิทธิ์ลบ
}

export default function IncidentConversationWithTimeLine({ referenceEntityName, referenceId, reloadKey, currentUser }: Props) {
  const [timeline, setTimeline] = React.useState<AuditTimelineDto[]>([]);
  const [comments, setComments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detailBatchId, setDetailBatchId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'comment' | 'all'>('comment');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTargetId, setConfirmTargetId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '', severity: 'info' });

  // เพิ่ม state เพื่อ track ว่าโหลด comment แล้วหรือยัง
  const [commentsLoaded, setCommentsLoaded] = React.useState(false);
  const [timelineLoaded, setTimelineLoaded] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    if (viewMode === "comment") {
      if (!commentsLoaded) {
        getCommentsByCaseId(referenceId).then((commentRes) => {
          setComments(commentRes ?? []);
          setCommentsLoaded(true);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } else {
      if (!timelineLoaded) {
        getAuditTimelineByReference({ referenceEntityName, referenceId }).then((timelineRes) => {
          setTimeline(timelineRes.items ?? []);
          setTimelineLoaded(true);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, [referenceEntityName, referenceId, reloadKey, viewMode, commentsLoaded, timelineLoaded]);

  // ถ้า reloadKey เปลี่ยน ให้ reset loaded state
  React.useEffect(() => {
    setCommentsLoaded(false);
    setTimelineLoaded(false);
  }, [referenceEntityName, referenceId, reloadKey]);

  // accept possibly undefined id
  const handleDelete = (id?: number) => {
    if (!id) return;
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
    try {
      await deleteComment(id);
      if (viewMode === "comment") {
        setComments(prev => prev.filter(comment => comment.id !== id));
      } else {
        setTimeline(prev => prev.filter(batch => batch.entityId !== id));
      }
      setSnackbar({ open: true, message: 'Comment deleted', severity: 'success' });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Delete failed';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setDeleting(false);
      setConfirmTargetId(null);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Conversation and Timeline
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, v) => v && setViewMode(v)}
        sx={{ mb: 2 }}
        size="small"
      >
        <ToggleButton value="comment">Conversation</ToggleButton>
        <ToggleButton value="all">Timeline</ToggleButton>
      </ToggleButtonGroup>

      {loading && <Typography>Loading...</Typography>}

      {!loading && (
        <Box>
          {viewMode === "comment"
            ? comments.map((c) => {
                const createdLocal = c.createdUtc ? new Date(c.createdUtc).toLocaleString() : 'Invalid date';
                return (
                  <Paper key={c.id} variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">
                        {c.authorUserName ?? '-'}{' '}
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                          {createdLocal}
                        </Typography>
                      </Typography>
                      {currentUser?.id === c.authorUserId && (
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
                    <Box sx={{ mt: 0.5 }}>
                      {/* เพิ่ม key เพื่อ force remount editor */}
                      <WysiwygMarkdownEditor key={c.id} value={c.body ?? ''} readOnly minHeight={100} maxHeight={200} />
                    </Box>
                  </Paper>
                );
              })
            : timeline.map((batch) => {
                // Timeline/Audit Box
                const importantChanges = batch.changes?.filter(chg => chg.isImportant) ?? [];
                const otherChanges = batch.changes?.filter(chg => !chg.isImportant) ?? [];

                return (
                  <Box key={batch.batchId} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {batch.changedUtc ? new Date(batch.changedUtc).toLocaleString() : 'Invalid date'} Update by {batch.changedByUser}
                    </Typography>
                    <ul>
                      {importantChanges.map((chg, i) => (
                        <li key={i}>
                          <strong>{chg.fieldName}</strong>: {chg.oldValue} &rarr; {chg.newValue}
                        </li>
                      ))}
                      {otherChanges.length > 0 && (
                        <li>
                          <span style={{ fontStyle: "italic", color: "#888" }}>
                            {otherChanges.length === 1
                              ? "1 field updated"
                              : `${otherChanges.length} fields updated`}
                          </span>
                          <Button
                            size="small"
                            sx={{ ml: 1 }}
                            onClick={() =>
                              // normalize batch.batchId to string | null
                              setDetailBatchId(
                                detailBatchId === (batch.batchId ? String(batch.batchId) : null)
                                  ? null
                                  : (batch.batchId ? String(batch.batchId) : null)
                              )
                            }
                          >
                            {detailBatchId === (batch.batchId ? String(batch.batchId) : null) ? "Show Less" : "Show More"}
                          </Button>
                        </li>
                      )}
                    </ul>
                    <Divider sx={{ my: 1 }} />
                    {detailBatchId === (batch.batchId ? String(batch.batchId) : null) && (
                      <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1, mb: 1 }}>
                        <Typography variant="subtitle2">Change Detail</Typography>
                        <ul>
                          {batch.changes?.map((chg, i) => (
                            <li key={i}>
                              <strong>{chg.fieldName}</strong>: {chg.oldValue} &rarr; {chg.newValue}
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Box>
                );
              })}
        </Box>
      )}

      {/* Confirm Dialog (replaces missing ConfirmDialog) */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete comment</DialogTitle>
        <DialogContent>
          <DialogContentText>Delete this comment?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" onClick={onConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar using MUI Alert (replaces missing SnackbarAlert) */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}