import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import './App.css'; // App.css가 없다면 만들어주세요.

function App() {
  // 실제 애플리케이션에서는 사용자 인증 상태를 여기에 관리해야 합니다.
  // 예를 들어, useState와 localStorage를 사용하여 로그인 상태를 유지합니다.
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // 임시로 로그인 처리 함수
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // 실제 앱에서는 JWT 토큰 등을 localStorage에 저장하고 유효성 검사
    localStorage.setItem('isLoggedIn', 'true');
  };

  // 임시로 로그아웃 처리 함수
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isLoggedIn');
  };

  React.useEffect(() => {
    // 앱 로드 시 localStorage에서 로그인 상태 확인
    if (localStorage.getItem('isLoggedIn') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);


  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 로그인 페이지 */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          {/* 메인 페이지 (로그인 필요) */}
          <Route
            path="/home"
            element={isAuthenticated ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          {/* 기본 경로 설정: 로그인 상태에 따라 리다이렉트 */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;