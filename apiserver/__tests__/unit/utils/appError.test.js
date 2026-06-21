const AppError = require('../../../utils/appError');

describe('AppError', () => {
  it('should create an error with correct status code and message', () => {
    const err = new AppError(400, 'Bad request');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });

  it('should set status to "error" for 5xx codes', () => {
    const err = new AppError(500, 'Server error');
    expect(err.status).toBe('error');
  });

  it('should capture stack trace when no stack provided', () => {
    const err = new AppError(404, 'Not found');
    expect(err.stack).toBeDefined();
  });

  it('should use provided stack when given', () => {
    const err = new AppError(400, 'Test', true, 'Error', 'custom stack');
    expect(err.stack).toBe('custom stack');
  });

  it('should be instance of Error', () => {
    const err = new AppError(401, 'Unauthorized');
    expect(err instanceof Error).toBe(true);
  });
});
