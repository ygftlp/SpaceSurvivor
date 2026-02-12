/**
 * 母舰 (Mothership)
 * 游戏核心叙事锚点 - 玩家需要保护的对象
 * 位于屏幕底部中央，有血条和跃迁充能系统
 */

import { GameConfig } from '../config.js';

export default class Mothership {
    constructor(scene) {
        this.scene = scene;
        this.width = 280; // 更大尺寸 - 更威猛
        this.height = 180;

        // 位置：屏幕底部中央（留出空间给状态条）
        this.x = GameConfig.Screen.width / 2;
        this.y = scene.game.logicHeight - 100;

        // 状态
        this.maxHp = 800; // 母舰血量 500→800（给玩家更多容错）
        this.hp = this.maxHp;
        this.isAlive = true;

        // 跃迁充能系统
        this.jumpCharge = 0;
        this.maxJumpCharge = 100; // 100% = 可以跃迁
        this.chargeRate = 100 / 90;
        this.isJumpReady = false;

        // 视觉效果
        this.shieldPulse = 0;
        this.damageFlash = 0;
        this.engineGlow = 0;

        // 警报状态
        this.isInDanger = false;
        this.dangerTimer = 0;
        
        // 武器系统 - 增强版（更频繁的开火，更大的射程）
        this.weapons = {
            main: { cooldown: 0, maxCooldown: 0.8, damage: 50, range: 2000 },  // 0.8秒冷却，50伤害，2000射程覆盖全屏
            side: { cooldown: 0, maxCooldown: 0.3, damage: 25, range: 2000 }   // 0.3秒冷却，25伤害，2000射程覆盖全屏
        };
        this.fireTimer = 0;
        this.lastFireTime = 0; // 用于调试
    }

    update(dt) {
        if (!this.isAlive) return;

        // 自动充能
        if (!this.isJumpReady) {
            this.jumpCharge += this.chargeRate * dt;
            if (this.jumpCharge >= this.maxJumpCharge) {
                this.jumpCharge = this.maxJumpCharge;
                this.isJumpReady = true;
                // 跃迁充能完成，触发胜利条件
                this.onJumpChargeComplete();
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

        // 引擎光效
        this.engineGlow = 0.7 + Math.sin(this.shieldPulse) * 0.3;
        
        // 武器系统更新
        this.updateWeapons(dt);
    }
    
    updateWeapons(dt) {
        // 更新武器冷却
        this.weapons.main.cooldown = Math.max(0, this.weapons.main.cooldown - dt);
        this.weapons.side.cooldown = Math.max(0, this.weapons.side.cooldown - dt);
        
        // 寻找目标并开火
        if (!this.scene || !this.scene.enemies) {
            console.log('MOTHERSHIP: No scene or enemies');
            return;
        }
        
        // 统计活跃敌人数量
        const activeEnemies = this.scene.enemies.filter(e => e.active).length;
        console.log(`MOTHERSHIP: ${activeEnemies} active enemies, mainCD: ${this.weapons.main.cooldown.toFixed(2)}`);
        
        // 主炮：攻击最近的敌人
        if (this.weapons.main.cooldown <= 0) {
            const target = this.findTarget(this.weapons.main.range);
            if (target) {
                console.log(`MOTHERSHIP MAIN FIRE! Target at (${Math.floor(target.x)}, ${Math.floor(target.y)})`);
                this.fireMainWeapon(target);
                this.weapons.main.cooldown = this.weapons.main.maxCooldown;
            } else {
                console.log('MOTHERSHIP: No target in range');
            }
        }
        
        // 侧炮：攻击范围内所有敌人
        if (this.weapons.side.cooldown <= 0) {
            const targets = this.findTargetsInRange(this.weapons.side.range, 2);
            if (targets.length > 0) {
                console.log(`MOTHERSHIP SIDE FIRE! ${targets.length} targets`);
                targets.forEach(t => this.fireSideWeapon(t));
                this.weapons.side.cooldown = this.weapons.side.maxCooldown;
            }
        }
    }
    
    findTarget(range) {
        let closest = null;
        let closestDist = range;
        
        if (!this.scene || !this.scene.enemies) {
            console.log('MOTHERSHIP: No scene or enemies array');
            return null;
        }
        
        let activeCount = 0;
        this.scene.enemies.forEach(e => {
            if (!e.active) return;
            activeCount++;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                closest = e;
            }
        });
        
        if (activeCount === 0) {
            console.log('MOTHERSHIP: No active enemies found');
        } else if (!closest) {
            console.log(`MOTHERSHIP: ${activeCount} enemies but none in range ${range}`);
        }
        
        return closest;
    }
    
    findTargetsInRange(range, maxCount) {
        const targets = [];
        this.scene.enemies.forEach(e => {
            if (!e.active || targets.length >= maxCount) return;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < range) {
                targets.push(e);
            }
        });
        return targets;
    }
    
