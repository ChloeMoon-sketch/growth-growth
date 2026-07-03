'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db, auth } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { LogOut, KeyRound, Sparkles, AlertCircle, Check, Heart, BookOpen, Trash2, Edit3, Calendar, Smile } from 'lucide-react';
import { mapPasswordToFirebase } from '@/lib/auth-mapping';

interface Diary {
  id: string;
  date: string;
  mood: string;
  praises: string;
  reflections: string;
  extraTitle: string;
  extraContent: string;
  createdAt?: string;
}

const MOODS = [
  { emoji: '😊', label: '신남' },
  { emoji: '😄', label: '행복' },
  { emoji: '😐', label: '보통' },
  { emoji: '😢', label: '슬픔' },
  { emoji: '😡', label: '속상' },
];

export default function StudentPage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  // Diary Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('😊');
  const [praises, setPraises] = useState('');
  const [reflections, setReflections] = useState('');
  const [extraTitle, setExtraTitle] = useState('기타');
  const [extraContent, setExtraContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Diaries List State
  const [diaries, setDiaries] = useState<Diary[]>([]);

  // Edit Diary Modal States
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editMood, setEditMood] = useState('');
  const [editPraises, setEditPraises] = useState('');
  const [editReflections, setEditReflections] = useState('');
  const [editExtraTitle, setEditExtraTitle] = useState('');
  const [editExtraContent, setEditExtraContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password Modal State
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, profile, loading, router]);

  // Real-time diaries fetching (with instant updates)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Diary[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Diary);
      });
      // 오래된 일기일수록 아래로 가도록 정렬 (날짜 오름차순 -> 생성시간 오름차순)
      list.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
      setDiaries(list);
    }, (error) => {
      console.error("Error fetching diaries:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmitDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!praises.trim() || !reflections.trim()) {
      setFormMessage({ type: 'error', text: '칭찬할 점과 반성할 점을 채워주세요!' });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    try {
      await addDoc(collection(db, 'diaries'), {
        userId: user.uid,
        studentName: profile?.name || '학생',
        date,
        mood,
        praises,
        reflections,
        extraTitle: extraTitle.trim() || '기타',
        extraContent,
        createdAt: new Date().toISOString(),
      });

      setFormMessage({ type: 'success', text: '오늘의 일기가 작성되었어요! 🌟' });
      setPraises('');
      setReflections('');
      setExtraContent('');
    } catch (error: any) {
      console.error(error);
      setFormMessage({ type: 'error', text: '저장하는 동안 에러가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Diary Action
  const handleDeleteDiary = async (id: string) => {
    if (!confirm('정말 이 일기를 삭제할까요? 한 번 지우면 복구할 수 없어요!')) return;
    try {
      await deleteDoc(doc(db, 'diaries', id));
    } catch (err) {
      console.error('Error deleting diary:', err);
      alert('일기 삭제에 실패했습니다.');
    }
  };

  // Start Edit Mode
  const startEditDiary = (diary: Diary) => {
    setEditingDiary(diary);
    setEditDate(diary.date);
    setEditMood(diary.mood);
    setEditPraises(diary.praises);
    setEditReflections(diary.reflections);
    setEditExtraTitle(diary.extraTitle);
    setEditExtraContent(diary.extraContent);
  };

  // Submit Edit Diary Form
  const handleUpdateDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiary) return;
    if (!editPraises.trim() || !editReflections.trim()) {
      alert('칭찬할 점과 반성할 점을 채워주세요!');
      return;
    }

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'diaries', editingDiary.id), {
        date: editDate,
        mood: editMood,
        praises: editPraises,
        reflections: editReflections,
        extraTitle: editExtraTitle.trim() || '기타',
        extraContent: editExtraContent,
      });
      setEditingDiary(null);
    } catch (err) {
      console.error('Error updating diary:', err);
      alert('일기 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPwError('비밀번호는 최소 4자리 이상 입력해주세요.');
      return;
    }

    setPwSubmitting(true);
    setPwError('');
    setPwSuccess('');

    try {
      if (auth.currentUser) {
        const mappedPw = mapPasswordToFirebase(newPassword);
        await updatePassword(auth.currentUser, mappedPw);
        setPwSuccess('비밀번호가 성공적으로 변경되었습니다!');
        setNewPassword('');
        setTimeout(() => {
          setIsPwModalOpen(false);
          setPwSuccess('');
        }, 1500);
      } else {
        setPwError('다시 로그인해주세요.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setPwError('보안 상 비밀번호를 변경하려면 재로그인이 필요합니다.');
      } else {
        setPwError('비밀번호 변경 실패: ' + err.message);
      }
    } finally {
      setPwSubmitting(false);
    }
  };

  if (loading || !user || (profile && profile.role === 'admin')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FAF6EE]">
        <div className="animate-pulse">
          <BookOpen className="w-16 h-16 text-[#FFB085] mb-2" />
        </div>
        <p className="text-xl font-bold text-[#8C7A6B]">일기장 가져오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-3xl p-6 border-4 border-[#8C7A6B] shadow-md mb-8 transform rotate-[0.2deg]">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="bg-[#FFE3A8] p-2.5 rounded-2xl">
            <Heart className="w-8 h-8 text-[#FF8E53] fill-[#FF8E53]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#4A3E3D] tracking-tight">성장 일기</h1>
            <p className="text-sm font-bold text-[#8C7A6B]">{profile?.name}의 성장을 응원합니다</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPwModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white hover:bg-[#FAF6EE] text-[#8C7A6B] font-extrabold rounded-xl border-2 border-[#D2C5B4] transition-all"
          >
            <KeyRound className="w-4 h-4" />
            비밀번호 변경
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#FFEBEB] hover:bg-[#FDD8D8] text-[#D32F2F] font-extrabold rounded-xl border-2 border-[#FFD2D2] transition-all"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Write Diary Form */}
        <section className="bg-white rounded-3xl border-4 border-[#8C7A6B] p-6 md:p-8 shadow-md relative transform rotate-[-0.3deg]">
          <div className="absolute top-0 bottom-0 left-8 border-l-2 border-dashed border-[#FFC8A2]"></div>
          
          <div className="pl-6 relative z-10">
            <h2 className="text-2xl font-black text-[#4A3E3D] mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#FF8E53]" />
              오늘의 성장 일기 쓰기
            </h2>

            <form onSubmit={handleSubmitDiary} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold text-[#4A3E3D] mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-[#8C7A6B]" />
                    날짜
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#FFE3A8] focus:border-[#FF8E53]"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-[#4A3E3D] mb-2 flex items-center gap-1">
                    <Smile className="w-4 h-4 text-[#8C7A6B]" />
                    오늘의 기분
                  </label>
                  <div className="flex gap-2 justify-between bg-[#FAF6EE] p-2 border-3 border-[#D2C5B4] rounded-2xl">
                    {MOODS.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setMood(m.emoji)}
                        className={`text-2xl p-2 rounded-xl transition-all duration-200 ${
                          mood === m.emoji
                            ? 'bg-[#FF8E53] scale-110 shadow-md text-white'
                            : 'hover:bg-[#EADCC9]'
                        }`}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-[#4A3E3D] mb-2">
                  👏 오늘 내가 잘한 점 (스스로에게 해줄 칭찬)
                </label>
                <textarea
                  rows={3}
                  value={praises}
                  onChange={(e) => setPraises(e.target.value)}
                  placeholder="예: 친구가 무거운 짐을 드는 것을 도와줬어요! 영어 시험을 노력해서 잘 쳤어요."
                  className="w-full px-4 py-3 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] placeholder-[#A49685] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#FFE3A8] focus:border-[#FF8E53]"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-[#4A3E3D] mb-2">
                  ✍️ 오늘 내가 아쉽거나 잘못한 점 (스스로 되돌아보기)
                </label>
                <textarea
                  rows={3}
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                  placeholder="예: 숙제를 조금 늦게 시작해서 늦잠을 잘 뻔했어요. 다음부턴 제때 끝낼게요."
                  className="w-full px-4 py-3 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] placeholder-[#A49685] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#FFE3A8] focus:border-[#FF8E53]"
                />
              </div>

              <div className="bg-[#FFFCEB] p-4 rounded-2xl border-3 border-[#FFD98E] space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#D06F00]">💡 나만의 자유 항목 쓰기:</span>
                  <input
                    type="text"
                    value={extraTitle}
                    onChange={(e) => setExtraTitle(e.target.value)}
                    placeholder="항목 제목 (예: 감사한 일, 내일의 다짐)"
                    className="px-3 py-1 border-2 border-[#FFD98E] rounded-xl bg-white text-[#4A3E3D] font-bold focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  value={extraContent}
                  onChange={(e) => setExtraContent(e.target.value)}
                  placeholder="내용을 채워주세요 (자유롭게 추가할 수 있어요)"
                  className="w-full px-4 py-2.5 border-2 border-[#FFD98E] rounded-xl bg-white text-[#4A3E3D] placeholder-[#B5A593] font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#FFE3A8]"
                />
              </div>

              {formMessage && (
                <div className={`p-4 rounded-2xl border-2 flex items-center gap-2 font-bold ${
                  formMessage.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {formMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span>{formMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-extrabold text-xl rounded-2xl shadow-md border-b-4 border-[#C85D25] transform active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '기록 저장 중...' : '일기장 제출하기 📔'}
              </button>
            </form>
          </div>
        </section>

        {/* Diaries Timeline / Accumulated */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-[#4A3E3D] flex items-center gap-2 pl-2">
            <BookOpen className="w-6 h-6 text-[#FF8E53]" />
            내가 쓴 일기들 ({diaries.length}개)
          </h2>

          {diaries.length === 0 ? (
            <div className="bg-white border-4 border-dashed border-[#D2C5B4] rounded-3xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-[#A49685] mx-auto mb-3 animate-pulse" />
              <p className="text-lg font-bold text-[#8C7A6B]">아직 일기가 없습니다. 첫 일기를 써보세요!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {diaries.map((diary) => (
                <div
                  key={diary.id}
                  className="bg-white rounded-3xl border-4 border-[#8C7A6B] p-6 shadow-md relative overflow-hidden transform rotate-[-0.2deg]"
                >
                  {/* Diary Header info */}
                  <div className="flex justify-between items-center border-b-2 border-[#FAF6EE] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-bold bg-[#FFE3A8] text-[#8C7A6B] px-3 py-1 rounded-xl">
                        {diary.date}
                      </span>
                      <span className="text-2xl" title="오늘의 기분">
                        {diary.mood}
                      </span>
                    </div>

                    {/* Edit & Delete Action buttons */}
                    <div className="flex items-center gap-2 z-20">
                      <button
                        onClick={() => startEditDiary(diary)}
                        className="p-2 hover:bg-[#FFE3A8] rounded-xl text-[#8C7A6B] hover:text-[#4A3E3D] transition-colors"
                        title="일기 수정"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDiary(diary.id)}
                        className="p-2 hover:bg-[#FFEBEB] rounded-xl text-[#A49685] hover:text-[#D32F2F] transition-colors"
                        title="일기 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Diary Fields */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#FF8E53]">👏 잘한 점</h4>
                      <p className="text-lg font-bold text-[#4A3E3D] pl-1 whitespace-pre-wrap">{diary.praises}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#8C7A6B]">✍️ 반성할 점</h4>
                      <p className="text-lg font-bold text-[#4A3E3D] pl-1 whitespace-pre-wrap">{diary.reflections}</p>
                    </div>
                    {diary.extraContent && (
                      <div className="bg-[#FFFCEB] p-2.5 rounded-xl border border-[#FFD98E]">
                        <h4 className="text-xs font-bold text-[#D06F00]">💡 {diary.extraTitle || '기타'}</h4>
                        <p className="text-base font-bold text-[#4A3E3D] whitespace-pre-wrap">{diary.extraContent}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Edit Diary Modal */}
      {editingDiary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border-4 border-[#8C7A6B] w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto transform rotate-[0.3deg]">
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-4 flex items-center gap-2 border-b-2 border-[#FAF6EE] pb-2">
              <Edit3 className="w-6 h-6 text-[#FF8E53]" />
              일기장 고치기
            </h3>

            <form onSubmit={handleUpdateDiary} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#8C7A6B] mb-1">날짜</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#D2C5B4] rounded-xl bg-[#FAF6EE] text-[#4A3E3D] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#8C7A6B] mb-1">오늘의 기분</label>
                  <div className="flex gap-1 justify-between bg-[#FAF6EE] p-1 border-2 border-[#D2C5B4] rounded-xl">
                    {MOODS.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setEditMood(m.emoji)}
                        className={`text-xl p-1.5 rounded-lg transition-all ${
                          editMood === m.emoji ? 'bg-[#FF8E53] scale-105 shadow text-white' : 'hover:bg-[#EADCC9]'
                        }`}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#8C7A6B] mb-1">👏 오늘 내가 잘한 점</label>
                <textarea
                  rows={3}
                  value={editPraises}
                  onChange={(e) => setEditPraises(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#D2C5B4] rounded-xl bg-[#FAF6EE] text-[#4A3E3D] font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#8C7A6B] mb-1">✍️ 오늘 내가 아쉽거나 잘못한 점</label>
                <textarea
                  rows={3}
                  value={editReflections}
                  onChange={(e) => setEditReflections(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#D2C5B4] rounded-xl bg-[#FAF6EE] text-[#4A3E3D] font-bold"
                />
              </div>

              <div className="bg-[#FFFCEB] p-3 rounded-xl border-2 border-[#FFD98E] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#D06F00]">💡 나만의 자유 항목:</span>
                  <input
                    type="text"
                    value={editExtraTitle}
                    onChange={(e) => setEditExtraTitle(e.target.value)}
                    className="px-2 py-0.5 border border-[#FFD98E] rounded bg-white text-[#4A3E3D] font-bold text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  value={editExtraContent}
                  onChange={(e) => setEditExtraContent(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#FFD98E] rounded bg-white text-[#4A3E3D] font-bold text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDiary(null)}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-bold rounded-xl border-b-2 border-[#C85D25]"
                >
                  {isUpdating ? '저장 중...' : '수정하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPwModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border-4 border-[#8C7A6B] w-full max-w-sm p-6 shadow-2xl relative">
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-4 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-[#FF8E53]" />
              비밀번호 변경하기
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#8C7A6B] mb-1">새 비밀번호</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 입력"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border-3 border-[#D2C5B4] rounded-xl bg-[#FAF6EE] text-[#4A3E3D] font-bold focus:outline-none"
                />
              </div>

              {pwError && (
                <p className="text-sm font-bold text-[#D32F2F] flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {pwError}
                </p>
              )}

              {pwSuccess && (
                <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {pwSuccess}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPwModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={pwSubmitting}
                  className="flex-1 py-2.5 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-bold rounded-xl border-b-2 border-[#C85D25]"
                >
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
