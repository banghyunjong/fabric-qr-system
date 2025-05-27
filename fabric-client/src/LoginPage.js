import React, { useEffect, useRef } from 'react';
import './LoginPage.css'; // CSS 파일도 생성

const LoginPage = ({ onLoginSuccess }) => {
  const googleButtonRef = useRef(null);
  const clientId = "536017883873-a4aciifo1t8dat4cdi1vs8tkpkhjfug5.apps.googleusercontent.com"; // <<--- 여기에 발급받은 클라이언트 ID 입력!

  useEffect(() => {
    // Google Identity Services 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            // Google 로그인 성공 시 콜백
            console.log("Credential response:", response);
            // 실제 앱에서는 response.credential (ID 토큰)을 서버로 보내 유효성을 검사합니다.
            // 여기서는 간단히 로그인 성공 처리만 합니다.
            onLoginSuccess();
          }
        });

        // Google One Tap 또는 맞춤형 버튼 사용
        // One Tap은 모바일에서 유용하지만, 여기서는 데스크톱에서도 작동하는 버튼으로
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: "standard", // 'standard' 또는 'icon'
            size: "large",
            text: "signin_with", // 'signin_with', 'signup_with', 'continue_with', 'signin'
            shape: "rectangular", // 'rectangular', 'square', 'circle'
            theme: "outline" // 'outline', 'filled_blue', 'filled_black'
          }
        );

        // 자동 로그인 (One Tap) 시도 - 필요시 주석 해제
        // window.google.accounts.id.prompt();
      }
    };

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (선택 사항)
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onLoginSuccess, clientId]);


  return (
    <div className="login-container">
      <h2>로그인</h2>
      <p>소재 QR 조회 시스템에 오신 것을 환영합니다.</p>
      <div ref={googleButtonRef} className="google-login-button"></div>
      {/* <button onClick={() => alert('다른 로그인 방법 준비중...')}>다른 로그인</button> */}
    </div>
  );
};

export default LoginPage;