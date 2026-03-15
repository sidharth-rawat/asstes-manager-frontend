import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { mockAdmin } from '../mocks/handlers';

// Helper component that reads auth context
function AuthConsumer() {
  const { user, loading, isAdmin, isManager } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  return (
    <div>
      <div data-testid="user-name">{user.name}</div>
      <div data-testid="user-role">{user.role}</div>
      <div data-testid="is-admin">{isAdmin ? 'yes' : 'no'}</div>
      <div data-testid="is-manager">{isManager ? 'yes' : 'no'}</div>
    </div>
  );
}

function LoginConsumer() {
  const { login, logout, user } = useAuth();
  return (
    <div>
      <div data-testid="logged-in">{user ? 'yes' : 'no'}</div>
      <button onClick={() => login('admin@test.com', 'Password1')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

const wrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

// Suppress jsdom navigation errors from the axios 401 interceptor
const originalAssign = window.location.assign;
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, href: 'http://localhost/', pathname: '/', assign: vi.fn() },
  });
});

describe('AuthContext', () => {
  it('resolves to no user when no token stored', async () => {
    render(<AuthConsumer />, { wrapper });
    // Eventually resolves to not logged in
    await waitFor(() => expect(screen.getByText('Not logged in')).toBeInTheDocument());
  });

  it('loads user from token stored in localStorage on mount', async () => {
    localStorage.setItem('token', 'mock-jwt-token');

    render(<AuthConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Admin User');
    });
  });

  it('isAdmin is true for admin user', async () => {
    localStorage.setItem('token', 'mock-jwt-token');
    render(<AuthConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('yes');
    });
  });

  it('isManager is true for admin user', async () => {
    localStorage.setItem('token', 'mock-jwt-token');
    render(<AuthConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('is-manager')).toHaveTextContent('yes');
    });
  });

  it('isAdmin is false for viewer user', async () => {
    localStorage.setItem('token', 'mock-jwt-token');
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ success: true, user: { ...mockAdmin, role: 'viewer' } })
      )
    );
    render(<AuthConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('no');
    });
  });

  it('isManager is true for manager role', async () => {
    localStorage.setItem('token', 'mock-jwt-token');
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ success: true, user: { ...mockAdmin, role: 'manager' } })
      )
    );
    render(<AuthConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('is-manager')).toHaveTextContent('yes');
    });
  });

  it('clears user state when token is invalid', async () => {
    localStorage.setItem('token', 'bad-token');
    server.use(
      http.get('/api/users/me', () => HttpResponse.json({ success: false }, { status: 401 }))
    );

    render(<AuthConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login stores token and sets user', async () => {
    render(<LoginConsumer />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('logged-in')).toHaveTextContent('no'));

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('logged-in')).toHaveTextContent('yes');
    });
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
  });

  it('logout clears user and localStorage', async () => {
    localStorage.setItem('token', 'mock-jwt-token');
    render(<LoginConsumer />, { wrapper });

    // Wait for user to load
    await waitFor(() => expect(screen.getByTestId('logged-in')).toHaveTextContent('yes'));

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('logged-in')).toHaveTextContent('no');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
