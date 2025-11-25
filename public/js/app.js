/**
 * TaskFlow 메인 JavaScript 파일
 *
 * 이 파일은 TaskFlow 웹 애플리케이션의 모든 클라이언트 측 로직을 담당합니다.
 * 다음과 같은 주요 기능을 포함합니다:
 * - 사용자 인증 (로그인, 회원가입, 로그아웃)
 * - 할 일 CRUD (생성, 읽기, 수정, 삭제)
 * - API 통신 및 에러 처리
 * - UI 관리 및 사용자 인터랙션
 * - 로컬 스토리지 관리
 * - 반응형 디자인 지원
 */

// 전역 변수 선언
let currentUser = null;          // 현재 로그인된 사용자 정보
let authToken = null;           // JWT 인증 토큰
let tasks = [];                 // 할 일 목록 데이터
let currentEditingTask = null;  // 현재 편집 중인 할 일

// API 기본 URL 설정
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

/**
 * 애플리케이션 초기화 함수
 * 페이지 로드 시 실행되며 초기 설정을 수행합니다
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('TaskFlow 애플리케이션 초기화 중...');

  try {
    // 로컬 스토리지에서 인증 정보 확인
    initializeAuth();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 인증 상태에 따른 화면 표시
    if (authToken && currentUser) {
      await showMainScreen();
    } else {
      showLoginScreen();
    }

  } catch (error) {
    console.error('애플리케이션 초기화 중 오류 발생:', error);
    showError('애플리케이션 초기화에 실패했습니다.');
    showLoginScreen();
  }
});

/**
 * 인증 정보 초기화 함수
 * 로컬 스토리지에서 사용자 정보와 토큰을 불러옵니다
 */
function initializeAuth() {
  const token = localStorage.getItem('taskflow_token');
  const user = localStorage.getItem('taskflow_user');

  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);

    // API 요청 기본 헤더 설정
    setupApiHeaders();
  }
}

/**
 * API 요청 헤더 설정 함수
 * 모든 API 요청에 인증 토큰을 포함시킵니다
 */
function setupApiHeaders() {
  // 나중에 fetch 요청 시 사용할 기본 헤더 설정
  window.defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

/**
 * 이벤트 리스너 설정 함수
 * DOM 요소에 이벤트 핸들러를 바인딩합니다
 */
function setupEventListeners() {
  console.log('이벤트 리스너 설정 중...');

  // 로그인 관련 이벤트
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('showRegisterBtn').addEventListener('click', showRegisterScreen);
  document.getElementById('showLoginBtn').addEventListener('click', showLoginScreen);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // 할 일 관련 이벤트
  document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
  document.getElementById('saveTaskBtn').addEventListener('click', handleSaveTask);
  document.getElementById('deleteTaskBtn').addEventListener('click', handleDeleteTask);

  // 필터 및 관리 이벤트
  document.getElementById('filterCategory').addEventListener('change', filterTasks);
  document.getElementById('filterStatus').addEventListener('change', filterTasks);
  document.getElementById('clearCompletedBtn').addEventListener('click', clearCompletedTasks);
  document.getElementById('refreshBtn').addEventListener('click', refreshTasks);
}

/**
 * API 통신 헬퍼 함수
 * 일반적인 fetch 요청을 처리하는 공통 함수입니다
 *
 * @param {string} url - API 엔드포인트 URL
 * @param {Object} options - fetch 옵션 (method, headers, body 등)
 * @returns {Promise<Object>} API 응답 데이터
 */
async function apiRequest(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // 인증 토큰이 있다면 헤더에 추가
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    console.log(`API 요청: ${config.method || 'GET'} ${url}`, config.body);

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    console.log(`API 응답:`, data);

    // HTTP 상태 코드 확인
    if (!response.ok) {
      throw new Error(data.message || `HTTP 오류: ${response.status}`);
    }

    return data;

  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
}

// ===========================
// 화면 관리 함수
// ===========================

/**
 * 로딩 화면 표시 함수
 */
function showLoadingScreen() {
  hideAllScreens();
  document.getElementById('loadingScreen').style.display = 'flex';
}

/**
 * 로그인 화면 표시 함수
 */
function showLoginScreen() {
  hideAllScreens();
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('loginEmail').focus();
}

/**
 * 회원가입 화면 표시 함수
 */
function showRegisterScreen() {
  hideAllScreens();
  document.getElementById('registerScreen').style.display = 'block';
  document.getElementById('registerName').focus();
}

/**
 * 메인 화면 표시 함수
 */
async function showMainScreen() {
  hideAllScreens();
  document.getElementById('mainScreen').style.display = 'block';

  // 사용자 정보 표시
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.name;
  }

  // 할 일 목록 및 통계 로드
  await loadTasks();
  await loadStats();
}

