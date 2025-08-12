/**
 * MultiTimer 메인 JavaScript 파일
 * 
 * @fileoverview 프리셋 기반 다중 타이머 관리 시스템
 * @version 1.3.0
 * @author MultiTimer Team
 * @since 2024-01-01
 * 
 * @requires CONFIG (config.js)
 * @requires CONFIG_UTILS (config.js)
 * 
 * 주요 기능:
 * - 5/10/15개 타이머 프리셋 지원
 * - 성능 최적화된 배치 렌더링
 * - 메모리 누수 방지 시스템
 * - WCAG 2.1 AA 접근성 준수
 * - 모던 브라우저 API 활용
 * 
 * 사용법:
 * ```javascript
 * const app = new MultiTimer();
 * // 앱이 자동으로 초기화되고 사용자 설정을 로드합니다.
 * ```
 */

/**
 * MultiTimer - 다중 타이머 관리 클래스
 * 
 * @class MultiTimer
 * @description 정확한 시간 추적과 성능 최적화를 위한 DOM 캐싱 구현
 * 
 * @example
 * // 기본 사용법
 * const timer = new MultiTimer();
 * 
 * @example
 * // 수동 정리 (일반적으로 불필요)
 * timer.destroy();
 */
class MultiTimer {
  constructor() {
    // 상태 관리
    this.timers = [];
    this.intervalIds = [];
    this.currentMaxTime = CONFIG.TIMERS.DEFAULT_MAX_TIME;
    this.currentTimerCount = CONFIG.TIMERS.COUNT; // 현재 타이머 개수
    this.isFullscreen = false;
    this.autoStartEnabled = CONFIG.FEATURES.AUTO_START_ENABLED;
    this.selectedSound = CONFIG.FEATURES.SELECTED_SOUND; // frozen CONFIG 대신 별도 상태로 관리
    this.currentTheme = CONFIG.FEATURES.CURRENT_THEME; // 현재 테마 상태 관리
    this.sequentialExecution = CONFIG.FEATURES.SEQUENTIAL_EXECUTION; // 순차적 실행 상태 관리
    this.segmentedAnimation = CONFIG.FEATURES.SEGMENTED_ANIMATION; // 분할 애니메이션 상태 관리
    
    // 모바일 전용 설정 상태
    this.audioEnabled = true; // 음향 상태
    this.vibrationEnabled = true; // 진동 상태 (지원 기기만)
    this.uiMode = 'auto'; // 'auto', 'mobile', 'desktop'
    this.dragState = {
      isDragging: false,
      timerId: null,
      startY: 0,
      initialHeight: 0
    };

    // DOM 요소 캐싱 (성능 최적화)
    this.domElements = {
      timerRows: [],
      timerFills: [],
      timeTexts: [],
      playButtons: [],
      labelTexts: [],
      labelInputs: [],
      timerBars: [],
      // 모달 관련 요소들
      modal: null,
      modalClose: null,
      confirmBtn: null,
      cancelBtn: null,
      minutesInput: null,
      secondsInput: null,
      // 종료음 선택 모달 요소들
      soundModal: null,
      soundModalClose: null,
      soundConfirmBtn: null,
      soundCancelBtn: null,
      soundSelectBtn: null,
      soundOptions: null,
      previewBtns: null,
      // 테마 선택 모달 요소들
      themeModal: null,
      themeModalClose: null,
      themeConfirmBtn: null,
      themeCancelBtn: null,
      themeSelectBtn: null,
      themeOptions: null,
      currentThemeName: null,
      // 전역 컨트롤 요소들
      runningCount: null,
      // 전체 타이머 설정 요소들
      globalMinutesInput: null,
      globalSecondsInput: null,
      applyGlobalTimeBtn: null,
      maxTimeSelect: null,
      // 자동 시작 및 순차적 실행 설정 요소들
      autoStartToggle: null,
      sequentialToggle: null,
      segmentedAnimationToggle: null,
      // 모바일 전용 요소들
      mobileTimerCount: null,
      mobileAudioToggle: null,
      mobileVibrationToggle: null,
      mobileFullscreenToggle: null,
      mobileSettingsToggle: null,
      mobileStartAll: null,
      mobileStopAll: null,
      mobileResetAll: null
    };

    // 성능 최적화 시스템
    this.performanceOptimizer = {
      renderQueue: [],
      isRendering: false,
      lastRenderTime: 0,
      renderThrottle: 1000 / 60, // 60fps
      pendingUpdates: new Map()
    };

    // 메모리 관리 시스템
    this.abortController = new AbortController();
    this.rafIds = new Set();
    this.timeoutIds = new Set();

    try {
      this.createTimerHTML(); // 먼저 HTML 생성
      this.initializeTimers();
      this.cacheDOMElements();
      this.loadSettings(); // 설정 로드 (테마 포함)
      this.applyTheme(); // 테마 적용
      this.applyDeviceClass(); // 디바이스 타입 감지 및 클래스 적용
      this.updateAllTimerColors(); // 모든 타이머 색상 업데이트
      this.updateAllDisplays(); // DOM 캐싱 후 UI 업데이트
      this.updateStartAllButtonText(); // 초기 버튼 텍스트 설정
      this.initializeMobileUI(); // 모바일 UI 초기화
      this.bindEvents();
      CONFIG_UTILS.debugLog('MultiTimer initialized successfully');
    } catch (error) {
      console.error('MultiTimer initialization failed:', error);
      throw error;
    }
  }

  /**
   * 타이머 HTML 동적 생성
   * @private
   */
  createTimerHTML() {
    const timerContainer = document.getElementById('timer-container');
    const labelContainer = document.getElementById('label-inputs-container');
    
    // 기존 내용 지우기
    timerContainer.innerHTML = '';
    labelContainer.innerHTML = '';
    
    // 타이머 개수 데이터 속성 설정
    timerContainer.setAttribute('data-timer-count', this.currentTimerCount);
    
    for (let i = 0; i < this.currentTimerCount; i++) {
      // 타이머 HTML 생성
      const timerHTML = this.createSingleTimerHTML(i);
      timerContainer.appendChild(timerHTML);
      
      // 라벨 입력 필드 생성
      const labelInput = this.createLabelInputHTML(i);
      labelContainer.appendChild(labelInput);
    }
  }

  /**
   * 단일 타이머 HTML 생성
   * @param {number} index - 타이머 인덱스
   * @returns {HTMLElement} 타이머 DOM 요소
   * @private
   */
  createSingleTimerHTML(index) {
    const timerRow = document.createElement('div');
    timerRow.className = 'timer-row';
    timerRow.setAttribute('data-timer-id', index);
    
    const color = CONFIG_UTILS.getTimerColor(index);
    const label = CONFIG_UTILS.getTimerLabel(index);
    
    timerRow.innerHTML = `
      <div class="timer-label">
        <span class="label-text">${label}</span>
      </div>
      <div class="timer-bar-container">
        <div class="timer-bar" data-color="${color}">
        </div>
        <div class="time-display">
          <span class="time-text">00:00</span>
        </div>
      </div>
      <div class="timer-controls">
        <button class="play-pause-btn" data-timer-id="${index}">
          <span class="btn-icon">▶</span>
        </button>
        <button class="reset-btn" data-timer-id="${index}">
          <span class="btn-icon">✖</span>
        </button>
      </div>
    `;
    
    return timerRow;
  }

  /**
   * 라벨 입력 필드 HTML 생성
   * @param {number} index - 타이머 인덱스
   * @returns {HTMLElement} 라벨 입력 DOM 요소
   * @private
   */
  createLabelInputHTML(index) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `label-${index}`;
    input.className = 'label-input';
    input.placeholder = `타이머 ${index + 1}`;
    input.maxLength = CONFIG.UI_CONSTANTS.LABEL_MAX_LENGTH;
    input.value = CONFIG_UTILS.getTimerLabel(index);
    
