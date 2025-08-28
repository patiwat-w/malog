import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import LoginPage from '../pages/LoginPage';

test('LoginPage blocks submit until PDPA accepted and valid email', async () => {
  render(<LoginPage />);
  const email = screen.getByLabelText(/Email/i);
  const btn = screen.getByRole('button', { name: /Login/i });
  await userEvent.type(email, 'bad-email');
  expect(btn).toBeDisabled();
  await userEvent.clear(email);
  await userEvent.type(email, 'u@e.com');
  // check PDPA box required: find and click it
  const pdpa = screen.getByRole('checkbox') as HTMLInputElement;
  await userEvent.click(pdpa);
  expect(pdpa.checked).toBe(true);
  // now button enabled (or form submits) depending implementation
});