import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import { audioManager } from '../manager/audioManager.js';
import { metaProgression } from '../manager/metaProgression.js';
import Player from '../object/faction/player/Player.js';
import Enemy from '../object/faction/enemy/Enemy.js';
import Bullet from '../object/bullet.js';
import Loot from '../object/item/loot.js';
import WaveManager from '../manager/waveManager.js';
import Mothership from '../object/Mothership.js';

import RenderUtils from '../utils/renderUtils.js';

import Button from '../object/ui/Button.js';
import Joystick from '../object/ui/Joystick.js';
import Wreckage from '../object/item/wreckage.js';
import SupplyCrate from '../object/item/SupplyCrate.js';
import Obstacle from '../object/obstacle.js';
import EffectManager from '../manager/effectManager.js';
import SkillManager from '../system/roguelite/SkillManager.js';
import SkillSelectionModal from '../object/ui/SkillSelectionModal.js';

export default class BattleScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);

        // Effects
        this.explosions = [];
        this.toasts = [];

        // Shadow Challenge Wreckage
        this.wreckage = null;
        const savedWreck = dataManager.getWreck();
        if (savedWreck) {
            // Spawn it
            this.wreckage = new Wreckage(savedWreck.x, savedWreck.y, savedWreck.gold);
            console.log('Spawning Wreckage at', savedWreck.x, savedWreck.y);
        }
        // Entities
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.loots = [];

        // Systems
        this.waveManager = new WaveManager(this);

        // Stats
        this.score = 0;
        this.goldGained = 0;
        this.lowHpHintCooldown = 0;
        this.overheatHintCooldown = 0;

        // UI Components
        this.btnPause = null;
        this.joystick = null;
        this.uiComponents = [];
        this.isSelectingSkill = false;
        this.skillModal = null;

        // Menu & Pause System
        this.isPaused = false;
        this.doomsdayActive = false;
        this.doomsdayTimer = 0;

        // ... (Keep existing props like toast)
        // Upgrade to array for multiple effects
        this.floatingTexts = [];
        this.lastGold = 0;

        // 高度层控制 - 已移除
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isVerticalSwipe = false;

        // 引导提示节流，避免刷屏
        this.lowHpHintCooldown = 0;
        this.overheatHintCooldown = 0;
    }

    enter() {
        console.log('BattleScene: Enter');

        // Reset State
        this.isPaused = false;
        this.bullets = [];
        this.enemies = [];
        this.loots = [];
        this.supplyCrates = [];
        this.obstacles = [];
        this.score = 0;
        this.goldGained = 0;
        this.lowHpHintCooldown = 0;
        this.overheatHintCooldown = 0;

        // Effects
        this.effectManager = new EffectManager(this);

        // Mothership - 母舰保护系统（核心叙事锚点）
        this.mothership = new Mothership(this);

        // 修复：黑匣子位置防重叠检查
        if (this.wreckage) {
            const dx = this.wreckage.x - this.mothership.x;
            const dy = this.wreckage.y - this.mothership.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 如果黑匣子距离母舰太近（小于350像素），强制将其移开
            if (dist < 350) {
                console.log('调整黑匣子位置以避免与母舰重叠');
                // 强制移动到屏幕上半部分的两侧
                this.wreckage.y = 200 + Math.random() * 100; // 屏幕上方 200-300px 处
                
                // 随机放左边或右边，避开中轴线
                if (Math.random() > 0.5) {
                    this.wreckage.x = 50 + Math.random() * 100; // 左侧
                } else {
                    this.wreckage.x = GameConfig.Screen.width - 150 + Math.random() * 100; // 右侧
                }
                console.log(`黑匣子新位置: ${this.wreckage.x}, ${this.wreckage.y}`);
            }
        }

        // Roguelite
        this.skillManager = new SkillManager(this);

        this.magnetRange = 150; // Default pickup range

        // 阶段性成就提示系统
        this.stageMilestones = [30, 60]; // 30秒和60秒显示阶段性提示
        this.achievedMilestones = [];

        // 1. Init Pause Button (Top-Left)
        const safeArea = GameConfig.SafeArea || { top: 20, left: 20, height: 32 };
        const safeTop = safeArea.top || 20;
        const safeLeft = (safeArea.left !== undefined) ? safeArea.left : 20;
        const capsuleH = safeArea.height || 32;

        this.btnPause = new Button(safeLeft, safeTop, capsuleH, capsuleH, '||');
        this.btnPause.setStyle('rgba(0,0,0,0.5)', '#fff', 20, 10);
        this.btnPause.setCallback(() => {
            this.togglePause();
        });

        // 2. Init Joystick (Dynamic - Left Side)
        const logicH = this.sceneManager.game.logicHeight;
        this.joystick = new Joystick(
            150,                           // X: Left side base position
            logicH - 150,                  // Y: Bottom
            80,                            // Radius
            true                           // Floating: True (Dynamic)
        );

        // Joystick first (Background), Pause second (Foreground)
        this.uiComponents = [this.joystick, this.btnPause];

        // 3. HUD Positioning
        this.hudY = safeTop + capsuleH + 30;

        // 4. Create Player
        this.player = new Player(GameConfig.Screen.width / 2, logicH - 150, logicH);
        this.player.refreshStats();
        
        // 5. 高度按钮回调 - 已移除


        // 6. Start Survival Mode
        this.waveManager.startSurvival();
        
        // 游戏开始提示
        this.spawnFloatingText(
            '保护母舰90秒！',
            GameConfig.Screen.width / 2,
            300,
            '#00ccff',
            36
        );
        this.spawnFloatingText(
            '左下摇杆移动',
            GameConfig.Screen.width / 2,
            350,
            '#ffffff',
            26
        );
        this.spawnFloatingText(
            '点击右下A键释放特技',
            GameConfig.Screen.width / 2,
            390,
            '#ffffff',
            26
        );
        
        setTimeout(() => {
            this.spawnFloatingText(
                '敌人即将来袭！',
                GameConfig.Screen.width / 2,
                350,
                '#ff3333',
                28
            );
        }, 2000);
        
        console.log('=== GAME STARTED ===');
        console.log('Mothership position:', this.mothership.x, this.mothership.y);
        console.log('Player position:', this.player.x, this.player.y);
    }

    exit() {
        this.bullets = [];
        this.enemies = [];
        this.loots = [];
        this.supplyCrates = [];
        this.obstacles = [];
        this.floatingTexts = [];
        
        // 清理效果管理器
        if (this.effectManager) {
            this.effectManager.particles = [];
            this.effectManager.floatingTexts = [];
            this.effectManager.trails = [];
            this.effectManager.comboCount = 0;
            this.effectManager.comboTimer = 0;
            this.effectManager.shakeX = 0;
            this.effectManager.shakeY = 0;
        }
        
        console.log('BattleScene: Exited and cleaned up');
    }

    update(dt) {
        if (this.isSelectingSkill && this.skillModal) {
            this.skillModal.update(dt);
            return;
        }

        if (this.isPaused) return;

        this.lowHpHintCooldown = Math.max(0, this.lowHpHintCooldown - dt);
        this.overheatHintCooldown = Math.max(0, this.overheatHintCooldown - dt);

        // 1. Update Background (Scroll)
        this.bgY = (this.bgY || 0) + 100 * dt;
        if (this.bgY >= GameConfig.Screen.height) this.bgY = 0;

        // 2. Update Joystick Player Control
        if (this.player && this.joystick) {
            const dir = this.joystick.getDirection();
            // DEBUG: Log direction if not zero
            if (dir.x !== 0 || dir.y !== 0) {
                // console.log(`BattleScene: Move Dir=(${dir.x.toFixed(2)}, ${dir.y.toFixed(2)})`);
            }

            if (dir.x !== 0 || dir.y !== 0) {
                // Determine speed (Base speed or config)
                // Determine speed (Base speed or config)
                // Use player's speed stat (default around 400-500)
                // BaseFighter speed is small (10), need scaling or fix BaseFighter speed
                // Let's assume player.speed is pixels/sec.
                // If player.speed is 10 (from BaseFighter), we need to scale it or update BaseFighter.
                // Let's use a multiplier for now to be safe, or direct if Player.js updated speed to ~400.
                // Currently BaseFighter has speed=10. Player has this.speed = this.fighter.speed.
                // Let's multiply by 40 for now to match previous feel.
                const speed = this.player.speed;
                this.player.x += dir.x * speed * dt;
                this.player.y += dir.y * speed * dt;

                // Boundary Check
                if (this.player.x < 0) this.player.x = 0;
                if (this.player.x > GameConfig.Screen.width) this.player.x = GameConfig.Screen.width;
                if (this.player.y < 0) this.player.y = 0;
                if (this.player.y > this.sceneManager.game.logicHeight) this.player.y = this.sceneManager.game.logicHeight;
            }
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.y -= 30 * dt; // Float up
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Monitor Gold Change for Visual Effect
        const timeGold = Math.floor(this.waveManager.levelTime / 10);
        const scoreGold = Math.floor(this.score / 100);
        const currentGold = timeGold + scoreGold;

        if (currentGold > this.lastGold) {
            const diff = currentGold - this.lastGold;
            // Spawn Effect near HUD (Top Left)
            this.spawnFloatingText(`+${diff}`, 100, this.hudY, '#ffd700', 30);
            this.lastGold = currentGold;
        }

        if (this.gameEnded) return;

        // Update Mothership (母舰系统)
        if (this.mothership) {
            this.mothership.update(dt);
            
            // Low HP Warning
            if (this.mothership.isAlive && this.mothership.hp / this.mothership.maxHp < 0.3) {
                if (!this.mothershipLowHpTimer) this.mothershipLowHpTimer = 0;
                this.mothershipLowHpTimer += dt;
                if (this.mothershipLowHpTimer > 2.0) {
                    this.mothershipLowHpTimer = 0;
                    this.spawnFloatingText('⚠ 母舰护盾紧急!', this.mothership.x, this.mothership.y - 120, '#ff0000', 36);
                    if (this.effectManager) this.effectManager.shake(5, 0.5);
                }
            }
        }

        // Update Wave Manager
        this.waveManager.update(dt);

        if (this.mothership && this.mothership.isAlive && this.waveManager.levelTime >= 90) {
            this.endGame(true);
            return;
        }

        // 阶段性成就提示检查
        const currentTime = this.waveManager.levelTime;
        this.stageMilestones.forEach(milestone => {
            if (currentTime >= milestone && !this.achievedMilestones.includes(milestone)) {
                this.achievedMilestones.push(milestone);
                // 显示阶段性成就
                if (this.effectManager) {
                    const messages = {
                        30: '🎉 第1阶段完成！坚持住！',
                        60: '🔥 第2阶段完成！最后冲刺！'
                    };
                    this.effectManager.spawnFloatingText(
                        messages[milestone],
                        GameConfig.Screen.width / 2,
                        200,
                        '#f39c12',
                        32
                    );
                    // 屏幕震动效果
                    this.effectManager.shake(5, 0.3);
                }
                // 自动升级技能
                if (this.skillManager) {
                    this.skillManager.addExp(this.skillManager.expToNext);
                }
            }
        });

        // Update Player and spawn bullets
        if (this.player) {
            const newBullets = this.player.update(dt);
            if (newBullets.length > 0) this.bullets.push(...newBullets);

            const hpRate = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 1;
            if (hpRate < 0.3 && this.lowHpHintCooldown <= 0) {
                this.lowHpHintCooldown = 6.0;
                this.spawnFloatingText('⚠ 战机受损严重，优先走位！', GameConfig.Screen.width / 2, 320, '#ff6b6b', 24);
            }

            const isOverheated = Date.now() < this.player.overheatedUntil;
            if (isOverheated && this.overheatHintCooldown <= 0) {
                this.overheatHintCooldown = 2.5;
                if (this.effectManager) {
                    this.effectManager.spawnEnergyWarning(this.player.x, this.player.y);
                }
            }
        }

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.update(dt);
            if (!b.active) this.bullets.splice(i, 1);
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            e.update(dt);

            if (!e.active) {
                if (e.hp <= 0) {
                    this.score += e.score || 10;
                    this.spawnLoot(e.x, e.y);
                }
                this.enemies.splice(i, 1);
            }
        }

        // Update Loot
        for (let i = this.loots.length - 1; i >= 0; i--) {
            let l = this.loots[i];
            // Check pickup (returns true if picked)
            if (l.active) {
                // Determine logic for magnet
                const dx = this.player.x - l.x;
                const dy = this.player.y - l.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.magnetRange) {
                    l.isMagnetized = true;
                    l.x += dx * 0.15;
                    l.y += dy * 0.15;
                if (dist < 30) {
                        l.active = false;
                        // Pickup Effect
                        if (l.type === 'gold') {
                            dataManager.addGold(10);
                            this.goldGained += 10;
                            audioManager.play('coin');
                        } else if (l.type === 'exp') {
                            this.addExp(10);
                        } else if (l.type === 'energy') {
                            // 能量电池：恢复50能量
                            if (this.player) {
                                this.player.overchargeEnergy(50);
                                this.spawnFloatingText('能量+50!', this.player.x, this.player.y - 40, '#ffcc00', 25);
                                audioManager.play('coin'); // 临时用金币音效
                            }
                        }
                    }
                } else {
                    l.update(); // Normal physics
                }
            }
            if (!l.active) this.loots.splice(i, 1);
        }

        this.checkCollisions();
    }

    spawnLoot(x, y, enemyType = 'normal') {
        // 基础掉落：经验球
        this.loots.push(new Loot(x, y, 'exp'));
        
        // 精英怪和BOSS有概率掉落能量电池
        if (enemyType === 'elite' || enemyType === 'boss') {
            if (Math.random() < 0.4) { // 40%概率
                this.loots.push(new Loot(x, y, 'energy'));
            }
        }
    }

    spawnEnemyBullet(x, y, angle, speed, config = {}) {
        // Damage is usually handled by enemy config, but let's pass it or default
        // Wait, the signature in weapon.js is: spawnEnemyBullet(x, y, angle, speed)
        // I should probably stick to that or update weapon.js first.
        // Actually, let's update weapon.js to pass config as well.
        // But for now, let's define it flexibly.

        // However, standard Bullet constructor is: (x, y, angle, speed, damage, isEnemy, config)
        // weapon.js calls: spawnEnemyBullet(x, y, angle, speed)
        // So I need to determine damage here or allow weapon.js to pass it.
        // The current weapon.js hardcodes speed but NOT damage (it seems?). 
        // Wait, weapon.js: spawnEnemyBullet(enemy.x, ..., 0, 300)
        // It doesn't pass damage!

        // I should update weapon.js to pass damage too, or use a default.
        // Let's set a default damage for now, or assume config has it.

        const damage = config.damage || 10;
        const bounds = {
            minX: -100,
            maxX: GameConfig.Screen.width + 100,
            minY: -100,
            maxY: (this.sceneManager.game.logicHeight || GameConfig.Screen.height) + 100
        };
        const bulletConfig = { ...config, bounds };
        const bullet = new Bullet(x, y, angle, speed, damage, true, bulletConfig);
        this.bullets.push(bullet);
    }

    spawnSupplyCrate() {
        // Random Position
        const x = Math.random() * (GameConfig.Screen.width - 100) + 50;
        const y = Math.random() * (this.sceneManager.game.logicHeight - 200) + 100;

        // Calculate dynamic valye
        // Time Bonus: 100 Gold per minute roughly
        // Score Bonus: 1% of score?
        const baseValue = 50;
        const timeBonus = Math.floor(this.waveManager.levelTime / 2); // 0.5 per sec -> 30 per min? User said "dynamic"
        const scoreBonus = Math.floor(this.score / 50);
        const value = baseValue + timeBonus + scoreBonus;

        this.supplyCrates.push(new SupplyCrate(x, y, value));

        this.spawnFloatingText('补给已抵达!', x, y - 50, '#ffcc00', 40);
        audioManager.play('upgrade'); // Use upgrade sound for notify
        console.log(`Supply Drop: ${value} Gold at ${x},${y}`);
    }

    spawnObstacle() {
        const type = Math.random() > 0.7 ? 'ASTEROID_L' : 'ASTEROID_M';
        const x = Math.random() * GameConfig.Screen.width;
        this.obstacles.push(new Obstacle(x, -100, type));
    }

    endGame(victory = false) {
        if (this.gameEnded) return;
        this.gameEnded = true;
        
        if (victory) {
            // 胜利 - 母舰成功跃迁
            console.log('VICTORY - 母舰跃迁成功！');
            this.effectManager.spawnFloatingText(
                '跃迁成功！人类得救了！', 
                GameConfig.Screen.width/2, 
                GameConfig.Screen.height/2, 
                '#00ff00', 
                50
            );
        } else {
            // 失败
            console.log('DEFEAT');
        }
        
        // Calculate Rewards
        // 1. Time Bonus: 1 Gold per 10 Seconds (User Request)
        // Helps getting rewards for short runs (< 1 min)
        const timeGold = Math.floor(this.waveManager.levelTime / 10);

        // 2. Score Bonus: 1 Gold per 100 score
        const scoreGold = Math.floor(this.score / 100);

        const totalGold = timeGold + scoreGold;

        // Calculate time in minutes for console log
        const timeMinutes = Math.floor(this.waveManager.levelTime / 60);
        console.log(`Game Over. Time: ${timeMinutes}m, Score: ${this.score}, Gold: ${totalGold}`);

        // Shadow Challenge: Leave a wreckage for next run
        // Reward for next run = 50% of this run's earnings
        const wreckageGold = Math.floor(totalGold * 0.5);
        if (wreckageGold > 0 && this.player) {
            dataManager.saveWreck(this.player.x, this.player.y, wreckageGold);
        }

        // 记录局外成长
        const gameResult = {
            victory: victory,
            kills: this.score / 10, // 估算击杀数（假设每个敌人10分）
            survivalTime: this.waveManager.levelTime,
            playerHpPercent: this.player ? this.player.hp / this.player.maxHp : 0,
            blueprintsCommon: victory ? 30 + Math.floor(this.waveManager.levelTime / 10) : 10,
            blueprintsRare: victory ? 5 + Math.floor(this.waveManager.levelTime / 60) : 2,
            blueprintsLegendary: victory ? 1 : 0
        };
        metaProgression.recordGameEnd(gameResult);
        
        // 检查新解锁
        const newUnlocks = metaProgression.checkAllUnlocks();
        if (newUnlocks.length > 0) {
            newUnlocks.forEach(fighterId => {
                this.effectManager.spawnFloatingText(
                    `解锁新战机: ${fighterId}!`, 
                    GameConfig.Screen.width/2, 
                    GameConfig.Screen.height/2 - 100, 
                    '#ffd700', 
                    40
                );
            });
        }

        // Save
        dataManager.addGold(totalGold);

        // 延迟后显示结果界面
        setTimeout(() => {
            this.sceneManager.switchScene('RESULT', {
                victory: victory,
                score: this.score,
                gold: totalGold,
                timeSeconds: Math.floor(this.waveManager.levelTime),
                fighterId: this.player ? this.player.fighterId : null,
                buildSummary: this.skillManager ? this.skillManager.getBuildSummary() : null
            });
        }, 2000);
    }

    checkCollisions() {
        // 1. Player Bullets vs Enemies
        this.bullets.forEach(b => {
            if (!b.active) return;
            if (b.isEnemy) return;
            this.enemies.forEach(e => {
                if (!e.active) return;
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Collision Detection
                if (distance < (b.width + e.width) / 2) {
                    b.active = false;
                    
                    // Check execution threshold
                    const hpPercent = e.hp / e.maxHp;
                    if (this.player.executionThreshold && hpPercent <= this.player.executionThreshold) {
                        e.hp = 0; // Instant kill
                        this.effectManager.spawnFloatingText('处决!', e.x, e.y - 50, '#ff0000', 30);
                        this.effectManager.hitStop(0.05);
                    } else {
                        if (e.isBoss && typeof e.takeDamage === 'function') {
                            e.takeDamage(b.damage, { x: b.x - e.x, y: b.y - e.y });
                        } else {
                            e.takeDamage(b.damage);
                        }
                    }

                    // Damage Text & Effects
                    if (this.effectManager) {
                        const isCrit = Math.random() < 0.1;
                        this.effectManager.spawnDamageText(e.x, e.y - 30, b.damage, isCrit);
                        
                        // Enhanced hit impact effect
                        this.effectManager.spawnHitImpact(b.x, b.y, '#ff6600');
                    }

                    if (e.hp <= 0) {
                        e.active = false;
                        
                        // Score & Loot
                        let s = e.score || 10;
                        if (this.doomsdayActive) s *= 2;
                        this.score += s;
                        
                        // 根据敌人类型掉落
                        let enemyType = 'normal';
                        if (e.isBoss) enemyType = 'boss';
                        else if (e.isElite) enemyType = 'elite';
                        else if (s >= 50) enemyType = 'strong';
                        
                        this.spawnLoot(e.x, e.y, enemyType);
                        audioManager.play('explosion');

                        // Enhanced kill effects (Juice)
                        if (this.effectManager) {
                            // Determine explosion size
                            let size = 'small';
                            if (e.isElite) size = 'large';
                            else if (e.isBoss) size = 'boss';
                            else if (s >= 50) size = 'medium';
                            
                            this.effectManager.spawnExplosion(e.x, e.y, size);
                            this.effectManager.shake(size === 'boss' ? 15 : (size === 'large' ? 8 : 3), 0.2);
                            
                            // Hit stop for big kills
                            if (size === 'large' || size === 'boss') {
                                this.effectManager.hitStop(0.05);
                            }
                            
                            // Add combo
                            this.effectManager.addCombo();
                        }
                    }
                }
            });

            // Bullet vs Wreckage
            if (this.wreckage && this.wreckage.active) {
                const dist = Math.sqrt((b.x - this.wreckage.x) ** 2 + (b.y - this.wreckage.y) ** 2);
                if (dist < 60) {
                    b.active = false;
                    this.wreckage.takeDamage(b.damage);
                    if (!this.wreckage.active) {
                        // Show reward toast
                        this.spawnFloatingText(`回收黑匣子! +${this.wreckage.gold}金币`, GameConfig.Screen.width / 2, 150, '#ff9f43', 40);
                    }
                }
            }
        });

        // Enemy Bullets vs Player / Mothership
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (!b.active || !b.isEnemy) continue;

            if (this.player && this.player.hp > 0) {
                const dx = b.x - this.player.x;
                const dy = b.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < (b.width + this.player.width) / 2.2) {
                    b.active = false;
                    const didHit = typeof this.player.takeDamage === 'function' ? this.player.takeDamage(b.damage) : true;
                    if (didHit) {
                        if (this.effectManager) {
                            this.effectManager.spawnDamageText(this.player.x, this.player.y - 30, `-${b.damage}`, true);
                            this.effectManager.shake(6, 0.12);
                        }
                        if (this.player.hp <= 0) {
                            this.endGame();
                        }
                    }
                    continue;
                }
            }

            if (this.mothership && this.mothership.isAlive) {
                const dxm = b.x - this.mothership.x;
                const dym = b.y - this.mothership.y;
                const distm = Math.sqrt(dxm * dxm + dym * dym);
                if (distm < (b.width + this.mothership.width) / 2.2) {
                    b.active = false;
                    this.mothership.takeDamage(b.damage);
                }
            }
        }

        // 2. Supply Crates vs Player
        for (let i = this.supplyCrates.length - 1; i >= 0; i--) {
            let crate = this.supplyCrates[i];
            crate.update();
            if (!crate.active) {
                this.supplyCrates.splice(i, 1);
                continue;
            }

            // Check pickup
            if (this.player && this.player.hp > 0) {
                const dx = this.player.x - crate.x;
                const dy = this.player.y - crate.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60) {
                    crate.active = false;
                    dataManager.addGold(crate.goldValue);
                    audioManager.play('coin'); // Or distinct sound
                    this.goldGained += crate.goldValue; // Track for end game if needed?

                    this.spawnFloatingText(`+${crate.goldValue} 金币`, GameConfig.Screen.width / 2, 150, '#ffcc00', 40);
                }
            }
        }

        // 2. Enemies vs Player (Body Collision)
        if (this.player && this.player.hp > 0) {
            this.enemies.forEach(e => {
                if (!e.active) return;
                const dx = e.x - this.player.x;
                const dy = e.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Simple circle collision (approx)
                if (distance < (e.width + this.player.width) / 2.5) {
                    // Collision!
                    e.takeDamage(1000); // Enemy likely dies crashing into player
                    const didHit = typeof this.player.takeDamage === 'function' ? this.player.takeDamage(20) : true;
                    if (didHit) {
                        console.log(`Player Hit! HP: ${this.player.hp}`);
                    }

                    // Heavy Shake & Flash
                    if (this.effectManager && didHit) {
                        this.effectManager.shake(20, 0.3);
                        this.effectManager.spawnDamageText(this.player.x, this.player.y, "-20", true);
                    }

                    if (didHit && this.player.hp <= 0) {
                        this.endGame();
                    }
                }
            });
        }

        // 3. Enemies vs Mothership
        if (this.mothership && this.mothership.isAlive) {
            this.enemies.forEach(e => {
                if (!e.active) return;
                const dx = e.x - this.mothership.x;
                const dy = e.y - this.mothership.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < (e.width + this.mothership.width) / 2) {
                    // 敌人撞击母舰！
                    e.active = false;
                    this.mothership.takeDamage(e.damage * 2);
                    
                    // 强烈视觉反馈
                    if (this.effectManager) {
                        this.effectManager.shake(20, 0.5);
                        this.effectManager.spawnFloatingText(
                            '母舰受击!', 
                            this.mothership.x, 
                            this.mothership.y - 100, 
                            '#ff0000', 
                            40
                        );
                    }
                }
            });
        }
    }

    renderBackground(ctx) {
        // Draw Stars
        ctx.save();
        const height = this.sceneManager.game.logicHeight;
        this.stars.forEach(star => {
            const y = (star.y + (this.bgY || 0) * star.speed) % height;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
            ctx.beginPath();
            ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    renderGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const width = GameConfig.Screen.width;
        const height = this.sceneManager.game.logicHeight;

        // Vertical Lines
        for (let x = 0; x < width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal Lines (Scrolling)
        const offset = (this.bgY || 0) % 100;
        for (let y = offset; y < height; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    render(ctx) {
        const width = GameConfig.Screen.width;
        const height = this.sceneManager.game.logicHeight;

        // --- WORLD LAYER (Affected by Shake) ---
        ctx.save();
        if (this.effectManager && (this.effectManager.shakeX !== 0 || this.effectManager.shakeY !== 0)) {
            ctx.translate(this.effectManager.shakeX, this.effectManager.shakeY);
        }

        // Background (Scrolling Starfield)
        ctx.fillStyle = '#0f1020'; // Deep Space
        ctx.fillRect(0, 0, width, height);

        // Draw Stars (Procedural)
        if (!this.stars) {
            this.stars = [];
            for (let i = 0; i < 50; i++) {
                this.stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 2,
                    speed: Math.random() * 0.5 + 0.5
                });
            }
        }

        // The original star drawing logic is now likely moved into renderBackground
        this.renderBackground(ctx);

        // Grid (Optional)
        this.renderGrid(ctx);

        // Wreckage
        if (this.wreckage && this.wreckage.active) {
            this.wreckage.render(ctx);
        }

        // Draw Entities
        this.loots.forEach(o => o.render(ctx));
        this.obstacles.forEach(o => o.render(ctx));
        this.supplyCrates.forEach(o => o.render(ctx));
        this.enemies.forEach(o => o.render(ctx));
        this.bullets.forEach(o => o.render(ctx));
        if (this.player) this.player.render(ctx);
        
        // Render Mothership (母舰 - 玩家保护的目标)
        if (this.mothership) {
            this.mothership.render(ctx);
        }

        // Render UI Components
        this.uiComponents.forEach(c => c.render(ctx));

        // Render Combo UI
        if (this.effectManager) {
            // 连击UI已移除（界面简化）
        }

        // ========== 能量系统UI ==========
        // 玩家能量条和副武器技能按钮
        if (this.player) {
            this.player.renderUI(ctx, GameConfig.Screen.width, this.sceneManager.game.logicHeight);
            
            // 副武器技能按钮（右下角）
            this.renderSecondarySkillButton(ctx);
        }

        // 母舰倒计时和状态
        if (this.mothership && this.mothership.isAlive) {
            this.mothership.renderCountdownUI(ctx, width, height);
        }

        // Render Battle UI (Top HUD) - 简化版：只保留倒计时
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';

        // Survival Timer (Center Top) - 核心元素1：倒计时
        const t = this.waveManager.levelTime || 0;
        const remainingTime = Math.max(0, 90 - t);
        const m = Math.floor(remainingTime / 60).toString().padStart(2, '0');
        const s = Math.floor(remainingTime % 60).toString().padStart(2, '0');
        
        // 最后20秒变红色警示
        if (remainingTime <= 20) {
            ctx.fillStyle = '#e74c3c';
            // 添加脉动效果
            const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 20 * pulse;
        } else {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
        }
        
        ctx.fillText(`${m}:${s}`, GameConfig.Screen.width / 2, this.hudY + 30); // Lowered slightly
        
        // 倒计时标签
        ctx.font = '14px Arial';
        ctx.fillStyle = '#aaa';
        ctx.shadowBlur = 0;
        ctx.fillText('保护母舰', GameConfig.Screen.width / 2, this.hudY + 60); // Spaced out

        this.renderTopStatusPanel(ctx, width);

        const directorHint = this.waveManager && this.waveManager.getCurrentHint ? this.waveManager.getCurrentHint() : null;
        if (directorHint) {
            this.renderDirectorHint(ctx, directorHint, width);
        }

        const boss = this.enemies.find(en => en && en.active && en.isBoss);
        if (boss) {
            this.renderBossUI(ctx, boss, width, height);
        }

        // Render Pause Modal
        if (this.isPaused) {
            this.renderPauseModal(ctx, width, height);
        }

        // Render Floating Texts
        this.floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, ft.life); // Fade out
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px Arial`;
            // ctx.textAlign = 'center'; // Based on x key
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 2;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });

        // 技能选择已改为自动模式，不显示弹窗
        if (this.isSelectingSkill && this.skillModal) {
            this.skillModal.render(ctx);
        }
        
        // 恢复画布状态（对应render方法开头的ctx.save）
        ctx.restore();
    }

    /**
     * 显示技能选择界面（SkillManager调用）
     */
    showSkillSelection(options) {
        console.log("Scene: Show Skill Selection");
        this.isPaused = true;
        this.isSelectingSkill = true;

        const skillOptions = options || this.skillManager.getSkillOptions();
        const playerSkills = this.skillManager ? this.skillManager.acquiredSkills : [];

        this.skillModal = new SkillSelectionModal(
            this,
            skillOptions,
            (skillId) => this.onSkillSelected(skillId),
            playerSkills
        );
    }

    /**
     * 兼容旧方法名
     */
    showLevelUp() {
        this.showSkillSelection(this.skillManager ? this.skillManager.getSkillOptions() : []);
    }

    onSkillSelected(skillId) {
        if (this.skillManager) {
            this.skillManager.applySkill(skillId);
        }

        this.isSelectingSkill = false;
        this.isPaused = false;
        this.skillModal = null;
    }

    showDirectorHint(hint) {
        this.spawnFloatingText(
            hint,
            GameConfig.Screen.width / 2,
            240,
            '#f39c12',
            34
        );
    }

    onBossSpawned(boss) {
        this.spawnFloatingText('🚨 泰坦战舰来袭！', GameConfig.Screen.width / 2, 240, '#ff3b30', 40);
        this.spawnFloatingText('优先摧毁机库 → 暴露核心弱点', GameConfig.Screen.width / 2, 290, '#ffffff', 26);
        this.currentBoss = boss;
    }

    renderBossUI(ctx, boss, width, height) {
        const barWidth = 420;
        const barHeight = 12;
        const x = (width - barWidth) / 2;
        const y = this.hudY + 80;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - 10, y - 36, barWidth + 20, 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(boss.name || 'BOSS', x, y - 16);

        const hpPercent = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#ff3b30';
        ctx.fillRect(x, y, Math.max(0, Math.min(1, hpPercent)) * barWidth, barHeight);

        if (boss.modules && boss.modules.shield && boss.modules.shield.maxHp) {
            const sp = Math.max(0, boss.modules.shield.hp) / boss.modules.shield.maxHp;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x, y + barHeight + 6, barWidth, 6);
            ctx.fillStyle = '#00ccff';
            ctx.fillRect(x, y + barHeight + 6, Math.max(0, Math.min(1, sp)) * barWidth, 6);
        }

        let hangars = 0;
        let turrets = 0;
        let coreExposed = false;
        if (boss.modules) {
            hangars = (boss.modules.hangars || []).filter(m => m.active).length;
            turrets = (boss.modules.mainTurrets || []).filter(m => m.active).length;
            coreExposed = !!(boss.modules.core && boss.modules.core.exposed);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText(`机库:${hangars} 主炮:${turrets} ${coreExposed ? '核心:暴露' : '核心:封闭'}`, x + barWidth, y - 16);

        ctx.restore();
    }

    renderTopStatusPanel(ctx, width) {
        if (!this.player) return;

        const panelY = this.hudY + 76;
        const panelH = 58;
        const panelW = Math.min(260, Math.floor(width * 0.36));
        const leftX = 18;

        const hpRate = this.player.maxHp > 0 ? Math.max(0, Math.min(1, this.player.hp / this.player.maxHp)) : 0;
        const energyRate = this.player.maxEnergy > 0 ? Math.max(0, Math.min(1, this.player.energy / this.player.maxEnergy)) : 0;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(leftX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX, panelY, panelW, panelH);

        const barX = leftX + 12;
        const barW = panelW - 24;

        // HP
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(barX, panelY + 12, barW * hpRate, 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeRect(barX, panelY + 12, barW, 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`HP ${Math.ceil(this.player.hp)}/${this.player.maxHp}`, barX, panelY + 10);

        // ENERGY
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(barX, panelY + 34, barW * energyRate, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeRect(barX, panelY + 34, barW, 8);
        ctx.fillStyle = '#c8d6e5';
        ctx.fillText(`能量 ${Math.ceil(this.player.energy)}/${this.player.maxEnergy}`, barX, panelY + 56);

        // Act badge (right)
        const act = this.waveManager && this.waveManager.getCurrentAct ? this.waveManager.getCurrentAct() : 1;
        const badgeW = 94;
        const badgeX = width - badgeW - 18;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(badgeX, panelY, badgeW, panelH);
        ctx.strokeStyle = 'rgba(0, 210, 211, 0.55)';
        ctx.strokeRect(badgeX, panelY, badgeW, panelH);
        ctx.fillStyle = '#00d2d3';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`ACT ${act}`, badgeX + badgeW / 2, panelY + 24);
        ctx.fillStyle = '#95a5a6';
        ctx.font = '12px Arial';
        ctx.fillText('战场阶段', badgeX + badgeW / 2, panelY + 44);

        ctx.restore();
    }

    renderDirectorHint(ctx, hint, width) {
        const bannerW = Math.min(520, width - 60);
        const bannerH = 44;
        const x = (width - bannerW) / 2;
        const y = this.hudY + 120;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, y, bannerW, bannerH);

        ctx.strokeStyle = 'rgba(243,156,18,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, bannerW, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 10;
        ctx.fillText(hint, x + bannerW / 2, y + 28);
        ctx.restore();
    }

    /**
     * 渲染副武器技能按钮（已禁用 - 能量系统已删除）
     */
    renderSecondarySkillButton(ctx) {
        // 能量系统已删除，此按钮不再渲染
        // 如需恢复副武器系统，需先在Player.js中重新添加secondarySkill属性
        return;
    }

    /**
     * 使用副武器技能（已禁用 - 能量系统已删除）
     */
    activateSecondarySkill() {
        // 能量系统已删除，副武器系统禁用
        console.log('副武器系统已禁用（能量系统已删除）');
        return;
    }

    activateFighterAbility() {
        if (!this.player || !this.player.fighter) return;
        
        let activated = false;
        let abilityName = '';
        
        if (this.player.fighterId === 'J-20') {
            activated = this.player.fighter.activateStealth();
            abilityName = '隐身模式';
        } else if (this.player.fighterId === 'F-22') {
            // 冲刺方向设为当前移动方向或向上
            const dirX = 0;
            const dirY = -1;
            activated = this.player.fighter.activateDash(dirX, dirY);
            abilityName = '矢量冲刺';
        } else if (this.player.fighterId === 'Su-57') {
            activated = this.player.fighter.activateShield();
            abilityName = '等离子护盾';
        }
        
        if (activated) {
            if (this.effectManager) {
                this.effectManager.spawnFloatingText(
                    abilityName + '启动!',
                    this.player.x,
                    this.player.y - 60,
                    '#00ccff',
                    28
                );
            }
            audioManager.play('powerup');
        }
    }

    spawnFloatingText(text, x, y, color = '#fff', size = 30) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            size: size,
            life: 1.0
        });
    }

    triggerDoomsdayEffect() {
        this.doomsdayActive = true;
        this.doomsdayTimer = 5.0; // Show large warning for 5 seconds
        // audioManager.play('alarm'); // Assuming alarm sound or reuse explosion
    }


    renderPauseModal(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const panelW = Math.min(380, w - 64);
        const panelH = Math.min(470, h - 140);
        const startX = cx - panelW / 2;
        const startY = cy - panelH / 2;

        RenderUtils.drawCyberPanel(ctx, startX, startY, panelW, panelH, {
            corner: 20,
            color: '#00d2d3',
            bgAlpha: 0.95
        });

        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00d2d3';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('战术暂停', cx, startY + 56);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#9fb3c8';
        ctx.font = '14px Arial';
        ctx.fillText('TACTICAL PAUSE', cx, startY + 82);

        // 状态摘要（让玩家暂停时快速决策）
        const elapsed = Math.floor(this.waveManager ? this.waveManager.levelTime : 0);
        const score = Math.floor(this.score || 0);
        const hp = this.player ? `${Math.max(0, Math.ceil(this.player.hp))}/${this.player.maxHp}` : '--';
        const lineY = startY + 116;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(startX + 28, lineY, panelW - 56, 1);

        ctx.fillStyle = '#dfe6e9';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`生存时间: ${elapsed}s`, startX + 34, lineY + 24);
        ctx.fillText(`当前得分: ${score}`, startX + 34, lineY + 46);
        ctx.fillText(`战机耐久: ${hp}`, startX + 34, lineY + 68);

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '12px Arial';
        ctx.fillText('建议：耐久低时优先“继续作战”进行走位回血/规避', cx, startY + panelH - 20);
        ctx.restore();

        if (this.btnContinue) this.btnContinue.render(ctx);
        if (this.btnShare) this.btnShare.render(ctx);
        if (this.btnSetting) this.btnSetting.render(ctx);
        if (this.btnEnd) this.btnEnd.render(ctx);
        if (this.btnClose) this.btnClose.render(ctx);
    }

    handleInput(type, x, y) {
        if (this.isSelectingSkill && this.skillModal) {
            if (this.skillModal.handleInput(type, x, y)) {
                return;
            }
        }

        // ========== 摇杆区域检测 ==========
        // 检查触摸点是否在摇杆区域内（避免摇杆拖动触发高度变化）
        let isInJoystickArea = false;
        if (this.joystick) {
            const joyX = this.joystick.x || (GameConfig.Screen.width - 120);
            const joyY = this.joystick.y || (this.sceneManager.game.logicHeight - 120);
            const joyRadius = this.joystick.radius || 80;
            const distToJoystick = Math.sqrt((x - joyX) ** 2 + (y - joyY) ** 2);
            if (distToJoystick < joyRadius * 1.5) {
                isInJoystickArea = true;
            }
        }
        
        // 高度层滑动控制 (已移除)
        // if (!isInJoystickArea) { ... }

        if (this.isPaused) {
            // 如果暂停，优先处理暂停菜单的按钮点击
            const pauseButtons = [this.btnContinue, this.btnShare, this.btnSetting, this.btnEnd, this.btnClose];
            for (let btn of pauseButtons) {
                if (btn && btn.handleInput(type, x, y)) return;
            }
            return; // 暂停时阻止其他输入
        }

        // Priority 1: UI Components (Pause, Joystick, etc)
        // We iterate generic UI components mainly for clicks
        if (type === 'touchstart') {
            for (let i = this.uiComponents.length - 1; i >= 0; i--) {
                const comp = this.uiComponents[i];
                if (comp.handleInput(type, x, y)) {
                    return; // Consumed
                }
            }
            
            // ========== 战机特技按钮检测 ==========
            if (this.player && this.player.abilityBtn) {
                const btn = this.player.abilityBtn;
                const dx = x - btn.x;
                const dy = y - btn.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= btn.radius * 1.2) {
                    this.activateFighterAbility();
                    return;
                }
            }
        }

        // Priority 2: Direct Joystick Input (Move/End)
        // Restrict to Left Side of screen for touch start to avoid conflict with buttons on right
        if (this.joystick) {
            // If it's a new touch, ensure it's on the left half
            if (type === 'touchstart') {
                if (x < GameConfig.Screen.width / 2) {
                    this.joystick.handleInput(type, x, y);
                }
            } else {
                // Move/End events don't strictly need position checks if already active, 
                // but joystick.handleInput handles state.
                this.joystick.handleInput(type, x, y);
            }
        }

        // Game Input
        // (Legacy Touch Follow removed)
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const width = GameConfig.Screen.width;
        const height = this.sceneManager.game.logicHeight;

        if (this.isPaused) {
            const panelW = Math.min(380, width - 64);
            const panelH = Math.min(470, height - 140);
            const cx = width / 2;
            const startY = (height - panelH) / 2;

            const btnWidth = Math.min(260, panelW - 60);
            const btnHeight = 46;
            const btnSpacing = 14;
            const firstBtnY = startY + 210;
            const btnX = cx - btnWidth / 2;

            this.btnContinue = new Button(btnX, firstBtnY, btnWidth, btnHeight, '▶ 继续作战');
            this.btnContinue.setStyle('#00b894', '#021b16', 18, 6).setCallback(() => this.togglePause());

            this.btnShare = new Button(btnX, firstBtnY + (btnHeight + btnSpacing), btnWidth, btnHeight, '分享战报');
            this.btnShare.setStyle('#0984e3', '#fff', 18, 6).setCallback(() => {
                if (typeof wx !== 'undefined' && wx.shareAppMessage) {
                    wx.shareAppMessage({ title: `我在太空幸存者中守卫了${Math.floor(this.waveManager.levelTime)}秒！` });
                } else {
                    this.spawnFloatingText('当前平台暂不支持分享', GameConfig.Screen.width / 2, 220, '#feca57', 24);
                }
            });

            this.btnSetting = new Button(btnX, firstBtnY + (btnHeight + btnSpacing) * 2, btnWidth, btnHeight, '系统设置');
            this.btnSetting.setStyle('#636e72', '#fff', 18, 6).setCallback(() => {
                this.spawnFloatingText('设置功能开发中', GameConfig.Screen.width / 2, 220, '#74b9ff', 24);
            });

            this.btnEnd = new Button(btnX, firstBtnY + (btnHeight + btnSpacing) * 3 + 8, btnWidth, btnHeight, '放弃任务');
            this.btnEnd.setStyle('#d63031', '#fff', 18, 6).setCallback(() => {
                this.endGame();
            });

            this.btnClose = null;
        } else {
            this.btnContinue = null;
            this.btnEnd = null;
            this.btnShare = null;
            this.btnSetting = null;
            this.btnClose = null;
        }
    }

    addExp(amount) {
        if (this.skillManager) {
            this.skillManager.addExp(amount);
        }
    }

}
