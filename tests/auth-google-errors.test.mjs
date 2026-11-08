import assert from 'node:assert/strict';
import { test } from 'node:test';
import { googleErrorMessage } from '../src/lib/auth/errors.ts';
test('Google failures provide safe actionable guidance without displaying arbitrary error text', () => {
  assert.equal(googleErrorMessage(), '');
  assert.match(googleErrorMessage('AccountLinkRequired'), /Account settings/);
  assert.match(
    googleErrorMessage('GoogleUnavailable'),
    /temporarily unavailable/,
  );
  assert.match(googleErrorMessage('OAuthCallback'), /authorization/);
  assert.match(googleErrorMessage('GoogleLink'), /same verified email/);
  assert.match(googleErrorMessage('GoogleRateLimit'), /wait/);
  assert.doesNotMatch(
    googleErrorMessage('<script>unknown error</script>'),
    /script/,
  );
});
