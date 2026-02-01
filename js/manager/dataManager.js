/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 数据管理器，负责管理玩家存档、背包、装备和货币。
 */

import { GameConfig } from '../config.js';
import { platform } from '../platform/index.js';

export default class DataManager {
    constructor() {
        this.data = {
            gold: 0,
            diamonds: 0,
            playerLevel: 1,
            currentFighter: 'J-20', // Default Fighter
            unlockedFighters: ['J-20'],
            inventory: [], // 背包物品列表
            equipment: {
                mainWeapon: null, // { id, level, rarity }
                armor: null,
                wingman: null,
                radar: null
            },
            currentStage: 1
        };

        this.loadData();
    }

    // 模拟读取本地存档
    loadData() {
        const saved = platform.getStorage('SpaceSurvivorData');
        if (saved) {
            this.data = { ...this.data, ...JSON.parse(saved) };
            console.log("Save data loaded.");
        } else {
            // 初始化默认装备
            this.giveInitialEquipment();
        }
    }

    saveData() {
        platform.setStorage('SpaceSurvivorData', JSON.stringify(this.data));
    }

    createDefaultEquipment() {
        // ...
        return {
            id: 'mw_01',
            type: 'MainGun',
            level: 1,
            rarity: 1
        };
    }

    unlockFighter(fighterId) {
        if (!this.data.unlockedFighters.includes(fighterId)) {
            this.data.unlockedFighters.push(fighterId);
            this.save();
        }
    }

    setFighter(fighterId) {
        if (this.data.unlockedFighters.includes(fighterId)) {
            this.data.currentFighter = fighterId;
            this.save();
        }
    }

    giveInitialEquipment() {
        // 给一个 1 级主武器
        this.data.inventory.push({
            id: 'wp_main_01',
            type: 'MainGun',
            rarity: 1,
            level: 1
        });
        // 自动装备
        this.data.equipment.mainWeapon = this.data.inventory[0];
        console.log("Initial equipment granted.");
    }

    save() {
        this.data.equipment.mainWeapon = this.data.inventory[0];
        console.log("Initial equipment granted.");
    }

    // 获取当前主武器的属性配置
    getCurrentWeaponStats() {
        const weapon = this.data.equipment.mainWeapon;
        if (!weapon) {
            // 默认属性（无装备）
            return GameConfig.Weapons['MainGun'][0];
        }

        // 查找配置表 (目前简化逻辑：直接按武器等级对应 Config 索引)
        // 实际逻辑可能更复杂，涉及品质加成等
        const safeIndex = Math.min(weapon.level - 1, GameConfig.Weapons['MainGun'].length - 1);
        return GameConfig.Weapons['MainGun'][safeIndex];
    }

    addGold(amount) {
        this.data.gold += amount;
        this.saveData();
    }

    getGold() {
        return this.data.gold;
    }

    // Shadow Challenge: Save death location
    saveWreck(x, y, goldReward) {
        this.data.wreckage = {
            x: x,
            y: y,
            gold: goldReward,
            timestamp: Date.now()
        };
        this.saveData();
        console.log(`Wreckage saved at ${x},${y} with ${goldReward} gold.`);
    }

    getWreck() {
        return this.data.wreckage;
    }

    clearWreck() {
        this.data.wreckage = null;
        this.saveData();
    }
}

// 单例模式
export const dataManager = new DataManager();
