'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── 타입 ───────────────────────────────────────
type FileType = 'doc' | 'ppt' | 'web' | 'txt' | 'url';
interface FileItem { name: string; type: FileType; href: string; }
interface Folder    { label: string; path: string; files: FileItem[]; }

// ─── 폴더 데이터 ────────────────────────────────
const FOLDERS: Record<string, Folder> = {
  reports: {
    label: '보고서',
    path: 'C:\\3wsj\\보고서',
    files: [
      { name: 'EMR 프로젝트 보고서',  type: 'doc', href: '/emr-project-report.html' },
      { name: 'KIMES Expo 보고서',    type: 'doc', href: '/kimes-expo-report.html' },
      { name: '리파인 의원 보고서',   type: 'doc', href: '/refine-clinic-report.html' },
      { name: '회사소개서 (2026)',     type: 'web', href: '/company-profile.html' },
      { name: 'K-주전부리 PT FULL',   type: 'ppt', href: '/공문/K주전부리_PT_FULL.html' },
      { name: '행안부 제안서',         type: 'ppt', href: '/공문/부처별 제안서 슬라이드(초안)/K주전부리_행안부_제안서_슬라이드_v2.html' },
      { name: '문체부 제안서',         type: 'ppt', href: '/공문/부처별 제안서 슬라이드(초안)/K주전부리_문체부_제안서_슬라이드.html' },
      { name: '고용부 제안서',         type: 'ppt', href: '/공문/부처별 제안서 슬라이드(초안)/K주전부리_고용부_제안서_슬라이드_1.html' },
      { name: '중기부 제안서',         type: 'ppt', href: '/공문/부처별 제안서 슬라이드(초안)/K주전부리_중기부_제안서_슬라이드_1.html' },
      { name: '방통위 제안서',         type: 'ppt', href: '/공문/부처별 제안서 슬라이드(초안)/K주전부리_방통위_제안서_슬라이드_1.html' },
      { name: '국토부 제안서',         type: 'ppt', href: '/공문/부처별 제안서 슬라이드(초안)/K주전부리_국토부_제안서_슬라이드_1.html' },
      { name: '4/8 내부회의 QnA',     type: 'txt', href: '/공문/회의/K주전부리_내부정리_QnA_20260408.html' },
    ],
  },
  external: {
    label: '외부용',
    path: 'C:\\3wsj\\외부용',
    files: [
      { name: 'MediChart EMR',  type: 'url', href: 'https://emrdv.vercel.app/login' },
      { name: 'MediW (RS_dv)', type: 'url', href: 'https://rs-dv.vercel.app' },
    ],
  },
};

// ─── SVG 아이콘 ─────────────────────────────────
const FolderSVG = () => (
  <svg viewBox="0 0 48 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 38V14Q2 12 4 12H20L23 9Q24 8 25 8H44Q46 8 46 10V38Q46 40 44 40H4Q2 40 2 38Z" fill="#F5C343"/>
    <path d="M2 18H46V38Q46 40 44 40H4Q2 40 2 38V18Z" fill="#FFBB00"/>
    <rect x="2" y="18" width="44" height="2" fill="#D08800" opacity="0.35"/>
  </svg>
);

const FolderSmallSVG = () => (
  <svg viewBox="0 0 16 14" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="3" width="16" height="9" rx="1" fill="#FFBB00"/>
    <path d="M0 3 H6 L8 1 H12 Q14 1 15 3 H0Z" fill="#F5C343"/>
  </svg>
);

