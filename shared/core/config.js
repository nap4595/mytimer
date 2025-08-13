/**
 * Multi-Utility Application Configuration File
 *
 * @fileoverview Centralized configuration management system for the platform.
 * @version 2.0.0
 */

export const CONFIG = {
  // Application Details
  APP: {
    NAME: 'MultiUtilities',
    VERSION: '2.0.0',
    BASE_PATH: window.location.hostname === 'nap4595.github.io' ? '/mytimer' : ''
  },

  // Routing Configuration
  ROUTING: {
    BASE_PATH: '/',
    APPS: {
      MULTITIMER: '/apps/multitimer/',
      MULTICOUNT: '/apps/multicount/'
    }
  },

  // Timer App Specific Settings
  TIMERS: {
    COUNT: 5,
    PRESET_COUNTS: [5, 10, 15],
    MIN_COUNT: 5,
    MAX_COUNT: 15,
    TIMERS_PER_ROW: 5,
    MIN_TIME: 1,
    DEFAULT_MAX_TIME: 1800,
    MAX_TIME_OPTIONS: [
      { value: 600, label: '10분' },
      { value: 900, label: '15분' },
      { value: 1800, label: '30분' },
      { value: 2700, label: '45분' },
      { value: 3600, label: '60분' }
    ],
    DEFAULT_LABELS: ['1', '2', '3', '4', '5'],
    LAYOUT_PRESETS: {
      5: { rows: 1, columns: 5, description: '5개 (1행)' },
      10: { rows: 2, columns: 5, description: '10개 (2행)' },
      15: { rows: 3, columns: 5, description: '15개 (3행)' }
    }
  },

  // Time Format Settings
  TIME_FORMAT: {
    SHOW_HOURS: false,
    SHOW_SECONDS: true,
    SEPARATOR: ':'
  },

  // Theme System
  THEMES: {
    DEFAULT: 'COLOR',
    AVAILABLE: ['COLOR', 'MINIMAL'],
    // Color Theme
    COLOR: {
      NAME: '컬러 테마',
      TIMER_COLOR_TABLE: {
        1: '#FF6B6B', 2: '#4ECDC4', 3: '#45B7D1', 4: '#FFA726', 5: '#AB47BC',
        6: '#28A745', 7: '#DC3545', 8: '#6F42C1', 9: '#FD7E14', 10: '#20C997',
        11: '#6C757D', 12: '#E91E63', 13: '#FF1744', 14: '#00E676', 15: '#2979FF'
      },
      BACKGROUND: '#F8F9FA',
      PANEL_BG: '#FFFFFF',
      TEXT: '#212529',
      TEXT_LIGHT: '#6C757D',
      BORDER: '#DEE2E6'
    },
    // Minimal Theme
    MINIMAL: {
      NAME: '미니멀 테마',
      TIMER_COLOR_TABLE: {
        1: '#6B7280', 2: '#6B7280', 3: '#6B7280', 4: '#6B7280', 5: '#6B7280',
        6: '#6B7280', 7: '#6B7280', 8: '#6B7280', 9: '#6B7280', 10: '#6B7280',
        11: '#6B7280', 12: '#6B7280', 13: '#6B7280', 14: '#6B7280', 15: '#6B7280'
      },
      BACKGROUND: '#FFFFFF',
      PANEL_BG: '#FAFAFA',
      TEXT: '#374151',
      TEXT_LIGHT: '#9CA3AF',
      BORDER: '#E5E7EB'
    }
  },

  // Sound Settings
  SOUNDS: {
    DEFAULT_SOUND: 'bell.mp3',
    OPTIONS: {
      'bell.mp3': '벨 소리',
      'chime.mp3': '차임 소리',
      'beep.mp3': '비프 소리',
      'ding.mp3': '딩 소리',
      'alert.mp3': '알림 소리'
    },
    VOLUME: 0.7,
    DURATION: 5000
  },

  // UI Settings
  UI: {
    ANIMATION: {
      BLINK_INTERVAL: 1000,
      TRANSITION_FAST: 150,
      TRANSITION_SMOOTH: 300
    },
    TOUCH: {
      MIN_TOUCH_SIZE: 44,
      DRAG_THRESHOLD: 5
    },
    VALIDATION: {
      LABEL_MAX_LENGTH: 10,
      TIME_INPUT_MAX_HOURS: 23,
      TIME_INPUT_MAX_MINUTES: 59,
      TIME_INPUT_MAX_SECONDS: 59
    }
  },

  // Feature Flags & User Preferences
  FEATURES: {
    FULLSCREEN_ENABLED: true,
    KEYBOARD_SHORTCUTS: true,
    AUTO_START_ENABLED: false,
    SEQUENTIAL_EXECUTION: false,
    SEGMENTED_ANIMATION: false,
  },

  // Storage Keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'multiutility_preferences',
    TIMER_STATE: 'multitimer_state',
    COUNTER_STATE: 'multicounter_state'
  },

  // Performance Settings
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300
  },

  // UI Constants
  UI_CONSTANTS: {
    PERCENTAGE_MAX: 100,
    SNAP_UNIT_SECONDS: 10,
    NOTIFICATION_DURATION: 3000
  },

  // Messages
  MESSAGES: {
    ERROR: {
      INVALID_TIME: '올바른 시간을 입력해주세요.',
      MAX_TIME_EXCEEDED: '최대 시간을 초과했습니다.',
      BROWSER_NOT_SUPPORTED: '이 브라우저는 일부 기능을 지원하지 않습니다.',
      AUDIO_LOAD_FAILED: '알림음을 불러올 수 없습니다.'
    },
    SUCCESS: {
      SETTINGS_SAVED: '설정이 저장되었습니다.'
    }
  },

  // Debug Settings
  DEBUG: {
    ENABLED: false,
    LOG_EVENTS: false,
    SHOW_PERFORMANCE_METRICS: false
  }
};