    fireMainWeapon(target) {
        // 主炮：双联装激光
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const spawnY = this.y - this.height / 2; // 从母舰顶部发射

        console.log(`MOTHERSHIP FIRE MAIN -> Target at (${Math.floor(target.x)}, ${Math.floor(target.y)})`);

        // 创建激光束效果 - 从母舰顶部到目标的连线
        if (this.scene.effectManager) {
            // 计算炮口位置（双联装主炮在顶部中央）
            const leftMuzzleX = this.x - 4;
            const rightMuzzleX = this.x + 4;

            // 绘制激光束 - 使用更多粒子，更大尺寸，更亮的颜色
            const beamSteps = 35;
            for (let i = 0; i <= beamSteps; i++) {
                const t = i / beamSteps;
                // 左炮管激光 - 使用亮黄色/橙色
                const lx = leftMuzzleX + (target.x - leftMuzzleX) * t;
                const ly = spawnY + (target.y - spawnY) * t;
                // 添加随机偏移使光束看起来更自然
                const jitterX = (Math.random() - 0.5) * 6;
                const jitterY = (Math.random() - 0.5) * 6;
                // 随机选择亮黄色或橙色
                const beamColor = Math.random() > 0.3 ? '#ffcc00' : '#ff8800';
                this.scene.effectManager.spawnParticle(lx + jitterX, ly + jitterY, beamColor, 3);

                // 右炮管激光
                const rx = rightMuzzleX + (target.x - rightMuzzleX) * t;
                const ry = spawnY + (target.y - spawnY) * t;
                const rjitterX = (Math.random() - 0.5) * 6;
                const rjitterY = (Math.random() - 0.5) * 6;
                const rBeamColor = Math.random() > 0.3 ? '#ffcc00' : '#ff8800';
                this.scene.effectManager.spawnParticle(rx + rjitterX, ry + rjitterY, rBeamColor, 3);
            }

            // 炮口火焰效果 - 大幅增加粒子数量和大小
            for (let i = 0; i < 20; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
                const distance = Math.random() * 40;
                const px = this.x + Math.cos(spreadAngle) * distance;
                const py = spawnY + Math.sin(spreadAngle) * distance;
                // 更亮的火焰颜色
                const color = Math.random() > 0.5 ? '#ffaa00' : '#ff6600';
                this.scene.effectManager.spawnParticle(px, py, color, 4);
            }

            // 击中目标时的爆炸粒子 - 更大量、更亮
            for (let i = 0; i < 15; i++) {
                const explodeAngle = Math.random() * Math.PI * 2;
                const explodeDist = Math.random() * 35;
                const ex = target.x + Math.cos(explodeAngle) * explodeDist;
                const ey = target.y + Math.sin(explodeAngle) * explodeDist;
                const color = Math.random() > 0.5 ? '#ffcc00' : '#ff9900';
                this.scene.effectManager.spawnParticle(ex, ey, color, 3);
            }

            // 添加冲击波圆环效果
            if (this.scene.effectManager.spawnShockwave) {
                this.scene.effectManager.spawnShockwave(target.x, target.y, '#ffaa00', 40);
            }

            // 添加浮动文字显示伤害
            this.scene.effectManager.spawnFloatingText(
                '母舰炮火!',
                this.x,
                this.y - 120,
                '#ffcc00',
                24
            );

            // 同时在目标位置显示伤害数字
            this.scene.effectManager.spawnFloatingText(
                `-${this.weapons.main.damage}`,
                target.x,
                target.y - 20,
                '#ff6600',
                20
            );
        }

        // 造成伤害
        target.takeDamage(this.weapons.main.damage);

        // 屏幕震动 - 更强的震动效果
        if (this.scene.effectManager) {
            this.scene.effectManager.shake(5, 0.15);
        }
    }
    
