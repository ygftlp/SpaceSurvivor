/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 机库界面，显示装备信息和开始按钮。
 */

import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';

export default class HangarUI {
    constructor(startBattleCallback) {
        this.visible = true;
        this.startBattleCallback = startBattleCallback;

        // 布局常量
        this.width = GameConfig.Screen.width;
        this.height = GameConfig.Screen.height;

        // 按钮区域 (逻辑坐标)
        this.btnStart = {
            x: this.width / 2 - 100,
            y: this.height - 200,
            w: 200,
            h: 80
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

        // 背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);

        // 标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE SURVIVOR', this.width / 2, 150);

        // 资源栏 (顶部)
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillText(`Gold: ${dataManager.getGold()}`, 40, 60);

        // 装备槽位展示 (简单示意)
        const slotsY = 300;
        const slotSize = 100;
        const gap = 20;
        const totalW = (slotSize * 4) + (gap * 3);
        let startX = (this.width - totalW) / 2;

        const equipment = dataManager.data.equipment;
        const slots = ['MainGun', 'Armor', 'Wingman', 'Radar'];

        slots.forEach((name, i) => {
            const bx = startX + i * (slotSize + gap);
            const by = slotsY;

            // 槽位背景
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, slotSize, slotSize);

            // 槽位边框
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, slotSize, slotSize);

            // 槽位名称
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(name, bx + slotSize / 2, by - 10);

            // 如果有装备 (目前只处理 MainGun)
            if (name === 'MainGun' && equipment.mainWeapon) {
                const wp = equipment.mainWeapon;
                ctx.fillStyle = GameConfig.Rarity[wp.rarity] || '#fff';
                ctx.font = 'bold 30px Arial';
                ctx.fillText(`Lv.${wp.level}`, bx + slotSize / 2, by + slotSize / 2 + 10);
            }
        });

        // 开始按钮
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.btnStart.x, this.btnStart.y, this.btnStart.w, this.btnStart.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('START', this.btnStart.x + this.btnStart.w / 2, this.btnStart.y + 50);
    }
}
