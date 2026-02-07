/**
 * HangarScene - 机库界面（局外成长）
 * 管理：战机选择、装备升级、蓝图查看
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import Button from '../object/ui/Button.js';
import { metaProgression } from '../manager/metaProgression.js';
import { dataManager } from '../manager/dataManager.js';

export default class HangarScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        
        this.tab = 'fighters'; // fighters / equipment / blueprints
        this.selectedFighter = 'J-20';
        
        this.initUI();
    }
    
    initUI() {
        const w = GameConfig.Screen.width;
        const h = this.sceneManager.game.logicHeight;
        
        // 返回按钮
        this.btnBack = new Button(20, 20, 60, 40, '返回');
        this.btnBack.setStyle('#444', '#fff', 16).setCallback(() => {
            this.sceneManager.switchScene('HOME');
        });
        
        // Tab按钮
        this.btnTabFighters = new Button(w/2 - 120, 80, 100, 36, '战机');
        this.btnTabFighters.setStyle('#2c3e50', '#fff', 14).setCallback(() => this.switchTab('fighters'));
        
        this.btnTabEquipment = new Button(w/2 - 10, 80, 100, 36, '装备');
        this.btnTabEquipment.setStyle('#34495e', '#fff', 14).setCallback(() => this.switchTab('equipment'));
        
        this.btnTabBlueprints = new Button(w/2 + 100, 80, 100, 36, '蓝图');
        this.btnTabBlueprints.setStyle('#34495e', '#fff', 14).setCallback(() => this.switchTab('blueprints'));
        
        this.uiComponents = [this.btnBack, this.btnTabFighters, this.btnTabEquipment, this.btnTabBlueprints];
    }
    
    switchTab(tab) {
        this.tab = tab;
        // 更新按钮样式
        const activeColor = '#2c3e50';
        const inactiveColor = '#34495e';
        
        this.btnTabFighters.setStyle(tab === 'fighters' ? activeColor : inactiveColor, '#fff', 14);
        this.btnTabEquipment.setStyle(tab === 'equipment' ? activeColor : inactiveColor, '#fff', 14);
        this.btnTabBlueprints.setStyle(tab === 'blueprints' ? activeColor : inactiveColor, '#fff', 14);
    }
    
    render(ctx) {
        const w = GameConfig.Screen.width;
        const h = this.sceneManager.game.logicHeight;
        
        // 背景
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('机库', w/2, 50);
        
        // 根据Tab渲染内容
        switch(this.tab) {
            case 'fighters':
                this.renderFighters(ctx, w, h);
                break;
            case 'equipment':
                this.renderEquipment(ctx, w, h);
                break;
            case 'blueprints':
                this.renderBlueprints(ctx, w, h);
                break;
        }
        
        // UI组件
        this.uiComponents.forEach(c => c.render(ctx));
    }
    
    renderFighters(ctx, w, h) {
        const data = metaProgression.getDisplayData();
        const fighters = data.fighters;
        
        // 战机列表（左侧）
        const startY = 140;
        const cardHeight = 100;
        let y = startY;
        
        Object.keys(fighters).forEach((fighterId, index) => {
            const fighter = fighters[fighterId];
            const isSelected = this.selectedFighter === fighterId;
            
            // 卡片背景
            ctx.fillStyle = isSelected ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255,255,255,0.05)';
            ctx.fillRect(20, y, w/2 - 40, cardHeight);
            
            if (isSelected) {
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 2;
                ctx.strokeRect(20, y, w/2 - 40, cardHeight);
            }
            
            // 战机名称
            ctx.fillStyle = fighter.unlocked ? '#fff' : '#666';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(fighterId, 40, y + 30);
            
            // 状态
            if (fighter.unlocked) {
                ctx.fillStyle = '#27ae60';
                ctx.font = '14px Arial';
                ctx.fillText(`Lv.${fighter.level}`, 40, y + 55);
                
                // 属性加成
                const bonus = metaProgression.getFighterBonus(fighterId);
                ctx.fillStyle = '#aaa';
                ctx.font = '12px Arial';
                ctx.fillText(`伤害+${bonus.damage}% 生命+${bonus.hp} 速度+${bonus.speed}`, 40, y + 75);
            } else {
                ctx.fillStyle = '#e74c3c';
                ctx.font = '14px Arial';
                ctx.fillText('未解锁', 40, y + 55);
                
                // 解锁条件
                ctx.fillStyle = '#888';
                ctx.font = '12px Arial';
                let condition = '';
                switch(fighterId) {
                    case 'F-22': condition = `击杀${data.stats.totalKills}/${fighter.unlockCost}敌人`; break;
                    case 'Su-57': condition = `满血通关${data.stats.fullHealthWins}/${fighter.unlockCost}次`; break;
                    case 'F-16': condition = `通关${data.stats.totalGames}/${fighter.unlockCost}次`; break;
                }
                ctx.fillText(condition, 40, y + 75);
            }
            
            // 选择按钮
            if (fighter.unlocked && !isSelected) {
                ctx.fillStyle = '#3498db';
                ctx.fillRect(w/2 - 110, y + 30, 70, 30);
                ctx.fillStyle = '#fff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('选择', w/2 - 75, y + 50);
            }
            
            y += cardHeight + 10;
        });
        
        // 右侧：选中战机详情
        const selectedData = fighters[this.selectedFighter];
        if (selectedData && selectedData.unlocked) {
            const detailX = w/2 + 20;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(this.selectedFighter, detailX, 160);
            
            // 升级按钮
            const bonus = metaProgression.getFighterBonus(this.selectedFighter);
            const nextLevel = selectedData.level + 1;
            const costCommon = selectedData.level * 50;
            const costRare = selectedData.level * 10;
            
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(detailX, 200, 150, 40);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('升星', detailX + 75, 225);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`需要: ${costCommon}普通 ${costRare}稀有蓝图`, detailX, 260);
        }
    }
    
    renderEquipment(ctx, w, h) {
        const data = metaProgression.getDisplayData();
        const equipment = data.equipment;
        const bonus = data.totalBonus;
        
        // 左侧：装备列表
        const startY = 140;
        let y = startY;
        
        Object.keys(equipment).forEach((equipId, index) => {
            const equip = equipment[equipId];
            
            // 装备名称映射
            const nameMap = {
                'weapon_damage': '武器伤害',
                'weapon_speed': '武器射速',
                'hull_armor': '护甲强化',
                'shield_capacity': '护盾容量',
                'energy_cell': '能量电池',
                'cooling_system': '冷却系统',
                'magnet_range': '磁力范围',
                'exp_booster': '经验加成'
            };
            
            // 卡片
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(20, y, w - 40, 60);
            
            // 名称
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(nameMap[equipId], 40, y + 25);
            
            // 等级
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`Lv.${equip.level}/${equip.maxLevel}`, 40, y + 50);
            
            // 效果
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            const currentValue = equip.baseValue + equip.level * equip.perLevel;
            ctx.fillText(`当前: +${currentValue}${equipId.includes('Percent') ? '%' : ''}`, 200, y + 35);
            
            // 升级按钮
            if (equip.level < equip.maxLevel) {
                ctx.fillStyle = '#27ae60';
                ctx.fillRect(w - 120, y + 15, 80, 30);
                ctx.fillStyle = '#fff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('升级', w - 80, y + 35);
            }
            
            y += 70;
        });
        
        // 底部：总属性加成
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.fillRect(20, h - 120, w - 40, 100);
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('总属性加成', 40, h - 95);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.fillText(`伤害+${bonus.damagePercent}% 射速+${bonus.speedPercent}% 生命+${bonus.hpBonus}`, 40, h - 75);
        ctx.fillText(`护盾+${bonus.shieldBonus} 能量+${bonus.energyMax} 拾取+${bonus.magnetRange}`, 40, h - 55);
    }
    
    renderBlueprints(ctx, w, h) {
        const data = metaProgression.getDisplayData();
        const blueprints = data.blueprints;
        
        // 蓝图展示
        const types = [
            { id: 'common', name: '普通蓝图', color: '#95a5a6', desc: '小怪掉落，用于基础升级' },
            { id: 'rare', name: '稀有蓝图', color: '#3498db', desc: '精英掉落，用于进阶升级' },
            { id: 'legendary', name: '传说蓝图', color: '#f39c12', desc: 'BOSS掉落，用于顶级装备' }
        ];
        
        const startY = 140;
        let y = startY;
        
        types.forEach(type => {
            const count = blueprints[type.id];
            
            // 图标
            ctx.fillStyle = type.color;
            ctx.beginPath();
            ctx.arc(60, y + 30, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // 名称
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(type.name, 100, y + 25);
            
            // 数量
            ctx.fillStyle = type.color;
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(count.toString(), w - 40, y + 30);
            
            // 描述
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(type.desc, 100, y + 55);
            
            y += 100;
        });
        
        // 获取途径提示
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(20, h - 150, w - 40, 130);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('获取途径', 40, h - 125);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText('普通蓝图: 击杀小怪、存活时间奖励', 40, h - 100);
        ctx.fillText('稀有蓝图: 击杀精英敌人、存活时间奖励', 40, h - 75);
        ctx.fillText('传说蓝图: 击杀BOSS、首次通关奖励', 40, h - 50);
    }
    
    handleInput(type, x, y) {
        for (let comp of this.uiComponents) {
            if (comp.handleInput(type, x, y)) return true;
        }
        
        // Tab切换点击检测
        if (type === 'touchstart') {
            const w = GameConfig.Screen.width;
            
            // 战机Tab
            if (x >= w/2 - 120 && x <= w/2 - 20 && y >= 80 && y <= 116) {
                this.switchTab('fighters');
                return true;
            }
            // 装备Tab
            if (x >= w/2 - 10 && x <= w/2 + 90 && y >= 80 && y <= 116) {
                this.switchTab('equipment');
                return true;
            }
            // 蓝图Tab
            if (x >= w/2 + 100 && x <= w/2 + 200 && y >= 80 && y <= 116) {
                this.switchTab('blueprints');
                return true;
            }
            
            // 战机选择（fighters tab）
            if (this.tab === 'fighters') {
                const startY = 140;
                const cardHeight = 100;
                
                ['J-20', 'F-22', 'Su-57', 'F-16'].forEach((id, index) => {
                    const cardY = startY + index * (cardHeight + 10);
                    if (x >= 20 && x <= w/2 - 40 && y >= cardY && y <= cardY + cardHeight) {
                        const fighter = metaProgression.fighterUnlocks[id];
                        if (fighter.unlocked) {
                            this.selectedFighter = id;
                        }
                        return true;
                    }
                });
            }
        }
        
        return false;
    }
}
