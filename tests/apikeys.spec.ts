import { test, expect } from '@playwright/test';

test('api key lifecycle', async ({ request }) => {
  const create = await request.post('/api/keys', { data: { uid: 'u_test', label: 'dev' } });
  const json = await create.json();
  expect(json.key).toContain('ep_');
  const list = await request.get('/api/keys?uid=u_test');
  expect((await list.json()).items.length).toBeGreaterThan(0);
});