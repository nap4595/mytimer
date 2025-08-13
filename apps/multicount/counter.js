import { CONFIG } from '../../shared/core/config.js';
import * as utils from '../../shared/core/utils.js';
import { showNotification } from '../../shared/components/notification.js';
import * as themeManager from '../../shared/components/themes.js';

class MultiCounter {
  constructor() {
    this.counters = [];
    this.currentCount = 10; // Default
    this.container = document.getElementById('counters-container');
    this.countSelect = document.getElementById('counter-count-select');
    this.resetAllButton = document.getElementById('reset-all-counters');
    this.init();
  }

  init() {
    this.countSelect.value = this.currentCount;
    this.loadState(); // Load previous state or initialize new one
    this.renderCounters();
    this.bindEvents();
  }

  bindEvents() {
    this.countSelect.addEventListener('change', () => this.changeCount());
    this.resetAllButton.addEventListener('click', () => this.resetAll());

    // Use event delegation for counter buttons
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('.counter-btn');
      if (!button) return;

      const card = button.closest('.counter-card');
      const index = parseInt(card.dataset.index, 10);

      if (button.classList.contains('increase-btn')) {
        this.updateValue(index, 1);
      } else if (button.classList.contains('decrease-btn')) {
        this.updateValue(index, -1);
      } else if (button.classList.contains('reset-btn')) {
        this.updateValue(index, 0, true); // Reset to zero
      }
    });

    // Event delegation for label and target changes
    this.container.addEventListener('input', (e) => {
        const target = e.target;
        if (!target) return;

        const card = target.closest('.counter-card');
        if (!card) return;

        const index = parseInt(card.dataset.index, 10);

        if (target.classList.contains('counter-label')) {
            this.counters[index].label = target.value;
            this.saveState();
        } else if (target.classList.contains('counter-target')) {
            const value = parseInt(target.value, 10);
            this.counters[index].target = isNaN(value) ? null : value;
            this.saveState();
        }
    });
  }

  changeCount() {
    this.currentCount = parseInt(this.countSelect.value, 10);
    this.loadState(); // Re-initialize state for the new count
    this.renderCounters();
  }

  renderCounters() {
    this.container.innerHTML = '';
    for (let i = 0; i < this.currentCount; i++) {
      const counter = this.counters[i];
      const cardHTML = this.getCounterHTML(i, counter.label, counter.value);
      this.container.insertAdjacentHTML('beforeend', cardHTML);
    }
  }

  getCounterHTML(index, label, value) {
    const color = utils.getTimerColor(index, themeManager.getCurrentThemeName());
    const targetValue = this.counters[index].target !== null ? this.counters[index].target : '';
    return `
      <div class="counter-card" data-index="${index}">
        <div class="counter-fill" style="background-color: ${color}33;"></div>
        <div class="counter-content">
            <input type="text" class="counter-label" value="${label}" placeholder="Label">
            <div class="counter-value">${value}</div>
            <div class="counter-target-container">
                <label for="target-${index}">Target:</label>
                <input type="number" id="target-${index}" class="counter-target" value="${targetValue}" placeholder="N/A">
            </div>
            <div class="counter-card-controls">
              <button class="counter-btn decrease-btn">-</button>
              <button class="counter-btn reset-btn">0</button>
              <button class="counter-btn increase-btn">+</button>
            </div>
        </div>
      </div>
    `;
  }

  updateValue(index, delta, isReset = false) {
    const counter = this.counters[index];
    if (isReset) {
      counter.value = 0;
    } else {
      counter.value += delta;
    }
    this.updateCounterDOM(index);
    this.saveState();

    // Check if target is reached
    if (counter.target !== null && counter.value === counter.target) {
      showNotification(`"${counter.label}" has reached its target of ${counter.target}!`, 'success');
    }
  }

  updateCounterDOM(index) {
    const card = this.container.querySelector(`.counter-card[data-index="${index}"]`);
    if (card) {
      const counter = this.counters[index];
      card.querySelector('.counter-value').textContent = counter.value;

      const fill = card.querySelector('.counter-fill');
      if (fill) {
        const percentage = (counter.target && counter.target > 0) ? (counter.value / counter.target) * 100 : 0;
        fill.style.height = `${Math.min(percentage, 100)}%`;
      }
    }
  }

  resetAll() {
      this.counters.forEach(counter => {
        counter.value = 0;
        counter.target = null;
      });
      this.renderCounters();
      this.saveState();
      showNotification('All counters have been reset.', 'info');
  }

  loadState() {
    const savedState = utils.loadFromStorage(CONFIG.STORAGE_KEYS.COUNTER_STATE);
    if (savedState && savedState.length === this.currentCount) {
      this.counters = savedState;
    } else {
      // Initialize new state
      this.counters = Array.from({ length: this.currentCount }, (_, i) => ({
        label: `Counter ${i + 1}`,
        value: 0,
        target: null
      }));
    }
    this.saveState(); // Save the initial or newly sized state
  }

  saveState() {
    utils.saveToStorage(CONFIG.STORAGE_KEYS.COUNTER_STATE, this.counters);
  }
}

new MultiCounter();
