import { NextRequest, NextResponse } from 'next/server';
import {
  validatePassword,
  createSessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '@/lib/auth';

const COOKIE = '_3wsj_s';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

/** POST /api/auth — 로그인 */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

  // 1. 속도 제한 확인
  const limit = checkRateLimit(ip);
  if (limit.locked) {
    const retryAfter = limit.until
      ? Math.ceil((limit.until - Date.now()) / 1000)
      : 1800;
    return NextResponse.json(
      { error: 'locked' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  // 2. 요청 바디 파싱 (길이 제한 포함)
  let password: string;
  try {
    const body = (await req.json()) as { password?: unknown };
    if (
      !body?.password ||
      typeof body.password !== 'string' ||
      body.password.length === 0 ||
      body.password.length > 128
    ) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }
    password = body.password;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // 3. 비밀번호 검증
  const valid = validatePassword(password);

  if (!valid) {
    const result = recordFailedAttempt(ip);
    return NextResponse.json(
      { error: 'wrong', remaining: result.remaining, locked: result.locked },
      { status: 401 },
    );
  }

  // 4. 성공 — 세션 발급
  resetAttempts(ip);
  const token = createSessionToken();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,                                          // JS 접근 불가
    secure: process.env.NODE_ENV === 'production',           // HTTPS only (prod)
    sameSite: 'strict',                                      // CSRF 방지
    maxAge: 8 * 3600,                                        // 8시간
    path: '/',
  });

  return res;
}

/** DELETE /api/auth — 로그아웃 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
