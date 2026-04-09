'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginScreen() {
  const [pw, setPw]         = useState('');
  const [error, setError]   = useState('');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const shakeTile = useCallback(() => {
    const tile = document.getElementById('xp-user-tile');
    if (!tile) return;
    tile.style.animation = 'shake 0.45s';
    tile.addEventListener('animationend', () => { tile.style.animation = ''; }, { once: true });
  }, []);

  const spamAlerts = useCallback(() => {
    const msgs = [
      '⛔ 접속 거부 — 비밀번호 오류 횟수 초과',
      '🔒 보안 경고: 무단 접근 시도가 감지되었습니다',
      '⚠️ 시스템 잠금 — 관리자에게 문의하세요',
      '❌ ACCESS DENIED — 비밀번호 3회 오류',
      '🚨 경고: 이 접근 시도는 기록됩니다',
      '🛑 계정이 잠겼습니다 — ACCOUNT LOCKED',
      '⛔ 보안 정책 위반: 접근 불가',
      '🔴 시스템 보안 차단 활성화됨',
    ];
    for (let i = 0; i < 20; i++) alert(msgs[i % msgs.length]);
  }, []);

  const handleLogin = useCallback(async () => {
    if (locked || loading || !pw) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
        credentials: 'same-origin',
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        remaining?: number;
        locked?: boolean;
      };

      if (res.ok && data.ok) {
        router.refresh(); // 서버 컴포넌트 재실행 → Desktop 렌더
        return;
      }

      if (res.status === 429 || data.error === 'locked') {
        setLocked(true);
        spamAlerts();
        return;
      }

      if (data.error === 'wrong') {
        setPw('');
        setTimeout(() => inputRef.current?.focus(), 0);

        if (data.locked) {
          setLocked(true);
          spamAlerts();
        } else {
          setError(`암호가 잘못되었습니다. ${data.remaining ?? 0}번의 기회가 남았습니다.`);
          shakeTile();
        }
        return;
      }

      setError('오류가 발생했습니다. 다시 시도하세요.');
    } catch {
      setError('서버 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [locked, loading, pw, router, shakeTile, spamAlerts]);

  return (
    <div id="loginScreen">
      {/* 상단 스트립 */}
      <div className="xp-top-strip" />

      {/* 본문: 좌/우 패널 */}
      <div className="xp-main">

        {/* 좌측: Windows XP 로고 */}
        <div className="xp-left">
          <div className="xp-logo-block">
            <svg className="xp-flag" viewBox="0 0 72 64" xmlns="http://www.w3.org/2000/svg">
              <path d="M34 30 C28 28 16 22 6 8 C12 18 22 26 34 30Z" fill="#f25022"/>
              <path d="M34 30 C22 26 12 28 4 36 C10 30 22 30 34 30Z" fill="#f25022" opacity="0.7"/>
              <path d="M38 30 C50 26 60 18 66 8 C58 22 48 28 38 30Z" fill="#7fba00"/>
              <path d="M38 30 C50 30 62 30 68 36 C60 28 50 26 38 30Z" fill="#7fba00" opacity="0.7"/>
              <path d="M34 34 C22 38 12 46 4 58 C12 46 22 38 34 34Z" fill="#00a4ef"/>
              <path d="M34 34 C22 38 10 42 4 36 C12 38 22 36 34 34Z" fill="#00a4ef" opacity="0.7"/>
              <path d="M38 34 C50 38 60 46 68 58 C60 46 50 38 38 34Z" fill="#ffb900"/>
              <path d="M38 34 C50 36 60 38 68 36 C62 42 50 38 38 34Z" fill="#ffb900" opacity="0.7"/>
            </svg>

            <div className="xp-ms-word">
              Microsoft<sup style={{ fontSize: '7px' }}>®</sup>
            </div>
            <div className="xp-windows-text">
              Windows<span className="xp-xp-text">XP</span>
            </div>
            <div className="xp-tagline-sep" />
            <div className="xp-tagline">사용자 이름을 클릭하면 시작합니다</div>
          </div>
        </div>

        {/* 수직 구분선 */}
        <div className="xp-vdiv" />

        {/* 우측: 유저 타일 */}
        <div className="xp-right">
          <div className="xp-user-list">
            <div
              className="xp-user-tile"
              id="xp-user-tile"
              style={{ position: 'relative' }}
            >
              {/* 체스 아바타 */}
              <div className="xp-avatar">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                  <rect width="48" height="48" fill="#6b4c11"/>
                  <rect width="48" height="48" fill="#7d5c20" opacity="0.6"/>
                  <rect x="21" y="6" width="6" height="2" fill="#e8c860" rx="0.5"/>
                  <rect x="23" y="4" width="2" height="6" fill="#e8c860"/>
                  <ellipse cx="24" cy="16" rx="5" ry="4" fill="#e8c860"/>
                  <polygon points="19,20 29,20 31,36 17,36" fill="#e8c860"/>
                  <rect x="15" y="36" width="18" height="3" fill="#e8c860" rx="1"/>
                  <rect x="17" y="39" width="14" height="2" fill="#c8a840" rx="0.5"/>
                  <ellipse cx="38" cy="30" rx="4" ry="3" fill="#d4b050" opacity="0.8"/>
                  <polygon points="35,33 41,33 42,42 34,42" fill="#d4b050" opacity="0.8"/>
                  <rect x="33" y="42" width="10" height="2" fill="#b89030" rx="0.5" opacity="0.8"/>
                </svg>
              </div>

              {/* 이름 + 비밀번호 입력 */}
              <div className="xp-user-info">
                <div className="xp-uname">3w_sj</div>
                <div className="xp-pw-hint">암호를 입력하세요</div>
                <div className="xp-pw-row">
                  <input
                    ref={inputRef}
                    id="pwInput"
                    type="password"
                    maxLength={128}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    disabled={locked || loading}
                    autoComplete="current-password"
                  />
                  <button
                    className="xp-go-btn"
                    onClick={handleLogin}
                    disabled={locked || loading}
                    aria-label="로그인"
                  >
                    {loading ? '…' : '▶'}
                  </button>
                  <div className="xp-help-btn" role="button" aria-label="도움말">?</div>
                </div>
                <div className="xp-err" role="alert">{error}</div>
              </div>

              {/* 잠금 오버레이 */}
              {locked && (
                <div style={{
                  display: 'flex', position: 'absolute', inset: 0,
                  background: 'rgba(10,15,60,0.92)',
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: '8px', borderRadius: '4px',
                }}>
                  <div style={{ fontSize: '36px' }}>🔒</div>
                  <div style={{ color: '#ff5555', fontSize: '13px', fontWeight: 'bold' }}>
                    접근 차단됨
                  </div>
                  <div style={{
                    color: 'rgba(255,255,255,0.6)', fontSize: '10px',
                    textAlign: 'center', lineHeight: 1.5,
                  }}>
                    비밀번호 3회 오류<br />관리자에게 문의하세요
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 스트립 */}
      <div className="xp-bottom-strip">
        <div className="xp-power-wrap">
          <div className="xp-power-icon">⏻</div>
          <span className="xp-power-label">컴퓨터 끄기</span>
        </div>
        <div className="xp-bottom-info">
          로그온하면 계정을 추가하거나 변경할 수 있습니다.<br />
          제어판을 열고 사용자 계정을 클릭하세요.
        </div>
      </div>
    </div>
  );
}
