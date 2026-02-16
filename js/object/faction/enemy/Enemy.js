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
        this.hasEnteredView = false;
        this.fireEnableDelay = 0.45 + Math.random() * 0.35;
        this.spawnGraceDuration = Number.isFinite(config.spawnGraceDuration) ? config.spawnGraceDuration : 0.9;
        this.spawnGraceTimer = this.spawnGraceDuration;
        this.lifeTime = 0;

        // 楂樺害灞傜郴缁燂紙涓嶱layer瀵瑰簲锛?
        this.altitude = config.altitude || 500; // 榛樿涓┖灞?
        this.altitudeRange = config.altitudeRange || 100; // 楂樺害鍙樺寲鑼冨洿
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
        this.lifeTime += dt;
        if (this.spawnGraceTimer > 0) {
            this.spawnGraceTimer = Math.max(0, this.spawnGraceTimer - dt);
        }

        // 1. Delegate Movement
        if (this.movementStrategy) {
            this.movementStrategy.update(this, dt);
        }

        // 2. Delegate Weapon
        if (this.weaponStrategy) {
            this.weaponStrategy.update(this, dt);
        }

        // 3. 楂樺害灞傜Щ鍔紙閮ㄥ垎鏁屼汉浼氫笂涓嬫诞鍔級
        if (this.config.movement === 'SINE' || this.config.movement === 'HOVER') {
            // 杩欎簺鏁屼汉鍦ㄩ珮搴﹀眰涓婁笅娴姩
            this.altitude += Math.sin(this.time * 2) * 0.5;
            this.altitude = Math.max(100, Math.min(900, this.altitude));
        }

        const screenW = GameConfig.Screen.width;
        const screenH = (this.scene && this.scene.sceneManager && this.scene.sceneManager.game && this.scene.sceneManager.game.logicHeight)
            ? this.scene.sceneManager.game.logicHeight
            : GameConfig.Screen.height;
        const inVisibleBounds = (
            this.x > -this.width &&
            this.x < screenW + this.width &&
            this.y > -this.height &&
            this.y < screenH + this.height
        );
        if (inVisibleBounds) {
            this.hasEnteredView = true;
        }

        // Defensive guard: avoid NaN/Infinity instantly culling enemies.
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
            this.x = Number.isFinite(this.x) ? this.x : GameConfig.Screen.width * 0.5;
            this.y = Number.isFinite(this.y) ? this.y : 200;
        }

        const minLifetimeForCull = Math.max(1.2, this.spawnGraceDuration + 0.2);
        if (this.lifeTime < minLifetimeForCull) {
            return;
        }
        if (this.y > screenH + 220 || this.y < -220 || this.x < -160 || this.x > screenW + 160) {
            this.active = false; // 鏃犺浠庡摢涓竟鐣岀寮€灞忓箷锛岄兘鏍囪涓哄け鏁?
        }
    }

    takeDamage(amount) {
        // Spawn protection: prevents "spawn then instantly disappear".
        if ((this.spawnGraceTimer || 0) > 0) {
            return;
        }
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

        // 鏍规嵁楂樺害灞傛坊鍔犺瑙夋晥鏋?- 绠€鍖栫増锛氬彧缂╂斁澶у皬锛屼繚鎸佸畬鍏ㄤ笉閫忔槑
        const altitudeFactor = this.altitude / 1000; // 0.1 - 0.9
        const scaleByAltitude = Math.max(1.05, 1 - (altitudeFactor * 0.12));
        
        ctx.scale(scaleByAltitude, scaleByAltitude);
        // 濮嬬粓淇濇寔瀹屽叏涓嶉€忔槑锛岀‘淇濆彲瑙?
        const spawnProgress = this.spawnGraceDuration > 0
            ? (1 - (this.spawnGraceTimer / this.spawnGraceDuration))
            : 1;
        ctx.globalAlpha = Math.max(0.35, Math.min(1, spawnProgress * 1.25));

        // 楂樼┖娣诲姞闃村奖鏁堟灉
        if (this.altitude > 600) {
            ctx.shadowColor = 'rgba(100, 100, 255, 0.3)';
            ctx.shadowBlur = 15;
        } else if (this.altitude < 300) {
            // 浣庣┖娣诲姞鍦伴潰闃村奖
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

        this.renderThreatOutline(ctx);

        ctx.restore();
    }

    renderThreatOutline(ctx) {
        const pulse = 0.4 + Math.sin((this.time || 0) * 6) * 0.2;
        const color = this.config.color || '#ff6666';

        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${0.16 + pulse * 0.18})`;
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.22);
        ctx.lineTo(this.width * 0.22, 0);
        ctx.lineTo(0, this.height * 0.22);
        ctx.lineTo(-this.width * 0.22, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(255,255,255,${0.38 + pulse * 0.2})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.38, this.height * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.3, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
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

        // 娣诲姞鍙戝厜鏁堟灉璁╂晫浜烘洿鏄剧溂
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

        // Cockpit - 鏇翠寒鏇存樉鐪?
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

