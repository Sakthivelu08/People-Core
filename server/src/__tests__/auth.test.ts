import jwt from 'jsonwebtoken';

describe('Auth Middleware Unit Tests (Full Branch Coverage)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockReqResHeaders(headers: Record<string, string> = {}) {
    const req: any = {
      headers,
      user: undefined
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();
    return { req, res, next };
  }

  describe('Dev Mode (VALIDATE_AZURE_TOKEN = false)', () => {
    it('returns 401 if user identity cannot be resolved (no headers & no default oid)', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'false';
      delete process.env.DEFAULT_AZURE_OID;

      const mockExecute = jest.fn();
      jest.mock('../config/db', () => ({
        pool: { execute: mockExecute }
      }));

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({});
      await authModule.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Unable to resolve user identity.' });
    });

    it('attaches user profile when valid x-user-oid header is provided', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'false';

      const mockExecute = jest.fn().mockResolvedValueOnce([[
        { id: '1', azure_oid: 'dev-oid-1', name: 'Dev User', email: 'dev@ex.com', role: 'Employee', department: 'Engineering' }
      ]]);

      jest.mock('../config/db', () => ({
        pool: { execute: mockExecute }
      }));

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({ 'x-user-oid': 'dev-oid-1' });
      await authModule.authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.name).toBe('Dev User');
      expect(next).toHaveBeenCalled();
    });

    it('creates temporary dev user when user is not found in database', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'false';

      const mockExecute = jest.fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      jest.mock('../config/db', () => ({
        pool: { execute: mockExecute }
      }));

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({ 'x-user-oid': 'new-dev-oid' });
      await authModule.authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.azure_oid).toBe('new-dev-oid');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Production Azure Mode (VALIDATE_AZURE_TOKEN = true)', () => {
    it('returns 401 if authorization header is missing or malformed', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'true';

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({});
      await authModule.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    });

    it('verifies Entra ID token successfully and attaches user profile', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'true';

      jest.mock('jsonwebtoken', () => ({
        verify: jest.fn((token, getKey, options, callback) => {
          callback(null, { oid: 'azure-oid-123', preferred_username: 'azure@ex.com' });
        })
      }));

      const mockExecute = jest.fn().mockResolvedValueOnce([[
        { id: 'u1', azure_oid: 'azure-oid-123', name: 'Azure User', email: 'azure@ex.com', role: 'Employee', department: 'HR' }
      ]]);

      jest.mock('../config/db', () => ({
        pool: { execute: mockExecute }
      }));

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({ authorization: 'Bearer valid-jwt-token' });

      await authModule.authenticate(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.user.name).toBe('Azure User');
      expect(next).toHaveBeenCalled();
    });

    it('returns 403 if user verified by Azure AD has no matching DB profile', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'true';

      jest.mock('jsonwebtoken', () => ({
        verify: jest.fn((token, getKey, options, callback) => {
          callback(null, { oid: 'missing-oid', email: 'missing@ex.com' });
        })
      }));

      const mockExecute = jest.fn().mockResolvedValueOnce([[]]);
      jest.mock('../config/db', () => ({
        pool: { execute: mockExecute }
      }));

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({ authorization: 'Bearer valid-jwt-token' });

      await authModule.authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 401 if JWT token verification fails', async () => {
      process.env.VALIDATE_AZURE_TOKEN = 'true';

      jest.mock('jsonwebtoken', () => ({
        verify: jest.fn((token, getKey, options, callback) => {
          callback(new Error('Token Expired'), null);
        })
      }));

      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders({ authorization: 'Bearer invalid-token' });

      await authModule.authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authorizeAdmin', () => {
    it('returns 403 if req.user is undefined', () => {
      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders();
      authModule.authorizeAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 if user is not an Admin', () => {
      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders();
      req.user = { id: '1', role: 'Employee' };

      authModule.authorizeAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next() if user is an Admin', () => {
      const authModule = require('../middlewares/auth');
      const { req, res, next } = createMockReqResHeaders();
      req.user = { id: 'admin1', role: 'Admin' };

      authModule.authorizeAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
