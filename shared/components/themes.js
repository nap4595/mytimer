import { CONFIG } from '../core/config.js';
import { saveToStorage, loadFromStorage } from '../core/utils.js';

let currentTheme = CONFIG.THEMES.DEFAULT;

/**
 * Applies a theme by adding or removing a class on the body element.
 * The actual theme variables are defined in `shared/styles/themes.css`.
 * @param {string} themeName - The name of the theme to apply (e.g., 'MINIMAL').
 */
function applyThemeClass(themeName) {
    const body = document.body;

    // Remove all possible theme classes first to ensure a clean state.
    CONFIG.THEMES.AVAILABLE.forEach(theme => {
        if (theme !== CONFIG.THEMES.DEFAULT) {
            body.classList.remove(`${theme.toLowerCase()}-theme`);
        }
    });

    // Add the specific class for the new theme if it's not the default.
    if (themeName !== CONFIG.THEMES.DEFAULT) {
        body.classList.add(`${themeName.toLowerCase()}-theme`);
    }
}

/**
 * Sets the current theme for the application and saves the preference.
 * @param {string} themeName - The name of the new theme (e.g., 'COLOR', 'MINIMAL').
 */
export function setTheme(themeName) {
    if (!CONFIG.THEMES.AVAILABLE.includes(themeName)) {
        console.warn(`Theme "${themeName}" is not available.`);
        return;
    }
    currentTheme = themeName;
    applyThemeClass(themeName);

    // Save the preference to localStorage
    const prefs = loadFromStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES) || {};
    prefs.currentTheme = currentTheme;
    saveToStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES, prefs);
}

/**
 * Initializes the theme manager on application startup.
 * It loads the saved theme from storage or applies the default theme.
 */
export function initThemeManager() {
    const prefs = loadFromStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES);
    const savedTheme = prefs ? prefs.currentTheme : CONFIG.THEMES.DEFAULT;

    setTheme(savedTheme || CONFIG.THEMES.DEFAULT);
}

/**
 * Gets the name of the currently active theme.
 * @returns {string} The current theme name.
 */
export function getCurrentThemeName() {
    return currentTheme;
}
