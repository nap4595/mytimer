import { CONFIG } from '../../shared/core/config.js';
import * as utils from '../../shared/core/utils.js';
import { Modal } from '../../shared/components/modal.js';
import { showNotification } from '../../shared/components/notification.js';
import * as themeManager from '../../shared/components/themes.js';

class MultiTimer {
  constructor() {
    utils.debugLog('MultiTimer initializing...');

    themeManager.initThemeManager();

    this.timers = [];
    this.intervalIds = [];
    this.currentMaxTime = CONFIG.TIMERS.DEFAULT_MAX_TIME;
    this.currentTimerCount = CONFIG.TIMERS.COUNT;
    this.isFullscreen = false;
    this.autoStartEnabled = CONFIG.FEATURES.AUTO_START_ENABLED;
    this.sequentialExecution = CONFIG.FEATURES.SEQUENTIAL_EXECUTION;
    this.segmentedAnimation = CONFIG.FEATURES.SEGMENTED_ANIMATION;
    this.selectedSound = Object.keys(CONFIG.SOUNDS.OPTIONS)[0];

    this.audioEnabled = true;
    this.vibrationEnabled = true;

    this.dragState = { isDragging: false, timerId: null, startY: 0, initialHeight: 0 };
    this.domElements = {};
    this.modals = {};
    this.abortController = new AbortController();
    this.timeoutIds = new Set();

    try {
      this.init();
    } catch (error) {
      console.error('MultiTimer initialization failed:', error);
      showNotification('Application failed to load.', 'error');
    }
  }

  init() {
    this.createTimerHTML();
    this.initializeTimers();
    this.cacheDOMElements();
    this.initModals();
    this.loadSettings();
    this.updateAllDisplays();
    this.bindEvents();
    utils.debugLog('MultiTimer initialized successfully');
  }

  createTimerHTML() {
    const timerContainer = document.getElementById('timer-container');
    const labelContainer = document.getElementById('label-inputs-container');
    timerContainer.innerHTML = '';
    if (labelContainer) labelContainer.innerHTML = '';
    timerContainer.setAttribute('data-timer-count', this.currentTimerCount);

    for (let i = 0; i < this.currentTimerCount; i++) {
      timerContainer.insertAdjacentHTML('beforeend', this.getSingleTimerHTML(i));
      if (labelContainer) labelContainer.insertAdjacentHTML('beforeend', this.getLabelInputHTML(i));
    }
  }

  getSingleTimerHTML(index) {
    const label = utils.getTimerLabel(index);
    return `
      <div class="timer-row" data-timer-id="${index}">
        <div class="timer-label"><span class="label-text">${label}</span></div>
        <div class="timer-bar-container">
          <div class="timer-bar"></div>
          <div class="time-display"><span class="time-text">00:00</span></div>
        </div>
        <div class="timer-controls">
          <button class="play-pause-btn" data-timer-id="${index}"><span class="btn-icon">▶</span></button>
          <button class="reset-btn" data-timer-id="${index}"><span class="btn-icon">✖</span></button>
        </div>
      </div>`;
  }

  getLabelInputHTML(index) {
    return `<input type="text" id="label-${index}" class="label-input" placeholder="Timer ${index + 1}" maxlength="${CONFIG.UI.VALIDATION.LABEL_MAX_LENGTH}" value="${utils.getTimerLabel(index)}">`;
  }

  initializeTimers() {
    this.timers = Array.from({ length: this.currentTimerCount }, (_, i) => this.createTimerObject(i));
    this.intervalIds = new Array(this.currentTimerCount).fill(null);
  }

  createTimerObject(id) {
    return { id, label: utils.getTimerLabel(id), totalTime: 0, currentTime: 0, isRunning: false, isCompleted: false, startTime: null, expectedTime: null };
  }

