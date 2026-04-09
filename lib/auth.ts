/**
 * lib/auth.ts — 서버 전용 (Server-only)
 * 비밀번호 검증, 세션 토큰, 속도 제한 처리
 */
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─────────────────────────────────────────
//  설정 로드 (환경변수 우선, JSON fallback)
// ─────────────────────────────────────────
interface AuthConfig {
  password: string;
  maxAttempts: number;
  lockoutMinutes: number;
}

let _cached: AuthConfig | null = null;

function loadConfig(): AuthConfig {
  if (_cached) return _cached;

  // 1순위: 환경변수 (Vercel 프로덕션)
  if (process.env.AUTH_PASSWORD) {
    _cached = {
      password: process.env.AUTH_PASSWORD,
      maxAttempts: parseInt(process.env.AUTH_MAX_ATTEMPTS ?? '3', 10),
      lockoutMinutes: parseInt(process.env.AUTH_LOCKOUT_MINUTES ?? '30', 10),
    };
    return _cached;
  }

  // 2순위: config/auth.json (로컬 개발)
  try {
    const raw = readFileSync(join(process.cwd(), 'config/auth.json'), 'utf-8');
    const json = JSON.parse(raw) as Partial<AuthConfig>;
    _cached = {
      password: json.password ?? '',
      maxAttempts: json.maxAttempts ?? 3,
      lockoutMinutes: json.lockoutMinutes ?? 30,
    };
    return _cached;
  } catch {
    throw new Error(
      'AUTH_PASSWORD 환경변수 또는 config/auth.json 이 없습니다. ' +
      'config/auth.example.json 을 참고하세요.',
    );
  }
}

// ─────────────────────────────────────────
//  서명 비밀키
// ─────────────────────────────────────────
function getSecret(): Buffer {
  const secret = process.env.AUTH_SECRET ?? '';
  if (secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be ≥ 32 chars in production');
    }
    // 개발 환경 fallback (절대 프로덕션에서 사용하지 말 것)
    return Buffer.from('dev-secret-do-not-use-in-production-at-all!!');
  }
  return Buffer.from(secret);
}

// ─────────────────────────────────────────
//  세션 토큰 (HMAC-SHA256, 외부 의존성 없음)
// ─────────────────────────────────────────
export function createSessionToken(): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8시간
    jti: randomBytes(16).toString('hex'),            // 재사용 방지
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot < 1) return false;

    const data = token.slice(0, lastDot);
    const sig  = token.slice(lastDot + 1);

    // 서명 검증 (타이밍 안전)
    const expected = createHmac('sha256', getSecret()).update(data).digest('base64url');
    const sigBuf  = Buffer.from(sig,      'base64url');
    const expBuf  = Buffer.from(expected, 'base64url');
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;

    // 만료 검증
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as { exp: number };
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────
//  비밀번호 검증 (타이밍 공격 방지)
// ─────────────────────────────────────────
export function validatePassword(input: string): boolean {
  const { password: correct } = loadConfig();
  if (!correct) return false;

  // 동일 길이 버퍼로 패딩하여 timingSafeEqual 사용
  const SIZE = 512;
  const inputBuf   = Buffer.alloc(SIZE, 0);
  const correctBuf = Buffer.alloc(SIZE, 0);
  Buffer.from(input).copy(inputBuf);
  Buffer.from(correct).copy(correctBuf);

  const lengthOk  = input.length === correct.length;
  const contentOk = timingSafeEqual(inputBuf, correctBuf);

  return lengthOk && contentOk; // 두 조건 모두 충족해야 통과
}

// ─────────────────────────────────────────
//  속도 제한 (인메모리, IP 기반)
// ─────────────────────────────────────────
interface AttemptRecord {
  count: number;
  lockUntil: number; // Unix ms
}

const attemptStore = new Map<string, AttemptRecord>();

export function checkRateLimit(ip: string): { locked: boolean; until?: number } {
  const entry = attemptStore.get(ip);
  if (!entry) return { locked: false };

  if (entry.lockUntil > Date.now()) {
    return { locked: true, until: entry.lockUntil };
  }

  // 잠금 만료 → 초기화
  attemptStore.delete(ip);
  return { locked: false };
}

export function recordFailedAttempt(ip: string): { remaining: number; locked: boolean } {
  const { maxAttempts, lockoutMinutes } = loadConfig();
  const lockoutMs = lockoutMinutes * 60 * 1000;

  const entry = attemptStore.get(ip) ?? { count: 0, lockUntil: 0 };
  entry.count += 1;

  if (entry.count >= maxAttempts) {
    entry.lockUntil = Date.now() + lockoutMs;
    attemptStore.set(ip, entry);
    return { remaining: 0, locked: true };
  }

  attemptStore.set(ip, entry);
  return { remaining: maxAttempts - entry.count, locked: false };
}

export function resetAttempts(ip: string): void {
  attemptStore.delete(ip);
}
