/**
 * 母舰图片资源管理
 * 使用真实图片替代代码绘制，效果更好
 * 
 * 推荐免费素材来源：
 * 1. OpenGameArt - https://opengameart.org/content/mother-ship-with-fighter
 * 2. OpenGameArt - https://opengameart.org/content/ufo-sprites
 * 3. itch.io - 搜索 "spaceship sprite"
 * 
 * 请将下载的母舰图片命名为：mothership.png
 * 放到 images/ 文件夹中
 */

import { GameConfig } from '../config.js';

export default class Mothership {
    constructor(scene) {
        this.scene = scene;
        this.width = 200;
        this.height = 150;

        // 位置：屏幕底部中央
        this.x = GameConfig.Screen.width / 2;
        this.y = scene.game.logicHeight - 80;

        // 状态
        this.maxHp = 500;
        this.hp = this.maxHp;
        this.isAlive = true;

        // 跃迁充能系统
        this.jumpCharge = 0;
        this.maxJumpCharge = 100;
        this.chargeRate = 0.5;
        this.isJumpReady = false;

        // 视觉效果
        this.shieldPulse = 0;
        this.damageFlash = 0;
        this.engineGlow = 0;
        this.isInDanger = false;
        this.dangerTimer = 0;

        // 图片资源
        this.image = null;
        this.imageLoaded = false;
        
        // 加载图片
        this.loadImage();
    }

    /**
     * 加载母舰图片
     * 图片路径：images/mothership.png
     */
    loadImage() {
        this.image = new Image();
        this.image.onload = () => {
            this.imageLoaded = true;
            console.log('Mothership image loaded successfully');
            
            // 根据图片调整尺寸（保持宽高比）
            const aspectRatio = this.image.width / this.image.height;
            this.width = 240; // 固定宽度
            this.height = this.width / aspectRatio;
        };
        
        this.image.onerror = () => {
            console.error('Failed to load mothership image, using fallback rendering');
            this.imageLoaded = false;
        };
        
        // 图片路径 - 请确保 images/mothership.png 存在
        this.image.src = 'images/mothership.png';
    }

    update(dt) {
        if (!this.isAlive) return;

        // 自动充能
        if (!this.isJumpReady) {
            this.jumpCharge += this.chargeRate * dt;
            if (this.jumpCharge >= this.maxJumpCharge) {
                this.jumpCharge = this.maxJumpCharge;
                this.isJumpReady = true;
            }
        }

        // 视觉效果计时
        this.shieldPulse += dt * 2;
        if (this.damageFlash > 0) {
            this.damageFlash -= dt;
        }
        if (this.dangerTimer > 0) {
            this.dangerTimer -= dt;
            this.isInDanger = this.dangerTimer > 0;
        }

        this.engineGlow = 0.7 + Math.sin(this.shieldPulse) * 0.3;
    }

    takeDamage(damage) {
        if (!this.isAlive) return;

        this.hp -= damage;
        this.damageFlash = 0.3;
        this.dangerTimer = 2.0;

        // 触发强烈反馈
        if (this.scene.effectManager) {
            this.scene.effectManager.shake(10, 0.3);
            this.scene.effectManager.spawnFloatingText(
                '母舰受击!',
                this.x,
                this.y - this.height / 2 - 20,
                '#ff0000',
                40
            );
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
            this.onDestroyed();
        }
    }

    onDestroyed() {
        console.log('MOTHERSHIP DESTROYED - GAME OVER');

        if (this.scene.effectManager) {
            this.scene.effectManager.spawnExplosion(this.x, this.y, 'boss');
            this.scene.effectManager.shake(30, 1.0);
        }

        setTimeout(() => {
            this.scene.endGame(false);
        }, 2000);
    }

    isValidTarget() {
        return this.isAlive;
    }

