import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyStripeSignature } from './stripe-signature';

const secret = 'whsec_test_secret';
const body = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
const timestamp = 1_800_000_000;
const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

describe('verifyStripeSignature', () => {
  it('accepts a valid current v1 signature', () => {
    expect(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, 300, timestamp)).toBe(true);
  });

  it('rejects modified payloads', () => {
    expect(verifyStripeSignature(`${body} `, `t=${timestamp},v1=${signature}`, secret, 300, timestamp)).toBe(false);
  });

  it('rejects stale signatures', () => {
    expect(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, 300, timestamp + 301)).toBe(false);
  });
});
