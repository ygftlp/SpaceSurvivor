/**
 * 技能数据库 - 平衡优化版
 * 设计原则：
 * 1. 每局提供15-20次选择机会，构建完整BD
 * 2. 前期（1-5级）：提供基础数值技能
 * 3. 中期（6-12级）：解锁机制类技能
 * 4. 后期（13-20级）：传说技能质变
 * 5. 同类技能互斥，避免单一属性溢出
 */

// 稀有度权重配置
const RARITY_WEIGHTS = {
    early: { common: 70, rare: 25, legendary: 5 },      // 1-5级
    mid: { common: 40, rare: 45, legendary: 15 },       // 6-12级
    late: { common: 20, rare: 45, legendary: 35 }       // 13+级
};

// 技能分类标签
const SKILL_CATEGORIES = {
    CORE_DAMAGE: 'core_damage',      // 核心伤害
    PROJECTILE: 'projectile',        // 弹道数量
    ATTACK_SPEED: 'attack_speed',    // 攻速
    SURVIVAL: 'survival',            // 生存
    MOBILITY: 'mobility',            // 机动
    MECHANIC: 'mechanic',            // 特殊机制
    ENERGY: 'energy'                 // 能量相关
};

// 互斥技能组（同组技能不能同时选择）
const MUTUALLY_EXCLUSIVE = [
    ['DOUBLE_TAP', 'TRIPLE_THREAT', 'QUAD_BLASTER'],  // 弹道类互斥
    ['OVERCLOCKED', 'RAPID_FIRE', 'BLITZ'],           // 攻速类互斥
];

