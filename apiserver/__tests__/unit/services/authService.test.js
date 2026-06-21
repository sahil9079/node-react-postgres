jest.mock('../../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
  Role: {},
}));

jest.mock('../../../utils/jwt', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../../utils/session', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

jest.mock('../../../config', () => ({
  API_URL: 'http://localhost:8010',
  CLIENT_URL: 'http://localhost:3000',
  PORT: '8010',
}));

const authService = require('../../../services/authService');
const { User } = require('../../../models');
const jwt = require('../../../utils/jwt');
const session = require('../../../utils/session');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create a user and return limited info', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date('2024-01-01'),
      };
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockResolvedValue('verification-token');

      const result = await authService.registerUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
      });

      expect(User.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@test.com',
        password: 'password123',
        passwordConfirm: 'password123',
      });
      expect(result).toEqual({
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        createdAt: mockUser.createdAt,
      });
    });
  });

  describe('loginUser', () => {
    it('should throw if email or password missing', async () => {
      await expect(authService.loginUser({ body: {} })).rejects.toThrow(
        'Please provide an email and a password'
      );
    });

    it('should throw if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(
        authService.loginUser({ body: { email: 'test@test.com', password: 'pass' } })
      ).rejects.toThrow('Incorrect email or password');
    });

    it('should throw if user is passive', async () => {
      User.findOne.mockResolvedValue({
        id: 1,
        password: '$2a$10$hashedpassword',
        isVerified: true,
        status: 'passive',
        role: { code: 'user' },
      });
      await expect(
        authService.loginUser({ body: { email: 'test@test.com', password: 'pass' } })
      ).rejects.toThrow('The user no longer exists');
    });

    it('should throw if user is not verified', async () => {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('correct-password', 10);
      User.findOne.mockResolvedValue({
        id: 1,
        password: hash,
        isVerified: false,
        status: 'active',
        role: { code: 'user' },
      });
      await expect(
        authService.loginUser({ body: { email: 'test@test.com', password: 'correct-password' } })
      ).rejects.toThrow('Please verify your email first');
    });
  });

  describe('checkUserSession', () => {
    it('should throw if no session provided', async () => {
      await expect(authService.checkUserSession(null)).rejects.toThrow('Invalid Session');
    });

    it('should throw if session token is invalid', async () => {
      session.decrypt.mockReturnValue('decrypted-token');
      jwt.verify.mockRejectedValue(new Error('jwt expired'));
      await expect(authService.checkUserSession('invalid-session')).rejects.toThrow();
    });

    it('should throw if user not found or inactive', async () => {
      session.decrypt.mockReturnValue('decrypted-token');
      jwt.verify.mockResolvedValue({ id: 1 });
      User.findOne.mockResolvedValue(null);

      await expect(authService.checkUserSession('valid-session')).rejects.toThrow(
        'The user no longer exists'
      );
    });
  });
});
