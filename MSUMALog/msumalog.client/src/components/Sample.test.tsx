import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import '@testing-library/jest-dom'

function Sample() {
  return <h1 data-testid="greet">Hello Vitest</h1>
}

test('renders greeting', () => {
  render(<Sample />)
  expect(screen.getByTestId('greet')).toHaveTextContent('Hello Vitest')
})