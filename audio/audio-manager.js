/**
 * Abyss Walker - Audio Manager
 * Comprehensive audio system with Web Audio API support
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.uiGain = null;
        
        this.isMuted = false;
        this.volumes = {
            master: 0.8,
            music: 0.6,
            sfx: 0.9,
            ui: 0.7
        };
        
        this.currentMusic = null;
        this.musicFadeInterval = null;
        this.loopPoints = {};
        
        this.soundBank = new Map();
        this.musicBank = new Map();
        this.activeSounds = [];
        
        this.isInitialized = false;
    }

    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            // Create gain nodes for mixing
            this.masterGain = this.context.createGain();
            this.musicGain = this.context.createGain();
            this.sfxGain = this.context.createGain();
            this.uiGain = this.context.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.uiGain.connect(this.masterGain);
            this.masterGain.connect(this.context.destination);
            
            // Set initial volumes
            this.updateGains();
            
            // Resume context if suspended (browser autoplay policy)
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
            
            this.isInitialized = true;
            console.log('AudioManager initialized');
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
        }
    }

    async resume() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    /* ============================================
       VOLUME CONTROL
       ============================================ */
    
    setVolume(type, value) {
        // Clamp between 0 and 1
        value = Math.max(0, Math.min(1, value));
        this.volumes[type] = value;
        this.updateGains();
    }

    getVolume(type) {
        return this.volumes[type];
    }

    setMasterVolume(value) {
        this.setVolume('master', value);
    }

    setMusicVolume(value) {
        this.setVolume('music', value);
    }

    setSFXVolume(value) {
        this.setVolume('sfx', value);
    }

    updateGains() {
        if (!this.isInitialized) return;
        
        const master = this.isMuted ? 0 : this.volumes.master;
        this.masterGain.gain.setValueAtTime(master, this.context.currentTime);
        
        this.musicGain.gain.setValueAtTime(this.volumes.music, this.context.currentTime);
        this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.context.currentTime);
        this.uiGain.gain.setValueAtTime(this.volumes.ui, this.context.currentTime);
    }

    /* ============================================
       MUTE CONTROL
       ============================================ */
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateGains();
        return this.isMuted;
    }

    setMute(muted) {
        this.isMuted = muted;
        this.updateGains();
    }

    /* ============================================
       SOUND LOADING
       ============================================ */
    
    async loadSound(name, url, options = {}) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.soundBank.set(name, {
                buffer: audioBuffer,
                category: options.category || 'sfx',
                volume: options.volume || 1,
                loop: options.loop || false,
                loopStart: options.loopStart || 0,
                loopEnd: options.loopEnd || audioBuffer.duration
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to load sound "${name}":`, error);
            return false;
        }
    }

    async loadMusic(name, url, options = {}) {
        const success = await this.loadSound(name, url, {
            ...options,
            category: 'music',
            loop: true
        });
        
        if (success) {
            this.musicBank.set(name, this.soundBank.get(name));
        }
        
        return success;
    }

    /* ============================================
       SOUND PLAYBACK
       ============================================ */
    
    play(name, options = {}) {
        if (!this.isInitialized) {
            console.warn('AudioManager not initialized');
            return null;
        }
        
        const sound = this.soundBank.get(name);
        if (!sound) {
            console.warn(`Sound "${name}" not found`);
            return null;
        }
        
        // Create source
        const source = this.context.createBufferSource();
        source.buffer = sound.buffer;
        
        // Create gain node for this instance
        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(
            (options.volume || sound.volume) * (options.fadeIn ? 0 : 1),
            this.context.currentTime
        );
        
        // Connect to appropriate category
        let targetGain;
        switch (sound.category) {
            case 'music':
                targetGain = this.musicGain;
                break;
            case 'ui':
                targetGain = this.uiGain;
                break;
            case 'sfx':
            default:
                targetGain = this.sfxGain;
                break;
        }
        
        source.connect(gainNode);
        gainNode.connect(targetGain);
        
        // Handle looping
        if (options.loop !== undefined ? options.loop : sound.loop) {
            source.loop = true;
            if (sound.loopEnd > sound.loopStart) {
                source.loopStart = sound.loopStart;
                source.loopEnd = sound.loopEnd;
            }
        }
        
        // Apply pitch variation
        if (options.pitchVariation) {
            const variation = (Math.random() - 0.5) * options.pitchVariation;
            source.playbackRate.setValueAtTime(1 + variation, this.context.currentTime);
        }
        
        // Apply playback rate
        if (options.playbackRate) {
            source.playbackRate.setValueAtTime(options.playbackRate, this.context.currentTime);
        }
        
        // Start playback
        const when = options.when || this.context.currentTime;
        const offset = options.offset || 0;
        const duration = options.duration || sound.buffer.duration - offset;
        
        if (options.duration) {
            source.start(when, offset, duration);
        } else {
            source.start(when, offset);
        }
        
        // Fade in
        if (options.fadeIn) {
            gainNode.gain.linearRampToValueAtTime(
                sound.volume * (options.volume || 1),
                this.context.currentTime + options.fadeIn
            );
        }
        
        // Track active sound
        const soundInstance = {
            source,
            gainNode,
            name,
            startTime: this.context.currentTime,
            isPlaying: true
        };
        
        this.activeSounds.push(soundInstance);
        
        // Cleanup when done
        source.onended = () => {
            soundInstance.isPlaying = false;
            this.activeSounds = this.activeSounds.filter(s => s !== soundInstance);
        };
        
        return soundInstance;
    }

    stop(soundInstance, fadeOut = 0) {
        if (!soundInstance || !soundInstance.isPlaying) return;
        
        const { source, gainNode } = soundInstance;
        
        if (fadeOut > 0) {
            gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut);
            setTimeout(() => {
                try {
                    source.stop();
                } catch (e) {}
            }, fadeOut * 1000);
        } else {
            try {
                source.stop();
            } catch (e) {}
        }
        
        soundInstance.isPlaying = false;
    }

    stopAll(category = null, fadeOut = 0) {
        this.activeSounds.forEach(sound => {
            if (!category || this.soundBank.get(sound.name)?.category === category) {
                this.stop(sound, fadeOut);
            }
        });
    }

    /* ============================================
       MUSIC CONTROL
       ============================================ */
    
    playMusic(name, options = {}) {
        if (!this.isInitialized) return null;
        
        // Stop current music
        if (this.currentMusic) {
            this.stopMusic(options.crossfade || 0);
        }
        
        // Play new music
        this.currentMusic = this.play(name, {
            ...options,
            category: 'music',
            loop: true,
            fadeIn: options.crossfade || 1
        });
        
        return this.currentMusic;
    }

    stopMusic(fadeOut = 1) {
        if (this.currentMusic) {
            this.stop(this.currentMusic, fadeOut);
            this.currentMusic = null;
        }
    }

    pauseMusic() {
        if (this.currentMusic && this.context) {
            this.context.suspend();
        }
    }

    resumeMusic() {
        if (this.context) {
            this.context.resume();
        }
    }

    /* ============================================
       CONVENIENCE METHODS
       ============================================ */
    
    playSFX(name, options = {}) {
        return this.play(name, { category: 'sfx', ...options });
    }

    playUI(name, options = {}) {
        return this.play(name, { category: 'ui', ...options });
    }

    playOneShot(name, options = {}) {
        // Stop existing instance of this sound if playing
        this.activeSounds
            .filter(s => s.name === name && s.isPlaying)
            .forEach(s => this.stop(s));
        
        return this.play(name, options);
    }

    /* ============================================
       PRESET SOUNDS (Placeholder URLs)
       ============================================ */
    
    async loadPresets() {
        const presets = [
            // UI Sounds
            { name: 'ui_click', category: 'ui', volume: 0.5 },
            { name: 'ui_hover', category: 'ui', volume: 0.3 },
            { name: 'ui_back', category: 'ui', volume: 0.4 },
            { name: 'ui_error', category: 'ui', volume: 0.6 },
            
            // Combat Sounds
            { name: 'sword_swing', category: 'sfx', volume: 0.8, pitchVariation: 0.1 },
            { name: 'sword_hit', category: 'sfx', volume: 0.9, pitchVariation: 0.15 },
            { name: 'enemy_hit', category: 'sfx', volume: 0.8, pitchVariation: 0.2 },
            { name: 'enemy_die', category: 'sfx', volume: 0.9 },
            { name: 'player_hit', category: 'sfx', volume: 1 },
            { name: 'block', category: 'sfx', volume: 0.7 },
            { name: 'parry', category: 'sfx', volume: 0.9 },
            { name: 'critical', category: 'sfx', volume: 1 },
            
            // Ability Sounds
            { name: 'jump', category: 'sfx', volume: 0.6 },
            { name: 'dash', category: 'sfx', volume: 0.7 },
            { name: 'special_charge', category: 'sfx', volume: 0.8 },
            { name: 'special_release', category: 'sfx', volume: 1 },
            { name: 'magic_cast', category: 'sfx', volume: 0.7 },
            
            // Item Sounds
            { name: 'potion_use', category: 'sfx', volume: 0.6 },
            { name: 'item_pickup', category: 'sfx', volume: 0.5 },
            { name: 'chest_open', category: 'sfx', volume: 0.7 },
            { name: 'soul_collect', category: 'sfx', volume: 0.6 },
            
            // Ambient
            { name: 'footstep', category: 'sfx', volume: 0.3, pitchVariation: 0.3 },
            { name: 'wind_ambient', category: 'sfx', volume: 0.2 },
        ];
        
        // In a real game, these would load actual audio files
        // For now, we'll create placeholder entries
        presets.forEach(preset => {
            this.soundBank.set(preset.name, {
                buffer: null, // Would be actual AudioBuffer
                category: preset.category,
                volume: preset.volume,
                loop: false,
                pitchVariation: preset.pitchVariation || 0
            });
        });
    }

    /* ============================================
       PROCEDURAL AUDIO (Simple synthesizers)
       ============================================ */
    
    playTone(frequency, duration, type = 'sine', options = {}) {
        if (!this.isInitialized) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        
        // Envelope
        const attack = options.attack || 0.01;
        const decay = options.decay || 0.1;
        const sustain = options.sustain || 0.5;
        const release = options.release || 0.1;
        
        const volume = options.volume || 0.5;
        
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + attack);
        gainNode.gain.linearRampToValueAtTime(volume * sustain, this.context.currentTime + attack + decay);
        gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration + release);
    }

    playNoise(duration, options = {}) {
        if (!this.isInitialized) return;
        
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        filter.type = options.filterType || 'lowpass';
        filter.frequency.setValueAtTime(options.frequency || 1000, this.context.currentTime);
        
        gainNode.gain.setValueAtTime(options.volume || 0.5, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        source.start();
    }

    /* ============================================
       SPATIAL AUDIO (3D positioning)
       ============================================ */
    
    createSpatialSound(name, position, options = {}) {
        const sound = this.play(name, options);
        if (!sound) return null;
        
        // Create panner for 3D positioning
        const panner = this.context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 100;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        
        panner.positionX.setValueAtTime(position.x, this.context.currentTime);
        panner.positionY.setValueAtTime(position.y, this.context.currentTime);
        panner.positionZ.setValueAtTime(position.z || 0, this.context.currentTime);
        
        // Reconnect through panner
        sound.source.disconnect();
        sound.source.connect(panner);
        panner.connect(sound.gainNode);
        
        sound.panner = panner;
        return sound;
    }

    updateSpatialSound(soundInstance, position) {
        if (!soundInstance.panner) return;
        
        const now = this.context.currentTime;
        soundInstance.panner.positionX.setValueAtTime(position.x, now);
        soundInstance.panner.positionY.setValueAtTime(position.y, now);
        soundInstance.panner.positionZ.setValueAtTime(position.z || 0, now);
    }

    setListenerPosition(position, orientation = { forward: [0, 0, -1], up: [0, 1, 0] }) {
        if (!this.context) return;
        
        const listener = this.context.listener;
        
        listener.positionX.setValueAtTime(position.x, this.context.currentTime);
        listener.positionY.setValueAtTime(position.y, this.context.currentTime);
        listener.positionZ.setValueAtTime(position.z || 0, this.context.currentTime);
        
        listener.forwardX.setValueAtTime(orientation.forward[0], this.context.currentTime);
        listener.forwardY.setValueAtTime(orientation.forward[1], this.context.currentTime);
        listener.forwardZ.setValueAtTime(orientation.forward[2], this.context.currentTime);
        
        listener.upX.setValueAtTime(orientation.up[0], this.context.currentTime);
        listener.upY.setValueAtTime(orientation.up[1], this.context.currentTime);
        listener.upZ.setValueAtTime(orientation.up[2], this.context.currentTime);
    }

    /* ============================================
       STATE MANAGEMENT
       ============================================ */
    
    getState() {
        return {
            isMuted: this.isMuted,
            volumes: { ...this.volumes },
            currentMusic: this.currentMusic?.name || null,
            activeSounds: this.activeSounds.length
        };
    }

    setState(state) {
        if (state.isMuted !== undefined) {
            this.setMute(state.isMuted);
        }
        
        if (state.volumes) {
            Object.entries(state.volumes).forEach(([type, value]) => {
                this.setVolume(type, value);
            });
        }
    }
}

/* ============================================
   SOUND EFFECT PRESETS
   ============================================ */

const SFX_PRESETS = {
    // UI sounds using procedural audio
    playUIClick(audioManager) {
        audioManager.playTone(800, 0.1, 'sine', { volume: 0.3, attack: 0.001 });
    },
    
    playUIHover(audioManager) {
        audioManager.playTone(1200, 0.05, 'sine', { volume: 0.15, attack: 0.001 });
    },
    
    playUIBack(audioManager) {
        audioManager.playTone(600, 0.1, 'sine', { volume: 0.3, attack: 0.001 });
    },
    
    // Combat sounds
    playSwordSwing(audioManager) {
        const freq = 400 + Math.random() * 200;
        audioManager.playNoise(0.15, {
            filterType: 'bandpass',
            frequency: freq,
            volume: 0.4
        });
    },
    
    playHit(audioManager, isCrit = false) {
        if (isCrit) {
            audioManager.playTone(200, 0.3, 'sawtooth', { 
                volume: 0.6, 
                attack: 0.001,
                release: 0.2 
            });
        } else {
            audioManager.playNoise(0.1, {
                filterType: 'lowpass',
                frequency: 800,
                volume: 0.5
            });
        }
    },
    
    playJump(audioManager) {
        const now = audioManager.context.currentTime;
        const osc = audioManager.context.createOscillator();
        const gain = audioManager.context.createGain();
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(audioManager.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
    },
    
    playSoulCollect(audioManager) {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        notes.forEach((freq, i) => {
            setTimeout(() => {
                audioManager.playTone(freq, 0.3, 'sine', {
                    volume: 0.2,
                    attack: 0.01,
                    release: 0.1
                });
            }, i * 50);
        });
    },
    
    playLevelUp(audioManager) {
        const now = audioManager.context.currentTime;
        
        // Fanfare
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
            const osc = audioManager.context.createOscillator();
            const gain = audioManager.context.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
            
            osc.connect(gain);
            gain.connect(audioManager.sfxGain);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.5);
        });
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager, SFX_PRESETS };
}
