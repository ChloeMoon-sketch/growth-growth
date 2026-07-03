'use client';

import React, { useState } from 'react';
import { X, Shield, FileText, User } from 'lucide-react';

export default function Footer() {
  const [modalType, setModalType] = useState<'none' | 'terms' | 'privacy'>('none');

  return (
    <footer className="w-full mt-auto py-8 px-4 border-t-2 border-[#EADCC9] bg-[#FAF6EE] text-center text-sm font-bold text-[#8C7A6B]">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Links */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setModalType('terms')}
            className="hover:text-[#4A3E3D] underline cursor-pointer transition-colors"
          >
            이용약관
          </button>
          <span className="text-[#D2C5B4]">|</span>
          <button
            onClick={() => setModalType('privacy')}
            className="hover:text-[#4A3E3D] underline cursor-pointer transition-colors"
          >
            개인정보처리방침
          </button>
        </div>

        {/* Manager & Copyright */}
        <div className="text-center sm:text-right space-y-1">
          <p className="flex items-center justify-center sm:justify-end gap-1 text-xs">
            <User className="w-3.5 h-3.5" />
            <span>정보관리책임자: 교사 문정원 (서울사대부고)</span>
          </p>
          <p className="text-xs text-[#A49685]">© 2026 성장 일기. All rights reserved.</p>
        </div>
      </div>

      {/* Policy Modal */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border-4 border-[#8C7A6B] w-full max-w-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col transform rotate-[-0.2deg]">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b-3 border-[#FAF6EE] pb-3 mb-4 flex-shrink-0">
              <h3 className="text-2xl font-black text-[#4A3E3D] flex items-center gap-2">
                {modalType === 'terms' ? (
                  <>
                    <FileText className="w-6 h-6 text-[#FF8E53]" />
                    <span>이용약관</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6 text-[#FF8E53]" />
                    <span>개인정보처리방침</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setModalType('none')}
                className="p-1.5 hover:bg-gray-150 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-2 text-left font-bold text-[#4A3E3D] space-y-4 text-base leading-relaxed scrollbar-thin">
              {modalType === 'terms' ? (
                <>
                  <p className="text-[#8C7A6B]">본 이용약관은 성장 일기(이하 '본 서비스')이 제공하는 교육용 웹 애플리케이션 서비스의 이용에 관한 사항을 규정합니다.</p>
                  
                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제1조 (목적)</h4>
                  <p>이 약관은 본 서비스가 제공하는 무료 교육용 웹 애플리케이션 서비스(이하 '서비스')를 이용함에 있어 서비스 제공자와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                  
                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제2조 (정의)</h4>
                  <p className="pl-2">
                    • <strong>'서비스'</strong>란 학생들이 학교생활에 대해 성찰 일기를 쓰고 교사와 공유할 수 있도록 본 플랫폼에서 제공하는 웹 애플리케이션을 말합니다.<br />
                    • <strong>'이용자'</strong>란 본 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.<br />
                    • <strong>'회원'</strong>이란 본 서비스에 회원등록을 한 자로서, 학생 및 담임교사를 포함하여 서비스를 이용할 수 있는 자를 말합니다.
                  </p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제3조 (약관의 명시와 개정)</h4>
                  <p>1. 본 서비스는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br />
                     2. 본 서비스는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제4조 (서비스의 제공)</h4>
                  <p>1. 본 서비스는 교육 목적의 무료 일기장 웹 애플리케이션을 제공합니다.<br />
                     2. 서비스의 이용은 무료이며, 별도의 유료 결제가 필요하지 않습니다.<br />
                     3. 본 서비스는 학급 성찰 활동 및 학생들의 자기주도 성장을 목적으로 하며, 상업적 목적으로 운영되지 않습니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제5조 (서비스의 중단)</h4>
                  <p>1. 본 서비스는 시스템 점검, 교체 및 고장, 통신 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.<br />
                     2. 본 서비스는 무료로 제공되는 교육용 서비스이므로, 서비스 중단으로 인한 별도의 보상은 제공되지 않습니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제6조 (회원가입)</h4>
                  <p>1. 이용자는 서비스가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의함으로써 회원가입을 신청합니다.<br />
                     2. 만 14세 미만의 아동은 학교 가정통신문 등을 통해 보호자(법정대리인)의 동의를 받은 후 서비스를 이용할 수 있습니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제7조 (회원 탈퇴 및 데이터 관리)</h4>
                  <p>1. 회원은 본 서비스에 언제든지 탈퇴를 요청할 수 있으며, 서비스는 즉시 회원탈퇴를 처리합니다.<br />
                     2. 회원이 작성한 일기 데이터는 본인의 의사에 따라 언제든지 수정 및 삭제가 가능하며, 회원 탈퇴 시 모든 기록은 지체 없이 영구 파기됩니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제8조 (이용자의 의무)</h4>
                  <p className="pl-2">이용자는 다음 행위를 하여서는 안 됩니다.<br />
                     • 허위 내용의 등록<br />
                     • 타인의 정보 도용 (타 학생 또는 교사 계정의 도용)<br />
                     • 서비스에 게시된 정보의 무단 변경<br />
                     • 서비스의 운영을 방해하거나 부정한 방법으로 데이터를 변경하는 행위<br />
                     • 타인의 명예를 손상시키거나 학급 분위기를 해치는 정보를 일기 및 기타 항목에 게시하는 행위</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제9조 (저작권)</h4>
                  <p>1. 본 서비스가 작성한 저작물에 대한 저작권은 서비스 제공자(개발자 문정원)에게 귀속합니다.<br />
                     2. 이용자가 작성한 일기의 저작권은 작성한 학생 본인에게 있으며, 학급 지도를 위해 등록된 담임교사와 일기 내용을 공유하는 것에 동의한 것으로 간주합니다.<br />
                     3. 이용자는 서비스를 이용하여 얻은 정보를 서비스 제공자의 사전 승낙 없이 복제, 송신, 출판, 배포하여서는 안 됩니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제10조 (면책조항)</h4>
                  <p>1. 본 서비스는 무료로 제공되는 교육용 서비스로서, 서비스 이용 중 발생하는 기술적 문제나 일시적인 데이터 손실에 대해 제한적 책임을 집니다.<br />
                     2. 본 서비스의 데이터 저장을 위해 연동하는 외부 클라우드(Firebase 등)의 기술적 장애에 대한 책임은 해당 제공업체의 약관에 따릅니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제11조 (분쟁해결)</h4>
                  <p>본 서비스와 이용자 간에 발생한 분쟁에 관하여는 대한민국 법을 적용하며, 소송이 제기되는 경우 서비스 제공자의 소재지(서울사대부고)를 관할하는 법원을 관할법원으로 합니다.</p>

                  <p className="text-xs text-[#8C7A6B] mt-6">부칙: 이 약관은 2026년 6월 27일부터 시행됩니다.</p>
                </>
              ) : (
                <>
                  <p className="text-[#8C7A6B]">성장 일기(이하 '본 서비스')은(는) 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제1조 (개인정보의 처리 목적)</h4>
                  <p>본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다.<br />
                     • <strong>학생 회원 가입 및 관리</strong>: 학급 구성원 식별, 학생별 성장 기록 누적 보관 및 관리, 담임 선생님과의 일기 공유<br />
                     • <strong>서비스 제공</strong>: 일기 작성 및 목록 조회, 작성된 일기 수정 및 삭제 기능 제공, 담임교사용 일기 모니터링 대시보드 운영</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제2조 (개인정보의 처리 및 보유기간)</h4>
                  <p>1. 본 서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
                     2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.<br />
                     • <strong>보유 기간</strong>: 해당 학년도 종료 시(익년 2월 말) 또는 학생의 졸업/진급 시까지<br />
                     • <strong>파기 시점</strong>: 보유 기간 종료 후 지체 없이(5일 이내) 파기</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제3조 (처리하는 개인정보 항목)</h4>
                  <p>본 서비스는 학생의 성찰 활동과 학급 지도를 지원하기 위해 필요한 최소한의 개인정보만을 수집합니다.<br />
                     • <strong>수집 항목</strong>: 아이디, 비밀번호, 이름(또는 닉네임), 작성된 성장 일기 데이터(날짜, 기분, 잘한 점, 반성할 점, 나만의 자유 항목 내용)<br />
                     • <strong>수집하지 않는 항목</strong>: 주민등록번호, 주소, 전화번호, 이메일 등 불필요한 민감 정보</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)</h4>
                  <p>1. 본 서비스는 만 14세 미만 아동의 개인정보를 처리하기 위하여 가입 단계 또는 학기 초 학교 가정통신문(개인정보 수집·이용 동의서)을 통하여 법정대리인의 동의를 받습니다.<br />
                     2. 법정대리인이 동의하지 않는 경우, 해당 아동은 서비스 가입 및 이용이 제한될 수 있습니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제5조 (개인정보의 파기 절차 및 방법)</h4>
                  <p>1. 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.<br />
                     2. <strong>파기 방법</strong>: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기(DB 영구 삭제)하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제6조 (개인정보의 안전성 확보조치)</h4>
                  <p>• <strong>비밀번호 암호화</strong>: 이용자의 비밀번호는 일방향 암호화(Hash) 또는 안전한 인증 보안 시스템을 통해 저장 및 관리되며, 개발자나 담임 선생님도 원본 비밀번호를 조회할 수 없습니다.<br />
                     • <strong>기술적 대책</strong>: 보안 인증을 획득한 전문 클라우드 및 Firebase 플랫폼을 기반으로 운영되며, 전 구간 보안 통신(HTTPS)을 사용하여 데이터를 암호화하여 전송합니다.<br />
                     • <strong>개인정보 취급 직원의 최소화</strong>: 개인정보를 처리하는 담당자를 개발 교사 1인으로 지정하여 접근 권한을 관리합니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h4>
                  <p>1. 정보주체(학생) 및 법정대리인은 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.<br />
                     2. 권리 행사는 서비스 내 [일기 삭제] 및 [회원탈퇴] 기능을 통하여 즉시 가능하며, 또는 개발 교사에게 구두나 서면으로 요청하면 지체 없이 조치하겠습니다.</p>

                  <h4 className="text-lg font-black border-l-4 border-[#FF8E53] pl-2 mt-4 text-[#4A3E3D]">제8조 (개인정보 보호책임자)</h4>
                  <p>본 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.<br />
                     • <strong>성명</strong>: 문정원 (개발자)<br />
                     • <strong>소속</strong>: 서울사대부고<br />
                     • <strong>직위</strong>: 교사<br />
                     • <strong>연락처</strong>: 학교 교무실 (※ 개인정보보호를 위해 교사의 개인 휴대전화 번호는 기재하지 않습니다.)</p>

                  <p className="text-xs text-[#8C7A6B] mt-6">부칙: 이 개인정보 처리방침은 2026년 6월 27일부터 적용됩니다.</p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t-3 border-[#FAF6EE] flex justify-end flex-shrink-0">
              <button
                onClick={() => setModalType('none')}
                className="px-6 py-2 bg-[#FF8E53] hover:bg-[#FF742E] text-white font-bold rounded-xl border-b-2 border-[#C85D25] active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
