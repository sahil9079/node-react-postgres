import React from 'react';
import { render, screen } from '@testing-library/react';
import Contact from '../pages/Contact';

test('renders contact page text', () => {
  render(<Contact />);
  expect(screen.getByText('Contact Page')).toBeInTheDocument();
});
