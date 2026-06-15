let nextId = 1;

export const v4 = jest.fn(() => `test-uuid-${nextId++}`);
