import { CONFIG } from './config.js';

/**
 * getCurrentTheme
 * @description Gets the current theme object from CONFIG.
 * @returns {object} The current theme object.
 */
export function getCurrentTheme() {
  return CONFIG.THEMES[CONFIG.FEATURES.CURRENT_THEME] || CONFIG.THEMES.COLOR;
}

/**
 * getTimerColor
 * @description Gets the color for a specific timer based on the current theme.
 * @param {number} timerId - The ID of the timer.
 * @param {string} [themeName=CONFIG.FEATURES.CURRENT_THEME] - The name of the theme to use.
 * @returns {string} The hex color code.
 */
export function getTimerColor(timerId, themeName = CONFIG.FEATURES.CURRENT_THEME) {
  const theme = CONFIG.THEMES[themeName] || CONFIG.THEMES.COLOR;
  const timerNumber = timerId + 1; // 0-based to 1-based

  if (timerNumber >= 1 && timerNumber <= 15) {
    return theme.TIMER_COLOR_TABLE[timerNumber];
  }

  return theme.TIMER_COLOR_TABLE[1] || '#6B7280';
}

/**
 * getThemeColor
 * @description Gets a specific color key from the current theme.
 * @param {string} colorKey - The key of the color to retrieve (e.g., 'BACKGROUND').
 * @param {string} [themeName=CONFIG.FEATURES.CURRENT_THEME] - The name of the theme to use.
 * @returns {string} The hex color code.
 */
export function getThemeColor(colorKey, themeName = CONFIG.FEATURES.CURRENT_THEME) {
  const theme = CONFIG.THEMES[themeName] || CONFIG.THEMES.COLOR;
  return theme[colorKey] || theme.BACKGROUND;
}

/**
 * getTimerSound
 * @description Gets the sound for a specific timer.
 * @param {number} timerId - The ID of the timer.
 * @returns {string} The sound file name.
 */
export function getTimerSound(timerId) {
  return CONFIG.SOUNDS[CONFIG.FEATURES.SELECTED_SOUND] || CONFIG.SOUNDS.TIMER_1;
}

/**
 * getTimerLabel
 * @description Gets the default label for a specific timer.
 * @param {number} timerId - The ID of the timer.
 * @returns {string} The default label.
 */
export function getTimerLabel(timerId) {
  return CONFIG.TIMERS.DEFAULT_LABELS[timerId] || `${timerId + 1}`;
}

/**
 * formatTime
 * @description Formats seconds into a time string (mm:ss or hh:mm:ss).
 * @param {number} seconds - The time in seconds.
 * @returns {string} The formatted time string.
 */
export function formatTime(seconds) {
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
}

/**
 * isValidMaxTime
 * @description Checks if a given time is a valid max time option.
 * @param {number} seconds - The time in seconds.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValidMaxTime(seconds) {
  return CONFIG.TIMERS.MAX_TIME_OPTIONS.some(option => option.value === seconds);
}

/**
 * checkBrowserSupport
 * @description Checks for browser support of various APIs.
 * @returns {object} An object with boolean flags for supported features.
 */
export function checkBrowserSupport() {
  return {
    fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled),
    vibration: 'vibrate' in navigator,
    localStorage: 'localStorage' in window,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window
  };
}

/**
 * debugLog
 * @description Logs a debug message to the console if debug mode is enabled.
 * @param {string} message - The message to log.
 * @param {*} [data=null] - Optional data to log.
 */
export function debugLog(message, data = null) {
  if (CONFIG.DEBUG.ENABLED) {
    console.log(`[MultiUtility Debug] ${message}`, data);
  }
}

/**
 * measurePerformance
 * @description Measures the execution time of a function if performance metrics are enabled.
 * @param {string} label - The label for the performance measurement.
 * @param {function} fn - The function to execute and measure.
 * @returns {*} The result of the function.
 */
export function measurePerformance(label, fn) {
  if (CONFIG.DEBUG.SHOW_PERFORMANCE_METRICS) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

/**
 * saveToStorage
 * @description Saves a value to localStorage.
 * @param {string} key - The key to save the value under.
 * @param {*} value - The value to save (will be JSON.stringified).
 */
export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        debugLog('Failed to save to storage', { key, error });
    }
}

/**
 * loadFromStorage
 * @description Loads a value from localStorage.
 * @param {string} key - The key to load the value from.
 * @returns {*} The parsed value, or null if not found or on error.
 */
export function loadFromStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        debugLog('Failed to load from storage', { key, error });
        return null;
    }
}
