import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import RenderUtils from '../utils/renderUtils.js';

export default class HangarUI {
    constructor(startBattleCallback) {
        this.visible = true;
        this.startBattleCallback = startBattleCallback;
        this.width = GameConfig.Screen.width;
        this.height = GameConfig.Screen.height;
        this.btnStart = {
            x: this.width / 2 - 110,
            y: this.height - 180,
            w: 220,
            h: 70
        };
    }

    handleInput(logicX, logicY) {
        if (!this.visible) return false;
        if (
            logicX >= this.btnStart.x &&
            logicX <= this.btnStart.x + this.btnStart.w &&
            logicY >= this.btnStart.y &&
            logicY <= this.btnStart.y + this.btnStart.h
        ) {
            this.startBattleCallback();
            return true;
        }
        return false;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, this.width, 100);

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = GameConfig.UI.Colors.Primary;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold italic 36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('太空幸存者', 30, 60);
        ctx.restore();

        const goldTxt = `${dataManager.getGold()}`;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`金币 ${goldTxt}`, this.width - 30, 60);

        const previewY = 220;
        ctx.save();
        ctx.translate(this.width / 2, previewY);
        ctx.scale(1, 0.3);
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
        grad.addColorStop(0, 'rgba(0, 210, 211, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('当前机型：歼-20 威龙', this.width / 2, previewY + 120);

        const panelY = 400;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('模块配置', 30, panelY - 20);

        const slotsY = panelY + 20;
        const slotSize = 85;
        const gap = 15;
        const totalW = slotSize * 4 + gap * 3;
        const startX = (this.width - totalW) / 2;

        const equipment = dataManager.data.equipment || {};
        const slots = [
            { id: 'MainGun', label: '火力', desc: '主武器' },
            { id: 'Armor', label: '防御', desc: '装甲' },
            { id: 'Radar', label: '火控', desc: '雷达' },
            { id: 'Engine', label: '动力', desc: '引擎' }
        ];

        slots.forEach((slot, i) => {
            const bx = startX + i * (slotSize + gap);
            const by = slotsY;
            RenderUtils.drawCyberPanel(ctx, bx, by, slotSize, slotSize, {
                corner: 10,
                color: '#636e72',
                bgAlpha: 0.3
            });

            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(slot.label, bx + slotSize - 8, by + 20);

            ctx.fillStyle = '#dfe6e9';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(slot.desc, bx + slotSize / 2, by + slotSize + 20);

            if (slot.id === 'MainGun' && equipment.mainWeapon) {
                const wp = equipment.mainWeapon;
                ctx.fillStyle = GameConfig.Rarity[wp.rarity] || '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`Lv.${wp.level}`, bx + slotSize / 2, by + slotSize / 2 + 8);
            } else {
                ctx.fillStyle = '#444';
                ctx.font = '20px Arial';
                ctx.fillText('+', bx + slotSize / 2, by + slotSize / 2 + 6);
            }
        });

        const infoY = slotsY + slotSize + 50;
        RenderUtils.drawCyberPanel(ctx, 30, infoY, this.width - 60, 100, { color: '#0984e3', bgAlpha: 0.2 });
        ctx.fillStyle = '#74b9ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('数据链路：已联通', 50, infoY + 25);
        ctx.fillStyle = '#b2bec3';
        ctx.font = '12px Arial';
        ctx.fillText('母舰支援已激活，当前配置会实时同步到战场。', 50, infoY + 50);
        ctx.fillText('装甲强化护盾  ·  雷达强化锁定  ·  火力强化输出', 50, infoY + 70);

        const pulse = Math.sin(Date.now() / 300) * 5;
        const btnHover = { color: GameConfig.UI.Colors.Danger, hover: true };
        RenderUtils.drawButton(
            ctx,
            this.btnStart.x - pulse / 2,
            this.btnStart.y - pulse / 2,
            this.btnStart.w + pulse,
            this.btnStart.h + pulse,
            '开始任务',
            btnHover
        );

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('准备出击', this.width / 2, this.btnStart.y + this.btnStart.h + 20);
    }
}
