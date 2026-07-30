import { describe, it, expect, vi, beforeEach } from 'vitest';

const readPublicMock = vi.fn();

vi.mock('./contracts', () => ({
  repId: () => 'CREPID',
  questId: () => 'CQUESTID',
  readPublic: (...a: unknown[]) => readPublicMock(...a),
  readContract: vi.fn(),
  invokeAndWait: vi.fn(),
  args: {
    addr: (g: string) => ({ __addr: g }),
    u64: (n: number) => ({ __u64: n }),
    str: (s: string) => ({ __str: s }),
    bytes: (b: Uint8Array) => ({ __bytes: b }),
  },
}));

import { getProfile, getScores } from './reputation';

describe('getProfile', () => {
  beforeEach(() => readPublicMock.mockReset());

  it('maps the aggregate view to a typed ProfileView', async () => {
    readPublicMock.mockResolvedValueOnce({ social: 30n, earned: 50n, verified: true });
    const p = await getProfile('GADDR');
    expect(p).toEqual({ social: 30, earned: 50, verified: true });
    expect(readPublicMock).toHaveBeenCalledWith('CREPID', 'get_profile', expect.any(Array));
  });

  it('defaults missing fields to zero/false', async () => {
    readPublicMock.mockResolvedValueOnce(undefined);
    const p = await getProfile('GADDR');
    expect(p).toEqual({ social: 0, earned: 0, verified: false });
  });
});

describe('getScores', () => {
  beforeEach(() => readPublicMock.mockReset());

  it('prefers the single get_profile call (1 round-trip)', async () => {
    readPublicMock.mockResolvedValueOnce({ social: 15n, earned: 5n, verified: false });
    const s = await getScores('GADDR');
    expect(s).toEqual({ social: 15, earned: 5 });
    expect(readPublicMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to get_score + get_earned when get_profile is unavailable', async () => {
    readPublicMock
      .mockRejectedValueOnce(new Error('unknown method get_profile'))
      .mockResolvedValueOnce(12n) // get_score
      .mockResolvedValueOnce(8n); // get_earned
    const s = await getScores('GADDR');
    expect(s).toEqual({ social: 12, earned: 8 });
    expect(readPublicMock).toHaveBeenCalledTimes(3);
  });
});