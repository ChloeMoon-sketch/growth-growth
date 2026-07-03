'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { seedInitialUsers } from '@/lib/seed';
import { mapIdToEmail, mapPasswordToFirebase } from '@/lib/auth-mapping';
import { KeyRound, User as UserIcon, Sparkles, BookOpen, Check, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Seeding state
  const [seedStatus, setSeedStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [seedMessage, setSeedMessage] = useState('');

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setLoginLoading(true);

    try {
      // 1. 아이디 및 패스워드를 Firebase 규격으로 변환
      const mappedEmail = mapIdToEmail(username);
      const mappedPassword = mapPasswordToFirebase(password);

      // 2. Firebase Auth 로그인
      const userCredential = await signInWithEmailAndPassword(auth, mappedEmail, mappedPassword);
      
      // 3. Firestore에서 권한 조회
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        setError('가입된 사용자 정보를 찾을 수 없습니다.');
        await auth.signOut();
        setLoginLoading(false);
        return;
      }
      
      const role = userDoc.data().role;
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeedStatus('loading');
    try {
      const result = await seedInitialUsers();
      if (result.success) {
        setSeedStatus('success');
        setSeedMessage(`초기 계정 세팅 완료! (신규 ${result.createdCount}개 계정 등록)`);
      } else {
        setSeedStatus('error');
        setSeedMessage(`일부 에러 발생: ${result.errors?.join(', ')}`);
      }
    } catch (err: any) {
      setSeedStatus('error');
      setSeedMessage(err.message || '세팅 오류');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FAF6EE]">
        <div className="animate-bounce">
          <BookOpen className="w-16 h-16 text-[#FFB085] mb-2" />
        </div>
        <p className="text-xl font-bold text-[#8C7A6B]">일기장 펼치는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-4 bg-[#FAF6EE]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-4 border-[#8C7A6B] overflow-hidden transform rotate-[-0.5deg] relative">
        {/* Notebook top spiral ring decoration */}
        <div className="absolute top-0 left-0 right-0 flex justify-around -mt-4 z-10 px-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-6 h-8 bg-gray-300 rounded-full border-4 border-gray-400 flex flex-col items-center">
              <div className="w-2 h-4 bg-gray-500 rounded-full mt-1"></div>
            </div>
          ))}
        </div>

        <div className="p-8 pt-10">
          <div className="text-center mb-8">
            <div className="inline-block bg-[#FFE3A8] p-3 rounded-2xl mb-3 shadow-inner">
              <Sparkles className="w-10 h-10 text-[#FF8E53]" />
            </div>
            <h1 className="text-4xl font-extrabold text-[#4A3E3D] tracking-tight">성장 일기</h1>
            <p className="text-[#8C7A6B] mt-2 text-lg">매일 기록하는 나만의 작은 성장 기록장</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-[#4A3E3D] mb-2" htmlFor="username">
                아이디
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-5 w-5 text-[#8C7A6B]" />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="아이디 입력 (예: admin, student1)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] placeholder-[#A49685] focus:outline-none focus:ring-4 focus:ring-[#FFE3A8] focus:border-[#FF8E53] text-lg font-bold transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-[#4A3E3D] mb-2" htmlFor="password">
                비밀번호
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-5 w-5 text-[#8C7A6B]" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] placeholder-[#A49685] focus:outline-none focus:ring-4 focus:ring-[#FFE3A8] focus:border-[#FF8E53] text-lg font-bold transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-[#FFEBEB] text-[#D32F2F] p-3 rounded-2xl border-2 border-[#FFD2D2] flex items-center gap-2 font-bold">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 px-4 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-extrabold text-xl rounded-2xl shadow-md hover:shadow-lg border-b-4 border-[#C85D25] transform active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
            >
              {loginLoading ? '로그인 중...' : '일기 쓰러 가기!'}
            </button>
          </form>

          {/* Seed Data Section for easy Setup */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-[#E3D9CD] text-center">
            <p className="text-sm font-bold text-[#8C7A6B] mb-3">개발/실습용 초기 데이터 세팅</p>
            {seedStatus === 'idle' && (
              <button
                onClick={handleSeed}
                className="text-sm px-4 py-2 bg-[#EADCC9] hover:bg-[#DFD0BC] text-[#5C4D3E] font-bold rounded-xl border-b-2 border-[#C6B6A3] active:translate-y-0.5 active:border-b-0 transition-all"
              >
                초기 계정 4개 생성하기 (admin, student 1~3)
              </button>
            )}
            {seedStatus === 'loading' && (
              <p className="text-sm font-bold text-[#FF8E53] animate-pulse">Firebase 계정 생성 중...</p>
            )}
            {seedStatus === 'success' && (
              <div className="inline-flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <Check className="w-4 h-4" />
                <span>{seedMessage}</span>
              </div>
            )}
            {seedStatus === 'error' && (
              <div className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 text-left">
                {seedMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
