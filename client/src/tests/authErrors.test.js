import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../services/common';
import { getAuthErrorDetails } from '../utils/authError';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});

describe('authentication error handling', () => {
  it('keeps invalid login credentials separate from session expiry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password you entered is incorrect.',
      }),
    }));

    await expect(apiRequest('/auth/login')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('presents server downtime as a retryable maintenance state', () => {
    expect(getAuthErrorDetails({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'YarnFlow is temporarily unavailable.',
    })).toMatchObject({
      type: 'maintenance',
      canRetry: true,
    });
  });

  it('presents connection failures as a retryable network state', () => {
    expect(getAuthErrorDetails({ code: 'NETWORK_ERROR' })).toMatchObject({
      type: 'network',
      canRetry: true,
    });
  });

  it('stops waiting and exposes a retryable timeout error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((url, config) => new Promise((resolve, reject) => {
      config.signal.addEventListener('abort', () => {
        reject(new DOMException('Request aborted', 'AbortError'));
      });
    })));

    const request = expect(apiRequest('/auth/login')).rejects.toMatchObject({
      code: 'REQUEST_TIMEOUT',
      retryable: true,
    });
    await vi.advanceTimersByTimeAsync(15000);
    await request;
  });

  it('presents duplicate registration as a non-retryable account state', () => {
    expect(getAuthErrorDetails({
      status: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    }, 'register')).toMatchObject({
      type: 'account',
      title: 'Account already exists',
      canRetry: false,
    });
  });
});
