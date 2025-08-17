import { Snackbar, Alert } from "@mui/material";

interface SnackbarAlertProps {
  open: boolean;
  message: string;
  severity?: "success" | "info" | "warning" | "error";
  onClose: () => void;
}

export default function SnackbarAlert({
  open,
  message,
  severity = "info",
  onClose,
}: SnackbarAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={severity} onClose={onClose} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
