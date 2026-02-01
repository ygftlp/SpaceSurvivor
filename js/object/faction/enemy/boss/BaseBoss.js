import Enemy from '../Enemy.js'; // Import relative to boss/ directory

/**
 * 高级BOSS基类 - 模块化组件系统
 * 支持：护盾/主炮/副炮/机库/核心弱点
 */
export default class BaseBoss extends Enemy {
    constructor(config, x, y, scene) {
        super(config, x, y, scene);

        this.isBoss = true;
        this.name = config.name || "Unknown Boss";

        // ========== 核心属性 ==========
        this.maxHp = config.hp || 3500; // 适合3分钟BOSS战
        this.hp = this.maxHp;
        this.width = config.width || 240;
        this.height = config.height || 200;
        
        // 无敌状态（护盾存在时）
        this.invulnerable = false;
        
        // ========== 模块化组件 ==========
        this.modules = {
            shield: null,      // 护盾发生器
            mainTurrets: [],   // 主炮炮台
            secondaryGuns: [], // 副炮/近防炮
            hangars: [],       // 机库（生成小怪）
            core: null         // 核心（弱点）
        };
        
        // 初始化组件（子类可覆盖）
        this.initModules();
        
        // ========== 阶段系统 ==========
        this.phase = 1;
        this.maxPhase = 3;
        this.phaseThresholds = [0.75, 0.5, 0.25]; // 血量阈值触发阶段转换
        
        // ========== AI状态机 ==========
        this.aiState = 'IDLE'; // IDLE, ATTACK, DEFEND, SPAWN, ENRAGE
        this.aiTimer = 0;
        this.aiStateDuration = 3; // 每个状态持续3秒
        
        // ========== 攻击模式 ==========
        this.attackPatterns = [];
        this.currentPatternIndex = 0;
        this.patternTimer = 0;
        
        // ========== 视觉效果 ==========
        this.warningPlayed = false;
        this.phaseTransitionEffect = false;
    }
    
    /**
     * 初始化BOSS组件 - 子类覆盖此方法定义具体配置
     */
    initModules() {
        // 默认配置示例
        this.modules.shield = {
            maxHp: 1200,
            hp: 1200,
            regenRate: 50, // 每秒恢复50
            regenDelay: 5, // 5秒未受击后开始恢复
            lastDamageTime: 0,
            active: true,
            radius: Math.max(this.width, this.height) * 0.7
        };
        
        // 主炮（2座）
        this.modules.mainTurrets = [
            { x: -80, y: -20, hp: 1500, maxHp: 1500, active: true, lastFire: 0, fireInterval: 2, angle: 0 },
            { x: 80, y: -20, hp: 1500, maxHp: 1500, active: true, lastFire: 0, fireInterval: 2, angle: 0 }
        ];
        
        // 副炮/近防炮（4座）
        this.modules.secondaryGuns = [
            { x: -60, y: 40, hp: 800, maxHp: 800, active: true, lastFire: 0, fireInterval: 0.3 },
            { x: -20, y: 60, hp: 800, maxHp: 800, active: true, lastFire: 0, fireInterval: 0.3 },
            { x: 20, y: 60, hp: 800, maxHp: 800, active: true, lastFire: 0, fireInterval: 0.3 },
            { x: 60, y: 40, hp: 800, maxHp: 800, active: true, lastFire: 0, fireInterval: 0.3 }
        ];
        
        // 机库（2座）
        this.modules.hangars = [
            { x: -50, y: 20, hp: 2000, maxHp: 2000, active: true, lastSpawn: 0, spawnInterval: 8, spawnType: 'DRONE_SCOUT' },
            { x: 50, y: 20, hp: 2000, maxHp: 2000, active: true, lastSpawn: 0, spawnInterval: 10, spawnType: 'DRONE_KAMIKAZE' }
        ];
        
        // 核心（初始被保护）
        this.modules.core = {
            exposed: false,
            hp: 5000,
            maxHp: 5000,
            damageMultiplier: 3 // 核心暴露时受到3倍伤害
        };
    }

