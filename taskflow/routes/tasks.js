/**
 * 할 일 관리 라우터
 *
 * 이 파일은 할 일 CRUD(Create, Read, Update, Delete) 관련 API 엔드포인트를 정의합니다.
 * 다음과 같은 주요 기능을 포함합니다:
 * - 할 일 생성 (POST /)
 * - 할 일 목록 조회 (GET /)
 * - 특정 할 일 조회 (GET /:id)
 * - 할 일 수정 (PUT /:id)
 * - 할 일 삭제 (DELETE /:id)
 * - 할 일 통계 조회 (GET /stats)
 * - JWT 인증 미들웨어 적용
 */

const express = require('express');       // Express 라우터
const jwt = require('jsonwebtoken');       // JWT 토큰 검증
const Task = require('../models/Task');    // 할 일 모델

const router = express.Router();

/**
 * 인증 미들웨어
 * JWT 토큰을 검증하여 사용자 인증을 처리합니다
 */
const authenticateToken = async (req, res, next) => {
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

    // 요청 객체에 사용자 정보 추가
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next(); // 다음 미들웨어로 이동

  } catch (error) {
    console.error('토큰 검증 중 오류 발생:', error);

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
      message: '인증 중 오류가 발생했습니다.'
    });
  }
};

// 모든 할일 관련 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

/**
 * POST /api/tasks
 * 새로운 할 일 생성 API (Create)
 * 사용자의 할 일을 생성합니다
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      dueDate,
      tags
    } = req.body;

    // 필수 필드 유효성 검사
    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: true,
        message: '할 일 제목은 필수 항목입니다.'
      });
    }

    // 우선순위 유효성 검사
    if (priority && (priority < 1 || priority > 5)) {
      return res.status(400).json({
        error: true,
        message: '우선순위는 1부터 5까지의 숫자여야 합니다.'
      });
    }

    // 새 할 일 생성
    const newTask = new Task({
      userId: req.user.id,              // 인증된 사용자 ID
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || '개인',
      priority: priority || 3,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags || []
    });

    // 데이터베이스에 저장
    const savedTask = await newTask.save();

    // 성공 응답 (201: Created)
    res.status(201).json({
      error: false,
      message: '할 일이 성공적으로 생성되었습니다.',
      data: {
        task: savedTask
      }
    });

  } catch (error) {
    console.error('할 일 생성 중 오류 발생:', error);

    // Mongoose 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: true,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: true,
      message: '할 일 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/tasks
 * 할 일 목록 조회 API (Read)
 * 사용자의 모든 할 일 목록을 반환합니다
 */
