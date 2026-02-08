class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.initialized = false;
    }

    init() {
        if (!this.initialized) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playClick() {
        if (!this.initialized) this.init();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    playSwoosh() {
        if (!this.initialized) this.init();

        const bufferSize = this.audioCtx.sampleRate * 0.2; // 0.2 seconds
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.2);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        noise.start();
    }

    attachListeners() {
        const interactiveElements = document.querySelectorAll('.interactive');
        interactiveElements.forEach(el => {
            // Clone element to remove existing listeners (cleanest way to reset)
            // But here we are creating new elements mostly, so just adding is fine.
            // To be safe against multiple calls, we can use a flag or just add.
            // Since we are replacing innerHTML in loadProjects, the old elements are gone.
            // So we just need to add listeners to the new ones.

            el.addEventListener('mouseenter', () => this.playSwoosh());
            el.addEventListener('mousedown', () => this.playClick());
        });
    }
}

const soundManager = new SoundManager();

// Initialize audio context on first user interaction
document.addEventListener('click', () => {
    soundManager.init();
}, { once: true });

async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const projects = await response.json();
        
        // Sort projects alphabetically by title
        projects.sort((a, b) => a.title.localeCompare(b.title));
        
        const grid = document.querySelector('.grid');

        grid.innerHTML = projects.map(project => `
            <a href="${project.url}" class="comic-panel card interactive">
                <h2>${project.title}</h2>
                <div class="icon">${project.icon}</div>
                <p>${project.description}</p>
            </a>
        `).join('');

        // Attach sound effects to new elements
        soundManager.attachListeners();

    } catch (error) {
        console.error('Error loading projects:', error);
        document.querySelector('.grid').innerHTML = '<p>Error loading comics...</p>';
    }
}

// Load projects when DOM is ready
document.addEventListener('DOMContentLoaded', loadProjects);
