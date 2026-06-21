const session = require('../../../utils/session');

const originalEnv = process.env;

describe('session utils', () => {
  beforeAll(() => {
    process.env.SESSION_ENCRYPT_SECRET = 'test-session-encrypt-secret-key';
    process.env.SESSION_ALGORITHM = 'aes-192-cbc';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a token string', () => {
      const encrypted = session.encrypt('my-token-data');
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted token', () => {
      const original = 'my-token-data-123';
      const encrypted = session.encrypt(original);
      const decrypted = session.decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should throw on invalid session data', () => {
      expect(() => session.decrypt('invalid-hex-data')).toThrow();
    });

    it('should throw with status 401 on invalid data', () => {
      expect(() => session.decrypt('not-valid-hex')).toThrow('Unauthorized');
    });
  });
});
