import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  okLabel?: string;
}

export default function AlertDialog({
  open,
  title,
  message,
  onClose,
  okLabel = "OK",
}: AlertDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {okLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
