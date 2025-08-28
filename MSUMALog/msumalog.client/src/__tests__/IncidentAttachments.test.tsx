import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import IncidentAttachments from '../components/IncidentAttachments';

test('CLEAR button resets link and description', async () => {

  render(<IncidentAttachments incidentId={1} currentUser={{ id:1 }} />);
  const link = screen.getByPlaceholderText(/Link URL/i);
  const desc = screen.getByPlaceholderText(/Description/i);
  await userEvent.type(link, 'http://x');
  await userEvent.type(desc, 'desc');
  const clear = screen.getByRole('button', { name: /CLEAR/i });
  await userEvent.click(clear);
  expect((link as HTMLInputElement).value).toBe('');
  expect((desc as HTMLTextAreaElement).value).toBe('');
});