import { setTimeout } from 'node:timers/promises';

const CLOSED = 'CLOSED';
const OPEN = 'OPEN';
const HALF_OPEN = 'HALF_OPEN';

const DEFAULT_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT = 60000;
const DEFAULT_MONITOR_INTERVAL = 10000;

class CircuitBreaker {
  #state;
  #failureCount;
  #successCount;
  #failureThreshold;
  #resetTimeout;
  #monitorInterval;
  #lastFailureTime;
  #lastSuccessTime;
  #monitorTimer;
  #halfOpenPermitted;

  constructor(options = {}) {
    if (options.threshold != null && (typeof options.threshold !== 'number' || options.threshold < 1)) {
      throw new Error('threshold must be a positive integer');
    }

    if (options.resetTimeout != null && (typeof options.resetTimeout !== 'number' || options.resetTimeout < 1)) {
      throw new Error('resetTimeout must be a positive number');
    }

    if (options.monitorInterval != null && (typeof options.monitorInterval !== 'number' || options.monitorInterval < 1)) {
      throw new Error('monitorInterval must be a positive number');
    }

    this.#state = CLOSED;
    this.#failureCount = 0;
    this.#successCount = 0;
    this.#failureThreshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.#resetTimeout = options.resetTimeout ?? DEFAULT_RESET_TIMEOUT;
    this.#monitorInterval = options.monitorInterval ?? DEFAULT_MONITOR_INTERVAL;
    this.#lastFailureTime = null;
    this.#lastSuccessTime = null;
    this.#monitorTimer = null;
    this.#halfOpenPermitted = false;
  }

  get state() {
    return this.#state;
  }

  async execute(fn) {
    if (typeof fn !== 'function') {
      throw new Error('execute requires a function');
    }

    if (this.#state === OPEN) {
      return {
        status: false,
        message: 'service temporarily unavailable'
      };
    }

    if (this.#state === HALF_OPEN && !this.#halfOpenPermitted) {
      return {
        status: false,
        message: 'service temporarily unavailable'
      };
    }

    if (this.#state === HALF_OPEN) {
      this.#halfOpenPermitted = false;
    }

    try {
      const data = await fn();

      this.#onSuccess();
      return { status: true, message: 'success', data };
    } catch (error) {
      this.#onFailure();
      return { status: false, message: error?.message ?? 'unknown error' };
    }
  }

  reset() {
    this.#state = CLOSED;
    this.#failureCount = 0;
    this.#lastFailureTime = null;
    this.#halfOpenPermitted = false;
    this.#stopMonitor();
  }

  stats() {
    return {
      state: this.#state,
      failures: this.#failureCount,
      successes: this.#successCount,
      lastFailure: this.#lastFailureTime,
      lastSuccess: this.#lastSuccessTime
    };
  }

  #onSuccess() {
    this.#successCount++;
    this.#lastSuccessTime = Date.now();

    if (this.#state === HALF_OPEN) {
      this.#state = CLOSED;
      this.#failureCount = 0;
      this.#stopMonitor();
      return;
    }

    this.#failureCount = 0;
  }

  #onFailure() {
    this.#failureCount++;
    this.#lastFailureTime = Date.now();

    if (this.#state === HALF_OPEN) {
      this.#state = OPEN;
      this.#startMonitor();
      return;
    }

    if (this.#failureCount >= this.#failureThreshold) {
      this.#state = OPEN;
      this.#startMonitor();
    }
  }

  #startMonitor() {
    this.#stopMonitor();

    const controller = new AbortController();

    this.#monitorTimer = { controller };

    setTimeout(this.#resetTimeout, { signal: controller.signal }).then(() => {
      this.#monitorTimer = null;

      if (this.#state === OPEN) {
        this.#state = HALF_OPEN;
        this.#halfOpenPermitted = true;
      }
    }).catch(() => { /* best-effort */ });
  }

  #stopMonitor() {
    if (this.#monitorTimer) {
      this.#monitorTimer.controller.abort();
      this.#monitorTimer = null;
    }
  }
}

function createCircuitBreaker(options) {
  return new CircuitBreaker(options);
}

export {
  CircuitBreaker,
  createCircuitBreaker,
  CLOSED,
  OPEN,
  HALF_OPEN,
  DEFAULT_THRESHOLD,
  DEFAULT_RESET_TIMEOUT,
  DEFAULT_MONITOR_INTERVAL
};
