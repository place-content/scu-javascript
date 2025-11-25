/**
 * 할 일 모델
 *
 * - 할 일 스키마 정의 (제목, 설명, 마감일 등)
 * - 사용자와의 관계 설정
 * - 유효성 검사 규칙
 * - 가상 필드 정의
 */

const mongoose = require('mongoose'); // MongoDB ODM

/**
 * 할 일 스키마 정의
 */
const taskSchema = new mongoose.Schema({
  // 사용자 ID (외래키)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',              // User 모델을 참조
    required: [true, '사용자 ID는 필수 항목입니다.'],
    index: true              // 검색 성능 향상을 위한 인덱스
  },

  // 할 일 제목
  title: {
    type: String,
    required: [true, '할 일 제목은 필수 항목입니다.'],
    trim: true,               // 앞뒤 공백 제거
    maxlength: [100, '제목은 100자 이하여야 합니다.']
  },

  // 할 일 설명
  description: {
    type: String,
    trim: true,
    maxlength: [500, '설명은 500자 이하여야 합니다.']
  },

  // 카테고리
  category: {
    type: String,
    enum: ['업무', '학습', '개인', '건강', '쇼핑', '기타'], // 미리 정의된 카테고리
    default: '개인'
  },

  // 우선순위 (1: 낮음, 5: 높음)
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3               // 기본값: 보통
  },

  // 마감일
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // 마감일이 현재 날짜보다 이전인지 확인
        return !value || value >= new Date();
      },
      message: '마감일은 현재 날짜 이후여야 합니다.'
    }
  },

  // 완료 상태
  completed: {
    type: Boolean,
    default: false
  },

  // 완료일
  completedAt: {
    type: Date
  },

  // 태그 (여러 개 저장 가능)
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '태그는 20자 이하여야 합니다.']
  }]
}, {
  // 타임스탬프 옵션
  timestamps: true // createdAt, updatedAt 필드 자동 생성
});

/**
 * 인덱스 설정
 * 검색 및 정렬 성능 향상을 위한 데이터베이스 인덱스
 */
taskSchema.index({ userId: 1, createdAt: -1 });     // 사용자별 최신순 정렬
taskSchema.index({ userId: 1, completed: 1 });      // 사용자별 완료 상태 조회
taskSchema.index({ dueDate: 1 });                   // 마감일순 정렬
taskSchema.index({ category: 1 });                  // 카테고리별 조회

/**
 * 가상 필드: 남은 날짜
 * 마감일까지 남은 일수를 계산하여 반환합니다
 */
taskSchema.virtual('daysLeft').get(function() {
  if (!this.dueDate || this.completed) return null;

  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

/**
 * 가상 필드: 마감일 포맷
 * 마감일을 한국어 형식으로 포맷팅합니다
 */
taskSchema.virtual('formattedDueDate').get(function() {
  if (!this.dueDate) return null;

  const date = new Date(this.dueDate);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
});

/**
 * 미들웨어: 완료 상태 변경 시 완료일 자동 설정
 * 할 일이 완료되면 완료일을 현재 시간으로 자동 설정합니다
 */
taskSchema.pre('save', function(next) {
  // 완료 상태가 변경되었고, 완료된 경우
  if (this.isModified('completed') && this.completed && !this.completedAt) {
    this.completedAt = new Date();
  }

  // 완료 상태가 변경되었고, 완료 취소된 경우
  if (this.isModified('completed') && !this.completed && this.completedAt) {
    this.completedAt = undefined;
  }

  next();
});

/**
 * 미들웨어: 쿼리 시 기본 정렬
 * 할 일을 조회할 때 항상 최신순으로 정렬합니다
 */
taskSchema.pre(/^find/, function(next) {
  // createdAt 기준 내림차순 정렬 (최신순)
  this.sort({ createdAt: -1 });
  next();
});

/**
 * 정적 메서드: 사용자의 통계 정보 조회
 * 특정 사용자의 할 일 통계를 계산합니다
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 통계 정보
 */
taskSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    // 특정 사용자의 할 일만 필터링
    { $match: { userId: mongoose.Types.ObjectId(userId) } },

    // 완료 상태별 그룹화
    {
      $group: {
        _id: '$completed',
        count: { $sum: 1 }
      }
    }
  ]);

  // 결과를 객체 형태로 변환
  const result = {
    total: 0,
    completed: 0,
    pending: 0
  };

  stats.forEach(stat => {
    result.total += stat.count;
    if (stat._id === true) {
      result.completed = stat.count;
    } else {
      result.pending = stat.count;
    }
  });

  // 완료율 계산
  result.completionRate = result.total > 0
    ? Math.round((result.completed / result.total) * 100)
    : 0;

  return result;
};

/**
 * 정적 메서드: 마감 임박 할 일 조회
 * 마감일이 임박한 할 일 목록을 반환합니다
 *
 * @param {string} userId - 사용자 ID
 * @param {number} days - 며칠 이내 마감 기준 (기본값: 3일)
 * @returns {Promise<Array>} 마감 임박 할 일 목록
 */
taskSchema.statics.getUpcomingTasks = async function(userId, days = 3) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return await this.find({
    userId: userId,
    completed: false,
    dueDate: {
      $gte: today,
      $lte: futureDate
    }
  }).sort({ dueDate: 1 }); // 마감일이 가까운 순으로 정렬
};

/**
 * Mongoose 모델 생성
 * 스키마를 기반으로 실제 데이터베이스 모델을 생성합니다
 */
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;