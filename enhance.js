// enhance.js - 页面增强脚本 v2.0
// 在 index.html 的 </body> 前引入: <script src="enhance.js"></script>

(function() {
    'use strict';

    const CONFIG = {
        bg: {
            starCount: 200,
            shootingStarInterval: 8000,
            nebulaColors: ['#00f3ff20', '#bc13fe15', '#ff006620']
        },
        trail: {
            enabled: true,
            color: '#00f3ff',
            length: 20
        },
        scroll: {
            parallax: true,
            revealAnimation: true
        }
    };

    const $ = (s, p = document) => p.querySelector(s);
    const $$ = (s, p = document) => [...p.querySelectorAll(s)];

    function createEl(tag, styles = {}, attrs = {}, parent = null) {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        if (parent) parent.appendChild(el);
        return el;
    }

    const rand = (min, max) => Math.random() * (max - min) + min;

    // ==================== 1. 增强背景 ====================
    function initEnhancedBackground() {
        const canvas = $('#canvas-bg');
        if (!canvas) return;

        const starCanvas = createEl('canvas', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '-1',
            pointerEvents: 'none'
        }, { id: 'star-canvas' }, document.body);

        const ctx = starCanvas.getContext('2d');
        let width, height;

        function resize() {
            width = starCanvas.width = window.innerWidth;
            height = starCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Star {
            constructor() { this.reset(); }
            reset() {
                this.x = rand(0, width);
                this.y = rand(0, height);
                this.size = rand(0.5, 2.5);
                this.baseAlpha = rand(0.1, 0.8);
                this.alpha = this.baseAlpha;
                this.twinkleSpeed = rand(0.01, 0.05);
                this.twinkleDir = 1;
                this.color = Math.random() > 0.8 ? '#bc13fe' : '#00f3ff';
            }
            update() {
                this.alpha += this.twinkleSpeed * this.twinkleDir;
                if (this.alpha > this.baseAlpha + 0.3 || this.alpha < this.baseAlpha - 0.2) {
                    this.twinkleDir *= -1;
                }
                this.alpha = Math.max(0.05, Math.min(1, this.alpha));
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                if (this.size > 1.5) {
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 0.5;
                    ctx.globalAlpha = this.alpha * 0.5;
                    const r = this.size * 3;
                    ctx.beginPath();
                    ctx.moveTo(this.x - r, this.y);
                    ctx.lineTo(this.x + r, this.y);
                    ctx.moveTo(this.x, this.y - r);
                    ctx.lineTo(this.x, this.y + r);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }
        }

        class ShootingStar {
            constructor() { this.reset(); }
            reset() {
                this.active = false;
                this.x = rand(0, width * 0.8);
                this.y = rand(0, height * 0.3);
                this.len = rand(80, 200);
                this.speed = rand(15, 25);
                this.angle = rand(Math.PI / 6, Math.PI / 3);
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
                this.life = 0;
                this.maxLife = rand(30, 60);
                this.width = rand(1, 3);
                this.active = true;
            }
            update() {
                if (!this.active) return;
                this.x += this.vx;
                this.y += this.vy;
                this.life++;
                if (this.life > this.maxLife || this.x > width || this.y > height) {
                    this.active = false;
                }
            }
            draw() {
                if (!this.active) return;
                const progress = this.life / this.maxLife;
                const alpha = progress < 0.2 ? progress / 0.2 : 1 - progress;
                const tailX = this.x - this.vx * (this.len / this.speed);
                const tailY = this.y - this.vy * (this.len / this.speed);
                const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                grad.addColorStop(0.1, `rgba(0, 243, 255, ${alpha * 0.8})`);
                grad.addColorStop(1, `rgba(0, 243, 255, 0)`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = this.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawNebula() {
            CONFIG.bg.nebulaColors.forEach((color, i) => {
                const x = width * (0.2 + i * 0.3);
                const y = height * (0.3 + (i % 2) * 0.4);
                const r = Math.min(width, height) * 0.4;
                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                grad.addColorStop(0, color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            });
        }

        const stars = Array.from({ length: CONFIG.bg.starCount }, () => new Star());
        let shootingStars = [];
        let lastShootingStar = 0;

        function animate() {
            ctx.clearRect(0, 0, width, height);
            drawNebula();
            stars.forEach(s => { s.update(); s.draw(); });
            const now = Date.now();
            if (now - lastShootingStar > CONFIG.bg.shootingStarInterval && Math.random() > 0.7) {
                shootingStars.push(new ShootingStar());
                lastShootingStar = now;
            }
            shootingStars = shootingStars.filter(s => s.active);
            shootingStars.forEach(s => { s.update(); s.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ==================== 2. 鼠标拖尾 ====================
    function initMouseTrail() {
        if (!CONFIG.trail.enabled) return;
        const trail = createEl('canvas', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '9999',
            pointerEvents: 'none'
        }, {}, document.body);

        const ctx = trail.getContext('2d');
        let width, height;

        function resize() {
            width = trail.width = window.innerWidth;
            height = trail.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        const points = [];
        const maxPoints = CONFIG.trail.length;

        document.addEventListener('mousemove', (e) => {
            points.push({ x: e.clientX, y: e.clientY, life: 1 });
            if (points.length > maxPoints) points.shift();
        });

        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (let i = 1; i < points.length; i++) {
                const p = points[i];
                const prev = points[i - 1];
                p.life -= 0.05;
                if (p.life <= 0) continue;
                const alpha = p.life;
                const lineWidth = (i / points.length) * 3;
                ctx.strokeStyle = CONFIG.trail.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = CONFIG.trail.color;
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            for (let i = points.length - 1; i >= 0; i--) {
                if (points[i].life <= 0) points.splice(i, 1);
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ==================== 3. 点击涟漪 ====================
    function initClickRipple() {
        document.addEventListener('click', (e) => {
            const ripple = createEl('div', {
                position: 'fixed',
                left: e.clientX + 'px',
                top: e.clientY + 'px',
                width: '0px',
                height: '0px',
                borderRadius: '50%',
                border: '2px solid #00f3ff',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: '9998'
            }, {}, document.body);

            const anim = ripple.animate([
                { width: '0px', height: '0px', opacity: 1, borderWidth: '3px' },
                { width: '100px', height: '100px', opacity: 0, borderWidth: '0px' }
            ], { duration: 600, easing: 'ease-out' });
            anim.onfinish = () => ripple.remove();
        });
    }

    // ==================== 4. 视差滚动 ====================
    function initParallax() {
        if (!CONFIG.scroll.parallax) return;
        const hero = $('.hero');
        const heroCard = $('.hero-card');
        if (!hero || !heroCard) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;
            heroCard.style.transform = `translateY(${rate * 0.5}px)`;
            const heroText = $('.hero-text');
            if (heroText && scrolled < window.innerHeight) {
                heroText.style.opacity = 1 - (scrolled / (window.innerHeight * 0.5));
            }
        });
    }

    // ==================== 5. 滚动显示动画 ====================
    function initRevealAnimation() {
        if (!CONFIG.scroll.revealAnimation) return;
        const selectors = ['.section-title', '.card', '.btn', '.status-badge', '.about-section', '.game-section'];

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                    entry.target.style.filter = 'blur(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        selectors.forEach(sel => {
            $$(sel).forEach((el, i) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(40px) scale(0.95)';
                el.style.filter = 'blur(2px)';
                el.style.transition = `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`;
                observer.observe(el);
            });
        });
    }

    // ==================== 6. 文字解码效果 ====================
    function initTextScramble() {
        const chars = '!<>-_\\/[]{}—=+*^?#________';
        class TextScramble {
            constructor(el) {
                this.el = el;
                this.chars = chars;
                this.update = this.update.bind(this);
            }
            setText(newText) {
                const oldText = this.el.innerText;
                const length = Math.max(oldText.length, newText.length);
                const promise = new Promise((resolve) => this.resolve = resolve);
                this.queue = [];
                for (let i = 0; i < length; i++) {
                    const from = oldText[i] || '';
                    const to = newText[i] || '';
                    const start = Math.floor(Math.random() * 40);
                    const end = start + Math.floor(Math.random() * 40);
                    this.queue.push({ from, to, start, end });
                }
                cancelAnimationFrame(this.frameRequest);
                this.frame = 0;
                this.update();
                return promise;
            }
            update() {
                let output = '';
                let complete = 0;
                for (let i = 0, n = this.queue.length; i < n; i++) {
                    let { from, to, start, end, char } = this.queue[i];
                    if (this.frame >= end) {
                        complete++;
                        output += to;
                    } else if (this.frame >= start) {
                        if (!char || Math.random() < 0.28) {
                            char = this.randomChar();
                            this.queue[i].char = char;
                        }
                        output += `<span style="color: var(--secondary)">${char}</span>`;
                    } else {
                        output += from;
                    }
                }
                this.el.innerHTML = output;
                if (complete === this.queue.length) {
                    this.resolve();
                } else {
                    this.frameRequest = requestAnimationFrame(this.update);
                    this.frame++;
                }
            }
            randomChar() {
                return this.chars[Math.floor(Math.random() * this.chars.length)];
            }
        }

        $$('.card-title').forEach(el => {
            const original = el.innerText;
            const fx = new TextScramble(el);
            let isHovering = false;
            el.parentElement.parentElement.addEventListener('mouseenter', () => {
                if (!isHovering) {
                    isHovering = true;
                    fx.setText(original).then(() => { isHovering = false; });
                }
            });
        });
    }

    // ==================== 7. 实时时钟 ====================
    function initLiveClock() {
        const statusBadge = $('.status-badge');
        if (!statusBadge) return;

        const timeEl = createEl('span', {
            marginLeft: '10px',
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.75rem',
            color: 'var(--primary)'
        }, {}, statusBadge);

        function update() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        setInterval(update, 1000);
        update();
    }

    // ==================== 8. 键盘快捷键 ====================
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                const playBtn = $('#playIcon');
                if (playBtn) playBtn.click();
            }
            if (e.code === 'KeyM') {
                const audio = $('#bgm');
                if (audio) audio.muted = !audio.muted;
            }
        });
    }

    // ==================== 9. 进度条 ====================
    function initProgressBar() {
        const bar = createEl('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            height: '3px',
            width: '0%',
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
            zIndex: '10000',
            transition: 'width 0.1s'
        }, {}, document.body);

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = (scrolled / max * 100) + '%';
        });
    }

    // ==================== 10. 3D卡片 ====================
    function init3DCards() {
        $$('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ==================== 11. 修复移动端图片显示 ====================
    function fixMobileImages() {
        const style = createEl('style', {}, {}, document.head);
        style.textContent = `
            @media (max-width: 768px) {
                .card {
                    min-height: 350px !important;
                }
                .card img {
                    height: 250px !important;
                    object-fit: cover !important;
                    object-position: center top !important;
                }
                .card:hover img {
                    transform: scale(1.05) !important;
                }
            }
            @media (max-width: 480px) {
                .card {
                    min-height: 300px !important;
                }
                .card img {
                    height: 200px !important;
                }
            }
        `;
    }

    // ==================== 12. 关于我板块 ====================
    function initAboutSection() {
        const container = $('.container');
        if (!container) return;

        const aboutSection = createEl('section', {}, { class: 'about-section' });
        aboutSection.innerHTML = `
            <style>
                .about-section {
                    margin: 80px 0;
                    padding: 40px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(15px);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                }
                .about-section::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
                    opacity: 0.05;
                    pointer-events: none;
                }
                .about-title {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 2rem;
                    margin-bottom: 25px;
                    border-left: 5px solid var(--primary);
                    padding-left: 15px;
                    color: var(--primary);
                }
                .about-content {
                    color: var(--text-sub);
                    line-height: 1.8;
                    font-size: 1rem;
                }
                .about-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }
                .stat-item {
                    text-align: center;
                    padding: 20px;
                    background: rgba(0, 243, 255, 0.05);
                    border-radius: 15px;
                    border: 1px solid var(--glass-border);
                    transition: all 0.3s;
                }
                .stat-item:hover {
                    border-color: var(--primary);
                    transform: translateY(-5px);
                }
                .stat-number {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 2.5rem;
                    color: var(--primary);
                    display: block;
                }
                .stat-label {
                    font-size: 0.85rem;
                    color: var(--text-sub);
                    margin-top: 5px;
                }
                @media (max-width: 768px) {
                    .about-section {
                        padding: 25px;
                        margin: 50px 0;
                    }
                    .about-title {
                        font-size: 1.5rem;
                    }
                    .stat-number {
                        font-size: 2rem;
                    }
                }
            </style>
            <h2 class="about-title">ABOUT ME // 关于我</h2>
            <div class="about-content">
                <p>这里可以写下你的自我介绍...</p>
                <p>比如：喜欢miku / 设计师 / 创作者</p>
                <p>喜欢二次元awa、Vocaloid 音乐、QQ:2701883816😋</p>
            </div>
            <div class="about-stats">
                <div class="stat-item">
                    <span class="stat-number" data-count="39">0</span>
                    <div class="stat-label">PROJECTS</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number" data-count="100">0</span>
                    <div class="stat-label">DAYS</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number" data-count="999">0</span>
                    <div class="stat-label">LOVES</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number" data-count="24">0</span>
                    <div class="stat-label">HOURS</div>
                </div>
            </div>
        `;

        // 插入到画廊之后
        const gallerySection = $('.gallery-section');
        if (gallerySection) {
            gallerySection.after(aboutSection);
        } else {
            container.appendChild(aboutSection);
        }

        // 数字滚动动画
        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    let current = 0;
                    const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            el.textContent = target;
                            clearInterval(timer);
                        } else {
                            el.textContent = Math.floor(current);
                        }
                    }, 30);
                    statObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        $$('.stat-number').forEach(el => statObserver.observe(el));
    }

    // ==================== 13. 小游戏：Miku Catch ====================
    function initMiniGame() {
        const container = $('.container');
        if (!container) return;

        const gameSection = createEl('section', {}, { class: 'game-section' });
        gameSection.innerHTML = `
            <style>
                .game-section {
                    margin: 80px 0;
                    padding: 40px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(15px);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                }
                .game-title {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 2rem;
                    margin-bottom: 10px;
                    border-left: 5px solid var(--secondary);
                    padding-left: 15px;
                    color: var(--secondary);
                }
                .game-subtitle {
                    color: var(--text-sub);
                    margin-bottom: 25px;
                    font-size: 0.9rem;
                }
                .game-container {
                    position: relative;
                    width: 100%;
                    max-width: 500px;
                    height: 400px;
                    margin: 0 auto;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 15px;
                    border: 2px solid var(--glass-border);
                    overflow: hidden;
                    cursor: pointer;
                    user-select: none;
                }
                .game-container:hover {
                    border-color: var(--primary);
                }
                .game-miku {
                    position: absolute;
                    bottom: 10px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    transition: left 0.1s;
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
                }
                .game-note {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    background: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                .game-score {
                    position: absolute;
                    top: 15px;
                    left: 20px;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 1.5rem;
                    color: var(--primary);
                }
                .game-lives {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    font-size: 1.5rem;
                }
                .game-start-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(5, 11, 20, 0.9);
                    z-index: 10;
                }
                .game-start-btn {
                    padding: 15px 40px;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 1.2rem;
                    background: var(--primary);
                    color: #000;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .game-start-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 30px rgba(0, 243, 255, 0.6);
                }
                .game-over-text {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 2rem;
                    color: var(--secondary);
                    margin-bottom: 20px;
                }
                .game-high-score {
                    position: absolute;
                    top: 50px;
                    left: 20px;
                    font-size: 0.85rem;
                    color: var(--text-sub);
                }
                @media (max-width: 768px) {
                    .game-section {
                        padding: 25px;
                        margin: 50px 0;
                    }
                    .game-title {
                        font-size: 1.5rem;
                    }
                    .game-container {
                        height: 350px;
                    }
                }
            </style>
            <h2 class="game-title">MIKU CATCH // 接音符</h2>
            <p class="game-subtitle">点击或按 ← → 方向键控制Miku接住掉落的音符！</p>
            <div class="game-container" id="gameContainer">
                <div class="game-start-overlay" id="gameStartOverlay">
                    <div class="game-start-btn" onclick="startMikuGame()">▶ START GAME</div>
                </div>
                <div class="game-score">SCORE: <span id="gameScore">0</span></div>
                <div class="game-high-score">BEST: <span id="gameHighScore">0</span></div>
                <div class="game-lives" id="gameLives">❤️❤️❤️</div>
                <div class="game-miku" id="gameMiku">🎤</div>
            </div>
        `;

        const aboutSection = $('.about-section');
        if (aboutSection) {
            aboutSection.after(gameSection);
        } else {
            container.appendChild(gameSection);
        }

        // 游戏逻辑
        let gameState = {
            running: false,
            score: 0,
            lives: 3,
            highScore: localStorage.getItem('mikuHighScore') || 0,
            mikuX: 220,
            notes: [],
            speed: 3,
            spawnRate: 60,
            frame: 0
        };

        const containerEl = $('#gameContainer');
        const mikuEl = $('#gameMiku');
        const scoreEl = $('#gameScore');
        const highScoreEl = $('#gameHighScore');
        const livesEl = $('#gameLives');
        const overlayEl = $('#gameStartOverlay');

        highScoreEl.textContent = gameState.highScore;

        // 触摸/鼠标控制
        let touchStartX = null;
        containerEl.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        containerEl.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (touchStartX === null) return;
            const rect = containerEl.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            gameState.mikuX = Math.max(0, Math.min(440, x - 30));
            mikuEl.style.left = gameState.mikuX + 'px';
            touchStartX = e.touches[0].clientX;
        });
        containerEl.addEventListener('click', (e) => {
            if (!gameState.running) return;
            const rect = containerEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            gameState.mikuX = Math.max(0, Math.min(440, x - 30));
            mikuEl.style.left = gameState.mikuX + 'px';
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!gameState.running) return;
            const speed = 25;
            if (e.key === 'ArrowLeft') {
                gameState.mikuX = Math.max(0, gameState.mikuX - speed);
            } else if (e.key === 'ArrowRight') {
                gameState.mikuX = Math.min(440, gameState.mikuX + speed);
            }
            mikuEl.style.left = gameState.mikuX + 'px';
        });

        window.startMikuGame = function() {
            gameState.running = true;
            gameState.score = 0;
            gameState.lives = 3;
            gameState.notes = [];
            gameState.speed = 3;
            gameState.frame = 0;
            overlayEl.style.display = 'none';
            scoreEl.textContent = '0';
            updateLives();
            gameLoop();
        };

        function updateLives() {
            livesEl.textContent = '❤️'.repeat(gameState.lives) + '🖤'.repeat(3 - gameState.lives);
        }

        function spawnNote() {
            const note = createEl('div', {
                position: 'absolute',
                left: rand(20, 450) + 'px',
                top: '-30px',
                width: '30px',
                height: '30px',
                background: Math.random() > 0.7 ? 'var(--secondary)' : 'var(--primary)',
                borderRadius: '50%',
                boxShadow: `0 0 15px ${Math.random() > 0.7 ? '#bc13fe' : '#00f3ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
            }, { class: 'game-note' }, containerEl);

            const types = ['♪', '♫', '♬', '★', '♥'];
            note.textContent = types[Math.floor(Math.random() * types.length)];

            gameState.notes.push({
                el: note,
                x: parseFloat(note.style.left),
                y: -30,
                speed: gameState.speed + rand(0, 2),
                caught: false
            });
        }

        function gameLoop() {
            if (!gameState.running) return;

            gameState.frame++;

            // 生成音符
            if (gameState.frame % Math.max(20, gameState.spawnRate - Math.floor(gameState.score / 50)) === 0) {
                spawnNote();
            }

            // 更新音符
            gameState.notes = gameState.notes.filter(note => {
                note.y += note.speed;
                note.el.style.top = note.y + 'px';

                // 碰撞检测
                const mikuCenterX = gameState.mikuX + 30;
                const mikuY = 340;
                const dx = note.x + 15 - mikuCenterX;
                const dy = note.y + 15 - mikuY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 45 && !note.caught) {
                    note.caught = true;
                    gameState.score += 10;
                    scoreEl.textContent = gameState.score;
                    
                    // 接住特效
                    note.el.style.transform = 'scale(1.5)';
                    note.el.style.opacity = '0';
                    setTimeout(() => note.el.remove(), 200);
                    
                    // 加速
                    if (gameState.score % 100 === 0) {
                        gameState.speed += 0.5;
                    }
                    
                    return false;
                }

                // 掉落检测
                if (note.y > 400) {
                    note.el.remove();
                    if (!note.caught) {
                        gameState.lives--;
                        updateLives();
                        // 屏幕闪烁
                        containerEl.style.boxShadow = 'inset 0 0 50px rgba(255, 0, 0, 0.3)';
                        setTimeout(() => containerEl.style.boxShadow = '', 200);
                    }
                    if (gameState.lives <= 0) {
                        gameOver();
                        return false;
                    }
                    return false;
                }

                return true;
            });

            requestAnimationFrame(gameLoop);
        }

        function gameOver() {
            gameState.running = false;
            
            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                localStorage.setItem('mikuHighScore', gameState.highScore);
                highScoreEl.textContent = gameState.highScore;
            }

            overlayEl.innerHTML = `
                <div class="game-over-text">GAME OVER</div>
                <div style="color: var(--primary); font-size: 1.2rem; margin-bottom: 20px;">SCORE: ${gameState.score}</div>
                <div class="game-start-btn" onclick="startMikuGame()">↻ RETRY</div>
            `;
            overlayEl.style.display = 'flex';

            // 清理音符
            gameState.notes.forEach(n => n.el.remove());
            gameState.notes = [];
        }
    }

    // ==================== 14. 添加全局CSS动画 ====================
    function addGlobalStyles() {
        const style = createEl('style', {}, {}, document.head);
        style.textContent = `
            @keyframes glitch {
                0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
                20% { clip-path: inset(92% 0 1% 0); transform: translate(2px, -2px); }
                40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, 2px); }
                60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, -2px); }
                80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, 2px); }
                100% { clip-path: inset(58% 0 43% 0); transform: translate(2px, -2px); }
            }
            
            .glitch-hover:hover {
                animation: glitch 0.3s linear infinite;
                position: relative;
            }
            
            /* 滚动条美化 */
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-track {
                background: var(--bg-dark);
            }
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(var(--primary), var(--secondary));
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: var(--primary);
            }

            /* 选中文字颜色 */
            ::selection {
                background: var(--primary);
                color: #000;
            }

            /* 图片加载占位 */
            .card img {
                background: linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .card img[src] {
                animation: none;
                background: none;
            }
        `;
    }

    // ==================== 初始化 ====================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('%c✨ Enhance.js v2.0 loaded', 'color: #00f3ff; font-size: 14px;');

        initEnhancedBackground();
        initMouseTrail();
        initClickRipple();
        initParallax();
        initRevealAnimation();
        initTextScramble();
        initLiveClock();
        initKeyboardShortcuts();
        initProgressBar();
        init3DCards();
        fixMobileImages();
        initAboutSection();
        initMiniGame();
        addGlobalStyles();
    }

    init();
})();

