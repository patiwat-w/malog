import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridPaginationModel } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import type { GridSortModel } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";
import { getIncidentReportsPaged } from "../api/client";
import type { IncidentReportDto } from "../api/client";
import { getSeverityLabel, getDomainLabel } from "../constants/incidentOptions";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import * as XLSX from "xlsx";
import Button from "@mui/material/Button";
/**
 *  id?: number;                 // <-- เพิ่ม id
    caseNo: string;
    title: string;               // NEW
    asset: string;
    center: string;
    incidentDate: string;
    symptoms: string;
    severity: string;
    impact: string;
    domain: string; // จะเก็บ code เช่น '001'
    subDomain: string;
    vendor: string;
    manufacturer: string;
    partNumber: string;
    additionalInfo: string;
    interimAction: string;
    intermediateAction: string;
    longTermAction: string;
    status: string;
    // added responsible person fields
    responsibleName: string;
    responsibleLineId: string;
    responsibleEmail: string;
    responsiblePhone: string;
 */
const columns: GridColDef[] = [
//  { field: "id", headerName: "ID", width: 90 },
  //caseNo
  { field: "caseNo", headerName: "Case No", width: 150 },
  { field: "status", headerName: "Status", width: 120 },
  { field: "title", headerName: "Title", width: 200 },
  {
    field: "severity",
    headerName: "Severity",
    width: 120,
  },
  //symptoms
  { field: "symptoms", headerName: "Symptoms", width: 200 },
  //incidentDate
  { field: "incidentDate", headerName: "Incident Date", width: 180 },
  //asset
  { field: "asset", headerName: "Asset", width: 120 },
  { field: "center", headerName: "Center", width: 120 },
  //domain
  { field: "domain", headerName: "Domain", width: 120 },
  //subDomain
  { field: "subDomain", headerName: "Sub Domain", width: 120 },
  //vendor
  { field: "vendor", headerName: "Vendor", width: 120 },
  //manufacturer
  { field: "manufacturer", headerName: "Manufacturer", width: 120 },
  //partNumber
  { field: "partNumber", headerName: "Part Number", width: 120 },
  //additionalInfo
  { field: "additionalInfo", headerName: "Additional Info", width: 200 },

 

  //responsibleName
  { field: "responsibleName", headerName: "Responsible", width: 150 },
  //responsiblePhone
  { field: "responsiblePhone", headerName: "Phone", width: 150 },
  //responsibleEmail
  { field: "responsibleEmail", headerName: "Email", width: 200 },
  // updatedUtc
  { field: "createdUtc", headerName: "Created", width: 180 },
  { field: "updatedUtc", headerName: "Updated", width: 180 },
  {
    field: "actions",
    headerName: "Edit",
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: () => (
      <button style={{ cursor: "pointer" }} onClick={() => {}}>
        Edit
      </button>
    ),
  },
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
    subDomain?: string;
    vendor?: string;
    manufacturer?: string;
    partNumber?: string;
    additionalInfo?: string;
    interimAction?: string;
    intermediateAction?: string;
    longTermAction?: string;
    incidentDate?: string;
    symptoms?: string;
  }

  const [rows, setRows] = useState<IncidentReport[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const navigate = useNavigate();

  const handleExportExcel = () => {
    // สร้าง worksheet จาก rows
    const ws = XLSX.utils.json_to_sheet(rows);
    // สร้าง workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IncidentReports");
    // Export เป็นไฟล์ + date
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM
    const fileName = `IncidentReports_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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
          createdUtc: item.createdUtc
            ? new Date(item.createdUtc).toLocaleString()
            : "",
          responsibleName: item.responsibleName ?? "",
          responsiblePhone: item.responsiblePhone ?? "",
          updatedUtc: item.updatedUtc
            ? new Date(item.updatedUtc).toLocaleString()
            : "",
          caseNo: item.caseNo ?? "",
          asset: item.asset ?? "",
          center: item.center ?? "",
          domain: getDomainLabel(item.domain) ?? "",
          subDomain: item.subDomain ?? "",
          vendor: item.vendor ?? "",
          symptoms: item.symptoms ?? "",
          

          manufacturer: item.manufacturer ?? "",
          partNumber: item.partNumber ?? "",
          additionalInfo: item.additionalInfo ?? "",
          interimAction: item.interimAction ?? "",
          intermediateAction: item.intermediateAction ?? "",
          longTermAction: item.longTermAction ?? "",
            incidentDate: item.incidentDate
                ? new Date(item.incidentDate).toLocaleDateString()
                : "",
        }))
      );
      setRowCount(result.totalCount ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [paginationModel, sortModel]);

  // ปรับ renderCell ให้ใช้ navigate
  columns[columns.length - 1].renderCell = (params) => (
    <IconButton
      color="primary"
      size="small"
      onClick={() => navigate(`/admin/${params.row.caseNo}`)}
      aria-label="edit"
    >
      <EditIcon />
    </IconButton>
  );

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Admin Report</Typography>
        <Button variant="outlined" onClick={handleExportExcel}>
          Export Excel
        </Button>
      </Box>
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
