// Wrap in IIFE to ensure global scope
(function(window) {
  class Pixel {
    constructor(canvas, context, x, y, color, speed, delay) {
      this.width = canvas.width;
      this.height = canvas.height;
      this.ctx = context;
      this.x = x;
      this.y = y;
      this.color = color;
      this.speed = this.getRandomValue(0.1, 0.9) * speed;
      this.size = 0;
      this.sizeStep = Math.random() * 0.4;
      this.minSize = 0.5;
      this.maxSizeInteger = 2;
      this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
      this.delay = delay;
      this.counter = 0;
      this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
      this.isIdle = false;
      this.isReverse = false;
      this.isShimmer = false;
    }

    getRandomValue(min, max) {
      return Math.random() * (max - min) + min;
    }

    draw() {
      const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(
        this.x + centerOffset,
        this.y + centerOffset,
        this.size,
        this.size
      );
    }

    appear() {
      this.isIdle = false;
      if (this.counter <= this.delay) {
        this.counter += this.counterStep;
        return;
      }
      if (this.size >= this.maxSize) {
        this.isShimmer = true;
      }
      if (this.isShimmer) {
        this.shimmer();
      } else {
        this.size += this.sizeStep;
      }
      this.draw();
    }

    disappear() {
      this.isShimmer = false;
      this.counter = 0;
      if (this.size <= 0) {
        this.isIdle = true;
        return;
      } else {
        this.size -= 0.1;
      }
      this.draw();
    }

    shimmer() {
      if (this.size >= this.maxSize) {
        this.isReverse = true;
      } else if (this.size <= this.minSize) {
        this.isReverse = false;
      }
      if (this.isReverse) {
        this.size -= this.speed;
      } else {
        this.size += this.speed;
      }
    }
  }

  class PixelCard {
    constructor(element, options = {}) {
      console.log('PixelCard constructor called', { element, options });
      
      // Ensure the element is a DOM element
      if (!(element instanceof HTMLElement)) {
        console.error('Invalid element passed to PixelCard');
        return;
      }

      this.container = element;
      this.container.style.position = 'relative'; // Ensure proper positioning

      // Create canvas if not already present
      this.canvas = this.container.querySelector('canvas.pixel-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('pixel-canvas');
        this.container.insertBefore(this.canvas, this.container.firstChild);
      }
      
      this.variants = {
        default: {
          activeColor: null,
          gap: 5,
          speed: 35,
          colors: "#f8fafc,#f1f5f9,#cbd5e1",
          noFocus: false
        },
        blue: {
          activeColor: "#e0f2fe",
          gap: 10,
          speed: 25,
          colors: "#e0f2fe,#7dd3fc,#0ea5e9",
          noFocus: false
        },
        yellow: {
          activeColor: "#fef08a",
          gap: 3,
          speed: 20,
          colors: "#fef08a,#fde047,#eab308",
          noFocus: false
        },
        pink: {
          activeColor: "#fecdd3",
          gap: 6,
          speed: 80,
          colors: "#fecdd3,#fda4af,#e11d48",
          noFocus: true
        }
      };

      this.variant = options.variant || 'default';
      this.variantCfg = this.variants[this.variant] || this.variants.default;
      this.gap = options.gap ?? this.variantCfg.gap;
      this.speed = options.speed ?? this.variantCfg.speed;
      this.colors = options.colors ?? this.variantCfg.colors;
      this.noFocus = options.noFocus ?? this.variantCfg.noFocus;

      this.pixels = [];
      this.animationFrame = null;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      console.log('Initializing PixelCard', this);
      this.initPixels();
      this.setupEventListeners();
    }

    getEffectiveSpeed(value) {
      const min = 0;
      const max = 100;
      const throttle = 0.001;
      const parsed = parseInt(value, 10);

      if (parsed <= min || this.reducedMotion) {
        return min;
      } else if (parsed >= max) {
        return max * throttle;
      } else {
        return parsed * throttle;
      }
    }

    initPixels() {
      console.log('Initializing pixels');
      const rect = this.container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      const ctx = this.canvas.getContext("2d");

      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      const colorsArray = this.colors.split(",");
      this.pixels = [];
      for (let x = 0; x < width; x += parseInt(this.gap, 10)) {
        for (let y = 0; y < height; y += parseInt(this.gap, 10)) {
          const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];

          const dx = x - width / 2;
          const dy = y - height / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const delay = this.reducedMotion ? 0 : distance;

          this.pixels.push(
            new Pixel(
              this.canvas,
              ctx,
              x,
              y,
              color,
              this.getEffectiveSpeed(this.speed),
              delay
            )
          );
        }
      }
      console.log(`Created ${this.pixels.length} pixels`);
    }

    setupEventListeners() {
      console.log('Setting up event listeners');
      this.container.addEventListener('mouseenter', () => this.handleAnimation('appear'));
      this.container.addEventListener('mouseleave', () => this.handleAnimation('disappear'));

      if (!this.noFocus) {
        this.container.addEventListener('focus', () => this.handleAnimation('appear'));
        this.container.addEventListener('blur', () => this.handleAnimation('disappear'));
        this.container.tabIndex = 0;
      }

      // Resize observer
      const observer = new ResizeObserver(() => {
        this.initPixels();
      });
      observer.observe(this.container);
    }

    handleAnimation(fnName) {
      console.log(`Handling animation: ${fnName}`);
      cancelAnimationFrame(this.animationFrame);
      let timePrevious = performance.now();

      const doAnimate = () => {
        this.animationFrame = requestAnimationFrame(doAnimate);
        const timeNow = performance.now();
        const timePassed = timeNow - timePrevious;
        const timeInterval = 1000 / 60; // ~60 FPS

        if (timePassed < timeInterval) return;
        timePrevious = timeNow - (timePassed % timeInterval);

        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let allIdle = true;
        for (let pixel of this.pixels) {
          pixel[fnName]();
          if (!pixel.isIdle) {
            allIdle = false;
          }
        }

        if (allIdle) {
          cancelAnimationFrame(this.animationFrame);
        }
      };

      doAnimate();
    }
  }

  // Expose to global scope
  window.PixelCard = PixelCard;
  console.log('PixelCard script loaded and exposed');
})(window);
