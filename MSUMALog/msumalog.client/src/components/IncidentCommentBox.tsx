import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { createComment } from '../api/client';

import type { User } from '../api/client';
import SnackbarAlert from './SnackbarAlert';
import PageLoading from './PageLoading';
import AlertDialog from './AlertDialog';
import WysiwygMarkdownEditor from './WysiwygMarkdownEditor';

interface Props {
  incidentId: number;
  currentUser: User;
  heightMin?: number;
  onCommentPosted?: () => void; // Callback when a comment is posted
}

const IncidentCommentBox: React.FC<Props> = ({
  incidentId,
  currentUser,
  heightMin = 140,
  onCommentPosted,
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '', severity: 'info' });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const hasComment = newComment.trim().length > 0;

  const submitComment = async () => {
    if (!hasComment || submitting || !incidentId) return;
    setSubmitting(true);
    setLoading(true);
    setError(null);
    try {
      await createComment({
        incidentReportId: incidentId,
        authorUserId: Number(currentUser?.id ?? 0),
        body: newComment.trim()
      });
      setNewComment('');
      setSnackbar({ open: true, message: 'Comment posted', severity: 'success' });
      if (onCommentPosted) onCommentPosted();
    } catch (e: unknown) {
      const msg = (e instanceof Error && e.message) || 'Create comment failed';
      setError(msg);
      setAlertMsg(msg);
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const pageLoadingOpen = loading || submitting;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Discussions</Typography>

      <PageLoading open={pageLoadingOpen} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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

export default IncidentCommentBox;