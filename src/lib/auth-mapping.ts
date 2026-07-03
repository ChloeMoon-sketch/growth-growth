/**
 * Firebase Auth는 이메일 형식의 아이디와 6자리 이상의 비밀번호를 요구합니다.
 * 이를 PRD의 요구사항(단순 아이디, 4자리 비밀번호 등)에 맞추기 위한 변환 유틸리티입니다.
 */

export function mapIdToEmail(id: string): string {
  const trimmed = id.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // 단순 아이디(예: admin, student1) 뒤에 가상의 도메인을 붙여 이메일 형태로 변환
  return `${trimmed}@growth.com`;
}

export function mapPasswordToFirebase(password: string): string {
  // 사용자가 입력한 패스워드가 Firebase의 6자리 제한에 걸리지 않도록 
  // 뒤에 고정 패딩을 붙여서 6자리 이상으로 보장합니다.
  return `${password}_growth_secure`;
}