/**
 * 모든 화면 숨기기 함수
 */
function hideAllScreens() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registerScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'none';
}

// ===========================
// 인증 관련 함수
// ===========================

/**
 * 로그인 처리 함수
 *
 * @param {Event} event - 폼 제출 이벤트
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    // API를 통한 로그인 요청
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // 성공 시 데이터 저장
    authToken = response.data.token;
    currentUser = response.data.user;

    // 로컬 스토리지에 저장
    localStorage.setItem('taskflow_token', authToken);
    localStorage.setItem('taskflow_user', JSON.stringify(currentUser));

    // API 헤더 재설정
    setupApiHeaders();

    showSuccess('로그인에 성공했습니다!');
    await showMainScreen();

  } catch (error) {
    console.error('로그인 실패:', error);
    showError(error.message || '로그인에 실패했습니다.');
  }
}

/**
 * 회원가입 처리 함수
 *
 * @param {Event} event - 폼 제출 이벤트
 */
async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // 비밀번호 확인
  if (password !== confirmPassword) {
    showError('비밀번호가 일치하지 않습니다.');
    return;
  }

  // 비밀번호 길이 확인
  if (password.length < 6) {
    showError('비밀번호는 최소 6자 이상이어야 합니다.');
    return;
  }

  try {
    // API를 통한 회원가입 요청
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    // 성공 시 데이터 저장
    authToken = response.data.token;
    currentUser = response.data.user;

    // 로컬 스토리지에 저장
    localStorage.setItem('taskflow_token', authToken);
    localStorage.setItem('taskflow_user', JSON.stringify(currentUser));

    // API 헤더 재설정
    setupApiHeaders();

    showSuccess('회원가입에 성공했습니다!');
    await showMainScreen();

  } catch (error) {
    console.error('회원가입 실패:', error);
    showError(error.message || '회원가입에 실패했습니다.');
  }
}

/**
 * 로그아웃 처리 함수
 */
async function handleLogout() {
  try {
    // 서버에 로그아웃 알림 (선택적)
    if (authToken) {
      await apiRequest('/auth/logout', { method: 'POST' });
    }

    // 로컬 데이터 삭제
    authToken = null;
    currentUser = null;
    tasks = [];

    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');

    showSuccess('로그아웃되었습니다.');
    showLoginScreen();

  } catch (error) {
    console.error('로그아웃 실패:', error);
    // 에러가 발생해도 로그아웃은 진행
    handleLogout();
  }
}

// ===========================
// 할 일 관리 함수
// ===========================

/**
 * 할 일 생성 처리 함수
 *
 * @param {Event} event - 폼 제출 이벤트
 */
async function handleAddTask(event) {
  event.preventDefault();

  const title = document.getElementById('taskTitle').value.trim();
  const category = document.getElementById('taskCategory').value;
  const priority = parseInt(document.getElementById('taskPriority').value);
  const dueDate = document.getElementById('taskDueDate').value;

  if (!title) {
    showError('할 일 제목을 입력해주세요.');
    return;
  }

  try {
    // API를 통한 할 일 생성 요청
    const response = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        category,
        priority,
        dueDate: dueDate || undefined
      })
    });

    // 성공 시 폼 초기화 및 목록 새로고침
    document.getElementById('addTaskForm').reset();
    document.getElementById('taskTitle').focus();

    showSuccess('할 일이 추가되었습니다.');
    await loadTasks();
    await loadStats();

  } catch (error) {
    console.error('할 일 추가 실패:', error);
    showError(error.message || '할 일 추가에 실패했습니다.');
  }
}

/**
 * 할 일 목록 로드 함수
 */
async function loadTasks() {
  try {
    // 필터링 옵션 가져오기
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;

    // 쿼리 파라미터 구성
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('completed', status);

    // API를 통한 할 일 목록 조회
    const response = await apiRequest(`/tasks?${params}`);
    tasks = response.data.tasks;

    // UI에 할 일 목록 렌더링
    renderTaskList();

  } catch (error) {
    console.error('할 일 목록 로드 실패:', error);
    showError(error.message || '할 일 목록을 불러오는데 실패했습니다.');
    // 에러 발생 시 빈 목록 표시
    renderTaskList();
  }
}

/**
 * 할 일 목록 렌더링 함수
 */
