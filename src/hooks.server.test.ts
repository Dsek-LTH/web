import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SvelteKitAuth } from '@auth/sveltekit';

// We will mock @auth/sveltekit to capture the config
vi.mock('@auth/sveltekit', () => ({
  SvelteKitAuth: vi.fn((config) => {
    return { handle: vi.fn(), config };
  }),
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    AUTH_SECRET: 'secret',
    AUTH_AUTHENTIK_CLIENT_ID: 'client_id',
    AUTH_AUTHENTIK_CLIENT_SECRET: 'client_secret',
  }
}));

vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_AUTH_AUTHENTIK_ISSUER: 'issuer',
    PUBLIC_AUTH_AUTHENTIK_TOKEN_ENDPOINT: 'http://test/token',
  }
}));

vi.mock('$app/environment', () => ({
  dev: true,
}));

vi.mock('$paraglide/runtime', () => ({
  cookieName: 'locale',
  defineCustomServerStrategy: vi.fn(),
  getLocale: vi.fn(() => 'en'),
}));

vi.mock('$lib/server/authorizedPrisma', () => ({
  default: {},
}));

vi.mock('$lib/server/extendedPrisma', () => ({
  getExtendedPrismaClient: vi.fn(),
}));

vi.mock('./hooks.server.helpers', () => ({
  getAccessPolicies: vi.fn(),
}));

vi.mock('$lib/utils/authorization', () => ({
  getDerivedRoles: vi.fn(),
}));

vi.mock('./routes/(app)/expenses/verification', () => ({
  verifyCostCenterData: vi.fn(),
}));

vi.mock('$paraglide/server', () => ({
  paraglideMiddleware: vi.fn(),
}));

vi.mock('$app/server', () => ({
  getRequestEvent: vi.fn(),
}));

vi.mock('$lib/server/metrics', () => ({
  httpRequestsTotal: { inc: vi.fn() },
  httpRequestDurationMs: { startTimer: vi.fn(() => vi.fn()) },
  inflightRequests: { inc: vi.fn(), dec: vi.fn() },
}));

describe('Auth Hook Token Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should not fail on concurrent token refresh requests', async () => {
    // Import hooks.server to trigger SvelteKitAuth
    await import('./hooks.server');
    const config = (SvelteKitAuth as Mock).mock.calls[0]![0];

    // Create a mock token that has expired
    const token1 = {
      refresh_token: 'refresh-token-123',
      expires_at: Math.floor(Date.now() / 1000) - 10, // Expired 10 seconds ago
    };
    const token2 = {
      refresh_token: 'refresh-token-123',
      expires_at: Math.floor(Date.now() / 1000) - 10, // Expired 10 seconds ago
    };

    // Mock fetch to simulate a delayed response, so concurrent requests overlap
    let fetchCallCount = 0;
    (global.fetch as Mock).mockImplementation(async () => {
      fetchCallCount++;
      await new Promise(r => setTimeout(r, 50));
      
      // If it's the first call, succeed
      if (fetchCallCount === 1) {
        return {
          ok: true,
          json: async () => ({
            access_token: 'abc.' + Buffer.from(JSON.stringify({ groups: ['group1'] })).toString('base64'),
            expires_in: 3600,
            refresh_token: 'new-refresh-token',
            id_token: 'new-id-token'
          })
        };
      }
      
      // If it's a subsequent call, fail (simulating Authentik rejecting a reused refresh token)
      return {
        ok: false,
        json: async () => ({ error: 'invalid_grant' })
      };
    });

    // Run two concurrent jwt callbacks
    const [result1, result2] = await Promise.all([
      config.callbacks.jwt({ token: token1 }),
      config.callbacks.jwt({ token: token2 }),
    ]);

    // Both results should have the new tokens and NO error
    // If there is a race condition, result2 will have an error
    expect(result1.error).toBeUndefined();
    expect(result2.error).toBeUndefined();
    expect(result1.access_token).toBeDefined();
    expect(result2.access_token).toBeDefined();
    
    // fetch should only be called ONCE due to promise caching
    expect(fetchCallCount).toBe(1);
  });
});