    fireSideWeapon(target) {
        // 侧炮：小型速射
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const spawnY = this.y - this.height / 2 + 20; // 从母舰顶部稍偏下的位置发射

        // 根据目标位置决定使用左侧还是右侧炮
        const isLeftSide = target.x < this.x;
        const muzzleOffsetX = isLeftSide ? -this.width * 0.65 : this.width * 0.65;
        const muzzleX = this.x + muzzleOffsetX;

        console.log(`MOTHERSHIP FIRE SIDE (${isLeftSide ? 'LEFT' : 'RIGHT'}) -> Target at (${Math.floor(target.x)}, ${Math.floor(target.y)})`);

        // 创建子弹效果
        if (this.scene.effectManager) {
            // 绘制激光束 - 更多粒子，更大尺寸，亮黄色/橙色
            const beamSteps = 25;
            for (let i = 0; i <= beamSteps; i++) {
                const t = i / beamSteps;
                const bx = muzzleX + (target.x - muzzleX) * t;
                const by = spawnY + (target.y - spawnY) * t;
                // 光束带随机抖动
                const jitterX = (Math.random() - 0.5) * 4;
                const jitterY = (Math.random() - 0.5) * 4;
                // 使用亮黄色/橙色替代原来的蓝色
                const beamColor = Math.random() > 0.4 ? '#ffcc00' : '#ff9900';
                this.scene.effectManager.spawnParticle(bx + jitterX, by + jitterY, beamColor, 3);
            }

            // 炮口闪光 - 大幅增加粒子数量和大小
            for (let i = 0; i < 12; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
                const distance = Math.random() * 30;
                const px = muzzleX + Math.cos(spreadAngle) * distance;
                const py = spawnY + Math.sin(spreadAngle) * distance;
                // 更亮的火焰颜色
                const color = Math.random() > 0.5 ? '#ffaa00' : '#ff7700';
                this.scene.effectManager.spawnParticle(px, py, color, 3);
            }

            // 击中效果 - 更大量、更亮
            for (let i = 0; i < 10; i++) {
                const explodeAngle = Math.random() * Math.PI * 2;
                const explodeDist = Math.random() * 25;
                const ex = target.x + Math.cos(explodeAngle) * explodeDist;
                const ey = target.y + Math.sin(explodeAngle) * explodeDist;
                const color = Math.random() > 0.5 ? '#ffcc00' : '#ffaa00';
                this.scene.effectManager.spawnParticle(ex, ey, color, 3);
            }

            // 添加小型冲击波圆环效果
            if (this.scene.effectManager.spawnShockwave) {
                this.scene.effectManager.spawnShockwave(target.x, target.y, '#ffcc00', 25);
            }

            // 在目标位置显示伤害数字
            this.scene.effectManager.spawnFloatingText(
                `-${this.weapons.side.damage}`,
                target.x,
                target.y - 15,
                '#ffaa00',
                16
            );
        }

        // 造成伤害
        target.takeDamage(this.weapons.side.damage);

        // 屏幕震动 - 侧炮震动较小但仍可感知
        if (this.scene.effectManager) {
            this.scene.effectManager.shake(3, 0.1);
        }
    }

