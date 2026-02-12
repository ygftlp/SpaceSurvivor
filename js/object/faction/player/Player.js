/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: Player class handling movement and shooting.
 */

import Bullet from '../../bullet.js';
import { dataManager } from '../../../manager/dataManager.js';
import { GameConfig } from '../../../config.js';
import FighterFactory from './fighter/FighterFactory.js';

export default class Player {
    constructor(arg_x, arg_y, screenHeight) {
        this.x = arg_x || 360; // Center of 720 width
        this.y = arg_y || 1000;
        this.width = 60;
        this.height = 60;
        this.screenHeight = screenHeight || 1280; // Default if not passed

        // Load Fighter Instance
        const fighterId = dataManager.data.currentFighter || 'J-20';
        this.fighter = FighterFactory.createFighter(fighterId);
        this.fighterId = fighterId;

        // Stats from Instance
        this.hp = this.fighter.hp;
        this.maxHp = this.fighter.hp;
        this.speed = this.fighter.speed * 40;

        // Sprite not needed, delegate to this.fighter.render()

        // Shooting State
        this.isShooting = true;
        this.lastShootTime = 0;

        // Weapon Stats (Load from DataManager)
        this.baseStats = null; // Store base from DataManager
        this.effectiveStats = {}; // Actual stats used for shooting
        this.refreshStats();

        // ========== 三维高度层系统 (3D Altitude System) - 已移除 ==========
        // 为了简化操作，移除了手动高度控制，改为自动高度适应
        this.altitude = 500; // 固定为中空

        this.maxEnergy = 100;
        this.energy = 100;
        this.energyRegenRate = 12;
        this.energyCostPerShot = 1;
        this.overheatDuration = 1500;
        this.canShootWhileOverheated = false;
        this.overheatedUntil = 0;
        this.invulnerableUntil = 0;

    }

    // 当装备变更时调用此方法刷新属性
    refreshStats() {
        this.baseStats = dataManager.getCurrentWeaponStats();
        // Recalculate effective stats (Base + Buffs)
        // For now, reset to base, buffs are runtime only
        this.effectiveStats = { ...this.baseStats };
        this.shootInterval = this.effectiveStats.interval;
    }

    // 应用战斗内 Buff
    applyBuff(type) {
        if (type === 'firepower') {
            this.effectiveStats.damage = Math.ceil(this.effectiveStats.damage * 1.2); // +20%
            console.log('Buff Applied: Firepower', this.effectiveStats.damage);
        } else if (type === 'barrage') {
            this.effectiveStats.count += 1; // +1 Bullet
            if (this.effectiveStats.count > 1 && this.effectiveStats.spread === 0) {
                this.effectiveStats.spread = 15; // Enable spread if single
            }
            console.log('Buff Applied: Barrage', this.effectiveStats.count);
        } else if (type === 'speed') {
            // Attack Speed
            this.effectiveStats.interval = Math.max(100, this.effectiveStats.interval * 0.9);
            this.shootInterval = this.effectiveStats.interval;
        } else if (type === 'move_speed') {
            // Movement Speed
            this.speed = Math.ceil(this.speed * 1.2);
            console.log('Buff Applied: Move Speed', this.speed);
        }
    }

    healPercent(percent) {
        const maxHp = this.maxHp;
        const amount = Math.floor(maxHp * percent);
        this.hp = Math.min(this.hp + amount, maxHp);
        console.log(`Healed ${amount} HP. Current: ${this.hp}/${maxHp}`);
    }

    update(deltaTime) {
        let newBullets = [];
        const now = Date.now();
        const dtSeconds = Math.max(0, deltaTime);
        
        // ========== 高度系统更新 (已移除) ==========
        // 保持高度固定
        
        // 更新实际速度 (无高度惩罚)
        const actualSpeed = this.speed;
        
        // ========== 更新战机状态（特技冷却等） ==========
        if (this.fighter && this.fighter.update) {
            this.fighter.update(deltaTime);
        }
        
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dtSeconds);

        const isOverheated = now < this.overheatedUntil;

