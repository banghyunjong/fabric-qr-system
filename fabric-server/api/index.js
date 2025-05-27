// .env 파일 로드 (가장 상단에 위치해야 합니다)
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // CORS 미들웨어

const app = express();
const PORT = process.env.PORT || 5000; // .env 파일에서 PORT 가져오거나 기본값 5000


console.log(`2. PORT 설정: ${PORT}`); // 추가
console.log(`3. MONGO_URI 환경 변수: ${process.env.MONGO_URI ? '로드됨' : '로드 안됨'}`); // 추가


// CORS 설정: 모든 도메인에서의 요청을 허용 (개발용)
app.use(cors());

// JSON 요청 본문을 파싱하기 위한 미들웨어
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false, // Mongoose 6 이상에서는 기본값이라 필요 없음
  // useCreateIndex: true, // Mongoose 6 이상에서는 기본값이라 필요 없음
})
.then(() => console.log('MongoDB에 성공적으로 연결되었습니다.'))
.catch(err => console.error('MongoDB 연결 오류:', err));

console.log('4. MongoDB 연결 시도 코드 실행 완료.'); // 추가

// MongoDB 스키마 및 모델 정의
const materialSchema = new mongoose.Schema({
  qrCodeId: {
    type: String,
    required: true,
    unique: true // QR 코드 ID는 고유해야 함
  },
  materialName: {
    type: String,
    required: true
  },
  materialType: String,
  color: String,
  manufacturer: String,
  productionDate: String, // 또는 Date 타입으로 변경 가능
  features: [String],
  careInstructions: String,
  imageUrl: String
});

const Material = mongoose.model('Material', materialSchema); // 컬렉션 이름은 'materials'가 됨 (mongoose가 자동 복수형)

// API 엔드포인트: QR 코드 ID로 소재 정보 조회
app.get('/api/materials/:qrCodeId', async (req, res) => {
  const qrCodeId = req.params.qrCodeId;
  console.log(`QR 코드 ID로 소재 정보 조회 요청: ${qrCodeId}`);

  try {
    const material = await Material.findOne({ qrCodeId: qrCodeId });
    console.log(`[디버그] MongoDB 조회 결과:`, material); // <<--- 이 줄 추가!

    if (material) {
      res.json(material); // 찾으면 JSON 형태로 반환
    } else {
      // 데이터를 찾지 못했을 경우
      console.log(`QR 코드 ID '${qrCodeId}'에 해당하는 소재 정보를 찾을 수 없습니다.`);
      res.status(404).json({ message: '소재 정보를 찾을 수 없습니다.' });
    }
  } catch (error) {
    // 서버 오류 발생 시
    console.error('소재 정보 조회 중 서버 오류 발생:', error);
    res.status(500).json({ message: '서버 오류 발생', error: error.message });
  }
});

// Vercel 서버리스 함수로 내보내기 위한 핵심 부분
// 이 라인이 없으면 Vercel이 Express 앱을 인식하지 못합니다.
module.exports = app;

// 로컬 개발 환경에서만 서버를 리스닝 (Vercel에서는 이 부분이 실행되지 않음)
// Vercel은 포트를 직접 리스닝하지 않고 HTTP 요청을 처리하므로 이 조건부가 중요합니다.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
}