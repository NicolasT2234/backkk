// sicrcb-api-gateway/__mocks__/db.js
const pool = {
  query: jest.fn().mockResolvedValue([[], []]),
  getConnection: jest.fn().mockResolvedValue({
    beginTransaction: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue([[], []]),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn().mockResolvedValue()
  })
};

module.exports = pool;