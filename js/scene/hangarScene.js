import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import Button from '../object/ui/Button.js';
import { metaProgression } from '../manager/metaProgression.js';
import { dataManager } from '../manager/dataManager.js';
import FighterFactory from '../object/faction/player/fighter/FighterFactory.js';

const FIGHTER_LABELS = {
    'J-20': 'J-20 威龙',
    'F-22': 'F-22 猛禽',
    'Su-57': 'Su-57',
    'F-16': 'F-16 战隼'
};

const FIGHTER_ROLES = {
    'J-20': '隐身突防',
    'F-22': '均衡空优',
    'Su-57': '近战压制',
    'F-16': '高机动入门'
};

const FIGHTER_ORDER = ['J-20', 'F-22', 'Su-57', 'F-16'];

export default class HangarScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        this.tab = 'fighters';
        this.selectedFighter = dataManager.data.currentFighter || 'J-20';
        this.previewFighterId = null;
        this.previewFighter = null;
        this.cardHitboxes = [];
        this.actionHitboxes = {};
        this.toast = null;
        this.uiComponents = [];
        this.initUI();
    }

    initUI() {
        const w = GameConfig.Screen.width;

        this.btnBack = new Button(20, 20, 96, 40, '返回');
        this.btnBack.setStyle('#3a3f4a', '#ffffff', 16, 8).setCallback(() => {
            this.sceneManager.switchScene('HOME');
        });

        this.btnTabFighters = new Button(w / 2 - 140, 80, 110, 36, '战机');
        this.btnTabFighters.setCallback(() => this.switchTab('fighters'));

        this.btnTabEquipment = new Button(w / 2 - 15, 80, 110, 36, '装备');
        this.btnTabEquipment.setCallback(() => this.switchTab('equipment'));

        this.btnTabBlueprints = new Button(w / 2 + 110, 80, 110, 36, '蓝图');
        this.btnTabBlueprints.setCallback(() => this.switchTab('blueprints'));

        this.uiComponents = [
            this.btnBack,
            this.btnTabFighters,
            this.btnTabEquipment,
            this.btnTabBlueprints
        ];
        this.syncTabStyle();
    }

    enter() {
        this.selectedFighter = dataManager.data.currentFighter || this.selectedFighter || 'J-20';
        this.syncTabStyle();
    }

    update(dt) {
        if (this.previewFighter && this.tab === 'fighters') {
            this.previewFighter.update(dt);
        }
        if (this.toast) {
            this.toast.life -= dt;
            if (this.toast.life <= 0) this.toast = null;
        }
    }

    switchTab(tab) {
        this.tab = tab;
        this.syncTabStyle();
        this.actionHitboxes = {};
    }

    syncTabStyle() {
        const active = '#2c3e50';
        const inactive = '#3b4250';
        this.btnTabFighters.setStyle(this.tab === 'fighters' ? active : inactive, '#ffffff', 14, 8);
        this.btnTabEquipment.setStyle(this.tab === 'equipment' ? active : inactive, '#ffffff', 14, 8);
        this.btnTabBlueprints.setStyle(this.tab === 'blueprints' ? active : inactive, '#ffffff', 14, 8);
    }

    setToast(text, color = '#74b9ff', life = 1.8) {
        this.toast = { text, color, life };
    }

    ensurePreviewFighter(id) {
        if (!id) return null;
        if (this.previewFighterId !== id || !this.previewFighter) {
            this.previewFighterId = id;
            this.previewFighter = FighterFactory.createFighter(id);
        }
        return this.previewFighter;
    }

    render(ctx) {
        const w = GameConfig.Screen.width;
        const h = this.sceneManager.game.logicHeight;

        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0a1022');
        bg.addColorStop(1, '#080b16');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(0, 168, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let y = 120; y < h; y += 44) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('机库', w / 2, 50);

        this.uiComponents.forEach((c) => c.render(ctx));

        if (this.tab === 'fighters') {
            this.renderFighters(ctx, w, h);
        } else if (this.tab === 'equipment') {
            this.renderEquipment(ctx, w, h);
        } else {
            this.renderBlueprints(ctx, w, h);
        }

        if (this.toast) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, this.toast.life));
            ctx.fillStyle = this.toast.color;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.toast.text, w / 2, h - 34);
            ctx.restore();
        }
    }

    renderFighters(ctx, w, h) {
        const data = metaProgression.getDisplayData();
        const fighters = data.fighters || {};
        const stats = data.stats || {};

        const listX = 20;
        const listY = 136;
        const listW = 300;
        const cardH = 92;
        const cardGap = 10;

        this.cardHitboxes = [];
        this.actionHitboxes = {};

        FIGHTER_ORDER.forEach((id, idx) => {
            const fMeta = fighters[id] || { unlocked: false, level: 0, unlockCost: 0 };
            const y = listY + idx * (cardH + cardGap);
            const selected = id === this.selectedFighter;

            ctx.fillStyle = selected ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.06)';
            ctx.fillRect(listX, y, listW, cardH);
            ctx.strokeStyle = selected ? '#2ecc71' : 'rgba(255,255,255,0.18)';
            ctx.lineWidth = selected ? 2 : 1;
            ctx.strokeRect(listX, y, listW, cardH);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(FIGHTER_LABELS[id] || id, listX + 14, y + 28);

            ctx.fillStyle = '#9fb3c8';
            ctx.font = '12px Arial';
            ctx.fillText(FIGHTER_ROLES[id] || '未知定位', listX + 14, y + 48);

            if (fMeta.unlocked) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = 'bold 13px Arial';
                ctx.fillText(`已解锁 · 等级 ${fMeta.level}`, listX + 14, y + 68);
            } else {
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 13px Arial';
                ctx.fillText('未解锁', listX + 14, y + 68);
                ctx.fillStyle = '#c7d0d9';
                ctx.font = '12px Arial';
                ctx.fillText(this.getUnlockProgressText(id, fMeta, stats), listX + 80, y + 68);
            }

            this.cardHitboxes.push({ id, x: listX, y, w: listW, h: cardH });
        });

        const detailX = 340;
        const detailY = 136;
        const detailW = w - detailX - 20;
        const detailH = h - detailY - 24;

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(detailX, detailY, detailW, detailH);
        ctx.strokeStyle = 'rgba(0, 210, 211, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(detailX, detailY, detailW, detailH);

        const selectedMeta = fighters[this.selectedFighter];
        if (!selectedMeta) return;

        const currentFighter = dataManager.data.currentFighter;
        const isCurrent = currentFighter === this.selectedFighter;
        const label = FIGHTER_LABELS[this.selectedFighter] || this.selectedFighter;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label, detailX + 18, detailY + 34);

        if (isCurrent) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 13px Arial';
            ctx.fillText('当前出战', detailX + detailW - 110, detailY + 34);
        }

        if (!selectedMeta.unlocked) {
            ctx.fillStyle = '#d0d8e0';
            ctx.font = '16px Arial';
            ctx.fillText('该战机尚未解锁。', detailX + 18, detailY + 84);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '14px Arial';
            ctx.fillText(this.getUnlockProgressText(this.selectedFighter, selectedMeta, stats), detailX + 18, detailY + 112);
            return;
        }

        const preview = this.ensurePreviewFighter(this.selectedFighter);
        const previewCx = detailX + detailW / 2;
        const previewCy = detailY + 250;
        ctx.save();
        ctx.translate(previewCx, previewCy);
        if (preview && preview.render) preview.render(ctx, 150);
        ctx.restore();

        const fighterStats = FighterFactory.getFighterInfo(this.selectedFighter);
        const bonus = metaProgression.getFighterBonus(this.selectedFighter);
        const hp = (fighterStats.hp || 0) + (bonus.hp || 0);
        const speed = (fighterStats.speed || 0) + (bonus.speed || 0);
        const damage = Math.round((fighterStats.damage || 0) * (1 + (bonus.damage || 0) / 100));

        this.drawStatRow(ctx, detailX + 20, detailY + 360, detailW - 40, '生命', hp, 180, '#ff7675');
        this.drawStatRow(ctx, detailX + 20, detailY + 390, detailW - 40, '速度', speed, 24, '#74b9ff');
        this.drawStatRow(ctx, detailX + 20, detailY + 420, detailW - 40, '火力', damage, 40, '#f39c12');

        const common = data.blueprints.common || 0;
        const rare = data.blueprints.rare || 0;
        const nextCommon = selectedMeta.level * 50;
        const nextRare = selectedMeta.level * 10;

        ctx.fillStyle = '#c8d6e5';
        ctx.font = '13px Arial';
        ctx.fillText(`蓝图库存：普通 ${common}  稀有 ${rare}`, detailX + 20, detailY + 455);
        ctx.fillText(`升星消耗：普通 ${nextCommon}  稀有 ${nextRare}`, detailX + 20, detailY + 476);

        const equipBtn = { x: detailX + 20, y: detailY + detailH - 118, w: detailW - 40, h: 42 };
        const upBtn = { x: detailX + 20, y: detailY + detailH - 64, w: detailW - 40, h: 42 };

        this.drawActionButton(
            ctx,
            equipBtn,
            isCurrent ? '当前战机' : '设为出战',
            isCurrent ? '#607d8b' : '#27ae60',
            !isCurrent
        );

        const canUpgrade = this.canUpgradeFighter(selectedMeta, data.blueprints);
        this.drawActionButton(
            ctx,
            upBtn,
            canUpgrade ? '战机升星' : '战机升星（材料不足）',
            canUpgrade ? '#f39c12' : '#7f8c8d',
            true
        );

        this.actionHitboxes = {
            equip: { ...equipBtn, enabled: !isCurrent },
            upgrade: { ...upBtn, enabled: canUpgrade }
        };
    }

    drawStatRow(ctx, x, y, w, label, value, maxValue, color) {
        const rate = maxValue > 0 ? Math.max(0, Math.min(1, value / maxValue)) : 0;
        ctx.fillStyle = '#aab7c4';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${label}: ${value}`, x, y - 2);

        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x, y + 4, w, 8);
        ctx.fillStyle = color;
        ctx.fillRect(x, y + 4, w * rate, 8);
    }

    drawActionButton(ctx, rect, text, bg, active) {
        ctx.fillStyle = bg;
        ctx.globalAlpha = active ? 1 : 0.75;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, rect.x + rect.w / 2, rect.y + 27);
    }

    canUpgradeFighter(fMeta, blueprints) {
        if (!fMeta || !fMeta.unlocked) return false;
        const needCommon = fMeta.level * 50;
        const needRare = fMeta.level * 10;
        return (blueprints.common || 0) >= needCommon && (blueprints.rare || 0) >= needRare;
    }

    getUnlockProgressText(id, fMeta, stats) {
        if (id === 'F-22') {
            return `击杀 ${stats.totalKills || 0}/${fMeta.unlockCost || 0}`;
        }
        if (id === 'Su-57') {
            return `满血通关 ${stats.fullHealthWins || 0}/${fMeta.unlockCost || 0}`;
        }
        if (id === 'F-16') {
            return `对局 ${stats.totalGames || 0}/${fMeta.unlockCost || 0}`;
        }
        return '未解锁';
    }

    renderEquipment(ctx, w, h) {
        const data = metaProgression.getDisplayData();
        const bonus = data.totalBonus || {};

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('装备总览', 28, 160);

        const rows = [
            `伤害加成：+${bonus.damagePercent || 0}%`,
            `射速加成：+${bonus.speedPercent || 0}%`,
            `生命加成：+${bonus.hpBonus || 0}`,
            `护盾加成：+${bonus.shieldBonus || 0}`,
            `能量上限：+${bonus.energyMax || 0}`,
            `拾取半径：${bonus.magnetRange || 150}`
        ];

        rows.forEach((r, i) => {
            ctx.fillStyle = '#c8d6e5';
            ctx.font = '15px Arial';
            ctx.fillText(r, 32, 204 + i * 30);
        });

        ctx.fillStyle = '#95a5a6';
        ctx.font = '13px Arial';
        ctx.fillText('装备细分升级面板将在下一阶段开放。', 32, h - 36);
    }

    renderBlueprints(ctx, w, h) {
        const data = metaProgression.getDisplayData();
        const bp = data.blueprints || {};

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('蓝图库存', 28, 160);

        const rows = [
            { name: '普通', key: 'common', color: '#95a5a6' },
            { name: '稀有', key: 'rare', color: '#3498db' },
            { name: '传说', key: 'legendary', color: '#f39c12' }
        ];

        rows.forEach((row, i) => {
            const y = 220 + i * 76;
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(28, y - 34, w - 56, 56);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(28, y - 34, w - 56, 56);

            ctx.fillStyle = row.color;
            ctx.font = 'bold 18px Arial';
            ctx.fillText(row.name, 46, y);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(String(bp[row.key] || 0), w - 46, y);
            ctx.textAlign = 'left';
        });

        ctx.fillStyle = '#95a5a6';
        ctx.font = '13px Arial';
        ctx.fillText('通过生存通关和击败首领获取更多蓝图。', 28, h - 36);
    }

    handleInput(type, x, y) {
        if (type !== 'touchstart') return false;

        for (let i = this.uiComponents.length - 1; i >= 0; i--) {
            if (this.uiComponents[i].handleInput(type, x, y)) {
                return true;
            }
        }

        if (this.tab !== 'fighters') return false;

        for (let i = 0; i < this.cardHitboxes.length; i++) {
            const card = this.cardHitboxes[i];
            if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
                this.selectedFighter = card.id;
                this.previewFighter = null;
                this.previewFighterId = null;
                return true;
            }
        }

        const equip = this.actionHitboxes.equip;
        if (equip && x >= equip.x && x <= equip.x + equip.w && y >= equip.y && y <= equip.y + equip.h) {
            if (!equip.enabled) {
                this.setToast('已经是当前出战战机', '#95a5a6');
                return true;
            }
            dataManager.unlockFighter(this.selectedFighter);
            dataManager.setFighter(this.selectedFighter);
            this.setToast(`已切换为 ${this.selectedFighter}`, '#2ecc71');
            return true;
        }

        const upgrade = this.actionHitboxes.upgrade;
        if (upgrade && x >= upgrade.x && x <= upgrade.x + upgrade.w && y >= upgrade.y && y <= upgrade.y + upgrade.h) {
            const ok = metaProgression.upgradeFighter(this.selectedFighter);
            if (ok) {
                this.setToast(`升星成功：${this.selectedFighter}`, '#f39c12');
            } else {
                this.setToast('蓝图不足', '#e67e22');
            }
            return true;
        }

        return false;
    }
}
