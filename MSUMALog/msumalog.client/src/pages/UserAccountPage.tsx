import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AdminUserDto } from "../api/client";
import {
  blockAdminUser,
  deleteAdminUser,
  getAdminUsersPaged,
  unblockAdminUser,
} from "../api/client";

const columnsDef: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "email", headerName: "Email", width: 220 },
  { field: "displayName", headerName: "Display Name", width: 180 },
  { field: "phone", headerName: "Phone", width: 140 },
  { field: "roles", headerName: "Roles", width: 200 },
  { field: "createdUtc", headerName: "Created", width: 180 },
  { field: "updatedUtc", headerName: "Updated", width: 180 },
  {
    field: "actions",
    headerName: "Actions",
    width: 140,
    sortable: false,
    filterable: false,
    renderCell: () => null,
  },
];

export default function UserAccountPage() {
  const [rows, setRows] = useState<AdminUserDto[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity?: "success" | "error"; message?: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  const navigate = useNavigate();

  const handleExport = () => {
    (async () => {
      try {
        const exportRows = rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          displayName: r.displayName ?? r.name,
          phone: r.phone ?? r.phoneNumber,
          roles: Array.isArray(r.roles) ? r.roles.join(", ") : r.role ?? "",
          createdUtc: r.createdUtc,
          updatedUtc: r.updatedUtc,
        }));

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet("Users");

        if (!exportRows || exportRows.length === 0) {
          ws.addRow(["No data"]);
        } else {
          const cols = Object.keys(exportRows[0]).map((k) => ({
            header: k,
            key: k,
            width: 20,
          }));
          ws.columns = cols;
          exportRows.forEach((r) => ws.addRow(r as any));
        }

        const buf = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const date = new Date().toISOString().split("T")[0];
        saveAs(blob, `Users_${date}.xlsx`);
      } catch (err) {
        console.error("Export error", err);
      }
    })();
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const order = sortModel.map((s) => `${s.field} ${s.sort}`).join(",");
        const result = await getAdminUsersPaged({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          select: columnsDef.map((c) => c.field).join(","),
          order,
        });
        const items = (result.items as AdminUserDto[]) ?? [];
        setRows(
          items.map((it) => ({
            ...it,
            // normalize display fields
            displayName: (it as any).displayName ?? (it as any).name ?? "",
            phone: (it as any).phone ?? (it as any).phoneNumber ?? "",
            roles: Array.isArray((it as any).roles) ? (it as any).roles.join(", ") : (it as any).role ?? "",
            //createdUtc: it.createdUtc ? new Date(it.createdUtc).toLocaleString() : it.createdUtc,
            //updatedUtc: it.updatedUtc ? new Date(it.updatedUtc).toLocaleString() : it.updatedUtc,
          }))
        );
        setRowCount(result.totalCount ?? 0);
      } catch (err) {
        console.error("getAdminUsersPaged error", err);
        setSnackbar({ open: true, severity: "error", message: "Failed to load users" });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [paginationModel, sortModel]);

  // add action renderCell (needs access to navigate and handlers)
  const columns = columnsDef.map((c) => ({ ...c }));
  columns[columns.length - 1].renderCell = (params: any) => {
    const row = params.row as any;
    const isBlocked = !!(row.isBlocked ?? row.locked ?? false);

    const handleBlockToggle = async () => {
      if (!window.confirm(isBlocked ? "Unblock this user?" : "Block this user?")) return;
      setActionLoading(true);
      try {
        if (isBlocked) await unblockAdminUser(row.id);
        else await blockAdminUser(row.id);
        setSnackbar({ open: true, severity: "success", message: isBlocked ? "User unblocked" : "User blocked" });
        // refresh page
        setPaginationModel((p) => ({ ...p }));
      } catch (err) {
        console.error("block/unblock error", err);
        setSnackbar({ open: true, severity: "error", message: "Action failed" });
      } finally {
        setActionLoading(false);
      }
    };

    const handleDelete = async () => {
      if (!window.confirm("Delete this user?")) return;
      setActionLoading(true);
      try {
        await deleteAdminUser(row.id);
        setSnackbar({ open: true, severity: "success", message: "User deleted" });
        // refresh
        setPaginationModel((p) => ({ ...p }));
      } catch (err) {
        console.error("deleteAdminUser error", err);
        setSnackbar({ open: true, severity: "error", message: "Delete failed" });
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton size="small" color="primary" onClick={() => navigate(`/admin/users/${row.id}`)} aria-label="edit">
          <EditIcon />
        </IconButton>
        <IconButton size="small" color={isBlocked ? "success" : "warning"} onClick={handleBlockToggle} disabled={actionLoading} aria-label="block">
          {isBlocked ? <LockOpenIcon /> : <BlockIcon />}
        </IconButton>
        <IconButton size="small" color="error" onClick={handleDelete} disabled={actionLoading} aria-label="delete">
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">User Accounts</Typography>
        <Box>
          <Button variant="outlined" onClick={handleExport} sx={{ mr: 1 }}>
            Export
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          columns={columns}
          rows={rows as any}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => (row as any).id}
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity ?? "success"} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}