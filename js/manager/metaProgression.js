/**
 * MetaProgression - 局外成长系统
 * 管理：战机解锁、装备升级、永久属性强化
 */

import { dataManager } from './dataManager.js';

class MetaProgression {
    constructor() {
        // 战机解锁状态
        this.fighterUnlocks = {
            'J-20': { unlocked: true, level: 1, exp: 0 }, // 默认解锁
            'F-22': { unlocked: false, level: 0, exp: 0, unlockCost: 1000 }, // 击杀1000敌人解锁
            'Su-57': { unlocked: false, level: 0, exp: 0, unlockCost: 1 }, // 满血通关1次解锁
            'F-16': { unlocked: false, level: 0, exp: 0, unlockCost: 5 } // 通关5次解锁
        };

        // 装备系统（蓝图）
        this.equipment = {
            // 武器强化
            'weapon_damage': { level: 0, maxLevel: 10, baseValue: 0, perLevel: 5 }, // 每级+5%伤害
            'weapon_speed': { level: 0, maxLevel: 10, baseValue: 0, perLevel: 3 }, // 每级+3%射速
            
            // 防御强化  
            'hull_armor': { level: 0, maxLevel: 10, baseValue: 0, perLevel: 10 }, // 每级+10生命
            'shield_capacity': { level: 0, maxLevel: 10, baseValue: 0, perLevel: 8 }, // 每级+8护盾
            
            // 能量系统
            'energy_cell': { level: 0, maxLevel: 10, baseValue: 0, perLevel: 5 }, // 每级+5能量上限
            'cooling_system': { level: 0, maxLevel: 5, baseValue: 0, perLevel: 0.2 }, // 每级-0.2秒过热时间
            
            // 辅助系统
            'magnet_range': { level: 0, maxLevel: 10, baseValue: 150, perLevel: 15 }, // 拾取范围+15
            'exp_booster': { level: 0, maxLevel: 5, baseValue: 0, perLevel: 10 } // 每级+10%经验获取
        };

        // 蓝图收集
        this.blueprints = {
            common: 0,   // 普通蓝图（小怪掉落）
            rare: 0,     // 稀有蓝图（精英掉落）
            legendary: 0 // 传说蓝图（BOSS掉落）
        };

        // 成就追踪（用于解锁战机）
        this.stats = {
            totalKills: 0,
            totalGames: 0,
            fullHealthWins: 0,
            maxSurvivalTime: 0
        };

        this.load();
    }

    // 加载存档
    load() {
        const saved = wx.getStorageSync('metaProgression');
        if (saved) {
            Object.assign(this.fighterUnlocks, saved.fighterUnlocks || {});
            Object.assign(this.equipment, saved.equipment || {});
            Object.assign(this.blueprints, saved.blueprints || {});
            Object.assign(this.stats, saved.stats || {});
        }
    }

    // 保存存档
    save() {
        wx.setStorageSync('metaProgression', {
            fighterUnlocks: this.fighterUnlocks,
            equipment: this.equipment,
            blueprints: this.blueprints,
            stats: this.stats
        });
    }

    // 解锁战机检查
    checkFighterUnlock(fighterId, gameResult) {
        const fighter = this.fighterUnlocks[fighterId];
        if (fighter.unlocked) return false;

        let canUnlock = false;
        
        switch(fighterId) {
            case 'F-22':
                // 累计击杀1000敌人解锁
                if (this.stats.totalKills >= fighter.unlockCost) {
                    canUnlock = true;
                }
                break;
                
            case 'Su-57':
                // 满血通关1次解锁
                if (this.stats.fullHealthWins >= fighter.unlockCost) {
                    canUnlock = true;
                }
                break;
                
            case 'F-16':
                // 通关5次解锁
                if (this.stats.totalGames >= fighter.unlockCost) {
                    canUnlock = true;
                }
                break;
        }

        if (canUnlock) {
            fighter.unlocked = true;
            fighter.level = 1;
            this.save();
            return true;
        }
        return false;
    }

    // 战机升星（使用蓝图）
    upgradeFighter(fighterId) {
        const fighter = this.fighterUnlocks[fighterId];
        if (!fighter.unlocked) return false;

        // 每级需要：当前等级×50普通 + 10稀有蓝图
        const costCommon = fighter.level * 50;
        const costRare = fighter.level * 10;

        if (this.blueprints.common >= costCommon && 
            this.blueprints.rare >= costRare) {
            
            this.blueprints.common -= costCommon;
            this.blueprints.rare -= costRare;
            fighter.level++;
            fighter.exp = 0;
            this.save();
            return true;
        }
        return false;
    }

