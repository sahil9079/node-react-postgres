const request = require('supertest');
const app = require('../../app');

jest.mock('../../models', () => {
  const User = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  };
  const Skill = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };
  const LocationOption = {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  };
  const Role = {};
  return { User, Skill, LocationOption, Role };
});

jest.mock('../../utils/jwt', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}));

jest.mock('../../utils/session', () => ({
  encrypt: jest.fn(() => 'encrypted-session'),
  decrypt: jest.fn(() => 'decrypted-token'),
}));

jest.mock('../../config', () => ({
  API_URL: 'http://localhost:8010',
  CLIENT_URL: 'http://localhost:3000',
  PORT: '8010',
}));

jest.mock('../../services/authService', () => {
  const actual = jest.requireActual('../../services/authService');
  return {
    ...actual,
    checkUserSession: jest.fn(),
  };
});

const authService = require('../../services/authService');
const { User } = require('../../models');
const jwt = require('../../utils/jwt');

describe('Auth API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return error for missing fields', async () => {
      User.create.mockRejectedValue(new Error('Validation error'));
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({});
      expect(res.status).toBe(500);
    });

    it('should return 201 on successful registration', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        createdAt: new Date(),
      };
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockResolvedValue('verify-token-123');

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          password: 'password123',
          passwordConfirm: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 if email or password missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/check-auth', () => {
    it('should return 500 if session check fails', async () => {
      authService.checkUserSession.mockRejectedValue(new Error('Unauthorized'));
      const res = await request(app)
        .get('/api/v1/auth/check-auth');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/v1/auth/logout', () => {
    it('should clear session cookie and return success', async () => {
      const res = await request(app)
        .get('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});
