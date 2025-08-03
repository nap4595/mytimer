/**
 * MultiTimer 애플리케이션 설정 파일
 * 
 * @fileoverview 중앙화된 설정 관리 시스템
 * @version 1.2.1
 * @author MultiTimer Team
 * @since 2024-01-01
 * 
 * @description
 * 이 파일은 MultiTimer 애플리케이션의 모든 설정값을 관리합니다.
 * CONFIG 객체는 불변(frozen)으로 설정되어 실수로 수정되는 것을 방지합니다.
 * 
 * 주요 설정 영역:
 * - TIMERS: 타이머 기본 설정 및 프리셋
 * - COLORS: 색상 팔레트 및 테마
 * - UI: 레이아웃, 애니메이션, 인터랙션
 * - PERFORMANCE: 성능 최적화 설정
 * - FEATURES: 기능 토글 스위치
 * 
 * @example
 * // 설정값 사용
 * const maxTime = CONFIG.TIMERS.DEFAULT_MAX_TIME;
 * const timerColor = CONFIG_UTILS.getTimerColor(0);
 * 
 * @example
 * // 브라우저 지원 확인
 * const support = CONFIG_UTILS.checkBrowserSupport();
 * if (support.fullscreen) {
 *   // 풀스크린 기능 활성화
 * }
 */

