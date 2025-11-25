/**
 * 사용자 모델
 * - 사용자 스키마 정의 (이름, 이메일, 비밀번호 등)
 * - 비밀번호 암호화 미들웨어
 * - 비밀번호 비교 메서드
 * - JWT 토큰 생성 메서드
 * - 유효성 검사 규칙
 */

const mongoose = require('mongoose'); // MongoDB ODM
const bcrypt = require('bcryptjs');    // 비밀번호 암호화 라이브러리

/**
 * 사용자 스키마 정의
 */
const userSchema = new mongoose.Schema({
  // 이메일 필드
  email: {
    type: String,
    required: [true, '이메일은 필수 항목입니다.'], // 필수 항목
    unique: true,                                  // 고유값
    lowercase: true,                               // 소문자로 자동 변환
    trim: true,                                   // 앞뒤 공백 제거
    match: [                                      // 이메일 형식 유효성 검사
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '유효한 이메일 주소를 입력해주세요.'
    ]
  },

  // 비밀번호 필드
  password: {
    type: String,
    required: [true, '비밀번호는 필수 항목입니다.'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    select: false // 기본적으로 조회하지 않음 (보안 목적)
  },

  // 이름 필드
  name: {
    type: String,
    required: [true, '이름은 필수 항목입니다.'],
    trim: true,
    maxlength: [50, '이름은 50자 이하여야 합니다.']
  },

  // 구독 플랜 필드
  subscription: {
    type: String,
    enum: ['free', 'premium'], // 가능한 값 제한
    default: 'free'           // 기본값
  },

  // 활성화 상태
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  // 타임스탬프 옵션
  timestamps: true // createdAt, updatedAt 필드 자동 생성
});

/**
 * 인덱스 설정
 * 검색 성능 향상을 위한 데이터베이스 인덱스
 */
userSchema.index({ email: 1 }); // 이메일 필드에 고유 인덱스 생성

/**
 * 비밀번호 암호화 미들웨어
 * 사용자가 저장되기 전에 비밀번호를 자동으로 암호화합니다
 */
userSchema.pre('save', async function(next) {
  // 비밀번호가 변경되지 않았으면 다음 미들웨어로 이동
  if (!this.isModified('password')) return next();

  try {
    // 12라운드의 salt로 비밀번호 암호화
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 비밀번호 비교 메서드
 * 입력된 비밀번호와 저장된 암호화된 비밀번호를 비교합니다
 *
 * @param {string} candidatePassword - 확인할 비밀번호
 * @returns {Promise<boolean>} 비밀번호 일치 여부
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // bcrypt를 사용하여 비밀번호 비교
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('비밀번호 비교 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 정보를 공개적으로 안전한 형태로 변환하는 메서드
 * 민감한 정보를 제외하고 사용자 정보를 반환합니다
 *
 * @returns {Object} 필터링된 사용자 정보
 */
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();

  // 민감 정보 제거
  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

/**
 * Mongoose 모델 생성
 * 스키마를 기반으로 실제 데이터베이스 모델을 생성합니다
 */
const User = mongoose.model('User', userSchema);

module.exports = User;