export const Skills = {
    // ========== 核心输出（必须存在） ==========
    'DOUBLE_TAP': {
        id: 'DOUBLE_TAP',
        name: '双重射击',
        type: 'passive',
        category: SKILL_CATEGORIES.PROJECTILE,
        stat: 'firepower',
        rarity: 'common',
        tier: 1,
        description: '弹道数量+1',
        maxLevel: 3,
        baseValue: 1,
        scaling: 'linear',
        icon: 'bullet_plus',
        weight: 100, // 出现权重
        prerequisites: [],
        onApply: (player, level) => {
            player.effectiveStats.count += 1;
            if (player.effectiveStats.count > 1 && player.effectiveStats.spread === 0) {
                player.effectiveStats.spread = 15;
            }
            console.log(`Double Tap Lv.${level}: 弹道=${player.effectiveStats.count}`);
        }
    },

    'TRIPLE_THREAT': {
        id: 'TRIPLE_THREAT',
        name: '三重威胁',
        type: 'passive',
        category: SKILL_CATEGORIES.PROJECTILE,
        stat: 'firepower',
        rarity: 'rare',
        tier: 2,
        description: '弹道数量+2，但射速-10%',
        maxLevel: 2,
        baseValue: 2,
        icon: 'bullet_plus',
        weight: 60,
        prerequisites: ['DOUBLE_TAP'], // 需要先学双重射击
        onApply: (player, level) => {
            player.effectiveStats.count += 2;
            player.effectiveStats.interval *= 1.1; // 射速惩罚
            console.log(`Triple Threat Lv.${level}: 弹道=${player.effectiveStats.count}, 间隔=${player.effectiveStats.interval}`);
        }
    },

    'HIGH_EXPLOSIVE': {
        id: 'HIGH_EXPLOSIVE',
        name: '高爆弹头',
        type: 'passive',
        category: SKILL_CATEGORIES.CORE_DAMAGE,
        stat: 'firepower',
        rarity: 'common',
        tier: 1,
        description: '伤害+20%',
        maxLevel: 5,
        baseValue: 0.20,
        scaling: 'additive',
        icon: 'damage_up',
        weight: 100,
        onApply: (player, level) => {
            player.effectiveStats.damage = Math.ceil(player.effectiveStats.damage * 1.20);
            console.log(`High Explosive Lv.${level}: 伤害=${player.effectiveStats.damage}`);
        }
    },

    'ARMOR_PIERCING': {
        id: 'ARMOR_PIERCING',
        name: '穿甲弹',
        type: 'passive',
        category: SKILL_CATEGORIES.CORE_DAMAGE,
        stat: 'firepower',
        rarity: 'rare',
        tier: 2,
        description: '伤害+25%，对精英/Boss额外+20%',
        maxLevel: 3,
        icon: 'piercing',
        weight: 50,
        prerequisites: ['HIGH_EXPLOSIVE'],
        onApply: (player, level) => {
            player.effectiveStats.damage = Math.ceil(player.effectiveStats.damage * 1.25);
            player.bonusVsElite = (player.bonusVsElite || 0) + 0.2;
            console.log(`Armor Piercing Lv.${level}: 对精英伤害+${player.bonusVsElite * 100}%`);
        }
    },

    // ========== 攻速流 ==========
    'OVERCLOCKED': {
        id: 'OVERCLOCKED',
        name: '超频核心',
        type: 'passive',
        category: SKILL_CATEGORIES.ATTACK_SPEED,
        stat: 'speed',
        rarity: 'common',
        tier: 1,
        description: '射速+15%，能量消耗+8%',
        maxLevel: 5,
        icon: 'speed_up',
        weight: 80,
        onApply: (player, level) => {
            player.effectiveStats.interval = Math.max(50, player.effectiveStats.interval * 0.85);
            player.energyCostPerShot *= 1.08;
            console.log(`Overclocked Lv.${level}: 间隔=${player.effectiveStats.interval}, 能耗=${player.energyCostPerShot}`);
        }
    },

    'RAPID_FIRE': {
        id: 'RAPID_FIRE',
        name: '急速射击',
        type: 'passive',
        category: SKILL_CATEGORIES.ATTACK_SPEED,
        stat: 'speed',
        rarity: 'rare',
        tier: 2,
        description: '射速+20%，伤害-10%',
        maxLevel: 3,
        icon: 'speed_up',
        weight: 50,
        prerequisites: ['OVERCLOCKED'],
        onApply: (player, level) => {
            player.effectiveStats.interval = Math.max(40, player.effectiveStats.interval * 0.8);
            player.effectiveStats.damage = Math.ceil(player.effectiveStats.damage * 0.9);
            console.log(`Rapid Fire Lv.${level}: 高射速低伤害Build`);
        }
    },

    // ========== 能量系统 ==========
    'ENERGY_EFFICIENCY': {
        id: 'ENERGY_EFFICIENCY',
        name: '能量优化',
        type: 'passive',
        category: SKILL_CATEGORIES.ENERGY,
        stat: 'utility',
        rarity: 'common',
        tier: 1,
        description: '射击能量消耗-15%',
        maxLevel: 5,
        icon: 'energy',
        weight: 90,
        onApply: (player, level) => {
            player.energyCostPerShot *= 0.85;
            console.log(`Energy Efficiency Lv.${level}: 能耗=${player.energyCostPerShot}`);
        }
    },

    'ENERGY_RESERVE': {
        id: 'ENERGY_RESERVE',
        name: '能量储备',
        type: 'passive',
        category: SKILL_CATEGORIES.ENERGY,
        stat: 'utility',
        rarity: 'rare',
        tier: 2,
        description: '最大能量+30，恢复速度+20%',
        maxLevel: 3,
        icon: 'energy',
        weight: 60,
        onApply: (player, level) => {
            player.maxEnergy += 30;
            player.energy = Math.min(player.maxEnergy, player.energy + 30);
            player.energyRegenRate *= 1.2;
            console.log(`Energy Reserve Lv.${level}: 能量上限=${player.maxEnergy}`);
        }
    },

    'COOLING_SYSTEM': {
        id: 'COOLING_SYSTEM',
        name: '冷却系统',
        type: 'passive',
        category: SKILL_CATEGORIES.ENERGY,
        stat: 'utility',
        rarity: 'legendary',
        tier: 3,
        description: '过热时间减半，过热时仍可缓慢射击',
        maxLevel: 1,
        icon: 'cooling',
        weight: 30,
        prerequisites: ['ENERGY_RESERVE'],
        onApply: (player, level) => {
            player.overheatDuration *= 0.5;
            player.canShootWhileOverheated = true;
            console.log('Cooling System: 过热时间减半！');
        }
    },

    // ========== 生存 ==========
    'HULL_REINFORCEMENT': {
        id: 'HULL_REINFORCEMENT',
        name: '船体加固',
        type: 'passive',
        category: SKILL_CATEGORIES.SURVIVAL,
        stat: 'defense',
        rarity: 'common',
        tier: 1,
        description: '最大生命值+20%',
        maxLevel: 5,
        icon: 'hp_up',
        weight: 80,
        onApply: (player, level) => {
            const increase = Math.floor(player.fighter.hp * 0.20);
            player.hp += increase;
            player.maxHp += increase;
            console.log(`Hull Reinforcement Lv.${level}: HP+${increase}`);
        }
    },

    'NANOBOTS': {
        id: 'NANOBOTS',
        name: '纳米修复',
        type: 'passive',
        category: SKILL_CATEGORIES.SURVIVAL,
        stat: 'defense',
        rarity: 'rare',
        tier: 2,
        description: '升级时恢复35%生命，每5秒自动恢复1%',
        maxLevel: 3,
        icon: 'heal',
        weight: 70,
        onApply: (player, level) => {
            player.healPercent(0.35);
            player.passiveRegen = (player.passiveRegen || 0) + 0.01;
            console.log(`Nanobots Lv.${level}: 获得持续恢复`);
        }
    },

    'ENERGY_SHIELD': {
        id: 'ENERGY_SHIELD',
        name: '偏导护盾',
        type: 'passive',
        category: SKILL_CATEGORIES.SURVIVAL,
        stat: 'defense',
        rarity: 'legendary',
        tier: 3,
        description: '获得可吸收80伤害的护盾，破盾时释放冲击波',
        maxLevel: 3,
        icon: 'shield',
        weight: 25,
        onApply: (player, level) => {
            if (!player.shieldSystem) {
                player.shieldSystem = { max: 0, current: 0, onBreak: null };
            }
            player.shieldSystem.max += 80;
            player.shieldSystem.current += 80;
            player.shieldSystem.onBreak = (scene) => {
                if (scene.effectManager) {
                    scene.effectManager.spawnExplosion(player.x, player.y, 'medium');
                    scene.effectManager.shake(8, 0.3);
                }
            };
            console.log(`Energy Shield Lv.${level}: 护盾=${player.shieldSystem.max}`);
        }
    },

    // ========== 机动性 ==========
    'AFTERBURNER': {
        id: 'AFTERBURNER',
        name: '加力燃烧',
        type: 'passive',
        category: SKILL_CATEGORIES.MOBILITY,
        stat: 'utility',
        rarity: 'common',
        tier: 1,
        description: '移动速度+15%',
        maxLevel: 3,
        icon: 'move_speed',
        weight: 70,
        onApply: (player, level) => {
            player.speed = Math.ceil(player.speed * 1.15);
            console.log(`Afterburner Lv.${level}: 速度=${player.speed}`);
        }
    },

    'EVASIVE_MANEUVERS': {
        id: 'EVASIVE_MANEUVERS',
        name: '闪避机动',
        type: 'passive',
        category: SKILL_CATEGORIES.MOBILITY,
        stat: 'utility',
        rarity: 'rare',
        tier: 2,
        description: '15%几率闪避敌人子弹',
        maxLevel: 3,
        icon: 'dodge',
        weight: 45,
        onApply: (player, level) => {
            player.dodgeChance = (player.dodgeChance || 0) + 0.15;
            console.log(`Evasive Maneuvers Lv.${level}: 闪避=${player.dodgeChance * 100}%`);
        }
    },

    // ========== 特殊机制 ==========
    'RICOCHET': {
        id: 'RICOCHET',
        name: '跳弹',
        type: 'passive',
        category: SKILL_CATEGORIES.MECHANIC,
        stat: 'firepower',
        rarity: 'rare',
        tier: 2,
        description: '子弹反弹1次，反弹后伤害-30%',
        maxLevel: 2,
        icon: 'bounce',
        weight: 40,
        prerequisites: ['DOUBLE_TAP'],
        onApply: (player, level) => {
            player.bulletBounce = (player.bulletBounce || 0) + 1;
            player.ricochetDamagePenalty = 0.7;
            console.log(`Ricochet Lv.${level}: 反弹次数=${player.bulletBounce}`);
        }
    },

    'CHAIN_LIGHTNING': {
        id: 'CHAIN_LIGHTNING',
        name: '电弧风暴',
        type: 'passive',
        category: SKILL_CATEGORIES.MECHANIC,
        stat: 'firepower',
        rarity: 'legendary',
        tier: 3,
        description: '命中时连锁2个敌人，连锁伤害50%',
        maxLevel: 3,
        icon: 'lightning',
        weight: 20,
        prerequisites: ['HIGH_EXPLOSIVE'],
        onApply: (player, level) => {
            player.chainLightning = (player.chainLightning || 0) + 2;
            player.chainDamage = 0.5;
            console.log(`Chain Lightning Lv.${level}: 连锁=${player.chainLightning}`);
        }
    },

    'MULTICAST': {
        id: 'MULTICAST',
        name: '多重施法',
        type: 'passive',
        category: SKILL_CATEGORIES.MECHANIC,
        stat: 'firepower',
        rarity: 'rare',
        tier: 2,
        description: '20%几率额外发射2发子弹',
        maxLevel: 3,
        icon: 'multicast',
        weight: 35,
        onApply: (player, level) => {
            player.multicastChance = (player.multicastChance || 0) + 0.2;
            player.multicastBonus = 2;
            console.log(`Multicast Lv.${level}: 触发率=${player.multicastChance * 100}%`);
        }
    },

    'EXECUTIONER': {
        id: 'EXECUTIONER',
        name: '处决者',
        type: 'passive',
        category: SKILL_CATEGORIES.MECHANIC,
        stat: 'firepower',
        rarity: 'legendary',
        tier: 3,
        description: '敌人血量<15%时立即斩杀，斩杀时恢复5能量',
        maxLevel: 1,
        icon: 'execution',
        weight: 15,
        prerequisites: ['ARMOR_PIERCING'],
        onApply: (player, level) => {
            player.executionThreshold = 0.15;
            player.executionEnergyGain = 5;
            console.log('Executioner: 斩杀线15%，回能5');
        }
    },

    'CRITICAL_STRIKE': {
        id: 'CRITICAL_STRIKE',
        name: '致命一击',
        type: 'passive',
        category: SKILL_CATEGORIES.MECHANIC,
        stat: 'firepower',
        rarity: 'rare',
        tier: 2,
        description: '25%暴击率，暴击伤害+50%',
        maxLevel: 3,
        icon: 'crit',
        weight: 50,
        onApply: (player, level) => {
            player.critChance = (player.critChance || 0) + 0.25;
            player.critDamage = (player.critDamage || 0) + 0.5;
            console.log(`Critical Strike Lv.${level}: 暴击=${player.critChance * 100}%`);
        }
    },

    // ========== 传说级质变技能 ==========
    'OMEGA_CANNON': {
        id: 'OMEGA_CANNON',
        name: '欧米加加农',
        type: 'passive',
        category: SKILL_CATEGORIES.CORE_DAMAGE,
        stat: 'firepower',
        rarity: 'legendary',
        tier: 4,
        description: '弹道合并为1发超级子弹，伤害=总弹道×150%',
        maxLevel: 1,
        icon: 'omega',
        weight: 10,
        prerequisites: ['TRIPLE_THREAT', 'ARMOR_PIERCING'],
        onApply: (player, level) => {
            const totalBullets = player.effectiveStats.count;
            player.effectiveStats.count = 1;
            player.effectiveStats.damage = Math.ceil(player.effectiveStats.damage * totalBullets * 1.5);
            player.effectiveStats.spread = 0;
            console.log(`Omega Cannon: 合并${totalBullets}弹道，伤害=${player.effectiveStats.damage}`);
        }
    },

    'PERPETUAL_MOTION': {
        id: 'PERPETUAL_MOTION',
        name: '永动引擎',
        type: 'passive',
        category: SKILL_CATEGORIES.ENERGY,
        stat: 'utility',
        rarity: 'legendary',
        tier: 4,
        description: '击杀敌人恢复2能量，无上限',
        maxLevel: 1,
        icon: 'perpetual',
        weight: 10,
        prerequisites: ['ENERGY_RESERVE', 'COOLING_SYSTEM'],
        onApply: (player, level) => {
            player.energyOnKill = 2;
            console.log('Perpetual Motion: 击杀回能2');
        }
    },

    'PHOENIX_PROTOCOL': {
        id: 'PHOENIX_PROTOCOL',
        name: '凤凰协议',
        type: 'passive',
        category: SKILL_CATEGORIES.SURVIVAL,
        stat: 'defense',
        rarity: 'legendary',
        tier: 4,
        description: '首次死亡时满血复活，无敌3秒，清除全场敌人',
        maxLevel: 1,
        icon: 'phoenix',
        weight: 10,
        prerequisites: ['ENERGY_SHIELD', 'NANOBOTS'],
        onApply: (player, level) => {
            player.phoenixReady = true;
            console.log('Phoenix Protocol: 复活就绪');
        }
    }
};