const CONFIG = {
  // 타이머 기본 설정
  TIMERS: {
    COUNT: 5,                    // 기본 타이머 개수
    PRESET_COUNTS: [5, 10, 15],  // 사용 가능한 프리셋 개수
    MIN_COUNT: 5,                // 최소 타이머 개수  
    MAX_COUNT: 15,               // 최대 타이머 개수
    TIMERS_PER_ROW: 5,           // 한 줄당 타이머 개수 (고정)
    MIN_TIME: 1,                 // 1초
    DEFAULT_MAX_TIME: 1800,      // 30분 (초)
    MAX_TIME_OPTIONS: [
      { value: 600, label: '10분' },
      { value: 900, label: '15분' },
      { value: 1800, label: '30분' },
      { value: 2700, label: '45분' },
      { value: 3600, label: '60분' }
    ],
    DEFAULT_LABELS: [
      '1',
      '2', 
      '3',
      '4',
      '5'
    ],
    // 프리셋별 레이아웃 설정
    LAYOUT_PRESETS: {
      5: { rows: 1, columns: 5, description: '5개 (1행)' },
      10: { rows: 2, columns: 5, description: '10개 (2행)' },
      15: { rows: 3, columns: 5, description: '15개 (3행)' }
    }
  },

  // 색상 설정
  COLORS: {
    TIMER_1: '#FF6B6B',
    TIMER_2: '#4ECDC4', 
    TIMER_3: '#45B7D1',
    TIMER_4: '#FFA726',
    TIMER_5: '#AB47BC',
    // 동적 타이머를 위한 색상 배열 (순환 사용)
    TIMER_COLORS: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC',
      '#28A745', '#DC3545', '#6F42C1', '#FD7E14', '#20C997',
      '#6C757D', '#E91E63', '#FF1744', '#00E676', '#2979FF',
      '#FF5722', '#9C27B0', '#4CAF50', '#FFC107', '#00BCD4'
    ],
    BACKGROUND: '#F8F9FA',
    PANEL_BG: '#FFFFFF',
    TEXT: '#212529',
    TEXT_LIGHT: '#6C757D',
    BORDER: '#DEE2E6'
  },

  // 사운드 설정
  SOUNDS: {
    TIMER_1: 'bell.mp3',
    TIMER_2: 'chime.mp3',
    TIMER_3: 'beep.mp3', 
    TIMER_4: 'ding.mp3',
    TIMER_5: 'alert.mp3',
    VOLUME: 0.7,
    DURATION: 5000 // 5초
  },

  // UI 레이아웃 설정
  UI: {
    LAYOUT: {
      LEFT_PANEL_WIDTH: '15%',
      TIMER_AREA_WIDTH: '70%',
      RIGHT_PANEL_WIDTH: '15%'
    },
    ANIMATION: {
      BLINK_INTERVAL: 1000, // 1초
      CLICK_FEEDBACK: 100, // 0.1초
      TRANSITION_FAST: 150, // 0.15초
      TRANSITION_SMOOTH: 300 // 0.3초
    },
    TOUCH: {
      MIN_TOUCH_SIZE: 44, // 44px 최소 터치 영역
      DRAG_THRESHOLD: 5 // 5px 드래그 감지 임계값
    },
    INTERACTION: {
      CLICK_DURATION_MAX: 500, // 클릭으로 인정할 최대 시간 (ms)
      DRAG_END_DELAY: 100, // 드래그 종료 후 클릭 방지 시간 (ms)
      MODAL_CLOSE_DELAY: 300, // 모달 닫기 애니메이션 시간 (ms)
      BUTTON_SCALE_ACTIVE: 0.95, // 버튼 클릭 시 스케일
      BUTTON_SCALE_HOVER: 1.05 // 버튼 호버 시 스케일
    },
    VALIDATION: {
      LABEL_MAX_LENGTH: 10, // 라벨 최대 길이
      TIME_INPUT_MAX_HOURS: 23, // 시간 입력 최대값
      TIME_INPUT_MAX_MINUTES: 59, // 분 입력 최대값
      TIME_INPUT_MAX_SECONDS: 59 // 초 입력 최대값
    }
  },

  // 기능 설정
  FEATURES: {
    FULLSCREEN_ENABLED: true,
    ROTATION_LOCK_ENABLED: true,
    KEYBOARD_SHORTCUTS: true,
    TOUCH_FEEDBACK: true,
    AUTO_SAVE_SETTINGS: false,
    AUTO_START_ENABLED: true, // 시간 설정 시 자동 시작 기본값
    SELECTED_SOUND: 'TIMER_1', // 선택된 종료음
    DYNAMIC_TIMER_COUNT: true // 동적 타이머 개수 변경 허용
  },

  // 시간 형식 설정
  TIME_FORMAT: {
    DISPLAY_MODE: 'remaining', // 'remaining' 또는 'elapsed'
    SHOW_SECONDS: true,
    SHOW_HOURS: false, // 1시간 이상일 때만 표시
    SEPARATOR: ':'
  },

  // 드래그 설정
  DRAG: {
    SNAP_TO_MINUTES: true, // 10초 단위로 스냅 (변수명은 호환성을 위해 유지)
    SHOW_PREVIEW: true, // 드래그 중 시간 미리보기
    SMOOTH_ANIMATION: true
  },

  // 알림 설정
  NOTIFICATIONS: {
    BLINK_ENABLED: true,
    SOUND_ENABLED: true,
    VIBRATION_ENABLED: true, // 지원 기기에서만
    AUTO_DISMISS: false // 자동으로 알림 해제 안 함
  },

  // 저장소 키 (localStorage)
  STORAGE_KEYS: {
    TIMER_SETTINGS: 'multitimer_settings',
    USER_PREFERENCES: 'multitimer_preferences',
    TIMER_LABELS: 'multitimer_labels',
    LAST_MAX_TIME: 'multitimer_max_time'
  },

  // 성능 설정
  PERFORMANCE: {
    UPDATE_INTERVAL: 100, // 100ms마다 UI 업데이트
    TIMER_PRECISION: 1000, // 1초 정밀도
    DEBOUNCE_DELAY: 300, // 300ms 디바운스
    AUTO_SAVE_INTERVAL: 30000 // 30초마다 자동 저장
  },

  // UI 상수
  UI_CONSTANTS: {
    PERCENTAGE_MAX: 100,
    SNAP_UNIT_SECONDS: 10, // 드래그 시 10초 단위 스냅
    LABEL_MAX_LENGTH: 10,
    NOTIFICATION_DURATION: 3000, // 알림 표시 시간 (ms)
    ANIMATION_DELAY: 300 // 기본 애니메이션 지연 시간
  },

  // 에러 메시지
  MESSAGES: {
    ERROR: {
      INVALID_TIME: '올바른 시간을 입력해주세요.',
      MAX_TIME_EXCEEDED: '최대 시간을 초과했습니다.',
      BROWSER_NOT_SUPPORTED: '이 브라우저는 일부 기능을 지원하지 않습니다.',
      AUDIO_LOAD_FAILED: '알림음을 불러올 수 없습니다.'
    },
    SUCCESS: {
      TIMER_STARTED: '타이머가 시작되었습니다.',
      TIMER_COMPLETED: '타이머가 완료되었습니다.',
      SETTINGS_SAVED: '설정이 저장되었습니다.'
    },
    INFO: {
      FULLSCREEN_HINT: 'ESC 키를 눌러 풀스크린을 해제할 수 있습니다.',
      DRAG_HINT: '막대를 드래그하거나 클릭하여 시간을 설정하세요.'
    }
  },

  // 개발 모드 설정
  DEBUG: {
    ENABLED: false, // 프로덕션에서는 false
    LOG_TIMER_EVENTS: false,
    LOG_USER_INTERACTIONS: false,
    SHOW_PERFORMANCE_METRICS: false
  }
};

