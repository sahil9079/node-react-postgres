import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../pages/Home';

test('renders home page text', () => {
  render(<Home />);
  expect(screen.getByText('Home Page')).toBeInTheDocument();
});