function renderTaskList() {
  const taskList = document.getElementById('taskList');

  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>할 일이 없습니다. 새 할 일을 추가해보세요!</p>
      </div>
    `;
    return;
  }

  const tasksHtml = tasks.map(task => createTaskElement(task)).join('');
  taskList.innerHTML = tasksHtml;

  // 애니메이션 효과 추가
  taskList.querySelectorAll('.task-item').forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('slide-in');
    }, index * 50);
  });
}

/**
 * 할 일 요소 생성 함수
 *
 * @param {Object} task - 할 일 객체
 * @returns {string} HTML 문자열
 */
function createTaskElement(task) {
  const priorityClass = task.priority >= 4 ? 'priority-high' :
                       task.priority >= 3 ? 'priority-medium' : 'priority-low';

  const completedClass = task.completed ? 'completed' : '';
  const checkboxClass = task.completed ? 'checked' : '';

  // 카테고리 배지 클래스
  const categoryBadgeClass = `badge-category-${task.category}`;

  // 우선순위 배지 클래스
  const priorityBadgeClass = `badge-priority-${task.priority}`;

  // 마감일 처리
  let dueDateHtml = '';
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dueDateClass = 'due-date';
    let dueDateText = dueDate.toLocaleDateString('ko-KR');

    if (dueDate < today) {
      dueDateClass += ' overdue';
      dueDateText = '마감일 지남';
    } else if (dueDate.toDateString() === today.toDateString()) {
      dueDateClass += ' today';
      dueDateText = '오늘 마감';
    } else if (dueDate <= tomorrow) {
      dueDateClass += ' upcoming';
      dueDateText = '내일 마감';
    }

    dueDateHtml = `<span class="${dueDateClass}">${dueDateText}</span>`;
  }

  return `
    <div class="task-item ${priorityClass} ${completedClass}" data-task-id="${task._id}">
      <div class="task-checkbox ${checkboxClass}" onclick="toggleTaskComplete('${task._id}')">
        ${task.completed ? '<i class="bi bi-check"></i>' : ''}
      </div>

      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}

        <div class="task-meta">
          <span class="badge ${categoryBadgeClass}">${task.category}</span>
          <span class="badge ${priorityBadgeClass}">
            ${['낮음', '조금 낮음', '보통', '높음', '매우 높음'][task.priority - 1]}
          </span>
          ${dueDateHtml}
        </div>
      </div>

      <div class="task-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="editTask('${task._id}')" title="수정">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')" title="삭제">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * 할 일 완료 상태 토글 함수
 *
 * @param {string} taskId - 할 일 ID
 */
async function toggleTaskComplete(taskId) {
  try {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    // API를 통한 상태 업데이트
    await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !task.completed })
    });

    showSuccess(`할 일이 ${task.completed ? '미완료' : '완료'} 처리되었습니다.`);
    await loadTasks();
    await loadStats();

  } catch (error) {
    console.error('할 일 상태 변경 실패:', error);
    showError(error.message || '할 일 상태 변경에 실패했습니다.');
  }
}

/**
 * 할 일 수정 함수
 *
 * @param {string} taskId - 할 일 ID
 */
async function editTask(taskId) {
  try {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    currentEditingTask = task;

    // 수정 폼에 데이터 채우기
    document.getElementById('editTaskId').value = task._id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate ?
      new Date(task.dueDate).toISOString().split('T')[0] : '';
    document.getElementById('editTaskCompleted').checked = task.completed;

    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    modal.show();

  } catch (error) {
    console.error('할 일 수정 준비 실패:', error);
    showError('할 일 수정 준비에 실패했습니다.');
  }
}

/**
 * 할 일 저장 처리 함수
 */
async function handleSaveTask() {
  try {
    if (!currentEditingTask) return;

    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const category = document.getElementById('editTaskCategory').value;
    const priority = parseInt(document.getElementById('editTaskPriority').value);
    const dueDate = document.getElementById('editTaskDueDate').value;
    const completed = document.getElementById('editTaskCompleted').checked;

    if (!title) {
      showError('할 일 제목을 입력해주세요.');
      return;
    }

    // API를 통한 할 일 수정
    await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title,
        description,
        category,
        priority,
        dueDate: dueDate || undefined,
        completed
      })
    });

    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
    modal.hide();

    showSuccess('할 일이 수정되었습니다.');
    await loadTasks();
    await loadStats();

  } catch (error) {
    console.error('할 일 수정 실패:', error);
    showError(error.message || '할 일 수정에 실패했습니다.');
  }
}

/**
 * 할 일 삭제 함수
 *
 * @param {string} taskId - 할 일 ID
 */
