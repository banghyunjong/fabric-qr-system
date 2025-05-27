import React from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from './QrScanner';
import './HomePage.css'; // CSS 파일도 생성

const HomePage = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout(); // App.js의 로그아웃 함수 호출
    navigate('/login'); // 로그인 페이지로 리다이렉트
  };

  return (
    <div className="home-container">
      <h2>메인 페이지</h2>
      <p>환영합니다! 이제 여기서 QR 스캐너를 사용하실 수 있습니다.</p>
      {/* 여기에 QR 스캐너 컴포넌트가 들어갈 예정 */}
      <QrScanner />
      <button className="logout-button" onClick={handleLogout}>로그아웃</button>
    </div>
  );
};

export default HomePage;