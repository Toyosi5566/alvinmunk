import { describe, expect, it } from 'vitest';
import { fromHex, toHex } from './reputation';

function expectBytes(actual: Uint8Array, expected: number[]) {
  expect(Array.from(actual)).toEqual(expected);
}

describe('claim-secret hex helpers', () => {
  it('round-trips random 32-byte inputs', () => {
    for (let seed = 0; seed < 32; seed++) {
      const bytes = new Uint8Array(32);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (seed * 73 + i * 29 + i * i) & 0xff;
      }

      expect(fromHex(toHex(bytes))).toEqual(bytes);
    }
  });

  it('uses lowercase hex and preserves leading zero bytes', () => {
    const bytes = new Uint8Array([0x00, 0x0a, 0xab, 0xff]);

    expect(toHex(bytes)).toBe('000aabff');
    expect(fromHex('000AABFF')).toEqual(bytes);
  });

  it('ignores an incomplete trailing nibble', () => {
    expectBytes(fromHex('abc'), [0xab]);
  });

  it('coerces non-hex byte pairs to zero', () => {
    expectBytes(fromHex('zz01'), [0, 1]);
  });

  it('returns no bytes for an empty string', () => {
    expectBytes(fromHex(''), []);
  });
});
