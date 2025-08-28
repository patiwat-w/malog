import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import * as api from '../api/client';
import HomePage from '../pages/HomePage';

vi.mock('../api/client');

test('HomePage shows incidents from API', async () => {
  (api.getIncidentReportsPaged as any).mockResolvedValue({
    items: [{ id:1, caseNo: 'CASE-1', title: 'T1', severity: '1' }],
    total: 1
  });
  render(<HomePage />);
  expect(await screen.findByText('CASE-1')).toBeInTheDocument();
});