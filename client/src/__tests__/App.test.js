import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders sign-in link on the home page', () => {
  render(<App />);
  const signInLink = screen.getAllByText(/Sign In/i);
  expect(signInLink.length).toBeGreaterThan(0);
});

test('renders navigation links', () => {
  render(<App />);
  const homeLinks = screen.getAllByText(/Home/i);
  expect(homeLinks.length).toBeGreaterThan(0);
  expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  expect(screen.getByText(/About/i)).toBeInTheDocument();
});
