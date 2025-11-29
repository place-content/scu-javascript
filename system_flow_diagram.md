# TaskFlow 시스템 흐름도

## 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "프론트엔드 (Client)"
        A[사용자] --> B[HTML/JavaScript<br>index.html, app.js]
        B --> C[Local Storage<br>토큰 저장]
        B --> D[Bootstrap UI<br>사용자 인터페이스]
    end

    subgraph "네트워크 계층"
        E[HTTP/HTTPS<br>REST API]
    end

    subgraph "백엔드 서버 (Express.js)"
        F[서버 진입점<br>server.js]
        G[미들웨어<br>CORS, JSON 파싱, 로깅]
        H[라우팅 계층<br>/api/auth, /api/tasks]
        I[인증 미들웨어<br>JWT 검증]
        J[에러 핸들러<br>전역 오류 처리]
    end

    subgraph "데이터 계층"
        K[MongoDB<br>데이터베이스]
        L[User 모델<br>users 컬렉션]
        M[Task 모델<br>tasks 컬렉션]
    end

    subgraph "보안 계층"
        N[bcrypt<br>비밀번호 해싱]
        O[JWT<br>인증 토큰]
    end

    B -- HTTP 요청 --> E
    E -- REST API --> F
    F -- 미들웨어 처리 --> G
    G -- 라우팅 --> H
    H -- 인증 필요 시 --> I
    H -- 데이터베이스 작업 --> K
    K -- 사용자 데이터 --> L
    K -- 할 일 데이터 --> M
    K -- 보안 처리 --> N
    K -- 토큰 관리 --> O
    K -- 응답 --> J
    J -- 최종 응답 --> E
    E -- JSON 응답 --> B
```

## 인증 흐름도

```mermaid
sequenceDiagram
    participant U as 사용자
    participant C as 클라이언트<br>(app.js)
    participant S as 서버<br>(server.js)
    participant A as 인증 라우터<br>(auth.js)
    participant UM as User 모델
    participant DB as MongoDB
    participant LS as Local Storage

    Note over U,DB: 1. 회원가입 흐름
    U->>C: 회원가입 정보 입력
    C->>S: POST /api/auth/register
    S->>A: 라우팅
    A->>UM: 이메일 중복 확인
    UM->>DB: 사용자 조회
    DB-->>UM: 조회 결과
    UM-->>A: 중복 여부
    A->>UM: 새 사용자 생성
    UM->>DB: 사용자 저장 (비밀번호 해싱)
    DB-->>UM: 생성된 사용자
    UM-->>A: 사용자 정보
    A-->>S: JWT 토큰 생성
    S-->>C: 토큰 + 사용자 정보
    C->>LS: 토큰/사용자 정보 저장
    C-->>U: 가입 성공, 메인 화면

    Note over U,DB: 2. 로그인 흐름
    U->>C: 로그인 정보 입력
    C->>S: POST /api/auth/login
    S->>A: 라우팅
    A->>UM: 사용자 조회
    UM->>DB: 사용자 정보 조회
    DB-->>UM: 사용자 데이터
    UM-->>A: 사용자 정보
    A->>A: 비밀번호 검증 (bcrypt)
    A-->>S: JWT 토큰 생성
    S-->>C: 토큰 + 사용자 정보
    C->>LS: 토큰 저장
    C-->>U: 로그인 성공, 메인 화면

    Note over U,DB: 3. 로그아웃 흐름
    U->>C: 로그아웃 클릭
    C->>S: POST /api/auth/logout (선택적)
    C->>LS: 토큰/사용자 정보 삭제
    C-->>U: 로그인 화면으로 이동
