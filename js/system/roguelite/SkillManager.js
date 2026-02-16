import SkillDatabase, { Skills } from './SkillDatabase.js';
import { GameConfig } from '../../config.js';

export default class SkillManager {
    constructor(scene) {
        this.scene = scene;
        this.player = scene ? scene.player : null;

        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.expCurve = 1.24;

        this.acquiredSkills = [];
        this.pendingLevelUps = 0;
        this.currentOptions = [];

        this.deferTriggerHandle = null;
    }

    getPlayer() {
        if (this.scene && this.scene.player) {
            this.player = this.scene.player;
        }
        return this.player;
    }

    addExp(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        this.exp += amount;

        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.pendingLevelUps += 1;
            this.level += 1;
            this.expToNext = Math.floor(this.expToNext * this.expCurve);
        }

        if (this.pendingLevelUps > 0 && this.scene && !this.scene.isSelectingSkill) {
            this.triggerSkillSelect();
        }
    }

    triggerSkillSelect() {
        if (this.pendingLevelUps <= 0) return;
        if (!this.scene || this.scene.isSelectingSkill) return;

        if (typeof this.scene.canOpenSkillSelectionNow === 'function' && !this.scene.canOpenSkillSelectionNow()) {
            this.deferTriggerSkillSelect();
            return;
        }

        this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
        this.currentOptions = this.getSkillOptions();

        if (!Array.isArray(this.currentOptions) || this.currentOptions.length === 0) {
            if (this.pendingLevelUps > 0) {
                this.deferTriggerSkillSelect(120);
            }
            return;
        }

        if (this.shouldAutoSelectInBattle()) {
            const picked = this.pickAutoSkill(this.currentOptions);
            if (picked) {
                if (this.scene && this.scene.spawnFloatingText) {
                    this.scene.spawnFloatingText(`自动强化：${picked.name}`, GameConfig.Screen.width / 2, 220, '#00d2d3', 24);
                }
                this.applySkill(picked.id);
                return;
            }
        }

        this.scene.showSkillSelection(this.currentOptions);
    }

    deferTriggerSkillSelect(delay = 220) {
        if (this.deferTriggerHandle) return;
        this.deferTriggerHandle = setTimeout(() => {
            this.deferTriggerHandle = null;
            this.triggerSkillSelect();
        }, delay);
    }

    shouldAutoSelectInBattle() {
        if (!GameConfig.Gameplay || GameConfig.Gameplay.autoSkillSelectInBattle !== true) return false;
        return !!(this.scene && this.scene.constructor && this.scene.constructor.name === 'BattleScene');
    }

    pickAutoSkill(options) {
        if (!Array.isArray(options) || options.length === 0) return null;

        const rarityScore = { common: 10, rare: 30, legendary: 60 };
        const categoryScore = {
            core_damage: 50,
            projectile: 45,
            attack_speed: 40,
            survival: 35,
            mobility: 28,
            mechanic: 22,
            energy: 8
        };

        const levelById = new Map(this.acquiredSkills.map((s) => [s.id, s.level]));
        let best = null;
        let bestScore = -Infinity;

        for (const skill of options) {
            const currentLevel = levelById.get(skill.id) || 0;
            const remainLevel = Math.max(0, (skill.maxLevel || 1) - currentLevel);
            const score = (rarityScore[skill.rarity] || 0) + (categoryScore[skill.category] || 0) + remainLevel * 3 + Math.random();
            if (score > bestScore) {
                bestScore = score;
                best = skill;
            }
        }

        return best;
    }

    getSkillOptions() {
        const selectedSkillObjects = this.acquiredSkills.map((s) => ({
            ...(Skills[s.id] || {}),
            id: s.id,
            currentLevel: s.level
        }));
        return SkillDatabase.getOptions(this.level, selectedSkillObjects);
    }

    applySkill(skillId) {
        const skill = Skills[skillId];
        if (!skill) {
            console.error('Unknown skill:', skillId);
            return;
        }

        const player = this.getPlayer();
        const existing = this.acquiredSkills.find((s) => s.id === skillId);
        let currentLevel = 1;

        if (existing) {
            if (existing.level >= skill.maxLevel) {
                console.warn('Skill already at max level:', skillId);
                return;
            }
            existing.level += 1;
            currentLevel = existing.level;
        } else {
            this.acquiredSkills.push({
                id: skillId,
                level: 1,
                category: skill.category,
                rarity: skill.rarity
            });
        }

        if (skill.onApply && player) {
            skill.onApply(player, currentLevel);
        }

        if (this.scene && this.scene.effectManager && player) {
            this.scene.effectManager.spawnLevelUpAura(player.x, player.y);
        }

        if (this.pendingLevelUps > 0) {
            this.deferTriggerSkillSelect(320);
        }
    }

    getBuildSummary() {
        const categories = {};
        const rarities = { common: 0, rare: 0, legendary: 0 };

        this.acquiredSkills.forEach((skill) => {
            const skillData = Skills[skill.id];
            if (!skillData) return;
            categories[skillData.category] = (categories[skillData.category] || 0) + skill.level;
            rarities[skillData.rarity] += skill.level;
        });

        return {
            totalSkills: this.acquiredSkills.length,
            totalLevels: this.acquiredSkills.reduce((sum, s) => sum + s.level, 0),
            categories,
            rarities,
            skills: this.acquiredSkills
                .map((s) => ({
                    name: Skills[s.id] ? Skills[s.id].name : s.id,
                    level: s.level,
                    maxLevel: Skills[s.id] ? Skills[s.id].maxLevel : s.level,
                    rarity: s.rarity
                }))
        };
    }

    reset() {
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.acquiredSkills = [];
        this.pendingLevelUps = 0;
        this.currentOptions = [];

        if (this.deferTriggerHandle) {
            clearTimeout(this.deferTriggerHandle);
            this.deferTriggerHandle = null;
        }
    }
}

