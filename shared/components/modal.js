/**
 * A simple Modal component manager.
 * @description Handles the logic for showing, hiding, and managing events for modal dialogs.
 */
export class Modal {
  /**
   * Creates a Modal instance.
   * @param {string} modalId - The ID of the modal element in the DOM.
   * @param {object} [options] - Configuration options.
   * @param {function} [options.onConfirm] - Callback function when a confirm button is clicked.
   */
  constructor(modalId, options = {}) {
    this.modalElement = document.getElementById(modalId);
    if (!this.modalElement) {
      throw new Error(`Modal with ID "${modalId}" not found in the DOM.`);
    }

    this.onConfirm = options.onConfirm;

    // Find common modal interactive elements
    this.confirmButton = this.modalElement.querySelector('.confirm-btn, .start-btn, #time-confirm-btn, #sound-confirm-btn, #theme-confirm-btn');
    this.closeButtons = this.modalElement.querySelectorAll('.modal-close, .cancel-btn, #time-cancel-btn, #sound-cancel-btn, #theme-cancel-btn');

    // Bind methods to ensure 'this' context is correct
    this.boundHide = this.hide.bind(this);
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    this.boundHandleConfirm = this.handleConfirm.bind(this);

    this.attachEventListeners();
  }

  /**
   * Attaches event listeners to the modal's interactive elements.
   */
  attachEventListeners() {
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this.boundHide);
    });

    if (this.confirmButton && this.onConfirm) {
      this.confirmButton.addEventListener('click', this.boundHandleConfirm);
    }

    this.modalElement.addEventListener('click', this.boundHandleOutsideClick);
  }

  /**
   * Hides the modal if the click is on the background overlay.
   * @param {Event} event - The click event.
   */
  handleOutsideClick(event) {
    if (event.target === this.modalElement) {
      this.hide();
    }
  }

  /**
   * Handles the confirm action and then hides the modal.
   */
  handleConfirm() {
    if (this.onConfirm) {
      this.onConfirm();
    }
    this.hide();
  }

  /**
   * Shows the modal.
   */
  show() {
    this.modalElement.style.display = 'block';
    this.modalElement.setAttribute('aria-hidden', 'false');

    // Set focus on the first focusable element within the modal for accessibility
    const firstFocusable = this.modalElement.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Hides the modal.
   */
  hide() {
    this.modalElement.style.display = 'none';
    this.modalElement.setAttribute('aria-hidden', 'true');
  }

  /**
   * Removes all event listeners to prevent memory leaks.
   */
  destroy() {
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this.boundHide);
    });

    if (this.confirmButton && this.onConfirm) {
        this.confirmButton.removeEventListener('click', this.boundHandleConfirm);
    }

    this.modalElement.removeEventListener('click', this.boundHandleOutsideClick);
  }
}
