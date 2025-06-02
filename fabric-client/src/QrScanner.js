import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import './QrScanner.css';

const QrScanner = ({ onLogout }) => {
    const qrCodeScannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);
    const [scannedResult, setScannedResult] = useState('');
    const [manualQrCodeId, setManualQrCodeId] = useState('');
    const [materialInfo, setMaterialInfo] = useState(null);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const fetchMaterialInfo = async (qrCodeId) => {
        setMaterialInfo(null);
        setError(null);
        try {
            const serverBaseUrl = process.env.REACT_APP_SERVER_BASE_URL; // Vercel 환경 변수 사용
            console.log("Server Base URL:", serverBaseUrl); //
            const response = await axios.get(`${serverBaseUrl}/materials/${qrCodeId}`);
            setMaterialInfo(response.data);
            console.log("소재 정보:", response.data);
        } catch (err) {
            console.error("소재 정보를 가져오는 중 오류 발생:", err);
            if (err.response && err.response.status === 404) {
                setError("해당 QR 코드에 대한 소재 정보를 찾을 수 없습니다.");
            } else {
                setError("소재 정보를 가져오는 데 실패했습니다. 서버에 문제가 있을 수 있습니다.");
            }
        }
    };

    const handleManualSearch = () => {
        if (manualQrCodeId) {
            setScannedResult(manualQrCodeId);
            stopScanner();
            fetchMaterialInfo(manualQrCodeId);
        } else {
            setError("QR 코드 ID를 입력해주세요.");
        }
    };

    const startScanner = async () => {
        if (!qrCodeScannerRef.current) {
            console.log("QR 스캐너 DOM 요소가 없습니다.");
            return;
        }

        setIsScanning(true);
        setError(null);

        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop();
            } catch (e) {
                console.warn("Failed to stop existing scanner:", e);
            }
            html5QrcodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(qrCodeScannerRef.current.id);
        html5QrcodeRef.current = html5QrCode;

        // 카메라 설정 (UI 관련 옵션 제거, core logic만 남김)
        const qrboxConfig = { width: 250, height: 250 };

        try {
            // 사용 가능한 카메라 목록 가져오기
            const cameras = await Html5Qrcode.getCameras();
            let cameraId = null;

            if (cameras && cameras.length > 0) {
                console.log("Available cameras:", cameras); // 디버깅용 로그

                // 후면 카메라 (environment)를 우선적으로 찾기
                // label에 'back', 'environment', 'rear' 등 키워드 포함 여부 확인
                const rearCamera = cameras.find(camera =>
                    camera.label.toLowerCase().includes('back') ||
                    camera.label.toLowerCase().includes('environment') ||
                    camera.label.toLowerCase().includes('rear')
                );

                if (rearCamera) {
                    cameraId = rearCamera.id;
                    console.log("Selected rear camera ID:", cameraId, "Label:", rearCamera.label);
                } else {
                    // 후면 카메라를 명확히 찾지 못하면, 첫 번째 카메라 사용 (모바일에서 첫 번째가 후면일 가능성 높음)
                    cameraId = cameras[0].id;
                    console.warn("Rear camera not explicitly found, using first available camera ID:", cameraId, "Label:", cameras[0].label);
                }

                // 스캐너 시작
                // videoConstraints를 start() 메서드의 첫 번째 인자로 직접 전달
                // 이 방법이 facingMode를 가장 효과적으로 적용합니다.
                await html5QrCode.start(
                    { facingMode: { exact: "environment" } }, // 특정 카메라 ID 강제 (exact 사용)
                    // 또는 { facingMode: { exact: "environment" } } 를 사용해도 됨
                    // 혹은 카메라 ID를 찾지 못할 경우의 폴백으로 { facingMode: "environment" }
                    // 현재는 찾은 cameraId를 exact로 강제하는 것이 가장 확실
                    {
                        fps: 10,
                        qrbox: qrboxConfig,
                        aspectRatio: 1.0,
                        disableFlip: false,
                        // Html5QrcodeScanner에만 유효한 UI 관련 옵션은 제거
                        // showTorchButtonIfSupported: false,
                        // showZoomSliderIfSupported: false,
                        // defaultZoomValueIfSupported: 2,
                        // showCameraSelectionUI: false
                    },
                    (decodedText) => {
                        console.log(`QR 코드 스캔 성공: ${decodedText}`);
                        setScannedResult(decodedText);
                        stopScanner();
                        fetchMaterialInfo(decodedText);
                    },
                    (errorMessage) => {
                        // 스캔 실패 메시지는 계속 스캔 중이므로 콘솔에만 출력
                        // console.warn(`QR 코드 스캔 실패: ${errorMessage}`);
                    }
                );
                setIsScanning(true);
            } else {
                setError("사용 가능한 카메라가 없습니다.");
                setIsScanning(false);
            }
        } catch (err) {
            console.error("스캐너 시작 실패:", err);
            setError("카메라를 시작할 수 없습니다. 카메라 권한을 확인해주세요.");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop();
                html5QrcodeRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error("스캐너 중지 실패:", err);
            }
        }
    };

    useEffect(() => {
        // 컴포넌트 마운트 시 스캐너 시작
        // 스캔 결과가 없거나 수동 입력 중이 아닐 때만 스캐너 시작
        if (!scannedResult && !manualQrCodeId) {
            startScanner();
        }

        // 컴포넌트 언마운트 시 스캐너 중지
        return () => {
            stopScanner();
        };
    }, [scannedResult, manualQrCodeId]); // 의존성 배열에 startScanner를 넣으면 무한 루프 가능성

    const handleRescan = () => {
        setScannedResult('');
        setMaterialInfo(null);
        setError(null);
        setManualQrCodeId(''); // 재스캔 시 수동 입력값 초기화
        startScanner(); // 스캐너 다시 시작
    };

    return (
        <div className="qr-scanner-container">
            <h3>QR 코드 스캔</h3>
            <p>카메라를 QR 코드에 비춰주세요.</p>

            {/* QR 스캐너가 렌더링될 div */}
            {/* 스캔 결과가 없을 때만 스캐너 영역 표시 */}
            {!scannedResult && (
                <>
                    <div id="reader" ref={qrCodeScannerRef} style={{ width: "100%", maxWidth: "400px", margin: "auto" }}></div>
                    {isScanning && !error && <p className="scanning-message">QR 코드 스캔 중...</p>}
                    {!isScanning && error && <p className="error-message">{error}</p>}
                    {!isScanning && !error && !manualQrCodeId && <p>카메라가 시작되지 않았거나, 권한을 허용해야 합니다.</p>}

                    <div className="manual-input-section">
                        <h4>또는 QR 코드 ID 직접 입력</h4>
                        <input
                            type="text"
                            placeholder="QR 코드 ID 입력 (예: FABRIC-ABC-001)"
                            value={manualQrCodeId}
                            onChange={(e) => {
                                setManualQrCodeId(e.target.value);
                                setError(null);
                                // 수동 입력 시작 시 스캐너 중지
                                if (html5QrcodeRef.current && isScanning) {
                                    stopScanner(); // stopScanner 함수 호출
                                }
                            }}
                            className="qr-input-field"
                        />
                        <button onClick={handleManualSearch} className="search-button">
                            조회
                        </button>
                    </div>
                </>
            )}

            {scannedResult && (
                <div className="scan-result-box">
                    <p><strong>스캔된 QR 코드:</strong> {scannedResult}</p>
                    {materialInfo ? (
                        <div className="material-info-box">
                            <h4>소재 정보:</h4>
                            <p><strong>소재 이름:</strong> {materialInfo.materialName}</p>
                            <p><strong>소재 타입:</strong> {materialInfo.materialType}</p>
                            <p><strong>색상:</strong> {materialInfo.color}</p>
                            {materialInfo.manufacturer && <p><strong>제조사:</strong> {materialInfo.manufacturer}</p>}
                            {materialInfo.productionDate && <p><strong>생산일:</strong> {materialInfo.productionDate}</p>}
                            {materialInfo.features && materialInfo.features.length > 0 && (
                                <p><strong>특징:</strong> {materialInfo.features.join(', ')}</p>
                            )}
                            {materialInfo.careInstructions && <p><strong>관리 방법:</strong> {materialInfo.careInstructions}</p>}
                            {materialInfo.imageUrl && <img src={materialInfo.imageUrl} alt="소재 이미지" className="material-image" />}
                        </div>
                    ) : (
                        error ? <p className="error-message">{error}</p> : <p>소재 정보를 불러오는 중...</p>
                    )}
                    <button onClick={handleRescan} className="rescan-button">다시 스캔</button>
                </div>
            )}
            <button onClick={onLogout} className="logout-button" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                로그아웃
            </button>

        </div>
    );
};

export default QrScanner;