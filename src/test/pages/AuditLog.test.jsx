import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider } from '../../context/AuthContext';
import { mockAdmin } from '../mocks/handlers';
import AuditLog from '../../pages/AuditLog';

function renderAuditLog() {
  // Pre-load auth state
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem('user', JSON.stringify(mockAdmin));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuditLog />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuditLog page', () => {
  it('renders the page heading', async () => {
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
    });
  });

  it('shows "No audit events found" when log is empty', async () => {
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByText('No audit events found')).toBeInTheDocument();
    });
  });

  it('renders action filter dropdown', async () => {
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByDisplayValue('All Actions')).toBeInTheDocument();
    });
  });

  it('renders user filter dropdown', async () => {
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByDisplayValue('All Users')).toBeInTheDocument();
    });
  });

  it('renders log rows when data is returned', async () => {
    server.use(
      http.get('/api/audit', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'log-1',
              action: 'created',
              assetName: 'Test Laptop',
              assetSerialNo: 'SN-001',
              performedByName: 'Admin User',
              performedByEmail: 'admin@test.com',
              createdAt: new Date('2024-03-01T10:00:00Z').toISOString(),
              fromValue: null,
              toValue: 'active',
            },
          ],
          pagination: { total: 1, page: 1, limit: 25, pages: 1 },
        })
      )
    );

    renderAuditLog();

    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
      // "Admin User" may appear in both the user filter dropdown and log row
      expect(screen.getAllByText('Admin User').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "1 events recorded" when total is 1', async () => {
    server.use(
      http.get('/api/audit', () =>
        HttpResponse.json({
          success: true,
          data: [],
          pagination: { total: 1, page: 1, limit: 25, pages: 1 },
        })
      )
    );

    renderAuditLog();

    await waitFor(() => {
      expect(screen.getByText(/1 events recorded/i)).toBeInTheDocument();
    });
  });

  it('does not crash when log entries have missing dates', async () => {
    server.use(
      http.get('/api/audit', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'log-2',
              action: 'updated',
              assetName: 'Old Asset',
              performedByName: 'System',
              createdAt: null, // missing date — should not crash
              fromValue: null,
              toValue: null,
            },
          ],
          pagination: { total: 1, page: 1, limit: 25, pages: 1 },
        })
      )
    );

    renderAuditLog();

    // Should render without throwing
    await waitFor(() => {
      expect(screen.getByText('Old Asset')).toBeInTheDocument();
    });
  });
});
