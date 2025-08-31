import crypto from 'crypto';
export function generateKey() {
  const raw = 'ep_' + crypto.randomBytes(24).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}
export function redact(raw: string) { 
  return raw.slice(0, 6) + '…' + raw.slice(-4); 
}