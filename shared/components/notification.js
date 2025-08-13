import { CONFIG } from '../core/config.js';

/**
 * Hides and removes a notification element from the DOM.
 * @param {HTMLElement} notification - The notification element to hide.
 */
function hideNotification(notification) {
    if (!notification || !notification.parentNode) return;

    // Trigger fade-out animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';

    // Remove the element after the animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300); // This duration should match the CSS transition
}

/**
 * Displays a non-blocking notification toast to the user.
 * The required styles are in `shared/styles/components.css`.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of notification ('info', 'success', 'warning', 'error').
 * @param {number} [duration] - How long to display in ms. Defaults to value in CONFIG.
 */
export function showNotification(message, type = 'info', duration = CONFIG.UI_CONSTANTS.NOTIFICATION_DURATION) {
    // Remove any existing notification to prevent overlap
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate into view
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    // Automatically hide after the duration
    if (duration > 0) {
        setTimeout(() => {
            hideNotification(notification);
        }, duration);
    }

    // Allow the user to dismiss by clicking
    notification.addEventListener('click', () => hideNotification(notification), { once: true });
}
