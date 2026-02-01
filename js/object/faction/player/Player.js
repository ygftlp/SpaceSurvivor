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
        this.speed = this.fighter.speed;

        // Sprite not needed, delegate to this.fighter.render()

        // Shooting State
        this.isShooting = true;
        this.lastShootTime = 0;

        // Weapon Stats (Load from DataManager)
        this.baseStats = null; // Store base from DataManager
        this.effectiveStats = {}; // Actual stats used for shooting
        this.refreshStats();

        // ========== 能量系统 (Energy System) ==========
        this.maxEnergy = 100;
        this.energy = this.maxEnergy; // 当前能量 (0-100)
        this.energyRegenRate = 12; // 每秒恢复12点能量（加快恢复）
        this.overheat = false; // 过热状态
        this.overheatTimer = 0; // 过热持续时间
        this.overheatDuration = 2.5; // 过热持续2.5秒（略微降低惩罚）
        
        // 武器能量消耗
        this.energyCostPerShot = 2; // 每发子弹消耗2点能量（降低消耗）
        this.secondarySkillCost = 30; // 副武器技能消耗30点
        
        // 副武器系统
        this.secondarySkill = {
            id: 'missile_salvo',
            name: '导弹齐射',
            cooldown: 0,
            maxCooldown: 8, // 8秒冷却
            ready: true
        };
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
        const maxHp = this.fighter.hp;
        const amount = Math.floor(maxHp * percent);
        this.hp = Math.min(this.hp + amount, maxHp);
        console.log(`Healed ${amount} HP. Current: ${this.hp}/${maxHp}`);
    }

    update(deltaTime) {
        let newBullets = [];
        const now = Date.now();
        
        // ========== 能量系统更新 ==========
        const dt = deltaTime / 1000; // 转换为秒
        
        // 处理过热状态
        if (this.overheat) {
            this.overheatTimer -= dt;
            if (this.overheatTimer <= 0) {
                this.overheat = false;
                this.overheatTimer = 0;
                console.log('过热解除！能量系统恢复正常');
            }
            // 过热时能量恢复速度减半
            this.energy = Math.min(this.maxEnergy, this.energy + (this.energyRegenRate * 0.5) * dt);
        } else {
            // 正常能量恢复
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
        }
        
        // 副武器冷却
        if (!this.secondarySkill.ready) {
            this.secondarySkill.cooldown -= dt;
            if (this.secondarySkill.cooldown <= 0) {
                this.secondarySkill.ready = true;
                this.secondarySkill.cooldown = 0;
            }
        }

        // Auto Shoot - 检查能量和过热
        if (this.isShooting && !this.overheat && this.energy >= this.energyCostPerShot) {
            if (now - this.lastShootTime > this.shootInterval) {
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
        // 检查能量
        const totalCost = this.energyCostPerShot * this.effectiveStats.count;
        if (this.energy < totalCost || this.overheat) {
            return []; // 能量不足或过热，无法射击
        }
        
        // 消耗能量
        this.energy -= totalCost;
        
        // 检查是否过热（能量归零）
        if (this.energy <= 0) {
            this.energy = 0;
            this.overheat = true;
            this.overheatTimer = this.overheatDuration;
            console.log('警告：能量耗尽！系统进入过热状态！');
        }
        
        const bullets = [];
        const stats = this.effectiveStats; // Use effective stats
        const startX = this.x;
        const startY = this.y - this.height / 2;

        // 根据 count (弹道数量) 计算子弹
        // 简单实现：如果是 1 发，居中；多发则根据 spread 扇形分布
        if (stats.count === 1) {
            bullets.push(new Bullet(startX, startY, -90, stats.speed, stats.damage, false));
        } else {
            // 多发逻辑 (例如 count=3, spread=15 -> -105, -90, -75)
            const mid = (stats.count - 1) / 2;
            for (let i = 0; i < stats.count; i++) {
                const angleOffset = (i - mid) * stats.spread;
                const angle = -90 + angleOffset;
                bullets.push(new Bullet(startX, startY, angle, stats.speed, stats.damage, false));
            }
        }

        return bullets;
    }
    
    /**
     * 使用副武器技能（导弹齐射）
     */
    useSecondarySkill() {
        if (!this.secondarySkill.ready || this.overheat) {
            return []; // 冷却中或过热
        }
        
        // 检查能量
        if (this.energy < this.secondarySkillCost) {
            return []; // 能量不足
        }
        
        // 消耗能量和触发冷却
        this.energy -= this.secondarySkillCost;
        this.secondarySkill.ready = false;
        this.secondarySkill.cooldown = this.secondarySkill.maxCooldown;
        
        // 生成导弹齐射（8发追踪导弹）
        const missiles = [];
        const startX = this.x;
        const startY = this.y - this.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = -90 + (i - 3.5) * 10; // 扇形分布
            const missile = new Bullet(startX, startY, angle, 400, 50, false);
            missile.isHoming = true; // 追踪标记
            missile.homingDelay = i * 0.1; // 延迟启动追踪
            missiles.push(missile);
        }
        
        console.log('导弹齐射！发射8枚追踪导弹');
        return missiles;
    }
    
    /**
     * 瞬间充能（拾取电池）
     */
    overchargeEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
        // 拾取电池可以解除过热
        if (this.overheat && amount >= 30) {
            this.overheat = false;
            this.overheatTimer = 0;
            console.log('电池注入！过热解除！');
        }
    }


    render(ctx) {
        ctx.save();

        // Translate to Player Position
        ctx.translate(this.x, this.y);

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
     * 渲染能量条和副武器UI（在BattleScene中调用）
     */
    renderUI(ctx, screenWidth, screenHeight) {
        // ========== 顶部能量条 ==========
        const barWidth = 200;
        const barHeight = 16;
        const x = screenWidth / 2 - barWidth / 2;
        const y = 80; // 顶部位置
        
        // 能量条背景
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.strokeStyle = this.overheat ? '#ff4444' : '#4a5568';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // 能量填充
        const energyPercent = this.energy / this.maxEnergy;
        let energyColor;
        if (this.overheat) {
            energyColor = '#ff4444'; // 过热红色
        } else if (energyPercent > 0.6) {
            energyColor = '#00ccff'; // 充足青色
        } else if (energyPercent > 0.3) {
            energyColor = '#ffcc00'; // 中等黄色
        } else {
            energyColor = '#ff4444'; // 低能量红色
        }
        
        ctx.fillStyle = energyColor;
        ctx.fillRect(x + 2, y + 2, (barWidth - 4) * energyPercent, barHeight - 4);
        
        // 能量文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        if (this.overheat) {
            ctx.fillStyle = '#ff4444';
            ctx.fillText(`⚠ 系统过热 ${Math.ceil(this.overheatTimer)}s`, screenWidth / 2, y + 12);
        } else {
            ctx.fillText(`能量 ${Math.floor(this.energy)}/${this.maxEnergy}`, screenWidth / 2, y + 12);
        }
        
        // 副武器技能指示器
        const skillX = screenWidth / 2 + barWidth / 2 + 20;
        const skillY = y + 8;
        const skillRadius = 20;
        
        // 技能背景圈
        ctx.beginPath();
        ctx.arc(skillX, skillY, skillRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a202c';
        ctx.fill();
        ctx.strokeStyle = this.secondarySkill.ready ? '#00ccff' : '#4a5568';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 技能冷却指示
        if (!this.secondarySkill.ready) {
            const cooldownPercent = 1 - (this.secondarySkill.cooldown / this.secondarySkill.maxCooldown);
            ctx.beginPath();
            ctx.arc(skillX, skillY, skillRadius - 3, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cooldownPercent));
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // 技能图标（简单导弹形状）
        ctx.fillStyle = this.secondarySkill.ready && this.energy >= this.secondarySkillCost ? '#00ccff' : '#4a5568';
        ctx.beginPath();
        ctx.moveTo(skillX, skillY - 10);
        ctx.lineTo(skillX + 6, skillY + 8);
        ctx.lineTo(skillX, skillY + 5);
        ctx.lineTo(skillX - 6, skillY + 8);
        ctx.closePath();
        ctx.fill();
        
        // 能量消耗提示
        if (this.secondarySkill.ready && this.energy < this.secondarySkillCost) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '10px Arial';
            ctx.fillText('能量不足', skillX, skillY + 28);
        }
        
        // ========== 右下角：战机特技按钮 ==========
        this.renderAbilityButton(ctx, screenWidth, screenHeight);
    }

    /**
     * 渲染战机特技按钮（A按钮）
     * 位置：右下角，与操作杆（左下）不重叠
     */
    renderAbilityButton(ctx, screenWidth, screenHeight) {
        const btnX = screenWidth - 70;
        const btnY = screenHeight - 240; // 在副武器按钮上方，避免重叠
        const btnRadius = 30;
        
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
        
        // 底部技能名称
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.font = '11px Arial';
        ctx.fillText(abilityName, btnX, btnY + btnRadius + 12);
        
        ctx.restore();
    }

    renderShapeFallback(ctx) {
        if (this.fighterId === 'J-20') {
            ctx.fillStyle = '#dfe6e9';
            this.drawJetShape(ctx);
            ctx.fillStyle = '#74b9ff';
            ctx.beginPath();
            ctx.moveTo(0, -30); ctx.lineTo(30, 20); ctx.lineTo(10, 30); ctx.lineTo(0, 20); ctx.lineTo(-10, 30); ctx.lineTo(-30, 20);
            ctx.fill();
        } else if (this.fighterId === 'F-22') {
            ctx.fillStyle = '#2d3436';
            this.drawJetShape(ctx);
            ctx.fillStyle = '#636e72';
            ctx.beginPath();
            ctx.moveTo(0, -30); ctx.lineTo(35, 10); ctx.lineTo(15, 30); ctx.lineTo(-15, 30); ctx.lineTo(-35, 10);
            ctx.fill();
        } else if (this.fighterId === 'Su-57') {
            ctx.fillStyle = '#55efc4';
            this.drawJetShape(ctx);
            ctx.fillStyle = '#00b894';
            ctx.beginPath();
            ctx.moveTo(0, -35); ctx.lineTo(25, 15); ctx.lineTo(25, 35); ctx.lineTo(-25, 35); ctx.lineTo(-25, 15);
            ctx.fill();
        } else {
            ctx.fillStyle = '#00ccff';
            this.drawJetShape(ctx);
        }
    }

    renderShapeFallback(ctx) {
        if (this.fighterId === 'J-20') {
            ctx.fillStyle = '#dfe6e9';
            this.drawJetShape(ctx);
            ctx.fillStyle = '#74b9ff';
            ctx.beginPath();
            ctx.moveTo(0, -30); ctx.lineTo(30, 20); ctx.lineTo(10, 30); ctx.lineTo(0, 20); ctx.lineTo(-10, 30); ctx.lineTo(-30, 20);
            ctx.fill();
        } else if (this.fighterId === 'F-22') {
            ctx.fillStyle = '#2d3436';
            this.drawJetShape(ctx);
            ctx.fillStyle = '#636e72';
            ctx.beginPath();
            ctx.moveTo(0, -30); ctx.lineTo(35, 10); ctx.lineTo(15, 30); ctx.lineTo(-15, 30); ctx.lineTo(-35, 10);
            ctx.fill();
        } else if (this.fighterId === 'Su-57') {
            ctx.fillStyle = '#55efc4';
            this.drawJetShape(ctx);
            ctx.fillStyle = '#00b894';
            ctx.beginPath();
            ctx.moveTo(0, -35); ctx.lineTo(25, 15); ctx.lineTo(25, 35); ctx.lineTo(-25, 35); ctx.lineTo(-25, 15);
            ctx.fill();
        } else {
            ctx.fillStyle = '#00ccff';
            this.drawJetShape(ctx);
        }
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
