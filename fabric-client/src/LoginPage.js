import React, { useEffect, useRef } from 'react';
import './LoginPage.css'; // CSS 파일도 생성
import axios from 'axios'; // axios 임포트 추가

const LoginPage = ({ onLoginSuccess }) => { //
  const googleButtonRef = useRef(null); //
  const clientId = "536017883873-a4aciifo1t8dat4cdi1vs8tkpkhjfug5.apps.googleusercontent.com"; // <<--- 여기에 발급받은 클라이언트 ID 입력!
  // 백엔드 API의 Vercel 배포 URL (fabric-client의 환경변수에서 가져오거나, 직접 설정)
  // 환경변수로 관리하는 것이 좋습니다. 예: process.env.REACT_APP_API_URL 또는 process.env.EXPO_PUBLIC_API_URL 등
  const API_URL = "https://fabric-qr-api.vercel.app"; // <<-- 여기에 실제 백엔드 Vercel URL 입력!

  useEffect(() => { //
    // Google Identity Services 스크립트 로드
    const script = document.createElement('script'); //
    script.src = 'https://accounts.google.com/gsi/client'; //
    script.async = true; //
    script.defer = true; //
    document.body.appendChild(script); //

    script.onload = () => { 
      if (window.google) { 
        window.google.accounts.id.initialize({ 
          client_id: clientId, //
          callback: async (response) => { // async 키워드 추가
            // Google 로그인 성공 시 콜백
            console.log("Credential response:", response); 

            if (response.credential) {
              try {
                // ID 토큰 디코딩하여 사용자 정보 추출
                // 현재 백엔드 API가 googleId, email, name을 req.body로 받으므로 클라이언트에서 추출
                const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
                const googleId = decodedToken.sub; // Google User ID (sub 클레임)
                const email = decodedToken.email;
                const name = decodedToken.name;

                // 백엔드(fabric-qr-api)의 /auth/google-login 엔드포인트로 사용자 정보 전송
                const res = await axios.post(`${API_URL}/auth/google-login`, {
                  googleId,
                  email,
                  name,
                });

                // 백엔드로부터 받은 토큰과 사용자 정보를 저장
                // 모바일 앱 (React Native)에서는 localStorage 대신 AsyncStorage 등을 사용할 수 있습니다.
                // 웹 기반 클라이언트라면 localStorage 사용
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));

                console.log('Backend response after Google login:', res.data);

                // 로그인 성공 처리
                onLoginSuccess(); 

              } catch (error) {
                console.error('백엔드 구글 로그인 처리 중 오류 발생:', error);
                // 사용자에게 오류 메시지 표시
                alert('로그인 처리 중 오류가 발생했습니다.');
              }
            } else {
              console.error('구글 credential이 없습니다.');
              alert('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
            }
          }
        });

        // Google One Tap 또는 맞춤형 버튼 사용
        window.google.accounts.id.renderButton( 
          googleButtonRef.current, //
          {
            type: "standard", // 'standard' 또는 'icon'
            size: "large", //
            text: "signin_with", // 'signin_with', 'signup_with', 'continue_with', 'signin'
            shape: "rectangular", // 'rectangular', 'square', 'circle'
            theme: "outline" // 'outline', 'filled_blue', 'filled_black'
          }
        );

        // 자동 로그인 (One Tap) 시도 - 필요시 주석 해제
        // window.google.accounts.id.prompt(); //
      }
    };

    return () => { 
      // 컴포넌트 언마운트 시 스크립트 제거 (선택 사항)
      if (script.parentNode) { 
        script.parentNode.removeChild(script); //
      }
    };
  }, [onLoginSuccess, clientId, API_URL]); // API_URL을 의존성 배열에 추가


  return ( 
    <div className="login-container"> 
      <h2>로그인</h2> 
      <p>소재 QR 조회 시스템에 오신 것을 환영합니다.</p> 
      <div ref={googleButtonRef} className="google-login-button"></div> 
      {/* <button onClick={() => alert('다른 로그인 방법 준비중...')}>다른 로그인</button> */} {/* */}
    </div>
  );
};

export default LoginPage; //