    update(dt) {
        super.update(dt);
        
        // ========== 护盾恢复逻辑 ==========
        if (this.modules.shield && this.modules.shield.active) {
            this.modules.shield.lastDamageTime += dt;
            if (this.modules.shield.lastDamageTime > this.modules.shield.regenDelay) {
                this.modules.shield.hp = Math.min(
                    this.modules.shield.maxHp, 
                    this.modules.shield.hp + this.modules.shield.regenRate * dt
                );
            }
            // 护盾存在时BOSS本体无敌
            this.invulnerable = this.modules.shield.hp > 0;
        }
        
        // ========== AI状态机更新 ==========
        this.aiTimer += dt;
        if (this.aiTimer >= this.aiStateDuration) {
            this.aiTimer = 0;
            this.selectNextAIState();
        }
        
        // 执行当前AI状态
        this.executeAIState(dt);
        
        // ========== 攻击模式更新 ==========
        this.patternTimer += dt;
        this.updateAttackPatterns(dt);
        
        // ========== 机库生成 ==========
        this.updateHangars(dt);
        
        // ========== 阶段检查 ==========
        this.checkPhaseTransition();
    }
    
    /**
     * AI状态机 - 选择下一个行为
     */
    selectNextAIState() {
        const states = ['ATTACK', 'DEFEND', 'SPAWN'];
        
        // 根据阶段调整概率
        if (this.phase === 3) {
            states.push('ENRAGE'); // 第三阶段加入狂暴
        }
        
        // 根据护盾状态调整
        if (this.modules.shield && this.modules.shield.hp < this.modules.shield.maxHp * 0.3) {
            this.aiState = 'DEFEND'; // 护盾低时优先防御
        } else {
            this.aiState = states[Math.floor(Math.random() * states.length)];
        }
        
        // 进入新状态的特殊处理
        this.onAIStateEnter(this.aiState);
    }
    
    onAIStateEnter(state) {
        switch(state) {
            case 'ATTACK':
                this.aiStateDuration = 4; // 攻击持续4秒
                this.selectAttackPattern();
                break;
            case 'DEFEND':
                this.aiStateDuration = 3; // 防御持续3秒
                break;
            case 'SPAWN':
                this.aiStateDuration = 5; // 生成持续5秒
                this.emergencySpawn(); // 立即生成一波
                break;
            case 'ENRAGE':
                this.aiStateDuration = 6; // 狂暴持续6秒
                this.fireRateMultiplier = 2; // 射速翻倍
                break;
        }
    }
    
    executeAIState(dt) {
        switch(this.aiState) {
            case 'ATTACK':
                this.executeAttackPattern(dt);
                break;
            case 'DEFEND':
                // 防御状态：护盾恢复加速，移动躲避
                if (this.modules.shield) {
                    this.modules.shield.regenRate = 100; // 恢复速度翻倍
                }
                this.x += Math.sin(this.time * 2) * 30 * dt; // 左右移动
                break;
            case 'SPAWN':
                // 生成状态：加速生成
                this.modules.hangars.forEach(hangar => {
                    if (hangar.active) {
                        hangar.spawnInterval = Math.max(2, hangar.spawnInterval * 0.9);
                    }
                });
                break;
            case 'ENRAGE':
                // 狂暴状态：全炮开火
                this.fireAllWeapons(dt);
                break;
        }
    }

