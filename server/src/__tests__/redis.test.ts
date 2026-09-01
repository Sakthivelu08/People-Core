describe('Redis Config Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('handles disabled redis mode (ENABLE_REDIS=false)', async () => {
    process.env.ENABLE_REDIS = 'false';
    const redisModule = require('../config/redis');

    await expect(redisModule.connectRedis()).resolves.toBeUndefined();
    await expect(redisModule.getCache('key')).resolves.toBeNull();
    await expect(redisModule.setCache('key', { data: 1 })).resolves.toBeUndefined();
    await expect(redisModule.invalidateCache('key')).resolves.toBeUndefined();
    await expect(redisModule.invalidatePattern('pattern*')).resolves.toBeUndefined();
  });

  it('handles enabled redis mode with mocked client (ENABLE_REDIS=true)', async () => {
    process.env.ENABLE_REDIS = 'true';
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = '6379';

    const mockClient = {
      on: jest.fn((event, cb) => {
        if (event === 'connect') cb();
        if (event === 'error') cb(new Error('Mock Error'));
      }),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(JSON.stringify({ test: 'data' })),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue(['k1', 'k2'])
    };

    jest.mock('redis', () => ({
      createClient: jest.fn().mockImplementation(() => mockClient)
    }));

    const redisModule = require('../config/redis');

    await redisModule.connectRedis();
    expect(mockClient.connect).toHaveBeenCalled();

    // Already connected check branch
    await redisModule.connectRedis();

    const getRes = await redisModule.getCache('k1');
    expect(getRes).toEqual({ test: 'data' });

    await redisModule.setCache('k1', { test: 'data' }, 300);
    expect(mockClient.setEx).toHaveBeenCalledWith('k1', 300, JSON.stringify({ test: 'data' }));

    await redisModule.invalidateCache('k1');
    expect(mockClient.del).toHaveBeenCalledWith('k1');

    await redisModule.invalidatePattern('k*');
    expect(mockClient.del).toHaveBeenCalledWith(['k1', 'k2']);
  });

  it('handles errors gracefully in enabled redis mode', async () => {
    process.env.ENABLE_REDIS = 'true';

    const mockErrorClient = {
      on: jest.fn(),
      connect: jest.fn().mockRejectedValue(new Error('Conn fail')),
      get: jest.fn().mockRejectedValue(new Error('Get fail')),
      setEx: jest.fn().mockRejectedValue(new Error('Set fail')),
      del: jest.fn().mockRejectedValue(new Error('Del fail')),
      keys: jest.fn().mockRejectedValue(new Error('Keys fail'))
    };

    jest.mock('redis', () => ({
      createClient: jest.fn().mockImplementation(() => mockErrorClient)
    }));

    const redisModule = require('../config/redis');

    await redisModule.connectRedis();
    const getRes = await redisModule.getCache('k1');
    expect(getRes).toBeNull();

    await redisModule.setCache('k1', { test: 'data' });
    await redisModule.invalidateCache('k1');
    await redisModule.invalidatePattern('k*');
  });
});
