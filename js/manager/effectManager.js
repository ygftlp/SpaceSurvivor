import { GameConfig } from '../config.js';

export default class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.floatingTexts = [];
        this.trails = []; // Bullet trails

        // Screen Shake
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        // Hit Stop (Juice effect)
        this.hitStopTimer = 0;
        this.hitStopDuration = 0;

        // Combo System
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeWindow = 3.0; // seconds to maintain combo
    }

    update(dt) {
        // Handle Hit Stop
        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            return true; // Signal to skip frame update
        }

        // Update Combo Timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Update Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const decay = this.shakeTimer / 1.0;
            const currentIntensity = this.shakeIntensity * decay;

            this.shakeX = (Math.random() - 0.5) * 2 * currentIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * currentIntensity;

            if (this.shakeTimer <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.vr * dt;

            // Friction for sparks
            if (p.type === 'spark') {
                p.vx *= 0.95;
                p.vy *= 0.95;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            ft.y -= ft.vy * dt;

            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        return false; // Normal update
    }

    render(ctx) {
        // Render Particles
        ctx.save();
        // Additive blending for explosions looks cool
        ctx.globalCompositeOperation = 'lighter';

        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;

            if (p.type === 'shockwave') {
                // Expanding ring
                const progress = 1 - (p.life / p.maxLife);
                const currentSize = p.maxSize * progress;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                if (p.type === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                } else if (p.type === 'spark') {
                    // Long thin spark
                    ctx.fillRect(-1, -p.size * 2, 2, p.size * 4);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.rotate(-p.rotation);
                ctx.translate(-p.x, -p.y);
            }
        });

        ctx.restore();

        // Render Floating Texts
        this.floatingTexts.forEach(ft => {
            ctx.save();
            const alpha = Math.min(1, ft.life * 2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px Arial`;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 2;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);

            // Crit effect?
            if (ft.isCrit) {
                // Flash or scale?
            }
            ctx.restore();
        });
    }

    // --- API ---

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    hitStop(duration = 0.02) {
        this.hitStopTimer = duration;
        this.hitStopDuration = duration;
    }

    addCombo() {
        this.comboCount++;
        this.comboTimer = this.comboTimeWindow;
        
        // Show combo text at milestones
        if (this.comboCount > 0 && this.comboCount % 10 === 0) {
            this.spawnFloatingText(
                `${this.comboCount} 连击!`, 
                GameConfig.Screen.width / 2, 
                150, 
                '#ffcc00', 
                35
            );
            this.shake(3, 0.2);
        }
    }

    spawnExplosion(x, y, size = 'medium') {
        const configs = {
            small: { count: 8, colors: ['#ff6600', '#ff9900'], size: 3 },
            medium: { count: 15, colors: ['#ff3300', '#ff6600', '#ffcc00'], size: 5 },
            large: { count: 25, colors: ['#ff0000', '#ff3300', '#ff6600', '#ffffff'], size: 8 },
            boss: { count: 40, colors: ['#ff0000', '#ff00ff', '#ffcc00', '#ffffff'], size: 10 }
        };
        
        const config = configs[size] || configs.medium;
        
        // Explosion particles
        for (let i = 0; i < config.count; i++) {
            const angle = (Math.PI * 2 / config.count) * i + Math.random() * 0.5;
            const speed = 100 + Math.random() * 200;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 20,
                life: 0.4 + Math.random() * 0.4,
                maxLife: 0.8,
                size: config.size * (0.5 + Math.random()),
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                rotation: Math.random() * Math.PI * 2,
                type: 'circle'
            });
        }
        
        // Add sparks
        for (let i = 0; i < config.count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 300;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: 0,
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                size: 2,
                color: '#ffffff',
                rotation: 0,
                type: 'spark'
            });
        }
        
        // Shockwave ring
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.3,
            maxLife: 0.3,
            size: 1,
            color: '#ffffff',
            rotation: 0,
            type: 'shockwave',
            maxSize: config.size * 10
        });
    }

    spawnParticle(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                vr: (Math.random() - 0.5) * 10,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                size: 2 + Math.random() * 6,
                color: color,
                rotation: Math.random() * Math.PI * 2,
                type: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }
    }

    spawnDamageText(x, y, damage, isCrit = false) {
        const size = isCrit ? 40 : 25;
        const color = isCrit ? '#ff0000' : '#ffffff';
        const text = isCrit ? `${damage}!` : `${damage}`;

        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            size: size,
            vy: 60,
            life: 0.8,
            isCrit: isCrit
        });
    }

    spawnFloatingText(text, x, y, color = '#fff', size = 30, duration = 1.5) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            size: size,
            vy: 50,
            life: duration,
            isCrit: false
        });
    }

    spawnHitImpact(x, y, color = '#ff6600') {
        // Bright flash at impact point
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.1,
            maxLife: 0.1,
            size: 15,
            color: '#ffffff',
            rotation: 0,
            type: 'circle'
        });

        // 6-8 sparks flying outward
        const sparkCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.3;
            const speed = 150 + Math.random() * 200;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 15,
                life: 0.2 + Math.random() * 0.2,
                maxLife: 0.4,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.5 ? color : '#ffcc00',
                rotation: angle,
                type: 'spark'
            });
        }

        // Small shockwave ring
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.2,
            maxLife: 0.2,
            size: 1,
            color: color,
            rotation: 0,
            type: 'shockwave',
            maxSize: 25
        });
    }

    spawnShockwave(x, y, color = '#ffffff', maxSize = 50) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.5,
            maxLife: 0.5,
            size: 1,
            color: color,
            rotation: 0,
            type: 'shockwave',
            maxSize: maxSize
        });
    }

    spawnLevelUpAura(x, y) {
        // Bright flash
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.3,
            maxLife: 0.3,
            size: 30,
            color: '#ffffff',
            rotation: 0,
            type: 'circle'
        });

        // Expanding golden rings
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                vr: 0,
                life: 0.6 + i * 0.15,
                maxLife: 0.6 + i * 0.15,
                size: 1,
                color: '#ffcc00',
                rotation: 0,
                type: 'shockwave',
                maxSize: 60 + i * 30
            });
        }

        // Rising light particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 80 + Math.random() * 120;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 50,
                vr: (Math.random() - 0.5) * 10,
                life: 0.5 + Math.random() * 0.4,
                maxLife: 0.9,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.3 ? '#ffcc00' : '#ffffff',
                rotation: Math.random() * Math.PI * 2,
                type: 'circle'
            });
        }

        // Floating text for level up
        this.spawnFloatingText('升级!', x, y - 30, '#ffcc00', 28, 1.2);
    }

    spawnEnergyWarning(x, y) {
        // Red pulsing circle
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.5,
            maxLife: 0.5,
            size: 25,
            color: '#ff0000',
            rotation: 0,
            type: 'circle'
        });

        // Shockwave ring
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            vr: 0,
            life: 0.4,
            maxLife: 0.4,
            size: 1,
            color: '#ff0000',
            rotation: 0,
            type: 'shockwave',
            maxSize: 40
        });

        // Red warning particles
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const speed = 100 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 20,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: 2 + Math.random() * 3,
                color: '#ff0000',
                rotation: Math.random() * Math.PI * 2,
                type: 'rect'
            });
        }

        // Floating text: "能量耗尽"
        this.spawnFloatingText('能量耗尽', x, y - 20, '#ff0000', 24, 1.0);

        // Screen flash effect (via shake with minimal movement)
        this.shake(2, 0.15);
    }

    spawnAltitudeChange(x, y, direction) {
        const isUp = direction === 'up';
        const color = isUp ? '#00ff00' : '#0088ff';
        const arrowSymbol = isUp ? '↑' : '↓';

        // Direction indicator arrows
        for (let i = 0; i < 3; i++) {
            this.spawnFloatingText(
                arrowSymbol,
                x + (i - 1) * 25,
                y + (isUp ? -20 : 20) + (isUp ? -i * 15 : i * 15),
                color,
                32,
                0.6
            );
        }

        // Speed lines effect
        const lineCount = 8;
        for (let i = 0; i < lineCount; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            const startY = isUp ? y + 40 : y - 40;
            const endY = isUp ? y - 60 : y + 60;
            
            this.particles.push({
                x: x + offsetX,
                y: startY,
                vx: (Math.random() - 0.5) * 50,
                vy: isUp ? -200 - Math.random() * 100 : 200 + Math.random() * 100,
                vr: 0,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: 1,
                color: color,
                rotation: 0,
                type: 'spark'
            });
        }

        // Light trail particles
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed * 0.3,
                vy: isUp ? -speed * 0.8 : speed * 0.8,
                vr: (Math.random() - 0.5) * 5,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? color : '#ffffff',
                rotation: Math.random() * Math.PI * 2,
                type: 'circle'
            });
        }
    }

    renderComboUI(ctx) {
        if (this.comboCount > 0) {
            ctx.save();
            const alpha = Math.min(1, this.comboTimer / 0.5);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            
            // 与金币/分数对齐（使用相同的参考系）
            const safeTop = GameConfig.SafeArea.top || 20;
            const capsuleH = GameConfig.SafeArea.height || 64;
            const hudY = safeTop + capsuleH + 30;
            const leftX = GameConfig.SafeArea.left || 10;
            
            // 连击UI在分数下方（保持35px间距）
            const comboY = hudY + 70; // 金币(hudY) + 分数(35) + 间距(35)
            
            ctx.fillText(`${this.comboCount} 连击`, leftX, comboY);
            
            // Combo bar
            const barWidth = 80;
            const barHeight = 4;
            const progress = this.comboTimer / this.comboTimeWindow;
            ctx.fillStyle = '#333';
            ctx.fillRect(leftX, comboY + 10, barWidth, barHeight);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(leftX, comboY + 10, barWidth * progress, barHeight);
            
            ctx.restore();
        }
    }
}
