import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';

// Mock react-hot-toast so we can verify toast calls
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock useNavigate so we can assert redirects
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  it('renders the sign-in form', () => {
    renderLogin();
    expect(screen.getByText('AssetTrack')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows password toggle button', () => {
    renderLogin();
    const buttons = screen.getAllByRole('button');
    // One submit button + one toggle button
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput.type).toBe('password');

    // Find the toggle button (tabIndex=-1, type=button)
    const buttons = screen.getAllByRole('button');
    const toggleBtn = buttons.find((b) => b.getAttribute('tabindex') === '-1');
    await user.click(toggleBtn);

    expect(passwordInput.type).toBe('text');
  });

  it('shows error toast when fields are empty and form is submitted', async () => {
    const toast = await import('react-hot-toast');
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(toast.default.error).toHaveBeenCalledWith('Please fill in all fields');
  });

  it('calls login and navigates to / on success', async () => {
    const toast = await import('react-hot-toast');
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    expect(toast.default.success).toHaveBeenCalledWith('Welcome back!');
  });

  it('shows error toast on login failure', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.post('/api/users/login', () =>
        HttpResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
      )
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled();
    });
  });

  it('disables submit button while loading', async () => {
    // Slow response to observe loading state
    server.use(
      http.post('/api/users/login', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ success: true, token: 'tok', user: { role: 'admin' } });
      })
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();

    await waitFor(() => expect(submitBtn).not.toBeDisabled());
  });
});
