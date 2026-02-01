import SkillDatabase, { Skills } from './SkillDatabase.js';

/**
 * 技能管理器 - 平衡优化版
 * 管理玩家升级、技能选择和Build构建
 */
export default class SkillManager {
    constructor(scene) {
        this.scene = scene;
        this.player = scene.player;

        // 成长状态
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        
        // 经验曲线调整（更快升级）
        this.expCurve = 1.3; // 原来是1.5

        // 技能状态
        this.acquiredSkills = []; // 已获得的技能列表（包含等级）
        this.pendingLevelUps = 0; // 待处理的升级次数（支持连升多级）
        
        // 当前选项缓存
        this.currentOptions = [];
    }

    addExp(amount) {
        this.exp += amount;

        // 检查是否升级（支持连升）
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.pendingLevelUps++;
            this.level++;
            this.expToNext = Math.floor(this.expToNext * this.expCurve);
        }
        
        // 有升级待处理时触发UI
        if (this.pendingLevelUps > 0 && !this.scene.isSelectingSkill) {
            this.triggerSkillSelect();
        }
    }

    triggerSkillSelect() {
        if (this.pendingLevelUps <= 0) return;
        
        this.pendingLevelUps--;
        console.log(`Level Up! Lv.${this.level} (${this.pendingLevelUps} more pending)`);
        
        // 生成选项
        this.currentOptions = this.getSkillOptions();
        
        // 触发UI显示
        this.scene.showSkillSelection(this.currentOptions);
    }

    /**
     * 获取技能选项（根据当前等级和已选技能）
     */
    getSkillOptions() {
        // 将已选技能转换为技能对象
        const selectedSkillObjects = this.acquiredSkills.map(s => ({
            ...Skills[s.id],
            currentLevel: s.level
        }));
        
        return SkillDatabase.getOptions(this.level, selectedSkillObjects);
    }

    /**
     * 应用选中的技能
     */
    applySkill(skillId) {
        const skill = Skills[skillId];
        if (!skill) {
            console.error('Unknown skill:', skillId);
            return;
        }
        
        // 查找是否已拥有
        const existing = this.acquiredSkills.find(s => s.id === skillId);
        let currentLevel = 1;
        
        if (existing) {
            // 升级现有技能
            if (existing.level >= skill.maxLevel) {
                console.warn('Skill already at max level:', skillId);
                return;
            }
            existing.level++;
            currentLevel = existing.level;
            console.log(`Skill upgraded: ${skill.name} Lv.${currentLevel}`);
        } else {
            // 学习新技能
            this.acquiredSkills.push({
                id: skillId,
                level: 1,
                category: skill.category,
                rarity: skill.rarity
            });
            console.log(`New skill acquired: ${skill.name}`);
        }
        
        // 执行技能效果
        if (skill.onApply && this.player) {
            skill.onApply(this.player, currentLevel);
        }
        
        // 如果还有未处理的升级，继续显示
        if (this.pendingLevelUps > 0) {
            setTimeout(() => this.triggerSkillSelect(), 500);
        }
    }

    /**
     * 获取已选技能摘要（用于显示Build）
     */
    getBuildSummary() {
        const categories = {};
        const rarities = { common: 0, rare: 0, legendary: 0 };
        
        this.acquiredSkills.forEach(skill => {
            const skillData = Skills[skill.id];
            
            // 分类统计
            categories[skillData.category] = (categories[skillData.category] || 0) + skill.level;
            
            // 稀有度统计
            rarities[skillData.rarity] += skill.level;
        });
        
        return {
            totalSkills: this.acquiredSkills.length,
            totalLevels: this.acquiredSkills.reduce((sum, s) => sum + s.level, 0),
            categories,
            rarities,
            skills: this.acquiredSkills.map(s => ({
                name: Skills[s.id].name,
                level: s.level,
                maxLevel: Skills[s.id].maxLevel,
                rarity: s.rarity
            }))
        };
    }

    /**
     * 重置技能（局外升级或重新开始）
     */
    reset() {
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.acquiredSkills = [];
        this.pendingLevelUps = 0;
        this.currentOptions = [];
    }
}
