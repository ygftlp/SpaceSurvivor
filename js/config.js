/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 游戏配置表，包含武器参数、敌人属性和战利品掉落配置。
 */

const STANDARDS = {
    Speed: {
        SLOW: 300,
        MEDIUM: 500,
        FAST: 800,
        SNIPER: 1200,
        LASER: 1500
    }
};

export const GameConfig = {
    Screen: {
        width: 720,
        height: 1280
    },

    // UI Safe Area (Adapts to Notch/Capsule)
    SafeArea: {
        top: 20, // Default fallback
        height: 64, // Capsule height reference
        left: 20,
        right: 0,
        width: 0
    },

    // UI Style Constants
    UI: {
        Colors: {
            Primary: '#00d2d3',    // Cyan
            Secondary: '#5f27cd',  // Purple
            Accent: '#ff9f43',     // Orange
            Danger: '#ff6b6b',     // Red
            Success: '#1dd1a1',    // Green
            Warning: '#feca57',    // Yellow
            DarkBg: 'rgba(19, 15, 64, 0.95)', // Deep Blue/Black
            Glass: 'rgba(255, 255, 255, 0.1)',
            Text: '#c8d6e5',
            TextHighlight: '#ffffff'
        },
        Fonts: {
            Title: 'bold 48px Arial',
            Header: 'bold 32px Arial',
            Body: '16px Arial',
            Small: '12px Arial'
        }
    },

    // Runtime debug switches (enabled by 3-finger tap in main loop)
    Debug: {
        hitboxOverlay: false,
        touchPointOverlay: true,
        touchPointRadius: 18
    },

    Gameplay: {
        // Avoid interrupting combat with modal popups on level-up.
        autoSkillSelectInBattle: true
    },

    init() {
        if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
            try {
                const res = wx.getMenuButtonBoundingClientRect();
                const sys = wx.getSystemInfoSync();
                const screenW = sys.screenWidth; // Logical Width

                // Design Width = 720
                // We want to map Logical Coords to Design Coords (720)
                // Ratio = 720 / screenW
                const ratio = GameConfig.Screen.width / screenW;

                // Store safe area metrics (Converted to Design Pixels)
                this.SafeArea.top = res.top * ratio;
                this.SafeArea.height = res.height * ratio;
                this.SafeArea.width = res.width * ratio;
                this.SafeArea.right = res.right * ratio;

                // Symmetric Left Margin
                // Logical Margin = screenW - res.right
                // Design Margin = Logical Margin * ratio
                this.SafeArea.left = (screenW - res.right) * ratio;

                console.log(`GameConfig: Init Safe Area. ScreenW=${screenW}, Ratio=${ratio}, Top=${this.SafeArea.top}`);
            } catch (e) {
                console.warn('Failed to get menu button rect:', e);
            }
        }
    },

    // Global Standards Reference (Exposed)
    Standards: STANDARDS,

    // 玩家基础属性
    Player: {
        baseSpeed: 0, // 暂时均为跟随手指，速度无用
        baseHp: 100,
        hitboxRadius: 10 // 核心判定点半径
    },

    // 武器配置表 (Weapons Table)
    // type: 武器类型 (MainGun, SideGun, Missile)
    // level: 等级 (1-10)
    // damage: 单发伤害
    // interval: 射击间隔 (ms)
    // speed: 子弹飞行速度
    // spread: 散射角度
    Weapons: {
        'MainGun': [
            { level: 1, damage: 12, interval: 350, speed: STANDARDS.Speed.MEDIUM, count: 1, spread: 0 }, // 伤害10→12, 间隔200→350ms (手感优化)
            { level: 2, damage: 15, interval: 330, speed: STANDARDS.Speed.MEDIUM + 100, count: 2, spread: 10 }, // 双发
            { level: 3, damage: 18, interval: 310, speed: STANDARDS.Speed.FAST, count: 3, spread: 15 }, // 三发
            // ... 更多等级后续添加
        ]
    },

    // 敌人属性配置 (Enemy Stats)
    // hp: 生命值
    // speed: 移动速度
    // score: 击杀得分
    // dropRate: 掉落率 (0-1)
    Enemies: {
        'Drone_Small': { hp: 24, damage: 10, speed: 250, score: 12, dropRate: 0.1, movement: 'SINE', amplitude: 80, frequency: 1.5 },      // 速度3→250，添加SINE波浪移动
        'Drone_Kamikaze': { hp: 18, damage: 18, speed: 400, score: 18, dropRate: 0.05, movement: 'LINEAR' }, // 速度6→400，直线自杀式攻击
        'Elite_Fighter': { hp: 120, damage: 15, speed: 180, score: 120, dropRate: 0.5, movement: 'PROCEDURAL', movementConfig: { pattern: 'ZIGZAG', speedX: 80, radius: 120 } },   // 速度2→180，Z字形移动
        'Drone_Scout': { hp: 35, damage: 10, speed: 320, score: 24, dropRate: 0.15, movement: 'PROCEDURAL', movementConfig: { pattern: 'SINE', speedX: 60, radius: 60 } }      // 速度4→320，小幅度SINE
    },

    // 战机配置 (Fighters)
    // asset: 对应 generated image 路径 (实际项目中需移到 images/ 目录)
    // rotation: 修正图片朝向 (弧度), 比如图片朝右(0), 需转-90度(-PI/2)朝上
    // 战机配置移至 FighterFactory 管理

    // 装备品质颜色
    Rarity: {
        1: '#ffffff', // Common (白)
        2: '#00ff00', // Uncommon (绿)
        3: '#0000ff', // Rare (蓝)
        4: '#cc00ff', // Epic (紫)
        5: '#ffcc00'  // Legendary (金)
    },

    // 全局弹道配置 (Global Projectile Standards)
    // 用于统一敌我双方的飞行物基本手感
    Projectiles: {
        Speed: {
            SLOW: 300,
            MEDIUM: 500,
            FAST: 800,
            SNIPER: 1200,
            LASER: 1500
        },
        Damage: {
            LOW: 5,
            MEDIUM: 10,
            HIGH: 20,
            LETHAL: 50
        }
    },

    // 关卡配置 (Level Design)
    // 每一关包含多个波次 (Waves)
    Levels: {
        1: [
            // Wave 1: 简单兵蜂
            { time: 0, type: 'Drone_Small', count: 5, interval: 1000 },
            // Wave 2: 自爆机群
            { time: 8000, type: 'Drone_Kamikaze', count: 3, interval: 1500 },
            // Wave 3: 混合编队
            { time: 15000, type: 'Drone_Small', count: 8, interval: 800 },
            { time: 15500, type: 'Drone_Kamikaze', count: 2, interval: 2000 },
            // Boss 战 (暂用精英怪代替)
            { time: 25000, type: 'Elite_Fighter', count: 1, interval: 0 }
        ]
    }
};
