const catchAsync = require('../../../utils/catchAsync');

describe('catchAsync', () => {
  it('should return a function', () => {
    const fn = catchAsync(async () => {});
    expect(typeof fn).toBe('function');
  });

  it('should call next with error when the wrapped function rejects', async () => {
    const error = new Error('Test error');
    const req = {};
    const res = {};
    const next = jest.fn();

    const wrapped = catchAsync(async () => {
      throw error;
    });

    await wrapped(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should not call next when the wrapped function resolves', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    const wrapped = catchAsync(async () => {
      return 'success';
    });

    await wrapped(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
