// TaskFlow UI/UX 디자인 PPT 구조
// 이 파일을 사용하여 실제 PowerPoint 파일 생성에 필요한 데이터 구조를 제공합니다

const taskFlowPresentation = {
  title: "TaskFlow UI/UX 디자인",
  subtitle: "개인 업무 관리 애플리케이션 UI/UX 디자인",
  author: "Design Team",
  date: new Date().toLocaleDateString("ko-KR"),

  slides: [
    {
      title: "제목",
      content: {
        mainTitle: "TaskFlow",
        subtitle: "개인 업무 관리 애플리케이션",
        description: "사용자 중심의 직관적인 할 일 관리 솔루션",
        visualElements: ["gradient background", "logo icon", "minimal design"],
      },
      design: {
        layout: "title-slide",
        background: "gradient #667eea to #764ba2",
        textColor: "white",
        fontFamily: "Noto Sans KR",
      },
    },
    {
      title: "프로젝트 개요",
      content: {
        projectIntro: {
          title: "TaskFlow 소개",
          points: [
            "간단하고 직관적인 개인 업무 관리",
            "웹 기반 크로스 플랫폼",
            "실시간 동기화",
            "모바일 최적화",
          ],
        },
        mainFeatures: {
          title: "주요 기능",
          points: [
            "사용자 인증 (회원가입/로그인)",
            "할 일 CRUD",
            "카테고리 및 우선순위 관리",
            "마감일 알림",
            "통계 및 분석",
          ],
        },
      },
      design: {
        layout: "two-column",
        background: "white",
        accentColor: "#667eea",
      },
    },
    {
      title: "로그인 화면 디자인",
      content: {
        description: "사용자 친화적인 로그인 인터페이스",
        features: [
          "그라데이션 배경 (#667eea → #764ba2)",
          "중앙 정렬 카드 레이아웃",
          "아이콘과 텍스트 조화",
          "부드러운 애니메이션",
        ],
        elements: [
          "로고와 서비스명",
          "이메일 입력 필드 (envelope 아이콘)",
          "비밀번호 입력 필드 (lock 아이콘)",
          "로그인 버튼",
          "회원가입 전환 링크",
        ],
      },
      design: {
        layout: "feature-showcase",
        mockup: "login-screen-mockup",
        colorScheme: ["primary", "white", "light-gray"],
      },
    },
    {
      title: "메인 대시보드",
      content: {
        description: "한눈에 보이는 정보 구조",
        components: [
          "상단 네비게이션 바 (사용자 정보, 로그아웃)",
          "통계 카드 3개 (전체 할 일, 완료된 할 일, 진행률)",
          "새 할 일 추가 섹션",
          "필터링 옵션",
          "할 일 목록",
        ],
        uxPoints: [
          "한눈에 보이는 통계",
          "빠른 할 일 추가 기능",
          "효율적인 필터링",
          "직관적인 목록 표시",
        ],
      },
      design: {
        layout: "dashboard-showcase",
        mockup: "main-dashboard-mockup",
        visualElements: [
          "stats-cards",
          "task-form",
          "filter-controls",
          "task-list",
        ],
      },
    },
    {
      title: "통계 시각화",
      content: {
        cards: [
          {
            title: "전체 할 일",
            color: "#17a2b8",
            icon: "list-task",
            description: "사용자의 전체 작업량",
          },
          {
            title: "완료된 할 일",
            color: "#28a745",
            icon: "check-circle",
            description: "완료된 작업의 수",
          },
          {
            title: "진행률",
            color: "#ffc107",
            icon: "percent",
            description: "전체 완료율",
          },
        ],
        designPrinciples: [
          "색상 구분을 통한 직관적인 인식",
          "그라데이션 효과로 시각적 깊이감",
          "아이콘을 통한 빠른 이해",
          "호버 효과로 인터랙티브함",
        ],
      },
      design: {
        layout: "cards-showcase",
        visualStyle: "gradient-cards",
        animation: "slide-up",
      },
    },
    {
      title: "할 일 목록 디자인",
      content: {
        description: "카드 기반 리스트 UI",
        itemStructure: [
          "체크박스: 완료 상태",
          "제목과 설명",
          "카테고리 배지",
          "우선순위 배지",
          "마감일 표시",
          "수정/삭제 버튼",
        ],
        visualDistinctions: [
          "완료 상태: 투명도, 취소선",
          "우선순위: 왼쪽 테두리 색상",
          "마감일: 배지 색상으로 긴급성 표시",
          "호버: 카드 이동, 그림자 효과",
        ],
      },
      design: {
        layout: "list-showcase",
        mockup: "task-list-mockup",
        interactions: [
          "hover-effect",
          "checkbox-animation",
          "status-indicators",
        ],
      },
    },
    {
      title: "디자인 시스템",
      content: {
        colorPalette: {
          primary: ["#667eea", "#764ba2"],
          semantic: {
            success: "#28a745",
            info: "#17a2b8",
            warning: "#ffc107",
            danger: "#dc3545",
            secondary: "#6c757d",
          },
        },
        typography: {
          fontFamily: "Noto Sans KR",
          weights: {
            light: 300,
            regular: 400,
            bold: 700,
          },
          scales: {
            heading: ["2.5rem", "2rem", "1.5rem"],
            body: ["1.1rem", "1rem", "0.875rem"],
            caption: "0.75rem",
          },
        },
        components: {
          button: {
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            effects: ["gradient", "hover-lift", "shadow"],
          },
          card: {
            borderRadius: "8px",
            padding: "1.5rem",
            effects: ["shadow", "hover-lift", "transition"],
          },
        },
      },
      design: {
        layout: "system-showcase",
        sections: ["colors", "typography", "components", "spacing"],
      },
    },
    {
      title: "반응형 디자인",
      content: {
        breakpoints: [
          {
            name: "데스크톱",
            width: "1200px+",
            layout: "3-column",
            features: ["full-features", "wide-layout", "maximized-ui"],
          },
          {
            name: "태블릿",
            width: "768px - 1199px",
            layout: "2-column",
            features: ["adapted-layout", "medium-ui", "responsive-touch"],
          },
          {
            name: "모바일",
            width: "576px - 767px",
            layout: "1-column",
            features: ["full-width", "touch-optimized", "vertical-stack"],
          },
        ],
        optimizationPoints: [
          "유동 그리드: Flexbox와 Grid 활용",
          "유연한 이미지: max-width: 100% 적용",
          "터치 친화적: 최소 44px 버튼 크기",
          "미디어 쿼리: 중단점별 스타일 조정",
        ],
      },
      design: {
        layout: "responsive-showcase",
        visualElements: ["device-mockups", "breakpoint-comparison"],
      },
    },
    {
      title: "향후 개선 방향",
      content: {
        shortTerm: {
          title: "🚀 단기 개선안",
          items: ["검색 기능 추가", "드래그 앤 드롭", "푸시 알림", "음성 입력"],
        },
        mediumTerm: {
          title: "🎯 중기 개선안",
          items: ["칸반 보드", "팀 기능", "파일 첨부", "데이터 시각화"],
        },
        longTerm: {
          title: "🌟 장기 개선안",
          items: [
            "AI 추천 시스템",
            "캘린더 연동",
            "오프라인 모드",
            "다국어 지원",
          ],
        },
      },
      design: {
        layout: "roadmap-showcase",
        colorCoding: ["short-term", "medium-term", "long-term"],
      },
    },
    {
      title: "감사합니다",
      content: {
        mainMessage: "TaskFlow UI/UX 디자인",
        subMessage: "사용자 중심의 직관적인 할 일 관리 경험",
        coreValues: [
          "TaskFlow는 단순한 할 일 관리 앱을 넘어",
          "사용자의 생산성을 높이는 파트너입니다.",
          "직관적인 디자인과 강력한 기능으로",
          "최고의 사용자 경험을 제공합니다.",
        ],
        techStack: {
          frontend: ["HTML5", "CSS3", "JavaScript ES6+", "Bootstrap 5"],
          backend: ["Node.js", "Express.js", "MongoDB", "JWT"],
          security: ["bcrypt", "CORS", "XSS Protection", "HTTPS"],
        },
      },
      design: {
        layout: "thank-you-slide",
        background: "gradient #667eea to #764ba2",
        textColor: "white",
        accentElements: ["icon-large", "value-proposition", "tech-stack"],
      },
    },
  ],

  // 실제 PowerPoint 파일 생성을 위한 메타데이터
  metadata: {
    template: "modern-minimal",
    theme: {
      primaryColor: "#667eea",
      secondaryColor: "#764ba2",
      backgroundColor: "#ffffff",
      textColor: "#343a40",
      fontFamily: "Noto Sans KR",
    },
    animations: {
      slideTransition: "fade",
      elementAnimations: ["slide-in", "fade-in", "scale-up"],
      duration: "0.5s",
    },
    layout: {
      aspectRatio: "16:9",
      margin: "1in",
      headerHeight: "20%",
      contentHeight: "80%",
    },
  },
};

// PowerPoint 생성 도구와 함께 사용할 수 있는 JSON 내보내기
module.exports = taskFlowPresentation;

// 브라우저 환경에서 사용할 수 있도록 전역 변수로 설정
if (typeof window !== "undefined") {
  window.TaskFlowPresentation = taskFlowPresentation;
}
