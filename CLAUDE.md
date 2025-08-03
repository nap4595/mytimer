# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 환경 및 실행 방법

### 로컬 실행
이 프로젝트는 순수 HTML/CSS/JavaScript로 구성된 정적 웹 애플리케이션입니다.

```bash
# 로컬 서버 실행 (Python)
cd src
python -m http.server 8000

# 또는 Node.js 글로벌 서버
npx serve src

# 브라우저에서 접속
http://localhost:8000
```

### 직접 실행
- `src/index.html` 파일을 브라우저에서 직접 열어도 모든 기능이 정상 작동

## 프로젝트 구조

```
MultiTimer/
├── src/
│   ├── index.html          # 메인 HTML (접근성 마크업 포함)
│   ├── styles.css          # CSS Grid 기반 반응형 스타일
│   ├── config.js           # 중앙화된 설정 관리 (CONFIG 패턴)
│   └── script.js           # 메인 JavaScript 로직
├── docs/
│   └── PRD_idea_timer.md   # 상세 기획 문서
└── README.md               # 프로젝트 가이드
```

## 핵심 아키텍처

### CONFIG 패턴 중앙 설정 관리
- `config.js`: 모든 설정값을 CONFIG 객체에서 중앙 관리
- `Object.freeze()`로 설정값 보호
- CONFIG_UTILS: 유틸리티 함수 제공

### 클래스 기반 상태 관리
- `MultiTimer` 클래스: 메인 애플리케이션 로직
- DOM 캐싱을 통한 성능 최적화
- AbortController를 활용한 메모리 누수 방지

### 성능 최적화 시스템
- 60fps 배치 렌더링 시스템 구현
- requestAnimationFrame 기반 업데이트
- DOM 조작 최소화 및 캐싱

## 주요 기능 모듈

### 타이머 프리셋 시스템
- 5개/10개/15개 타이머 동적 생성
- CSS Grid 기반 고정 레이아웃 (5개씩 한 줄)
- 동적 색상 할당 (20개 색상 순환)

### 시간 설정 인터페이스
- **드래그**: 막대를 드래그하여 직관적 시간 설정 (10초 단위 스냅)
- **클릭**: 모달을 통한 정밀 시간 입력 (분:초 형식)

### 타이머 실행 엔진
- `performance.now()` 기반 정확한 시간 추적
- 드리프트 보정 알고리즘 적용
- 독립적인 타이머 동작 보장

### 알림 시스템
- 시각적 깜빡임 효과 (1초 간격)
- Web Audio API 기반 사운드 생성
- Vibration API 활용 (지원 기기)

### 데이터 저장
- localStorage를 통한 자동 설정 저장
- 30초마다 자동 저장 실행
- 라벨, 자동 시작 설정, 최대 시간 등 보존

## 접근성 준수

### WCAG 2.1 AA 수준
- 스크린 리더 완전 지원
- 키보드 내비게이션 구현
- 고대비 모드 지원
- aria-label 및 role 속성 적용

### 키보드 단축키
- **스페이스바**: 전체 타이머 시작/정지
- **ESC**: 풀스크린 해제 또는 모달 닫기

## 개발 가이드라인

### 코드 수정 시 주의사항
1. CONFIG 객체는 frozen 상태이므로 직접 수정 불가
2. 새로운 설정은 `config.js`의 CONFIG 객체에 추가
3. DOM 요소는 domElements에 캐싱하여 재사용
4. 메모리 누수 방지를 위해 이벤트 리스너에 abortController 사용

### 코드 품질 가이드라인
1. **에러 처리**: 모든 DOM 조작과 사용자 입력에 try-catch 블록 사용
2. **성능 최적화**: CSS will-change 속성으로 애니메이션 성능 향상
3. **접근성**: 모든 입력 필드에 적절한 aria-label과 autocomplete 속성 추가
4. **브라우저 호환성**: CSS Grid에 대한 Flexbox fallback 제공
5. **오디오 처리**: AudioContext 지원 여부 확인 후 대체 방안 제공

### 디버깅 모드
`config.js`에서 디버그 모드 활성화:
```javascript
DEBUG: {
  ENABLED: true,
  LOG_TIMER_EVENTS: true,
  SHOW_PERFORMANCE_METRICS: true
}
```

### 브라우저 호환성
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- 필수 API: performance.now(), requestAnimationFrame, localStorage
- 선택적 API: Fullscreen, Vibration, Web Audio

## 주요 개발 패턴

### 타이머 생성 로직
- CSS Grid를 활용한 동적 레이아웃
- 색상은 CONFIG.COLORS.TIMER_COLORS 배열에서 순환 할당
- 각 타이머는 독립적인 상태와 DOM 요소 보유

### 시간 계산 및 표시
- 모든 시간은 초 단위로 내부 관리
- CONFIG_UTILS.formatTime()으로 표시 형식 통일
- 진행률은 백분율로 계산하여 CSS로 시각화

### 이벤트 시스템
- 터치와 마우스 이벤트 통합 처리
- 드래그와 클릭 구분을 위한 임계값 적용
- 모든 이벤트에 AbortController 연결

## 준수할 사항
- 작업을 수행한 후, Readme.md 와 Claude.md 에 해당하는 사항이 변경될 필요성이 있는지 여부를 평가하고, 해당 평가에 따라 수정사항을 반영할 것.

이 구조를 바탕으로 MultiTimer의 기능을 안전하게 수정하고 확장할 수 있습니다.