// ========== 技能数据库类 ==========
export default class SkillDatabase {
    /**
     * 根据玩家等级和已选技能，生成3个选项
     */
    static getOptions(playerLevel, selectedSkills = []) {
        const options = [];
        const selectedById = new Map(selectedSkills.map(s => [s.id, s]));
        const selectedIds = selectedSkills.map(s => s.id);

        // 确定当前阶段
        let phase = 'early';
        if (playerLevel >= 13) phase = 'late';
        else if (playerLevel >= 6) phase = 'mid';

        // 获取可用技能池：允许“未满级技能”再次出现
        const availableSkills = Object.values(Skills).filter(skill => {
            const ownedSkill = selectedById.get(skill.id);
            const ownedLevel = ownedSkill ? (ownedSkill.currentLevel || ownedSkill.level || 1) : 0;

            // 已满级技能不再出现
            if (ownedLevel >= skill.maxLevel) return false;

            // 检查等级要求
            if (skill.tier === 2 && playerLevel < 4) return false;
            if (skill.tier === 3 && playerLevel < 8) return false;
            if (skill.tier === 4 && playerLevel < 12) return false;

            // 检查前置条件（至少满足一个）
            if (skill.prerequisites && skill.prerequisites.length > 0) {
                const hasPrereq = skill.prerequisites.some(prereq => selectedIds.includes(prereq));
                if (!hasPrereq) return false;
            }

            // 互斥检查：只对“未拥有技能”生效，允许已拥有技能继续升级
            if (!ownedSkill) {
                for (let group of MUTUALLY_EXCLUSIVE) {
                    if (group.includes(skill.id)) {
                        const hasExclusive = group.some(id => selectedIds.includes(id) && id !== skill.id);
                        if (hasExclusive) return false;
                    }
                }
            }

            return true;
        });

        if (availableSkills.length === 0) return [];

        // 按稀有度分组
        const byRarity = { common: [], rare: [], legendary: [] };
        availableSkills.forEach(skill => {
            byRarity[skill.rarity].push(skill);
        });

        const weights = RARITY_WEIGHTS[phase];
        const rarityOrder = ['legendary', 'rare', 'common'];

        const pickByRarity = (rarity, usedCategories) => {
            const pool = byRarity[rarity].filter(s => !options.includes(s));
            if (pool.length === 0) return null;

            // 优先提供分类多样性，避免3张卡全是同一玩法
            const diversePool = pool.filter(s => !usedCategories.has(s.category));
            const source = diversePool.length > 0 ? diversePool : pool;

            source.sort((a, b) => b.weight - a.weight);
            return source[Math.floor(Math.random() * Math.min(3, source.length))];
        };

        // 最多尝试12次，避免在稀有度池为空时长循环
        let attempts = 0;
        while (options.length < 3 && attempts < 12) {
            attempts++;
            const rand = Math.random() * 100;
            const usedCategories = new Set(options.map(s => s.category));

            let preferredRarity;
            if (rand < weights.legendary) preferredRarity = 'legendary';
            else if (rand < weights.legendary + weights.rare) preferredRarity = 'rare';
            else preferredRarity = 'common';

            let picked = pickByRarity(preferredRarity, usedCategories);
            if (!picked) {
                for (const rarity of rarityOrder) {
                    picked = pickByRarity(rarity, usedCategories);
                    if (picked) break;
                }
            }

            if (!picked) break;
            options.push(picked);
        }

        // 保底机制：确保至少有一个输出技能
        const hasDamage = options.some(s => s.category === 'core_damage' || s.category === 'projectile');
        if (!hasDamage) {
            const damageSkill = availableSkills.find(s =>
                (s.category === 'core_damage' || s.category === 'projectile') &&
                !options.includes(s)
            );
            if (damageSkill) {
                if (options.length >= 3) options[options.length - 1] = damageSkill;
                else options.push(damageSkill);
            }
        }

        return options.slice(0, 3);
    }

    /**
     * 获取技能详细信息
     */
    static getSkill(id) {
        return Skills[id] || null;
    }
    
    /**
     * 检查技能是否可用
     */
    static isSkillAvailable(skillId, playerLevel, selectedSkills) {
        const skill = Skills[skillId];
        if (!skill) return false;
        
        const selectedIds = selectedSkills.map(s => s.id);
        if (selectedIds.includes(skillId)) return false;
        
        // 等级检查
        if (skill.tier === 2 && playerLevel < 4) return false;
        if (skill.tier === 3 && playerLevel < 8) return false;
        if (skill.tier === 4 && playerLevel < 12) return false;
        
        // 前置检查
        if (skill.prerequisites) {
            const hasPrereq = skill.prerequisites.some(p => selectedIds.includes(p));
            if (!hasPrereq) return false;
        }
        
        return true;
    }
}
