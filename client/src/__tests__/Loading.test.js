import React from 'react';
import { render, screen } from '@testing-library/react';
import Loading from '../components/shared/Loading';

test('renders loading text', () => {
  render(<Loading />);
  expect(screen.getByText('Loading')).toBeInTheDocument();
});