        // ========== 自动射击 ==========
        if (this.isShooting) {
            if (now - this.lastShootTime > this.shootInterval) {
                if (isOverheated && !this.canShootWhileOverheated) {
                    return newBullets;
                }
                const bullets = this.shoot();
                if (bullets.length > 0) {
                    newBullets.push(...bullets);
                    this.lastShootTime = now;
                }
            }
        }
        
        return newBullets;
    }

    shoot() {
        if (this.energy < this.energyCostPerShot) {
            this.energy = 0;
            this.overheatedUntil = Date.now() + this.overheatDuration;
            return [];
        }
        this.energy -= this.energyCostPerShot;

        const bullets = [];
        const stats = this.effectiveStats; // Use effective stats
        const startX = this.x;
        const startY = this.y - this.height / 2;
        const bounds = {
            minX: -100,
            maxX: GameConfig.Screen.width + 100,
            minY: -100,
            maxY: (this.screenHeight || 1280) + 100
        };
        const bulletConfig = { bounds };

        // 根据 count (弹道数量) 计算子弹
        // 简单实现：如果是 1 发，居中；多发则根据 spread 扇形分布
        if (stats.count === 1) {
            bullets.push(new Bullet(startX, startY, -90, stats.speed, stats.damage, false, bulletConfig));
        } else {
            // 多发逻辑 (例如 count=3, spread=15 -> -105, -90, -75)
            const mid = (stats.count - 1) / 2;
            for (let i = 0; i < stats.count; i++) {
                const angleOffset = (i - mid) * stats.spread;
                const angle = -90 + angleOffset;
                bullets.push(new Bullet(startX, startY, angle, stats.speed, stats.damage, false, bulletConfig));
            }
        }

        return bullets;
    }
    
    takeDamage(amount) {
        const now = Date.now();
        if (now < this.invulnerableUntil) return false;
        if (!Number.isFinite(amount) || amount <= 0) return false;
        this.hp -= amount;
        this.invulnerableUntil = now + 700;
        return true;
    }

    overchargeEnergy(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
        if (this.energy > 0) {
            this.overheatedUntil = 0;
        }
    }


    render(ctx) {
        ctx.save();

        // Translate to Player Position
        ctx.translate(this.x, this.y);
        if (Date.now() < this.invulnerableUntil) {
            const blink = Math.floor(Date.now() / 80) % 2 === 0;
            ctx.globalAlpha = blink ? 0.5 : 0.9;
        }

        // Delegate rendering to the Fighter Instance
        // It renders around 0,0 locally
        this.fighter.render(ctx, this.width);

        // Engine flame (Common effect)
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(-5, this.height / 2 + 25);
        ctx.lineTo(5, this.height / 2 + 25);
        ctx.lineTo(0, this.height / 2 + 45 + Math.random() * 10);
        ctx.fill();

        ctx.restore();
    }

    renderShapeFallback(ctx) {
        // Deprecated
        // Simple Visual Differentiation based on ID (until AssetLoader is ready)
        // In a real game, we would use: ctx.drawImage(this.image, ...);

        if (this.fighterId === 'J-20') {
            // 威龙 (Silver/Blue)
            ctx.fillStyle = '#dfe6e9'; // Silver
            this.drawJetShape(ctx);
            // Wings
            ctx.fillStyle = '#74b9ff';
            ctx.beginPath();
            ctx.moveTo(0, -30); ctx.lineTo(30, 20); ctx.lineTo(10, 30); ctx.lineTo(0, 20); ctx.lineTo(-10, 30); ctx.lineTo(-30, 20);
            ctx.fill();

        } else if (this.fighterId === 'F-22') {
            // 猛禽 (Dark Grey)
            ctx.fillStyle = '#2d3436'; // Dark Grey
            this.drawJetShape(ctx);
            // Diamond Wings
            ctx.fillStyle = '#636e72';
            ctx.beginPath();
            ctx.moveTo(0, -30); ctx.lineTo(35, 10); ctx.lineTo(15, 30); ctx.lineTo(-15, 30); ctx.lineTo(-35, 10);
            ctx.fill();

        } else if (this.fighterId === 'Su-57') {
            // 幽灵 (Camo Green)
            ctx.fillStyle = '#55efc4'; // Greenish
            this.drawJetShape(ctx);
            // Flattened
            ctx.fillStyle = '#00b894';
            ctx.beginPath();
            ctx.moveTo(0, -35); ctx.lineTo(25, 15); ctx.lineTo(25, 35); ctx.lineTo(-25, 35); ctx.lineTo(-25, 15);
            ctx.fill();
        } else {
            // Fallback
            ctx.fillStyle = '#00ccff';
            this.drawJetShape(ctx);
        }
        ctx.lineTo(5, this.height / 2 - 5);
        ctx.lineTo(0, this.height / 2 + 15 + Math.random() * 5);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 渲染UI (已移除高度条)
     */
    renderUI(ctx, screenWidth, screenHeight) {
        // 高度条已移除
    }

    /**
     * 渲染战机特技按钮（A按钮）
     * 位置：右下角，与操作杆（左下）不重叠
     */
    renderAbilityButton(ctx, screenWidth, screenHeight) {
        const btnX = 80;  // 左下角
        const btnY = screenHeight - 180;  // 在高度按钮上方
        const btnRadius = 25;  // 50x50 大小
        
        // 获取战机特技状态
        let ability = null;
        let abilityName = '';
        let btnColor = '#00ccff';
        let icon = 'A';
        
        if (this.fighterId === 'J-20') {
            ability = this.fighter.stealth;
            abilityName = '隐身';
            btnColor = '#00ffff'; // 青色
            icon = '隐';
        } else if (this.fighterId === 'F-22') {
            ability = this.fighter.dash;
            abilityName = '冲刺';
            btnColor = '#ff6600'; // 橙色
            icon = '冲';
        } else if (this.fighterId === 'Su-57') {
            ability = this.fighter.shield;
            abilityName = '护盾';
            btnColor = '#9900ff'; // 紫色
            icon = '盾';
        }
        
        if (!ability) return;
        
        // 计算按钮状态
        const isReady = ability.ready;
        const isActive = ability.active || false;
        
        // 保存按钮位置供点击检测
        this.abilityBtn = {
            x: btnX,
            y: btnY,
            radius: btnRadius,
            abilityName: abilityName
        };
        
        ctx.save();
        
        // 按钮背景
        ctx.beginPath();
        ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
        
        if (isActive) {
            // 技能激活中 - 闪烁效果
            const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
            ctx.shadowBlur = 30;
            ctx.shadowColor = btnColor;
        } else if (isReady) {
            // 就绪状态
            ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = btnColor;
        } else {
            // 冷却中
            ctx.fillStyle = 'rgba(50, 50, 60, 0.7)';
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 按钮边框
        ctx.strokeStyle = isReady ? btnColor : '#666';
        ctx.lineWidth = isReady ? 3 : 2;
        ctx.stroke();
        
        // 图标文字
        ctx.fillStyle = isReady ? btnColor : '#888';
        ctx.font = `bold ${isActive ? 26 : 22}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isActive) {
            // 显示剩余时间
            const remaining = Math.ceil(ability.duration || 0);
            ctx.fillText(remaining.toString(), btnX, btnY);
        } else if (!isReady) {
            // 显示冷却时间
            const cooldown = Math.ceil(ability.cooldown || 0);
            ctx.font = 'bold 18px Arial';
            ctx.fillText(cooldown.toString(), btnX, btnY);
        } else {
            // 显示图标
            ctx.fillText(icon, btnX, btnY);
        }
        
        // 底部技能名称 - 增大字体并添加阴影
        ctx.save();
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(abilityName, btnX, btnY + btnRadius + 14);
        ctx.restore();
        
        ctx.restore();
    }

    /**
     * 渲染高度条（右侧）- 已移除
     */
    renderAltitudeBar(ctx, screenWidth, screenHeight) {
        // 已移除
    }

    drawJetShape(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 2 - 10);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
    }

    // Touch handling with clamping
    setPosition(x, y) {
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        // Clamp X: [halfW, ScreenWidth - halfW]
        this.x = Math.max(halfW, Math.min(x, GameConfig.Screen.width - halfW));

        // Clamp Y: [halfH, this.screenHeight - halfH]
        this.y = Math.max(halfH, Math.min(y, this.screenHeight - halfH));
    }
}