    spawnMinion(type, offsetX, offsetY) {
        if (!this.scene) return;

        // Use EnemyDatabase or Factory to get config?
        // For now, let's just spawn a standard enemy and override pos
        // Ideally: this.scene.waveManager.spawnSpecificEnemy(type, x, y);

        // Quick Hack: Create Enemy instance directly
        // We need to import Enemy? It's the super class, so 'this.constructor' is Boss.
        // We need the 'Enemy' class. We imported it at top.

        const spawnX = this.x + offsetX;
        const spawnY = this.y + offsetY;

        // Basic Config
        const config = {
            chassis: type || 'SCOUT', // 'SCOUT', 'FIGHTER'
            hp: 20,
            speed: 200,
            weapon: 'NONE',
            movement: 'LINEAR', // Or a custom 'Kamikaze' strategy
            color: '#cc00ff' // Minion color
        };

        const minion = new Enemy(config, spawnX, spawnY, this.scene);
        this.scene.enemies.push(minion);

        // Effect
        if (this.scene.effectManager) {
            this.scene.effectManager.spawnParticle(spawnX, spawnY, '#ffffff', 5);
        }
    }

    enterPhase(p) {
        this.phase = p;
        console.log(`${this.name} entering Phase ${p}!`);
        // Trigger specific behavior in subclass
        if (this.scene.effectManager) {
            this.scene.effectManager.spawnFloatingText("PHASE 2!", this.x, this.y, '#ff0000', 60);
            this.scene.effectManager.shake(10, 0.5); // Roar
        }
    }

    // ========== 攻击模式系统 ==========
    
    selectAttackPattern() {
        const patterns = ['SPREAD', 'LASER_SWEEP', 'MISSILE_SALVO', 'CIRCULAR'];
        this.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
        this.patternTimer = 0;
    }
    
    updateAttackPatterns(dt) {
        // 更新炮塔瞄准
        const player = this.scene.player;
        if (!player) return;
        
        // 主炮瞄准玩家
        this.modules.mainTurrets.forEach(turret => {
            if (turret.active) {
                const dx = player.x - (this.x + turret.x);
                const dy = player.y - (this.y + turret.y);
                turret.angle = Math.atan2(dy, dx);
            }
        });
    }
    
    executeAttackPattern(dt) {
        switch(this.currentPattern) {
            case 'SPREAD':
                this.executeSpreadAttack(dt);
                break;
            case 'LASER_SWEEP':
                this.executeLaserSweep(dt);
                break;
            case 'MISSILE_SALVO':
                this.executeMissileSalvo(dt);
                break;
            case 'CIRCULAR':
                this.executeCircularAttack(dt);
                break;
        }
    }
    
    executeSpreadAttack(dt) {
        // 扇形弹幕
        this.modules.mainTurrets.forEach(turret => {
            if (!turret.active) return;
            
            turret.lastFire += dt;
            if (turret.lastFire >= turret.fireInterval) {
                turret.lastFire = 0;
                
                // 发射5发散弹
                for (let i = -2; i <= 2; i++) {
                    const angle = turret.angle + i * 0.2;
                    this.spawnBossBullet(
                        this.x + turret.x, 
                        this.y + turret.y, 
                        angle, 
                        250, 
                        30
                    );
                }
            }
        });
    }
    
    executeLaserSweep(dt) {
        // 激光横扫（持续伤害）
        if (this.patternTimer === 0) {
            // 预警效果
            if (this.scene.effectManager) {
                this.scene.effectManager.spawnFloatingText('激光充能!', this.x, this.y - 100, '#ff0000', 30);
            }
        }
        
        if (this.patternTimer > 1.5) { // 1.5秒后发射
            this.modules.mainTurrets.forEach(turret => {
                if (turret.active && Math.random() < 0.3) { // 30%概率发射激光
                    // 激光是即时直线伤害
                    this.fireLaser(this.x + turret.x, this.y + turret.y, turret.angle);
                }
            });
        }
    }
    
    executeMissileSalvo(dt) {
        // 导弹齐射
        if (this.patternTimer % 1 < 0.1) { // 每秒发射一波
            const activeHangars = this.modules.hangars.filter(h => h.active);
            if (activeHangars.length > 0) {
                activeHangars.forEach(hangar => {
                    this.spawnHomingMissile(
                        this.x + hangar.x,
                        this.y + hangar.y
                    );
                });
            }
        }
    }
    
