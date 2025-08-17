import { Backdrop, CircularProgress } from "@mui/material";

interface PageLoadingProps {
  open: boolean;
}

export default function PageLoading({ open }: PageLoadingProps) {
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