```

## 할 일 관리 흐름도

```mermaid
sequenceDiagram
    participant U as 사용자
    participant C as 클라이언트<br>(app.js)
    participant S as 서버<br>(server.js)
    participant T as Task 라우터<br>(tasks.js)
    participant TM as Task 모델
    participant DB as MongoDB
    participant LS as Local Storage

    Note over U,DB: 1. 할 일 목록 조회
    U->>C: 화면 로드/필터링
    C->>LS: JWT 토큰 확인
    C->>S: GET /api/tasks (토큰 포함)
    S->>S: JWT 토큰 검증
    S->>T: 라우팅
    T->>TM: 사용자별 할 일 조회
    TM->>DB: tasks 컬렉션 조회 (필터링)
    DB-->>TM: 할 일 목록
    TM-->>T: 조회된 할 일들
    T-->>S: JSON 응답
    S-->>C: 할 일 목록
    C-->>U: 목록 렌더링

    Note over U,DB: 2. 할 일 생성
    U->>C: 새 할 일 입력 및 제출
    C->>S: POST /api/tasks (할 일 데이터)
    S->>S: JWT 토큰 검증
    S->>T: 라우팅
    T->>TM: 새 할 일 객체 생성
    TM->>TM: 유효성 검사
    TM->>DB: tasks 컬렉션에 저장
    DB-->>TM: 생성된 할 일
    TM-->>T: 저장된 할 일 정보
    T-->>S: 생성 성공 응답
    S-->>C: 할 일 정보
    C-->>U: 목록에 새 할 일 추가

    Note over U,DB: 3. 할 일 상태 변경 (완료/미완료)
    U->>C: 할 일 완료 체크박스 클릭
    C->>S: PUT /api/tasks/:id (completed 상태)
    S->>S: JWT 토큰 검증
    S->>T: 라우팅
    T->>TM: 할 일 상태 업데이트
    TM->>DB: completed 필드 수정
    TM->>TM: completedAt 자동 설정
    DB-->>TM: 업데이트된 할 일
    TM-->>T: 업데이트 결과
    T-->>S: 성공 응답
    S-->>C: 업데이트 확인
    C-->>U: 할 일 상태 변경 표시
```

## 데이터 모델 관계도

```mermaid
erDiagram
    USER {
        ObjectId _id PK "고유 ID"
        String email UK "이메일 (고유)"
        String password "암호화된 비밀번호"
        String name "사용자 이름"
        String subscription "구독 플랜"
        Boolean isActive "활성화 상태"
        Date createdAt "생성일"
        Date updatedAt "수정일"
    }

    TASK {
        ObjectId _id PK "고유 ID"
        ObjectId userId FK "사용자 ID 참조"
        String title "할 일 제목"
        String description "할 일 설명"
        String category "카테고리"
        Number priority "우선순위 (1-5)"
        Date dueDate "마감일"
        Boolean completed "완료 상태"
        Date completedAt "완료일"
        Array tags "태그 목록"
        Date createdAt "생성일"
        Date updatedAt "수정일"
    }

    USER ||--o{ TASK : "1:N 관계"
    USER :+ userId FK
    TASK :+ userId FK
```

## 상세 API 흐름도

```mermaid
graph TD
    A[클라이언트 요청] --> B{요청 종류}

    B -->|인증 요청| C[/api/auth/*]
    B -->|할 일 요청| D[/api/tasks/*]
    B -->|기타 요청| E[/api/health, /]

    C --> C1[POST /register - 회원가입]
    C --> C2[POST /login - 로그인]
    C --> C3[POST /logout - 로그아웃]
    C --> C4[GET /profile - 프로필]

    C1 --> F[User 모델 → MongoDB]
    C2 --> G[User 모델 → JWT 생성]
    C3 --> H[토큰 무효화]
    C4 --> I[User 모델 조회]

    D --> D1[GET /tasks - 목록 조회]
    D --> D2[POST /tasks - 할 일 생성]
    D --> D3[PUT /tasks/:id - 수정]
    D --> D4[DELETE /tasks/:id - 삭제]
    D --> D5[GET /tasks/stats - 통계]
    D --> D6[DELETE /tasks/completed - 완료된 일 삭제]

    D1 --> J[Task 모델 → 필터링/정렬]
    D2 --> K[Task 모델 → 유효성 검사]
    D3 --> L[Task 모델 → 업데이트]
    D4 --> M[Task 모델 → 삭제]
    D5 --> N[Task 모델 → 집계 통계]
    D6 --> O[Task 모델 → 일괄 삭제]

    F --> P[MongoDB 응답]
    G --> P
    I --> P
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    P --> Q[JSON 응답]
    Q --> R[클라이언트 업데이트]
```

## 에러 처리 흐름도

```mermaid
graph TD
    A[요청 수신] --> B{에러 발생?}

    B -->|아니오| C[정상 처리]
    B -->|예| D{에러 종류}

    D -->|ValidationError| E[400 - 유효성 검사 오류]
    D -->|JsonWebTokenError| F[401 - 토큰 오류]
    D -->|TokenExpiredError| G[401 - 토큰 만료]
    D -->|DuplicateKey| H[400 - 중복 데이터]
    D -->|기타 오류| I[500 - 서버 오류]

    E --> J[에러 메시지 포맷팅]
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[에러 응답 전송]
    C --> L[성공 응답 전송]

    K --> M[클라이언트 에러 처리]
    L --> N[클라이언트 성공 처리]

    M --> O[사용자 알림 표시]
    N --> P[UI 업데이트]
```