/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: Enemy class representing hostile entities.
 */

import { MovementStrategies } from './strategy/movement.js';
import { WeaponStrategies } from './strategy/weapon.js';
import RenderUtils from '../../../utils/renderUtils.js';
import EnemyDesign from './EnemyDesign.js';
import { GameConfig } from '../../../config.js';

export default class Enemy {
    /**
     * @param {Object} config - The configuration for this enemy instance
     * @param {number} x - Initial X
     * @param {number} y - Initial Y
     * @param {BaseScene} scene - Reference to scene for bullet spawning
     */
    constructor(config, x, y, scene) {
        this.config = config || {};
        this.x = x;
        this.y = y;
        this.scene = scene; // Needed for bullets

        // Components
        this.movementStrategy = MovementStrategies[config.movement || 'LINEAR'];
        this.weaponStrategy = WeaponStrategies[config.weapon || 'NONE'];

        // Stats (Defaults if not in config)
        this.width = (config.width || 60) * (config.scale || 1);
        this.height = (config.height || 60) * (config.scale || 1);
        this.speed = config.speed || 100; // Pixels per SECOND
        this.maxHp = config.hp || 20;
        this.hp = this.maxHp;
        this.damage = config.damage || 10;
        this.score = config.score || 10;

        // State
        this.active = true;
        this.rotation = 0; // Physics rotation
        this.angle = Math.PI / 2; // For movement math (radians, pointing down)

        // 高度层系统（与Player对应）
        this.altitude = config.altitude || 500; // 默认中空层
        this.altitudeRange = config.altitudeRange || 100; // 高度变化范围
        this.targetAltitude = this.altitude;

        // Specific Props
        this.fireRate = config.fireRate; // For weapon
        this.amplitude = config.amplitude; // For sine

        // Visuals (Image Loading)
        if (config.chassis === 'SCOUT') {
            this.img = 'images/enemy_scout.png';
        } else if (config.chassis === 'TANK') {
            this.img = 'images/enemy_tank.png';
        } else {
            this.img = 'images/enemy_fighter.png';
        }
        // In a real framework, we'd pre-load these. 
        // For renderUtils, we just pass the path or handle it there.
    }

