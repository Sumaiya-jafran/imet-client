import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPrimaryActive, primaryLinks } from '../src/config/primary-nav.ts';

const link = (roles, name, signedIn = true) =>
  primaryLinks(roles, signedIn).find((item) => item.label === name);
test('only genuine destinations are connected, scoped to the signed-in roles', () => {
  assert.equal(link([], 'Account', false).href, '/auth/signin');
  assert.equal(link(['ADMIN'], 'Services', false).href, undefined);
  for (const roles of [
    [],
    ['BUYER'],
    ['LOCAL_SUPPLIER'],
    ['INTERNATIONAL_MANUFACTURER'],
    ['INDEPENDENT_SELLER'],
    ['SALES_PERSON'],
    ['ADMIN'],
  ]) {
    assert.equal(link(roles, 'Spare parts').href, undefined);
    assert.equal(link(roles, 'Account').href, '/dashboard/account');
    const links = primaryLinks(roles, true).filter((item) => item.href);
    if (!roles.includes('ADMIN'))
      assert.ok(links.every((item) => !item.href.includes('/admin/')));
  }
  assert.equal(link(['BUYER'], 'Services').href, '/dashboard/service-tickets');
  assert.equal(link(['BUYER'], 'Messages').href, '/dashboard/rfqs');
  for (const role of [
    'LOCAL_SUPPLIER',
    'INTERNATIONAL_MANUFACTURER',
    'INDEPENDENT_SELLER',
    'SALES_PERSON',
  ]) {
    assert.equal(
      link([role], 'Services').href,
      '/dashboard/service-management',
    );
    assert.equal(link([role], 'Messages').href, '/dashboard/leads');
  }
  assert.equal(
    link(['ADMIN'], 'Services').href,
    '/dashboard/admin/service-tickets',
  );
  assert.equal(link(['ADMIN'], 'Messages').href, '/dashboard/admin/rfqs');
});
test('nested routes have exactly one active primary destination', () => {
  for (const [roles, path, expected] of [
    [[], '/', 'Home'],
    [['ADMIN', 'BUYER'], '/dashboard/service-tickets/123', 'Services'],
    [['BUYER', 'LOCAL_SUPPLIER'], '/dashboard/leads/123', 'Messages'],
    [[], '/machinery/industrial-lathe', 'Machines'],
    [[], '/auth/signup', 'Account'],
    [['BUYER'], '/dashboard/rfqs/123', 'Messages'],
    [['BUYER'], '/dashboard/service-tickets/123', 'Services'],
    [['LOCAL_SUPPLIER'], '/dashboard/leads/123', 'Messages'],
    [['ADMIN'], '/dashboard/admin/service-tickets/123', 'Services'],
    [['ADMIN'], '/dashboard/admin/catalogue', 'Account'],
  ]) {
    const active = primaryLinks(roles, roles.length > 0).filter(
      (item) => item.href && isPrimaryActive(item.href, path),
    );
    assert.deepEqual(
      active.map((item) => item.label),
      [expected],
    );
  }
  assert.equal(isPrimaryActive('/machinery', '/machinery-other'), false);
});
