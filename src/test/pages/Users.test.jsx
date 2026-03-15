import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider } from '../../context/AuthContext';
import { mockAdmin, mockViewer } from '../mocks/handlers';
import Users from '../../pages/Users';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

function renderUsers() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem('user', JSON.stringify(mockAdmin));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Users />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Users page', () => {
  it('renders page heading', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  it('renders Add User button for admin', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
    });
  });

  it('displays user names from API', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Viewer User')).toBeInTheDocument();
    });
  });

  it('shows "(you)" label next to the currently logged-in user', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('(you)')).toBeInTheDocument();
    });
  });

  it('does not crash when user has no createdAt field', async () => {
    server.use(
      http.get('/api/users', () =>
        HttpResponse.json({
          success: true,
          data: [
            { ...mockAdmin, createdAt: undefined },
            { ...mockViewer, createdAt: null },
          ],
          pagination: { total: 2, page: 1, limit: 20, pages: 1 },
        })
      )
    );

    renderUsers();

    // Should not throw RangeError: Invalid time value
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('shows "Active" badge for active users', async () => {
    renderUsers();
    await waitFor(() => {
      const badges = screen.getAllByText('Active');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('shows search input', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
    });
  });

  it('shows role filter dropdown', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument();
    });
  });

  it('shows total member count', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText(/2 team members/i)).toBeInTheDocument();
    });
  });
});
