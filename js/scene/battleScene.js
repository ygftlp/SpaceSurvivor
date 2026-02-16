﻿import BaseScene from './baseScene.js';
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
        this.pausePressedButton = null;
        this.debugLastTouch = null;

        // Menu & Pause System
        this.isPaused = false;
        this.doomsdayActive = false;
        this.doomsdayTimer = 0;

        // ... (Keep existing props like toast)
        // Upgrade to array for multiple effects
        this.floatingTexts = [];
        this.lastGold = 0;

        // Altitude-layer controls removed.
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isVerticalSwipe = false;

        // Hint cooldowns to avoid spam.
        this.lowHpHintCooldown = 0;
        this.overheatHintCooldown = 0;

        // Opening anti-bullet-rain limiter (first 15s).
        this.openingFireWindowStart = 0;
        this.openingFireCount = 0;
        this.missionPulse = 0;
        this.enemyVisibilityRescueTimer = 0;
        this.forcedVisibleSpawnTimer = 0;
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
        this.debugLastTouch = null;
        this.openingFireWindowStart = 0;
        this.openingFireCount = 0;
        this.currentBoss = null;
        this.missionPulse = 0;
        this.enemyVisibilityRescueTimer = 1.0;
        this.forcedVisibleSpawnTimer = 1.2;

        // Effects
        this.effectManager = new EffectManager(this);

        // Mothership - 濮ｅ秷鍩屾穱婵囧Б缁崵绮洪敍鍫熺壋韫囧啫褰婃禍瀣晪閻愮櫢绱?
        this.mothership = new Mothership(this);

        // Fix: prevent blackbox spawning too close to mothership.
        if (this.wreckage) {
            const dx = this.wreckage.x - this.mothership.x;
            const dy = this.wreckage.y - this.mothership.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 婵″倹鐏夋鎴濆皥鐎涙劘绐涚粋缁樼槤閼告澘銇婃潻鎴礄鐏忓繋绨?50閸嶅繒绀岄敍澶涚礉瀵搫鍩楃亸鍡楀従缁夎绱?
            if (dist < 350) {
                console.log('Adjust wreckage position to avoid overlapping mothership');
                // 瀵搫鍩楃粔璇插З閸掓澘鐫嗛獮鏇氱瑐閸楀﹪鍎撮崚鍡欐畱娑撱倓鏅?
                this.wreckage.y = 200 + Math.random() * 100; // Top zone: y 200-300
                
                // Place left/right side randomly to avoid center lane.
                if (Math.random() > 0.5) {
                    this.wreckage.x = 50 + Math.random() * 100; // 瀹革缚鏅?
                } else {
                    this.wreckage.x = GameConfig.Screen.width - 150 + Math.random() * 100; // 閸欏厖鏅?
                }
                console.log(`姒涙垵灏堢€涙劖鏌婃担宥囩枂: ${this.wreckage.x}, ${this.wreckage.y}`);
            }
        }

        // Roguelite
        this.skillManager = new SkillManager(this);

        this.magnetRange = 150; // Default pickup range

        // Milestone prompts for beat transitions.
        this.stageMilestones = [30, 70]; // Beat transition checkpoints for director pacing.
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
        
        // 5. Altitude button callback removed.


        // 6. Start Survival Mode
        this.waveManager.startSurvival();
        
        // Start-of-run hints.
        const missionDuration = this.waveManager && this.waveManager.getDurationSec
            ? this.waveManager.getDurationSec()
            : 90;
        this.spawnFloatingText(
            `守护母舰 ${missionDuration} 秒`,
            GameConfig.Screen.width / 2,
            300,
            '#00ccff',
            32
        );
        this.spawnFloatingText(
            '拖动摇杆移动',
            GameConfig.Screen.width / 2,
            350,
            '#ffffff',
            26
        );
        this.spawnFloatingText(
            '点击技能按钮释放主动技能',
            GameConfig.Screen.width / 2,
            390,
            '#ffffff',
            26
        );
        this.spawnFloatingText(
            '坚持越久奖励越高，结算可强化战机',
            GameConfig.Screen.width / 2,
            430,
            '#ffd166',
            22
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
        
        // Clear effect manager state.
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

        // Update Mothership (濮ｅ秷鍩岀化鑽ょ埠)
        if (this.mothership) {
            this.mothership.update(dt);
            
            // Low HP Warning
            if (this.mothership.isAlive && this.mothership.hp / this.mothership.maxHp < 0.3) {
                if (!this.mothershipLowHpTimer) this.mothershipLowHpTimer = 0;
                this.mothershipLowHpTimer += dt;
                if (this.mothershipLowHpTimer > 2.0) {
                    this.mothershipLowHpTimer = 0;
                    this.spawnFloatingText('警告：母舰护盾濒危！', this.mothership.x, this.mothership.y - 120, '#ff0000', 36);
                    if (this.effectManager) this.effectManager.shake(5, 0.5);
                }
            }
        }

        // Update Wave Manager
        this.waveManager.update(dt);

        // Visibility rescue: hard guarantee visible enemies in early run.
        this.enemyVisibilityRescueTimer -= dt;
        this.forcedVisibleSpawnTimer -= dt;
        const battleTime = this.waveManager && Number.isFinite(this.waveManager.levelTime)
            ? this.waveManager.levelTime
            : 0;
        const activeEnemies = Array.isArray(this.enemies)
            ? this.enemies.filter((e) => e && e.active && !e.isBoss).length
            : 0;

        if (this.enemyVisibilityRescueTimer <= 0) {
            this.enemyVisibilityRescueTimer = 2.4;
            if (battleTime < 26 && activeEnemies <= 1 && this.waveManager && this.waveManager.spawnService) {
                this.waveManager.spawnService.spawnEnemy('Drone_Small', this.waveManager.getCurrentAct(), {
                    x: GameConfig.Screen.width * (0.3 + Math.random() * 0.4),
                    y: 240,
                    spawnTime: battleTime
                });
            }
        }

        // Direct fallback spawner bypassing director pipeline.
        if (this.forcedVisibleSpawnTimer <= 0 && battleTime < 35 && activeEnemies < 3) {
            this.forcedVisibleSpawnTimer = 2.1;
            const side = Math.random() > 0.5 ? 0.24 : 0.76;
            const x = GameConfig.Screen.width * side + (Math.random() - 0.5) * 40;
            const forcedConfig = {
                chassis: 'SCOUT',
                hp: 32,
                speed: 118,
                damage: 6,
                score: 12,
                movement: 'LINEAR',
                weapon: 'NONE',
                width: 84,
                height: 84,
                scale: 1.2,
                color: '#4af2dd',
                spawnGraceDuration: 2.2
            };
            const enemy = new Enemy(forcedConfig, x, 250, this);
            enemy.hasEnteredView = true;
            enemy.fireEnableDelay = 2.4;
            this.enemies.push(enemy);
        }

        // Victory is unified to a single source:
        // mothership jump-charge complete => Mothership.onJumpChargeComplete => endGame(true).

        // Milestone achievement check.
        const currentTime = this.waveManager.levelTime;
        this.stageMilestones.forEach(milestone => {
            if (currentTime >= milestone && !this.achievedMilestones.includes(milestone)) {
                this.achievedMilestones.push(milestone);
                // Show milestone toast.
                if (this.effectManager) {
                    const messages = {
                        30: '阶段一完成！',
                        70: '阶段二完成！'
                    };
                    const milestoneHint = milestone === 30
                        ? '阶段一完成：保持阵型'
                        : (milestone === 70 ? '阶段二完成：准备终局战' : messages[milestone]);
                    this.effectManager.spawnFloatingText(
                        milestoneHint,
                        GameConfig.Screen.width / 2,
                        200,
                        '#f39c12',
                        32
                    );
                    // 鐏炲繐绠烽棁鍥уЗ閺佸牊鐏?
                    this.effectManager.shake(5, 0.3);
                }
                // Auto level-up reward.
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
                this.spawnFloatingText('警告：战机严重受损，请持续机动！', GameConfig.Screen.width / 2, 320, '#ff6b6b', 24);
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
                if ((e.lifeTime || 0) < 1.5 && e.hp > 0) {
                    console.warn('[EnemyEarlyDespawn]', {
                        x: e.x,
                        y: e.y,
                        hp: e.hp,
                        lifeTime: e.lifeTime,
                        spawnGraceTimer: e.spawnGraceTimer
                    });
                }
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
                            // Energy battery: restore 50 energy.
                            if (this.player) {
                                this.player.overchargeEnergy(50);
                                this.spawnFloatingText('能量 +50', this.player.x, this.player.y - 40, '#ffcc00', 25);
                                audioManager.play('coin'); // Reuse coin SFX.
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
        // 閸╄櫣顢呴幒澶庢儰閿涙氨绮℃宀€鎮?
        this.loots.push(new Loot(x, y, 'exp'));
        
        // Elite/Boss can drop energy batteries.
        if (enemyType === 'elite' || enemyType === 'boss') {
            if (Math.random() < 0.4) { // 40%濮掑倻宸?
                this.loots.push(new Loot(x, y, 'energy'));
            }
        }
    }

    spawnEnemyBullet(x, y, angle, speed, config = {}) {
        if (this.isPaused || this.gameEnded) return;
        const battleTime = (this.waveManager && Number.isFinite(this.waveManager.levelTime))
            ? this.waveManager.levelTime
            : 999;

        // First 15s: hard-cap enemy bullet output to prevent opening bullet rain.
        if (battleTime < 15) {
            const nowSec = Math.floor(battleTime);
            if (nowSec !== this.openingFireWindowStart) {
                this.openingFireWindowStart = nowSec;
                this.openingFireCount = 0;
            }

            let capPerSec = 3;
            if (battleTime >= 5) capPerSec = 5;
            if (battleTime >= 10) capPerSec = 7;
            if (this.openingFireCount >= capPerSec) {
                return;
            }
            this.openingFireCount += 1;
        }

        const earlySoftScale = battleTime < 15 ? (0.75 + (battleTime / 15) * 0.25) : 1;
        const finalSpeed = Math.max(120, speed * earlySoftScale);
        const damage = Math.max(1, Math.floor((config.damage || 10) * earlySoftScale));
        // Enemy strategy angle uses "0 = downward". Convert to bullet angle space ("0 = right").
        const normalizedAngle = Number.isFinite(angle) ? angle : 0;
        const moveAngle = (config && config.absoluteAngle) ? normalizedAngle : (normalizedAngle + 90);
        const bounds = {
            minX: -100,
            maxX: GameConfig.Screen.width + 100,
            minY: -100,
            maxY: (this.sceneManager.game.logicHeight || GameConfig.Screen.height) + 100
        };
        const bulletConfig = { ...config, bounds };
        if (Object.prototype.hasOwnProperty.call(bulletConfig, 'absoluteAngle')) {
            delete bulletConfig.absoluteAngle;
        }
        const bullet = new Bullet(x, y, moveAngle, finalSpeed, damage, true, bulletConfig);
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

        this.spawnFloatingText('补给箱已到达！', x, y - 50, '#ffcc00', 40);
        audioManager.play('upgrade'); // Use upgrade sound for notify
        console.log(`Supply Drop: ${value} Gold at ${x},${y}`);
    }

    spawnObstacle() {
        const type = Math.random() > 0.7 ? 'ASTEROID_L' : 'ASTEROID_M';
        const x = Math.random() * GameConfig.Screen.width;
        this.obstacles.push(new Obstacle(x, -100, type));
    }

    endGame(victory = false, delayMs = 2000) {
        if (this.gameEnded) return;
        this.gameEnded = true;
        
        if (victory) {
            // 閼虫粌鍩?- 濮ｅ秷鍩岄幋鎰鐠哄啳绺?
            console.log('VICTORY - Mothership jump complete!');
            this.effectManager.spawnFloatingText(
                '跃迁完成！人类得以存续！', 
                GameConfig.Screen.width/2, 
                GameConfig.Screen.height/2, 
                '#00ff00', 
                50
            );
        } else {
            // 婢惰精瑙?
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

        // Record meta progression.
        const gameResult = {
            victory: victory,
            kills: this.score / 10, // 娴兼壆鐣婚崙缁樻絻閺佸府绱欓崑鍥啎濮ｅ繋閲滈弫灞兼眽10閸掑棴绱?
            survivalTime: this.waveManager.levelTime,
            playerHpPercent: this.player ? this.player.hp / this.player.maxHp : 0,
            blueprintsCommon: victory ? 30 + Math.floor(this.waveManager.levelTime / 10) : 10,
            blueprintsRare: victory ? 5 + Math.floor(this.waveManager.levelTime / 60) : 2,
            blueprintsLegendary: victory ? 1 : 0
        };
        metaProgression.recordGameEnd(gameResult);
        
        // 濡偓閺屻儲鏌婄憴锝夋敚
        const newUnlocks = metaProgression.checkAllUnlocks();
        if (newUnlocks.length > 0) {
            newUnlocks.forEach(fighterId => {
                this.effectManager.spawnFloatingText(
                    '已解锁新战机：' + fighterId + '！',
                    GameConfig.Screen.width/2, 
                    GameConfig.Screen.height/2 - 100, 
                    '#ffd700', 
                    40
                );
            });
        }

        // Save
        dataManager.addGold(totalGold);

        // Show result screen after delay.
        setTimeout(() => {
            this.sceneManager.switchScene('RESULT', {
                victory: victory,
                score: this.score,
                gold: totalGold,
                timeSeconds: Math.floor(this.waveManager.levelTime),
                fighterId: this.player ? this.player.fighterId : null,
                buildSummary: this.skillManager ? this.skillManager.getBuildSummary() : null
            });
        }, Math.max(0, delayMs));
    }

    checkCollisions() {
        // 1. Player Bullets vs Enemies
        this.bullets.forEach(b => {
            if (!b.active) return;
            if (b.isEnemy) return;
            this.enemies.forEach(e => {
                if (!e.active || !b.active) return;
                if ((e.spawnGraceTimer || 0) > 0) return;
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
                        this.effectManager.spawnFloatingText('处决', e.x, e.y - 50, '#ff0000', 30);
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
                        
                        // 閺嶈宓侀弫灞兼眽缁鐎烽幒澶庢儰
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
                        this.spawnFloatingText(`回收黑匣子 +${this.wreckage.gold} 金币`, GameConfig.Screen.width / 2, 150, '#ff9f43', 40);
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
                if ((e.spawnGraceTimer || 0) > 0) return;
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
                if ((e.spawnGraceTimer || 0) > 0) return;
                const dx = e.x - this.mothership.x;
                const dy = e.y - this.mothership.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < (e.width + this.mothership.width) / 2) {
                    // Enemy collides with mothership.
                    e.active = false;
                    this.mothership.takeDamage(e.damage * 2);
                    
                    // 瀵櫣鍎撶憴鍡氼潕閸欏秹顩?
                    if (this.effectManager) {
                        this.effectManager.shake(20, 0.5);
                        this.effectManager.spawnFloatingText(
                            '母舰遭受撞击', 
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
        
        // Render Mothership (primary defense objective).
        if (this.mothership) {
            this.mothership.render(ctx);
        }

        // Render UI Components
        this.uiComponents.forEach(c => c.render(ctx));

        // Render Combo UI
        if (this.effectManager) {
            // 鏉╃偛鍤甎I瀹歌尙些闂勩倧绱欓悾宀勬桨缁犫偓閸栨牭绱?
        }

        // ========== 閼充粙鍣虹化鑽ょ埠UI ==========
        // Mothership countdown and state.
        if (this.player) {
            this.player.renderUI(ctx, GameConfig.Screen.width, this.sceneManager.game.logicHeight);
            
            // 閸擃垱顒熼崳銊﹀Η閼宠姤瀵滈柦顕嗙礄閸欏厖绗呯憴鎺炵礆
            this.renderSecondarySkillButton(ctx);
        }

        // Top battle UI (countdown-focused).
        if (this.mothership && this.mothership.isAlive) {
            this.mothership.renderCountdownUI(ctx, width, height);
        }

        // Render Battle UI (simplified countdown).
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';

        // Survival timer (center top).
        const t = this.waveManager.levelTime || 0;
        const durationSec = this.waveManager && this.waveManager.getDurationSec
            ? this.waveManager.getDurationSec()
            : 90;
        const remainingTime = Math.max(0, durationSec - t);
        const m = Math.floor(remainingTime / 60).toString().padStart(2, '0');
        const s = Math.floor(remainingTime % 60).toString().padStart(2, '0');
        
        // Last 20s warning tint.
        if (remainingTime <= 20) {
            ctx.fillStyle = '#e74c3c';
            // 濞ｈ濮為懘澶婂З閺佸牊鐏?
            const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 20 * pulse;
        } else {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
        }
        
        ctx.fillText(`${m}:${s}`, GameConfig.Screen.width / 2, this.hudY + 30); // Lowered slightly
        
        // Countdown label.
        ctx.font = '14px Arial';
        ctx.fillStyle = '#aaa';
        ctx.shadowBlur = 0;
        ctx.fillText('剩余时间', GameConfig.Screen.width / 2, this.hudY + 60); // Spaced out

        this.renderTopStatusPanel(ctx, width);
        this.renderMissionEconomyPanel(ctx, width, height);

        // Director hint banner moved out of center to reduce HUD clutter.
        this.renderDirectorDebugHud(ctx, width);

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

        // Skill selection is now mostly auto mode.
        if (this.isSelectingSkill && this.skillModal) {
            this.skillModal.render(ctx);
        }
        
        // Restore canvas state (paired with top-level ctx.save).
        ctx.restore();
    }

    /**
     * Show skill selection UI (called by SkillManager).
     */
    renderDebugOverlay(ctx, width, height) {
        if (!GameConfig.Debug || !GameConfig.Debug.hitboxOverlay) return;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.font = '12px Arial';

        const drawBtn = (btn, label, color = '#00ff99') => {
            if (!btn) return;
            this.drawDebugRect(ctx, btn.x, btn.y, btn.width, btn.height, label, color);
        };

        drawBtn(this.btnPause, 'pause', '#7df9ff');

        if (this.isPaused) {
            drawBtn(this.btnContinue, 'continue');
            drawBtn(this.btnShare, 'share', '#63b3ed');
            drawBtn(this.btnSetting, 'setting', '#f6ad55');
            drawBtn(this.btnEnd, 'abandon', '#fc8181');
            drawBtn(this.btnClose, 'close', '#e2e8f0');
        }

        if (this.player && this.player.abilityBtn) {
            const btn = this.player.abilityBtn;
            const radius = (btn.radius || 0) * 1.2;
            if (radius > 0) {
                ctx.strokeStyle = '#f6e05e';
                ctx.beginPath();
                ctx.arc(btn.x, btn.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#f6e05e';
                ctx.fillText('技能', btn.x + radius + 6, btn.y - 6);
            }
        }

        const showTouch = !GameConfig.Debug || GameConfig.Debug.touchPointOverlay !== false;
        const touch = this.debugLastTouch;
        if (showTouch && touch && (Date.now() - touch.ts) < 1200) {
            const r = GameConfig.Debug.touchPointRadius || 18;
            ctx.strokeStyle = '#ff4d6d';
            ctx.beginPath();
            ctx.arc(touch.x, touch.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ff4d6d';
            ctx.fillText(`${touch.type} (${Math.floor(touch.x)}, ${Math.floor(touch.y)})`, touch.x + r + 6, touch.y - 6);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(width - 180, 12, 168, 44);
        ctx.fillStyle = '#7df9ff';
        ctx.fillText('调试碰撞框已开启', width - 170, 30);
        ctx.fillStyle = '#cbd5e0';
        ctx.fillText('三指点击：开关', width - 170, 48);

        ctx.restore();
    }

    drawDebugRect(ctx, x, y, w, h, label, color) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return;
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillText(label, x + 4, y + 14);
    }

    canOpenSkillSelectionNow() {
        if (this.gameEnded || this.isPaused || this.isSelectingSkill) return false;
        if (!this.player) return false;

        const t = (this.waveManager && Number.isFinite(this.waveManager.levelTime))
            ? this.waveManager.levelTime
            : 0;
        if (t < 6) return false;

        const hpRate = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 1;
        if (hpRate < 0.45) return false;

        const activeEnemies = Array.isArray(this.enemies)
            ? this.enemies.filter((e) => e && e.active).length
            : 0;
        if (activeEnemies > 3) return false;

        const enemyBullets = Array.isArray(this.bullets)
            ? this.bullets.filter((b) => b && b.active && b.isEnemy).length
            : 0;
        if (enemyBullets > 12) return false;

        const bossAlive = !!(this.currentBoss && this.currentBoss.active);
        if (bossAlive) return false;

        return true;
    }

    isEnemyInFireWindow(enemy) {
        if (!enemy) return false;
        const width = GameConfig.Screen.width;
        const height = this.sceneManager && this.sceneManager.game
            ? this.sceneManager.game.logicHeight
            : GameConfig.Screen.height;
        return (
            enemy.x > -40 &&
            enemy.x < width + 40 &&
            enemy.y > 260 &&
            enemy.y < height * 0.88
        );
    }

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
     * 閸忕厧顔愰弮褎鏌熷▔鏇炴倳
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
        this.spawnFloatingText('首领来袭！', GameConfig.Screen.width / 2, 240, '#ff3b30', 40);
        this.spawnFloatingText('优先击毁：机库 -> 炮塔 -> 核心', GameConfig.Screen.width / 2, 290, '#ffffff', 24);
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
        ctx.fillText(boss.name || '首领', x, y - 16);

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
        ctx.fillText('机库:' + hangars + ' 炮塔:' + turrets + ' ' + (coreExposed ? '核心:暴露' : '核心:锁定'), x + barWidth, y - 16);
        this.renderBossPriorityMarkers(ctx, x, y - 58, hangars, turrets, coreExposed);

        ctx.restore();
    }

    renderBossPriorityMarkers(ctx, x, y, hangars, turrets, coreExposed) {
        const markers = [
            {
                label: `机库 ${hangars}`,
                color: hangars > 0 ? '#f59e0b' : '#6b7280',
                active: hangars > 0
            },
            {
                label: `炮塔 ${turrets}`,
                color: turrets > 0 ? '#3b82f6' : '#6b7280',
                active: turrets > 0
            },
            {
                label: coreExposed ? '核心 已暴露' : '核心 未暴露',
                color: coreExposed ? '#ef4444' : '#6b7280',
                active: coreExposed
            }
        ];

        ctx.save();
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        let cursorX = x;
        markers.forEach((mk) => {
            const w = Math.max(88, Math.min(136, ctx.measureText(mk.label).width + 20));
            const h = 20;
            ctx.fillStyle = mk.active ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.45)';
            ctx.fillRect(cursorX, y, w, h);
            ctx.strokeStyle = mk.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cursorX, y, w, h);
            ctx.fillStyle = mk.color;
            ctx.fillText(mk.label, cursorX + 8, y + 14);
            cursorX += w + 6;
        });
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
        ctx.fillText(`生命 ${Math.ceil(this.player.hp)}/${this.player.maxHp}`, barX, panelY + 10);

        // ENERGY
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(barX, panelY + 34, barW * energyRate, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeRect(barX, panelY + 34, barW, 8);
        ctx.fillStyle = '#c8d6e5';
        ctx.fillText(`能量 ${Math.ceil(this.player.energy)}/${this.player.maxEnergy}`, barX, panelY + 56);

        // Act badge (right)
        const act = this.waveManager && this.waveManager.getCurrentAct ? this.waveManager.getCurrentAct() : 1;
        const activeEnemyCount = Array.isArray(this.enemies)
            ? this.enemies.filter((e) => e && e.active && !e.isBoss).length
            : 0;
        const badgeW = 94;
        const badgeX = width - badgeW - 18;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(badgeX, panelY, badgeW, panelH);
        ctx.strokeStyle = 'rgba(0, 210, 211, 0.55)';
        ctx.strokeRect(badgeX, panelY, badgeW, panelH);
        ctx.fillStyle = '#00d2d3';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`阶段 ${act}`, badgeX + badgeW / 2, panelY + 24);
        ctx.fillStyle = '#95a5a6';
        ctx.font = '12px Arial';
        ctx.fillText('战斗进程', badgeX + badgeW / 2, panelY + 44);
        ctx.fillStyle = '#feca57';
        ctx.font = '11px Arial';
        ctx.fillText(`敌机 ${activeEnemyCount}`, badgeX + badgeW / 2, panelY + 58);

        ctx.restore();
    }

    renderMissionEconomyPanel(ctx, width, height) {
        const projection = this.getRunProjection();
        const hint = this.getUnlockProgressHint();
        const panelW = Math.min(340, Math.floor(width * 0.48));
        const panelH = 48;
        const x = 18;
        const y = Math.min(height - 200, this.hudY + 158);

        this.missionPulse += 0.05;
        const pulse = 0.55 + Math.sin(this.missionPulse) * 0.12;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(x, y, panelW, panelH);
        ctx.strokeStyle = `rgba(0, 210, 211, ${pulse})`;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x, y, panelW, panelH);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#dff9fb';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`结算 +${projection.nowGold} 金币`, x + panelW / 2, y + 18);

        ctx.fillStyle = '#feca57';
        ctx.font = '12px Arial';
        ctx.fillText(
            `终局额外 +${projection.victoryBonusGold} 金币  蓝图 +${projection.victoryCommon}/${projection.victoryRare}/${projection.victoryLegendary}`,
            x + panelW / 2,
            y + 34
        );
        if ((this.waveManager && this.waveManager.levelTime || 0) < 16) {
            ctx.fillStyle = '#a5b1c2';
            ctx.font = '12px Arial';
            ctx.fillText(hint, x + panelW / 2, y + panelH + 16);
        }
        ctx.restore();
    }

    getRunProjection() {
        const durationSec = this.waveManager && this.waveManager.getDurationSec
            ? this.waveManager.getDurationSec()
            : 90;
        const t = this.waveManager && Number.isFinite(this.waveManager.levelTime)
            ? this.waveManager.levelTime
            : 0;
        const nowGold = Math.floor(t / 10) + Math.floor((this.score || 0) / 100);
        const victoryGold = Math.floor(durationSec / 10) + Math.floor((this.score || 0) / 100);
        return {
            nowGold,
            victoryBonusGold: Math.max(0, victoryGold - nowGold),
            victoryCommon: 30 + Math.floor(durationSec / 10),
            victoryRare: 5 + Math.floor(durationSec / 60),
            victoryLegendary: 1
        };
    }

    getUnlockProgressHint() {
        const data = metaProgression.getDisplayData ? metaProgression.getDisplayData() : null;
        if (!data || !data.fighters || !data.stats) return '完成战斗可获得蓝图并推进战机解锁';

        const stats = data.stats;
        const fighters = data.fighters;
        if (fighters['F-22'] && !fighters['F-22'].unlocked) {
            const now = Math.floor((stats.totalKills || 0) + (this.score || 0) / 10);
            return `J-20 进阶目标：累计击杀 ${now}/${fighters['F-22'].unlockCost}`;
        }
        if (fighters['F-16'] && !fighters['F-16'].unlocked) {
            const now = (stats.totalGames || 0) + 1;
            return `F-16 解锁目标：完成对局 ${now}/${fighters['F-16'].unlockCost}`;
        }
        if (fighters['Su-57'] && !fighters['Su-57'].unlocked) {
            return `Su-57 解锁目标：满血通关 ${stats.fullHealthWins || 0}/${fighters['Su-57'].unlockCost}`;
        }

        return '已解锁全部战机，建议优先升级主力战机';
    }

    renderEnemyThreatIndicators(ctx, width, height) {
        if (!Array.isArray(this.enemies) || this.enemies.length === 0) return;

        const topBandY = this.hudY + 154;
        const maxY = height - 120;
        ctx.save();
        this.enemies.forEach((enemy) => {
            if (!enemy || !enemy.active) return;
            if (enemy.y >= 28 && enemy.y <= maxY) return;
            const clampedX = Math.max(24, Math.min(width - 24, enemy.x));
            const y = enemy.y < 28 ? topBandY : maxY;
            const color = enemy.config && enemy.config.color ? enemy.config.color : '#ff6b6b';
            const dir = enemy.y < 28 ? 1 : -1;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(clampedX, y + 10 * dir);
            ctx.lineTo(clampedX - 7, y - 7 * dir);
            ctx.lineTo(clampedX + 7, y - 7 * dir);
            ctx.closePath();
            ctx.fill();
        });
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

    renderDirectorDebugHud(ctx, width) {
        if (!GameConfig.Debug || !GameConfig.Debug.hitboxOverlay) return;
        if (!this.waveManager || !this.waveManager.getDirectorState) return;

        const state = this.waveManager.getDirectorState();
        if (!state) return;

        const panelW = 240;
        const panelH = 122;
        const x = width - panelW - 18;
        const y = this.hudY + 150;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.fillRect(x, y, panelW, panelH);
        ctx.strokeStyle = 'rgba(0, 210, 211, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, panelW, panelH);

        ctx.fillStyle = '#7df9ff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('导演系统调试', x + 10, y + 16);

        const budget = `${state.threatBudget.toFixed(1)}/${state.maxThreatBudget}`;
        const spendIn = Math.max(0, state.nextSpendIn || 0).toFixed(2);
        const lines = [
            `阶段: ${state.act} (${state.beatLabel || '-'})`,
            `预算: ${budget}`,
            `收入: +${state.incomePerSec.toFixed(1)}/秒`,
            `敌人: ${state.activeEnemies}  队列: ${state.queuedSpawns}`,
            `下次投放: ${spendIn}秒  角色: ${state.lastRole || '-'}`
        ];

        ctx.fillStyle = '#d9e6f2';
        ctx.font = '12px Arial';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + 10, y + 36 + i * 16);
        }
        ctx.restore();
    }

    /**
     * Render secondary skill button (disabled - energy system removed).
     */
    renderSecondarySkillButton(ctx) {
        // Energy system removed, secondary button is hidden.
        // Restore after re-adding secondarySkill in Player.js if needed.
        return;
    }

    /**
     * Activate secondary skill (disabled - energy system removed).
     */
    activateSecondarySkill() {
        // Energy system removed, secondary skill stays disabled.
        console.log('Secondary weapon system disabled (energy system removed)');
        return;
    }

    activateFighterAbility() {
        if (!this.player || !this.player.fighter) return;
        
        let activated = false;
        let abilityName = '';
        
        if (this.player.fighterId === 'J-20') {
            activated = this.player.fighter.activateStealth();
            abilityName = '隐身突防';
        } else if (this.player.fighterId === 'F-22') {
            // Dash direction currently defaults upward.
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
                    `${abilityName} 已启动`,
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
        ctx.fillStyle = 'rgba(1, 8, 18, 0.88)';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const panelW = Math.min(500, w - 48);
        const panelH = Math.min(720, h - 80);
        const startX = cx - panelW / 2;
        const startY = (h - panelH) / 2;

        RenderUtils.drawCyberPanel(ctx, startX, startY, panelW, panelH, {
            corner: 24,
            color: '#00d2d3',
            bgAlpha: 0.96
        });

        const elapsed = Math.floor(this.waveManager ? this.waveManager.levelTime : 0);
        const score = Math.floor(this.score || 0);
        const hp = this.player ? `${Math.max(0, Math.ceil(this.player.hp))}/${this.player.maxHp}` : '--';

        // ----- Header -----
        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00d2d3';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('战术暂停', cx, startY + 84);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#90a5bc';
        ctx.font = '18px Arial';
        ctx.fillText('暂停中', cx, startY + 118);
        ctx.fillStyle = 'rgba(0, 210, 211, 0.4)';
        ctx.fillRect(startX + 42, startY + 136, panelW - 84, 2);
        ctx.restore();

        // ----- Status block -----
        const statusX = startX + 34;
        const statusY = startY + 164;
        const statusW = panelW - 68;
        const statusH = 164;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(statusX, statusY, statusW, statusH);
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(statusX, statusY, statusW, statusH);

        ctx.fillStyle = '#dfe6e9';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('战况状态', statusX + 16, statusY + 26);

        const rows = [
            { label: '当前得分', value: String(score), color: '#55efc4' },
            { label: '战机耐久', value: String(hp), color: '#ff7675' }
        ];

        rows.forEach((row, i) => {
            const y = statusY + 58 + i * 34;
            if (i > 0) {
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(statusX + 14, y - 19);
                ctx.lineTo(statusX + statusW - 14, y - 19);
                ctx.stroke();
            }
            ctx.fillStyle = '#9fb3c8';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(row.label, statusX + 16, y);

            ctx.fillStyle = row.color;
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(row.value, statusX + statusW - 16, y + 2);
        });
        ctx.restore();

        // ----- Action tip -----
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Arial';
        ctx.fillText('暂停期间不会消耗时间与资源', cx, startY + 360);
        ctx.restore();

        if (this.btnContinue) this.btnContinue.render(ctx);
        if (this.btnShare) this.btnShare.render(ctx);
        if (this.btnSetting) this.btnSetting.render(ctx);
        if (this.btnEnd) this.btnEnd.render(ctx);
        if (this.btnClose) this.btnClose.render(ctx);

        this.renderDebugOverlay(ctx, w, h);
    }

    handleInput(type, x, y) {
        this.debugLastTouch = {
            x: x,
            y: y,
            type: type,
            ts: Date.now()
        };

        if (this.isSelectingSkill && this.skillModal) {
            if (this.skillModal.handleInput(type, x, y)) {
                return;
            }
        }

        // ========== Joystick Area Check ==========
        // 濡偓閺屻儴袝閹藉摜鍋ｉ弰顖氭儊閸︺劍鎲為弶鍡楀隘閸╃喎鍞撮敍鍫ヤ缉閸忓秵鎲為弶鍡樺珛閸斻劏袝閸欐垿鐝惔锕€褰夐崠鏍电礆
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
        
        // Altitude swipe control removed.
        // if (!isInJoystickArea) { ... }

        if (this.isPaused) {
            // 婵″倹鐏夐弳鍌氫粻閿涘奔绱崗鍫濐槱閻炲棙娈忛崑婊嗗綅閸楁洜娈戦幐澶愭尦閻愮懓鍤?
            const pauseButtons = [this.btnContinue, this.btnShare, this.btnSetting, this.btnEnd, this.btnClose];
            if (type === 'touchstart') {
                this.pausePressedButton = null;
                for (const btn of pauseButtons) {
                    if (btn && btn.checkClicked(x, y)) {
                        this.pausePressedButton = btn;
                        break;
                    }
                }
                return;
            }

            if (type === 'touchend') {
                let targetBtn = this.pausePressedButton;
                if (!targetBtn) {
                    for (const btn of pauseButtons) {
                        if (btn && btn.checkClicked(x, y)) {
                            targetBtn = btn;
                            break;
                        }
                    }
                }

                if (targetBtn && targetBtn.checkClicked(x, y) && typeof targetBtn.onClick === 'function') {
                    targetBtn.onClick();
                }
                this.pausePressedButton = null;
                return;
            }
            return; // Block gameplay input while paused.
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
            
            // ========== Fighter Ability Button Check ==========
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
            this.pausePressedButton = null;
            const panelW = Math.min(500, width - 48);
            const panelH = Math.min(720, height - 80);
            const cx = width / 2;
            const startY = (height - panelH) / 2;

            const btnWidth = Math.min(360, panelW - 72);
            const btnHeight = 58;
            const btnSpacing = 18;
            const firstBtnY = startY + 392;
            const btnX = cx - btnWidth / 2;

            this.btnContinue = new Button(btnX, firstBtnY, btnWidth, btnHeight, '继续作战');
            this.btnContinue.setStyle('#12b39a', '#03241f', 22, 8).setCallback(() => this.togglePause());

            this.btnShare = new Button(btnX, firstBtnY + (btnHeight + btnSpacing), btnWidth, btnHeight, '分享战报');
            this.btnShare.setStyle('#1f8de3', '#ffffff', 22, 8).setCallback(() => {
                if (typeof wx !== 'undefined' && wx.shareAppMessage) {
                    wx.shareAppMessage({ title: `我在《太空幸存者》坚持了 ${Math.floor(this.waveManager.levelTime)} 秒！` });
                } else {
                    this.spawnFloatingText('当前平台不支持分享', GameConfig.Screen.width / 2, 220, '#feca57', 24);
                }
            });

            this.btnSetting = new Button(btnX, firstBtnY + (btnHeight + btnSpacing) * 2, btnWidth, btnHeight, '系统设置');
            this.btnSetting.setStyle('#6d7a85', '#ffffff', 22, 8).setCallback(() => {
                this.spawnFloatingText('设置面板开发中', GameConfig.Screen.width / 2, 220, '#74b9ff', 24);
            });

            this.btnEnd = new Button(btnX, firstBtnY + (btnHeight + btnSpacing) * 3, btnWidth, btnHeight, '放弃任务');
            this.btnEnd.setStyle('#df3b3b', '#ffffff', 22, 8).setCallback(() => {
                this.isPaused = false;
                this.pausePressedButton = null;
                this.endGame(false, 0);
            });

            this.btnClose = null;
        } else {
            this.pausePressedButton = null;
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
