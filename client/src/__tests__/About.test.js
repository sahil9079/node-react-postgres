import React from 'react';
import { render, screen } from '@testing-library/react';
import About from '../pages/About';

test('renders about page text', () => {
  render(<About />);
  expect(screen.getByText('About Page')).toBeInTheDocument();
});