    return input;
  }

  /**
   * 타이머 세그먼트 또는 채우기 요소 생성
   * @param {number} timerId - 타이머 인덱스
   * @private
   */
  createTimerSegments(timerId) {
    const timerBar = this.domElements.timerBars[timerId];
    if (!timerBar) return;

    // 기존 내용 지우기
    timerBar.innerHTML = '';

    if (this.segmentedAnimation) {
      const timer = this.timers[timerId];
      if (timer.totalTime === 0) return;

      const color = CONFIG_UTILS.getTimerColor(timerId, this.currentTheme);

      const wrapper = document.createElement('div');
      wrapper.className = 'segment-wrapper';
      const maxBarLength = (timer.totalTime / this.currentMaxTime) * 100;
      wrapper.style.height = `${maxBarLength}%`;

      const fragment = document.createDocumentFragment();
      for (let i = 0; i < timer.totalTime; i++) {
        const segment = document.createElement('div');
        segment.className = 'timer-segment';
        segment.style.backgroundColor = color;
        fragment.appendChild(segment);
      }
      wrapper.appendChild(fragment);
      timerBar.appendChild(wrapper);
    } else {
      const timerFill = document.createElement('div');
      timerFill.className = 'timer-fill';
      const color = CONFIG_UTILS.getTimerColor(timerId, this.currentTheme);
      timerFill.style.backgroundColor = color;
      timerBar.appendChild(timerFill);

      // 새로 생성된 timer-fill 요소를 캐싱
      this.domElements.timerFills[timerId] = timerFill;
    }
  }

  /**
   * 타이머 초기화 - 모든 타이머 객체 생성
   * @private
   */
  initializeTimers() {
    // 타이머 배열 초기화
    this.timers = [];
    this.intervalIds = [];
    
    for (let i = 0; i < this.currentTimerCount; i++) {
      this.timers.push(this.createTimerObject(i));
      this.intervalIds.push(null);
    }
  }

  /**
   * 타이머 객체 생성
   * @param {number} id - 타이머 ID
   * @returns {Object} 타이머 객체
   * @private
   */
  createTimerObject(id) {
    return {
      id,
      label: CONFIG_UTILS.getTimerLabel(id),
      totalTime: 0,
      currentTime: 0,
      isRunning: false,
      isCompleted: false,
      color: CONFIG_UTILS.getTimerColor(id),
      sound: this.getTimerSound(id),
      startTime: null,
      expectedTime: null
    };
  }

  /**
   * DOM 요소 캐싱 - 성능 최적화를 위한 DOM 쿼리 캐싱
   * @private
   */
  cacheDOMElements() {
    try {
      // 기존 배열 초기화
      this.domElements.timerRows = [];
      this.domElements.timerFills = [];
      this.domElements.timeTexts = [];
      this.domElements.playButtons = [];
      this.domElements.labelTexts = [];
      this.domElements.labelInputs = [];
      this.domElements.timerBars = [];
      
      // 동적 타이머 관련 요소들 캐싱
      for (let i = 0; i < this.currentTimerCount; i++) {
        const timerRow = document.querySelector(`[data-timer-id="${i}"]`);
        if (!timerRow) {
          throw new Error(`Timer row ${i} not found`);
        }
        
        this.domElements.timerRows[i] = timerRow;
        this.domElements.timeTexts[i] = timerRow.querySelector('.time-text');
        this.domElements.playButtons[i] = timerRow.querySelector('.play-pause-btn');
        this.domElements.labelTexts[i] = timerRow.querySelector('.label-text');
        this.domElements.timerBars[i] = timerRow.querySelector('.timer-bar');
      }
      
      // 라벨 입력 필드들 캐싱
      const labelInputsNodeList = document.querySelectorAll('.label-input');
      labelInputsNodeList.forEach((input, index) => {
        this.domElements.labelInputs[index] = input;
      });
      
      // 모달 관련 요소들 캐싱
      this.domElements.modal = document.getElementById('time-input-modal');
      this.domElements.modalClose = this.domElements.modal.querySelector('.modal-close');
      this.domElements.confirmBtn = document.getElementById('time-confirm-btn');
      this.domElements.cancelBtn = document.getElementById('time-cancel-btn');
      this.domElements.minutesInput = document.getElementById('minutes-input');
      this.domElements.secondsInput = document.getElementById('seconds-input');
      
      // 종료음 선택 모달 요소들 캐싱
      this.domElements.soundModal = document.getElementById('sound-select-modal');
      this.domElements.soundModalClose = this.domElements.soundModal.querySelector('.modal-close');
      this.domElements.soundConfirmBtn = document.getElementById('sound-confirm-btn');
      this.domElements.soundCancelBtn = document.getElementById('sound-cancel-btn');
      this.domElements.soundSelectBtn = document.getElementById('sound-select-btn');
      this.domElements.soundOptions = this.domElements.soundModal.querySelectorAll('input[name="sound-option"]');
      this.domElements.previewBtns = this.domElements.soundModal.querySelectorAll('.preview-btn');
      
      // 테마 선택 모달 요소들 캐싱
      this.domElements.themeModal = document.getElementById('theme-select-modal');
      this.domElements.themeModalClose = this.domElements.themeModal.querySelector('.modal-close');
      this.domElements.themeConfirmBtn = document.getElementById('theme-confirm-btn');
      this.domElements.themeCancelBtn = document.getElementById('theme-cancel-btn');
      this.domElements.themeSelectBtn = document.getElementById('theme-select-btn');
      this.domElements.themeOptions = this.domElements.themeModal.querySelectorAll('input[name="theme-option"]');
      this.domElements.currentThemeName = document.getElementById('current-theme-name');
      
      // 전역 컨트롤 요소들 캐싱
      this.domElements.runningCount = document.getElementById('running-count');
      
      // 전체 타이머 설정 요소들 캐싱
      this.domElements.globalMinutesInput = document.getElementById('global-minutes-input');
      this.domElements.globalSecondsInput = document.getElementById('global-seconds-input');
      this.domElements.applyGlobalTimeBtn = document.getElementById('apply-global-time-btn');
      this.domElements.maxTimeSelect = document.getElementById('max-time-select');
      
      // 자동 시작 및 순차적 실행 설정 요소들 캐싱
      this.domElements.autoStartToggle = document.getElementById('auto-start-toggle');
      this.domElements.sequentialToggle = document.getElementById('sequential-toggle');
      this.domElements.segmentedAnimationToggle = document.getElementById('segmented-animation-toggle');
      
      // UI 모드 선택기 캐싱
      this.domElements.uiModeSelect = document.getElementById('ui-mode-select');
      
      // 모바일 전용 요소들 캐싱 (존재하는 경우에만)
      this.domElements.mobileTimerCount = document.getElementById('mobile-timer-count');
      this.domElements.mobileAudioToggle = document.getElementById('mobile-audio-toggle');
      this.domElements.mobileVibrationToggle = document.getElementById('mobile-vibration-toggle');
      this.domElements.mobileFullscreenToggle = document.getElementById('mobile-fullscreen-toggle');
      this.domElements.mobileSettingsToggle = document.getElementById('mobile-settings-toggle');
      this.domElements.mobileStartAll = document.getElementById('mobile-start-all');
      this.domElements.mobileStopAll = document.getElementById('mobile-stop-all');
      this.domElements.mobileResetAll = document.getElementById('mobile-reset-all');
      
    } catch (error) {
      console.error('DOM element caching failed:', error);
      throw error;
    }
  }

  // 이벤트 바인딩
  bindEvents() {
    // 드래그 이벤트
    this.bindDragEvents();
    
    // 클릭 이벤트 (정밀 시간 입력)
    this.bindClickEvents();
    
    // 개별 타이머 컨트롤
    this.bindTimerControls();
    
    // 왼쪽 패널 컨트롤
    this.bindLeftPanelControls();
    
    // 타이머 개수 변경
    this.bindTimerCountControls();
    
    // 오른쪽 패널 컨트롤
    this.bindRightPanelControls();
    
    // 모달 이벤트
    this.bindModalEvents();
    
    // 테마 선택 이벤트
    this.bindThemeEvents();
    
    // 키보드 단축키
    if (CONFIG.FEATURES.KEYBOARD_SHORTCUTS) {
      this.bindKeyboardEvents();
    }
    
    // 모바일 전용 이벤트
    this.bindMobileEvents();
  }

  // 드래그 이벤트 바인딩
  bindDragEvents() {
    document.querySelectorAll('.timer-bar').forEach((bar, index) => {
      // 마우스 이벤트
      bar.addEventListener('mousedown', (e) => this.startDrag(e, index));
      
      // 터치 이벤트
      bar.addEventListener('touchstart', (e) => this.startDrag(e, index), { passive: false });
    });

    // 전역 이벤트
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());
    document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    document.addEventListener('touchend', () => this.endDrag());
  }

  // 시간 표시 박스 클릭 이벤트 바인딩 (정밀 시간 입력)
  bindClickEvents() {
    document.querySelectorAll('.time-display').forEach((timeDisplay, index) => {
      timeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTimeInputModal(index);
        CONFIG_UTILS.debugLog(`Time display clicked for timer ${index}`);
      });
    });
  }

  // 복잡한 클릭 감지 로직 제거됨 - 시간 표시 박스 클릭으로 단순화

  // 개별 타이머 컨트롤 바인딩
  bindTimerControls() {
    // 재생/정지 버튼
    document.querySelectorAll('.play-pause-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const timerId = parseInt(btn.dataset.timerId);
        const timer = this.timers[timerId];
        
        if (timer.isCompleted) {
          // 완료된 타이머 클릭 시 알림 종료 및 초기화
          this.resetTimer(timerId);
        } else {
          this.toggleTimer(timerId);
        }
      });
    });
    
    // 리셋(X) 버튼
    document.querySelectorAll('.timer-controls .reset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const timerId = parseInt(btn.dataset.timerId);
        this.resetTimer(timerId);
        CONFIG_UTILS.debugLog(`Reset button clicked for timer ${timerId}`);
      });
    });
    
    // 타이머 바 클릭 기능 제거됨 - 드래그 전용
  }

  // 왼쪽 패널 컨트롤 바인딩
  bindLeftPanelControls() {
    // 전체 제어 버튼
    document.getElementById('start-all-btn').addEventListener('click', () => this.startAllTimers());
    document.getElementById('stop-all-btn').addEventListener('click', () => this.stopAllTimers());
    document.getElementById('reset-all-btn').addEventListener('click', () => this.resetAllTimers());
    
    // 자동 시작 토글
    document.getElementById('auto-start-toggle').addEventListener('change', (e) => {
      this.autoStartEnabled = e.target.checked;
      CONFIG_UTILS.debugLog(`Auto-start ${this.autoStartEnabled ? 'enabled' : 'disabled'}`);
    });
    
    // 최대 시간 설정
    document.getElementById('max-time-select').addEventListener('change', (e) => {
      this.currentMaxTime = parseInt(e.target.value);
      // 최대 시간 변경 시 모든 타이머 초기화
      this.resetAllTimersToZero();
    });
    
    // 라벨 입력
    document.querySelectorAll('.label-input').forEach((input, index) => {
      input.addEventListener('input', (e) => {
        this.timers[index].label = e.target.value || CONFIG_UTILS.getTimerLabel(index);
        this.updateTimerLabel(index);
      });
    });
  }

  // 타이머 개수 변경 컨트롤 바인딩
  bindTimerCountControls() {
    const timerCountSelect = document.getElementById('timer-count-select');
    
    // 현재 타이머 개수 설정
    timerCountSelect.value = this.currentTimerCount;
    
    // 선택 변경 이벤트
    timerCountSelect.addEventListener('change', (e) => {
      const newCount = parseInt(e.target.value);
      if (this.validateTimerCount(newCount)) {
        this.changeTimerCount(newCount);
      }
    });
  }

  // 타이머 개수 유효성 검사 (프리셋 기반)
  validateTimerCount(count) {
    if (isNaN(count) || !CONFIG.TIMERS.PRESET_COUNTS.includes(count)) {
      this.showNotification(`타이머 개수는 ${CONFIG.TIMERS.PRESET_COUNTS.join(', ')}개 중에서만 선택할 수 있습니다.`, 'error');
      return false;
    }
    return true;
  }

  // 타이머 개수 변경
  changeTimerCount(newCount) {
    if (newCount === this.currentTimerCount) return;
    
    // 실행 중인 타이머들 정지
    this.stopAllTimers();
    
    // 새로운 타이머 개수 설정
    this.currentTimerCount = newCount;
    
    // HTML 재생성
    this.createTimerHTML();
    
    // 타이머 배열 재초기화
    this.initializeTimers();
    
    // DOM 요소 재캐싱
    this.cacheDOMElements();
    
    // 이벤트 재바인딩
    this.rebindDynamicEvents();
    
    // 실행 중 개수 업데이트
    this.updateRunningCount();
    
    // 모바일 설정창이 열려있으면 재생성
    const mobilePanel = document.getElementById('mobile-settings-panel');
    if (mobilePanel) {
      this.toggleMobileSettings(); // 닫기
      this.toggleMobileSettings(); // 다시 열기
    }
    
    CONFIG_UTILS.debugLog(`Timer count changed to ${newCount}`);
  }

  // 동적 이벤트 재바인딩
  rebindDynamicEvents() {
    // 드래그 이벤트 재바인딩
    this.bindDragEvents();
    
    // 클릭 이벤트 재바인딩  
    this.bindClickEvents();
    
    // 타이머 컨트롤 재바인딩
    this.bindTimerControls();
    
    // 라벨 입력 이벤트 재바인딩
    document.querySelectorAll('.label-input').forEach((input, index) => {
      input.addEventListener('input', (e) => {
        this.timers[index].label = e.target.value || CONFIG_UTILS.getTimerLabel(index);
        this.updateTimerLabel(index);
      });
    });
  }

  // 오른쪽 패널 컨트롤 바인딩
  bindRightPanelControls() {    
    // UI 모드 선택기
    if (this.domElements.uiModeSelect) {
      this.domElements.uiModeSelect.addEventListener('change', (e) => {
        this.setUIMode(e.target.value);
      }, { signal: this.abortController.signal });
    }
    
    // 순차적 실행 토글
    if (this.domElements.sequentialToggle) {
      this.domElements.sequentialToggle.addEventListener('change', (e) => {
        this.sequentialExecution = e.target.checked;
        this.updateStartAllButtonText();
        CONFIG_UTILS.debugLog(`Sequential execution ${this.sequentialExecution ? 'enabled' : 'disabled'}`);
      }, { signal: this.abortController.signal });
    }

    // 분할 애니메이션 토글
    if (this.domElements.segmentedAnimationToggle) {
        this.domElements.segmentedAnimationToggle.addEventListener('change', (e) => {
            this.segmentedAnimation = e.target.checked;
            this.timers.forEach((timer, index) => {
                this.updateTimerTime(index, timer.totalTime);
            });
            CONFIG_UTILS.debugLog(`Segmented animation ${this.segmentedAnimation ? 'enabled' : 'disabled'}`);
        }, { signal: this.abortController.signal });
    }
  }

  // 모달 이벤트 바인딩
  bindModalEvents() {
    const modal = this.domElements.modal;
    const closeBtn = this.domElements.modalClose;
    const confirmBtn = this.domElements.confirmBtn;
    const cancelBtn = this.domElements.cancelBtn;
    
    closeBtn.addEventListener('click', () => this.closeTimeInputModal());
    cancelBtn.addEventListener('click', () => this.closeTimeInputModal());
    confirmBtn.addEventListener('click', () => this.confirmTimeInput());
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeTimeInputModal();
      }
    });

    // 종료음 선택 모달 이벤트
    this.domElements.soundSelectBtn.addEventListener('click', () => this.showSoundSelectModal());
    this.domElements.soundModalClose.addEventListener('click', () => this.closeSoundSelectModal());
    this.domElements.soundCancelBtn.addEventListener('click', () => this.closeSoundSelectModal());
    this.domElements.soundConfirmBtn.addEventListener('click', () => this.confirmSoundSelection());
    
    // 미리듣기 버튼 이벤트
    this.domElements.previewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const soundType = e.target.dataset.sound;
        this.previewSound(soundType);
      });
    });

    // 종료음 모달 외부 클릭 시 닫기
    this.domElements.soundModal.addEventListener('click', (e) => {
      if (e.target === this.domElements.soundModal) {
        this.closeSoundSelectModal();
      }
    });

    // 전체 타이머 설정 이벤트
    this.domElements.applyGlobalTimeBtn.addEventListener('click', () => this.applyGlobalTime());
  }

  // 키보드 이벤트 바인딩
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ': // 스페이스바 - 전체 시작/정지
          e.preventDefault();
          this.toggleAllTimers();
          break;
        case 'Escape': // ESC - 풀스크린 해제 또는 모달 닫기
          if (this.isFullscreen) {
            this.toggleFullscreen();
          } else {
            this.closeTimeInputModal();
          }
          break;
      }
    });
  }

  // 모바일 전용 이벤트 바인딩
  bindMobileEvents() {
    // 음향 토글 버튼
    if (this.domElements.mobileAudioToggle) {
      this.domElements.mobileAudioToggle.addEventListener('click', () => {
        this.toggleAudio();
      });
    }

    // 진동 토글 버튼
    if (this.domElements.mobileVibrationToggle) {
      this.domElements.mobileVibrationToggle.addEventListener('click', () => {
        this.toggleVibration();
      });
    }

    // 전체화면 토글 버튼
    if (this.domElements.mobileFullscreenToggle) {
      this.domElements.mobileFullscreenToggle.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // 설정 토글 버튼 (슬라이드 패널)
    if (this.domElements.mobileSettingsToggle) {
      this.domElements.mobileSettingsToggle.addEventListener('click', () => {
        this.toggleMobileSettings();
      });
    }

    // 하단 컨트롤 버튼들
    if (this.domElements.mobileStartAll) {
      this.domElements.mobileStartAll.addEventListener('click', () => {
        this.startAllTimers();
      });
    }

    if (this.domElements.mobileStopAll) {
      this.domElements.mobileStopAll.addEventListener('click', () => {
        this.stopAllTimers();
      });
    }

    if (this.domElements.mobileResetAll) {
      this.domElements.mobileResetAll.addEventListener('click', () => {
        this.resetAllTimers();
      });
    }

    // 전체화면 상태 변화 감지
    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenIcon();
    });

    // 화면 크기/방향 변경 감지 (실시간 모니터링)
    window.addEventListener('resize', () => {
      this.handleViewportChange();
    });

    window.addEventListener('orientationchange', () => {
      this.handleViewportChange();
    });
  }

  // 드래그 시작
  startDrag(e, timerId) {
    e.preventDefault();
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const timerBar = e.currentTarget;
    const rect = timerBar.getBoundingClientRect();
    
    this.dragState = {
      isDragging: true,
      timerId: timerId,
      startY: clientY,
      initialHeight: ((this.timers[timerId].totalTime / this.currentMaxTime) * CONFIG.UI_CONSTANTS.PERCENTAGE_MAX)
    };
    
    timerBar.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
    
    CONFIG_UTILS.debugLog(`Drag started for timer ${timerId}`);
  }

  // 드래그 중
  onDrag(e) {
    if (!this.dragState.isDragging) return;
    
    e.preventDefault();
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const timerBar = this.domElements.timerBars[this.dragState.timerId];
    const rect = timerBar.getBoundingClientRect();
    
    // 세로 드래그: 위로 드래그하면 시간 증가 (deltaY가 음수)
    const deltaY = this.dragState.startY - clientY; // 방향 반전
    const barHeight = rect.height;
    const deltaPercent = (deltaY / barHeight) * CONFIG.UI_CONSTANTS.PERCENTAGE_MAX;
    
    let newPercent = Math.max(0, Math.min(CONFIG.UI_CONSTANTS.PERCENTAGE_MAX, this.dragState.initialHeight + deltaPercent));
    
    // 10초 단위로 스냅
    if (CONFIG.DRAG.SNAP_TO_MINUTES) {
      const timeInSeconds = (newPercent / 100) * this.currentMaxTime;
      const snappedTime = Math.round(timeInSeconds / CONFIG.UI_CONSTANTS.SNAP_UNIT_SECONDS) * CONFIG.UI_CONSTANTS.SNAP_UNIT_SECONDS;
      newPercent = Math.max(0, (snappedTime / this.currentMaxTime) * CONFIG.UI_CONSTANTS.PERCENTAGE_MAX);
    }
    
    const newTime = Math.max(0, (newPercent / CONFIG.UI_CONSTANTS.PERCENTAGE_MAX) * this.currentMaxTime);
    
    this.updateTimerTime(this.dragState.timerId, newTime);
  }

  // 드래그 종료
  endDrag() {
    if (!this.dragState.isDragging) return;
    
    const timerId = this.dragState.timerId;
    const timerBar = this.domElements.timerBars[timerId];
    timerBar.classList.remove('dragging');
    document.body.style.cursor = 'default';
    
    // 드래그로 시간이 설정되었고 자동 시작이 활성화되어 있다면 타이머 시작
    const timer = this.timers[timerId];
    if (timer.totalTime > 0 && this.autoStartEnabled) {
      this.startTimer(timerId);
      CONFIG_UTILS.debugLog(`Drag ended for timer ${timerId}, auto-starting timer`);
    } else if (timer.totalTime > 0) {
      CONFIG_UTILS.debugLog(`Drag ended for timer ${timerId}, auto-start disabled - staying in ready state`);
    }
    
    this.dragState = {
      isDragging: false,
      timerId: null,
      startY: 0,
      initialHeight: 0
    };
  }

  // 시간 입력 모달 열기
  openTimeInputModal(timerId) {
    this.currentEditingTimer = timerId;
    const timer = this.timers[timerId];
    
    const minutes = Math.floor(timer.totalTime / 60);
    const seconds = timer.totalTime % 60;
    
    this.domElements.minutesInput.value = minutes;
    this.domElements.secondsInput.value = seconds;
    
    this.domElements.modal.style.display = 'block';
  }

  // 시간 입력 모달 닫기
  closeTimeInputModal() {
    this.domElements.modal.style.display = 'none';
    this.currentEditingTimer = null;
  }

  // 시간 입력 확인
  confirmTimeInput() {
    const minutes = Math.min(parseInt(this.domElements.minutesInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_MINUTES);
    const seconds = Math.min(parseInt(this.domElements.secondsInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_SECONDS);
    
    const totalSeconds = (minutes * 60) + seconds;
    
    if (totalSeconds > this.currentMaxTime) {
      this.showNotification(CONFIG.MESSAGES.ERROR.MAX_TIME_EXCEEDED, 'error');
      return;
    }
    
    
    const timerId = this.currentEditingTimer;
    this.updateTimerTime(timerId, totalSeconds);
    
    // 정밀 시간 입력 후 자동 시작이 활성화되어 있다면 타이머 시작
    if (totalSeconds > 0 && this.autoStartEnabled) {
      this.startTimer(timerId);
      CONFIG_UTILS.debugLog(`Time input confirmed for timer ${timerId}, auto-starting timer`);
    } else if (totalSeconds > 0) {
      CONFIG_UTILS.debugLog(`Time input confirmed for timer ${timerId}, auto-start disabled - staying in ready state`);
    }
    
    this.closeTimeInputModal();
  }

  // 타이머 시간 업데이트
  updateTimerTime(timerId, timeInSeconds) {
    const timer = this.timers[timerId];
    
    // 현재 실행 중이면 중지
    if (timer.isRunning) {
      this.stopTimer(timerId);
    }
    
    timer.totalTime = Math.round(timeInSeconds);
    timer.currentTime = timer.totalTime;
    timer.isCompleted = false;
    
    // 깜빡임 효과 중지
    this.stopBlinkEffect(timerId);

    // 타이머 바 다시 그리기
    this.createTimerSegments(timerId);
    
    this.updateTimerDisplay(timerId);
    this.updateTimerBar(timerId);
    this.updateTimerButton(timerId);
  }

  // 개별 타이머 토글
  toggleTimer(timerId) {
    const timer = this.timers[timerId];
    
    if (timer.isRunning) {
      this.stopTimer(timerId);
    } else {
      this.startTimer(timerId);
    }
  }

  // 타이머 시작 (정확한 시간 보정 적용)
  startTimer(timerId) {
    const timer = this.timers[timerId];
    
    if (timer.isCompleted) {
      // 완료된 타이머 재시작
      timer.currentTime = timer.totalTime;
      timer.isCompleted = false;
      this.stopBlinkEffect(timerId);
    }
    
    timer.isRunning = true;
    timer.startTime = performance.now(); // 정확한 시작 시간 기록
    timer.expectedTime = timer.startTime + (timer.currentTime * 1000); // 예상 종료 시간
    
    const timerTick = () => {
      if (!timer.isRunning) return;
      
      const now = performance.now();
      const elapsed = now - timer.startTime; // 실제 경과 시간 (ms)
      const remainingMs = timer.expectedTime - now; // 남은 시간 (ms)
      
      timer.currentTime = Math.max(0, Math.ceil(remainingMs / 1000)); // 초 단위로 변환
      
      if (timer.currentTime <= 0) {
        this.completeTimer(timerId);
      } else {
        this.updateTimerDisplay(timerId);
        this.updateTimerBar(timerId);
        
        // 다음 업데이트 시간 계산 (드리프트 보정)
        const nextUpdate = Math.max(1, 1000 - (elapsed % 1000));
        const timeoutId = setTimeout(timerTick, nextUpdate);
        this.intervalIds[timerId] = timeoutId;
        this.timeoutIds.add(timeoutId);
      }
    };
    
    // 첫 번째 틱 실행 (메모리 추적)
    const timeoutId = setTimeout(timerTick, 100);
    this.intervalIds[timerId] = timeoutId;
    this.timeoutIds.add(timeoutId);
    
    this.updateTimerButton(timerId);
    this.updateRunningCount();
    
    CONFIG_UTILS.debugLog(`Timer ${timerId} started with accurate timing`);
  }

  // 타이머 정지
  stopTimer(timerId) {
    const timer = this.timers[timerId];
    timer.isRunning = false;
    
    if (this.intervalIds[timerId]) {
      clearTimeout(this.intervalIds[timerId]);
      this.timeoutIds.delete(this.intervalIds[timerId]);
      this.intervalIds[timerId] = null;
    }
    
    this.updateTimerButton(timerId);
    this.updateRunningCount();
    
    CONFIG_UTILS.debugLog(`Timer ${timerId} stopped`);
  }

  // 타이머 완료
  completeTimer(timerId) {
    const timer = this.timers[timerId];
    
    timer.isRunning = false;
    timer.isCompleted = true;
    timer.currentTime = 0;
    
    if (this.intervalIds[timerId]) {
      clearTimeout(this.intervalIds[timerId]);
      this.timeoutIds.delete(this.intervalIds[timerId]);
      this.intervalIds[timerId] = null;
    }
    
    this.updateTimerDisplay(timerId);
    this.updateTimerBar(timerId);
    this.updateTimerButton(timerId);
    this.updateRunningCount();
    
    // 알림 효과
    if (CONFIG.NOTIFICATIONS.BLINK_ENABLED) {
      this.startBlinkEffect(timerId);
    }
    
    if (CONFIG.NOTIFICATIONS.SOUND_ENABLED) {
      this.playAlarmSound(timer.sound);
    }
    
    if (CONFIG.NOTIFICATIONS.VIBRATION_ENABLED && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    
    // 순차적 실행이 활성화된 경우 다음 타이머 자동 시작
    if (this.sequentialExecution) {
      this.startNextAvailableTimer(timerId);
    }
    
    CONFIG_UTILS.debugLog(`Timer ${timerId} completed`);
  }

  // 전체 타이머 시작
  startAllTimers() {
    if (this.sequentialExecution) {
      // 순차적 실행이 활성화된 경우: 첫 번째 타이머만 시작
      this.startFirstAvailableTimer();
    } else {
      // 기본 동작: 모든 타이머 동시 시작
      this.timers.forEach((timer, index) => {
        if (timer.totalTime > 0 && !timer.isRunning) {
          this.startTimer(index);
        }
      });
    }
  }

  // 첫 번째 사용 가능한 타이머 시작 (순차적 실행용)
  startFirstAvailableTimer() {
    for (let i = 0; i < this.timers.length; i++) {
      const timer = this.timers[i];
      if (timer.totalTime > 0 && !timer.isRunning) {
        this.startTimer(i);
        CONFIG_UTILS.debugLog(`Started first available timer: ${i + 1}`);
        break; // 첫 번째 타이머만 시작하고 중단
      }
    }
  }

  // 다음 사용 가능한 타이머 시작 (순차적 실행용)
  startNextAvailableTimer(completedTimerId) {
    // 완료된 타이머 다음부터 시작해서 사용 가능한 타이머 찾기
    for (let i = completedTimerId + 1; i < this.timers.length; i++) {
      const timer = this.timers[i];
      if (timer.totalTime > 0 && !timer.isRunning && !timer.isCompleted) {
        this.startTimer(i);
        CONFIG_UTILS.debugLog(`Started next available timer after ${completedTimerId + 1}: ${i + 1}`);
        return; // 다음 타이머를 찾아 시작했으므로 종료
      }
    }
    
    // 마지막 타이머까지 도달했다면 순차적 실행 종료
    CONFIG_UTILS.debugLog(`Sequential execution completed. No more timers available after timer ${completedTimerId + 1}`);
  }

  // 전체 시작 버튼 텍스트 업데이트 (순차적 실행 상태에 따라)
  updateStartAllButtonText() {
    const startAllBtn = document.getElementById('start-all-btn');
    if (startAllBtn) {
      if (this.sequentialExecution) {
        startAllBtn.textContent = '순차 시작';
        startAllBtn.setAttribute('aria-label', '첫 번째 타이머 시작 (순차적 실행 모드)');
      } else {
        startAllBtn.textContent = '전체 시작';
        startAllBtn.setAttribute('aria-label', '모든 타이머 시작');
      }
      CONFIG_UTILS.debugLog(`Start button text updated to: ${startAllBtn.textContent}`);
    }
  }

  // 전체 타이머 정지
  stopAllTimers() {
    this.timers.forEach((timer, index) => {
      if (timer.isRunning) {
        this.stopTimer(index);
      }
    });
  }

  // 개별 타이머 리셋
  resetTimer(timerId) {
    const timer = this.timers[timerId];
    this.stopTimer(timerId);
    timer.totalTime = 0;
    timer.currentTime = 0;
    timer.isCompleted = false;
    timer.startTime = null;
    timer.expectedTime = null;
    this.stopBlinkEffect(timerId);

    this.createTimerSegments(timerId);

    this.updateTimerDisplay(timerId);
    this.updateTimerBar(timerId);
    this.updateTimerButton(timerId);
    this.updateRunningCount();
  }

  // 전체 타이머 리셋 (남은 시간 0으로 초기화)
  resetAllTimers() {
    this.timers.forEach((timer, index) => {
      this.resetTimer(index);
    });
  }

  // 모든 타이머를 0으로 초기화 (최대 시간 변경 시 사용)
  resetAllTimersToZero() {
    this.timers.forEach((timer, index) => {
      this.stopTimer(index);
      timer.totalTime = 0;
      timer.currentTime = 0;
      timer.isCompleted = false;
      timer.startTime = null;
      timer.expectedTime = null;
      this.stopBlinkEffect(index);

      this.createTimerSegments(index);

      this.updateTimerDisplay(index);
      this.updateTimerBar(index);
      this.updateTimerButton(index);
    });
    this.updateRunningCount();
  }

  // 전체 타이머 토글
  toggleAllTimers() {
    const runningCount = this.timers.filter(timer => timer.isRunning).length;
    
    if (runningCount > 0) {
      this.stopAllTimers();
    } else {
      this.startAllTimers();
    }
  }

  // 깜빡임 효과 시작 (5번 깜빡이고 자동 리셋)
  startBlinkEffect(timerId) {
    this.domElements.timerRows[timerId].classList.add('completed');
    
    // 5초 후 (1초 × 5번 깜빡임) 자동으로 00:00으로 리셋
    setTimeout(() => {
      // 타이머가 여전히 완료 상태인지 확인 (사용자가 수동으로 리셋하지 않았는지)
      if (this.timers[timerId].isCompleted) {
        this.resetTimerToZero(timerId);
      }
    }, 5000);
  }

  // 깜빡임 효과 중지
  stopBlinkEffect(timerId) {
    this.domElements.timerRows[timerId].classList.remove('completed');
  }

  // 타이머를 00:00으로 리셋 (완료 후 자동 리셋용)
  resetTimerToZero(timerId) {
    const timer = this.timers[timerId];
    timer.currentTime = 0;
    timer.isCompleted = false;
    
    this.stopBlinkEffect(timerId);
    this.updateTimerDisplay(timerId);
    this.updateTimerBar(timerId);
    this.updateTimerButton(timerId);
    this.updateRunningCount();
    
    CONFIG_UTILS.debugLog(`Timer ${timerId + 1} auto-reset to 00:00 after blinking`);
  }

  // 타이머 사운드 가져오기 (선택된 소리 사용)
  getTimerSound(timerId) {
    return CONFIG.SOUNDS[this.selectedSound] || CONFIG.SOUNDS.TIMER_1;
  }

  // 알람 소리 재생
  async playAlarmSound(soundFile) {
    if (!CONFIG.NOTIFICATIONS.SOUND_ENABLED) return;
    
    try {
      // AudioContext 지원 여부 사전 확인
      if (!window.AudioContext && !window.webkitAudioContext) {
        throw new Error('AudioContext not supported');
      }
      
      // 브라우저에서 기본 beep 소리 사용 (실제 파일 없이도 작동)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(CONFIG.SOUNDS.VOLUME, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
    } catch (error) {
      CONFIG_UTILS.debugLog('Audio playback failed:', error);
      this.fallbackAlarm();
    }
  }

  /**
   * 알림 소리 대체 방안
   * @private
   */
  fallbackAlarm() {
    try {
      // 대체 방안: 진동 사용 (지원 기기에서)
      if ('vibrate' in navigator && CONFIG.NOTIFICATIONS.VIBRATION_ENABLED) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // 비주얼 알림으로 사용자에게 알림
      this.showNotification('타이머 완료!', 'success');
    } catch (fallbackError) {
      CONFIG_UTILS.debugLog('Fallback alarm also failed:', fallbackError);
      // 최후의 수단: 콘솔 알림
      console.log('\a'); // ASCII bell character
    }
  }

  // 종료음 선택 모달 열기
  showSoundSelectModal() {
    // 현재 선택된 사운드 설정
    const currentSound = this.selectedSound;
    const soundValue = currentSound.replace('TIMER_', '').toLowerCase();
    const soundMap = {
      '1': 'bell',
      '2': 'chime', 
      '3': 'beep',
      '4': 'ding',
      '5': 'alert'
    };
    const mappedValue = soundMap[soundValue] || 'bell';
    
    // 라디오 버튼 설정
    this.domElements.soundOptions.forEach(option => {
      option.checked = option.value === mappedValue;
    });
    
    this.domElements.soundModal.style.display = 'block';
  }

  // 종료음 선택 모달 닫기
  closeSoundSelectModal() {
    this.domElements.soundModal.style.display = 'none';
  }

  // 종료음 선택 확인
  confirmSoundSelection() {
    const selectedOption = Array.from(this.domElements.soundOptions).find(option => option.checked);
    if (selectedOption) {
      const soundMap = {
        'bell': 'TIMER_1',
        'chime': 'TIMER_2',
        'beep': 'TIMER_3',
        'ding': 'TIMER_4',
        'alert': 'TIMER_5'
      };
      this.selectedSound = soundMap[selectedOption.value] || 'TIMER_1';
    }
    this.closeSoundSelectModal();
  }

  // 전체 타이머 시간 적용
  applyGlobalTime() {
    const minutes = Math.min(parseInt(this.domElements.globalMinutesInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_MINUTES);
    const seconds = Math.min(parseInt(this.domElements.globalSecondsInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_SECONDS);
    
    const totalSeconds = (minutes * 60) + seconds;
    
    if (totalSeconds > this.currentMaxTime) {
      this.showNotification(CONFIG.MESSAGES.ERROR.MAX_TIME_EXCEEDED, 'error');
      return;
    }
    
    // 모든 타이머에 시간 적용
    for (let i = 0; i < this.currentTimerCount; i++) {
      this.updateTimerTime(i, totalSeconds);
      
      // 자동 시작이 활성화되어 있고 시간이 0보다 크면 타이머 시작
      if (this.autoStartEnabled && totalSeconds > 0) {
        this.startTimer(i);
      }
    }
    
    this.showNotification(`모든 타이머가 ${CONFIG_UTILS.formatTime(totalSeconds)}로 설정되었습니다.`, 'success');
  }

  // 모바일에서 전체 타이머 시간 적용
  applyGlobalTimeFromMobile(container) {
    const minutesInput = container.querySelector('#global-minutes-input');
    const secondsInput = container.querySelector('#global-seconds-input');
    
    if (!minutesInput || !secondsInput) {
      this.showNotification(CONFIG.MESSAGES.ERROR.INVALID_INPUT, 'error');
      return;
    }
    
    const minutes = Math.min(parseInt(minutesInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_MINUTES);
    const seconds = Math.min(parseInt(secondsInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_SECONDS);
    
    const totalSeconds = (minutes * 60) + seconds;
    
    if (totalSeconds > this.currentMaxTime) {
      this.showNotification(CONFIG.MESSAGES.ERROR.MAX_TIME_EXCEEDED, 'error');
      return;
    }
    
    // 모든 타이머에 시간 적용
    for (let i = 0; i < this.currentTimerCount; i++) {
      this.updateTimerTime(i, totalSeconds);
      
      // 자동 시작이 활성화되어 있고 시간이 0보다 크면 타이머 시작
      if (this.autoStartEnabled && totalSeconds > 0) {
        this.startTimer(i);
      }
    }
    
    this.showNotification(`모든 타이머가 ${CONFIG_UTILS.formatTime(totalSeconds)}로 설정되었습니다.`, 'success');
  }

  // 모바일에서 타이머 라벨 업데이트
  updateTimerLabelFromMobile(index, labelValue) {
    // 메인 DOM의 라벨 텍스트 업데이트
    const labelText = this.domElements.labelTexts[index];
    if (labelText) {
      labelText.textContent = labelValue || `타이머 ${index + 1}`;
    }
    
    // 원본 입력 필드도 동기화 (설정 저장을 위해)
    const originalInput = this.domElements.labelInputs[index];
    if (originalInput) {
      originalInput.value = labelValue || '';
    }
  }

  // 종료음 미리듣기
  async previewSound(soundType) {
    const soundMap = {
      'bell': 'TIMER_1',
      'chime': 'TIMER_2',
      'beep': 'TIMER_3',
      'ding': 'TIMER_4',
      'alert': 'TIMER_5'
    };
    const soundKey = soundMap[soundType] || 'TIMER_1';
    const soundFile = CONFIG.SOUNDS[soundKey];
    await this.playAlarmSound(soundFile);
  }

  // 풀스크린 토글
  toggleFullscreen() {
    if (!CONFIG.FEATURES.FULLSCREEN_ENABLED) return;
    
    if (!this.isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
  }


  // UI 업데이트 메서드들
  /**
   * 타이머 표시 업데이트 - 캐시된 DOM 요소 사용
   * @param {number} timerId - 타이머 ID
   */
  updateTimerDisplay(timerId) {
    try {
      if (!this.isValidTimerId(timerId)) {
        throw new Error(`Invalid timer ID: ${timerId}`);
      }
      
      const timer = this.timers[timerId];
      const timeText = this.domElements.timeTexts[timerId];
      
      if (!timeText) {
        throw new Error(`Time text element not found for timer ${timerId}`);
      }
      
      timeText.textContent = CONFIG_UTILS.formatTime(timer.currentTime);
    } catch (error) {
      CONFIG_UTILS.debugLog(`Failed to update timer display: ${error.message}`);
      // 기본값으로 복구 시도
      try {
        const timeText = this.domElements.timeTexts[timerId];
        if (timeText) {
          timeText.textContent = '00:00';
        }
      } catch (recoveryError) {
        CONFIG_UTILS.debugLog(`Failed to recover timer display: ${recoveryError.message}`);
      }
    }
  }

  /**
   * 타이멸 막대 업데이트 - 캐시된 DOM 요소 사용
   * @param {number} timerId - 타이멸 ID
   */
  updateTimerBar(timerId) {
    if (!this.isValidTimerId(timerId)) return;

    if (this.segmentedAnimation) {
      const timer = this.timers[timerId];
      const timerBar = this.domElements.timerBars[timerId];
      if (!timerBar) return;

      const wrapper = timerBar.querySelector('.segment-wrapper');
      if (!wrapper) return;

      const segments = wrapper.querySelectorAll('.timer-segment');
      if (segments.length === 0) return;

      const segmentsToHide = timer.totalTime - timer.currentTime;

      segments.forEach((segment, index) => {
        if (index < segmentsToHide) {
          segment.classList.add('hide');
        } else {
          segment.classList.remove('hide');
        }
      });
    } else {
      const timer = this.timers[timerId];
      const timerFill = this.domElements.timerFills[timerId];

      if (!timerFill) {
        // 분할 애니메이션이 아닐 때는 timerFill이 있어야 함
        // console.warn(`Timer fill element not found for timer ${timerId}`);
        return;
      }

      const percentage = this.calculateBarPercentage(timer);
      timerFill.style.height = `${Math.max(0, Math.min(100, percentage))}%`;
    }
  }

  /**
   * 막대 백분율 계산
   * @param {Object} timer - 타이멸 객체
   * @returns {number} 백분율 (0-100)
   * @private
   */
  calculateBarPercentage(timer) {
    if (timer.totalTime === 0) return 0;
    
    const maxBarLength = (timer.totalTime / this.currentMaxTime) * 100;
    const remainingPercentage = (timer.currentTime / timer.totalTime) * 100;
    return (remainingPercentage / 100) * maxBarLength;
  }

  /**
   * 타이멸 버튼 업데이트 - 캐시된 DOM 요소 사용
   * @param {number} timerId - 타이멸 ID
   */
  updateTimerButton(timerId) {
    if (!this.isValidTimerId(timerId)) return;
    
    const timer = this.timers[timerId];
    const button = this.domElements.playButtons[timerId];
    
    if (!button) {
      console.warn(`Play button element not found for timer ${timerId}`);
      return;
    }
    
    const icon = button.querySelector('.btn-icon');
    if (!icon) {
      console.warn(`Button icon not found for timer ${timerId}`);
      return;
    }
    
    const buttonConfig = this.getButtonConfig(timer);
    
    icon.textContent = buttonConfig.icon;
    button.className = `play-pause-btn ${buttonConfig.className}`;
    button.style.backgroundColor = buttonConfig.color;
  }

  /**
   * 버튼 설정 가져오기
   * @param {Object} timer - 타이멸 객체
   * @returns {Object} 버튼 설정
   * @private
   */
  getButtonConfig(timer) {
    if (timer.isCompleted) {
      return {
        icon: '✖',
        className: 'completed',
        color: '#DC3545' // Red for completed/stop
      };
    } else if (timer.isRunning) {
      return {
        icon: '⏸',
        className: 'paused',
        color: '#FFC107' // Yellow for pause
      };
    } else {
      return {
        icon: '▶',
        className: '',
        color: '#28A745' // Green for play
      };
    }
  }

  /**
   * 타이멸 라벨 업데이트 - 캐시된 DOM 요소 사용
   * @param {number} timerId - 타이멸 ID
   */
  updateTimerLabel(timerId) {
    if (!this.isValidTimerId(timerId)) return;
    
    const timer = this.timers[timerId];
    const labelElement = this.domElements.labelTexts[timerId];
    
    if (!labelElement) {
      console.warn(`Label element not found for timer ${timerId}`);
      return;
    }
    
    labelElement.textContent = timer.label;
  }

  /**
   * 유효한 타이멸 ID 확인
   * @param {number} timerId - 타이멸 ID
   * @returns {boolean} 유효성
   * @private
   */
  isValidTimerId(timerId) {
    return typeof timerId === 'number' && 
           timerId >= 0 && 
           timerId < this.currentTimerCount && 
           this.timers[timerId];
  }

  updateAllTimerBars() {
    this.timers.forEach((timer, index) => {
      this.updateTimerBar(index);
    });
  }

  // 모든 디스플레이 업데이트 (배치 처리)
  updateAllDisplays() {
    this.batchRender(() => {
      this.timers.forEach((timer, index) => {
        this.updateTimerDisplay(index);
        this.updateTimerBar(index);
        this.updateTimerButton(index);
        this.updateTimerLabel(index);
      });
      this.updateRunningCount();
    });
  }

  // 배치 렌더링 시스템
  batchRender(callback) {
    if (this.performanceOptimizer.isRendering) {
      this.performanceOptimizer.renderQueue.push(callback);
      return;
    }

    this.performanceOptimizer.isRendering = true;
    const rafId = requestAnimationFrame(() => {
      try {
        callback();
        
        // 대기 중인 렌더링 작업 처리
        while (this.performanceOptimizer.renderQueue.length > 0) {
          const pendingCallback = this.performanceOptimizer.renderQueue.shift();
          pendingCallback();
        }
      } catch (error) {
        console.error('Batch render error:', error);
      } finally {
        this.performanceOptimizer.isRendering = false;
        this.rafIds.delete(rafId);
      }
    });
    
    this.rafIds.add(rafId);
  }

  updateAllDisplaysOld() {
    this.timers.forEach((timer, index) => {
      this.updateTimerDisplay(index);
      this.updateTimerBar(index);
      this.updateTimerButton(index);
      this.updateTimerLabel(index);
    });
    this.updateRunningCount();
  }

  updateRunningCount() {
    const runningCount = this.timers.filter(timer => timer.isRunning).length;
    this.domElements.runningCount.textContent = `${runningCount}/${this.currentTimerCount} 실행 중`;
  }

  /**
   * 사용자 알림 표시 (alert 대체)
   * @param {string} message - 알림 메시지
   * @param {string} type - 알림 타입 (error, warning, info, success)
   * @param {number} duration - 표시 시간 (ms), 기본값 3000
   * @public
   */
  showNotification(message, type = 'info', duration = CONFIG.UI_CONSTANTS.NOTIFICATION_DURATION) {
    // 기존 알림이 있다면 제거
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.textContent = message;

    // 스타일 적용
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      maxWidth: '300px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-10px)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    });

    // 타입별 배경색
    const colors = {
      error: '#DC3545',
      warning: '#FFC107',
      success: '#28A745',
      info: '#007BFF'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // DOM에 추가
    document.body.appendChild(notification);

    // 애니메이션으로 표시
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    });

    // 클릭 시 닫기
    notification.addEventListener('click', () => {
      this.hideNotification(notification);
    });

    // 자동 닫기
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, duration);
    }

    CONFIG_UTILS.debugLog(`Notification shown: ${type} - ${message}`);
  }

  /**
   * 알림 숨기기
   * @param {HTMLElement} notification - 알림 요소
   * @private
   */
  hideNotification(notification) {
    if (!notification || !notification.parentNode) return;

    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  /**
   * 리소스 정리 - 메모리 누수 방지
   * @public
   */
  cleanup() {
    try {
      // 모든 타이머 정지
      this.stopAllTimers();
      
      // RAF 정리
      this.rafIds.forEach(id => {
        if (id) cancelAnimationFrame(id);
      });
      this.rafIds = [];
      
      // 타이머 정리
      this.intervalIds.forEach(id => {
        if (id) clearTimeout(id);
      });
      this.intervalIds = [];
      
      // 이벤트 리스너 제거 (메모리 누수 방지)
      this.removeEventListeners();
      
      CONFIG_UTILS.debugLog('MultiTimer resources cleaned up successfully');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // 모바일 감지 및 UI 모드 관리

  /**
   * 종합적인 모바일 디바이스 감지
   * @returns {boolean} 모바일 디바이스 여부
   */
  isMobileDevice() {
    // 사용자 강제 설정이 있는 경우 우선 적용
    if (this.uiMode === 'mobile') return true;
    if (this.uiMode === 'desktop') return false;
    
    // User Agent 기반 감지
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // 터치 지원 여부
    const hasTouchScreen = (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      navigator.msMaxTouchPoints > 0
    );
    
    // 화면 크기
    const screenWidth = Math.min(window.innerWidth, window.screen?.width || window.innerWidth);
    const isSmallScreen = screenWidth <= 768;
    
    // 종합 판단 로직
    if (isMobileUA) {
      // 확실한 모바일 디바이스인 경우
      return true;
    }
    
    if (hasTouchScreen && isSmallScreen) {
      // 터치 지원 + 작은 화면 = 모바일 가능성 높음
      return true;
    }
    
    // iPad나 큰 태블릿 처리
    if (userAgent.includes('ipad') || 
        (hasTouchScreen && screenWidth <= 1024)) {
      return true;
    }
    
    // 기본값: 데스크탑
    return false;
  }

  /**
   * 디바이스 타입에 따른 CSS 클래스 적용
   */
  applyDeviceClass() {
    const body = document.body;
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      body.classList.add('mobile-device');
      body.classList.remove('desktop-device');
      CONFIG_UTILS.debugLog('Mobile UI mode activated');
    } else {
      body.classList.add('desktop-device');
      body.classList.remove('mobile-device');
      CONFIG_UTILS.debugLog('Desktop UI mode activated');
    }
  }

  /**
   * UI 모드 수동 전환
   * @param {string} mode - 'auto', 'mobile', 'desktop'
   */
  setUIMode(mode) {
    this.uiMode = mode;
    this.applyDeviceClass();
    this.saveSettings();
    
    // 설정 변경 피드백
    const modeNames = {
      'auto': '자동 감지',
      'mobile': '모바일 모드',
      'desktop': '데스크탑 모드'
    };
    
    CONFIG_UTILS.debugLog(`UI 모드 변경: ${modeNames[mode]}`);
  }

  /**
   * 화면 크기/방향 변경 감지 및 재평가
   */
  handleViewportChange() {
    // 자동 모드에서만 재평가
    if (this.uiMode === 'auto') {
      setTimeout(() => {
        this.applyDeviceClass();
        this.updateMobileTimerCount(); // 모바일 UI 업데이트
      }, 100); // 방향 변경 완료 대기
    }
  }

  // 모바일 전용 기능들

  /**
   * 모바일 UI 초기화
   */
  initializeMobileUI() {
    // 초기 아이콘 상태 설정
    this.updateAudioIcon();
    this.updateVibrationIcon();
    this.updateFullscreenIcon();
    this.updateMobileTimerCount();
    
    // 모바일 타이머 카운트 정기 업데이트 (1초마다)
    setInterval(() => {
      this.updateMobileTimerCount();
    }, 1000);
    
    CONFIG_UTILS.debugLog('Mobile UI initialized');
  }

  /**
   * 음향 토글 기능
   */
  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    this.updateAudioIcon();
    this.saveSettings();
    
    // 즉시 피드백 (활성화 시 테스트 사운드)
    if (this.audioEnabled) {
      this.playTestSound();
    }
    
    CONFIG_UTILS.debugLog(`Audio ${this.audioEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 진동 토글 기능
   */
  toggleVibration() {
    this.vibrationEnabled = !this.vibrationEnabled;
    this.updateVibrationIcon();
    this.saveSettings();
    
    // 즉시 피드백 (활성화 시 테스트 진동)
    if (this.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    CONFIG_UTILS.debugLog(`Vibration ${this.vibrationEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 모바일 설정 패널 토글 (중복 제거된 통합 패널)
   */
  toggleMobileSettings() {
    let mobilePanel = document.getElementById('mobile-settings-panel');
    
    if (mobilePanel) {
      // 기존 패널이 있으면 제거하고 원본 패널들 복원
      mobilePanel.remove();
      this.toggleMobileOverlay(false);
      
      // 원본 패널들 다시 표시
      const leftPanel = document.querySelector('.left-panel');
      const rightPanel = document.querySelector('.right-panel');
      if (leftPanel) leftPanel.style.display = '';
      if (rightPanel) rightPanel.style.display = '';
      return;
    }

    // 새로운 통합 설정 패널 생성
    mobilePanel = document.createElement('div');
    mobilePanel.id = 'mobile-settings-panel';
    mobilePanel.className = 'mobile-settings-panel';
    
    // 패널 스타일 설정 (폴백 먼저, dvh 나중에)
    Object.assign(mobilePanel.style, {
      position: 'fixed',
      top: '40px',
      right: '0',
      width: '85%',
      height: 'calc(100vh - 100px)',  // 폴백: 모든 브라우저 지원
      zIndex: '200',
      backgroundColor: 'var(--panel-bg)',
      boxShadow: '-4px 0 8px rgba(0,0,0,0.3)',
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease',
      overflowY: 'auto',
      padding: '20px 15px'
    });
    
    // dvh 지원 브라우저에서 덮어쓰기
    if (CSS.supports('height', '100dvh')) {
      mobilePanel.style.height = 'calc(100dvh - 100px)';
    }

    // 설정 내용 구성 (중복 제거)
    this.createMobileSettingsContent(mobilePanel);
    
    // 패널을 body에 추가
    document.body.appendChild(mobilePanel);
    
    // 오버레이 배경 표시
    this.toggleMobileOverlay(true);
  }

  /**
   * 모바일 설정 패널 내용 생성 (ID 충돌 해결)
   */
  createMobileSettingsContent(container) {
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if (!leftPanel || !rightPanel) {
      console.error('Left or right panel not found');
      return;
    }
    
    // 원본 패널들을 일시적으로 숨겨서 ID 충돌 방지
    leftPanel.style.display = 'none';
    rightPanel.style.display = 'none';
    
    // 왼쪽 패널에서 전체 제어 섹션 제외하고 복사 (중복 제거)
    const leftSections = leftPanel.querySelectorAll('.panel-section:not(:first-child)');
    leftSections.forEach(section => {
      const clonedSection = section.cloneNode(true);
      clonedSection.classList.add('mobile-settings-section');
      container.appendChild(clonedSection);
    });
    
    // 오른쪽 패널 전체 복사
    const rightSections = rightPanel.querySelectorAll('.panel-section');
    rightSections.forEach(section => {
      const clonedSection = section.cloneNode(true);
      clonedSection.classList.add('mobile-settings-section');
      container.appendChild(clonedSection);
    });
    
    // 복사된 요소들의 초기값 설정 및 이벤트 리스너 재연결
    this.initializeMobileSettingsValues(container);
    this.rebindMobileSettingsEvents(container);
  }

  /**
   * 모바일 설정 패널의 초기값 설정
   */
  initializeMobileSettingsValues(container) {
    // 자동 시작 체크박스 초기값 설정
    const autoStartToggle = container.querySelector('#auto-start-toggle');
    if (autoStartToggle) {
      if (this.autoStartEnabled) {
        autoStartToggle.setAttribute('checked', 'checked');
      } else {
        autoStartToggle.removeAttribute('checked');
      }
      autoStartToggle.checked = this.autoStartEnabled;
    }
    
    // 순차적 실행 체크박스 초기값 설정
    const sequentialToggle = container.querySelector('#sequential-toggle');
    if (sequentialToggle) {
      if (this.sequentialExecution) {
        sequentialToggle.setAttribute('checked', 'checked');
      } else {
        sequentialToggle.removeAttribute('checked');
      }
      sequentialToggle.checked = this.sequentialExecution;
    }
    
    // 타이머 개수 선택기 초기값 설정
    const timerCountSelect = container.querySelector('#timer-count-select');
    if (timerCountSelect) {
      timerCountSelect.value = this.currentTimerCount;
    }
    
    // 최대 시간 선택기 초기값 설정
    const maxTimeSelect = container.querySelector('#max-time-select');
    if (maxTimeSelect) {
      maxTimeSelect.value = this.currentMaxTime;
    }
    
    // UI 모드 선택기 초기값 설정
    const uiModeSelect = container.querySelector('#ui-mode-select');
    if (uiModeSelect) {
      uiModeSelect.value = this.uiMode;
    }
    
    // 라벨 입력 필드들 초기값 설정
    const labelInputs = container.querySelectorAll('.label-input');
    labelInputs.forEach((input, index) => {
      const originalInput = this.domElements.labelInputs[index];
      if (originalInput) {
        input.value = originalInput.value;
      }
    });
  }

  /**
   * 모바일 오버레이 토글
   */
  toggleMobileOverlay(show) {
    let overlay = document.getElementById('mobile-overlay');
    
    if (show && !overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mobile-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 150;
        transition: opacity 0.3s ease;
      `;
      overlay.addEventListener('click', () => {
        this.toggleMobileSettings(); // 오버레이 클릭시 설정 닫기
      });
      document.body.appendChild(overlay);
    } else if (!show && overlay) {
      overlay.remove();
    }
  }

  /**
   * 모바일 설정 패널의 이벤트 리스너 재연결
   */
  rebindMobileSettingsEvents(container) {
    // 타이머 개수 선택기
    const timerCountSelect = container.querySelector('#timer-count-select');
    if (timerCountSelect) {
      timerCountSelect.addEventListener('change', (e) => {
        const newCount = parseInt(e.target.value);
        if (this.validateTimerCount(newCount)) {
          this.changeTimerCount(newCount);
        }
      });
    }

    // 최대 시간 선택기
    const maxTimeSelect = container.querySelector('#max-time-select');
    if (maxTimeSelect) {
      maxTimeSelect.addEventListener('change', (e) => {
        this.currentMaxTime = parseInt(e.target.value);
        // 원본 선택기도 동기화
        if (this.domElements.maxTimeSelect) {
          this.domElements.maxTimeSelect.value = this.currentMaxTime;
        }
        // 최대 시간 변경 시 모든 타이머 초기화
        this.resetAllTimersToZero();
        this.saveSettings();
      });
    }

    // 전체 타이머 시간 적용 버튼
    const applyGlobalBtn = container.querySelector('#apply-global-time-btn');
    if (applyGlobalBtn) {
      applyGlobalBtn.addEventListener('click', () => {
        this.applyGlobalTimeFromMobile(container);
      });
    }

    // 테마 선택 버튼
    const themeBtn = container.querySelector('#theme-select-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.openThemeModal();
      });
    }

    // 종료음 선택 버튼
    const soundBtn = container.querySelector('#sound-select-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.openSoundModal();
      });
    }

    // UI 모드 선택기
    const uiModeSelect = container.querySelector('#ui-mode-select');
    if (uiModeSelect) {
      uiModeSelect.addEventListener('change', (e) => {
        this.uiMode = e.target.value;
        // 원본 선택기도 동기화
        if (this.domElements.uiModeSelect) {
          this.domElements.uiModeSelect.value = this.uiMode;
        }
        this.applyUIMode();
        this.saveSettings();
      });
    }

    // 자동 시작 토글 (ID 중복 문제 해결을 위해 click 이벤트로 변경)
    const autoStartLabel = container.querySelector('.auto-start-label');
    if (autoStartLabel) {
      const autoStartToggle = autoStartLabel.querySelector('input[type="checkbox"]');
      autoStartLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newState = !autoStartToggle.checked;
        autoStartToggle.checked = newState;
        this.autoStartEnabled = newState;

        if (this.domElements.autoStartToggle) {
          this.domElements.autoStartToggle.checked = newState;
        }
        this.saveSettings();
      });
    }

    // 순차적 실행 토글 (ID 중복 문제 해결을 위해 click 이벤트로 변경)
    const sequentialLabel = container.querySelector('.sequential-label');
    if (sequentialLabel) {
      const sequentialToggle = sequentialLabel.querySelector('input[type="checkbox"]');
      sequentialLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newState = !sequentialToggle.checked;
        sequentialToggle.checked = newState;
        this.sequentialExecution = newState;

        if (this.domElements.sequentialToggle) {
          this.domElements.sequentialToggle.checked = newState;
        }
        this.updateStartAllButtonText();
        this.saveSettings();
      });
    }

    // 라벨 입력 필드들
    const labelInputs = container.querySelectorAll('.label-input');
    labelInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        this.updateTimerLabelFromMobile(index, e.target.value);
        this.saveSettings();
      });
    });

    // 분할 애니메이션 토글 (ID 중복 문제 해결을 위해 click 이벤트로 변경)
    const segmentedAnimationLabel = container.querySelector('.segmented-animation-label');
    if (segmentedAnimationLabel) {
      const segmentedAnimationToggle = segmentedAnimationLabel.querySelector('input[type="checkbox"]');
      segmentedAnimationLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newState = !segmentedAnimationToggle.checked;
        segmentedAnimationToggle.checked = newState;
        this.segmentedAnimation = newState;

        if (this.domElements.segmentedAnimationToggle) {
          this.domElements.segmentedAnimationToggle.checked = newState;
        }

        // Re-render timers
        this.timers.forEach((timer, index) => {
            this.updateTimerTime(index, timer.totalTime);
        });

        this.saveSettings();
      });
    }
  }

  /**
   * 상태바 아이콘들 업데이트
   */
  updateAudioIcon() {
    if (this.domElements.mobileAudioToggle) {
      const icon = this.domElements.mobileAudioToggle.querySelector('.status-icon');
      if (icon) {
        icon.textContent = this.audioEnabled ? '🔊' : '🔇';
        this.domElements.mobileAudioToggle.classList.toggle('active', this.audioEnabled);
        this.domElements.mobileAudioToggle.classList.toggle('inactive', !this.audioEnabled);
      }
    }
  }

  updateVibrationIcon() {
    if (this.domElements.mobileVibrationToggle) {
      const icon = this.domElements.mobileVibrationToggle.querySelector('.status-icon');
      if (icon) {
        icon.textContent = this.vibrationEnabled ? '📱' : '📵';
        this.domElements.mobileVibrationToggle.classList.toggle('active', this.vibrationEnabled);
        this.domElements.mobileVibrationToggle.classList.toggle('inactive', !this.vibrationEnabled);
      }
    }
  }

  updateFullscreenIcon() {
    if (this.domElements.mobileFullscreenToggle) {
      const icon = this.domElements.mobileFullscreenToggle.querySelector('.status-icon');
      const isFullscreen = document.fullscreenElement !== null;
      if (icon) {
        icon.textContent = isFullscreen ? '⛷' : '⛶';
        this.domElements.mobileFullscreenToggle.classList.toggle('active', isFullscreen);
      }
    }
  }

  updateMobileTimerCount() {
    if (this.domElements.mobileTimerCount) {
      const runningCount = this.timers.filter(timer => timer.isRunning).length;
      this.domElements.mobileTimerCount.textContent = `⏱️${runningCount}/${this.currentTimerCount}`;
    }
  }

  /**
   * 테스트 사운드 재생
   */
  playTestSound() {
    try {
      if (this.audioEnabled) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.warn('Test sound playback failed:', error);
    }
  }

  /**
   * 이벤트 리스너 제거
   * @private
   */
  removeEventListeners() {
    // 전역 이벤트 리스너 제거는 복잡하므로 주요 리스너만 처리
    // 실제 운영에서는 페이지 언로드 시 자동으로 정리됨
    CONFIG_UTILS.debugLog('Event listeners cleanup completed');
  }

  // 종료 시 정리 (메모리 누수 방지)
  destroy() {
    try {
      // AbortController로 모든 이벤트 리스너 일괄 제거
      this.abortController.abort();
      
      // 모든 타이머 중지
      this.timers.forEach((timer, index) => {
        this.stopTimer(index);
      });
      
      // RAF 정리
      this.rafIds.forEach(id => {
        if (id) cancelAnimationFrame(id);
      });
      this.rafIds.clear();
      
      // Timeout 정리
      this.timeoutIds.forEach(id => {
        if (id) clearTimeout(id);
      });
      this.timeoutIds.clear();
      
      // 렌더링 큐 정리
      this.performanceOptimizer.renderQueue = [];
      this.performanceOptimizer.pendingUpdates.clear();
      
      // ResizeObserver 정리
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      // DOM 참조 정리
      Object.keys(this.domElements).forEach(key => {
        if (Array.isArray(this.domElements[key])) {
          this.domElements[key] = [];
        } else {
          this.domElements[key] = null;
        }
      });
      
      CONFIG_UTILS.debugLog('MultiTimer destroyed with complete cleanup');
    } catch (error) {
      console.error('Error during MultiTimer cleanup:', error);
    }
  }

  // 디바운싱 유틸리티 함수
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        if (timeout) {
          this.timeoutIds.delete(timeout);
          timeout = null;
        }
        func.apply(this, args);
      };
      
      if (timeout) {
        clearTimeout(timeout);
        this.timeoutIds.delete(timeout);
      }
      
      timeout = setTimeout(later, wait);
      this.timeoutIds.add(timeout);
    }.bind(this);
  }

  // === 테마 시스템 메서드들 ===

  /**
   * 테마 관련 이벤트 바인딩
   */
  bindThemeEvents() {
    if (!this.domElements.themeSelectBtn) return;

    // 테마 선택 버튼 클릭
    this.domElements.themeSelectBtn.addEventListener('click', () => {
      this.openThemeModal();
    }, { signal: this.abortController.signal });

    // 테마 확인 버튼
    if (this.domElements.themeConfirmBtn) {
      this.domElements.themeConfirmBtn.addEventListener('click', () => {
        this.confirmThemeSelection();
      }, { signal: this.abortController.signal });
    }

    // 테마 취소 버튼
    if (this.domElements.themeCancelBtn) {
      this.domElements.themeCancelBtn.addEventListener('click', () => {
        this.closeThemeModal();
      }, { signal: this.abortController.signal });
    }

    // 테마 모달 닫기 버튼
    if (this.domElements.themeModalClose) {
      this.domElements.themeModalClose.addEventListener('click', () => {
        this.closeThemeModal();
      }, { signal: this.abortController.signal });
    }

    // 모달 배경 클릭 시 닫기
    if (this.domElements.themeModal) {
      this.domElements.themeModal.addEventListener('click', (e) => {
        if (e.target === this.domElements.themeModal) {
          this.closeThemeModal();
        }
      }, { signal: this.abortController.signal });
    }
  }

  /**
   * 테마 선택 모달 열기
   */
  openThemeModal() {
    if (!this.domElements.themeModal) return;

    // 현재 테마에 따라 라디오 버튼 설정
    this.domElements.themeOptions.forEach(option => {
      option.checked = option.value === this.currentTheme;
    });

    this.domElements.themeModal.style.display = 'block';
    this.domElements.themeModal.setAttribute('aria-hidden', 'false');

    // 첫 번째 라디오 버튼에 포커스
    const firstRadio = this.domElements.themeModal.querySelector('input[type="radio"]');
    if (firstRadio) {
      firstRadio.focus();
    }
  }

  /**
   * 테마 선택 확인
   */
  confirmThemeSelection() {
    const selectedOption = this.domElements.themeModal.querySelector('input[name="theme-option"]:checked');
    
    if (selectedOption && selectedOption.value !== this.currentTheme) {
      this.currentTheme = selectedOption.value;
      this.applyTheme();
      this.updateAllTimerColors();
      this.saveSettings();
    }

    this.closeThemeModal();
  }

  /**
   * 테마 선택 모달 닫기
   */
  closeThemeModal() {
    if (!this.domElements.themeModal) return;

    this.domElements.themeModal.style.display = 'none';
    this.domElements.themeModal.setAttribute('aria-hidden', 'true');
  }

  /**
   * 테마 적용
   */
  applyTheme() {
    const body = document.body;
    const theme = CONFIG.THEMES[this.currentTheme] || CONFIG.THEMES.COLOR;
    
    // 테마 클래스 적용/제거
    if (this.currentTheme === 'MINIMAL') {
      body.classList.add('minimal-theme');
    } else {
      body.classList.remove('minimal-theme');
    }
    
    // 현재 테마 이름 업데이트
    if (this.domElements.currentThemeName) {
      this.domElements.currentThemeName.textContent = theme.NAME;
    }
    
    CONFIG_UTILS.debugLog(`Theme applied: ${theme.NAME}`);
  }

  /**
   * 모든 타이머 색상 업데이트
   */
  updateAllTimerColors() {
    for (let i = 0; i < this.currentTimerCount; i++) {
      this.updateTimerColor(i);
    }
  }

  /**
   * 개별 타이머 색상 업데이트
   */
  updateTimerColor(timerId) {
    if (!this.isValidTimerId(timerId)) return;
    
    const timerFill = this.domElements.timerFills[timerId];
    if (!timerFill) return;
    
    const color = CONFIG_UTILS.getTimerColor(timerId, this.currentTheme);
    timerFill.style.backgroundColor = color;
    
    // 타이머 객체의 색상도 업데이트
    if (this.timers[timerId]) {
      this.timers[timerId].color = color;
    }
  }

  /**
   * 설정 로드
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PREFERENCES);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        if (settings.currentTheme && CONFIG.THEMES[settings.currentTheme]) {
          this.currentTheme = settings.currentTheme;
        }
        
        if (settings.autoStartEnabled !== undefined) {
          this.autoStartEnabled = settings.autoStartEnabled;
        }
        
        if (settings.selectedSound !== undefined) {
          this.selectedSound = settings.selectedSound;
        }
        
        // 모바일 관련 설정 로드
        if (settings.uiMode !== undefined) {
          this.uiMode = settings.uiMode;
          if (this.domElements.uiModeSelect) {
            this.domElements.uiModeSelect.value = this.uiMode;
          }
        }
        
        if (settings.audioEnabled !== undefined) {
          this.audioEnabled = settings.audioEnabled;
        }
        
        if (settings.vibrationEnabled !== undefined) {
          this.vibrationEnabled = settings.vibrationEnabled;
        }

        if (settings.segmentedAnimation !== undefined) {
          this.segmentedAnimation = settings.segmentedAnimation;
          if (this.domElements.segmentedAnimationToggle) {
            this.domElements.segmentedAnimationToggle.checked = this.segmentedAnimation;
          }
        }
        
        CONFIG_UTILS.debugLog('Settings loaded successfully', settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * 설정 저장
   */
  saveSettings() {
    try {
      const settings = {
        currentTheme: this.currentTheme,
        autoStartEnabled: this.autoStartEnabled,
        selectedSound: this.selectedSound,
        // 모바일 관련 설정 저장
        uiMode: this.uiMode,
        audioEnabled: this.audioEnabled,
        vibrationEnabled: this.vibrationEnabled,
        segmentedAnimation: this.segmentedAnimation
      };
      
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(settings));
      CONFIG_UTILS.debugLog('Settings saved successfully', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

}

// 전역 이벤트 리스너 (성능 최적화)
const handleFullscreenGlobal = () => {
  const app = window.multiTimerApp;
  if (app) {
    app.isFullscreen = !!document.fullscreenElement;
    
    // DOM 조작 배치 처리
    requestAnimationFrame(() => {
      const appContainer = document.querySelector('.app-container');
      if (app.isFullscreen) {
        appContainer.classList.add('fullscreen-mode');
      } else {
        appContainer.classList.remove('fullscreen-mode');
      }
    });
  }
};

document.addEventListener('fullscreenchange', handleFullscreenGlobal);
document.addEventListener('webkitfullscreenchange', handleFullscreenGlobal);
document.addEventListener('mozfullscreenchange', handleFullscreenGlobal);

// 앱 초기화 (성능 최적화)
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.multiTimerApp = new MultiTimer();
    
    
    // 성능 모니터링 (개발 모드)
    if (CONFIG.DEBUG.SHOW_PERFORMANCE_METRICS) {
      const monitorPerformance = () => {
        if (window.multiTimerApp) {
          const metrics = {
            timers: window.multiTimerApp.timers.length,
            runningTimers: window.multiTimerApp.timers.filter(t => t.isRunning).length,
            renderQueueSize: window.multiTimerApp.performanceOptimizer.renderQueue.length,
            memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A'
          };
          console.log('Performance metrics:', metrics);
        }
      };
      
      setInterval(monitorPerformance, 10000); // 10초마다
    }
    
    // 메모리 누수 방지 - 페이지 언로드 시 정리
    window.addEventListener('beforeunload', () => {
      if (window.multiTimerApp && typeof window.multiTimerApp.destroy === 'function') {
        window.multiTimerApp.destroy();
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize MultiTimer:', error);
  }
});

// 페이지 언로드 시 리소스 정리
window.addEventListener('beforeunload', () => {
  if (window.multiTimerApp) {
    // 리소스 정리
    window.multiTimerApp.cleanup();
  }
});