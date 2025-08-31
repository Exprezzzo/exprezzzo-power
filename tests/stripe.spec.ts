import { test, expect } from '@playwright/test';

test('webhook rejects bad signature', async ({ request }) => {
  const res = await request.post('/api/webhook', { 
    data: { a: 1 }, 
    headers: { 'stripe-signature': 'bad' } 
  });
  expect(res.status()).toBe(400);
});