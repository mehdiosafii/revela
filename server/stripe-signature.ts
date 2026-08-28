import { createHmac, timingSafeEqual } from 'node:crypto';

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!rawBody || !signatureHeader || !secret) return false;

  const pieces = signatureHeader.split(',').map((piece) => piece.trim());
  const timestamp = Number(pieces.find((piece) => piece.startsWith('t='))?.slice(2));
  const signatures = pieces
    .filter((piece) => piece.startsWith('v1='))
    .map((piece) => piece.slice(3))
    .filter(Boolean);

  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  return signatures.some((signature) => secureEqual(expected, signature));
}