    // 获得战机属性加成
    getFighterBonus(fighterId) {
        const fighter = this.fighterUnlocks[fighterId];
        if (!fighter.unlocked) return { damage: 0, hp: 0, speed: 0 };

        const level = fighter.level;
        return {
            damage: level * 3,  // 每级+3%伤害
            hp: level * 5,      // 每级+5生命
            speed: level * 1    // 每级+1速度
        };
    }

    // 升级装备
    upgradeEquipment(equipmentId) {
        const equip = this.equipment[equipmentId];
        if (equip.level >= equip.maxLevel) return false;

        // 每级需要蓝图递增
        const costCommon = (equip.level + 1) * 30;
        const costRare = Math.floor((equip.level + 1) / 2) * 10;
        const costLegendary = equipmentId.includes('weapon') && equip.level >= 5 ? 5 : 0;

        if (this.blueprints.common >= costCommon &&
            this.blueprints.rare >= costRare &&
            this.blueprints.legendary >= costLegendary) {
            
            this.blueprints.common -= costCommon;
            this.blueprints.rare -= costRare;
            this.blueprints.legendary -= costLegendary;
            equip.level++;
            this.save();
            return true;
        }
        return false;
    }

    // 获取装备属性
    getEquipmentBonus() {
        const bonus = {
            damagePercent: 0,
            speedPercent: 0,
            hpBonus: 0,
            shieldBonus: 0,
            energyMax: 0,
            overheatReduction: 0,
            magnetRange: 150,
            expPercent: 0
        };

        // 武器伤害
        const weaponDmg = this.equipment.weapon_damage;
        bonus.damagePercent = weaponDmg.baseValue + weaponDmg.level * weaponDmg.perLevel;

        // 武器射速
        const weaponSpd = this.equipment.weapon_speed;
        bonus.speedPercent = weaponSpd.baseValue + weaponSpd.level * weaponSpd.perLevel;

        // 护甲生命
        const hull = this.equipment.hull_armor;
        bonus.hpBonus = hull.baseValue + hull.level * hull.perLevel;

        // 护盾容量
        const shield = this.equipment.shield_capacity;
        bonus.shieldBonus = shield.baseValue + shield.level * shield.perLevel;

        // 能量上限
        const energy = this.equipment.energy_cell;
        bonus.energyMax = energy.baseValue + energy.level * energy.perLevel;

        // 冷却系统
        const cooling = this.equipment.cooling_system;
        bonus.overheatReduction = cooling.baseValue + cooling.level * cooling.perLevel;

        // 拾取范围
        const magnet = this.equipment.magnet_range;
        bonus.magnetRange = magnet.baseValue + magnet.level * magnet.perLevel;

        // 经验加成
        const expBoost = this.equipment.exp_booster;
        bonus.expPercent = expBoost.baseValue + expBoost.level * expBoost.perLevel;

        return bonus;
    }

    // 游戏结束统计
    recordGameEnd(result) {
        this.stats.totalGames++;
        this.stats.totalKills += result.kills || 0;
        
        if (result.survivalTime > this.stats.maxSurvivalTime) {
            this.stats.maxSurvivalTime = result.survivalTime;
        }

        if (result.victory && result.playerHpPercent >= 0.95) {
            this.stats.fullHealthWins++;
        }

        // 蓝图奖励
        this.blueprints.common += result.blueprintsCommon || 0;
        this.blueprints.rare += result.blueprintsRare || 0;
        this.blueprints.legendary += result.blueprintsLegendary || 0;

        this.save();
    }

    // 检查是否有新解锁
    checkAllUnlocks() {
        const newUnlocks = [];
        
        ['F-22', 'Su-57', 'F-16'].forEach(id => {
            if (this.checkFighterUnlock(id)) {
                newUnlocks.push(id);
            }
        });

        return newUnlocks;
    }

    // 获取显示数据
    getDisplayData() {
        return {
            fighters: this.fighterUnlocks,
            equipment: this.equipment,
            blueprints: this.blueprints,
            stats: this.stats,
            totalBonus: this.getEquipmentBonus()
        };
    }
}

// 单例导出
export const metaProgression = new MetaProgression();
export default MetaProgression;
