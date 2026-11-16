import { ONLINE_WINDOW_MS, presenceOf } from './admin.service.js';

describe('presenceOf', () => {
  const now = Date.parse('2026-11-16T12:00:00Z');

  it('is online inside the window and offline outside it', () => {
    expect(presenceOf(new Date(now - ONLINE_WINDOW_MS + 1000), now)).toBe('online');
    expect(presenceOf(new Date(now - ONLINE_WINDOW_MS - 1000), now)).toBe('offline');
  });

  it('is offline for a user never seen', () => {
    expect(presenceOf(null, now)).toBe('offline');
  });
});
