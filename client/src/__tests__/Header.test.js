import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import Header from '../layouts/Header';

test('renders navigation links for unauthenticated user', () => {
  render(
    <BrowserRouter>
      <UserContext.Provider value={{ user: null, setUser: jest.fn(), isLoading: false }}>
        <Header />
      </UserContext.Provider>
    </BrowserRouter>
  );
  expect(screen.getByText(/Home/i)).toBeInTheDocument();
  expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  expect(screen.getByText(/About/i)).toBeInTheDocument();
  expect(screen.getByText(/Skills/i)).toBeInTheDocument();
  expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
});

test('renders user name when authenticated', () => {
  const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', profileImg: null };
  render(
    <BrowserRouter>
      <UserContext.Provider value={{ user: mockUser, setUser: jest.fn(), isLoading: false }}>
        <Header />
      </UserContext.Provider>
    </BrowserRouter>
  );
  expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  expect(screen.getByText(/Logout/i)).toBeInTheDocument();
});