const FILE_ICONS: Record<FileType, React.ReactElement> = {
  doc: (
    <svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="4,2 28,2 36,10 36,46 4,46" fill="#fff"/>
      <polygon points="28,2 28,10 36,10" fill="#d0d0d0"/>
      <polyline points="4,2 28,2" fill="none" stroke="#bbb" strokeWidth="0.8"/>
      <polyline points="4,2 4,46 36,46 36,10 28,2 28,10 36,10" fill="none" stroke="#bbb" strokeWidth="0.8"/>
      <rect x="9" y="17" width="22" height="2" fill="#4a8fd8" rx="1"/>
      <rect x="9" y="22" width="18" height="2" fill="#4a8fd8" rx="1"/>
      <rect x="9" y="27" width="20" height="2" fill="#4a8fd8" rx="1"/>
      <rect x="9" y="32" width="15" height="2" fill="#4a8fd8" rx="1"/>
      <text x="20" y="13" fontSize="7" fill="#4a8fd8" textAnchor="middle" fontFamily="Arial" fontWeight="bold">HTML</text>
    </svg>
  ),
  ppt: (
    <svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="44" rx="2" fill="#C83C08"/>
      <rect x="2" y="2" width="36" height="22" rx="2" fill="#D85020"/>
      <rect x="6" y="5" width="28" height="18" rx="1" fill="rgba(255,255,255,0.92)"/>
      <text x="20" y="18" fontSize="13" fill="#C83C08" textAnchor="middle" fontFamily="Arial" fontWeight="bold">PT</text>
      <rect x="19" y="24" width="2" height="11" fill="rgba(255,255,255,0.4)"/>
      <rect x="10" y="35" width="20" height="3" fill="rgba(255,255,255,0.4)" rx="1"/>
      <rect x="5" y="39" width="30" height="2" fill="rgba(255,255,255,0.25)" rx="1"/>
    </svg>
  ),
  web: (
    <svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="4,2 28,2 36,10 36,46 4,46" fill="#fff"/>
      <polygon points="28,2 28,10 36,10" fill="#d0d0d0"/>
      <polyline points="4,2 28,2" fill="none" stroke="#bbb" strokeWidth="0.8"/>
      <polyline points="4,2 4,46 36,46 36,10 28,2 28,10 36,10" fill="none" stroke="#bbb" strokeWidth="0.8"/>
      <circle cx="20" cy="30" r="12" fill="#e8f0fe"/>
      <circle cx="20" cy="30" r="11" fill="none" stroke="#0054E3" strokeWidth="1.2"/>
      <ellipse cx="20" cy="30" rx="5.5" ry="11" fill="none" stroke="#0054E3" strokeWidth="1"/>
      <line x1="9" y1="30" x2="31" y2="30" stroke="#0054E3" strokeWidth="1"/>
      <line x1="11" y1="23" x2="29" y2="23" stroke="#0054E3" strokeWidth="0.8"/>
      <line x1="11" y1="37" x2="29" y2="37" stroke="#0054E3" strokeWidth="0.8"/>
    </svg>
  ),
  txt: (
    <svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="4,2 28,2 36,10 36,46 4,46" fill="#fffff4"/>
      <polygon points="28,2 28,10 36,10" fill="#e8e8d0"/>
      <polyline points="4,2 28,2" fill="none" stroke="#bbb" strokeWidth="0.8"/>
      <polyline points="4,2 4,46 36,46 36,10 28,2 28,10 36,10" fill="none" stroke="#bbb" strokeWidth="0.8"/>
      {[16,20,24,28,32,36].map((y, i) => (
        <rect key={y} x="9" y={y} width={[22,18,20,16,19,13][i]} height="1.5" fill="#888" rx="0.5"/>
      ))}
    </svg>
  ),
  url: (
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#1a55cc"/>
      <circle cx="20" cy="20" r="18" fill="none" stroke="#0c3a96" strokeWidth="1"/>
      <ellipse cx="20" cy="20" rx="7.5" ry="18" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
      <line x1="2" y1="20" x2="38" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
      <line x1="4" y1="12" x2="36" y2="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="4" y1="28" x2="36" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="20" y1="2" x2="20" y2="38" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
      <text x="20" y="25" fontSize="8" fill="#fff" textAnchor="middle" fontFamily="Arial" fontWeight="bold">www</text>
    </svg>
  ),
};

