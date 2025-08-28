import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import AlertDialog from "../components/AlertDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import SnackbarAlert from "../components/SnackbarAlert";

type ConfirmFlow = "upload-duplicate" | "delete" | "external-download" | "generic";
type Severity = "success" | "info" | "warning" | "error";

interface DialogContextValue {
  confirm: (flow: ConfirmFlow, opts?: { title?: string; message?: string; confirmLabel?:string; cancelLabel?:string }) => Promise<boolean>;
  alert: (title: string, message: string) => Promise<void>;
  showSnackbar: (message: string, severity?: Severity) => void;
  confirmAndRun: <T = void>(flow: ConfirmFlow, action: () => Promise<T>, successMessage?: string) => Promise<T | null>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};

export function DialogProvider({ children }: { children: ReactNode }) {
  // Confirm state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    flow?: ConfirmFlow;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    resolve?: (v: boolean) => void;
  }>({ open: false });

  // Alert state
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    resolve?: () => void;
  }>({ open: false });

  // Snackbar state
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: Severity }>({
    open: false,
    message: "",
    severity: "info",
  });

  const defaultForFlow = (flow: ConfirmFlow) => {
    switch (flow) {
      case "upload-duplicate":
        return {
          title: "อัพโหลดไฟล์ซ้ำ",
          message: "พบไฟล์ซ้ำ ต้องการแทนที่/อัปโหลดต่อหรือไม่?",
          confirmLabel: "อัปโหลด",
          cancelLabel: "ยกเลิก",
        };
      case "delete":
        return {
          title: "ลบรายการ",
          message: "คุณแน่ใจว่าต้องการลบรายการนี้หรือไม่?",
          confirmLabel: "ลบ",
          cancelLabel: "ยกเลิก",
        };
      case "external-download":
        return {
          title: "ดาวน์โหลดไฟล์ภายนอก",
          message: "คุณต้องการดาวน์โหลดไฟล์จากแหล่งภายนอกหรือไม่?",
          confirmLabel: "ดาวน์โหลด",
          cancelLabel: "ยกเลิก",
        };
      default:
        return {
          title: "ยืนยัน",
          message: "คุณต้องการดำเนินการต่อหรือไม่?",
          confirmLabel: "OK",
          cancelLabel: "Cancel",
        };
    }
  };

  const confirm = (flow: ConfirmFlow, opts?: { title?: string; message?: string; confirmLabel?:string; cancelLabel?:string }) => {
    return new Promise<boolean>((resolve) => {
      const defaults = defaultForFlow(flow);
      setConfirmState({
        open: true,
        flow,
        title: opts?.title ?? defaults.title,
        message: opts?.message ?? defaults.message,
        confirmLabel: opts?.confirmLabel ?? defaults.confirmLabel,
        cancelLabel: opts?.cancelLabel ?? defaults.cancelLabel,
        resolve,
      });
    });
  };

  const alert = (title: string, message: string) => {
    return new Promise<void>((resolve) => {
      setAlertState({ open: true, title, message, resolve });
    });
  };

  const showSnackbar = (message: string, severity: Severity = "success") => {
    setSnack({ open: true, message, severity });
  };

  const confirmAndRun = async <T,>(flow: ConfirmFlow, action: () => Promise<T>, successMessage?: string) => {
    const ok = await confirm(flow);
    if (!ok) return null;
    const result = await action();
    if (successMessage) showSnackbar(successMessage, "success");
    return result;
  };

  // Handlers for dialogs
  const handleConfirmClose = () => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState({ open: false });
  };

  const handleConfirmOk = () => {
    if (confirmState.resolve) confirmState.resolve(true);
    setConfirmState({ open: false });
  };

  const handleAlertClose = () => {
    if (alertState.resolve) alertState.resolve();
    setAlertState({ open: false });
  };

  const handleSnackClose = () => {
    setSnack((s) => ({ ...s, open: false }));
  };

  const value: DialogContextValue = {
    confirm,
    alert,
    showSnackbar,
    confirmAndRun,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmOk}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
      />
      <AlertDialog
        open={alertState.open}
        title={alertState.title ?? "แจ้งเตือน"}
        message={alertState.message ?? ""}
        onClose={handleAlertClose}
      />
      <SnackbarAlert open={snack.open} message={snack.message} severity={snack.severity} onClose={handleSnackClose} />
    </DialogContext.Provider>
  );
}
