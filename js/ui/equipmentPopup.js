/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 装备详情弹窗。显示装备信息，提供升级/更换按钮。
 */

import BasePopup from './basePopup.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';

export default class EquipmentPopup extends BasePopup {
    constructor() {
        super();
        this.width = 600;
        this.height = 700;

        // 当前展示的装备槽位/数据
        this.currentSlot = null; // '主炮', '装甲'...
        this.currentEquip = null;

        // 按钮
        this.btnUpgrade = { x: 0, y: 0, w: 200, h: 60 };
        this.btnClose = { x: 0, y: 0, w: 60, h: 60 };
    }

    showSlot(slotName) {
        this.currentSlot = slotName;
        // 获取当前槽位的装备数据
        // 对应关系映射 (Chinese -> Data Key)
        const map = {
            '主炮': 'mainWeapon',
            '装甲': 'armor',
            '僚机': 'wingman',
            '雷达': 'radar',
            // Fallback for English keys if passed
            'MainGun': 'mainWeapon',
            'Armor': 'armor',
            'Wingman': 'wingman',
            'Radar': 'radar'
        };
        const key = map[slotName];
        this.currentEquip = dataManager.data.equipment[key];

        // 重新计算居中
        this.x = (this.screenWidth - this.width) / 2;
        this.y = (this.screenHeight - this.height) / 2;

        // 计算按钮位置
        this.btnUpgrade.x = this.width / 2 - 100;
        this.btnUpgrade.y = this.height - 100;

        this.btnClose.x = this.width - 80;
        this.btnClose.y = 20;

        super.show(this.screenHeight);
    }

    renderContent(ctx) {
        // 1. 标题 (槽位名)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentSlot, this.width / 2, 60);

        // 2. 装备图标/占位
        ctx.fillStyle = '#333';
        ctx.fillRect(this.width / 2 - 50, 100, 100, 100);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.width / 2 - 50, 100, 100, 100);

        if (this.currentEquip) {
            // 装备名称 & 等级
            const rarityColor = GameConfig.Rarity[this.currentEquip.rarity];
            ctx.fillStyle = rarityColor;
            ctx.font = 'bold 30px Arial';
            // Localized Level
            ctx.fillText(`Lv.${this.currentEquip.level}`, this.width / 2, 250);

            // 属性描述
            ctx.fillStyle = '#aaa';
            ctx.font = '24px Arial';
            ctx.textAlign = 'left';
            const startX = 50;
            let startY = 320;

            // 简单读取配置 (实际应读取 Config)
            const stats = GameConfig.Weapons['MainGun'][this.currentEquip.level - 1] || {};
            // Localized Stats
            ctx.fillText(`攻击力: ${stats.damage || 0}`, startX, startY);
            ctx.fillText(`射速: ${stats.interval || 0}ms`, startX, startY + 40);

            // 升级按钮
            ctx.fillStyle = '#ffa502'; // Orange
            ctx.fillRect(this.btnUpgrade.x, this.btnUpgrade.y, this.btnUpgrade.w, this.btnUpgrade.h);
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            // Localized Button
            ctx.fillText('升级', this.btnUpgrade.x + 100, this.btnUpgrade.y + 38);

        } else {
            ctx.fillStyle = '#999';
            ctx.font = '24px Arial';
            // Localized Empty State
            ctx.fillText('暂无装备', this.width / 2, 250);
            ctx.font = '20px Arial';
            ctx.fillText('去战斗获取战利品!', this.width / 2, 300);
        }

        // 关闭按钮 X
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(this.btnClose.x, this.btnClose.y, this.btnClose.w, this.btnClose.h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('X', this.btnClose.x + 30, this.btnClose.y + 40);
    }

    onClickContent(localX, localY) {
        // Upgrade
        if (this.currentEquip && this.hitTest(localX, localY, this.btnUpgrade)) {
            console.log('Upgrade clicked');
            // TODO: 调用 DataManager 升级逻辑
            // if (gold >= cost) { level++; save(); }
        }

        // Close
        if (this.hitTest(localX, localY, this.btnClose)) {
            this.hide();
        }
    }

    hitTest(x, y, btn) {
        return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    }
}
