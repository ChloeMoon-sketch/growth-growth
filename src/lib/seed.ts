import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const SEED_USERS = [
  { email: 'admin@growth.com', password: '123456', name: '담임 선생님', role: 'admin' },
  { email: 'student1@growth.com', password: 'student1', name: '학생 1', role: 'student' },
  { email: 'student2@growth.com', password: 'student2', name: '학생 2', role: 'student' },
  { email: 'student3@growth.com', password: 'student3', name: '학생 3', role: 'student' },
];

export async function seedInitialUsers() {
  let createdCount = 0;
  let errorMessages: string[] = [];

  for (const user of SEED_USERS) {
    try {
      // 1. Firebase Auth에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const authUser = userCredential.user;

      // 2. Firestore에 사용자 추가 정보 저장
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: new Date().toISOString(),
      });
      createdCount++;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // 이미 생성된 경우 정상 처리로 봄
        continue;
      }
      errorMessages.push(`${user.email}: ${error.message}`);
    }
  }

  // 생성 작업 중 로그인이 되어 있을 수 있으므로 로그아웃 처리
  await signOut(auth);

  if (errorMessages.length > 0) {
    return { success: false, createdCount, errors: errorMessages };
  }
  return { success: true, createdCount };
}
