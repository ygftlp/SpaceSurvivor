/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: Main Game Entry Class
 */

import { GameConfig } from './config.js';
import SceneManager from './scene/sceneManager.js';

export default class Main {
    constructor() {
        this.canvas = wx.createCanvas();
        this.ctx = this.canvas.getContext('2d');

        // Adaptation
        this.scaleRatio = 1;
        this.logicHeight = 1280;

        // Managers
        this.sceneManager = new SceneManager(this);

        this.lastFrameTime = Date.now();
        this.frame = 0;
        this.debugToggleCooldownUntil = 0;

        this.init();
        this.initInput();

        // Start Game Loop
        this.loop();
    }

    init() {
        // Adaptation Logic
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        const designWidth = GameConfig.Screen.width;

        this.scaleRatio = screenWidth / designWidth;
        this.ctx.scale(this.scaleRatio, this.scaleRatio);
        this.logicHeight = screenHeight / this.scaleRatio;

        console.log(`Main: Init. LogicHeight=${this.logicHeight}`);

        // Initialize Config
        GameConfig.init();

        // Enter Splash Scene
        this.sceneManager.switchScene('SPLASH');
    }

    initInput() {
        wx.onTouchStart((res) => {
            const now = Date.now();
            if (res.touches && res.touches.length >= 3 && now >= this.debugToggleCooldownUntil) {
                this.debugToggleCooldownUntil = now + 600;
                GameConfig.Debug.hitboxOverlay = !GameConfig.Debug.hitboxOverlay;
                this.notifyDebugToggle(GameConfig.Debug.hitboxOverlay);
                return;
            }

            const touch = res.touches[0];
            const x = touch.clientX / this.scaleRatio;
            const y = touch.clientY / this.scaleRatio;
            this.sceneManager.handleInput('touchstart', x, y);
        });

        wx.onTouchMove((res) => {
            const touch = res.touches[0];
            const x = touch.clientX / this.scaleRatio;
            const y = touch.clientY / this.scaleRatio;
            this.sceneManager.handleInput('touchmove', x, y);
        });

        wx.onTouchEnd((res) => {
            const touch = res.changedTouches[0];
            if (touch) {
                const x = touch.clientX / this.scaleRatio;
                const y = touch.clientY / this.scaleRatio;
                this.sceneManager.handleInput('touchend', x, y);
            }
        });
    }

    update(dt) {
        // Check for hit stop effect in battle scene
        const currentScene = this.sceneManager.currentScene;
        if (currentScene && currentScene.effectManager) {
            const hitStop = currentScene.effectManager.update(dt);
            if (hitStop) {
                // Skip update but still render for hit stop effect
                return;
            }
        }
        
        this.sceneManager.update(dt);
    }

    render() {
        // Global Clear
        this.ctx.clearRect(0, 0, GameConfig.Screen.width, this.logicHeight);

        this.sceneManager.render(this.ctx);
    }

    loop() {
        // Calculate Delta Time
        const now = Date.now();
        const dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.frame++;

        this.update(dt);
        this.render();

        window.requestAnimationFrame(this.loop.bind(this), this.canvas);
    }

    notifyDebugToggle(enabled) {
        const currentScene = this.sceneManager.currentScene;
        const msg = enabled ? 'DEBUG HITBOX: ON' : 'DEBUG HITBOX: OFF';
        if (currentScene && typeof currentScene.spawnFloatingText === 'function') {
            currentScene.spawnFloatingText(msg, GameConfig.Screen.width / 2, 180, enabled ? '#00ff99' : '#ff7675', 24);
        } else {
            console.log(msg);
        }
    }
}