// CONFIG 객체를 불변으로 만들어 실수로 수정되는 것을 방지
Object.freeze(CONFIG);
Object.freeze(CONFIG.TIMERS);
Object.freeze(CONFIG.COLORS);
Object.freeze(CONFIG.SOUNDS);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.TIME_FORMAT);
Object.freeze(CONFIG.DRAG);
Object.freeze(CONFIG.NOTIFICATIONS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.PERFORMANCE);
Object.freeze(CONFIG.UI_CONSTANTS);
Object.freeze(CONFIG.MESSAGES);
Object.freeze(CONFIG.DEBUG);

// 유틸리티 함수들
const CONFIG_UTILS = {
  // 타이머 색상 가져오기 (동적 색상 순환)
  getTimerColor: (timerId) => {
    return CONFIG.COLORS.TIMER_COLORS[timerId % CONFIG.COLORS.TIMER_COLORS.length];
  },

  // 타이머 사운드 가져오기 (선택된 소리 사용)
  getTimerSound: (timerId) => {
    return CONFIG.SOUNDS[CONFIG.FEATURES.SELECTED_SOUND] || CONFIG.SOUNDS.TIMER_1;
  },

  // 타이머 기본 라벨 가져오기
  getTimerLabel: (timerId) => {
    return CONFIG.TIMERS.DEFAULT_LABELS[timerId] || `${timerId + 1}`;
  },

  // 시간 형식 변환 (초 → mm:ss 또는 hh:mm:ss)
  formatTime: (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0 || CONFIG.TIME_FORMAT.SHOW_HOURS) {
      return `${hours.toString().padStart(2, '0')}${CONFIG.TIME_FORMAT.SEPARATOR}${minutes.toString().padStart(2, '0')}${CONFIG.TIME_FORMAT.SEPARATOR}${secs.toString().padStart(2, '0')}`;
    }
    
    if (CONFIG.TIME_FORMAT.SHOW_SECONDS) {
      return `${minutes.toString().padStart(2, '0')}${CONFIG.TIME_FORMAT.SEPARATOR}${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}분`;
  },

  // 최대 시간 옵션 검증
  isValidMaxTime: (seconds) => {
    return CONFIG.TIMERS.MAX_TIME_OPTIONS.some(option => option.value === seconds);
  },

  // 브라우저 기능 지원 확인
  checkBrowserSupport: () => {
    return {
      fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled),
      vibration: 'vibrate' in navigator,
      localStorage: 'localStorage' in window,
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window
    };
  },

  // 디버그 로그 (개발 모드에서만)
  debugLog: (message, data = null) => {
    if (CONFIG.DEBUG.ENABLED) {
      console.log(`[MultiTimer Debug] ${message}`, data);
    }
  },

  // 성능 측정 (개발 모드에서만)
  measurePerformance: (label, fn) => {
    if (CONFIG.DEBUG.SHOW_PERFORMANCE_METRICS) {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  }
};

// 유틸리티 객체도 불변으로 만들기
Object.freeze(CONFIG_UTILS);

// 전역으로 CONFIG와 유틸리티 함수들을 사용할 수 있도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, CONFIG_UTILS };
} else {
  window.CONFIG = CONFIG;
  window.CONFIG_UTILS = CONFIG_UTILS;
}