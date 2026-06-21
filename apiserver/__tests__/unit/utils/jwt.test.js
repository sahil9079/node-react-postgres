const jwt = require('../../../utils/jwt');

const JWT_SECRET = 'test-secret-key-for-jwt-tests';

describe('jwt utils', () => {
  describe('sign', () => {
    it('should sign data and return a token string', async () => {
      const token = await jwt.sign({ id: 1 }, JWT_SECRET, '1h');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should throw if data is missing', async () => {
      await expect(jwt.sign(null, JWT_SECRET, '1h')).rejects.toThrow();
    });

    it('should throw if secret is missing', async () => {
      await expect(jwt.sign({ id: 1 }, null, '1h')).rejects.toThrow();
    });
  });

  describe('verify', () => {
    it('should verify a valid token', async () => {
      const token = await jwt.sign({ id: 1 }, JWT_SECRET, '1h');
      const decoded = await jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(1);
    });

    it('should throw for invalid token', async () => {
      await expect(jwt.verify('invalid-token', JWT_SECRET)).rejects.toThrow();
    });

    it('should throw if secret is missing', async () => {
      await expect(jwt.verify('some-token', null)).rejects.toThrow();
    });

    it('should throw if token is not a string', async () => {
      await expect(jwt.verify(12345, JWT_SECRET)).rejects.toThrow('Invalid session');
    });
  });

  describe('decode', () => {
    it('should decode token without verification', async () => {
      const token = await jwt.sign({ id: 1, name: 'test' }, JWT_SECRET, '1h');
      const decoded = jwt.decode(token);
      expect(decoded.id).toBe(1);
      expect(decoded.name).toBe('test');
    });

    it('should throw for malformed token', () => {
      expect(() => jwt.decode('not-a-token')).toThrow();
    });

    it('should return null for non-string input', () => {
      expect(jwt.decode(123)).toBeNull();
    });
  });
});
