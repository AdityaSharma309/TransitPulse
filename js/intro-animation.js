// TransitPulse - Introductory Bus-to-Timetable Animation (~3.0s)
// Uses lightweight SVG + CSS transitions on warm ivory paper, respects reduced motion, and never blocks app usage.

class IntroAnimation {
  constructor(options = {}) {
    this.container = document.getElementById('introAnimationContainer');
    this.skipBtn = document.getElementById('skipIntroBtn');
    this.onComplete = options.onComplete || (() => {});
    this.hasReducedMotion = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    this.storageKey = 'transitpulse_intro_played_v3';
    this.timers = [];
    this.isFinished = false;

    this.init();
  }

  init() {
    if (!this.container) {
      this.onComplete();
      return;
    }

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.skip());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.isFinished && this.container.classList.contains('active')) {
        this.skip();
      }
    });

    const alreadyPlayed = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.storageKey) : null;
    if (this.hasReducedMotion || alreadyPlayed === 'true') {
      this.instantSkip();
    } else {
      this.play();
    }
  }

  clearTimers() {
    this.timers.forEach(id => clearTimeout(id));
    this.timers = [];
  }

  play() {
    if (!this.container) return;
    this.clearTimers();
    this.isFinished = false;
    this.container.style.display = 'flex';
    this.container.className = 'intro-container active scene-1';

    // Scene 2: Mechanical transformation (bus -> gear/steering -> timetable) at 1.05s
    this.timers.push(setTimeout(() => {
      if (this.isFinished) return;
      this.container.classList.remove('scene-1');
      this.container.classList.add('scene-2');
    }, 1050));

    // Scene 3: Fade out into terminal at 2.65s
    this.timers.push(setTimeout(() => {
      if (this.isFinished) return;
      this.container.classList.remove('scene-2');
      this.container.classList.add('scene-3');
      this.finish();
    }, 2650));

    // Hard fail-safe at 3.5s
    this.timers.push(setTimeout(() => {
      if (!this.isFinished) this.instantSkip();
    }, 3500));
  }

  skip() {
    this.clearTimers();
    this.finish();
  }

  instantSkip() {
    this.clearTimers();
    this.isFinished = true;
    if (this.container) {
      this.container.classList.remove('active', 'scene-1', 'scene-2', 'scene-3', 'fade-out');
      this.container.style.display = 'none';
    }
    this.onComplete();
  }

  finish() {
    if (this.isFinished || !this.container) return;
    this.isFinished = true;
    this.container.classList.add('fade-out');
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.storageKey, 'true');
      }
    } catch (e) {}

    setTimeout(() => {
      this.container.classList.remove('active', 'scene-1', 'scene-2', 'scene-3', 'fade-out');
      this.container.style.display = 'none';
      this.onComplete();
    }, 360);
  }

  replay() {
    if (!this.container) return;
    if (this.hasReducedMotion) {
      this.instantSkip();
      return;
    }
    this.play();
  }
}

window.IntroAnimation = IntroAnimation;
