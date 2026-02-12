/**
 * 波次导演系统 - 90秒简化版
 * 3幕剧本模式：0-30秒（序章），30-60秒（高潮），60-90秒（终章BOSS）
 */

import { GameConfig } from '../config.js';
import Enemy from '../object/faction/enemy/Enemy.js';
import TitanBattleship from '../object/faction/enemy/boss/TitanBattleship.js';
import EnemyDatabase from '../data/enemyDatabase.js';

// 剧本常量定义：[开始时间, 结束时间, 敌人类型, 数量, 间隔秒数, 导演提示]
const WAVE_SCRIPT = [
    // ========== 第1幕：序章 (0-30秒) ==========
    [0, 3, 'Drone_Small', 1, 0, '保护母舰90秒！'],      // 序章-0：立即生成1个
    [5, 15, 'Drone_Small', 2, 5, null],                // 序章-1：2个敌人，间隔5秒
    [15, 25, 'Drone_Kamikaze', 2, 5, '⚠ 自杀式无人机！'], // 序章-2：2个自杀机
    
    // ========== 第2幕：高潮 (30-60秒) ==========
    [30, 35, 'Elite_Fighter', 1, 0, '⚠ 精英出现！'],   // 高潮-1：1个精英
    [35, 45, 'Drone_Small', 3, 5, '虫潮来袭！'],       // 高潮-2：3个敌人，间隔5秒
    [45, 55, 'Drone_Kamikaze', 2, 5, null],            // 高潮-3：2个自杀机
    
    // ========== 第3幕：终章BOSS (60-90秒) ==========
    [60, 70, 'Elite_Fighter', 1, 10, '⚠ 精英巡逻！'],  // 终章-1：1个精英
    [75, 85, 'boss_pre', 1, 0, '⚠ BOSS接近！'],        // 终章-2：BOSS前奏
    [85, 90, 'BOSS', 1, 0, '🚨 BOSS战开始！']           // 终章-3：BOSS战
];

export default class WaveManager {
    constructor(game) {
        this.game = game;
        this.levelConfig = null;
        this.levelTime = 0;
        
        // 剧本追踪状态
        this.currentWaveIndex = 0;
        this.spawnQueue = [];
        this.nextSpawnTime = 0;
        this.supplyCount = 0;
        this.maxSupplyDrops = 3; // 减少补给次数（90秒游戏）
        this.bossSpawned = false;
        this.currentAct = 1;
        
        // 导演提示状态
        this.currentHint = null;
        this.hintTimer = 0;
    }

    startSurvival() {
        this.levelTime = 0;
        this.currentWaveIndex = 0;
        this.spawnQueue = [];
        this.nextSpawnTime = 0;
        this.supplyCount = 0;
        this.maxSupplyDrops = 3;
        this.bossSpawned = false;
        this.currentAct = 1;
        this.currentHint = null;
        this.hintTimer = 0;
        
        console.log('=== 导演系统启动 ===');
        console.log('游戏时长: 90秒');
        console.log('剧本条目数:', WAVE_SCRIPT.length);
        console.log('第一条剧本:', WAVE_SCRIPT[0]);
    }

    update(dt) {
        this.levelTime += dt;
        
        // 更新导演提示计时器
        if (this.hintTimer > 0) {
            this.hintTimer -= dt;
            if (this.hintTimer <= 0) {
                this.currentHint = null;
            }
        }
        
        // 检查当前时间对应的剧本条目
        while (this.currentWaveIndex < WAVE_SCRIPT.length) {
            const [start, end, type, count, interval, hint] = WAVE_SCRIPT[this.currentWaveIndex];
            
            if (this.levelTime >= start && this.levelTime < end) {
                // 在这个时间段内
                this.nextSpawnTime -= dt;
                if (this.nextSpawnTime <= 0) {
                    this.spawnFromScript(type, count, hint);
                    this.nextSpawnTime = interval;
                }
                break;
            } else if (this.levelTime >= end) {
                // 进入下一个剧本条目
                this.currentWaveIndex++;
                // 更新当前幕数
                if (this.currentWaveIndex < WAVE_SCRIPT.length) {
                    const nextEntry = WAVE_SCRIPT[this.currentWaveIndex];
                    const nextAct = Math.floor(nextEntry[0] / 30) + 1;
                    if (nextAct !== this.currentAct) {
                        this.currentAct = nextAct;
                        console.log(`========== 第${this.currentAct}幕开始 ==========`);
                    }
                }
            } else {
                // 还未到这个时间段
                break;
            }
        }
    }

