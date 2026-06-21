import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import SignIn from '../pages/signIn/SignIn';

const renderSignIn = () => {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={{ user: null, setUser: jest.fn(), isLoading: false }}>
        <SignIn />
      </UserContext.Provider>
    </BrowserRouter>
  );
};

test('renders sign-in form with email and password fields', () => {
  renderSignIn();
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
});

test('renders sign-in button', () => {
  renderSignIn();
  const buttons = screen.getAllByText(/SIGN IN/i);
  expect(buttons.length).toBeGreaterThan(0);
});

test('renders link to sign-up page', () => {
  renderSignIn();
  expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
});

test('renders remember me checkbox', () => {
  renderSignIn();
  expect(screen.getByText(/Remember me/i)).toBeInTheDocument();
});

test('shows validation error when submitting empty form', async () => {
  renderSignIn();
  const buttons = screen.getAllByText(/SIGN IN/i);
  fireEvent.click(buttons[buttons.length - 1]);
  expect(await screen.findByText(/Please input your email/i)).toBeInTheDocument();
});
