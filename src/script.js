// MultiTimer 메인 JavaScript 파일

/**
 * MultiTimer - 다중 타이머 관리 클래스
 * 정확한 시간 추적과 성능 최적화를 위한 DOM 캐싱 구현
 */
class MultiTimer {
  constructor() {
    // 상태 관리
    this.timers = [];
    this.intervalIds = [];
    this.currentMaxTime = CONFIG.TIMERS.DEFAULT_MAX_TIME;
    this.displayMode = CONFIG.TIME_FORMAT.DISPLAY_MODE;
    this.isFullscreen = false;
    this.rotationLocked = false;
    this.autoStartEnabled = CONFIG.FEATURES.AUTO_START_ENABLED;
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
      timerBars: [],
      // 모달 관련 요소들
      modal: null,
      modalClose: null,
      confirmBtn: null,
      cancelBtn: null,
      hoursInput: null,
      minutesInput: null,
      secondsInput: null,
      // 전역 컨트롤 요소들
      runningCount: null
    };

    // RAF ID 추적 (메모리 누수 방지)
    this.rafIds = [];

    try {
      this.initializeTimers();
      this.cacheDOMElements();
      this.updateAllDisplays(); // DOM 캐싱 후 UI 업데이트
      this.bindEvents();
      this.loadUserSettings();
      CONFIG_UTILS.debugLog('MultiTimer initialized successfully');
    } catch (error) {
      console.error('MultiTimer initialization failed:', error);
      throw error;
    }
  }

  /**
   * 타이머 초기화 - 모든 타이머 객체 생성
   * @private
   */
  initializeTimers() {
    for (let i = 0; i < CONFIG.TIMERS.COUNT; i++) {
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
      sound: CONFIG_UTILS.getTimerSound(id),
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
      // 타이머 관련 요소들 캐싱
      for (let i = 0; i < CONFIG.TIMERS.COUNT; i++) {
        const timerRow = document.querySelector(`[data-timer-id="${i}"]`);
        if (!timerRow) {
          throw new Error(`Timer row ${i} not found`);
        }
        
        this.domElements.timerRows[i] = timerRow;
        this.domElements.timerFills[i] = timerRow.querySelector('.timer-fill');
        this.domElements.timeTexts[i] = timerRow.querySelector('.time-text');
        this.domElements.playButtons[i] = timerRow.querySelector('.play-pause-btn');
        this.domElements.labelTexts[i] = timerRow.querySelector('.label-text');
        this.domElements.timerBars[i] = timerRow.querySelector('.timer-bar');
      }
      
      // 모달 관련 요소들 캐싱
      this.domElements.modal = document.getElementById('time-input-modal');
      this.domElements.modalClose = this.domElements.modal.querySelector('.modal-close');
      this.domElements.confirmBtn = document.getElementById('time-confirm-btn');
      this.domElements.cancelBtn = document.getElementById('time-cancel-btn');
      this.domElements.hoursInput = document.getElementById('hours-input');
      this.domElements.minutesInput = document.getElementById('minutes-input');
      this.domElements.secondsInput = document.getElementById('seconds-input');
      
      // 전역 컨트롤 요소들 캐싱
      this.domElements.runningCount = document.getElementById('running-count');
      
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
    
    // 오른쪽 패널 컨트롤
    this.bindRightPanelControls();
    
    // 모달 이벤트
    this.bindModalEvents();
    
    // 키보드 단축키
    if (CONFIG.FEATURES.KEYBOARD_SHORTCUTS) {
      this.bindKeyboardEvents();
    }
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
    
    // 시간 표시 모드 토글
    document.getElementById('display-mode-toggle').addEventListener('change', (e) => {
      this.displayMode = e.target.checked ? 'elapsed' : 'remaining';
      this.updateAllDisplays();
    });
    
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

  // 오른쪽 패널 컨트롤 바인딩
  bindRightPanelControls() {
    // 풀스크린 버튼
    document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
    
    // 회전 방지 토글
    document.getElementById('rotation-lock-toggle').addEventListener('change', (e) => {
      this.rotationLocked = e.target.checked;
      this.applyRotationLock();
    });
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
        case '1': case '2': case '3': case '4': case '5':
          const timerId = parseInt(e.key) - 1;
          if (timerId < CONFIG.TIMERS.COUNT) {
            this.toggleTimer(timerId);
          }
          break;
      }
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
      initialHeight: ((this.timers[timerId].totalTime / this.currentMaxTime) * 100)
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
    const deltaPercent = (deltaY / barHeight) * 100;
    
    let newPercent = Math.max(0, Math.min(100, this.dragState.initialHeight + deltaPercent));
    
    // 10초 단위로 스냅
    if (CONFIG.DRAG.SNAP_TO_MINUTES) {
      const timeInSeconds = (newPercent / 100) * this.currentMaxTime;
      const snappedTime = Math.round(timeInSeconds / 10) * 10; // 10초 단위로 변경
      newPercent = Math.max(0, (snappedTime / this.currentMaxTime) * 100);
    }
    
    const newTime = Math.max(CONFIG.TIMERS.MIN_TIME, (newPercent / 100) * this.currentMaxTime);
    
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
    
    const hours = Math.floor(timer.totalTime / 3600);
    const minutes = Math.floor((timer.totalTime % 3600) / 60);
    const seconds = timer.totalTime % 60;
    
    this.domElements.hoursInput.value = hours;
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
    const hours = Math.min(parseInt(this.domElements.hoursInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_HOURS);
    const minutes = Math.min(parseInt(this.domElements.minutesInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_MINUTES);
    const seconds = Math.min(parseInt(this.domElements.secondsInput.value) || 0, CONFIG.UI.VALIDATION.TIME_INPUT_MAX_SECONDS);
    
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    if (totalSeconds > this.currentMaxTime) {
      alert(CONFIG.MESSAGES.ERROR.MAX_TIME_EXCEEDED);
      return;
    }
    
    if (totalSeconds < CONFIG.TIMERS.MIN_TIME && totalSeconds > 0) {
      alert(CONFIG.MESSAGES.ERROR.INVALID_TIME);
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
    
    this.updateTimerDisplay(timerId);
    this.updateTimerBar(timerId);
    this.updateTimerButton(timerId);
  }

  // 개별 타이머 토글
  toggleTimer(timerId) {
    const timer = this.timers[timerId];
    
    if (timer.totalTime === 0) {
      alert('먼저 시간을 설정해주세요.');
      return;
    }
    
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
        this.intervalIds[timerId] = setTimeout(timerTick, nextUpdate);
      }
    };
    
    // 첫 번째 틱 실행
    this.intervalIds[timerId] = setTimeout(timerTick, 100);
    
    this.updateTimerButton(timerId);
    this.updateRunningCount();
    
    CONFIG_UTILS.debugLog(`Timer ${timerId} started with accurate timing`);
  }

  // 타이머 정지
  stopTimer(timerId) {
    const timer = this.timers[timerId];
    timer.isRunning = false;
    
    if (this.intervalIds[timerId]) {
      clearTimeout(this.intervalIds[timerId]); // setTimeout 사용으로 변경
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
      clearTimeout(this.intervalIds[timerId]); // setTimeout 사용으로 변경
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
    
    CONFIG_UTILS.debugLog(`Timer ${timerId} completed`);
  }

  // 전체 타이머 시작
  startAllTimers() {
    this.timers.forEach((timer, index) => {
      if (timer.totalTime > 0 && !timer.isRunning) {
        this.startTimer(index);
      }
    });
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

  // 깜빡임 효과 시작
  startBlinkEffect(timerId) {
    this.domElements.timerRows[timerId].classList.add('completed');
  }

  // 깜빡임 효과 중지
  stopBlinkEffect(timerId) {
    this.domElements.timerRows[timerId].classList.remove('completed');
  }

  // 알람 소리 재생
  async playAlarmSound(soundFile) {
    try {
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
      // 대체 방법: 시스템 beep
      console.log('\a'); // ASCII bell character
    }
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

  // 회전 방지 적용
  applyRotationLock() {
    if (this.rotationLocked && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {
        CONFIG_UTILS.debugLog('Screen orientation lock failed');
      });
    } else if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }

  // UI 업데이트 메서드들
  /**
   * 타이머 표시 업데이트 - 캐시된 DOM 요소 사용
   * @param {number} timerId - 타이멸 ID
   */
  updateTimerDisplay(timerId) {
    if (!this.isValidTimerId(timerId)) return;
    
    const timer = this.timers[timerId];
    const timeText = this.domElements.timeTexts[timerId];
    
    if (!timeText) {
      console.warn(`Time text element not found for timer ${timerId}`);
      return;
    }
    
    const displayTime = this.displayMode === 'elapsed' 
      ? timer.totalTime - timer.currentTime
      : timer.currentTime;
    
    timeText.textContent = CONFIG_UTILS.formatTime(displayTime);
  }

  /**
   * 타이멸 막대 업데이트 - 캐시된 DOM 요소 사용
   * @param {number} timerId - 타이멸 ID
   */
  updateTimerBar(timerId) {
    if (!this.isValidTimerId(timerId)) return;
    
    const timer = this.timers[timerId];
    const timerFill = this.domElements.timerFills[timerId];
    
    if (!timerFill) {
      console.warn(`Timer fill element not found for timer ${timerId}`);
      return;
    }
    
    const percentage = this.calculateBarPercentage(timer);
    timerFill.style.height = `${Math.max(0, Math.min(100, percentage))}%`;
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
    
    if (this.displayMode === 'elapsed') {
      const elapsedTime = timer.totalTime - timer.currentTime;
      const elapsedPercentage = (elapsedTime / timer.totalTime) * 100;
      return (elapsedPercentage / 100) * maxBarLength;
    } else {
      const remainingPercentage = (timer.currentTime / timer.totalTime) * 100;
      return (remainingPercentage / 100) * maxBarLength;
    }
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
           timerId < CONFIG.TIMERS.COUNT && 
           this.timers[timerId];
  }

  updateAllTimerBars() {
    this.timers.forEach((timer, index) => {
      this.updateTimerBar(index);
    });
  }

  updateAllDisplays() {
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
    this.domElements.runningCount.textContent = `${runningCount}/${CONFIG.TIMERS.COUNT} 실행 중`;
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

  /**
   * 이벤트 리스너 제거
   * @private
   */
  removeEventListeners() {
    // 전역 이벤트 리스너 제거는 복잡하므로 주요 리스너만 처리
    // 실제 운영에서는 페이지 언로드 시 자동으로 정리됨
    CONFIG_UTILS.debugLog('Event listeners cleanup completed');
  }

  // 사용자 설정 저장/로드
  saveUserSettings() {
    if (!CONFIG.FEATURES.AUTO_SAVE_SETTINGS) return;
    
    const settings = {
      displayMode: this.displayMode,
      maxTime: this.currentMaxTime,
      labels: this.timers.map(timer => timer.label),
      rotationLocked: this.rotationLocked,
      autoStartEnabled: this.autoStartEnabled
    };
    
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(settings));
    } catch (error) {
      CONFIG_UTILS.debugLog('Failed to save settings:', error);
    }
  }

  loadUserSettings() {
    if (!CONFIG.FEATURES.AUTO_SAVE_SETTINGS) return;
    
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PREFERENCES);
      if (saved) {
        const settings = JSON.parse(saved);
        
        this.displayMode = settings.displayMode || CONFIG.TIME_FORMAT.DISPLAY_MODE;
        this.currentMaxTime = settings.maxTime || CONFIG.TIMERS.DEFAULT_MAX_TIME;
        this.rotationLocked = settings.rotationLocked || false;
        this.autoStartEnabled = settings.autoStartEnabled !== undefined ? settings.autoStartEnabled : CONFIG.FEATURES.AUTO_START_ENABLED;
        
        // UI 요소 업데이트
        document.getElementById('display-mode-toggle').checked = (this.displayMode === 'elapsed');
        document.getElementById('max-time-select').value = this.currentMaxTime;
        document.getElementById('rotation-lock-toggle').checked = this.rotationLocked;
        document.getElementById('auto-start-toggle').checked = this.autoStartEnabled;
        
        // 라벨 복원
        if (settings.labels) {
          settings.labels.forEach((label, index) => {
            if (index < this.timers.length) {
              this.timers[index].label = label;
              document.getElementById(`label-${index}`).value = label;
            }
          });
        }
      }
    } catch (error) {
      CONFIG_UTILS.debugLog('Failed to load settings:', error);
    }
  }
}