    takeDamage(damage) {
        if (!this.isAlive) return;

        this.hp -= damage;
        this.damageFlash = 0.3; // 闪红0.3秒
        this.dangerTimer = 2.0; // 进入危险状态2秒

        // 触发强烈反馈
        if (this.scene.effectManager) {
            this.scene.effectManager.shake(10, 0.3);
            this.scene.effectManager.spawnFloatingText(
                '母舰受击!',
                this.x,
                this.y - 100,
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
        // 母舰被摧毁 = 游戏失败
        console.log('MOTHERSHIP DESTROYED - GAME OVER');

        if (this.scene.effectManager) {
            this.scene.effectManager.spawnExplosion(this.x, this.y, 'boss');
            this.scene.effectManager.shake(30, 1.0);
        }

        // 延迟后结束游戏
        setTimeout(() => {
            this.scene.endGame(false); // false = 失败
        }, 2000);
    }

    onJumpChargeComplete() {
        // 跃迁充能完成 = 游戏胜利
        console.log('MOTHERSHIP JUMP CHARGE COMPLETE - VICTORY!');
        
        if (this.scene.effectManager) {
            this.scene.effectManager.spawnFloatingText(
                '跃迁引擎启动!',
                this.x,
                this.y - 150,
                '#00ffff',
                50
            );
            this.scene.effectManager.shake(10, 1.0);
        }
        
        // 延迟后结束游戏（给玩家时间看到胜利提示）
        setTimeout(() => {
            if (this.scene && this.isAlive) {
                this.scene.endGame(true); // true = 胜利
            }
        }, 3000);
    }

    // 敌人AI调用 - 判断是否应该攻击母舰
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

        ctx.translate(this.x, this.y);

        // ========== 护盾/跃迁光环 ==========
        if (this.isJumpReady) {
            // 跃迁就绪：多层能量波纹
            for (let i = 5; i >= 0; i--) {
                const radius = this.width * 0.7 + i * 20;
                const pulse = Math.sin(this.shieldPulse * 3 - i * 0.5) * 0.5 + 0.5;
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.08 + pulse * 0.15})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // 普通护盾：淡蓝色光环
            const shieldAlpha = 0.08 + Math.sin(this.shieldPulse) * 0.04;
            ctx.fillStyle = `rgba(100, 200, 255, ${shieldAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.75, 0, Math.PI * 2);
            ctx.fill();
        }

        const w = this.width / 2;
        const h = this.height / 2;
        const t = this.shieldPulse;

        // ========== 专业级科幻母舰设计 ==========
        // 参考《星际争霸》《家园》等游戏的母舰风格

        // 【第0层】引擎尾焰（最底层）
        const engineY = h * 0.75;
        const enginePositions = [-w * 0.6, -w * 0.2, w * 0.2, w * 0.6];
        
        enginePositions.forEach((ex, i) => {
            const flameHeight = 40 + Math.sin(t * 8 + i) * 10;
            const engineColor = this.isJumpReady ? '#00ffff' : '#ff4444';
            
            // 主尾焰
            const flameGrad = ctx.createLinearGradient(ex, engineY + 15, ex, engineY + 15 + flameHeight);
            flameGrad.addColorStop(0, engineColor);
            flameGrad.addColorStop(0.4, `rgba(255, 150, 50, 0.6)`);
            flameGrad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(ex - 12, engineY + 15);
            ctx.lineTo(ex + 12, engineY + 15);
            ctx.lineTo(ex + (Math.random() - 0.5) * 8, engineY + 15 + flameHeight);
            ctx.closePath();
            ctx.fill();
            
            // 内层核心火焰
            ctx.fillStyle = `rgba(255, 255, 200, ${0.7 + Math.sin(t * 10 + i) * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(ex - 6, engineY + 15);
            ctx.lineTo(ex + 6, engineY + 15);
            ctx.lineTo(ex, engineY + 15 + flameHeight * 0.6);
            ctx.closePath();
            ctx.fill();
        });

        // 【第1层】主舰体 - 厚重装甲
        // 中央主体（类似战列舰）
        const hullGrad = ctx.createLinearGradient(0, -h * 0.9, 0, h * 0.8);
        hullGrad.addColorStop(0, '#4a5568');      // 顶部亮
        hullGrad.addColorStop(0.3, '#2d3748');    // 中上部
        hullGrad.addColorStop(0.6, '#1a202c');    // 中部
        hullGrad.addColorStop(1, '#0d1117');      // 底部暗

        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        // 舰艏（尖形）
        ctx.moveTo(0, -h * 0.95);
        // 舰体两侧（收腰设计）
        ctx.lineTo(w * 0.35, -h * 0.6);
        ctx.lineTo(w * 0.5, -h * 0.2);
        ctx.lineTo(w * 0.55, h * 0.3);
        // 引擎舱
        ctx.lineTo(w * 0.45, h * 0.75);
        ctx.lineTo(w * 0.25, h * 0.85);
        // 底部中央
        ctx.lineTo(0, h * 0.9);
        // 左侧镜像
        ctx.lineTo(-w * 0.25, h * 0.85);
        ctx.lineTo(-w * 0.45, h * 0.75);
        ctx.lineTo(-w * 0.55, h * 0.3);
        ctx.lineTo(-w * 0.5, -h * 0.2);
        ctx.lineTo(-w * 0.35, -h * 0.6);
        ctx.closePath();
        ctx.fill();

        // 舰体高光轮廓
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 【第2层】主装甲板纹理
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        
        // 横向装甲缝
        for (let i = 0; i < 6; i++) {
            const y = -h * 0.7 + i * (h * 1.5 / 6);
            const widthAtY = w * 0.5 * (1 - Math.abs(y) / (h * 0.9));
            ctx.beginPath();
            ctx.moveTo(-widthAtY * 0.8, y);
            ctx.lineTo(widthAtY * 0.8, y);
            ctx.stroke();
        }

        // 纵向结构线
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.8);
        ctx.lineTo(0, h * 0.8);
        ctx.stroke();

        // 【第3层】侧翼模块（突出的大装甲块）
        const wingY = h * 0.1;
        const wingGrad = ctx.createLinearGradient(-w * 0.7, wingY - 30, -w * 0.7, wingY + 40);
        wingGrad.addColorStop(0, '#5a6c7d');
        wingGrad.addColorStop(0.5, '#3d4f5f');
        wingGrad.addColorStop(1, '#2a3a4a');

        // 左翼
        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, wingY - 25);
        ctx.lineTo(-w * 0.8, wingY - 15);
        ctx.lineTo(-w * 0.9, wingY + 20);
        ctx.lineTo(-w * 0.7, wingY + 35);
        ctx.lineTo(-w * 0.45, wingY + 25);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 右翼
        ctx.beginPath();
        ctx.moveTo(w * 0.4, wingY - 25);
        ctx.lineTo(w * 0.8, wingY - 15);
        ctx.lineTo(w * 0.9, wingY + 20);
        ctx.lineTo(w * 0.7, wingY + 35);
        ctx.lineTo(w * 0.45, wingY + 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 【第4层】指挥塔（多层结构）
        const towerX = w * 0.15;
        const towerY = -h * 0.45;
        
        // 塔基
        ctx.fillStyle = '#3d4f5f';
        ctx.fillRect(towerX - 20, towerY, 40, 25);
        
        // 主塔身
        const towerGrad = ctx.createLinearGradient(towerX, towerY - 20, towerX, towerY + 10);
        towerGrad.addColorStop(0, '#87ceeb');
        towerGrad.addColorStop(1, '#4682b4');
        ctx.fillStyle = towerGrad;
        ctx.beginPath();
        ctx.moveTo(towerX, towerY - 20);
        ctx.lineTo(towerX + 18, towerY);
        ctx.lineTo(towerX + 15, towerY + 15);
        ctx.lineTo(towerX - 15, towerY + 15);
        ctx.lineTo(towerX - 18, towerY);
        ctx.closePath();
        ctx.fill();

        // 顶部天线
        ctx.strokeStyle = '#a0aec0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(towerX, towerY - 20);
        ctx.lineTo(towerX, towerY - 35);
        ctx.stroke();
        // 天线闪烁
        ctx.fillStyle = `rgba(255, 50, 50, ${0.8 + Math.sin(t * 6) * 0.2})`;
        ctx.beginPath();
        ctx.arc(towerX, towerY - 35, 3, 0, Math.PI * 2);
        ctx.fill();

        // 指挥塔窗户
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = `rgba(255, 255, 200, ${0.5 + Math.sin(t * 2 + i) * 0.3})`;
            ctx.fillRect(towerX - 10 + i * 7, towerY - 8, 5, 6);
        }