// ─── 컴포넌트 ────────────────────────────────────
export default function Desktop() {
  const [selIcon,   setSelIcon]   = useState<string | null>(null);
  const [openId,    setOpenId]    = useState<string | null>(null);
  const [selFile,   setSelFile]   = useState<string | null>(null);
  const [winPos,    setWinPos]    = useState({ x: 0, y: 0, useTransform: true });
  const [clock,     setClock]     = useState('');
  const winRef  = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, initX: 0, initY: 0 });
  const router  = useRouter();

  // 시계
  useEffect(() => {
    const tick = () => {
      const d  = new Date();
      const h  = d.getHours() % 12 || 12;
      const m  = String(d.getMinutes()).padStart(2, '0');
      const ap = d.getHours() >= 12 ? 'PM' : 'AM';
      setClock(`${h}:${m} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openFolder = useCallback((id: string) => {
    setSelFile(null);
    setOpenId(id);
    setWinPos({ x: 0, y: 0, useTransform: true });
  }, []);

  const closeWin = useCallback(() => { setOpenId(null); setSelFile(null); }, []);

  const handleFileClick = useCallback((file: FileItem) => {
    setSelFile(file.name);
    window.open(file.href, '_blank', 'noopener,noreferrer');
  }, []);

  // 드래그
  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('wxbtn')) return;
    e.preventDefault();
    const rect = winRef.current!.getBoundingClientRect();
    dragRef.current = { active: true, initX: e.clientX - rect.left, initY: e.clientY - rect.top };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return;
      setWinPos({
        x: ev.clientX - dragRef.current.initX,
        y: ev.clientY - dragRef.current.initY,
        useTransform: false,
      });
    };
    const onUp = () => {
      dragRef.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // 로그아웃
  const handleLogout = useCallback(async () => {
    await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' });
    router.refresh();
  }, [router]);

  const folder = openId ? FOLDERS[openId] : null;

  const winStyle: React.CSSProperties = winPos.useTransform
    ? { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    : { position: 'fixed', left: winPos.x, top: winPos.y, transform: 'none' };

  return (
    <>
      {/* 데스크탑 */}
      <div id="desktop" onClick={() => setSelIcon(null)}>
        {Object.entries(FOLDERS).map(([id, f]) => (
          <div
            key={id}
            className={`desk-icon${selIcon === id ? ' sel' : ''}`}
            onClick={e => { e.stopPropagation(); setSelIcon(id); openFolder(id); }}
          >
            <FolderSVG />
            <span className="dlbl">{f.label}</span>
          </div>
        ))}
      </div>

      {/* 태스크바 */}
      <div id="taskbar">
        <button id="start-btn">
          <div className="winlogo">
            <s/><s/><s/><s/>
          </div>
          start
        </button>
        <div id="taskbar-right">
          <button id="logout-btn" onClick={handleLogout}>로그아웃</button>
          <div id="clock">{clock}</div>
        </div>
      </div>

      {/* Explorer 창 */}
      {folder && (
        <div
          ref={winRef}
          className="xpwin open"
          style={winStyle}
        >
          {/* 타이틀바 */}
          <div className="xptb" onMouseDown={onTitleMouseDown}>
            <div className="xptb-l">
              <FolderSmallSVG />
              <span>3wsj — {folder.label}</span>
            </div>
            <div className="xptb-r">
              <div className="wxbtn">_</div>
              <div className="wxbtn" style={{ fontSize: 12 }}>□</div>
              <div className="wxbtn wxbtn-x" onClick={closeWin}>✕</div>
            </div>
          </div>

          {/* 메뉴바 */}
          <div className="xpmb">
            {['파일(F)', '편집(E)', '보기(V)', '즐겨찾기(A)', '도구(T)', '도움말(H)'].map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>

          {/* 주소창 */}
          <div className="xpab">
            <label>주소(D)</label>
            <div className="xpab-input">{folder.path}</div>
          </div>

          {/* 본문 */}
          <div className="xpbody">
            {/* 사이드바 */}
            <div className="xpsb">
              <div className="xpsb-sec">
                <h4>다른 위치</h4>
                {Object.entries(FOLDERS).map(([id, f]) => (
                  <div key={id} className="xpsb-link" onClick={() => openFolder(id)}>
                    <FolderSmallSVG />{f.label}
                  </div>
                ))}
              </div>
              <div className="xpsb-sec">
                <h4>세부 정보</h4>
                <div id="detailPane">
                  {selFile
                    ? <><strong>{selFile}</strong><br/><span style={{color:'#555',fontSize:'10px'}}>파일</span></>
                    : <>{folder.label}<br/>{folder.files.length}개 항목</>
                  }
                </div>
              </div>
            </div>

            {/* 파일 영역 */}
            <div className="xpfc" onClick={() => setSelFile(null)}>
              <div className="fgrid">
                {folder.files.map(file => (
                  <div
                    key={file.name}
                    className={`fitem${selFile === file.name ? ' sel' : ''}`}
                    onClick={e => { e.stopPropagation(); handleFileClick(file); }}
                  >
                    {FILE_ICONS[file.type]}
                    <span className="fn">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 상태바 */}
          <div className="xpst">
            <span>{folder.files.length}개 항목</span>
            <span>{selFile ? `"${selFile}" 선택됨` : ''}</span>
          </div>
        </div>
      )}
    </>
  );
}