    render(ctx) {
        if (!this.isAlive) return;

        ctx.save();

        // 受击闪光效果
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.3 + Math.sin(this.damageFlash * 20) * 0.3;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, GameConfig.Screen.width, this.scene.game.logicHeight);
            ctx.globalAlpha = 1.0;
        }

        // 危险状态红边框
        if (this.isInDanger) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(this.shieldPulse * 3) * 0.5})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, GameConfig.Screen.width - 20, this.scene.game.logicHeight - 20);
        }

        // 跃迁就绪特效
        if (this.isJumpReady) {
            // 绘制能量波纹
            for (let i = 3; i >= 0; i--) {
                const radius = this.width / 2 + i * 30 + 20;
                const alpha = 0.15 - i * 0.03;
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha + Math.sin(this.shieldPulse * 3) * 0.05})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // 绘制母舰图片
        if (this.imageLoaded && this.image) {
            // 计算绘制位置和尺寸（居中）
            const drawX = this.x - this.width / 2;
            const drawY = this.y - this.height / 2;
            
            // 绘制图片
            ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
            
            // 护盾覆盖层
            if (!this.isJumpReady) {
                const shieldAlpha = 0.1 + Math.sin(this.shieldPulse) * 0.05;
                ctx.fillStyle = `rgba(100, 200, 255, ${shieldAlpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 2 + 10, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // 备用：简单几何图形（图片加载失败时显示）
            this.renderFallback(ctx);
        }

        ctx.restore();

        // 绘制状态条（在图片下方）
        this.renderStatusBars(ctx);
    }

    /**
     * 备用渲染（图片加载失败时使用）
     */
    renderFallback(ctx) {
        ctx.translate(this.x, this.y);
        
        const w = this.width / 2;
        const h = this.height / 2;
        
        // 简单的母舰轮廓
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(w * 0.8, h * 0.3);
        ctx.lineTo(w * 0.5, h);
        ctx.lineTo(0, h * 0.8);
        ctx.lineTo(-w * 0.5, h);
        ctx.lineTo(-w * 0.8, h * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#63b3ed';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 中央核心
        ctx.fillStyle = this.isJumpReady ? '#00ffff' : '#4299e1';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.isJumpReady ? '#00ffff' : '#4299e1';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.translate(-this.x, -this.y);
    }

    renderStatusBars(ctx) {
        const barWidth = 220;
        const barHeight = 14;
        const x = this.x - barWidth / 2;
        const y = this.y + this.height / 2 + 15;

        // 血条背景
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // 血条
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? '#48bb78' : (hpPercent > 0.25 ? '#ecc94b' : '#f56565');
        ctx.fillStyle = hpColor;
        ctx.fillRect(x + 1, y + 1, (barWidth - 2) * hpPercent, barHeight - 2);

        // 血条文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`母舰护盾 ${Math.floor(this.hp)}/${this.maxHp}`, this.x, y + 11);

        // 跃迁充能条
        const jumpY = y + barHeight + 6;
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(x, jumpY, barWidth, barHeight);
        ctx.strokeRect(x, jumpY, barWidth, barHeight);

        // 跃迁进度
        const jumpPercent = this.jumpCharge / this.maxJumpCharge;
        if (this.isJumpReady) {
            const pulse = 0.7 + Math.sin(this.shieldPulse * 4) * 0.3;
            ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        } else {
            ctx.fillStyle = '#4299e1';
        }
        ctx.fillRect(x + 1, jumpY + 1, (barWidth - 2) * jumpPercent, barHeight - 2);

        // 跃迁文字
        ctx.fillStyle = this.isJumpReady ? '#00ffff' : '#a0aec0';
        ctx.font = 'bold 11px Arial';
        if (this.isJumpReady) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.fillText('⚡ 跃迁引擎就绪! ⚡', this.x, jumpY + 11);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillText(`跃迁充能 ${Math.floor(jumpPercent * 100)}%`, this.x, jumpY + 11);
        }
    }
}