    update(dt) {
        if (!this.active) return;

        // Update internal time for animations
        this.time = (this.time || 0) + dt;

        // 1. Delegate Movement
        if (this.movementStrategy) {
            this.movementStrategy.update(this, dt);
        }

        // 2. Delegate Weapon
        if (this.weaponStrategy) {
            this.weaponStrategy.update(this, dt);
        }

        // 3. 高度层移动（部分敌人会上下浮动）
        if (this.config.movement === 'SINE' || this.config.movement === 'HOVER') {
            // 这些敌人在高度层上下浮动
            this.altitude += Math.sin(this.time * 2) * 0.5;
            this.altitude = Math.max(100, Math.min(900, this.altitude));
        }

        const screenW = GameConfig.Screen.width;
        const screenH = (this.scene && this.scene.game && this.scene.game.logicHeight) ? this.scene.game.logicHeight : GameConfig.Screen.height;
        if (this.y > screenH + 220 || this.y < -220 || this.x < -160 || this.x > screenW + 160) {
            this.active = false; // 无论从哪个边界离开屏幕，都标记为失效
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.active = false;

        // Explosion Effect
        if (this.scene && this.scene.effectManager) {
            // Color based on chassis
            const color = this.config.color || '#ff3333';
            const count = this.config.chassis === 'TANK' ? 20 : 8;
            this.scene.effectManager.spawnParticle(this.x, this.y, color, count);

            // Screen Shake for big guys
            if (this.config.chassis === 'TANK') {
                this.scene.effectManager.shake(10, 0.2); // Intensity, Duration
            }
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        // Enemy faces DOWN by default (PI/2), so we might need to adjust based on movement angle
        ctx.rotate(this.rotation);

        // 根据高度层添加视觉效果 - 简化版：只缩放大小，保持完全不透明
        const altitudeFactor = this.altitude / 1000; // 0.1 - 0.9
        const scaleByAltitude = 1 - (altitudeFactor * 0.15); // 高空缩小至85%
        
        ctx.scale(scaleByAltitude, scaleByAltitude);
        // 始终保持完全不透明，确保可见
        ctx.globalAlpha = 1.0;

        // 高空添加阴影效果
        if (this.altitude > 600) {
            ctx.shadowColor = 'rgba(100, 100, 255, 0.3)';
            ctx.shadowBlur = 15;
        } else if (this.altitude < 300) {
            // 低空添加地面阴影
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
        }

        // 1. Procedural Render (Priority)
        if (this.config.genome) {
            EnemyDesign.render(ctx, this.config.genome, this.width, this.height, this.time || 0);
        } else {
            // Fallback to Legacy Rendering

            // 1. Thruster Glow (Behind the ship)
            this.renderEngine(ctx);

            // 2. Chassis Render
            const color = this.config.color || '#ff3333';

            switch (this.config.chassis) {
                case 'SCOUT':
                    this.renderScout(ctx, color);
                    break;
                case 'TANK':
                    this.renderTank(ctx, color);
                    break;
                case 'FIGHTER':
                default:
                    this.renderFighter(ctx, color);
                    break;
            }
        }

        // 3. HP Bar (Only if damaged or boss)
        if (this.hp < this.maxHp) {
            this.renderHpBar(ctx);
        }

        ctx.restore();
    }

    renderEngine(ctx) {
        ctx.save();
        // Pulsating effect
        const pulse = Math.sin((this.time || 0) * 10) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 100, 50, ${pulse * 0.6})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF4500';

        if (this.config.chassis === 'SCOUT') {
            // Single Engine
            ctx.beginPath();
            ctx.arc(0, -this.height / 2 + 5, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.config.chassis === 'TANK') {
            // Quad Engines
            [-20, -10, 10, 20].forEach(x => {
                ctx.beginPath(); ctx.arc(x, -this.height / 2 + 10, 3, 0, Math.PI * 2); ctx.fill();
            });
        } else {
            // Twin Engines
            ctx.beginPath(); ctx.arc(-10, -this.height / 2 + 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -this.height / 2 + 5, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    renderScout(ctx, color) {
        // "Interceptor" - Arrow shape, sharp, agile look
        const w = this.width / 2;
        const h = this.height / 2;

        // 添加发光效果让敌人更显眼
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, h); // Nose (Pointing Down)
        ctx.lineTo(w, -h); // Right Wingtip
        ctx.lineTo(0, -h + 10); // Engine Recess
        ctx.lineTo(-w, -h); // Left Wingtip
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Details
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(5, -h + 5);
        ctx.lineTo(-5, -h + 5);
        ctx.fill();

        // Cockpit - 更亮更显眼
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    renderFighter(ctx, color) {
        // "Striker" - Inverted/Swept wings, aggressive
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        // Fuselage
        ctx.moveTo(0, h); // Nose
        ctx.lineTo(10, 10);
        ctx.lineTo(w, 0); // Wing Tip
        ctx.lineTo(15, -h); // Wing Trailing Edge / Tail
        ctx.lineTo(5, -h + 5); // Engine
        ctx.lineTo(-5, -h + 5); // Engine
        ctx.lineTo(-15, -h);
        ctx.lineTo(-w, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();

        // Highlights
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.fill();
    }

    renderTank(ctx, color) {
        // "Dreadnought" - Massive, industrial, multi-segmented
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.fillStyle = color; // Base hull color

        // 1. Main Central Hull (Thick armor)
        ctx.beginPath();
        ctx.moveTo(-15, h);
        ctx.lineTo(15, h);
        ctx.lineTo(20, -h + 20);
        ctx.lineTo(-20, -h + 20);
        ctx.closePath();
        ctx.fill();

        // 2. Heavy Engine Pods (Left & Right)
        // Connected by reinforced struts
        const podWidth = 25;
        const podHeight = h * 1.6;

        // Struts
        ctx.fillStyle = '#444';
        ctx.fillRect(-w + 10, -10, w * 2 - 20, 20);

        // Pods
        ctx.fillStyle = color;
        // Left Pod
        this.drawHeavyPod(ctx, -w + podWidth / 2, 0, podWidth, podHeight);
        // Right Pod
        this.drawHeavyPod(ctx, w - podWidth / 2, 0, podWidth, podHeight);

        // 3. Command Bridge (Rear Center)
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(-10, -h + 30);
        ctx.lineTo(10, -h + 30);
        ctx.lineTo(15, -h + 10);
        ctx.lineTo(-15, -h + 10);
        ctx.fill();

        // Bridge Window/Eye
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 8;
        ctx.fillRect(-8, -h + 15, 16, 4);
        ctx.shadowBlur = 0;

        // 4. Surface Details (Vents, Armor lines)
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;

        // Center vents
        ctx.beginPath();
        ctx.moveTo(-5, 0); ctx.lineTo(-5, 40);
        ctx.moveTo(5, 0); ctx.lineTo(5, 40);
        ctx.stroke();
    }

    drawHeavyPod(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);

        // Pod Shape
        ctx.beginPath();
        ctx.moveTo(-w / 2, h / 2 - 10);
        ctx.lineTo(-w / 2 + 5, h / 2);
        ctx.lineTo(w / 2 - 5, h / 2);
        ctx.lineTo(w / 2, h / 2 - 10);
        ctx.lineTo(w / 2, -h / 2 + 10);
        ctx.lineTo(w / 2 - 5, -h / 2);
        ctx.lineTo(-w / 2 + 5, -h / 2);
        ctx.lineTo(-w / 2, -h / 2 + 10);
        ctx.closePath();
        ctx.fill();

        // Pod Details (Turbine intake look)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, h / 3, w / 3, 0, Math.PI * 2);
        ctx.fill();

        // Turbine Glow
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(0, h / 3, w / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderHpBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = -this.height / 2 - 8;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        const hpPercent = this.hp / this.maxHp;
        // Color changes based on HP
        ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : (hpPercent > 0.2 ? '#ffff00' : '#ff0000');
        ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
}
