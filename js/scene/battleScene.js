import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import { audioManager } from '../manager/audioManager.js';
import Player from '../object/faction/player/Player.js';
import Enemy from '../object/faction/enemy/Enemy.js';
import Loot from '../object/item/loot.js';
import WaveManager from '../manager/waveManager.js';
import Mothership from '../object/Mothership.js';

import RenderUtils from '../utils/renderUtils.js';

import Button from '../object/ui/Button.js';
import Joystick from '../object/ui/Joystick.js';
import SkillCard from '../object/ui/SkillCard.js';
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

        // UI Components
        this.btnPause = null;
        this.joystick = null;
        this.uiComponents = [];
        this.skillCards = []; // New UI for skills
        this.isSelectingSkill = false;

        // Skill Pool
        this.skills = [
            { id: 'multishot', name: '多重射击', desc: '主炮发射数量 +1', iconColor: '#ff0000' },
            { id: 'speed', name: '引擎超频', desc: '移速 +20%', iconColor: '#00ff00' },
            { id: 'magnet', name: '磁力场', desc: '拾取范围 +50%', iconColor: '#0000ff' },
            { id: 'heal', name: '纳米修复', desc: '立即恢复 30% 生命', iconColor: '#ff00ff' }
        ];

        // Menu & Pause System
        this.isPaused = false;
        this.doomsdayActive = false;
        this.doomsdayTimer = 0;

        // ... (Keep existing props like toast)
        // Upgrade to array for multiple effects
        this.floatingTexts = [];
        this.lastGold = 0;
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

        // Effects
        this.effectManager = new EffectManager(this);

        // Mothership - 母舰保护系统（核心叙事锚点）
        this.mothership = new Mothership(this);

        // Roguelite
        this.skillManager = new SkillManager(this);

        // Roguelite Stats
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        this.magnetRange = 150; // Default pickup range

        // 1. Init Pause Button (Top-Left)
        const safeTop = GameConfig.SafeArea.top || 20;
        const safeLeft = GameConfig.SafeArea.left || 20;
        const capsuleH = GameConfig.SafeArea.height || 32;

        this.btnPause = new Button(safeLeft, safeTop, capsuleH, capsuleH, '||');
        this.btnPause.setStyle('rgba(0,0,0,0.5)', '#fff', 20, 10);
        this.btnPause.setCallback(() => {
            this.togglePause();
        });

        // 2. Init Joystick (Fixed Position - Right Side, Larger)
        const logicH = this.sceneManager.game.logicHeight;
        this.joystick = new Joystick(
            GameConfig.Screen.width - 120, // X: Right side
            logicH - 120,                  // Y: Bottom
            80,                            // Radius: Larger (was 60)
            false                          // Floating: False (Fixed)
        );

        // Joystick first (Background), Pause second (Foreground)
        this.uiComponents = [this.joystick, this.btnPause];

        // 3. HUD Positioning
        this.hudY = safeTop + capsuleH + 30;

        // 4. Create Player
        this.player = new Player(GameConfig.Screen.width / 2, logicH - 150, logicH);
        this.player.refreshStats();

        // 5. Start Survival Mode
        this.waveManager.startSurvival();
    }

    exit() {
        this.bullets = [];
        this.enemies = [];
    }

    update(dt) {
        // Pause Check
        if (this.isPaused) return;

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
                const speed = this.player.speed * 40;
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

        // Update Effects
        if (this.effectManager) {
            this.effectManager.update(dt);
        }

        // Update Mothership (母舰系统)
        if (this.mothership) {
            this.mothership.update(dt);
        }

        // Update Wave Manager
        this.waveManager.update(dt);

        // Update Player and spawn bullets
        if (this.player) {
            const newBullets = this.player.update(dt);
            if (newBullets.length > 0) this.bullets.push(...newBullets);
        }

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.update();
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
        const bullet = new Bullet(x, y, angle, speed, damage, true, config);
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

    endGame() {
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
        if (wreckageGold > 0) {
            dataManager.saveWreck(this.player.x, this.player.y, wreckageGold);
        }

        // Save
        dataManager.addGold(totalGold);

        // Return Home (In future, show ResultScene)
        this.sceneManager.switchScene('RESULT', {
            score: this.score,
            gold: totalGold,
            timeSeconds: Math.floor(this.waveManager.levelTime)
        });

        // Ideally we pass params to HomeScene to show "Last Round Results"
        // But removing battlefield gold drops is the main request.
    }

    checkCollisions() {
        // 1. Player Bullets vs Enemies
        this.bullets.forEach(b => {
            if (!b.active) return;
            this.enemies.forEach(e => {
                if (!e.active) return;
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                if (Math.sqrt(dx * dx + dy * dy) < (b.width + e.width) / 2) {
                    b.active = false;
                    
                    // Check execution threshold
                    const hpPercent = e.hp / e.maxHp;
                    if (this.player.executionThreshold && hpPercent <= this.player.executionThreshold) {
                        e.hp = 0; // Instant kill
                        this.effectManager.spawnFloatingText('处决!', e.x, e.y - 50, '#ff0000', 30);
                        this.effectManager.hitStop(0.05);
                    } else {
                        e.takeDamage(b.damage);
                    }

                    // Damage Text & Effects
                    if (this.effectManager) {
                        const isCrit = Math.random() < 0.1;
                        this.effectManager.spawnDamageText(e.x, e.y - 30, b.damage, isCrit);
                        
                        // Hit sparks on impact
                        this.effectManager.spawnParticle(b.x, b.y, '#ffff00', 3);
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
                        this.spawnFloatingText(`回收黑匣子! +${this.wreckage.gold}金币`, this.player.x, this.player.y - 50, '#ff9f43', 40);
                    }
                }
            }
        });

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

                    this.spawnFloatingText(`+${crate.goldValue} 金币`, crate.x, crate.y - 50, '#ffcc00', 40);
                }
            }
        }

        // 2. Enemies vs Player (Body Collision)
        if (this.player && this.player.hp > 0) {
            this.enemies.forEach(e => {
                if (!e.active) return;
                const dx = e.x - this.player.x;
                const dy = e.y - this.player.y;
                // Simple circle collision (approx)
                if (Math.sqrt(dx * dx + dy * dy) < (e.width + this.player.width) / 2.5) {
                    // Collision!
                    e.takeDamage(1000); // Enemy likely dies crashing into player
                    this.player.hp -= 20; // Player takes damage
                    console.log(`Player Hit! HP: ${this.player.hp}`);

                    // Heavy Shake & Flash
                    if (this.effectManager) {
                        this.effectManager.shake(20, 0.3);
                        this.effectManager.spawnDamageText(this.player.x, this.player.y, "-20", true);
                    }

                    if (this.player.hp <= 0) {
                        this.endGame();
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
        this.enemies.forEach(o => o.render(ctx)); // Keep enemies rendering here
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
            this.effectManager.renderComboUI(ctx);
        }

        // ========== 能量系统UI ==========
        // 玩家能量条和副武器技能按钮
        if (this.player) {
            this.player.renderUI(ctx, GameConfig.Screen.width, this.sceneManager.game.logicHeight);
            
            // 副武器技能按钮（右下角）
            this.renderSecondarySkillButton(ctx);
        }

        // Render Battle UI (Top HUD)
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';

        // Show Actual Gained Gold (from Crates + Wreckage)
        ctx.fillText(`金币: ${dataManager.getGold()}`, 20, this.hudY); // Show TOTAL gold or Session Gold?
        // Usually Rogue showing session earnings is better?
        // But dataManager.addGold adds to global bank.
        // Let's show Global or Session? Let's show Global for satisfaction?
        // Or Session? Let's stick to showing simple "Gold" for now.
        // Revert to simple text since we use Supply Drops now.

        ctx.fillText(`分数: ${this.score}`, 20, this.hudY + 30);

        // Survival Timer (Center Top)
        const t = this.waveManager.levelTime || 0;
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${m}:${s}`, GameConfig.Screen.width / 2, this.hudY + 10);

        // Supply Countdown (User Request)
        if (this.waveManager.supplyCount >= this.waveManager.maxSupplyDrops) {
            ctx.fillStyle = '#ff4757';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`补给已耗尽`, GameConfig.Screen.width / 2, this.hudY + 45);
        } else {
            const timeToSupply = Math.max(0, this.waveManager.nextSupplyTime - this.waveManager.levelTime);
            if (timeToSupply > 0) {
                const sm = Math.floor(timeToSupply / 60).toString();
                const ss = Math.floor(timeToSupply % 60).toString().padStart(2, '0');
                ctx.fillStyle = '#ffcc00'; // Gold
                ctx.font = '20px Arial';
                ctx.fillText(`补给(${this.waveManager.supplyCount}/${this.waveManager.maxSupplyDrops}): ${sm}:${ss}`, GameConfig.Screen.width / 2, this.hudY + 45);
            } else {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(`补给已抵达!`, GameConfig.Screen.width / 2, this.hudY + 45);
            }
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

        // Render Skill Selection Overlay
        if (this.isSelectingSkill) {
            // Dark Overlay
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, 0, GameConfig.Screen.width, this.sceneManager.game.logicHeight);

            // Title
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('选择升级奖励', GameConfig.Screen.width / 2, 200);

            // Cards
            // Cards
            if (this.skillCards) {
                this.skillCards.forEach(c => c.render(ctx));
            }
        }

        // Render Modal
        if (this.skillModal && this.skillModal.active) {
            this.skillModal.render(ctx);
        }
    }

    /**
     * 显示技能选择界面（SkillManager调用）
     */
    showSkillSelection(options) {
        console.log("Scene: Show Skill Selection");
        this.isPaused = true;

        // 获取玩家已选技能用于显示等级
        const playerSkills = this.skillManager ? this.skillManager.acquiredSkills || [] : [];

        // 创建新的技能选择弹窗
        this.skillModal = new SkillSelectionModal(this, options || this.skillManager.getSkillOptions(), (skillId) => {
            this.onSkillSelected(skillId);
        }, playerSkills);
        
        this.isSelectingSkill = true;
        console.log("Skill selection modal opened");
    }

    /**
     * 兼容旧方法名
     */
    showLevelUp() {
        this.showSkillSelection();
    }

    onSkillSelected(skillId) {
        console.log("Selected:", skillId);
        this.skillManager.applySkill(skillId);
        this.skillModal = null; // 销毁弹窗
        this.isSelectingSkill = false; // 清除选择状态
        this.isPaused = false; // 恢复游戏
    }

    /**
     * 渲染副武器技能按钮
     */
    renderSecondarySkillButton(ctx) {
        const width = GameConfig.Screen.width;
        const height = this.sceneManager.game.logicHeight || GameConfig.Screen.height;
        const btnX = width - 80;
        const btnY = height - 150;
        const btnRadius = 35;
        
        // 保存按钮位置（使用固定坐标，不依赖动态计算）
        this.secondarySkillBtn = { 
            x: btnX, 
            y: btnY, 
            radius: btnRadius,
            width: width,
            height: height
        };
        
        ctx.save();
        
        // 按钮背景
        ctx.beginPath();
        ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
        
        // 根据状态改变颜色
        if (this.player.secondarySkill.ready && this.player.energy >= this.player.secondarySkillCost) {
            // 就绪且能量充足 - 蓝色发光
            ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ccff';
        } else if (this.player.secondarySkill.ready) {
            // 就绪但能量不足 - 黄色
            ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
        } else {
            // 冷却中 - 灰色
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 按钮边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 导弹图标
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(btnX, btnY - 15);
        ctx.lineTo(btnX + 8, btnY + 12);
        ctx.lineTo(btnX, btnY + 8);
        ctx.lineTo(btnX - 8, btnY + 12);
        ctx.closePath();
        ctx.fill();
        
        // 冷却时间显示
        if (!this.player.secondarySkill.ready) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.ceil(this.player.secondarySkill.cooldown), btnX, btnY + 5);
        }
        
        // 能量消耗提示
        ctx.fillStyle = '#00ccff';
        ctx.font = '12px Arial';
        ctx.fillText(`${this.player.secondarySkillCost}能量`, btnX, btnY + btnRadius + 15);
        
        ctx.restore();
        // 按钮位置已在上面的开头保存
    }

    /**
     * 使用副武器技能
     */
    activateSecondarySkill() {
        if (!this.player) return;
        
        const missiles = this.player.useSecondarySkill();
        if (missiles.length > 0) {
            // 添加到子弹数组
            this.bullets.push(...missiles);
            
            // 视觉效果
            if (this.effectManager) {
                this.effectManager.spawnFloatingText(
                    '导弹齐射!',
                    this.player.x,
                    this.player.y - 50,
                    '#00ccff',
                    30
                );
                this.effectManager.shake(3, 0.2);
            }
            
            // 音效
            audioManager.play('explosion');
        }
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
        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, h);

        // Modal Box
        const mw = 400, mh = 300;
        const mx = (w - mw) / 2;
        const my = (h - mh) / 2;

        RenderUtils.drawPanel(ctx, mx, my, mw, mh);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暂停', w / 2, my + 60);

        // The buttons (Share/End) are actually "virtual" here for rendering
        // In a real component system, we would add them to uiComponents list when paused
        // But for simplicity, we mock render them here or assumes they are added to a "pauseUI" list.
        // Let's create proper buttons in togglePause() instead of hardcoding render here?
        // That is cleaner.
    }

    handleInput(type, x, y) {
        // Priority 0: Skill Selection Modal (新版技能选择界面)
        if (this.skillModal && this.skillModal.active) {
            const consumed = this.skillModal.handleInput(type, x, y);
            if (consumed) {
                return; // 技能选择界面消费了输入
            }
        }
        
        // Priority 0.5: 旧版技能选择（兼容）
        if (this.isSelectingSkill && this.skillCards && type === 'touchstart') {
            for (let i = 0; i < this.skillCards.length; i++) {
                const card = this.skillCards[i];
                if (card.handleInput && card.handleInput(type, x, y)) {
                    if (this.selectSkill) {
                        this.selectSkill(card.skill);
                    }
                    return;
                }
            }
            return; // Block other inputs
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
            
            // ========== 副武器技能按钮检测 ==========
            if (this.secondarySkillBtn && this.player) {
                const btn = this.secondarySkillBtn;
                const dx = x - btn.x;
                const dy = y - btn.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 调试输出（首次点击按钮区域时）
                if (dist <= btn.radius * 1.5) { // 1.5倍容错区域
                    console.log(`Skill button touched! dist=${dist.toFixed(1)}, btn=(${btn.x},${btn.y}), touch=(${x},${y})`);
                }
                
                if (dist <= btn.radius * 1.2) { // 1.2倍容错，更容易点击
                    console.log('Skill button activated!');
                    this.activateSecondarySkill();
                    return; // 消费此输入
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
        // Since Joystick is in uiComponents, but we need to ensure it gets drag events
        if (this.joystick) {
            this.joystick.handleInput(type, x, y);
        }

        // Game Input
        // (Legacy Touch Follow removed)
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const width = GameConfig.Screen.width;

        if (this.isPaused) {
            // Create Pause Menu Buttons
            const cx = width / 2;
            const cy = this.sceneManager.game.logicHeight / 2;

            this.btnContinue = new Button(cx - 100, cy - 20, 200, 60, '继续游戏');
            this.btnContinue.setStyle('#0984e3', '#fff', 24).setCallback(() => this.togglePause());

            this.btnEnd = new Button(cx - 100, cy + 60, 200, 60, '结束游戏');
            this.btnEnd.setStyle('#d63031', '#fff', 24).setCallback(() => {
                this.endGame();
            });

            this.btnShare = new Button(cx - 100, cy + 140, 200, 60, '分享游戏');
            this.btnShare.setStyle('#00b894', '#fff', 24).setCallback(() => {
                wx.shareAppMessage({ title: `我在太空幸存者中得了${this.score}分！` });
            });

            // Close (Delete) Button - Top Right of Modal
            const mw = 400, mh = 300;
            const mx = (width - mw) / 2; // Center X
            const my = (this.sceneManager.game.logicHeight - mh) / 2; // Center Y

            this.btnClose = new Button(mx + mw - 40, my - 10, 50, 50, 'X');
            this.btnClose.setStyle('#ff7675', '#fff', 24, 25).setCallback(() => this.togglePause());

            this.uiComponents.push(this.btnContinue, this.btnEnd, this.btnShare, this.btnClose);

        } else {
            // Remove Pause Menu Buttons
            // Keep only btnPause
            this.uiComponents = [this.btnPause, this.joystick];
            this.btnContinue = null;
            this.btnEnd = null;
            this.btnShare = null;
            this.btnClose = null;
        }
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.5);

        console.log(`Level Up! Lv.${this.level}`);
        this.showLevelUpUI();
    }

    showLevelUpUI() {
        this.isPaused = true;
        this.isSelectingSkill = true;

        // Generate 3 Random Options
        const options = [];
        for (let i = 0; i < 3; i++) {
            const rand = this.skills[Math.floor(Math.random() * this.skills.length)];
            options.push(rand);
        }

        // Create Cards
        this.skillCards = [];
        const cardW = 500;
        const cardH = 100;
        const startY = this.sceneManager.game.logicHeight / 2 - 200;
        const centerX = (GameConfig.Screen.width - cardW) / 2;

        options.forEach((skill, index) => {
            const card = new SkillCard(centerX, startY + index * 120, cardW, cardH, skill, index);
            this.skillCards.push(card);
        });
    }

    selectSkill(skill) {
        console.log('Selected Skill:', skill.name);

        // Apply Skill Effect
        if (this.player) {
            switch (skill.id) {
                case 'multishot':
                    this.player.applyBuff('barrage');
                    break;
                case 'speed':
                    this.player.applyBuff('move_speed');
                    break;
                case 'heal':
                    this.player.healPercent(0.3);
                    break;
                case 'magnet':
                    this.magnetRange *= 1.5;
                    break;
            }

            this.toast.text = `获得: ${skill.name}`;
            this.toast.active = true;
            this.toast.timer = 2;
            this.toast.y = this.sceneManager.game.logicHeight / 2;
        }

        // Resume
        this.isSelectingSkill = false;
        this.isPaused = false;
        this.skillCards = [];

        // Check if enough EXP for another level?
        if (this.exp >= this.maxExp) {
            // Delay slightly or call immediately?
            // Calling immediately might be abrupt. Let's do it next frame or simply allow it.
            // For now, let the player play a bit.
        }
    }

}