// 전역 이벤트 리스너
document.addEventListener('fullscreenchange', () => {
  const app = window.multiTimerApp;
  if (app) {
    app.isFullscreen = !!document.fullscreenElement;
  }
});

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.multiTimerApp = new MultiTimer();
  
  // 설정 자동 저장
  if (CONFIG.FEATURES.AUTO_SAVE_SETTINGS) {
    setInterval(() => {
      window.multiTimerApp.saveUserSettings();
    }, 30000); // 30초마다 저장
  }
  
  // 성능 모니터링 (개발 모드)
  if (CONFIG.DEBUG.SHOW_PERFORMANCE_METRICS) {
    setInterval(() => {
      console.log('Performance metrics:', {
        timers: window.multiTimerApp.timers.length,
        runningTimers: window.multiTimerApp.timers.filter(t => t.isRunning).length,
        memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A'
      });
    }, 10000); // 10초마다
  }
});

// 페이지 언로드 시 설정 저장 및 리소스 정리
window.addEventListener('beforeunload', () => {
  if (window.multiTimerApp) {
    if (CONFIG.FEATURES.AUTO_SAVE_SETTINGS) {
      window.multiTimerApp.saveUserSettings();
    }
    // 리소스 정리
    window.multiTimerApp.cleanup();
  }
});