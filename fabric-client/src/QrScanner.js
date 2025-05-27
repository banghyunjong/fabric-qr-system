import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import './QrScanner.css'; // CSS 파일도 생성

const QrScanner = () => {
    const qrCodeScannerRef = useRef(null);
    const html5QrcodeScannerRef = useRef(null);
    const [scannedResult, setScannedResult] = useState('');
    const [manualQrCodeId, setManualQrCodeId] = useState(''); 
    const [materialInfo, setMaterialInfo] = useState(null);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false); // 스캐너 활성화 상태 관리

    // fetchMaterialInfo 함수를 useEffect 밖으로 이동
    const fetchMaterialInfo = async (qrCodeId) => {
        setMaterialInfo(null); // 이전 정보 초기화
        setError(null);       // 이전 에러 초기화
        try {
            const response = await axios.get(`http://localhost:5000/api/materials/${qrCodeId}`);
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
            setIsScanning(false);
            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.clear().catch(e => console.error("Failed to clear scanner on manual search: ", e));
                html5QrcodeScannerRef.current = null;
            }
            fetchMaterialInfo(manualQrCodeId);
        } else {
            setError("QR 코드 ID를 입력해주세요.");
        }
    };

    useEffect(() => {
        let html5QrcodeScanner;

        const startScanner = () => {
            if (!qrCodeScannerRef.current) return;

            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.clear().catch(e => console.error("Failed to clear existing scanner: ", e));
                html5QrcodeScannerRef.current = null;
            }

            html5QrcodeScanner = new Html5QrcodeScanner(
                qrCodeScannerRef.current.id,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            const onScanSuccess = (decodedText, decodedResult) => {
                console.log(`QR 코드 스캔 성공: ${decodedText}`);
                setScannedResult(decodedText);
                setIsScanning(false);
                html5QrcodeScanner.clear();

                fetchMaterialInfo(decodedText);
            };

            const onScanFailure = (errorMessage) => {
                // console.warn(`QR 코드 스캔 실패: ${errorMessage}`);
            };

            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            setIsScanning(true);
        };

        startScanner();

        return () => {
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner on unmount: ", e));
            }
        };
    }, []);

    const handleRescan = () => {
        setScannedResult('');
        setMaterialInfo(null);
        setError(null);
        setIsScanning(false); // 상태 초기화 후 useEffect 재실행
        // useEffect를 재실행하기 위해 key를 변경하는 트릭을 사용할 수도 있지만,
        // 여기서는 간단히 페이지를 새로고침하거나, 컴포넌트 자체를 다시 마운트하는 방식이 필요합니다.
        // 현재 코드 구조상 useEffect는 한 번만 실행되므로, 스캐너 재시작 로직을 별도로 트리거해야 합니다.
        // 가장 간단한 방법은 컴포넌트를 리렌더링하여 useEffect가 다시 실행되도록 하는 것입니다.
        // 예를 들어, isScanning 상태를 기반으로 <QrScanner /> 컴포넌트 자체를 조건부 렌더링하는 방법
        window.location.reload(); // 단순화를 위해 페이지 새로고침 (실제 앱에서는 권장되지 않음)
    };

    return (
        <div className="qr-scanner-container">
            <h3>QR 코드 스캔</h3>
            <p>카메라를 QR 코드에 비춰주세요.</p>

            {/* QR 스캐너가 렌더링될 div */}
            <div id="reader" ref={qrCodeScannerRef} style={{ width: "100%", maxWidth: "400px", margin: "auto" }}></div>
            <div className="manual-input-section"> {/* <<-- 이 부분 추가 */}
                    <h4>또는 QR 코드 ID 직접 입력</h4>
                    <input
                        type="text"
                        placeholder="QR 코드 ID 입력 (예: FABRIC-ABC-001)"
                        value={manualQrCodeId}
                        onChange={(e) => {
                            setManualQrCodeId(e.target.value);
                            setError(null); // 입력 시작 시 에러 메시지 초기화
                        }}
                        className="qr-input-field" // CSS 클래스 추가 예정
                    />
                    <button onClick={handleManualSearch} className="search-button">
                        조회
                    </button>
            </div>
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
            {/* 스캔 중 상태 표시 (선택 사항) */}
            {isScanning && !scannedResult && <p className="scanning-message">QR 코드 스캔 중...</p>}
        </div>
    );
};

export default QrScanner;