  loadSettings() {
    const prefs = utils.loadFromStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES) || {};
    this.autoStartEnabled = prefs.autoStartEnabled ?? CONFIG.FEATURES.AUTO_START_ENABLED;
    this.sequentialExecution = prefs.sequentialExecution ?? CONFIG.FEATURES.SEQUENTIAL_EXECUTION;
    this.segmentedAnimation = prefs.segmentedAnimation ?? CONFIG.FEATURES.SEGMENTED_ANIMATION;
    this.selectedSound = prefs.selectedSound ?? Object.keys(CONFIG.SOUNDS.OPTIONS)[0];
    this.audioEnabled = prefs.audioEnabled ?? true;
    this.vibrationEnabled = prefs.vibrationEnabled ?? true;

    if(this.domElements.autoStartToggle) this.domElements.autoStartToggle.checked = this.autoStartEnabled;
    if(this.domElements.sequentialToggle) this.domElements.sequentialToggle.checked = this.sequentialExecution;
    if(this.domElements.segmentedAnimationToggle) this.domElements.segmentedAnimationToggle.checked = this.segmentedAnimation;

    themeManager.setTheme(prefs.currentTheme || CONFIG.THEMES.DEFAULT);
    this.updateAllTimerColors();
    utils.debugLog('Settings loaded', prefs);
  }

  saveSettings() {
    const prefs = {
      autoStartEnabled: this.autoStartEnabled,
      sequentialExecution: this.sequentialExecution,
      segmentedAnimation: this.segmentedAnimation,
      selectedSound: this.selectedSound,
      audioEnabled: this.audioEnabled,
      vibrationEnabled: this.vibrationEnabled,
      currentTheme: themeManager.getCurrentThemeName()
    };
    utils.saveToStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES, prefs);
    utils.debugLog('Settings saved', prefs);
  }

  cacheDOMElements() {
    const S = (selector) => document.querySelector(selector);
    const SA = (selector) => document.querySelectorAll(selector);
    this.domElements = {
      timerRows: SA('.timer-row'), timerFills: [], timeTexts: SA('.time-text'),
      playButtons: SA('.play-pause-btn'), labelTexts: SA('.label-text'), labelInputs: SA('.label-input'),
      timerBars: SA('.timer-bar'), runningCount: S('#running-count'), globalMinutesInput: S('#global-minutes-input'),
      globalSecondsInput: S('#global-seconds-input'), applyGlobalTimeBtn: S('#apply-global-time-btn'),
      maxTimeSelect: S('#max-time-select'), autoStartToggle: S('#auto-start-toggle'),
      sequentialToggle: S('#sequential-toggle'), segmentedAnimationToggle: S('#segmented-animation-toggle'),
      startAllBtn: S('#start-all-btn'), stopAllBtn: S('#stop-all-btn'), resetAllBtn: S('#reset-all-btn'),
      timerCountSelect: S('#timer-count-select'), themeSelectBtn: S('#theme-select-btn'), soundSelectBtn: S('#sound-select-btn'),
    };
    this.domElements.timerBars.forEach((bar, i) => this.createTimerSegments(i));
  }

  initModals() {
      this.modals.timeInput = new Modal('time-input-modal', { onConfirm: this.confirmTimeInput.bind(this) });
      this.modals.soundSelect = new Modal('sound-select-modal', { onConfirm: this.confirmSoundSelection.bind(this) });
      this.modals.themeSelect = new Modal('theme-select-modal', { onConfirm: this.confirmThemeSelection.bind(this) });
  }

  bindEvents() {
    this.domElements.timerBars.forEach((bar, index) => {
        const timeDisplay = bar.closest('.timer-row').querySelector('.time-display');
        timeDisplay.addEventListener('click', (e) => { e.stopPropagation(); this.openTimeInputModal(index); });
    });
    this.domElements.startAllBtn.addEventListener('click', () => this.startAllTimers());
    this.domElements.stopAllBtn.addEventListener('click', () => this.stopAllTimers());
    this.domElements.resetAllBtn.addEventListener('click', () => this.resetAllTimers());
    if (this.domElements.themeSelectBtn) this.domElements.themeSelectBtn.addEventListener('click', () => this.modals.themeSelect.show());
    if (this.domElements.soundSelectBtn) this.domElements.soundSelectBtn.addEventListener('click', () => this.modals.soundSelect.show());
    if (this.domElements.autoStartToggle) this.domElements.autoStartToggle.addEventListener('change', (e) => { this.autoStartEnabled = e.target.checked; this.saveSettings(); });
    if (this.domElements.sequentialToggle) this.domElements.sequentialToggle.addEventListener('change', (e) => { this.sequentialExecution = e.target.checked; this.saveSettings(); });
    if (this.domElements.segmentedAnimationToggle) this.domElements.segmentedAnimationToggle.addEventListener('change', (e) => { this.segmentedAnimation = e.target.checked; this.saveSettings(); this.resetAllTimersToZero(); });
    if (this.domElements.maxTimeSelect) this.domElements.maxTimeSelect.addEventListener('change', (e) => { this.currentMaxTime = parseInt(e.target.value); this.resetAllTimersToZero(); });
    if (this.domElements.timerCountSelect) this.domElements.timerCountSelect.addEventListener('change', (e) => this.changeTimerCount(parseInt(e.target.value)));
  }

  openTimeInputModal(timerId) {
    this.currentEditingTimer = timerId;
    const timer = this.timers[timerId];
    const minutesInput = this.modals.timeInput.modalElement.querySelector('#minutes-input');
    const secondsInput = this.modals.timeInput.modalElement.querySelector('#seconds-input');
    minutesInput.value = Math.floor(timer.totalTime / 60);
    secondsInput.value = timer.totalTime % 60;
    this.modals.timeInput.show();
  }

  confirmTimeInput() {
    const minutesInput = this.modals.timeInput.modalElement.querySelector('#minutes-input');
    const secondsInput = this.modals.timeInput.modalElement.querySelector('#seconds-input');
    const totalSeconds = (parseInt(minutesInput.value) || 0) * 60 + (parseInt(secondsInput.value) || 0);

    if (totalSeconds > this.currentMaxTime) return showNotification(CONFIG.MESSAGES.ERROR.MAX_TIME_EXCEEDED, 'error');

    this.updateTimerTime(this.currentEditingTimer, totalSeconds);
    if (totalSeconds > 0 && this.autoStartEnabled) this.startTimer(this.currentEditingTimer);
  }

  confirmSoundSelection() {
    const selected = this.modals.soundSelect.modalElement.querySelector('input[name="sound-option"]:checked');
    if (selected) { this.selectedSound = selected.value; this.saveSettings(); }
  }

  confirmThemeSelection() {
    const selected = this.modals.themeSelect.modalElement.querySelector('input[name="theme-option"]:checked');
    if (selected) { themeManager.setTheme(selected.value); this.updateAllTimerColors(); }
  }

  updateTimerTime(timerId, timeInSeconds) {
    const timer = this.timers[timerId];
    if (timer.isRunning) this.stopTimer(timerId);
    timer.totalTime = Math.round(timeInSeconds);
    timer.currentTime = timer.totalTime;
    timer.isCompleted = false;
    this.stopBlinkEffect(timerId);
    this.createTimerSegments(timerId);
    this.updateAllDisplaysForTimer(timerId);
  }

  startTimer(timerId) {
    const timer = this.timers[timerId];
    if (timer.isCompleted) { timer.currentTime = timer.totalTime; timer.isCompleted = false; this.stopBlinkEffect(timerId); }
    timer.isRunning = true;
    timer.startTime = performance.now();
    timer.expectedTime = timer.startTime + (timer.currentTime * 1000);
    const tick = () => {
        if (!timer.isRunning) return;
        timer.currentTime = Math.max(0, Math.ceil((timer.expectedTime - performance.now()) / 1000));
        if (timer.currentTime <= 0) { this.completeTimer(timerId); }
        else {
            this.updateAllDisplaysForTimer(timerId);
            const nextTick = (performance.now() - timer.startTime) % 1000;
            this.intervalIds[timerId] = setTimeout(tick, 1000 - nextTick);
        }
    };
    tick();
    this.updateRunningCount();
  }

  stopTimer(timerId) {
    this.timers[timerId].isRunning = false;
    clearTimeout(this.intervalIds[timerId]);
    this.updateAllDisplaysForTimer(timerId);
    this.updateRunningCount();
  }

  completeTimer(timerId) {
    const timer = this.timers[timerId];
    timer.isRunning = false;
    timer.isCompleted = true;
    timer.currentTime = 0;
    this.updateAllDisplaysForTimer(timerId);
    this.updateRunningCount();
    if (this.audioEnabled) this.playAlarmSound();
    if (this.vibrationEnabled && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    this.startBlinkEffect(timerId);
    if (this.sequentialExecution) {
      const nextTimerId = this.timers.findIndex((t, i) => i > timerId && t.totalTime > 0 && !t.isCompleted);
      if (nextTimerId !== -1) this.startTimer(nextTimerId);
    }
  }

  resetTimer(timerId) { this.stopTimer(timerId); this.updateTimerTime(timerId, 0); }
  resetAllTimers() { this.timers.forEach((_, i) => this.resetTimer(i)); }
  resetAllTimersToZero() { this.timers.forEach((_, i) => this.updateTimerTime(i, 0)); }
  startAllTimers() {
    if (this.sequentialExecution) {
        const firstTimerId = this.timers.findIndex(t => t.totalTime > 0);
        if (firstTimerId !== -1) this.startTimer(firstTimerId);
    } else {
        this.timers.forEach(t => { if (t.totalTime > 0 && !t.isRunning) this.startTimer(t.id) });
    }
  }
  stopAllTimers() { this.timers.forEach(t => { if (t.isRunning) this.stopTimer(t.id) }); }
  changeTimerCount(newCount) { if (newCount !== this.currentTimerCount) { this.stopAllTimers(); this.currentTimerCount = newCount; this.init(); } }

  updateAllDisplays() { this.timers.forEach((_, i) => this.updateAllDisplaysForTimer(i)); this.updateRunningCount(); }
  updateAllDisplaysForTimer(timerId) { this.updateTimerDisplay(timerId); this.updateTimerBar(timerId); this.updateTimerButton(timerId); this.updateTimerLabel(timerId); this.updateTimerColor(timerId); }
  updateTimerDisplay(timerId) { this.domElements.timeTexts[timerId].textContent = utils.formatTime(this.timers[timerId].currentTime); }
  updateTimerBar(timerId) { const t = this.timers[timerId]; this.domElements.timerFills[timerId].style.height = `${t.totalTime > 0 ? (t.currentTime/t.totalTime)*(t.totalTime/this.currentMaxTime)*100 : 0}%`; }
  updateTimerButton(timerId) {
    const t = this.timers[timerId], btn = this.domElements.playButtons[timerId], icon = btn.querySelector('.btn-icon');
    btn.classList.remove('paused', 'completed');
    if (t.isCompleted) { icon.textContent = '✖'; btn.classList.add('completed'); }
    else if (t.isRunning) { icon.textContent = '⏸'; btn.classList.add('paused'); }
    else { icon.textContent = '▶'; }
  }
  updateTimerLabel(timerId) { this.domElements.labelTexts[timerId].textContent = this.timers[timerId].label; }
  updateTimerColor(timerId) { if(this.domElements.timerFills[timerId]) {this.domElements.timerFills[timerId].style.backgroundColor = utils.getTimerColor(timerId, themeManager.getCurrentThemeName());} }
  updateAllTimerColors() { this.timers.forEach((_, i) => this.updateTimerColor(i)); }
  updateRunningCount() { if(this.domElements.runningCount) this.domElements.runningCount.textContent = `${this.timers.filter(t=>t.isRunning).length}/${this.currentTimerCount} running`; }
  startBlinkEffect(timerId) { this.domElements.timerRows[timerId].classList.add('completed'); }
  stopBlinkEffect(timerId) { this.domElements.timerRows[timerId].classList.remove('completed'); }

  createTimerSegments(timerId) {
    const timerBar = this.domElements.timerBars[timerId];
    if (!timerBar) return;
    timerBar.innerHTML = '';
    const timerFill = document.createElement('div');
    timerFill.className = 'timer-fill';
    timerBar.appendChild(timerFill);
    this.domElements.timerFills[timerId] = timerFill;
  }

  playAlarmSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        showNotification(CONFIG.MESSAGES.ERROR.AUDIO_LOAD_FAILED, 'error');
    }
  }
}

new MultiTimer();
