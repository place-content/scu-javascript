/**
 * 인증 라우터
 *
 * 이 파일은 사용자 인증 관련 API 엔드포인트를 정의합니다.
 * 다음과 같은 주요 기능을 포함합니다:
 * - 회원가입 (/register)
 * - 로그인 (/login)
 * - 로그아웃 (/logout)
 * - JWT 토큰 생성 및 검증
 * - 입력 데이터 유효성 검사
 */

const express = require('express');       // Express 라우터
const jwt = require('jsonwebtoken');       // JWT 토큰 생성
const User = require('../models/User');    // 사용자 모델

const router = express.Router();

/**
 * JWT 토큰 생성 함수
 * 사용자 정보를 담은 JWT 토큰을 생성합니다
 *
 * @param {Object} user - 사용자 객체
 * @returns {string} JWT 토큰
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET || 'your-secret-key', // 환경 변수 또는 기본 시크릿 키
    {
      expiresIn: '7d' // 토큰 만료 기간: 7일
    }
  );
};

/**
 * POST /api/auth/register
 * 회원가입 API
 * 새로운 사용자를 생성하고 JWT 토큰을 반환합니다
 */
router.post('/register', async (req, res) => {
  try {
    // 요청 본문에서 필요한 정보 추출
    const { name, email, password } = req.body;

    // 필수 필드 유효성 검사
    if (!name || !email || !password) {
      return res.status(400).json({
        error: true,
        message: '이름, 이메일, 비밀번호는 필수 항목입니다.'
      });
    }

    // 이메일 형식 유효성 검사
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: '유효한 이메일 주소를 입력해주세요.'
      });
    }

    // 비밀번호 길이 검사
    if (password.length < 6) {
      return res.status(400).json({
        error: true,
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 이미 가입된 이메일 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: '이미 가입된 이메일 주소입니다.'
      });
    }

    // 새 사용자 생성
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    // 데이터베이스에 저장
    await newUser.save();

    // JWT 토큰 생성
    const token = generateToken(newUser);

    // 성공 응답
    res.status(201).json({
      error: false,
      message: '회원가입이 성공적으로 완료되었습니다.',
      data: {
        user: newUser, // User 모델의 toJSON 메서드로 비밀번호가 제거됨
        token
      }
    });

  } catch (error) {
    console.error('회원가입 중 오류 발생:', error);

    // Mongoose 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: true,
        message: messages.join(', ')
      });
    }

    // 기타 에러 처리
    res.status(500).json({
      error: true,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/auth/login
 * 로그인 API
 * 이메일과 비밀번호를 확인하여 JWT 토큰을 반환합니다
 */
router.post('/login', async (req, res) => {
  try {
    // 요청 본문에서 이메일과 비밀번호 추출
    const { email, password } = req.body;

    // 필수 필드 유효성 검사
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: '이메일과 비밀번호는 필수 항목입니다.'
      });
    }

    // 이메일로 사용자 조회 (비밀번호 필드 포함)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // 사용자 존재 여부 확인
    if (!user) {
      return res.status(401).json({
        error: true,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      return res.status(401).json({
        error: true,
        message: '비활성화된 계정입니다. 관리자에게 문의해주세요.'
      });
    }

    // 비밀번호 비교
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    const token = generateToken(user);

    // 마지막 로그인 시간 업데이트 (선택적)
    user.updatedAt = new Date();
    await user.save();

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '로그인에 성공했습니다.',
      data: {
        user: user, // User 모델의 toJSON 메서드로 비밀번호가 제거됨
        token
      }
    });

  } catch (error) {
    console.error('로그인 중 오류 발생:', error);

    res.status(500).json({
      error: true,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /api/auth/logout
 * 로그아웃 API
 * 클라이언트 측에서 토큰을 삭제하도록 안내합니다
 * (실제 로그아웃은 클라이언트에서 처리)
 */
router.post('/logout', (req, res) => {
  // 서버 측에서는 별도의 작업이 필요 없음
  // 실제 로그아웃은 클라이언트에서 토큰을 삭제하여 처리

  res.status(200).json({
    error: false,
    message: '로그아웃이 성공적으로 완료되었습니다.'
  });
});

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회 API
 * JWT 토큰을 검증하고 사용자 정보를 반환합니다
 */
router.get('/me', async (req, res) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 토큰 추출
    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 사용자 조회
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      return res.status(401).json({
        error: true,
        message: '비활성화된 계정입니다.'
      });
    }

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '사용자 정보 조회에 성공했습니다.',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);

    // JWT 관련 에러 처리
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: '토큰이 만료되었습니다.'
      });
    }

    res.status(500).json({
      error: true,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

module.exports = router;