async function deleteTask(taskId) {
  if (!confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
    return;
  }

  try {
    // API를 통한 할 일 삭제
    await apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE'
    });

    showSuccess('할 일이 삭제되었습니다.');
    await loadTasks();
    await loadStats();

  } catch (error) {
    console.error('할 일 삭제 실패:', error);
    showError(error.message || '할 일 삭제에 실패했습니다.');
  }
}

/**
 * 완료된 할 일 일괄 삭제 함수
 */
async function clearCompletedTasks() {
  const completedTasks = tasks.filter(task => task.completed);

  if (completedTasks.length === 0) {
    showInfo('완료된 할 일이 없습니다.');
    return;
  }

  if (!confirm(`완료된 할 일 ${completedTasks.length}개를 삭제하시겠습니까?`)) {
    return;
  }

  try {
    // API를 통한 완료된 할 일 삭제
    await apiRequest('/tasks/completed', {
      method: 'DELETE'
    });

    showSuccess(`완료된 할 일 ${completedTasks.length}개가 삭제되었습니다.`);
    await loadTasks();
    await loadStats();

  } catch (error) {
    console.error('완료된 할 일 삭제 실패:', error);
    showError(error.message || '완료된 할 일 삭제에 실패했습니다.');
  }
}

/**
 * 할 일 새로고침 함수
 */
async function refreshTasks() {
  await loadTasks();
  await loadStats();
  showInfo('할 일 목록이 새로고침되었습니다.');
}

/**
 * 할 일 필터링 함수
 */
function filterTasks() {
  loadTasks(); // 필터링 조건으로 목록 다시 로드
}

// ===========================
// 통계 관련 함수
// ===========================

/**
 * 통계 정보 로드 함수
 */
async function loadStats() {
  try {
    // API를 통한 통계 정보 조회
    const response = await apiRequest('/tasks/stats');
    const stats = response.data.stats;

    // 통계 정보 UI 업데이트
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.completed;
    document.getElementById('completionRate').textContent = `${stats.completionRate}%`;

  } catch (error) {
    console.error('통계 로드 실패:', error);
    // 통계 로드 실패 시 기본값 표시
    document.getElementById('totalTasks').textContent = '0';
    document.getElementById('completedTasks').textContent = '0';
    document.getElementById('completionRate').textContent = '0%';
  }
}

// ===========================
// 유틸리티 함수
// ===========================

/**
 * HTML 이스케이프 함수
 * XSS 공격 방지를 위해 문자열을 안전한 HTML로 변환합니다
 *
 * @param {string} text - 변환할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 성공 알림 표시 함수
 *
 * @param {string} message - 알림 메시지
 */
function showSuccess(message) {
  showNotification(message, 'success');
}

/**
 * 에러 알림 표시 함수
 *
 * @param {string} message - 알림 메시지
 */
function showError(message) {
  showNotification(message, 'danger');
}

/**
 * 정보 알림 표시 함수
 *
 * @param {string} message - 알림 메시지
 */
function showInfo(message) {
  showNotification(message, 'info');
}

/**
 * 알림 표시 함수
 *
 * @param {string} message - 알림 메시지
 * @param {string} type - 알림 타입 (success, danger, info, warning)
 */
function showNotification(message, type = 'info') {
  const toastEl = document.getElementById('notificationToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = toastEl.querySelector('.bi');

  // 타입에 따른 아이콘 및 색상 설정
  const typeConfig = {
    success: { icon: 'bi-check-circle-fill', class: 'text-success', title: '성공' },
    danger: { icon: 'bi-exclamation-triangle-fill', class: 'text-danger', title: '오류' },
    info: { icon: 'bi-info-circle-fill', class: 'text-info', title: '정보' },
    warning: { icon: 'bi-exclamation-triangle-fill', class: 'text-warning', title: '경고' }
  };

  const config = typeConfig[type] || typeConfig.info;

  // 알림 내용 설정
  toastIcon.className = `bi ${config.icon} ${config.class} me-2`;
  toastTitle.textContent = config.title;
  toastMessage.textContent = message;

  // 토스트 표시
  const toast = new bootstrap.Toast(toastEl, {
    delay: 3000,
    autohide: true
  });

  toast.show();

  console.log(`[${type.toUpperCase()}] ${message}`);
}

// ===========================
// 전역 함수 (HTML onclick에서 사용)
// ===========================

// 전역 스코프에 함수 노출 (HTML onclick 핸들러에서 접근 가능하도록)
window.toggleTaskComplete = toggleTaskComplete;
window.editTask = editTask;
window.deleteTask = deleteTask;