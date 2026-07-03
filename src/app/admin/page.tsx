'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db, auth } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { LogOut, KeyRound, Sparkles, BookOpen, Heart, User, Calendar, Smile, Plus, ChevronRight, PenTool, Edit3, Trash2 } from 'lucide-react';
import { mapPasswordToFirebase } from '@/lib/auth-mapping';
import Footer from '@/components/footer';

interface StudentProfile {
  uid: string;
  name: string;
  email: string;
}

interface Diary {
  id: string;
  date: string;
  mood: string;
  praises: string;
  reflections: string;
  extraTitle: string;
  extraContent: string;
  createdAt?: string;
  studentName?: string;
}

const MOODS = [
  { emoji: '😊', label: '신남' },
  { emoji: '😄', label: '행복' },
  { emoji: '😐', label: '보통' },
  { emoji: '😢', label: '슬픔' },
  { emoji: '😡', label: '속상' },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  // Navigation state: 'view_students' or 'write_my_diary'
  const [activeTab, setActiveTab] = useState<'view_students' | 'write_my_diary'>('view_students');

  // Students list
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [selectedStudentDiaries, setSelectedStudentDiaries] = useState<Diary[]>([]);

  // Teacher's own diary form & list
  const [teacherDiaries, setTeacherDiaries] = useState<Diary[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('😊');
  const [praises, setPraises] = useState('');
  const [reflections, setReflections] = useState('');
  const [extraTitle, setExtraTitle] = useState('기타');
  const [extraContent, setExtraContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  // Edit Teacher Diary States
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
      } else if (profile && profile.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  // Load student list
  useEffect(() => {
    if (!user || (profile && profile.role !== 'admin')) return;

    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        const list: StudentProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            uid: doc.id, // doc.id를 사용하여 Auth UID 유실 문제를 100% 방지합니다.
            name: data.name || '학생',
            email: data.email || '',
          });
        });
        // Sort students by email (student1 -> student2 -> student3)
        list.sort((a, b) => a.email.localeCompare(b.email));
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudent(list[0]);
        }
      } catch (err) {
        console.error("Error fetching student profiles:", err);
      }
    };

    fetchStudents();
  }, [user, profile]);

  // Read selected student's diaries in real-time
  useEffect(() => {
    if (!selectedStudent) return;

    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', selectedStudent.uid)
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
      setSelectedStudentDiaries(list);
    }, (error) => {
      console.error("Error fetching student diaries:", error);
    });

    return () => unsubscribe();
  }, [selectedStudent]);

  // Read teacher's own diaries in real-time
  useEffect(() => {
    if (!user || activeTab !== 'write_my_diary') return;

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
      setTeacherDiaries(list);
    }, (error) => {
      console.error("Error fetching teacher diaries:", error);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  const handleSubmitTeacherDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!praises.trim() || !reflections.trim()) return;

    setIsSubmitting(true);
    setFormSuccess('');

    try {
      await addDoc(collection(db, 'diaries'), {
        userId: user.uid,
        studentName: profile?.name || '담임선생님',
        date,
        mood,
        praises,
        reflections,
        extraTitle: extraTitle.trim() || '기타',
        extraContent,
        createdAt: new Date().toISOString(),
      });

      setFormSuccess('오늘의 일기가 완성되었습니다! 🌟');
      setPraises('');
      setReflections('');
      setExtraContent('');
    } catch (err) {
      console.error("Error adding teacher diary:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Teacher Diary
  const handleDeleteDiary = async (id: string) => {
    if (!confirm('정말 이 일기를 삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, 'diaries', id));
    } catch (err) {
      console.error('Error deleting diary:', err);
      alert('일기 삭제에 실패했습니다.');
    }
  };

  // Start Edit Mode for Teacher
  const startEditDiary = (diary: Diary) => {
    setEditingDiary(diary);
    setEditDate(diary.date);
    setEditMood(diary.mood);
    setEditPraises(diary.praises);
    setEditReflections(diary.reflections);
    setEditExtraTitle(diary.extraTitle);
    setEditExtraContent(diary.extraContent);
  };

  // Submit Update for Teacher Diary
  const handleUpdateDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiary) return;
    if (!editPraises.trim() || !editReflections.trim()) return;

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
      }
    } catch (err: any) {
      console.error(err);
      setPwError('비밀번호 변경 실패: ' + err.message);
    } finally {
      setPwSubmitting(false);
    }
  };

  if (loading || !user || (profile && profile.role !== 'admin')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FAF6EE]">
        <div className="animate-pulse">
          <BookOpen className="w-16 h-16 text-[#FFB085] mb-2" />
        </div>
        <p className="text-xl font-bold text-[#8C7A6B]">대시보드 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF6EE]">
      {/* Main Container */}
      <div className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white rounded-3xl p-6 border-4 border-[#8C7A6B] shadow-md mb-8 transform rotate-[0.1deg]">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="bg-[#FFE3A8] p-2.5 rounded-2xl">
              <Heart className="w-8 h-8 text-[#FF8E53] fill-[#FF8E53]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#4A3E3D] tracking-tight">성장 일기 관리자 대시보드</h1>
              <p className="text-sm font-bold text-[#8C7A6B]">{profile?.name} 환영합니다</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switch Tab buttons */}
            <button
              onClick={() => setActiveTab('view_students')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold rounded-xl border-2 transition-all cursor-pointer ${
                activeTab === 'view_students'
                  ? 'bg-[#FF8E53] border-[#FF8E53] text-white'
                  : 'bg-white border-[#D2C5B4] text-[#8C7A6B] hover:bg-[#FAF6EE]'
              }`}
            >
              <User className="w-4 h-4" />
              학생 일기장 확인
            </button>
            <button
              onClick={() => setActiveTab('write_my_diary')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold rounded-xl border-2 transition-all cursor-pointer ${
                activeTab === 'write_my_diary'
                  ? 'bg-[#FF8E53] border-[#FF8E53] text-white'
                  : 'bg-white border-[#D2C5B4] text-[#8C7A6B] hover:bg-[#FAF6EE]'
              }`}
            >
              <PenTool className="w-4 h-4" />
              내 일기 작성
            </button>
            
            <button
              onClick={() => setIsPwModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white hover:bg-[#FAF6EE] text-[#8C7A6B] font-extrabold rounded-xl border-2 border-[#D2C5B4] transition-all ml-0 sm:ml-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              비밀번호 변경
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#FFEBEB] hover:bg-[#FDD8D8] text-[#D32F2F] font-extrabold rounded-xl border-2 border-[#FFD2D2] transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </header>

        {/* Main Layout Area */}
        {activeTab === 'view_students' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar student list */}
            <aside className="md:col-span-1 bg-white rounded-3xl border-4 border-[#8C7A6B] p-5 shadow-md transform rotate-[-0.2deg]">
              <h3 className="text-xl font-black text-[#4A3E3D] mb-4 pb-2 border-b-2 border-[#FAF6EE] flex items-center gap-1.5">
                <User className="w-5 h-5 text-[#FF8E53]" />
                우리 반 학생 목록
              </h3>
              
              {students.length === 0 ? (
                <p className="text-[#A49685] font-bold text-center py-6">등록된 학생이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {students.map((student) => (
                    <li key={student.uid}>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 font-bold text-left transition-all cursor-pointer ${
                          selectedStudent?.uid === student.uid
                            ? 'bg-[#FFE3A8] border-[#FF8E53] text-[#4A3E3D] scale-102'
                            : 'bg-[#FAF6EE] border-transparent text-[#8C7A6B] hover:bg-[#EADCC9]'
                        }`}
                      >
                        <span>{student.name} ({student.email.split('@')[0]})</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedStudent?.uid === student.uid ? 'transform translate-x-1 text-[#FF8E53]' : 'text-gray-400'}`} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            {/* Main content: Selected student's diary list */}
            <main className="md:col-span-3 space-y-6">
              {selectedStudent ? (
                <div>
                  <div className="bg-white rounded-3xl border-4 border-[#8C7A6B] p-6 shadow-md mb-6 transform rotate-[0.1deg]">
                    <h2 className="text-2xl font-black text-[#4A3E3D] flex items-center gap-2">
                      <BookOpen className="w-7 h-7 text-[#FF8E53]" />
                      <span>{selectedStudent.name} ({selectedStudent.email.split('@')[0]}) 학생의 일기장</span>
                      <span className="text-sm font-bold text-[#8C7A6B] bg-[#FAF6EE] px-3 py-1 rounded-xl">
                        총 {selectedStudentDiaries.length}개 일기 누적
                      </span>
                    </h2>
                  </div>

                  {selectedStudentDiaries.length === 0 ? (
                    <div className="bg-white border-4 border-dashed border-[#D2C5B4] rounded-3xl p-12 text-center">
                      <BookOpen className="w-12 h-12 text-[#A49685] mx-auto mb-3 animate-pulse" />
                      <p className="text-lg font-bold text-[#8C7A6B]">{selectedStudent.name} 학생이 쓴 일기가 아직 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedStudentDiaries.map((diary) => (
                        <div
                          key={diary.id}
                          className="bg-white rounded-3xl border-4 border-[#8C7A6B] p-6 shadow-md relative transform rotate-[-0.1deg]"
                        >
                          <div className="flex justify-between items-center border-b-2 border-[#FAF6EE] pb-3 mb-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl font-bold bg-[#FFE3A8] text-[#8C7A6B] px-3 py-1 rounded-xl">
                                {diary.date}
                              </span>
                              <span className="text-2xl" title="기분">
                                {diary.mood}
                              </span>
                            </div>
                          </div>

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
                </div>
              ) : (
                <div className="bg-white border-4 border-dashed border-[#D2C5B4] rounded-3xl p-12 text-center">
                  <p className="text-lg font-bold text-[#8C7A6B]">일기를 확인할 학생을 목록에서 선택하세요.</p>
                </div>
              )}
            </main>
          </div>
        ) : (
          /* Write My Diary Tab (Teacher's own diary mode) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Write diary form */}
            <main className="md:col-span-2 bg-white rounded-3xl border-4 border-[#8C7A6B] p-6 md:p-8 shadow-md relative transform rotate-[-0.2deg]">
              <div className="absolute top-0 bottom-0 left-8 border-l-2 border-dashed border-[#FFC8A2]"></div>
              
              <div className="pl-6 relative z-10">
                <h2 className="text-2xl font-black text-[#4A3E3D] mb-6 flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-[#FF8E53]" />
                  선생님 성장 일기 작성
                </h2>

                <form onSubmit={handleSubmitTeacherDiary} className="space-y-6">
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
                        className="w-full px-4 py-2.5 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] font-bold text-lg focus:outline-none"
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
                              mood === m.emoji ? 'bg-[#FF8E53] scale-110 shadow-md text-white' : 'hover:bg-[#EADCC9]'
                            }`}
                          >
                            {m.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-[#4A3E3D] mb-2">👏 오늘 내가 잘한 점</label>
                    <textarea
                      rows={3}
                      value={praises}
                      onChange={(e) => setPraises(e.target.value)}
                      placeholder="잘한 점을 적어주세요."
                      className="w-full px-4 py-3 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] placeholder-[#A49685] font-bold text-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-[#4A3E3D] mb-2">✍️ 오늘 내가 반성할 점</label>
                    <textarea
                      rows={3}
                      value={reflections}
                      onChange={(e) => setReflections(e.target.value)}
                      placeholder="반성할 점을 적어주세요."
                      className="w-full px-4 py-3 border-3 border-[#D2C5B4] rounded-2xl bg-[#FAF6EE] text-[#4A3E3D] placeholder-[#A49685] font-bold text-lg focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#FFFCEB] p-4 rounded-2xl border-3 border-[#FFD98E] space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#D06F00]">💡 자유 항목:</span>
                      <input
                        type="text"
                        value={extraTitle}
                        onChange={(e) => setExtraTitle(e.target.value)}
                        placeholder="항목명"
                        className="px-3 py-1 border-2 border-[#FFD98E] rounded-xl bg-white text-[#4A3E3D] font-bold focus:outline-none"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={extraContent}
                      onChange={(e) => setExtraContent(e.target.value)}
                      placeholder="내용 입력"
                      className="w-full px-4 py-2.5 border-2 border-[#FFD98E] rounded-xl bg-white text-[#4A3E3D] font-bold focus:outline-none"
                    />
                  </div>

                  {formSuccess && (
                    <p className="p-3 bg-green-50 border border-green-200 text-green-700 font-bold rounded-2xl text-center">
                      {formSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-extrabold text-xl rounded-2xl shadow-md border-b-4 border-[#C85D25] active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
                  >
                    {isSubmitting ? '저장 중...' : '일기장 제출하기 📔'}
                  </button>
                </form>
              </div>
            </main>

            {/* Teacher's previous diaries */}
            <aside className="md:col-span-1 space-y-6">
              <h3 className="text-xl font-black text-[#4A3E3D] flex items-center gap-2 pl-2">
                <BookOpen className="w-5 h-5 text-[#FF8E53]" />
                선생님의 일기 기록 ({teacherDiaries.length}개)
              </h3>
              
              {teacherDiaries.length === 0 ? (
                <p className="text-[#8C7A6B] font-bold pl-2">작성한 일기가 아직 없습니다.</p>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
                  {teacherDiaries.map((diary) => (
                    <div key={diary.id} className="bg-white rounded-2xl border-3 border-[#8C7A6B] p-4 shadow-sm relative">
                      <div className="flex justify-between items-center border-b border-[#FAF6EE] pb-2 mb-2">
                        <span className="text-sm font-bold bg-[#FFE3A8] text-[#8C7A6B] px-2 py-0.5 rounded-lg">{diary.date}</span>
                        <div className="flex items-center gap-1 z-20">
                          <span className="mr-1">{diary.mood}</span>
                          <button
                            onClick={() => startEditDiary(diary)}
                            className="p-1 hover:bg-[#FFE3A8] rounded text-gray-500 hover:text-[#4A3E3D] transition-colors cursor-pointer"
                            title="수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDiary(diary.id)}
                            className="p-1 hover:bg-[#FFEBEB] rounded text-gray-400 hover:text-[#D32F2F] transition-colors cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p><span className="text-xs font-bold text-[#FF8E53]">👏 잘한 점:</span> {diary.praises}</p>
                        <p><span className="text-xs font-bold text-[#8C7A6B]">✍️ 반성:</span> {diary.reflections}</p>
                        {diary.extraContent && (
                          <p className="text-xs bg-[#FFFCEB] p-1.5 rounded-md border border-[#FFD98E]">
                            <span className="font-bold text-[#D06F00]">{diary.extraTitle}:</span> {diary.extraContent}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {/* Edit Teacher Diary Modal */}
      {editingDiary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border-4 border-[#8C7A6B] w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-4 flex items-center gap-2 border-b-2 border-[#FAF6EE] pb-2">
              <Edit3 className="w-6 h-6 text-[#FF8E53]" />
              내 일기 수정하기
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
                <label className="block text-sm font-bold text-[#8C7A6B] mb-1">✍️ 오늘 내가 반성할 점</label>
                <textarea
                  rows={3}
                  value={editReflections}
                  onChange={(e) => setEditReflections(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#D2C5B4] rounded-xl bg-[#FAF6EE] text-[#4A3E3D] font-bold"
                />
              </div>

              <div className="bg-[#FFFCEB] p-3 rounded-xl border-2 border-[#FFD98E] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#D06F00]">💡 자유 항목:</span>
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
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-bold rounded-xl border-b-2 border-[#C85D25] cursor-pointer"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border-4 border-[#8C7A6B] w-full max-w-sm p-6 shadow-2xl">
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

              {pwError && <p className="text-sm font-bold text-[#D32F2F]">{pwError}</p>}
              {pwSuccess && <p className="text-sm font-bold text-green-600">{pwSuccess}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPwModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={pwSubmitting}
                  className="flex-1 py-2.5 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-bold rounded-xl border-b-2 border-[#C85D25] cursor-pointer"
                >
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
