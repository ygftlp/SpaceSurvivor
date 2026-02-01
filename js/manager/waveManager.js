/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 波次管理器，负责解析关卡配置并生成敌人。
 */

import { GameConfig } from '../config.js';
import Enemy from '../object/faction/enemy/Enemy.js';
import TitanBattleship from '../object/faction/enemy/boss/TitanBattleship.js';
import EnemyDatabase from '../data/enemyDatabase.js';

export default class WaveManager {
    constructor(game) {
        this.game = game; // Reference to Main class to access enemy list
        this.levelConfig = null;
        this.waveIndex = 0;
        this.levelTime = 0; // ms

        // 运行时状态
        this.activeSpawners = [];
    }

    startSurvival() {
        this.levelTime = 0;
        this.nextSpawnTime = 0;
        this.nextSupplyTime = 30; // First drop at 30s (was 60s)
        this.supplyCount = 0;
        this.maxSupplyDrops = 8; // Reduced to 8 for faster games
        this.difficulty = 1;
        this.firstEliteSpawned = false;
        this.firstBossTime = 180; // Boss at 3 mins (was implied 8-10)
        this.bossSpawned = false;
        console.log('Survival Mode Started - Fast Pace Edition');
    }

    update(dt) {
        this.levelTime += dt; // Seconds

        // 1. Difficulty Scaling (Increases every 60s)
        this.difficulty = 1 + Math.floor(this.levelTime / 60) * 0.5;

        // 2. Dynamic Spawning - Fast Start
        this.nextSpawnTime -= dt;
        if (this.nextSpawnTime <= 0) {
            this.spawnEnemy();

            // Fast start: quicker spawns early, ramps up to chaos
            // 0-30s: 0.8s interval (very fast start)
            // 30-60s: 0.5s interval (chaos begins)
            // 60s+: 0.3s interval (max chaos)
            let baseInterval;
            if (this.levelTime < 30) {
                baseInterval = 0.8;
            } else if (this.levelTime < 60) {
                baseInterval = 0.5;
            } else {
                baseInterval = 0.3;
            }
            
            this.nextSpawnTime = baseInterval;
        }

        // 2.5 Elite Enemy Spawn (First one at 45s to break monotony)
        if (!this.firstEliteSpawned && this.levelTime > 45) {
            this.spawnElite();
            this.firstEliteSpawned = true;
        }

        // 2.6 Boss Spawn (at firstBossTime)
        if (!this.bossSpawned && this.levelTime >= this.firstBossTime) {
            this.spawnBoss();
            this.bossSpawned = true;
        }

        // 3. Supply Drop (Dynamic Interval)
        if (this.levelTime >= this.nextSupplyTime) {
            this.game.spawnSupplyCrate();

            // Calculate Next Interval based on Performance
            // Base: 180s (3 mins)
            // Reduction: 
            // - Time: -1s per 10s survived
            // - Kills (Score): -1s per 50 score
            const timeReduction = Math.floor(this.levelTime / 10);
            const scoreReduction = Math.floor(this.game.score / 50);

            let interval = 180 - timeReduction - scoreReduction;

            // Hard Cap: Minimum 60s between drops
            interval = Math.max(60, interval);

            this.nextSupplyTime = this.levelTime + interval;
            console.log(`Next Supply in ${interval}s (TimeRed:-${timeReduction}, ScoreRed:-${scoreReduction})`);
        }
    }

    spawnEnemy() {
        // Get random enemy type based on difficulty
        const types = ['Drone_Small', 'Drone_Kamikaze'];
        if (this.levelTime > 60) types.push('Elite_Fighter');
        
        const type = types[Math.floor(Math.random() * types.length)];
        const enemyData = EnemyDatabase[type];
        
        if (!enemyData) return;
        
        // Spawn position (random x, above screen)
        const x = 50 + Math.random() * (GameConfig.Screen.width - 100);
        const y = -50;
        
        const enemy = new Enemy(x, y, type, this.game);
        
        // Scale with difficulty
        enemy.hp *= this.difficulty;
        enemy.maxHp = enemy.hp;
        
        this.game.enemies.push(enemy);
    }

    spawnElite() {
        console.log('ELITE INCOMING!');
        if (this.game.effectManager) {
            this.game.effectManager.shake(5, 0.5);
            this.game.effectManager.spawnFloatingText('⚡ 精英敌人出现!', GameConfig.Screen.width / 2, 250, '#ff00ff', 50);
        }
        
        const x = GameConfig.Screen.width / 2;
        const y = -100;
        const enemy = new Enemy(x, y, 'Elite_Fighter', this.game);
        enemy.hp *= 1.5;
        enemy.maxHp = enemy.hp;
        enemy.isElite = true;
        this.game.enemies.push(enemy);
    }

    spawnBoss() {
        console.log("WARNING: BOSS APPROACHING!");
        this.game.bossActive = true;

        // Shake screen to announce
        if (this.game.effectManager) {
            this.game.effectManager.shake(15, 2.0);
            this.game.effectManager.spawnFloatingText("⚠️ WARNING ⚠️", GameConfig.Screen.width / 2, 300, '#ff0000', 60);
        }

        const boss = new TitanBattleship(GameConfig.Screen.width / 2, -200, this.game);
        this.game.enemies.push(boss);
    }
}
