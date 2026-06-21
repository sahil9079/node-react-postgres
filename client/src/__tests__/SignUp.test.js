import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import SignUp from '../pages/signUp/SignUp';

const renderSignUp = () => {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={{ user: null, setUser: jest.fn(), isLoading: false }}>
        <SignUp />
      </UserContext.Provider>
    </BrowserRouter>
  );
};

test('renders sign-up form with all fields', () => {
  renderSignUp();
  expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/lastName/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  const passwordFields = screen.getAllByPlaceholderText(/Password/i);
  expect(passwordFields.length).toBe(2);
});

test('renders sign-up button', () => {
  renderSignUp();
  const buttons = screen.getAllByText(/SIGN UP/i);
  expect(buttons.length).toBeGreaterThan(0);
});

test('renders link to sign-in page', () => {
  renderSignUp();
  expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
});
