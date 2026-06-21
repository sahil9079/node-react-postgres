import createHttpClient from '../utils/createHttpClient';

describe('createHttpClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return a request function and controller', () => {
    const { request, controller } = createHttpClient();
    expect(typeof request.get).toBe('function');
    expect(typeof request.post).toBe('function');
    expect(controller).toBeDefined();
    expect(typeof controller.abort).toBe('function');
  });

  it('should create axios instance with default headers', () => {
    const { request } = createHttpClient();
    expect(request.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should include token from localStorage if present', () => {
    localStorage.setItem('r-token', 'test-token-123');
    const { request } = createHttpClient();
    expect(request.defaults.headers['Authorization']).toBe('Bearer test-token-123');
  });
});
