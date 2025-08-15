export interface DomainOption {
  code: string;
  label: string;
}

export interface SeverityOption {
  value: string; // keep as string to match form state
  label: string;
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
  { value: '1', label: '1 - ต่ำมาก (Very Low)' },
  { value: '2', label: '2 - ต่ำ (Low)' },
  { value: '3', label: '3 - ปานกลาง (Medium)' },
  { value: '4', label: '4 - สูง (High)' },
  { value: '5', label: '5 - สูงมาก (Critical)' }
];

export const getDomainLabel = (code: string | null | undefined) =>
  domainOptions.find(d => d.code === (code ?? ''))?.label || (code ?? '');

export const getSeverityLabel = (val: number | null | undefined) =>
  severityOptions.find(s => s.value === (val ?? ''))?.label || (val ?? '');