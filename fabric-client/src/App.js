import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import QrScanner from './QrScanner'; // QR 스캔 페이지 컴포넌트 임포트 (경로 확인 필요)
import './App.css'; 

function App() {
  // 실제 애플리케이션에서는 사용자 인증 상태를 여기에 관리해야 합니다.
  // 예를 들어, useState와 localStorage를 사용하여 로그인 상태를 유지합니다.
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태
  const [hasQrScanPermission, setHasQrScanPermission] = useState(false); // QR 스캔 권한 상태
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const handleLoginSuccess = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        // 로그인 시 백엔드로부터 받은 권한으로 상태 업데이트
        setHasQrScanPermission(userData.canScanQr);
        // 여기서 QR 스캔 페이지로 자동 이동하지 않고, 아래 라우팅 로직에 맡김
        console.log("App.js handleLoginSuccess: Updated states. isLoggedIn:", true, "hasQrScanPermission:", userData.canScanQr);
        // 상태가 업데이트되면 App 컴포넌트가 리렌더링되고, 라우팅 로직이 재평가됩니다.
      } catch (e) {
        console.error("Failed to parse user data after login success:", e);
      }
    }
  };

  // QR 스캔 권한 없을 때 처리 함수 (LoginPage에서 호출됨)
  const handleNoQrPermission = () => {
    console.log("QR 스캔 권한이 없습니다. 로그인 페이지로 돌아갑니다.");
    setIsLoggedIn(false); // 로그인 상태 초기화
    setHasQrScanPermission(false); // 권한 상태 초기화
    localStorage.removeItem('token'); // 저장된 토큰 제거
    localStorage.removeItem('user'); // 저장된 사용자 정보 제거
    // <Navigate to="/login" replace /> 가 자동으로 처리하므로 별도의 강제 리다이렉션 코드는 필요 없음
  };

  // 임시로 로그아웃 처리 함수 (기존 유지)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setHasQrScanPermission(false); // 로그아웃 시 권한도 초기화
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // user 정보도 삭제
    localStorage.removeItem('isLoggedIn'); // 기존 isLoggedIn도 삭제 (필요없다면 제거)
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user'); // user 정보도 가져옴
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        // localStorage에 저장된 user 정보에서 canScanQr 값을 가져와 상태에 설정
        setHasQrScanPermission(userData.canScanQr);
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        // 파싱 오류 시 로그인 상태 초기화
        setIsLoggedIn(false);
        setHasQrScanPermission(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // QR 스캔 페이지 접근을 위한 PrivateRoute 컴포넌트
  const PrivateRoute = ({ children }) => {
    // 현재 isLoggedIn과 hasQrScanPermission 상태를 기반으로 접근 허용/차단
    // useEffect에서 localStorage를 통해 초기화되므로, 이 상태가 최신 상태를 반영
    if (isLoggedIn && hasQrScanPermission) {
      return children;
    }
    // 권한이 없거나 로그인되지 않았으면 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  };

  return (
    <Router>
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={
            (isLoggedIn && hasQrScanPermission) ? (
              // 로그인 상태이고 QR 스캔 권한이 있으면 QR 스캔 페이지로 이동
              console.log("Route /login 조건: true. /qr-scan으로 리다이렉트 시도."),
              <Navigate to="/qr-scan" replace />
            ) : (
              // 그렇지 않으면 로그인 페이지 렌더링
              console.log("Route /login 조건: false. LoginPage 렌더링."),
              <LoginPage onLoginSuccess={handleLoginSuccess} onNoPermission={handleNoQrPermission} />
            )
          }
        />
        <Route
          path="/qr-scan"
          element={
            <PrivateRoute>
              <QrScanner onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            (isLoggedIn && hasQrScanPermission) ? (
              // 로그인 상태이고 QR 스캔 권한이 있으면 QR 스캔으로 이동
              console.log("Route / 조건: true. /qr-scan으로 리다이렉트 시도."),
              <Navigate to="/qr-scan" replace />
            ) : (
              // 그렇지 않으면 로그인 페이지로 이동
              console.log("Route / 조건: false. /login으로 리다이렉트 시도."),
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  </Router>
  );
}

export default App;