    executeCircularAttack(dt) {
        // 圆形弹幕
        if (this.patternTimer % 0.5 < 0.1) { // 每0.5秒一圈
            const bulletCount = 12 + this.phase * 4; // 阶段越高子弹越多
            for (let i = 0; i < bulletCount; i++) {
                const angle = (Math.PI * 2 / bulletCount) * i + this.patternTimer;
                this.spawnBossBullet(this.x, this.y, angle, 200, 20);
            }
        }
    }
    
    fireAllWeapons(dt) {
        // 狂暴状态：所有武器同时开火
        this.modules.mainTurrets.forEach(turret => {
            if (turret.active) {
                turret.lastFire += dt;
                if (turret.lastFire >= turret.fireInterval * 0.5) { // 射速翻倍
                    turret.lastFire = 0;
                    this.spawnBossBullet(
                        this.x + turret.x,
                        this.y + turret.y,
                        turret.angle + (Math.random() - 0.5) * 0.3,
                        300,
                        25
                    );
                }
            }
        });
        
        // 副炮也开火
        this.modules.secondaryGuns.forEach(gun => {
            if (gun.active) {
                gun.lastFire += dt;
                if (gun.lastFire >= gun.fireInterval * 0.5) {
                    gun.lastFire = 0;
                    const angle = Math.atan2(
                        this.scene.player.y - (this.y + gun.y),
                        this.scene.player.x - (this.x + gun.x)
                    );
                    this.spawnBossBullet(
                        this.x + gun.x,
                        this.y + gun.y,
                        angle,
                        350,
                        15
                    );
                }
            }
        });
    }
    
    // ========== 辅助方法 ==========
    
    spawnBossBullet(x, y, angle, speed, damage) {
        if (!this.scene) return;
        
        const bullet = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: damage,
            isEnemyBullet: true,
            active: true,
            width: 10,
            height: 10
        };
        
