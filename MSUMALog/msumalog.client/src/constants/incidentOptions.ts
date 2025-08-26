import AutorenewIcon from '@mui/icons-material/Autorenew';
import BlockIcon from '@mui/icons-material/Block';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import React from 'react';

export interface DomainOption {
  code: string;
  label: string;
}

export interface SeverityOption {
  value: string; // keep as string to match form state
  label: string;
  labelInTh: string;
  labelInEn: string;
  letter?: string; // optional, used for mobile display

  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export interface IncidentStatusOption {
  value: string;
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  paletteColor?: string; // เพิ่ม property นี้
  icon?: React.ReactNode;
}

export const domainOptions: DomainOption[] = [
  { code: '001', label: 'รถและเครื่องยนต์' },
  { code: '002', label: 'ระบบไฟฟ้า' },
  { code: '003', label: 'ระบบสื่อสารบนรถ' },
  { code: '004', label: 'CT Scanner' },
  { code: '005', label: 'Injector' },
  { code: '006', label: 'เครื่องมือแพทย์' },
  { code: '007', label: 'ระบบ Loading ผู้ป่วย' },
  { code: '008', label: 'ระบบสั่งการ MSU-MGT' },
  { code: '009', label: 'ระบบส่งภาพทางการแพทย์' },
  { code: '999', label: 'อื่นๆ (โปรดระบุ)' }
];

export const severityOptions: SeverityOption[] = [
  { value: '1', label: 'ต่ำมาก (Very Low)', labelInTh: 'ต่ำมาก', labelInEn: 'Very Low', letter: 'V', color: 'default' },    // น้ำเงิน
  { value: '2', label: 'ต่ำ (Low)', labelInTh: 'ต่ำ', labelInEn: 'Low', letter: 'L', color: 'success' },                // ฟ้า
  { value: '3', label: 'ปานกลาง (Medium)', labelInTh: 'ปานกลาง', labelInEn: 'Medium', letter: 'M', color: 'info' },     // เขียว
  { value: '4', label: 'สูง (High)', labelInTh: 'สูง', labelInEn: 'High', letter: 'H', color: 'warning' },            // ส้ม
  { value: '5', label: 'สูงมาก (Critical)', labelInTh: 'สูงมาก', labelInEn: 'Critical', letter: 'C', color: 'error' }        // แดง
];

export const incidentStatusOptions: IncidentStatusOption[] = [
  { value: 'Open', label: 'Open', color: 'primary', paletteColor: 'primary.main', icon: React.createElement(HourglassTopIcon, { fontSize: "small" }) },
  { value: 'InProgress', label: 'In Progress', color: 'info', paletteColor: 'info.main', icon: React.createElement(AutorenewIcon, { fontSize: "small" }) },
  { value: 'Resolved', label: 'Resolved', color: 'success', paletteColor: 'success.main', icon: React.createElement(CheckCircleIcon, { fontSize: "small" }) },
  { value: 'Closed', label: 'Closed', color: 'default', paletteColor: 'grey.600', icon: React.createElement(LockIcon, { fontSize: "small" }) },
  { value: 'Rejected', label: 'Rejected', color: 'error', paletteColor: 'error.main', icon: React.createElement(BlockIcon, { fontSize: "small" }) },
  // Cancelled status can be added if needed
   { value: 'Cancelled', label: 'Cancelled', color: 'secondary', paletteColor: 'secondary.main', icon: React.createElement(CancelIcon, { fontSize: "small" }) },
];

export const getDomainLabel = (code: string | null | undefined) =>
  domainOptions.find(d => d.code === (code ?? ''))?.label || (code ?? '');

export const getSeverityLabel = (val: number | null | undefined) =>
  severityOptions.find(s => s.value == (val ?? ''))?.label || (val ?? '');

export const getSeverityLabelEn = (val: number | null | undefined) =>
  severityOptions.find(s => s.value == (val ?? ''))?.labelInEn || (val ?? '');

export const getSeverityLetter = (val: number | null | undefined) =>
  severityOptions.find(s => s.value == (val ?? ''))?.letter || (val ?? '');

export const getSeverityColor = (val: number | null | undefined) =>
  severityOptions.find(s => s.value == (val ?? ''))?.color || 'default';

export const getIncidentStatusLabel = (val: string | null | undefined) =>
  incidentStatusOptions.find(s => s.value === (val ?? ''))?.label || (val ?? '');

export const getIncidentStatusColor = (val: string | null | undefined) =>
  incidentStatusOptions.find(s => s.value === (val ?? ''))?.color || 'default';

export const getIncidentStatusPaletteColor = (val: string | null | undefined) =>
  incidentStatusOptions.find(s => s.value === (val ?? ''))?.paletteColor || undefined;