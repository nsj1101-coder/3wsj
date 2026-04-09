import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import LoginScreen from '@/components/LoginScreen';
import Desktop from '@/components/Desktop';

// 항상 동적 렌더링 (쿠키 기반 인증)
export const dynamic = 'force-dynamic';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('_3wsj_s')?.value;
  const authed = token ? verifySessionToken(token) : false;

  return authed ? <Desktop /> : <LoginScreen />;
}
