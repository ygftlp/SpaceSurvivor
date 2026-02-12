/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 机库界面，显示装备信息和开始按钮。
 */

import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import RenderUtils from '../utils/renderUtils.js';

export default class HangarUI {
    constructor(startBattleCallback) {
        this.visible = true;
        this.startBattleCallback = startBattleCallback;

        // 布局常量
        this.width = GameConfig.Screen.width;
        this.height = GameConfig.Screen.height;

        // 按钮区域 (逻辑坐标)
        this.btnStart = {
            x: this.width / 2 - 110,
            y: this.height - 180,
            w: 220,
            h: 70
        };
    }

    handleInput(logicX, logicY) {
        if (!this.visible) return false;

        // 检查点击 "Start" 按钮
        if (logicX >= this.btnStart.x && logicX <= this.btnStart.x + this.btnStart.w &&
            logicY >= this.btnStart.y && logicY <= this.btnStart.y + this.btnStart.h) {

            this.startBattleCallback();
            return true;
        }

        return false;
    }

    render(ctx) {
        if (!this.visible) return;

        // 背景 (深蓝科技)
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);

        // 顶部信息栏
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, this.width, 100);
        
        // 标题
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = GameConfig.UI.Colors.Primary;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold italic 36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('SPACE SURVIVOR', 30, 60);
        ctx.restore();

        // 资源显示
        const goldTxt = `${dataManager.getGold()}`;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`⛃ ${goldTxt}`, this.width - 30, 60);

        // 中央战机展示区 (示意)
        const previewY = 220;
        ctx.save();
        ctx.translate(this.width/2, previewY);
        // 绘制一个简单的底座光环
        ctx.scale(1, 0.3);
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
        grad.addColorStop(0, 'rgba(0, 210, 211, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        
        // 文字提示
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CURRENT UNIT: J-20 MIGHTY DRAGON', this.width/2, previewY + 120);

        // 装备面板区域
        const panelY = 400;
        const panelH = 360;
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('MODULE CONFIGURATION', 30, panelY - 20);
        
        // 装备槽位展示
        const slotsY = panelY + 20;
        const slotSize = 85; // 稍微调小适配屏幕
        const gap = 15;
        const totalW = (slotSize * 4) + (gap * 3);
        let startX = (this.width - totalW) / 2;

        const equipment = dataManager.data.equipment;
        const slots = [
            { id: 'MainGun', label: 'WPN', desc: '主武器' }, 
            { id: 'Armor', label: 'DEF', desc: '装甲' }, 
            { id: 'Radar', label: 'FCS', desc: '雷达' }, 
            { id: 'Engine', label: 'ENG', desc: '引擎' }
        ];

        slots.forEach((slot, i) => {
            const bx = startX + i * (slotSize + gap);
            const by = slotsY;

            // 使用 RenderUtils 绘制槽位
            RenderUtils.drawCyberPanel(ctx, bx, by, slotSize, slotSize, { 
                corner: 10, 
                color: '#636e72',
                bgAlpha: 0.3
            });

            // 槽位代号
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(slot.label, bx + slotSize - 8, by + 20);
            
            // 中文名称
            ctx.fillStyle = '#dfe6e9';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(slot.desc, bx + slotSize/2, by + slotSize + 20);

            // 装备状态 (空或等级)
            if (slot.id === 'MainGun' && equipment.mainWeapon) {
                const wp = equipment.mainWeapon;
                // 绘制等级
                ctx.fillStyle = GameConfig.Rarity[wp.rarity] || '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`Lv.${wp.level}`, bx + slotSize / 2, by + slotSize/2 + 8);
            } else {
                // 空槽位符号
                ctx.fillStyle = '#444';
                ctx.font = '20px Arial';
                ctx.fillText('+', bx + slotSize/2, by + slotSize/2 + 6);
            }
        });
        
        // 底部提示说明框
        const infoY = slotsY + slotSize + 50;
        RenderUtils.drawCyberPanel(ctx, 30, infoY, this.width - 60, 100, { color: '#0984e3', bgAlpha: 0.2 });
        
        ctx.fillStyle = '#74b9ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('DATALINK STATUS: ACTIVE', 50, infoY + 25);
        
        ctx.fillStyle = '#b2bec3';
        ctx.font = '12px Arial';
        ctx.fillText('母舰增强已激活。当前配置将实时同步至母舰系统。', 50, infoY + 50);
        ctx.fillText('• 装甲提供护盾支持  • 雷达提供火控引导  • 火力提供支援加成', 50, infoY + 70);

        // 开始按钮
        // 动态呼吸效果
        const pulse = Math.sin(Date.now() / 300) * 5;
        const btnHover = { color: GameConfig.UI.Colors.Danger, hover: true }; // Always active style
        
        RenderUtils.drawButton(ctx, this.btnStart.x - pulse/2, this.btnStart.y - pulse/2, this.btnStart.w + pulse, this.btnStart.h + pulse, 'LAUNCH MISSION', btnHover);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('READY TO ENGAGE', this.width/2, this.btnStart.y + this.btnStart.h + 20);
    }
}
