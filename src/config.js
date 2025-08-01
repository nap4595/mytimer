// MultiTimer 앱 설정 파일 - CONFIG 패턴 적용

const CONFIG = {
  // 타이머 기본 설정
  TIMERS: {
    COUNT: 5,
    MIN_TIME: 60, // 1분 (초)
    DEFAULT_MAX_TIME: 1800, // 30분 (초)
    MAX_TIME_OPTIONS: [
      { value: 600, label: '10분' },
      { value: 900, label: '15분' },
      { value: 1800, label: '30분' },
      { value: 2700, label: '45분' },
      { value: 3600, label: '60분' }
    ],
    DEFAULT_LABELS: [
      '타이머 1',
      '타이머 2', 
      '타이머 3',
      '타이머 4',
      '타이머 5'
    ]
  },

  // 색상 설정
  COLORS: {
    TIMER_1: '#FF6B6B',
    TIMER_2: '#4ECDC4', 
    TIMER_3: '#45B7D1',
    TIMER_4: '#FFA726',
    TIMER_5: '#AB47BC',
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
    AUTO_SAVE_SETTINGS: true
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
    DEBOUNCE_DELAY: 300 // 300ms 디바운스
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
Object.freeze(CONFIG.MESSAGES);
Object.freeze(CONFIG.DEBUG);

// 유틸리티 함수들
const CONFIG_UTILS = {
  // 타이머 색상 가져오기
  getTimerColor: (timerId) => {
    const colorKey = `TIMER_${timerId + 1}`;
    return CONFIG.COLORS[colorKey] || CONFIG.COLORS.TIMER_1;
  },

  // 타이머 사운드 가져오기
  getTimerSound: (timerId) => {
    const soundKey = `TIMER_${timerId + 1}`;
    return CONFIG.SOUNDS[soundKey] || CONFIG.SOUNDS.TIMER_1;
  },

  // 타이머 기본 라벨 가져오기
  getTimerLabel: (timerId) => {
    return CONFIG.TIMERS.DEFAULT_LABELS[timerId] || `타이머 ${timerId + 1}`;
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