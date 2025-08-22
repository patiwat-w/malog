import { useEffect, useState } from "react";
import { Box, Typography, Paper, Divider, Chip, Button } from "@mui/material";
import { getAuditTimelineByReference } from "../api/client";
import { getCommentsByCaseId } from "../api/client";
import type { AuditTimelineDto, IncidentCommentDto } from "../api/client";

interface Props {
  referenceEntityName: string;
  referenceId: number;
}

export default function IncidentConversationWithTimeLine({ referenceEntityName, referenceId }: Props) {
  const [timeline, setTimeline] = useState<AuditTimelineDto[]>([]);
  const [comments, setComments] = useState<IncidentCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAuditTimelineByReference({ referenceEntityName, referenceId }),
      getCommentsByCaseId(referenceId)
    ]).then(([timelineRes, commentsRes]) => {
      setTimeline(timelineRes.items ?? []);
      setComments(commentsRes ?? []);
      setLoading(false);
    });
  }, [referenceEntityName, referenceId]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Timeline & Conversation
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {loading && <Typography>Loading...</Typography>}

      {!loading && (
        <Box>
          {/* Audit Timeline */}
          {timeline.map((batch) => {
            const importantChanges = batch.changes.filter(chg => chg.isImportant);
            const otherChanges = batch.changes.filter(chg => !chg.isImportant);

            return (
              <Box key={batch.batchId} sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(batch.changedUtc).toLocaleString()} Update by {batch.changedByUser}
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
                        {otherChanges.length} more field{otherChanges.length > 1 ? "s" : ""} updated
                      </span>
                      <Button
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() =>
                          setDetailBatchId(detailBatchId === batch.batchId ? null : batch.batchId)
                        }
                      >
                        {detailBatchId === batch.batchId ? "Show Less" : "Show More"}
                      </Button>
                    </li>
                  )}
                </ul>
                <Divider sx={{ my: 1 }} />
                {detailBatchId === batch.batchId && (
                  <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1, mb: 1 }}>
                    <Typography variant="subtitle2">Change Detail</Typography>
                    <ul>
                      {batch.changes.map((chg, i) => (
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

          {/* Comments */}
          {comments.map((comment) => (
            <Box key={comment.id} sx={{ mb: 2 }}>
              <Typography variant="body2" color="primary">
                {comment.createdUtc && new Date(comment.createdUtc).toLocaleString()} by {comment.createdByUserName}
              </Typography>
              <Typography variant="body1">{comment.text}</Typography>
              <Divider sx={{ my: 1 }} />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}