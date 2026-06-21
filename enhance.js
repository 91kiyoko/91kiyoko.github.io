// enhance.js - 页面增强脚本
// 在 index.html 的 </body> 前引入: <script src="enhance.js"></script>

(function() {
    'use strict';

    // ==================== 配置项 ====================
    const CONFIG = {
        // 背景效果
        bg: {
            starCount: 200,           // 星星数量
            shootingStarInterval: 8000, // 流星间隔(ms)
            nebulaColors: ['#00f3ff20', '#bc13fe15', '#ff006620']
        },
        // 鼠标拖尾
        trail: {
            enabled: true,
            color: '#00f3ff',
            length: 20
        },
        // 滚动效果
        scroll: {
            parallax: true,           // 视差滚动
            revealAnimation: true     // 元素入场动画
        },
        // 交互音效
        audio: {
            hoverSound: false,        // 悬停音效（需准备音频文件）
            clickSound: false
        }
    };

    // ==================== 工具函数 ====================
    const $ = (s, p = document) => p.querySelector(s);
    const $$ = (s, p = document) => [...p.querySelectorAll(s)];

    // 创建元素
    function createEl(tag, styles = {}, attrs = {}, parent = null) {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        if (parent) parent.appendChild(el);
        return el;
    }

    // 随机数
    const rand = (min, max) => Math.random() * (max - min) + min;
    const randInt = (min, max) => Math.floor(rand(min, max));

    // ==================== 1. 增强背景效果 ====================
    function initEnhancedBackground() {
        const canvas = $('#canvas-bg');
        if (!canvas) return;

        // 保存原始上下文
        const origCtx = canvas.getContext('2d');
        
        // 创建叠加层canvas用于新效果
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

        // 星星类
        class Star {
            constructor() {
                this.reset();
            }
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
                
                // 十字光芒
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

        // 流星类
        class ShootingStar {
            constructor() {
                this.reset();
            }
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
                
                // 头部光晕
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 星云效果
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
            
            // 随机生成流星
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

    // ==================== 2. 鼠标拖尾效果 ====================
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
            
            // 清理死点
            for (let i = points.length - 1; i >= 0; i--) {
                if (points[i].life <= 0) points.splice(i, 1);
            }
            
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ==================== 3. 点击涟漪效果 ====================
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
            ], {
                duration: 600,
                easing: 'ease-out'
            });

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
            
            // 标题淡出
            const heroText = $('.hero-text');
            if (heroText && scrolled < window.innerHeight) {
                heroText.style.opacity = 1 - (scrolled / (window.innerHeight * 0.5));
            }
        });
    }

    // ==================== 5. 增强滚动显示动画 ====================
    function initRevealAnimation() {
        if (!CONFIG.scroll.revealAnimation) return;

        // 为更多元素添加入场动画
        const selectors = [
            '.section-title',
            '.card',
            '.btn',
            '.status-badge'
        ];

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

        // 为卡片标题添加悬停解码效果
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

    // ==================== 7. 动态时间显示 ====================
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
            // 空格键：播放/暂停音乐
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                const playBtn = $('#playIcon');
                if (playBtn) playBtn.click();
            }
            // M键：静音
            if (e.code === 'KeyM') {
                const audio = $('#bgm');
                if (audio) audio.muted = !audio.muted;
            }
        });
    }

    // ==================== 9. 滚动进度条 ====================
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

    // ==================== 10. 3D卡片倾斜效果 ====================
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

    // ==================== 初始化所有效果 ====================
    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('%c✨ Enhance.js loaded', 'color: #00f3ff; font-size: 14px;');

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

        // 添加全局CSS变量动画
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
            
            .glitch-hover:hover::before,
            .glitch-hover:hover::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            .glitch-hover:hover::before {
                color: var(--primary);
                z-index: -1;
                animation: glitch 0.3s linear infinite reverse;
            }
            
            .glitch-hover:hover::after {
                color: var(--secondary);
                z-index: -2;
                animation: glitch 0.3s linear infinite;
            }
        `;
    }

    init();
})();

