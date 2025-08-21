import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridPaginationModel } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import type { GridSortModel } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";
import { getIncidentReportsPaged } from "../api/client";
import type { IncidentReportDto } from "../api/client";
import { getSeverityLabel, getDomainLabel } from "../constants/incidentOptions";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  //caseNo
  { field: "caseNo", headerName: "Case No", width: 150 },
  { field: "title", headerName: "Title", width: 200 },
  //asset
  { field: "asset", headerName: "Asset", width: 120 },
  { field: "center", headerName: "Center", width: 120 },
  //domain
  { field: "domain", headerName: "Domain", width: 120 },
  {
    field: "severity",
    headerName: "Severity",
    width: 120
  },
  { field: "status", headerName: "Status", width: 120 },
  { field: "createdUtc", headerName: "Created", width: 180 },

  //responsibleName
  { field: "responsibleName", headerName: "Responsible", width: 150 },
  //responsiblePhone
  // updatedUtc
  { field: "updatedUtc", headerName: "Updated", width: 180 },
];

export default function AdminPage() {
  interface IncidentReport {
    id: number;
    title: string;
    severity: string | number;
    status: string;
    createdUtc: string;
    responsibleName: string;
    responsiblePhone: string;
    updatedUtc: string;
    caseNo: string;
    asset: string;
    center: string;
    domain: string;

  }

  const [rows, setRows] = useState<IncidentReport[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // สร้าง order string จาก sortModel
      const order = sortModel.map((s) => `${s.field} ${s.sort}`).join(",");
      const result = await getIncidentReportsPaged({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        select: columns.map((c) => c.field).join(","),
        order,
        // filter: { Title: '*test*' } // เพิ่ม filter ได้ถ้าต้องการ
      });
      setRows(
        ((result.items as IncidentReportDto[]) ?? []).map((item) => ({
          id: item.id ?? 0,
          title: item.title ?? "",
          severity: getSeverityLabel(item.severity) ?? "",
          status: item.status ?? "",
          createdUtc: item.createdUtc ?? "",
          responsibleName: item.responsibleName ?? "",
          responsiblePhone: item.responsiblePhone ?? "",
          updatedUtc: item.updatedUtc ?? "",
          caseNo: item.caseNo ?? "",
          asset: item.asset ?? "",
          center: item.center ?? "",
          domain: getDomainLabel(item.domain) ?? "",
        }))
      );
      setRowCount(result.totalCount ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [paginationModel, sortModel]);

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <Typography variant="h5" mb={2}>
        Admin DataGrid
      </Typography>
      <DataGrid
        columns={columns}
        rows={rows}
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
      />
    </Box>
  );
}
