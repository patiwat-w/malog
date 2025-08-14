export interface DomainOption {
  code: string;
  label: string;
}

export interface SeverityOption {
  value: string; // keep as string to match form state
  label: string;
}

export const domainOptions: DomainOption[] = [
  { code: '001', label: 'ตัวรก' },
  { code: '002', label: 'ระบบไฟฟ้า' },
  { code: '003', label: 'ระบบสั่งการ' },
  { code: '004', label: 'CT Scanner' },
  { code: '005', label: 'เครื่องมือแพทย์' },
  { code: '006', label: 'Injector' },
  { code: '007', label: 'ระบบ Loady ผู้ป่วย' },
  { code: '999', label: 'อื่นๆ' }
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

export const getSeverityLabel = (val: string | null | undefined) =>
  severityOptions.find(s => s.value === (val ?? ''))?.label || (val ?? '');