        // 【第5层】武器系统
        // 主炮塔（舰艏）
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.arc(0, -h * 0.5, 12, 0, Math.PI * 2);
        ctx.fill();
        // 双联装炮管
        ctx.strokeStyle = '#718096';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-4, -h * 0.5);
        ctx.lineTo(-4, -h * 0.75);
        ctx.moveTo(4, -h * 0.5);
        ctx.lineTo(4, -h * 0.75);
        ctx.stroke();
        // 炮口发光
        ctx.fillStyle = `rgba(255, 100, 100, ${0.6 + Math.sin(t * 4) * 0.4})`;
        ctx.beginPath();
        ctx.arc(-4, -h * 0.75, 3, 0, Math.PI * 2);
        ctx.arc(4, -h * 0.75, 3, 0, Math.PI * 2);
        ctx.fill();

        // 侧舷副炮（4座）
        const turretPos = [
            { x: -w * 0.65, y: wingY },
            { x: w * 0.65, y: wingY },
            { x: -w * 0.35, y: h * 0.45 },
            { x: w * 0.35, y: h * 0.45 }
        ];
        
        turretPos.forEach(pos => {
            // 炮座
            ctx.fillStyle = '#4a5568';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 旋转炮管
            const angle = t + pos.x * 0.05;
            ctx.strokeStyle = '#718096';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + Math.cos(angle) * 18, pos.y + Math.sin(angle) * 18);
            ctx.stroke();
        });

        // 【第6层】引擎喷口（金属质感）
        enginePositions.forEach((ex, i) => {
            // 引擎外壳
            ctx.fillStyle = '#2d3748';
            ctx.beginPath();
            ctx.ellipse(ex, engineY, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 引擎边框
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 内部喷口
            ctx.fillStyle = '#1a202c';
            ctx.beginPath();
            ctx.ellipse(ex, engineY + 3, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心发光
            const engineColor = this.isJumpReady ? '#00ffff' : '#ff5555';
            ctx.shadowBlur = 15;
            ctx.shadowColor = engineColor;
            ctx.fillStyle = engineColor;
            ctx.globalAlpha = 0.8 + Math.sin(t * 5 + i) * 0.2;
            ctx.beginPath();
            ctx.ellipse(ex, engineY + 3, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        });

        // 【第7层】中央跃迁核心
        const coreY = -h * 0.15;
        
        // 核心底座
        ctx.fillStyle = '#2d3748';
        ctx.beginPath();
        ctx.arc(0, coreY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // 旋转环1
        ctx.strokeStyle = this.isJumpReady ? '#00ffff' : '#63b3ed';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, coreY, 20, t * 2, t * 2 + Math.PI * 1.5);
        ctx.stroke();
        
        // 旋转环2
        ctx.beginPath();
        ctx.arc(0, coreY, 15, -t * 1.5, -t * 1.5 + Math.PI * 1.5);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // 核心球体
        const corePulse = Math.sin(t * 3) * 0.3 + 0.7;
        ctx.fillStyle = this.isJumpReady ? '#00ffff' : '#4299e1';
        ctx.shadowBlur = 30 * corePulse;
        ctx.shadowColor = this.isJumpReady ? '#00ffff' : '#63b3ed';
        ctx.beginPath();
        ctx.arc(0, coreY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 【第8层】航行灯
        const blinkRate = Math.sin(t * 8) > 0;
        if (blinkRate) {
            // 左红右绿标准航行灯
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ff0000';
            ctx.beginPath();
            ctx.arc(-w * 0.85, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
            ctx.beginPath();
            ctx.arc(w * 0.85, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 【第9层】装饰细节
        // 舰名标识区域
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-w * 0.15, h * 0.5, w * 0.3, 15);
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-w * 0.15, h * 0.5, w * 0.3, 15);
        
        // 小型传感器阵列
        ctx.fillStyle = '#5a6c7d';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(i * 15, -h * 0.75, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 【第10层】能源管道系统
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + Math.sin(t * 4) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ccff';
        
        // 主能源管道（从核心到引擎）
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.15);
        ctx.lineTo(-w * 0.6, h * 0.65);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.15);
        ctx.lineTo(-w * 0.2, h * 0.65);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.15);
        ctx.lineTo(w * 0.2, h * 0.65);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.15);
        ctx.lineTo(w * 0.6, h * 0.65);
        ctx.stroke();
        
        // 分支管道
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            ctx.beginPath();
            ctx.moveTo(i * w * 0.15, -h * 0.3);
            ctx.lineTo(i * w * 0.15, h * 0.5);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // 【第11层】机库与甲板设施
        // 左机库（打开的舱门）
        const hangarY = -h * 0.1;
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(-w * 0.55, hangarY - 20, 35, 40);
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w * 0.55, hangarY - 20, 35, 40);
        
        // 机库内部灯光
        ctx.fillStyle = `rgba(255, 200, 100, ${0.4 + Math.sin(t * 3) * 0.2})`;
        ctx.fillRect(-w * 0.52, hangarY - 15, 29, 30);
        
        // 右机库
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(w * 0.2, hangarY - 20, 35, 40);
        ctx.strokeRect(w * 0.2, hangarY - 20, 35, 40);
        ctx.fillStyle = `rgba(255, 200, 100, ${0.4 + Math.sin(t * 3 + 1) * 0.2})`;
        ctx.fillRect(w * 0.23, hangarY - 15, 29, 30);

        // 【第12层】通信与雷达阵列
        // 主通信塔（舰体后方）
        ctx.strokeStyle = '#718096';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w * 0.15, h * 0.6);
        ctx.lineTo(-w * 0.15, h * 0.85);
        ctx.stroke();
        
        // 碟形天线
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.ellipse(-w * 0.15, h * 0.85, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 副天线（旋转）
        ctx.save();
        ctx.translate(w * 0.25, h * 0.75);
        ctx.rotate(t * 0.5);
        ctx.fillStyle = '#5a6c7d';
        ctx.fillRect(-12, -3, 24, 6);
        ctx.fillRect(-3, -12, 6, 24);
        ctx.restore();

        // 【第13层】护盾发生器（四个角）
        const shieldGenPos = [
            { x: -w * 0.75, y: -h * 0.4 },
            { x: w * 0.75, y: -h * 0.4 },
            { x: -w * 0.65, y: h * 0.55 },
            { x: w * 0.65, y: h * 0.55 }
        ];
        
        shieldGenPos.forEach((pos, i) => {
            // 发生器基座
            ctx.fillStyle = '#3d4f5f';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // 能量环（旋转）
            ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + Math.sin(t * 2 + i) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 8, t + i, t + i + Math.PI * 1.5);
            ctx.stroke();
            
            // 核心光点
            ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(t * 3 + i) * 0.4})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // 【第14层】舰体表面灯光
        // 侧面舷窗（多层）
        for (let row = 0; row < 4; row++) {
            const wy = -h * 0.5 + row * 25;
            for (let col = -4; col <= 4; col++) {
                if (Math.abs(col) < 2) continue; // 中间区域跳过
                const wx = col * 18;
                const lightIntensity = 0.3 + Math.sin(t * 2 + row + col) * 0.2;
                ctx.fillStyle = `rgba(255, 220, 150, ${lightIntensity})`;
                ctx.fillRect(wx - 4, wy - 3, 8, 6);
            }
        }

        // 【第15层】装甲铆钉和螺栓
        ctx.fillStyle = 'rgba(150, 170, 190, 0.6)';
        for (let i = -5; i <= 5; i++) {
            // 甲板铆钉线
            ctx.beginPath();
            ctx.arc(i * 20, -h * 0.7, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(i * 25, h * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 【第16层】推进器矢量喷口细节
        enginePositions.forEach((ex, i) => {
            // 矢量调节翼
            ctx.strokeStyle = '#5a6c7d';
            ctx.lineWidth = 3;
            const wingAngle = Math.sin(t * 2 + i) * 0.3;
            
            // 左翼片
            ctx.beginPath();
            ctx.moveTo(ex - 8, engineY);
            ctx.lineTo(ex - 15 + wingAngle * 5, engineY + 12);
            ctx.stroke();
            
            // 右翼片
            ctx.beginPath();
            ctx.moveTo(ex + 8, engineY);
            ctx.lineTo(ex + 15 + wingAngle * 5, engineY + 12);
            ctx.stroke();
            
            // 喷口格栅
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 1;
            for (let j = -2; j <= 2; j++) {
                ctx.beginPath();
                ctx.moveTo(ex + j * 4, engineY - 5);
                ctx.lineTo(ex + j * 3, engineY + 8);
                ctx.stroke();
            }
        });

        // 【第17层】顶部警示灯
        const warningLightY = -h * 0.85;
        const warningBlink = Math.sin(t * 10) > 0;
        if (warningBlink) {
            ctx.fillStyle = '#ff6600';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff6600';
            ctx.beginPath();
            ctx.arc(0, warningLightY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 【第18层】维护通道和细节线条
        ctx.strokeStyle = 'rgba(100, 120, 140, 0.3)';
        ctx.lineWidth = 1;
        
        // 横向维护通道
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-w * 0.4, i * 20);
            ctx.lineTo(w * 0.4, i * 20);
            ctx.stroke();
        }
        
        // 纵向加强筋
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 30, -h * 0.5);
            ctx.lineTo(i * 25, h * 0.5);
            ctx.stroke();
        }

        ctx.restore();

        // 绘制血条和跃迁条（在translate之外）
        this.renderStatusBars(ctx);
    }

    renderStatusBars(ctx) {
        const barWidth = 220;
        const barHeight = 14;
        const x = this.x - barWidth / 2;
        const y = this.y + this.height / 2 + 20;

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
            // 已就绪 - 闪烁效果
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
            ctx.fillText('⚡ 跃迁引擎就绪! 即将撤离 ⚡', this.x, jumpY + 11);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillText(`跃迁充能 ${Math.floor(jumpPercent * 100)}%`, this.x, jumpY + 11);
        }
    }

    renderCountdownUI(ctx, screenWidth, screenHeight) {
        // 90秒倒计时（简化版）
        const remainingTime = Math.max(0, 90 - this.scene.waveManager.levelTime);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 大倒计时（屏幕顶部中央）
        ctx.save();
        
        // 背景框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(screenWidth/2 - 80, 15, 160, 50);
        
        // 倒计时数字 - 最后20秒变红
        ctx.fillStyle = remainingTime < 20 ? '#e74c3c' : '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, screenWidth/2, 50);
        
        // 倒计时标签
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.fillText('保护母舰', screenWidth/2, 65);
        
        ctx.restore();
    }
}
