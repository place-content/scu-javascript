/**
 * TaskFlow 서버 메인 파일
 *
 * 이 파일은 TaskFlow 애플리케이션의 백엔드 서버입니다.
 * Express.js를 사용하여 간단한 RESTful API를 제공하며,
 * 다음과 같은 주요 기능을 포함합니다:
 * - Express 서버 설정 및 미들웨어 구성
 * - MongoDB 데이터베이스 연결
 * - 라우팅 설정
 * - 에러 처리
 * - CORS 및 보안 설정
 */

const express = require('express');  // Express 웹 프레임워크
const mongoose = require('mongoose'); // MongoDB ODM
const cors = require('cors');          // CORS 설정을 위한 미들웨어
const morgan = require('morgan');     // HTTP 요청 로깅 미들웨어
require('dotenv').config();           // 환경 변수 관리

// 라우터 모듈 임포트
const authRoutes = require('./routes/auth');   // 인증 관련 라우트
const taskRoutes = require('./routes/tasks');  // 할 일 관리 라우트

// Express 애플리케이션 생성
const app = express();

// 기본 포트 설정 (환경 변수가 있으면 사용, 없으면 3000)
const PORT = process.env.PORT || 3000;
// MongoDB 연결 URI 설정
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

/**
 * 데이터베이스 연결 함수
 * MongoDB에 연결하고 연결 상태를 콘솔에 출력합니다
 */
const connectDB = async () => {
  try {
    // mongoose를 사용하여 MongoDB 연결
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,    // 새로운 URL 파서 사용
      useUnifiedTopology: true, // 새로운 서버 디스커버리 및 모니터링 엔진 사용
    });
    console.log('MongoDB 연결 성공!');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    // 연결 실패 시 프로세스 종료
    process.exit(1);
  }
};

/**
 * 미들웨어 설정
 * 요청 처리 전에 실행되는 함수들입니다
 */
app.use(morgan('dev'));  // 개발 환경에 적합한 로그 형식
app.use(cors());         // 모든 출처의 CORS 요청 허용
app.use(express.json());  // JSON 형식의 요청 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 요청 본문 파싱

/**
 * 정적 파일 서빙
 * public 폴더의 정적 파일을 제공합니다
 */
app.use(express.static('public'));

/**
 * API 라우트 등록
 * 각 기능별 라우터를 특정 경로에 연결합니다
 */
app.use('/api/auth', authRoutes);  // 인증 관련 API (/api/auth/register, /api/auth/login 등)
app.use('/api/tasks', taskRoutes); // 할 일 관리 API (/api/tasks CRUD)

/**
 * 루트 경로 처리
 * 기본 환영 메시지를 반환합니다
 */
app.get('/', (req, res) => {
  res.json({
    message: 'TaskFlow API에 오신 것을 환영합니다!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks'
    }
  });
});

/**
 * 상태 확인 엔드포인트
 * 서버 상태를 확인하는 API
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '서버가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 에러 핸들링
 * 정의되지 않은 경로에 대한 처리
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `요청한 경로를 찾을 수 없습니다: ${req.originalUrl}`
  });
});

/**
 * 전역 에러 핸들링 미들웨어
 * 모든 에러를 일관된 형식으로 처리합니다
 */
app.use((error, req, res, next) => {
  console.error('에러 발생:', error);

  // 기본 에러 응답 설정
  let statusCode = 500;
  let message = '서버 내부 오류가 발생했습니다.';

  // Mongoose 유효성 검사 에러 처리
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(val => val.message).join(', ');
  }

  // 중복 키 에러 처리
  if (error.code === 11000) {
    statusCode = 400;
    message = '이미 존재하는 데이터입니다.';
  }

  // JWT 에러 처리
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '유효하지 않은 토큰입니다.';
  }

  // 토큰 만료 에러 처리
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '토큰이 만료되었습니다.';
  }

  // 에러 응답 전송
  res.status(statusCode).json({
    error: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

/**
 * 서버 시작 함수
 * 데이터베이스 연결 후 서버를 시작합니다
 */
const startServer = async () => {
  try {
    // 1. 데이터베이스 연결
    await connectDB();

    // 2. 서버 시작
    app.listen(PORT, () => {
      console.log(`TaskFlow 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`서버 주소: http://localhost:${PORT}`);
      console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

/**
 * 그레이스풀 셧다운 처리
 * 서버 종료 시 정리 작업을 수행합니다
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신. 서버를 정상적으로 종료합니다...');

  // MongoDB 연결 종료
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호 수신. 서버를 정상적으로 종료합니다...');

  // MongoDB 연결 종료
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
});

// 서버 시작
startServer();

// 애플리케이션 모듈 내보내기 (테스트용)
module.exports = app;