        // 添加到场景的子弹数组
        if (this.scene.bullets) {
            this.scene.bullets.push(bullet);
        }
    }
    
    spawnHomingMissile(x, y) {
        // 追踪导弹
        const missile = {
            x: x,
            y: y,
            damage: 40,
            isHoming: true,
            isEnemyBullet: true,
            active: true,
            speed: 180,
            width: 12,
            height: 12
        };
        
        if (this.scene.bullets) {
            this.scene.bullets.push(missile);
        }
    }
    
    fireLaser(x, y, angle) {
        // 激光攻击（即时直线伤害）
        if (!this.scene || !this.scene.player) return;
        
        const player = this.scene.player;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        
        // 简单的激光碰撞检测
        // 计算玩家到激光直线的距离
        const dist = Math.abs((player.x - x) * dy - (player.y - y) * dx);
        
        if (dist < 30) { // 激光宽度范围内
            // 对玩家造成伤害
            if (this.scene.onPlayerHit) {
                this.scene.onPlayerHit(5); // 激光持续伤害
            }
        }
        
        // 视觉效果
        if (this.scene.effectManager) {
            const endX = x + dx * 1000;
            const endY = y + dy * 1000;
            this.scene.effectManager.spawnLaserEffect(x, y, endX, endY, '#ff0000');
        }
    }
    
    updateHangars(dt) {
        this.modules.hangars.forEach(hangar => {
            if (!hangar.active) return;
            
            hangar.lastSpawn += dt;
            if (hangar.lastSpawn >= hangar.spawnInterval) {
                hangar.lastSpawn = 0;
                this.spawnMinion(hangar.spawnType, hangar.x, hangar.y + 30);
            }
        });
    }
    
    emergencySpawn() {
        // 紧急生成一波小怪
        this.modules.hangars.forEach(hangar => {
            if (hangar.active) {
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.spawnMinion(hangar.spawnType, hangar.x + (Math.random() - 0.5) * 40, hangar.y + 30);
                    }, i * 500);
                }
            }
        });
    }
    
    // ========== 伤害处理 ==========
    
    takeDamage(amount, hitLocation = null) {
        // 检查护盾
        if (this.modules.shield && this.modules.shield.active && this.modules.shield.hp > 0) {
            this.modules.shield.hp -= amount;
            this.modules.shield.lastDamageTime = 0;
            
            // 护盾击破
            if (this.modules.shield.hp <= 0) {
                this.modules.shield.hp = 0;
                this.modules.shield.active = false;
                this.invulnerable = false;
                this.onShieldBreak();
            }
            
            // 护盾击中效果
            if (this.scene.effectManager) {
                this.scene.effectManager.spawnFloatingText('护盾', this.x, this.y - 80, '#00ccff', 20);
            }
            return;
        }
        
        // 检查是否击中模块
        if (hitLocation) {
            const module = this.getModuleAtLocation(hitLocation);
            if (module && module.active) {
                module.hp -= amount;
                if (module.hp <= 0) {
                    module.hp = 0;
                    module.active = false;
                    this.onModuleDestroyed(module);
                }
                return;
            }
        }
        
        // 对本体造成伤害
        let actualDamage = amount;
        if (this.modules.core && this.modules.core.exposed) {
            actualDamage *= this.modules.core.damageMultiplier;
        }
        
        super.takeDamage(actualDamage);
    }
    
    getModuleAtLocation(location) {
        // 根据击中位置返回对应模块
        for (let turret of this.modules.mainTurrets) {
            if (Math.abs(location.x - turret.x) < 30 && Math.abs(location.y - turret.y) < 30) {
                return turret;
            }
        }
        for (let gun of this.modules.secondaryGuns) {
            if (Math.abs(location.x - gun.x) < 20 && Math.abs(location.y - gun.y) < 20) {
                return gun;
            }
        }
        for (let hangar of this.modules.hangars) {
            if (Math.abs(location.x - hangar.x) < 40 && Math.abs(location.y - hangar.y) < 30) {
                return hangar;
            }
        }
        return null;
    }
    
    onShieldBreak() {
        console.log(`${this.name}护盾被击破！`);
        if (this.scene.effectManager) {
            this.scene.effectManager.spawnFloatingText('护盾崩溃!', this.x, this.y - 100, '#ff0000', 50);
            this.scene.effectManager.shake(15, 0.8);
            this.scene.effectManager.spawnExplosion(this.x, this.y, 'large');
        }
        
        // 所有模块暴露
        this.invulnerable = false;
    }
    
    onModuleDestroyed(module) {
        console.log(`${this.name}模块被摧毁`);
        if (this.scene.effectManager) {
            this.scene.effectManager.spawnExplosion(this.x + module.x, this.y + module.y, 'medium');
        }
        
        // 检查是否所有机库都被摧毁
        const activeHangars = this.modules.hangars.filter(h => h.active).length;
        if (activeHangars === 0) {
            // 停止生成，暴露核心
            this.modules.core.exposed = true;
            if (this.scene.effectManager) {
                this.scene.effectManager.spawnFloatingText('核心暴露!', this.x, this.y, '#ff0000', 60);
            }
        }
    }
    
    // ========== 阶段系统 ==========
    
    checkPhaseTransition() {
        const hpPercent = this.hp / this.maxHp;
        
        if (this.phase === 1 && hpPercent <= this.phaseThresholds[1]) {
            this.enterPhase(2);
        } else if (this.phase === 2 && hpPercent <= this.phaseThresholds[2]) {
            this.enterPhase(3);
        }
    }
    
    enterPhase(p) {
        this.phase = p;
        console.log(`${this.name}进入第${p}阶段!`);
        
        // 阶段转换效果
        if (this.scene.effectManager) {
            this.scene.effectManager.spawnFloatingText(`第${p}阶段`, this.x, this.y - 120, '#ff0000', 60);
            this.scene.effectManager.shake(10 + p * 2, 0.5);
        }
        
        // 阶段特殊处理
        switch(p) {
            case 2:
                // 第二阶段：护盾重新充能（部分）
                if (this.modules.shield) {
                    this.modules.shield.hp = this.modules.shield.maxHp * 0.5;
                    this.modules.shield.active = true;
                    this.invulnerable = true;
                }
                // 射速提升
                this.modules.mainTurrets.forEach(t => {
                    t.fireInterval *= 0.8;
                });
                break;
                
            case 3:
                // 第三阶段：狂暴
                this.aiState = 'ENRAGE';
                this.aiStateDuration = 10;
                // 持续生成
                this.emergencySpawn();
                this.emergencySpawn();
                break;
        }
    }
    
    // ========== 渲染 ==========
    
    render(ctx) {
        super.render(ctx);
        
        // 渲染护盾
        if (this.modules.shield && this.modules.shield.active && this.modules.shield.hp > 0) {
            const shieldPercent = this.modules.shield.hp / this.modules.shield.maxHp;
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + shieldPercent * 0.4})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.modules.shield.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 护盾脉冲效果
            ctx.fillStyle = `rgba(0, 200, 255, ${0.1 + Math.sin(this.time * 3) * 0.05})`;
            ctx.fill();
        }
        
        // 渲染模块
        this.renderModules(ctx);
        
        // 渲染血条（包含护盾）
        this.renderBossUI(ctx);
    }
    
    renderModules(ctx) {
        // 主炮
        this.modules.mainTurrets.forEach(turret => {
            if (turret.active) {
                ctx.fillStyle = '#4a5568';
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // 炮管
                ctx.strokeStyle = '#718096';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(turret.x, turret.y);
                ctx.lineTo(
                    turret.x + Math.cos(turret.angle) * 25,
                    turret.y + Math.sin(turret.angle) * 25
                );
                ctx.stroke();
            }
        });
        
        // 副炮
        this.modules.secondaryGuns.forEach(gun => {
            if (gun.active) {
                ctx.fillStyle = '#3d4f5f';
                ctx.beginPath();
                ctx.arc(gun.x, gun.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // 机库
        this.modules.hangars.forEach(hangar => {
            if (hangar.active) {
                ctx.fillStyle = '#2d3748';
                ctx.fillRect(hangar.x - 20, hangar.y - 15, 40, 30);
                ctx.strokeStyle = '#4a5568';
                ctx.strokeRect(hangar.x - 20, hangar.y - 15, 40, 30);
                
                // 机库发光
                ctx.fillStyle = `rgba(255, 100, 100, ${0.3 + Math.sin(this.time * 2) * 0.2})`;
                ctx.fillRect(hangar.x - 15, hangar.y - 10, 30, 20);
            }
        });
        
        // 核心（暴露时）
        if (this.modules.core && this.modules.core.exposed) {
            ctx.fillStyle = `rgba(255, 0, 100, ${0.6 + Math.sin(this.time * 5) * 0.2})`;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderBossUI(ctx) {
        // 屏幕顶部的大血条
        const barWidth = 400;
        const barHeight = 20;
        const x = -barWidth / 2;
        const y = -this.height / 2 - 50;
        
        ctx.save();
        
        // BOSS名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} - 阶段${this.phase}`, 0, y - 10);
        
        // 护盾条（如果有）
        if (this.modules.shield && this.modules.shield.active && this.modules.shield.hp > 0) {
            const shieldPercent = this.modules.shield.hp / this.modules.shield.maxHp;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(x, y - 25, barWidth, 8);
            ctx.fillStyle = '#00ccff';
            ctx.fillRect(x, y - 25, barWidth * shieldPercent, 8);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y - 25, barWidth, 8);
        }
        
        // 主血条
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const hpPercent = this.hp / this.maxHp;
        // 根据阶段变色
        let hpColor = '#ff0000';
        if (this.phase === 2) hpColor = '#ff6600';
        if (this.phase === 3) hpColor = '#ff00ff';
        
        ctx.fillStyle = hpColor;
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // 血量和阶段文字
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(`${Math.floor(this.hp)}/${this.maxHp}`, 0, y + 14);
        
        ctx.restore();
    }
}