router.get('/', async (req, res) => {
  try {
    // 쿼리 파라미터 추출
    const {
      completed,      // 완료 상태 필터 (true/false)
      category,       // 카테고리 필터
      priority,       // 우선순위 필터
      dueDate,        // 마감일 필터
      page = 1,       // 페이지 번호 (기본값: 1)
      limit = 10,     // 페이지당 항목 수 (기본값: 10)
      sortBy = 'createdAt', // 정렬 기준 (기본값: 생성일)
      sortOrder = 'desc'     // 정렬 순서 (기본값: 내림차순)
    } = req.query;

    // 검색 조건 객체 생성
    const query = { userId: req.user.id };

    // 필터링 조건 추가
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = parseInt(priority);
    }

    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      query.dueDate = {
        $gte: date,
        $lt: nextDay
      };
    }

    // 정렬 옵션 설정
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 페이지네이션 계산
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 데이터베이스 조회
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query)
    ]);

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '할 일 목록 조회에 성공했습니다.',
      data: {
        tasks,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('할 일 목록 조회 중 오류 발생:', error);

    res.status(500).json({
      error: true,
      message: '할 일 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/tasks/stats
 * 할 일 통계 조회 API
 * 사용자의 할 일 통계 정보를 반환합니다
 */
router.get('/stats', async (req, res) => {
  try {
    // 사용자의 통계 정보 조회
    const stats = await Task.getUserStats(req.user.id);

    // 마감 임박 할 일 조회
    const upcomingTasks = await Task.getUpcomingTasks(req.user.id, 3);

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '할 일 통계 조회에 성공했습니다.',
      data: {
        stats,
        upcomingTasks: upcomingTasks.slice(0, 5) // 최대 5개만 반환
      }
    });

  } catch (error) {
    console.error('할 일 통계 조회 중 오류 발생:', error);

    res.status(500).json({
      error: true,
      message: '할 일 통계 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/tasks/:id
 * 특정 할 일 조회 API (Read)
 * ID로 특정 할 일을 조회합니다
 */
router.get('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    // ObjectId 형식 유효성 검사
    if (!taskId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: true,
        message: '유효하지 않은 할 일 ID입니다.'
      });
    }

    // 할 일 조회
    const task = await Task.findOne({
      _id: taskId,
      userId: req.user.id
    });

    // 할 일 존재 여부 확인
    if (!task) {
      return res.status(404).json({
        error: true,
        message: '할 일을 찾을 수 없습니다.'
      });
    }

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '할 일 조회에 성공했습니다.',
      data: {
        task
      }
    });

  } catch (error) {
    console.error('할 일 조회 중 오류 발생:', error);

    res.status(500).json({
      error: true,
      message: '할 일 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * PUT /api/tasks/:id
 * 할 일 수정 API (Update)
 * ID로 특정 할 일을 수정합니다
 */
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const {
      title,
      description,
      category,
      priority,
      dueDate,
      completed,
      tags
    } = req.body;

    // ObjectId 형식 유효성 검사
    if (!taskId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: true,
        message: '유효하지 않은 할 일 ID입니다.'
      });
    }

    // 우선순위 유효성 검사
    if (priority && (priority < 1 || priority > 5)) {
      return res.status(400).json({
        error: true,
        message: '우선순위는 1부터 5까지의 숫자여야 합니다.'
      });
    }

    // 업데이트할 필드 객체 생성
    const updateFields = {};

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({
          error: true,
          message: '할 일 제목은 필수 항목입니다.'
        });
      }
      updateFields.title = title.trim();
    }

    if (description !== undefined) {
      updateFields.description = description ? description.trim() : '';
    }

    if (category !== undefined) {
      updateFields.category = category;
    }

    if (priority !== undefined) {
      updateFields.priority = priority;
    }

    if (dueDate !== undefined) {
      updateFields.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    if (completed !== undefined) {
      updateFields.completed = completed;
    }

    if (tags !== undefined) {
      updateFields.tags = tags;
    }

    // 할 일 수정
    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: taskId,
        userId: req.user.id
      },
      updateFields,
      {
        new: true,        // 수정된 문서 반환
        runValidators: true // 유효성 검사 실행
      }
    );

    // 할 일 존재 여부 확인
    if (!updatedTask) {
      return res.status(404).json({
        error: true,
        message: '할 일을 찾을 수 없습니다.'
      });
    }

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '할 일이 성공적으로 수정되었습니다.',
      data: {
        task: updatedTask
      }
    });

  } catch (error) {
    console.error('할 일 수정 중 오류 발생:', error);

    // Mongoose 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: true,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: true,
      message: '할 일 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * 할 일 삭제 API (Delete)
 * ID로 특정 할 일을 삭제합니다
 */
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    // ObjectId 형식 유효성 검사
    if (!taskId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: true,
        message: '유효하지 않은 할 일 ID입니다.'
      });
    }

    // 할 일 삭제
    const deletedTask = await Task.findOneAndDelete({
      _id: taskId,
      userId: req.user.id
    });

    // 할 일 존재 여부 확인
    if (!deletedTask) {
      return res.status(404).json({
        error: true,
        message: '할 일을 찾을 수 없습니다.'
      });
    }

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '할 일이 성공적으로 삭제되었습니다.',
      data: {
        task: deletedTask
      }
    });

  } catch (error) {
    console.error('할 일 삭제 중 오류 발생:', error);

    res.status(500).json({
      error: true,
      message: '할 일 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * DELETE /api/tasks/completed
 * 완료된 할 일 일괄 삭제 API
 * 완료된 모든 할 일을 삭제합니다
 */
router.delete('/completed', async (req, res) => {
  try {
    // 완료된 할 일 삭제
    const result = await Task.deleteMany({
      userId: req.user.id,
      completed: true
    });

    // 성공 응답
    res.status(200).json({
      error: false,
      message: '완료된 할 일들이 성공적으로 삭제되었습니다.',
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('완료된 할 일 삭제 중 오류 발생:', error);

    res.status(500).json({
      error: true,
      message: '완료된 할 일 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;