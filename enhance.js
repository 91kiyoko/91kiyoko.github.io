// enhance.js - 页面增强脚本 v4.0 (完整版)
// 包含：背景升级、主题切换、访客墙、Miku语音、时间轴、访客计数、天气、彩蛋、音频可视化

(function() {
    'use strict';

    const CONFIG = {
        theme: {
            current: localStorage.getItem('miku-theme') || 'cyber',
            themes: {
                cyber: {
                    '--primary': '#00f3ff', '--secondary': '#bc13fe', '--bg-dark': '#050b14',
                    '--glass-bg': 'rgba(255, 255, 255, 0.05)', '--glass-border': 'rgba(255, 255, 255, 0.1)',
                    '--text-main': '#ffffff', '--text-sub': '#a0a0a0',
                    glowColors: ['#00f3ff', '#bc13fe', '#ff0066', '#00f3ff']
                },
                sakura: {
                    '--primary': '#ff69b4', '--secondary': '#ffb6c1', '--bg-dark': '#1a0a12',
                    '--glass-bg': 'rgba(255, 182, 193, 0.08)', '--glass-border': 'rgba(255, 182, 193, 0.15)',
                    '--text-main': '#ffe4e1', '--text-sub': '#d8a0a0',
                    glowColors: ['#ff69b4', '#ffb6c1', '#ffc0cb', '#ff1493']
                },
                retro: {
                    '--primary': '#00ff00', '--secondary': '#39ff14', '--bg-dark': '#0a0a0a',
                    '--glass-bg': 'rgba(0, 255, 0, 0.03)', '--glass-border': 'rgba(0, 255, 0, 0.1)',
                    '--text-main': '#00ff00', '--text-sub': '#008800',
                    glowColors: ['#00ff00', '#39ff14', '#00cc00', '#00ff41']
                },
                sunset: {
                    '--primary': '#ff6b35', '--secondary': '#7209b7', '--bg-dark': '#1a0a1a',
                    '--glass-bg': 'rgba(255, 107, 53, 0.05)', '--glass-border': 'rgba(255, 107, 53, 0.1)',
                    '--text-main': '#ffdab9', '--text-sub': '#c4956a',
                    glowColors: ['#ff6b35', '#7209b7', '#f72585', '#4cc9f0']
                }
            }
        },
        bg: { starCount: 200, shootingStarInterval: 8000, nebulaColors: ['#00f3ff20', '#bc13fe15', '#ff006620'] },
        trail: { enabled: true, color: '#00f3ff', length: 20 },
        scroll: { parallax: true, revealAnimation: true }
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

    // ==================== 0. 主题切换系统 ====================
    function initThemeSwitcher() {
        const themeData = CONFIG.theme.themes[CONFIG.theme.current];
        applyTheme(themeData);
        const header = $('header');
        if (!header) return;
        const themeBtn = createEl('button', {
            marginLeft: '15px', padding: '6px 14px', borderRadius: '20px',
            border: '1px solid var(--primary)', background: 'rgba(0, 243, 255, 0.1)',
            color: 'var(--primary)', fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem',
            cursor: 'pointer', transition: 'all 0.3s', backdropFilter: 'blur(10px)'
        }, { id: 'theme-btn', title: '切换主题' }, header);
        updateThemeBtnText(themeBtn);
        themeBtn.addEventListener('click', () => {
            const themes = Object.keys(CONFIG.theme.themes);
            const currentIdx = themes.indexOf(CONFIG.theme.current);
            const nextIdx = (currentIdx + 1) % themes.length;
            CONFIG.theme.current = themes[nextIdx];
            localStorage.setItem('miku-theme', CONFIG.theme.current);
            applyTheme(CONFIG.theme.themes[CONFIG.theme.current]);
            updateThemeBtnText(themeBtn);
            setTimeout(() => location.reload(), 300);
        });
    }
    function applyTheme(themeData) {
        const root = document.documentElement;
        Object.entries(themeData).forEach(([key, value]) => {
            if (key.startsWith('--')) root.style.setProperty(key, value);
        });
    }
    function updateThemeBtnText(btn) {
        const icons = { cyber: '🌃', sakura: '🌸', retro: '🕹️', sunset: '🌅' };
        btn.textContent = icons[CONFIG.theme.current] || '🎨';
    }

    // ==================== 1. 背景升级系统 ====================
    function initBackgroundUpgrade() {
        createEl('div', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '9990', pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
            opacity: '0.3'
        }, { id: 'scanlines-overlay' }, document.body);

        const grainCanvas = createEl('canvas', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '9991', pointerEvents: 'none', opacity: '0.04'
        }, { id: 'grain-canvas' }, document.body);
        const gCtx = grainCanvas.getContext('2d');
        let gWidth, gHeight;
        function resizeGrain() {
            gWidth = grainCanvas.width = window.innerWidth;
            gHeight = grainCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeGrain);
        resizeGrain();
        function renderGrain() {
            const imageData = gCtx.createImageData(gWidth, gHeight);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = value; data[i+1] = value; data[i+2] = value; data[i+3] = 255;
            }
            gCtx.putImageData(imageData, 0, 0);
            requestAnimationFrame(renderGrain);
        }
        renderGrain();

        const glowContainer = createEl('div', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-2', pointerEvents: 'none', overflow: 'hidden'
        }, { id: 'glow-container' }, document.body);

        const currentTheme = CONFIG.theme.themes[CONFIG.theme.current];
        const glowColors = currentTheme.glowColors || ['#00f3ff', '#bc13fe', '#ff0066', '#00f3ff'];
        for (let i = 0; i < 4; i++) {
            const orb = createEl('div', {
                position: 'absolute', borderRadius: '50%', filter: 'blur(80px)',
                opacity: '0.15', animation: `floatOrb ${15 + i * 5}s ease-in-out infinite alternate`,
                animationDelay: `${i * -3}s`
            }, {}, glowContainer);
            const size = 300 + Math.random() * 200;
            orb.style.width = size + 'px'; orb.style.height = size + 'px';
            orb.style.background = `radial-gradient(circle, ${glowColors[i]}40, ${glowColors[(i+1)%4]}10)`;
            orb.style.left = `${Math.random() * 80}%`; orb.style.top = `${Math.random() * 80}%`;
        }
        const glowStyle = createEl('style', {}, {}, document.head);
        glowStyle.textContent = `
            @keyframes floatOrb {
                0% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(${rand(50,150)}px, ${rand(-100,100)}px) scale(1.2); }
                66% { transform: translate(${rand(-150,-50)}px, ${rand(50,150)}px) scale(0.9); }
                100% { transform: translate(${rand(-50,50)}px, ${rand(-50,50)}px) scale(1.1); }
            }
        `;

        const starfieldCanvas = createEl('canvas', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-1', pointerEvents: 'none'
        }, { id: 'starfield-canvas' }, document.body);
        const sfCtx = starfieldCanvas.getContext('2d');
        let sfWidth, sfHeight;
        function resizeStarfield() {
            sfWidth = starfieldCanvas.width = window.innerWidth;
            sfHeight = starfieldCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeStarfield);
        resizeStarfield();

        const starLayers = [
            { count: 100, speed: 0.2, size: [0.5, 1.5], alpha: [0.1, 0.4] },
            { count: 60, speed: 0.5, size: [1, 2.5], alpha: [0.3, 0.7] },
            { count: 30, speed: 1.0, size: [1.5, 3], alpha: [0.5, 1] }
        ];
        const allStars = [];
        starLayers.forEach((layer, layerIdx) => {
            for (let i = 0; i < layer.count; i++) {
                allStars.push({
                    x: Math.random() * sfWidth, y: Math.random() * sfHeight,
                    size: rand(layer.size[0], layer.size[1]),
                    baseAlpha: rand(layer.alpha[0], layer.alpha[1]),
                    alpha: rand(layer.alpha[0], layer.alpha[1]),
                    speed: layer.speed, layer: layerIdx,
                    twinkleSpeed: rand(0.005, 0.02), twinkleDir: 1,
                    color: Math.random() > 0.9 ? glowColors[1] : (Math.random() > 0.8 ? '#ff69b4' : glowColors[0])
                });
            }
        });
        let scrollY = 0;
        window.addEventListener('scroll', () => { scrollY = window.pageYOffset; });
        function animateStarfield() {
            sfCtx.clearRect(0, 0, sfWidth, sfHeight);
            allStars.forEach(star => {
                const parallaxY = star.y - (scrollY * star.speed * 0.3);
                const wrapY = ((parallaxY % sfHeight) + sfHeight) % sfHeight;
                star.alpha += star.twinkleSpeed * star.twinkleDir;
                if (star.alpha > star.baseAlpha + 0.3 || star.alpha < star.baseAlpha - 0.2) star.twinkleDir *= -1;
                star.alpha = Math.max(0.05, Math.min(1, star.alpha));
                sfCtx.fillStyle = star.color; sfCtx.globalAlpha = star.alpha;
                sfCtx.beginPath(); sfCtx.arc(star.x, wrapY, star.size, 0, Math.PI * 2); sfCtx.fill();
                if (star.size > 2) {
                    sfCtx.strokeStyle = star.color; sfCtx.lineWidth = 0.5; sfCtx.globalAlpha = star.alpha * 0.5;
                    const r = star.size * 3;
                    sfCtx.beginPath();
                    sfCtx.moveTo(star.x - r, wrapY); sfCtx.lineTo(star.x + r, wrapY);
                    sfCtx.moveTo(star.x, wrapY - r); sfCtx.lineTo(star.x, wrapY + r);
                    sfCtx.stroke();
                }
            });
            sfCtx.globalAlpha = 1;
            requestAnimationFrame(animateStarfield);
        }
        animateStarfield();

        createEl('div', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '9992', pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5, 11, 20, 0.6) 100%)'
        }, { id: 'vignette-overlay' }, document.body);
    }

    // ==================== 2. 访客计数器 ====================
    function initVisitorCounter() {
        const header = $('header');
        if (!header) return;
        let visits = parseInt(localStorage.getItem('miku-visits') || '0');
        const lastVisit = localStorage.getItem('miku-last-visit');
        const today = new Date().toDateString();
        if (lastVisit !== today) {
            visits++;
            localStorage.setItem('miku-visits', visits);
            localStorage.setItem('miku-last-visit', today);
        }
        const counterEl = createEl('div', {
            marginLeft: '10px', padding: '5px 12px', borderRadius: '15px',
            background: 'rgba(0, 243, 255, 0.05)', border: '1px solid var(--glass-border)',
            fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', color: 'var(--text-sub)',
            display: 'flex', alignItems: 'center', gap: '5px'
        }, {}, header);
        counterEl.innerHTML = `<i class="fas fa-eye" style="color: var(--primary); font-size: 0.6rem;"></i> <span style="color: var(--primary);">${String(visits).padStart(6, '0')}</span>`;
    }

    // ==================== 3. 天气小部件 ====================
    function initWeatherWidget() {
        const statusBadge = $('.status-badge');
        if (!statusBadge) return;
        const weatherEl = createEl('span', {
            marginLeft: '10px', fontSize: '0.75rem', color: 'var(--text-sub)',
            display: 'flex', alignItems: 'center', gap: '5px'
        }, { id: 'weather-widget' }, statusBadge);

        async function fetchWeather() {
            try {
                const lat = 29.273194, lon = 116.204099; // 深圳坐标，可修改
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
                const data = await res.json();
                const temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                const weatherIcons = {
                    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
                    51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
                    71: '🌨️', 73: '🌨️', 75: '🌨️', 95: '⛈️'
                };
                const icon = weatherIcons[code] || '🌡️';
                weatherEl.innerHTML = `${icon} ${temp}°C`;
            } catch (e) { weatherEl.innerHTML = '🌡️ --°C'; }
        }
        fetchWeather();
        setInterval(fetchWeather, 600000);
    }

    // ==================== 4. 每日一言 ====================
    function initDailyQuote() {
        const quotes = [
            { text: "歌に形はないけれど、歌に形をあげたい", source: "初音ミク" },
            { text: "39 = Thank You!", source: "Miku Culture" },
            { text: "世界で一番おひめさま、それは私ね", source: "ワールドイズマイン" },
            { text: "恋は戦争、あなたのハートをいただくわ", source: "恋は戦争" },
            { text: "メルト、溶けてしまいそう", source: "メルト" },
            { text: "深海少女、まだまだ沈む", source: "深海少女" },
            { text: "千本桜、夜ニ紛レ", source: "千本桜" },
            { text: "Tell Your World", source: "livetune" },
            { text: "砂の器、砕け散る音", source: "ハチ" },
            { text: "ロミオとシンデレラ、でもその前に", source: "doriko" }
        ];
        const today = new Date().toDateString();
        const saved = localStorage.getItem('miku-quote-date');
        let quoteIdx = parseInt(localStorage.getItem('miku-quote-idx') || '0');
        if (saved !== today) {
            quoteIdx = Math.floor(Math.random() * quotes.length);
            localStorage.setItem('miku-quote-date', today);
            localStorage.setItem('miku-quote-idx', quoteIdx);
        }
        const quote = quotes[quoteIdx];
        const typewriter = $('.typewriter');
        if (typewriter) {
            const quoteEl = createEl('div', {
                marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-sub)',
                fontStyle: 'italic', opacity: '0.7',
                borderLeft: '2px solid var(--secondary)', paddingLeft: '10px'
            }, { id: 'daily-quote' }, typewriter.parentElement);
            quoteEl.innerHTML = `"${quote.text}" <span style="color: var(--primary); font-size: 0.7rem;">— ${quote.source}</span>`;
        }
    }

    // ==================== 5. 访客留言墙 ====================
    function initGuestbook() {
        const container = $('.container');
        if (!container) return;
        const guestbookSection = createEl('section', {
            margin: '80px 0', padding: '40px', background: 'var(--glass-bg)',
            backdropFilter: 'blur(15px)', border: '1px solid var(--glass-border)',
            borderRadius: '20px', position: 'relative', overflow: 'hidden'
        }, { class: 'guestbook-section' });

        guestbookSection.innerHTML = `
            <style>
                .guestbook-title { font-family: 'Orbitron', sans-serif; font-size: 2rem; margin-bottom: 25px; border-left: 5px solid var(--secondary); padding-left: 15px; color: var(--secondary); }
                .guestbook-form { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
                .guestbook-input { background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 10px; padding: 12px 15px; color: var(--text-main); font-family: 'Noto Sans SC', sans-serif; font-size: 0.9rem; outline: none; transition: all 0.3s; }
                .guestbook-input:focus { border-color: var(--primary); box-shadow: 0 0 15px rgba(0, 243, 255, 0.2); }
                .guestbook-textarea { min-height: 80px; resize: vertical; }
                .guestbook-submit { align-self: flex-start; padding: 10px 30px; background: var(--primary); color: #000; border: none; border-radius: 5px; font-family: 'Orbitron', sans-serif; font-weight: bold; cursor: pointer; transition: all 0.3s; }
                .guestbook-submit:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); }
                .guestbook-messages { display: flex; flex-direction: column; gap: 15px; max-height: 400px; overflow-y: auto; }
                .guestbook-message { background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 12px; padding: 15px; transition: all 0.3s; }
                .guestbook-message:hover { border-color: var(--primary); transform: translateX(5px); }
                .guestbook-msg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .guestbook-msg-name { font-family: 'Orbitron', sans-serif; color: var(--primary); font-size: 0.9rem; }
                .guestbook-msg-time { font-size: 0.7rem; color: var(--text-sub); }
                .guestbook-msg-content { color: var(--text-sub); font-size: 0.85rem; line-height: 1.6; }
                .guestbook-empty { text-align: center; color: var(--text-sub); padding: 30px; font-style: italic; }
                @media (max-width: 768px) { .guestbook-section { padding: 25px; margin: 50px 0; } .guestbook-title { font-size: 1.5rem; } }
            </style>
            <h2 class="guestbook-title">GUESTBOOK // 留言板</h2>
            <div class="guestbook-form">
                <input type="text" class="guestbook-input" id="gb-name" placeholder="你的名字 / Nickname" maxlength="20">
                <textarea class="guestbook-input guestbook-textarea" id="gb-message" placeholder="想对 Miku 说什么..." maxlength="200"></textarea>
                <button class="guestbook-submit" onclick="submitGuestbook()">📡 SEND MESSAGE</button>
            </div>
            <div class="guestbook-messages" id="gb-messages">
                <div class="guestbook-empty">还没有留言，来做第一个访客吧！</div>
            </div>
        `;

        const gameSection = $('.game-section');
        if (gameSection) gameSection.after(guestbookSection);
        else container.appendChild(guestbookSection);

        loadGuestbookMessages();

        window.submitGuestbook = function() {
            const name = $('#gb-name').value.trim();
            const message = $('#gb-message').value.trim();
            if (!name || !message) { alert('请填写名字和留言内容~'); return; }
            const messages = JSON.parse(localStorage.getItem('miku-guestbook') || '[]');
            messages.unshift({ name: name.substring(0, 20), message: message.substring(0, 200), time: new Date().toLocaleString('zh-CN'), id: Date.now() });
            if (messages.length > 50) messages.pop();
            localStorage.setItem('miku-guestbook', JSON.stringify(messages));
            $('#gb-name').value = ''; $('#gb-message').value = '';
            loadGuestbookMessages();
        };
    }

    function loadGuestbookMessages() {
        const container = $('#gb-messages');
        if (!container) return;
        const messages = JSON.parse(localStorage.getItem('miku-guestbook') || '[]');
        if (messages.length === 0) { container.innerHTML = '<div class="guestbook-empty">还没有留言，来做第一个访客吧！</div>'; return; }
        container.innerHTML = messages.map(msg => `
            <div class="guestbook-message">
                <div class="guestbook-msg-header">
                    <span class="guestbook-msg-name">👤 ${escapeHtml(msg.name)}</span>
                    <span class="guestbook-msg-time">${msg.time}</span>
                </div>
                <div class="guestbook-msg-content">${escapeHtml(msg.message)}</div>
            </div>
        `).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== 6. 时间轴 / 技能展示 ====================
    function initTimeline() {
        const container = $('.container');
        if (!container) return;
        const timelineSection = createEl('section', {
            margin: '80px 0', padding: '40px', background: 'var(--glass-bg)',
            backdropFilter: 'blur(15px)', border: '1px solid var(--glass-border)',
            borderRadius: '20px', position: 'relative', overflow: 'hidden'
        }, { class: 'timeline-section' });

        timelineSection.innerHTML = `
            <style>
                .timeline-title { font-family: 'Orbitron', sans-serif; font-size: 2rem; margin-bottom: 30px; border-left: 5px solid var(--primary); padding-left: 15px; color: var(--primary); }
                .timeline { position: relative; padding-left: 30px; }
                .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, var(--primary), var(--secondary)); box-shadow: 0 0 10px var(--primary); }
                .timeline-item { position: relative; margin-bottom: 30px; padding: 20px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 12px; transition: all 0.3s; }
                .timeline-item:hover { border-color: var(--primary); transform: translateX(10px); box-shadow: 0 0 20px rgba(0, 243, 255, 0.1); }
                .timeline-item::before { content: ''; position: absolute; left: -36px; top: 24px; width: 12px; height: 12px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 10px var(--primary); animation: pulse 2s infinite; }
                .timeline-date { font-family: 'Orbitron', monospace; font-size: 0.8rem; color: var(--primary); margin-bottom: 5px; }
                .timeline-content { font-size: 1rem; color: var(--text-main); margin-bottom: 5px; }
                .timeline-desc { font-size: 0.85rem; color: var(--text-sub); }
                .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 30px; }
                .skill-item { background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 10px; padding: 15px; transition: all 0.3s; }
                .skill-item:hover { border-color: var(--secondary); }
                .skill-name { font-family: 'Orbitron', sans-serif; font-size: 0.85rem; color: var(--text-main); margin-bottom: 8px; }
                .skill-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
                .skill-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 3px; transition: width 1.5s ease-out; width: 0%; }
                @media (max-width: 768px) { .timeline-section { padding: 25px; margin: 50px 0; } .timeline-title { font-size: 1.5rem; } .timeline { padding-left: 20px; } .timeline-item::before { left: -26px; } }
            </style>
            <h2 class="timeline-title">TIMELINE // 成长轨迹</h2>
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-date">2025.06</div>
                    <div class="timeline-content">🌱 初识前端开发</div>
                    <div class="timeline-desc">开始接触 HTML/CSS/JavaScript，被网页的魔力吸引</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-date">2025.06</div>
                    <div class="timeline-content">🎨 搭建 91kiyoko.github.io</div>
                    <div class="timeline-desc">创建个人主页，融入 Miku 元素</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-date">2020.06</div>
                    <div class="timeline-content">🎤 深入 Vocaloid 文化</div>
                    <div class="timeline-desc">收集 Miku 周边，认识更多同好</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-date">2026.01</div>
                    <div class="timeline-content">🚀 网站大升级</div>
                    <div class="timeline-desc">添加交互功能、小游戏、主题切换，打造真正的 Cyber Space</div>
                </div>
            </div>
            <h3 style="font-family: 'Orbitron'; color: var(--secondary); margin: 30px 0 15px; font-size: 1.2rem;">SKILLS // 技能树</h3>
            <div class="skills-grid">
                <div class="skill-item"><div class="skill-name">HTML/CSS</div><div class="skill-bar"><div class="skill-fill" data-width="85"></div></div></div>
                <div class="skill-item"><div class="skill-name">JavaScript</div><div class="skill-bar"><div class="skill-fill" data-width="70"></div></div></div>
                <div class="skill-item"><div class="skill-name">Miku 鉴赏</div><div class="skill-bar"><div class="skill-fill" data-width="99"></div></div></div>
                <div class="skill-item"><div class="skill-name">Vocaloid 音乐</div><div class="skill-bar"><div class="skill-fill" data-width="95"></div></div></div>
                <div class="skill-item"><div class="skill-name">Live2D</div><div class="skill-bar"><div class="skill-fill" data-width="40"></div></div></div>
                <div class="skill-item"><div class="skill-name">Web Design</div><div class="skill-bar"><div class="skill-fill" data-width="60"></div></div></div>
            </div>
        `;

        const guestbookSection = $('.guestbook-section');
        if (guestbookSection) guestbookSection.after(timelineSection);
        else container.appendChild(timelineSection);

        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    setTimeout(() => { fill.style.width = fill.dataset.width + '%'; }, 200);
                    skillObserver.unobserve(fill);
                }
            });
        }, { threshold: 0.5 });
        $$('.skill-fill').forEach(el => skillObserver.observe(el));
    }

    // ==================== 7. 彩蛋系统 ====================
    function initEasterEggs() {
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        let konamiIdx = 0;
        document.addEventListener('keydown', (e) => {
            if (e.code === konamiCode[konamiIdx]) {
                konamiIdx++;
                if (konamiIdx === konamiCode.length) { triggerKonami(); konamiIdx = 0; }
            } else { konamiIdx = 0; }
        });

        function triggerKonami() {
            const flash = createEl('div', {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                zIndex: '10000', pointerEvents: 'none',
                background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
                opacity: '0', transition: 'opacity 0.5s'
            }, {}, document.body);
            flash.style.opacity = '0.3';
            setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 500); }, 2000);
            console.log('%c🎉 KONAMI CODE ACTIVATED! 🎉', 'color: #00ff00; font-size: 20px; font-weight: bold;');
            console.log('%cYou found the secret! 39!', 'color: #ff69b4; font-size: 14px;');
        }

        const logo = $('.logo');
        if (logo) {
            let clickCount = 0;
            logo.addEventListener('click', () => {
                clickCount++;
                if (clickCount >= 5) { clickCount = 0; logo.style.animation = 'glitch 0.5s linear'; setTimeout(() => logo.style.animation = '', 500); }
            });
        }
    }

    // ==================== 8. 音频可视化 ====================
    function initAudioVisualizer() {
        const bgm = $('#bgm');
        const visualizerContainer = $('.visualizer');
        if (!bgm || !visualizerContainer) return;
        let audioContext, analyser, dataArray;
        function setupAudioContext() {
            if (audioContext) return;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            const source = audioContext.createMediaElementSource(bgm);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        visualizerContainer.innerHTML = '';
        const bars = [];
        for (let i = 0; i < 5; i++) {
            const bar = createEl('div', { width: '4px', background: 'var(--secondary)', borderRadius: '2px', transition: 'height 0.05s', height: '5px' }, {}, visualizerContainer);
            bars.push(bar);
        }
        function animateVisualizer() {
            if (!bgm.paused && analyser) {
                analyser.getByteFrequencyData(dataArray);
                bars.forEach((bar, i) => {
                    const value = dataArray[i * 2] || 0;
                    bar.style.height = Math.max(5, (value / 255) * 25) + 'px';
                });
            } else { bars.forEach(bar => { bar.style.height = '5px'; }); }
            requestAnimationFrame(animateVisualizer);
        }
        animateVisualizer();
        bgm.addEventListener('play', () => { try { setupAudioContext(); } catch (e) {} });
    }

    // ==================== 9. Miku 语音问候 ====================
    function initMikuVoice() {
        const greetings = [
            "欢迎来到 Miku Cyber Space！", "39！今天也要加油哦！",
            "我是初音未来，很高兴见到你！", "准备好进入miku世界了吗？",
            "歌声会传达给每一个人~"
        ];
        const hasVisited = sessionStorage.getItem('miku-greeted');
        if (!hasVisited) {
            sessionStorage.setItem('miku-greeted', 'true');
            const greeting = greetings[Math.floor(Math.random() * greetings.length)];
            const bubble = createEl('div', {
                position: 'fixed', bottom: '80px', right: '20px', padding: '15px 20px',
                background: 'var(--glass-bg)', backdropFilter: 'blur(15px)',
                border: '1px solid var(--primary)', borderRadius: '15px',
                color: 'var(--primary)', fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: '0.9rem', zIndex: '9999', maxWidth: '250px',
                boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)',
                opacity: '0', transform: 'translateY(20px)', transition: 'all 0.5s ease-out'
            }, { id: 'miku-greeting' }, document.body);
            bubble.innerHTML = `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;"><span style="font-size: 1.5rem;">🎤</span><span style="font-family: 'Orbitron'; font-size: 0.8rem; color: var(--secondary);">MIKU</span></div><div>${greeting}</div>`;
            setTimeout(() => { bubble.style.opacity = '1'; bubble.style.transform = 'translateY(0)'; }, 1000);
            setTimeout(() => { bubble.style.opacity = '0'; bubble.style.transform = 'translateY(20px)'; setTimeout(() => bubble.remove(), 500); }, 6000);
        }
    }

    // ==================== 10. 鼠标拖尾 ====================
    function initMouseTrail() {
        if (!CONFIG.trail.enabled) return;
        const trail = createEl('canvas', { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', zIndex: '9999', pointerEvents: 'none' }, {}, document.body);
        const ctx = trail.getContext('2d');
        let width, height;
        function resize() { width = trail.width = window.innerWidth; height = trail.height = window.innerHeight; }
        window.addEventListener('resize', resize); resize();
        const points = [];
        const maxPoints = CONFIG.trail.length;
        document.addEventListener('mousemove', (e) => { points.push({ x: e.clientX, y: e.clientY, life: 1 }); if (points.length > maxPoints) points.shift(); });
        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (let i = 1; i < points.length; i++) {
                const p = points[i], prev = points[i - 1];
                p.life -= 0.05; if (p.life <= 0) continue;
                const alpha = p.life, lineWidth = (i / points.length) * 3;
                ctx.strokeStyle = CONFIG.trail.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.shadowBlur = 10; ctx.shadowColor = CONFIG.trail.color;
                ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
            }
            ctx.shadowBlur = 0;
            for (let i = points.length - 1; i >= 0; i--) { if (points[i].life <= 0) points.splice(i, 1); }
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ==================== 11. 点击涟漪 ====================
    function initClickRipple() {
        document.addEventListener('click', (e) => {
            const ripple = createEl('div', { position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px', width: '0px', height: '0px', borderRadius: '50%', border: '2px solid var(--primary)', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: '9998' }, {}, document.body);
            const anim = ripple.animate([{ width: '0px', height: '0px', opacity: 1, borderWidth: '3px' }, { width: '100px', height: '100px', opacity: 0, borderWidth: '0px' }], { duration: 600, easing: 'ease-out' });
            anim.onfinish = () => ripple.remove();
        });
    }

    // ==================== 12. 视差滚动 ====================
    function initParallax() {
        if (!CONFIG.scroll.parallax) return;
        const hero = $('.hero'), heroCard = $('.hero-card');
        if (!hero || !heroCard) return;
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            heroCard.style.transform = `translateY(${scrolled * 0.3 * 0.5}px)`;
            const heroText = $('.hero-text');
            if (heroText && scrolled < window.innerHeight) heroText.style.opacity = 1 - (scrolled / (window.innerHeight * 0.5));
        });
    }

    // ==================== 13. 滚动显示动画 ====================
    function initRevealAnimation() {
        if (!CONFIG.scroll.revealAnimation) return;
        const selectors = ['.section-title', '.card', '.btn', '.status-badge', '.about-section', '.game-section', '.guestbook-section', '.timeline-section'];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0) scale(1)'; entry.target.style.filter = 'blur(0)'; }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        selectors.forEach(sel => {
            $$(sel).forEach((el, i) => {
                el.style.opacity = '0'; el.style.transform = 'translateY(40px) scale(0.95)'; el.style.filter = 'blur(2px)';
                el.style.transition = `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`;
                observer.observe(el);
            });
        });
    }

    // ==================== 14. 文字解码效果 ====================
    function initTextScramble() {
        const chars = '!<>-_\\\\/[]{}—=+*^?#________';
        class TextScramble {
            constructor(el) { this.el = el; this.chars = chars; this.update = this.update.bind(this); }
            setText(newText) {
                const oldText = this.el.innerText, length = Math.max(oldText.length, newText.length);
                const promise = new Promise((resolve) => this.resolve = resolve);
                this.queue = [];
                for (let i = 0; i < length; i++) {
                    const from = oldText[i] || '', to = newText[i] || '';
                    const start = Math.floor(Math.random() * 40), end = start + Math.floor(Math.random() * 40);
                    this.queue.push({ from, to, start, end });
                }
                cancelAnimationFrame(this.frameRequest); this.frame = 0; this.update();
                return promise;
            }
            update() {
                let output = ''; let complete = 0;
                for (let i = 0, n = this.queue.length; i < n; i++) {
                    let { from, to, start, end, char } = this.queue[i];
                    if (this.frame >= end) { complete++; output += to; }
                    else if (this.frame >= start) {
                        if (!char || Math.random() < 0.28) { char = this.randomChar(); this.queue[i].char = char; }
                        output += `<span style="color: var(--secondary)">${char}</span>`;
                    } else { output += from; }
                }
                this.el.innerHTML = output;
                if (complete === this.queue.length) this.resolve();
                else { this.frameRequest = requestAnimationFrame(this.update); this.frame++; }
            }
            randomChar() { return this.chars[Math.floor(Math.random() * this.chars.length)]; }
        }
        $$('.card-title').forEach(el => {
            const original = el.innerText, fx = new TextScramble(el);
            let isHovering = false;
            el.parentElement.parentElement.addEventListener('mouseenter', () => {
                if (!isHovering) { isHovering = true; fx.setText(original).then(() => { isHovering = false; }); }
            });
        });
    }

    // ==================== 15. 实时时钟 ====================
    function initLiveClock() {
        const statusBadge = $('.status-badge');
        if (!statusBadge) return;
        const timeEl = createEl('span', { marginLeft: '10px', fontFamily: "'Orbitron', monospace", fontSize: '0.75rem', color: 'var(--primary)' }, {}, statusBadge);
        function update() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        setInterval(update, 1000); update();
    }

    // ==================== 16. 键盘快捷键 ====================
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault(); const playBtn = $('#playIcon'); if (playBtn) playBtn.click();
            }
            if (e.code === 'KeyM') { const audio = $('#bgm'); if (audio) audio.muted = !audio.muted; }
        });
    }

    // ==================== 17. 进度条 ====================
    function initProgressBar() {
        const bar = createEl('div', { position: 'fixed', top: '0', left: '0', height: '3px', width: '0%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', zIndex: '10000', transition: 'width 0.1s' }, {}, document.body);
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = (scrolled / max * 100) + '%';
        });
    }

    // ==================== 18. 3D卡片 ====================
    function init3DCards() {
        $$('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left, y = e.clientY - rect.top;
                const centerX = rect.width / 2, centerY = rect.height / 2;
                card.style.transform = `perspective(1000px) rotateX(${(y - centerY) / 10}deg) rotateY(${(centerX - x) / 10}deg) translateY(-10px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    // ==================== 19. 修复移动端图片显示 ====================
    function fixMobileImages() {
        const style = createEl('style', {}, {}, document.head);
        style.textContent = `
            @media (max-width: 768px) { .card { min-height: 350px !important; } .card img { height: 250px !important; object-fit: cover !important; object-position: center top !important; } .card:hover img { transform: scale(1.05) !important; } }
            @media (max-width: 480px) { .card { min-height: 300px !important; } .card img { height: 200px !important; } }
        `;
    }

    // ==================== 20. 关于我板块 ====================
    function initAboutSection() {
        const container = $('.container');
        if (!container) return;
        const aboutSection = createEl('section', {
            margin: '80px 0', padding: '40px', background: 'var(--glass-bg)',
            backdropFilter: 'blur(15px)', border: '1px solid var(--glass-border)',
            borderRadius: '20px', position: 'relative', overflow: 'hidden'
        }, { class: 'about-section' });

        aboutSection.innerHTML = `
            <style>
                .about-section::before { content: ''; position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, var(--primary) 0%, transparent 70%); opacity: 0.05; pointer-events: none; }
                .about-title { font-family: 'Orbitron', sans-serif; font-size: 2rem; margin-bottom: 25px; border-left: 5px solid var(--primary); padding-left: 15px; color: var(--primary); }
                .about-content { color: var(--text-sub); line-height: 1.8; font-size: 1rem; }
                .about-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 30px; }
                .stat-item { text-align: center; padding: 20px; background: rgba(0, 243, 255, 0.05); border-radius: 15px; border: 1px solid var(--glass-border); transition: all 0.3s; }
                .stat-item:hover { border-color: var(--primary); transform: translateY(-5px); }
                .stat-number { font-family: 'Orbitron', sans-serif; font-size: 2.5rem; color: var(--primary); display: block; }
                .stat-label { font-size: 0.85rem; color: var(--text-sub); margin-top: 5px; }
                @media (max-width: 768px) { .about-section { padding: 25px; margin: 50px 0; } .about-title { font-size: 1.5rem; } .stat-number { font-size: 2rem; } }
            </style>
            <h2 class="about-title">ABOUT ME // 关于我</h2>
            <div class="about-content">
                <p>喜欢miku / 设计师 / 创作者</p>
                <p>喜欢二次元awa、Vocaloid 音乐、QQ:2701873816😋</p>
                <p>正在学习前端开发，打造属于自己的 Cyber Space</p>
            </div>
            <div class="about-stats">
                <div class="stat-item"><span class="stat-number" data-count="39">0</span><div class="stat-label">PROJECTS</div></div>
                <div class="stat-item"><span class="stat-number" data-count="365">0</span><div class="stat-label">DAYS</div></div>
                <div class="stat-item"><span class="stat-number" data-count="999">0</span><div class="stat-label">LOVES</div></div>
                <div class="stat-item"><span class="stat-number" data-count="24">0</span><div class="stat-label">HOURS</div></div>
            </div>
        `;

        const gallerySection = $('.gallery-section');
        if (gallerySection) gallerySection.after(aboutSection);
        else container.appendChild(aboutSection);

        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target, target = parseInt(el.dataset.count);
                    let current = 0; const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) { el.textContent = target; clearInterval(timer); }
                        else el.textContent = Math.floor(current);
                    }, 30);
                    statObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        $$('.stat-number').forEach(el => statObserver.observe(el));
    }

    // ==================== 21. 小游戏：Miku Catch ====================
    function initMiniGame() {
        const container = $('.container');
        if (!container) return;
        const gameSection = createEl('section', {
            margin: '80px 0', padding: '40px', background: 'var(--glass-bg)',
            backdropFilter: 'blur(15px)', border: '1px solid var(--glass-border)', borderRadius: '20px'
        }, { class: 'game-section' });

        gameSection.innerHTML = `
            <style>
                .game-title { font-family: 'Orbitron', sans-serif; font-size: 2rem; margin-bottom: 10px; border-left: 5px solid var(--secondary); padding-left: 15px; color: var(--secondary); }
                .game-subtitle { color: var(--text-sub); margin-bottom: 25px; font-size: 0.9rem; }
                .game-container { position: relative; width: 100%; max-width: 500px; height: 400px; margin: 0 auto; background: rgba(0, 0, 0, 0.3); border-radius: 15px; border: 2px solid var(--glass-border); overflow: hidden; cursor: pointer; user-select: none; }
                .game-container:hover { border-color: var(--primary); }
                .game-miku { position: absolute; bottom: 10px; width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; transition: left 0.1s; box-shadow: 0 0 20px rgba(0, 243, 255, 0.5); }
                .game-note { position: absolute; width: 30px; height: 30px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); display: flex; align-items: center; justify-content: center; font-size: 16px; }
                .game-score { position: absolute; top: 15px; left: 20px; font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: var(--primary); }
                .game-lives { position: absolute; top: 15px; right: 20px; font-size: 1.5rem; }
                .game-start-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(5, 11, 20, 0.9); z-index: 10; }
                .game-start-btn { padding: 15px 40px; font-family: 'Orbitron', sans-serif; font-size: 1.2rem; background: var(--primary); color: #000; border: none; border-radius: 10px; cursor: pointer; transition: all 0.3s; }
                .game-start-btn:hover { transform: scale(1.1); box-shadow: 0 0 30px rgba(0, 243, 255, 0.6); }
                .game-over-text { font-family: 'Orbitron', sans-serif; font-size: 2rem; color: var(--secondary); margin-bottom: 20px; }
                .game-high-score { position: absolute; top: 50px; left: 20px; font-size: 0.85rem; color: var(--text-sub); }
                @media (max-width: 768px) { .game-section { padding: 25px; margin: 50px 0; } .game-title { font-size: 1.5rem; } .game-container { height: 350px; } }
            </style>
            <h2 class="game-title">MIKU CATCH // 接音符</h2>
            <p class="game-subtitle">点击或按 ← → 方向键控制Miku接住掉落的音符！</p>
            <div class="game-container" id="gameContainer">
                <div class="game-start-overlay" id="gameStartOverlay"><div class="game-start-btn" onclick="startMikuGame()">▶ START GAME</div></div>
                <div class="game-score">SCORE: <span id="gameScore">0</span></div>
                <div class="game-high-score">BEST: <span id="gameHighScore">0</span></div>
                <div class="game-lives" id="gameLives">❤️❤️❤️</div>
                <div class="game-miku" id="gameMiku">🎤</div>
            </div>
        `;

        const aboutSection = $('.about-section');
        if (aboutSection) aboutSection.after(gameSection);
        else container.appendChild(gameSection);

        let gameState = { running: false, score: 0, lives: 3, highScore: localStorage.getItem('mikuHighScore') || 0, mikuX: 220, notes: [], speed: 3, spawnRate: 60, frame: 0 };
        const containerEl = $('#gameContainer'), mikuEl = $('#gameMiku'), scoreEl = $('#gameScore'), highScoreEl = $('#gameHighScore'), livesEl = $('#gameLives'), overlayEl = $('#gameStartOverlay');
        highScoreEl.textContent = gameState.highScore;

        let touchStartX = null;
        containerEl.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
        containerEl.addEventListener('touchmove', (e) => {
            e.preventDefault(); if (touchStartX === null) return;
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
        document.addEventListener('keydown', (e) => {
            if (!gameState.running) return;
            const speed = 25;
            if (e.key === 'ArrowLeft') gameState.mikuX = Math.max(0, gameState.mikuX - speed);
            else if (e.key === 'ArrowRight') gameState.mikuX = Math.min(440, gameState.mikuX + speed);
            mikuEl.style.left = gameState.mikuX + 'px';
        });

        window.startMikuGame = function() {
            gameState.running = true; gameState.score = 0; gameState.lives = 3; gameState.notes = []; gameState.speed = 3; gameState.frame = 0;
            overlayEl.style.display = 'none'; scoreEl.textContent = '0'; updateLives(); gameLoop();
        };
        function updateLives() { livesEl.textContent = '❤️'.repeat(gameState.lives) + '🖤'.repeat(3 - gameState.lives); }
        function spawnNote() {
            const note = createEl('div', { position: 'absolute', left: rand(20, 450) + 'px', top: '-30px', width: '30px', height: '30px', background: Math.random() > 0.7 ? 'var(--secondary)' : 'var(--primary)', borderRadius: '50%', boxShadow: `0 0 15px ${Math.random() > 0.7 ? '#bc13fe' : '#00f3ff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }, { class: 'game-note' }, containerEl);
            const types = ['♪', '♫', '♬', '★', '♥'];
            note.textContent = types[Math.floor(Math.random() * types.length)];
            gameState.notes.push({ el: note, x: parseFloat(note.style.left), y: -30, speed: gameState.speed + rand(0, 2), caught: false });
        }
        function gameLoop() {
            if (!gameState.running) return;
            gameState.frame++;
            if (gameState.frame % Math.max(20, gameState.spawnRate - Math.floor(gameState.score / 50)) === 0) spawnNote();
            gameState.notes = gameState.notes.filter(note => {
                note.y += note.speed; note.el.style.top = note.y + 'px';
                const mikuCenterX = gameState.mikuX + 30, mikuY = 340;
                const dx = note.x + 15 - mikuCenterX, dy = note.y + 15 - mikuY, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 45 && !note.caught) {
                    note.caught = true; gameState.score += 10; scoreEl.textContent = gameState.score;
                    note.el.style.transform = 'scale(1.5)'; note.el.style.opacity = '0';
                    setTimeout(() => note.el.remove(), 200);
                    if (gameState.score % 100 === 0) gameState.speed += 0.5;
                    return false;
                }
                if (note.y > 400) {
                    note.el.remove();
                    if (!note.caught) {
                        gameState.lives--; updateLives();
                        containerEl.style.boxShadow = 'inset 0 0 50px rgba(255, 0, 0, 0.3)';
                        setTimeout(() => containerEl.style.boxShadow = '', 200);
                    }
                    if (gameState.lives <= 0) { gameOver(); return false; }
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
            overlayEl.innerHTML = `<div class="game-over-text">GAME OVER</div><div style="color: var(--primary); font-size: 1.2rem; margin-bottom: 20px;">SCORE: ${gameState.score}</div><div class="game-start-btn" onclick="startMikuGame()">↻ RETRY</div>`;
            overlayEl.style.display = 'flex';
            gameState.notes.forEach(n => n.el.remove()); gameState.notes = [];
        }
    }

    // ==================== 22. 全局CSS动画 ====================
    function addGlobalStyles() {
        const style = createEl('style', {}, {}, document.head);
        style.textContent = `
            @keyframes glitch { 0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); } 20% { clip-path: inset(92% 0 1% 0); transform: translate(2px, -2px); } 40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, 2px); } 60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, -2px); } 80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, 2px); } 100% { clip-path: inset(58% 0 43% 0); transform: translate(2px, -2px); } }
            .glitch-hover:hover { animation: glitch 0.3s linear infinite; position: relative; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: var(--bg-dark); }
            ::-webkit-scrollbar-thumb { background: linear-gradient(var(--primary), var(--secondary)); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--primary); }
            ::selection { background: var(--primary); color: #000; }
            .card img { background: linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
            @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .card img[src] { animation: none; background: none; }
        `;
    }

    // ==================== 初始化 ====================
    function init() {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); return; }
        console.log('%c✨ Enhance.js v4.0 loaded', 'color: #00f3ff; font-size: 14px;');
        console.log('%c🌸 Features: 主题切换 | 背景升级 | 访客计数 | 天气 | 每日一言 | 留言板 | 时间轴 | 技能树 | 彩蛋 | 音频可视化 | Miku问候 | 拖尾 | 涟漪 | 视差 | 滚动动画 | 文字解码 | 时钟 | 快捷键 | 进度条 | 3D卡片 | 关于我 | 小游戏', 'color: #bc13fe; font-size: 10px;');

        initThemeSwitcher();
        initBackgroundUpgrade();
        initVisitorCounter();
        initWeatherWidget();
        initDailyQuote();
        initGuestbook();
        initTimeline();
        initEasterEggs();
        initAudioVisualizer();
        initMikuVoice();
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
