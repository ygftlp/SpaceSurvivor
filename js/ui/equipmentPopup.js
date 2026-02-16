import BasePopup from './basePopup.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';

const SLOT_KEY_MAP = {
    主炮: 'mainWeapon',
    装甲: 'armor',
    僚机: 'wingman',
    雷达: 'radar',
    MainGun: 'mainWeapon',
    Armor: 'armor',
    Wingman: 'wingman',
    Radar: 'radar'
};

const SLOT_LABEL_MAP = {
    mainWeapon: '主炮',
    armor: '装甲',
    wingman: '僚机',
    radar: '雷达',
    MainGun: '主炮',
    Armor: '装甲',
    Wingman: '僚机',
    Radar: '雷达',
    主炮: '主炮',
    装甲: '装甲',
    僚机: '僚机',
    雷达: '雷达'
};

export default class EquipmentPopup extends BasePopup {
    constructor() {
        super();
        this.width = 600;
        this.height = 700;

        this.currentSlot = null;
        this.currentSlotLabel = '';
        this.currentEquip = null;

        this.btnUpgrade = { x: 0, y: 0, w: 200, h: 60 };
        this.btnClose = { x: 0, y: 0, w: 60, h: 60 };
    }

    showSlot(slotName) {
        this.currentSlot = slotName;
        const key = SLOT_KEY_MAP[slotName] || slotName;
        this.currentSlotLabel = SLOT_LABEL_MAP[slotName] || SLOT_LABEL_MAP[key] || String(slotName);
        this.currentEquip = dataManager.data.equipment ? dataManager.data.equipment[key] : null;

        this.x = (this.screenWidth - this.width) / 2;
        this.y = (this.screenHeight - this.height) / 2;

        this.btnUpgrade.x = this.width / 2 - 100;
        this.btnUpgrade.y = this.height - 100;
        this.btnClose.x = this.width - 80;
        this.btnClose.y = 20;

        super.show(this.screenHeight);
    }

    renderContent(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentSlotLabel, this.width / 2, 60);

        ctx.fillStyle = '#333';
        ctx.fillRect(this.width / 2 - 50, 100, 100, 100);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.width / 2 - 50, 100, 100, 100);

        if (this.currentEquip) {
            const rarityColor = GameConfig.Rarity[this.currentEquip.rarity] || '#fff';
            ctx.fillStyle = rarityColor;
            ctx.font = 'bold 30px Arial';
            ctx.fillText(`Lv.${this.currentEquip.level}`, this.width / 2, 250);

            ctx.fillStyle = '#aaa';
            ctx.font = '24px Arial';
            ctx.textAlign = 'left';
            const startX = 50;
            const startY = 320;

            const weaponRows = (GameConfig.Weapons && GameConfig.Weapons.MainGun) || [];
            const stats = weaponRows[this.currentEquip.level - 1] || {};
            ctx.fillText(`攻击力：${stats.damage || 0}`, startX, startY);
            ctx.fillText(`射速：${stats.interval || 0}ms`, startX, startY + 40);

            ctx.fillStyle = '#ffa502';
            ctx.fillRect(this.btnUpgrade.x, this.btnUpgrade.y, this.btnUpgrade.w, this.btnUpgrade.h);
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('升级', this.btnUpgrade.x + 100, this.btnUpgrade.y + 38);
        } else {
            ctx.fillStyle = '#999';
            ctx.font = '24px Arial';
            ctx.fillText('暂未装配', this.width / 2, 250);
            ctx.font = '20px Arial';
            ctx.fillText('去战斗中获取装备和材料', this.width / 2, 300);
        }

        ctx.fillStyle = '#ff4757';
        ctx.fillRect(this.btnClose.x, this.btnClose.y, this.btnClose.w, this.btnClose.h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('X', this.btnClose.x + 30, this.btnClose.y + 40);
    }

    onClickContent(localX, localY) {
        if (this.currentEquip && this.hitTest(localX, localY, this.btnUpgrade)) {
            // 该弹窗先保留展示能力，升级逻辑在后续版本接入
            console.log('upgrade-equipment-todo');
            return;
        }

        if (this.hitTest(localX, localY, this.btnClose)) {
            this.hide();
        }
    }

    hitTest(x, y, btn) {
        return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    }
}
