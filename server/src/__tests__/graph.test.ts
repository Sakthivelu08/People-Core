import { GraphService } from '../services/graph.service';

describe('GraphService Unit Tests', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEmployee = {
    name: 'Alice Smith',
    email: 'alice@example.com',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    role: 'Employee'
  };

  it('provisionAzureUser - returns local fallback when clientSecret is missing', async () => {
    const service = new GraphService();
    // Ensure clientSecret is empty
    (service as any).clientSecret = '';

    const res = await service.provisionAzureUser(mockEmployee);
    expect(res.azure_sync_status).toBe('local_only (pending_admin_consent)');
    expect(res.message).toContain('AZURE_CLIENT_SECRET not configured');
    expect(res.graphPayload.displayName).toBe('Alice Smith');
  });

  it('provisionAzureUser - handles failed OAuth token fetch', async () => {
    const service = new GraphService();
    (service as any).clientSecret = 'mock-secret';

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const res = await service.provisionAzureUser(mockEmployee);
    expect(res.azure_sync_status).toBe('local_only (pending_admin_consent)');
    expect(res.message).toContain('Azure Entra ID sync bypassed');
  });

  it('provisionAzureUser - handles 403 consent error from Graph API', async () => {
    const service = new GraphService();
    (service as any).clientSecret = 'mock-secret';

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'fake-jwt-token' })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403
      });

    const res = await service.provisionAzureUser(mockEmployee);
    expect(res.azure_sync_status).toBe('local_only (pending_admin_consent)');
    expect(res.message).toContain('Pending Tenant Admin Consent');
  });

  it('provisionAzureUser - handles general error response from Graph API', async () => {
    const service = new GraphService();
    (service as any).clientSecret = 'mock-secret';

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'fake-jwt-token' })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Error'
      });

    const res = await service.provisionAzureUser(mockEmployee);
    expect(res.azure_sync_status).toBe('local_only (pending_admin_consent)');
    expect(res.message).toContain('Azure Entra ID response error');
  });

  it('provisionAzureUser - successfully provisions user in Azure Entra ID', async () => {
    const service = new GraphService();
    (service as any).clientSecret = 'mock-secret';

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'fake-jwt-token' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'azure-user-oid-777' })
      });

    const res = await service.provisionAzureUser(mockEmployee);
    expect(res.azure_sync_status).toBe('synced');
    expect(res.azure_oid).toBe('azure-user-oid-777');
    expect(res.message).toContain('successfully provisioned');
  });

  it('provisionAzureUser - handles network exceptions gracefully', async () => {
    const service = new GraphService();
    (service as any).clientSecret = 'mock-secret';

    global.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

    const res = await service.provisionAzureUser(mockEmployee);
    expect(res.azure_sync_status).toBe('local_only (pending_admin_consent)');
    expect(res.message).toContain('Azure Entra ID sync bypassed');
  });

  it('getSyncStatusStats - returns status stats correctly', async () => {
    const service = new GraphService();
    const stats1 = await service.getSyncStatusStats();
    expect(stats1.tenantId).toBeDefined();

    (service as any).clientSecret = 'configured';
    const stats2 = await service.getSyncStatusStats();
    expect(stats2.hasClientSecretConfigured).toBe(true);
    expect(stats2.syncEngineMode).toBe('Live Graph API Mode');
  });
});
