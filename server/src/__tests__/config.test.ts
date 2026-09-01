describe('Config DB & Connection Pool Unit Tests (Full Branch Coverage)', () => {
  const originalEnv = process.env;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('initializes dbConfig with DB_SSL=true', () => {
    process.env.DB_SSL = 'true';
    process.env.DB_HOST = '127.0.0.1';

    jest.mock('mysql2/promise', () => ({
      createPool: jest.fn().mockImplementation((config) => {
        expect(config.ssl).toEqual({ minVersion: 'TLSv1.2', rejectUnauthorized: false });
        return { getConnection: jest.fn(), execute: jest.fn() };
      })
    }));

    const dbModule = require('../config/db');
    expect(dbModule.pool).toBeDefined();
  });

  it('initializes dbConfig with tidbcloud.com host auto-ssl', () => {
    process.env.DB_SSL = 'false';
    process.env.DB_HOST = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';

    jest.mock('mysql2/promise', () => ({
      createPool: jest.fn().mockImplementation((config) => {
        expect(config.ssl).toBeDefined();
        return { getConnection: jest.fn(), execute: jest.fn() };
      })
    }));

    const dbModule = require('../config/db');
    expect(dbModule.pool).toBeDefined();
  });

  it('initializes dbConfig with azure.com host auto-ssl', () => {
    process.env.DB_SSL = 'false';
    process.env.DB_HOST = 'my-app-db.mysql.database.azure.com';

    jest.mock('mysql2/promise', () => ({
      createPool: jest.fn().mockImplementation((config) => {
        expect(config.ssl).toBeDefined();
        return { getConnection: jest.fn(), execute: jest.fn() };
      })
    }));

    const dbModule = require('../config/db');
    expect(dbModule.pool).toBeDefined();
  });

  it('checkConnection - returns true when database connection succeeds', async () => {
    const mockRelease = jest.fn();
    const mockPool = {
      getConnection: jest.fn().mockResolvedValueOnce({ release: mockRelease }),
      execute: jest.fn().mockResolvedValueOnce([[{ id: 1 }]])
    };

    jest.mock('mysql2/promise', () => ({
      createPool: jest.fn().mockReturnValue(mockPool)
    }));

    const dbModule = require('../config/db');
    const result = await dbModule.checkConnection(1, 10);
    expect(result).toBe(true);

    const queryRes = await dbModule.query('SELECT 1');
    expect(queryRes).toEqual([{ id: 1 }]);
  });

  it('checkConnection - retries and returns false when database connection fails', async () => {
    const mockPool = {
      getConnection: jest.fn().mockRejectedValue(new Error('Conn fail'))
    };

    jest.mock('mysql2/promise', () => ({
      createPool: jest.fn().mockReturnValue(mockPool)
    }));

    const dbModule = require('../config/db');
    const result = await dbModule.checkConnection(2, 10);
    expect(result).toBe(false);
  });
});
