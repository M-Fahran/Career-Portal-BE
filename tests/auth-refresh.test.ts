import test from 'node:test';
import assert from 'node:assert/strict';
import * as authService from '../src/service/auth.service';
import {
  getRefreshCookieNameByType,
  generateCandidateRefreshToken,
  generateUserRefreshToken,
} from '../src/utils/generateToken';

test('candidate and user refresh tokens use separate cookie names', () => {
  assert.equal(getRefreshCookieNameByType('candidate'), 'candidateRefreshToken');
  assert.equal(getRefreshCookieNameByType('user'), 'userRefreshToken');
});

test('candidate and user refresh tokens are distinct and carry their own type', () => {
  const candidateToken = generateCandidateRefreshToken({ id: 'cand-1', role: 'candidate' });
  const userToken = generateUserRefreshToken({ id: 'user-1', role: 'super_admin' });

  assert.notEqual(candidateToken, userToken);
  assert.match(candidateToken, /^eyJ/);
  assert.match(userToken, /^eyJ/);
});

test('refresh rejects a candidate token on the user route and vice versa', async () => {
  const candidateToken = generateCandidateRefreshToken({ id: 'cand-1', role: 'candidate' });
  const userToken = generateUserRefreshToken({ id: 'user-1', role: 'super_admin' });

  await assert.rejects(() => authService.refresh(candidateToken, 'user'), /Token tidak cocok untuk akun ini|Session berakhir/);
  await assert.rejects(() => authService.refresh(userToken, 'candidate'), /Token tidak cocok untuk akun ini|Session berakhir/);
});
