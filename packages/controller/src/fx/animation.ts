import type { Channels } from '@webdmx/common';

import type { SerialDriver } from '../drivers/base/serial.driver.js';
import { EASING } from './easing.utils.js';

// mutates the channels array in place
export type Filter = (channels: Channels) => void;

export interface AnimationOptions {
  loop?: number;
  filters?: Filter[];
}

export interface TransitionOptions {
  from: Channels;
  easing: keyof typeof EASING;
}

export interface Transition {
  from?: Channels;
  to: Channels;
  options: TransitionOptions;
  start: number;
  end: number;
}

export class Animation {
  #timeout?: number;

  frameDelay = 1;
  transitions: Transition[] = [];
  lastAnimation = 0;
  loops = 1;
  duration = 0;
  startTime?: number;
  currentLoop = 0;
  filters: Filter[] = [];

  constructor({ filters = [], loop }: Partial<AnimationOptions> = {}) {
    this.loops = loop || 1;
    this.filters = filters;
  }

  add(to: Channels, duration = 0, options: Partial<TransitionOptions> = {}): this {
    // set default easing equation, if not provided or invalid
    options.easing = options.easing && options.easing in EASING ? options.easing : 'linear';

    this.transitions.push({
      to,
      options: options as TransitionOptions,
      start: this.duration,
      end: this.duration + duration,
    });

    // advance the transition duration
    this.duration += duration;

    return this;
  }

  delay(duration: number): this {
    return this.add(new Uint8Array(), duration);
  }

  stop() {
    window.clearTimeout(this.#timeout);
  }

  reset(startTime = +new Date()) {
    this.startTime = startTime;
    this.lastAnimation = 0;
  }

  runNextLoop(driver: SerialDriver, onFinish?: () => void): this {
    const runAnimationStep = () => {
      const now = +new Date();
      const elapsedTime = now - (this.startTime ?? 0);

      this.#timeout = window.setTimeout(runAnimationStep, this.frameDelay);

      // Find the transition for the current point in time, the latest if multiple match
      let currentAnimation = this.lastAnimation;

      while (currentAnimation < this.transitions.length && elapsedTime >= this.transitions[currentAnimation].end) {
        currentAnimation++;
      }

      // Ensure final state of all newly completed transitions have been set
      const completedAnimations = this.transitions.slice(this.lastAnimation, currentAnimation);

      // Ensure future transitions interpolate from the most recent state
      completedAnimations.forEach((completedAnimation) => {
        delete completedAnimation.from;
      });

      if (completedAnimations.length) {
        const completedAnimationStatesToSet = Object.assign({}, ...completedAnimations.map((a) => a.to));

        if (this.filters.length) {
          this.filters.forEach((filter) => filter(completedAnimationStatesToSet));
        }

        // driver.update(completedAnimationStatesToSet, { origin: 'transition' });
        driver.update(completedAnimationStatesToSet);
      }

      this.lastAnimation = currentAnimation;

      if (elapsedTime >= this.duration) {
        // This transition loop is complete
        this.currentLoop++;
        this.stop();
        if (this.currentLoop >= this.loops) {
          // All loops complete
          if (onFinish) {
            onFinish();
          }
        } else {
          // Run next loop
          this.reset((this.startTime ?? 0) + this.duration);
          this.runNextLoop(driver);
        }
      } else {
        // Set intermediate channel values during an transition
        const transition = this.transitions[currentAnimation];
        const easingEq = EASING[transition.options.easing];
        const duration = transition.end - transition.start;
        const transitionElapsedTime = elapsedTime - transition.start;

        if (!transition.from) {
          const length = Object.keys(transition.to).length;
          transition.from = new Uint8Array(length);
          for (const k in transition.to) {
            transition.from[k] = driver.get(Number(k)) ?? 0;
          }
          if (transition.options.from) {
            transition.from = Object.assign(transition.from, transition.options.from);
          }
        }

        if (duration) {
          const easeProgress = easingEq(Math.min(transitionElapsedTime, duration), 0, 1, duration);
          const intermediateValues: Channels = new Uint8Array();

          for (const k in transition.to) {
            const startValue = transition.from[k];
            const endValue = transition.to[k];

            intermediateValues[k] = Math.round(startValue + easeProgress * (endValue - startValue));
          }

          if (this.filters.length) {
            this.filters.forEach((filter) => filter(intermediateValues));
          }

          // driver.update(intermediateValues, { origin: 'transition' });
          driver.update(intermediateValues);
        }
      }
    };

    runAnimationStep();

    return this;
  }

  run(driver: SerialDriver, onFinish?: () => void) {
    // Optimization to run transition updates at double the rate of driver updates using Nyquist's theorem
    this.frameDelay = driver.options.sendInterval / 2;

    this.reset();
    this.currentLoop = 0;
    this.runNextLoop(driver, onFinish);
  }

  runLoop(driver: SerialDriver, onFinish?: () => void, loops = Infinity): this {
    this.loops = loops;
    this.run(driver, onFinish);
    return this;
  }
}
