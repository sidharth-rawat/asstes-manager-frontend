import { http, HttpResponse } from 'msw';

// ─── Shared mock data ─────────────────────────────────────────────────────────
export const mockAdmin = {
  _id: 'admin-user-id-000000001',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin',
  department: 'IT',
  isActive: true,
  createdAt: new Date('2024-01-01').toISOString(),
};

export const mockViewer = {
  _id: 'viewer-user-id-000000001',
  name: 'Viewer User',
  email: 'viewer@test.com',
  role: 'viewer',
  isActive: true,
  createdAt: new Date('2024-01-15').toISOString(),
};

export const mockAsset = {
  _id: 'asset-id-0000000000001',
  name: 'Test Laptop',
  serialNo: 'SN-TEST-001',
  category: 'laptop',
  status: 'active',
  assignedTo: null,
  locationId: null,
  value: 1200,
  createdAt: new Date('2024-02-01').toISOString(),
  updatedAt: new Date('2024-02-01').toISOString(),
  assignmentHistory: [],
};

export const mockLocation = {
  _id: 'location-id-00000000001',
  name: 'Main Building',
  type: 'building',
  parent: null,
  isActive: true,
  children: [],
  createdAt: new Date('2024-01-01').toISOString(),
};

// ─── Default handlers ─────────────────────────────────────────────────────────
export const handlers = [
  // Auth
  http.post('/api/users/login', () => {
    return HttpResponse.json({
      success: true,
      token: 'mock-jwt-token',
      user: mockAdmin,
    });
  }),

  http.post('/api/users/register', () => {
    return HttpResponse.json({ success: true, token: 'mock-jwt-token', user: mockAdmin }, { status: 201 });
  }),

  http.get('/api/users/me', () => {
    return HttpResponse.json({ success: true, user: mockAdmin });
  }),

  // Users
  http.get('/api/users', () => {
    return HttpResponse.json({
      success: true,
      data: [mockAdmin, mockViewer],
      pagination: { total: 2, page: 1, limit: 20, pages: 1 },
    });
  }),

  http.put('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ success: true, data: { ...mockViewer, _id: params.id } });
  }),

  // Assets
  http.get('/api/assets', () => {
    return HttpResponse.json({
      success: true,
      data: [mockAsset],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    });
  }),

  http.get('/api/assets/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        total: 10,
        byStatus: { active: 7, inactive: 2, maintenance: 1 },
        byCategory: [{ name: 'laptop', value: 5 }, { name: 'desktop', value: 3 }],
        byLocation: [{ name: 'Main Building', count: 4 }],
      },
    });
  }),

  http.get('/api/assets/:id', ({ params }) => {
    return HttpResponse.json({ success: true, data: { ...mockAsset, _id: params.id } });
  }),

  http.post('/api/assets', () => {
    return HttpResponse.json({ success: true, data: mockAsset }, { status: 201 });
  }),

  http.put('/api/assets/:id', ({ params }) => {
    return HttpResponse.json({ success: true, data: { ...mockAsset, _id: params.id } });
  }),

  http.delete('/api/assets/:id', () => {
    return HttpResponse.json({ success: true, message: 'Asset deleted' });
  }),

  http.post('/api/assets/bulk-assign', () => {
    return HttpResponse.json({ success: true, affectedCount: 1, message: '1 asset(s) assigned.' });
  }),

  // Locations
  http.get('/api/locations/tree', () => {
    return HttpResponse.json({ success: true, data: [mockLocation] });
  }),

  http.get('/api/locations', () => {
    return HttpResponse.json({
      success: true,
      data: [mockLocation],
      pagination: { total: 1, page: 1, limit: 50, pages: 1 },
    });
  }),

  // Audit
  http.get('/api/audit', () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 25, pages: 0 },
    });
  }),

  http.get('/api/audit/asset/:assetId', () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 50, pages: 0 },
    });
  }),
];