    spawnFromScript(type, count, hint) {
        console.log(`[剧本] 时间:${this.levelTime.toFixed(1)}s 生成:${type} 数量:${count}`);
        
        // 处理特殊类型
        switch(type) {
            case 'mixed_basic':
                // 混合基础敌人
                for (let i = 0; i < count; i++) {
                    const types = ['Drone_Small', 'Drone_Scout', 'Drone_Kamikaze'];
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    this.spawnEnemy(randomType);
                }
                break;
                
            case 'mixed_swarm':
                // 混合虫潮
                for (let i = 0; i < count; i++) {
                    const types = ['Drone_Small', 'Drone_Small', 'Drone_Kamikaze'];
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    this.spawnEnemy(randomType);
                }
                break;
                
            case 'mixed_elite':
                // 混合精英
                for (let i = 0; i < count; i++) {
                    this.spawnEnemy('Elite_Fighter');
                }
                break;
                
            case 'intense':
                // 高强度波次 - 生成2个敌人
                for (let i = 0; i < 2; i++) {
                    const types = ['Drone_Small', 'Drone_Kamikaze'];
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    setTimeout(() => {
                        if (this.game && this.game.enemies) {
                            this.spawnEnemy(randomType);
                        }
                    }, i * 800);
                }
                break;
                
            case 'boss_pre':
                // BOSS前奏 - 清理敌人并生成杂兵
                console.log('BOSS前奏：清理战场');
                for (let i = 0; i < count; i++) {
                    this.spawnEnemy('Drone_Small');
                }
                break;
                
            case 'BOSS':
                // 生成BOSS
                if (!this.bossSpawned) {
                    this.spawnBoss();
                    this.bossSpawned = true;
                }
                break;
                
            case 'supply':
                // 生成补给箱
                if (this.supplyCount < this.maxSupplyDrops) {
                    this.spawnSupply();
                    this.supplyCount++;
                }
                break;
                
            default:
                // 标准敌人生成
                for (let i = 0; i < count; i++) {
                    this.spawnEnemy(type);
                }
        }
        
        // 显示导演提示
        if (hint && hint !== this.currentHint) {
            this.currentHint = hint;
            this.hintTimer = 4.0; // 提示显示4秒
            console.log(`[导演] ${hint}`);
            
            // 在游戏场景中显示提示
            if (this.game && this.game.showDirectorHint) {
                this.game.showDirectorHint(hint);
            }
        }
    }

    spawnEnemy(type) {
        if (!this.game) return;
        
        // 预定义的敌人类型配置
        const enemyConfigs = {
            'Drone_Small': {
                chassis: 'SCOUT',
                hp: 20,
                speed: 150,
                damage: 5,
                score: 10,
                movement: 'LINEAR',
                weapon: 'NONE',
                scale: 0.7
            },
            'Drone_Kamikaze': {
                chassis: 'SCOUT',
                hp: 15,
                speed: 250,
                damage: 15,
                score: 15,
                movement: 'LINEAR',
                weapon: 'NONE',
                scale: 0.7,
                color: '#ff6600'
            },
            'Drone_Scout': {
                chassis: 'SCOUT',
                hp: 25,
                speed: 180,
                damage: 8,
                score: 12,
                movement: 'SINE',
                weapon: 'PEA_SHOOTER',
                scale: 0.7
            },
            'Elite_Fighter': {
                chassis: 'FIGHTER',
                hp: 80,
                speed: 120,
                damage: 15,
                score: 50,
                movement: 'ZIGZAG',
                weapon: 'SPREAD_SHOT',
                scale: 1.0
            }
        };
        
        const config = enemyConfigs[type] || enemyConfigs['Drone_Small'];
        
        // 根据当前幕数调整难度
        const difficultyMultiplier = 1 + (this.currentAct - 1) * 0.2;
        config.hp = Math.floor(config.hp * difficultyMultiplier);
        config.damage = Math.floor(config.damage * difficultyMultiplier);
        
        // 随机生成位置（从屏幕上方）
        const x = 80 + Math.random() * (GameConfig.Screen.width - 160);
        const y = -50;
        
        // 创建敌人实例
        const enemy = new Enemy(config, x, y, this.game);
        
        // 设置固定高度为400-600之间（中空层），确保可见性
        enemy.altitude = 400 + Math.random() * 200;
        
        this.game.enemies.push(enemy);
        
        // 生成特效 - 明显的入场提示
        if (this.game.effectManager) {
            // 红色警示圈
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const px = x + Math.cos(angle) * 40;
                const py = y + Math.sin(angle) * 40;
                this.game.effectManager.spawnParticle(px, py, '#ff0000', 3);
            }
            // 中心爆炸效果
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 30;
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                this.game.effectManager.spawnParticle(px, py, '#ff6600', 4);
            }
        }
        
        console.log(`Spawned ${type} at (${Math.floor(x)}, ${Math.floor(y)}, altitude: ${Math.floor(enemy.altitude)})`);
    }

    spawnBoss() {
        if (!this.game) return;
        
        console.log('生成BOSS：泰坦战舰！');
        const boss = new TitanBattleship(GameConfig.Screen.width / 2, 150, this.game);
        this.game.enemies.push(boss);
        
        // BOSS战特殊处理
        if (this.game.onBossSpawned) {
            this.game.onBossSpawned(boss);
        }
    }

    spawnSupply() {
        if (!this.game) return;
        
        // 随机位置生成补给箱
        const x = 100 + Math.random() * (GameConfig.Screen.width - 200);
        const y = -50; // 从屏幕上方掉落
        
        // 创建补给箱（使用SupplyCrate类）
        if (this.game.spawnSupplyCrate) {
            this.game.spawnSupplyCrate(x, y);
        }
    }

    /**
     * 获取当前幕数（用于UI显示）
     */
    getCurrentAct() {
        return this.currentAct;
    }

    /**
     * 获取当前导演提示
     */
    getCurrentHint() {
        return this.currentHint;
    }

    /**
     * 获取剩余时间（秒）
     */
    getRemainingTime() {
        return Math.max(0, 90 - this.levelTime);
    }

    /**
     * 获取进度百分比（0-100）
     */
    getProgressPercent() {
        return Math.min(100, (this.levelTime / 90) * 100);
    }
}
