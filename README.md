# TaskFlow - 간단한 개인 업무 관리 웹 애플리케이션

TaskFlow는 간단한 CRUD 기능을 가진 개인 업무 관리 웹 애플리케이션입니다. JavaScript 기반으로 개발되었으며, MongoDB와 Express.js를 사용합니다.

## 🚀 주요 기능

- **사용자 인증**: 회원가입, 로그인, 로그아웃
- **할 일 관리 (CRUD)**:
  - 생성: 새 할 일 추가
  - 읽기: 할 일 목록 조회, 필터링, 검색
  - 수정: 할 일 내용 수정
  - 삭제: 개별/일괄 삭제
- **카테고리 및 우선순위**: 할 일 분류 및 중요도 설정
- **마감일 관리**: 날짜 설정 및 알림
- **통계 대시보드**: 완료율 및 진행 상황 시각화
- **반응형 디자인**: 모바일/태블릿/PC 지원

## 🛠 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 반응형 디자인, 애니메이션
- **Vanilla JavaScript**: 순수 자바스크립트, 프레임워크 미사용
- **Bootstrap 5**: UI 컴포넌트 프레임워크

### 백엔드
- **Node.js**: 자바스크립트 런타임
- **Express.js**: 웹 프레임워크
- **MongoDB**: NoSQL 데이터베이스
- **Mongoose**: MongoDB ODM (Object Document Mapper)

## 📋 설치 및 실행 방법

### 1. 시스템 요구사항

- **Node.js**: 14.0.0 이상
- **MongoDB**: 4.4 이상
- **npm**: 6.0.0 이상

### 2. 프로젝트 설정

#### 방법 1: MongoDB 로컬 설치 및 실행

1. **MongoDB 설치**
   ```bash
   # Windows: 공식 웹사이트에서 설치 파일 다운로드
   # macOS: Homebrew 사용
   brew install mongodb-community

   # Ubuntu/Debian:
   sudo apt-get install mongodb
   ```

2. **MongoDB 서버 시작**
   ```bash
   # Windows: 서비스에서 MongoDB 시작 또는
   mongod --dbpath C:\data\db

   # macOS/Linux:
   mongod --dbpath /var/lib/mongodb
   # 또는 sudo systemctl start mongod
   ```

3. **프로젝트 설치 및 실행**
   ```bash
   # 프로젝트 폴더로 이동
   cd taskflow

   # 의존성 설치
   npm install

   # 환경 변수 파일 생성 (.env)
   echo "MONGODB_URI=mongodb://localhost:27017/taskflow" > .env
   echo "JWT_SECRET=your-secret-key-here" >> .env
   echo "PORT=3000" >> .env

   # 서버 시작
   npm start
   ```

#### 방법 2: MongoDB Atlas (클라우드) 사용

1. **MongoDB Atlas 가입 및 설정**
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 가입
   - 무료 클러스터 생성
   - 데이터베이스 유저 생성
   - 네트워크 액세스 설정 (IP 주소 추가)

2. **연결 문자열 복사**
   - Atlas 대시보드에서 "Connect" → "Connect your application" 클릭
   - 연결 문자열 복사 (password 부분은 실제 비밀번호로 교체)

3. **프로젝트 설정**
   ```bash
   # 프로젝트 폴더로 이동
   cd taskflow

   # 의존성 설치
   npm install

   # 환경 변수 파일 생성 (.env)
   echo "MONGODB_URI=mongodb+srv://username:password@cluster-url/taskflow?retryWrites=true&w=majority" > .env
   echo "JWT_SECRET=your-secret-key-here" >> .env
   echo "PORT=3000" >> .env

   # 서버 시작
   npm start
   ```

### 3. 개발 환경 실행

```bash
# 개발 모드로 실행 (코드 변경 시 자동 재시작)
npm run dev
```

### 4. 애플리케이션 접속

서버가 성공적으로 시작되면 다음 주소로 접속하세요:

- **웹 애플리케이션**: [http://localhost:3000](http://localhost:3000)
- **API 기본 주소**: [http://localhost:3000/api](http://localhost:3000/api)

## 📁 프로젝트 구조

```
taskflow/
├── server.js              # Express 서버 메인 파일
├── package.json           # 프로젝트 의존성 및 스크립트
├── .env                   # 환경 변수 파일 (생성 필요)
├── models/                # 데이터 모델
│   ├── User.js           # 사용자 모델
│   └── Task.js           # 할 일 모델
├── routes/               # API 라우트
│   ├── auth.js           # 인증 관련 API
│   └── tasks.js          # 할 일 관련 API
└── public/               # 프론트엔드 정적 파일
    ├── index.html        # 메인 HTML 파일
    ├── css/
    │   └── style.css     # 커스텀 스타일시트
    └── js/
        └── app.js        # 프론트엔드 JavaScript
```

## 🔧 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# MongoDB 연결 문자열
MONGODB_URI=mongodb://localhost:27017/taskflow

# JWT 시크릿 키 (보안을 위해 강력한 값으로 변경)
JWT_SECRET=your-super-secret-jwt-key-here

# 서버 포트
PORT=3000

# 환경 (개발/프로덕션)
NODE_ENV=development
```

## 📚 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

### 할 일 API
- `GET /api/tasks` - 할 일 목록 조회
- `POST /api/tasks` - 새 할 일 생성
- `GET /api/tasks/:id` - 특정 할 일 조회
- `PUT /api/tasks/:id` - 할 일 수정
- `DELETE /api/tasks/:id` - 할 일 삭제
- `GET /api/tasks/stats` - 통계 정보 조회
- `DELETE /api/tasks/completed` - 완료된 할 일 일괄 삭제

## 🧪 테스트 방법

### 1. API 테스트 (curl 사용)

```bash
# 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트사용자","email":"test@example.com","password":"123456"}'

# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 할 일 생성 (로그인 후 받은 토큰 사용)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"새 할 일","category":"업무","priority":3}'
```

### 2. 브라우저 테스트

1. 웹 브라우저로 [http://localhost:3000](http://localhost:3000) 접속
2. 회원가입 → 로그인 → 할 일 추가/수정/삭제 테스트

## 🐛 문제 해결

### 1. MongoDB 연결 오류

```bash
# MongoDB가 실행 중인지 확인
mongod --version

# MongoDB 서버 상태 확인 (Linux/macOS)
sudo systemctl status mongod

# MongoDB 서버 시작
sudo systemctl start mongod
```

### 2. 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000

# 다른 포트로 서버 시작
PORT=3001 npm start
```

### 3. 의존성 설치 오류

```bash
# 캐시 삭제 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🚀 배포 방법

### 1. Heroku 배포

```bash
# Heroku CLI 설치 후 로그인
heroku login

# Heroku 앱 생성
heroku create your-app-name

# 환경 변수 설정
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# 배포
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a your-app-name
git push heroku master
```

### 2. Docker 배포

```bash
# Dockerfile 생성
# (별도 Dockerfile 필요)

# 이미지 빌드
docker build -t taskflow .

# 컨테이너 실행
docker run -p 3000:3000 -e MONGODB_URI=your-mongodb-uri taskflow
```

## 📝 라이센스

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다.

## 🤝 기여 방법

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. 풀 리퀘스트 생성

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.

---

**TaskFlow**: 간단하지만 강력한 개인 업무 관리 솔루션