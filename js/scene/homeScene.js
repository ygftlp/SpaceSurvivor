import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import Player from '../object/faction/player/Player.js';
import EquipmentPopup from '../ui/equipmentPopup.js';
import RenderUtils from '../utils/renderUtils.js';

const SLOT_CONFIG = [
    { key: 'MainGun', label: '主炮' },
    { key: 'Armor', label: '装甲' },
    { key: 'Wingman', label: '僚机' },
    { key: 'Radar', label: '雷达' }
];

export default class HomeScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        this.width = GameConfig.Screen.width;
        this.height = this.sceneManager.game.logicHeight || 1280;

        const safeTop = GameConfig.SafeArea.top || 20;
        const safeLeft = Number.isFinite(GameConfig.SafeArea.left) ? GameConfig.SafeArea.left : 20;
        const capsuleH = GameConfig.SafeArea.height || 38;

        this.btnProfile = { x: safeLeft, y: safeTop, w: capsuleH, h: capsuleH };
        this.btnStart = { x: 0, y: 0, w: 240, h: 84 };
        this.fighterTapZone = { x: 0, y: 0, w: 0, h: 0 };
        this.slotHitBoxes = [];

        this.equipPopup = new EquipmentPopup();
        this.activePopup = null;
        this.demoPlayer = new Player(this.width / 2, this.height / 2);
    }

    enter() {
        this.height = this.sceneManager.game.logicHeight;

        this.btnProfile.y = GameConfig.SafeArea.top || 20;
        this.btnProfile.w = GameConfig.SafeArea.height || 38;
        this.btnProfile.h = GameConfig.SafeArea.height || 38;

        this.btnStart.x = this.width / 2 - this.btnStart.w / 2;
        this.btnStart.y = this.height - 170;

        this.demoPlayer.x = this.width / 2;
        this.demoPlayer.y = this.height * 0.56;
    }

    render(ctx) {
        this.renderBackground(ctx);
        this.renderTopBar(ctx);
        this.renderHeader(ctx);
        this.renderFighterShowcase(ctx);
        this.renderCommercialStrip(ctx);
        this.renderEquipmentDeck(ctx);
        this.renderStartButton(ctx);

        if (this.activePopup) {
            this.activePopup.render(ctx);
        }
    }

    renderBackground(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0a1024');
        grad.addColorStop(1, '#121935');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.strokeStyle = 'rgba(0,168,255,0.12)';
        ctx.lineWidth = 1;
        const step = 56;
        for (let x = 0; x <= this.width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    renderTopBar(ctx) {
        const r = this.btnProfile.w / 2;
        const cx = this.btnProfile.x + r;
        const cy = this.btnProfile.y + r;

        RenderUtils.fillRoundRect(
            ctx,
            this.btnProfile.x,
            this.btnProfile.y,
            this.btnProfile.w,
            this.btnProfile.h,
            r,
            'rgba(255,255,255,0.12)',
            'rgba(255,255,255,0.6)',
            2
        );

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.2, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.9, r * 0.62, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const chipW = 208;
        const chipH = 40;
        const chipX = this.width - chipW - 16;
        const chipY = this.btnProfile.y;
        RenderUtils.fillRoundRect(
            ctx,
            chipX,
            chipY,
            chipW,
            chipH,
            20,
            'rgba(0,0,0,0.42)',
            'rgba(255,255,255,0.2)',
            1
        );

        ctx.fillStyle = '#8ab4f8';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('金币', chipX + 18, chipY + chipH / 2);

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(String(dataManager.getGold()), chipX + 112, chipY + chipH / 2);

        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('钻石', chipX + 132, chipY + chipH / 2);
        ctx.fillStyle = '#74b9ff';
        ctx.textAlign = 'right';
        ctx.fillText(String(dataManager.data.diamonds || 0), chipX + chipW - 14, chipY + chipH / 2);
        ctx.textBaseline = 'alphabetic';
    }

    renderHeader(ctx) {
        RenderUtils.drawGlowingText(ctx, '太空幸存者', this.width / 2, 186, 56, '#e7f5ff', '#00b8ff');

        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.font = '18px Arial';
        ctx.fillText('110 秒突围任务，构建你的战机流派', this.width / 2, 238);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '14px Arial';
        ctx.fillText('守护母舰完成跃迁，击破首领获得额外蓝图', this.width / 2, 264);
        ctx.strokeStyle = 'rgba(0,184,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 180, 280);
        ctx.lineTo(this.width / 2 + 180, 280);
        ctx.stroke();
        ctx.restore();
    }

    renderFighterShowcase(ctx) {
        const panelW = Math.min(440, this.width - 64);
        const panelH = 360;
        const panelX = (this.width - panelW) / 2;
        const panelY = 320;

        RenderUtils.drawCyberPanel(ctx, panelX, panelY, panelW, panelH, {
            color: '#00c9ff',
            bgAlpha: 0.45,
            corner: 16
        });

        const fighterName = dataManager.data.currentFighter || 'J-20';
        ctx.fillStyle = '#cfefff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`当前战机：${fighterName}`, this.width / 2, panelY + 44);

        ctx.save();
        ctx.translate(this.width / 2, panelY + 190);
        const ringGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, 130);
        ringGrad.addColorStop(0, 'rgba(0,201,255,0.35)');
        ringGrad.addColorStop(1, 'rgba(0,201,255,0)');
        ctx.scale(1, 0.32);
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        this.demoPlayer.x = this.width / 2;
        this.demoPlayer.y = panelY + 190;
        this.demoPlayer.render(ctx);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('点击战机进入机库强化', this.width / 2, panelY + panelH - 26);

        this.fighterTapZone = {
            x: panelX + 40,
            y: panelY + 74,
            w: panelW - 80,
            h: panelH - 96
        };
    }

    renderCommercialStrip(ctx) {
        const y = 714;
        const h = 84;
        const gap = 16;
        const w = (this.width - 64 - gap) / 2;
        const x1 = 24;
        const x2 = x1 + w + gap;

        RenderUtils.fillRoundRect(ctx, x1, y, w, h, 12, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)', 1);
        ctx.fillStyle = '#feca57';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('首胜奖励', x1 + 12, y + 26);
        ctx.fillStyle = '#dfe6e9';
        ctx.font = '13px Arial';
        ctx.fillText('今日首次胜利：额外 +80 金币', x1 + 12, y + 50);
        ctx.fillStyle = '#74b9ff';
        ctx.fillText('目标：完成一次通关', x1 + 12, y + 70);

        RenderUtils.fillRoundRect(ctx, x2, y, w, h, 12, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)', 1);
        ctx.fillStyle = '#55efc4';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('补给加成', x2 + 12, y + 26);
        ctx.fillStyle = '#dfe6e9';
        ctx.font = '13px Arial';
        ctx.fillText('广告位预留：本局金币 +30%', x2 + 12, y + 50);
        ctx.fillStyle = '#95a5a6';
        ctx.fillText('当前版本：敬请期待', x2 + 12, y + 70);
    }

    renderEquipmentDeck(ctx) {
        const baseY = 820;
        const slotSize = 88;
        const gap = 18;
        const totalW = slotSize * SLOT_CONFIG.length + gap * (SLOT_CONFIG.length - 1);
        const startX = (this.width - totalW) / 2;

        this.slotHitBoxes = [];
        SLOT_CONFIG.forEach((slot, i) => {
            const x = startX + i * (slotSize + gap);
            const y = baseY;
            this.slotHitBoxes.push({ key: slot.key, x, y, w: slotSize, h: slotSize });

            RenderUtils.fillRoundRect(
                ctx,
                x,
                y,
                slotSize,
                slotSize,
                12,
                'rgba(255,255,255,0.09)',
                'rgba(0,184,255,0.66)',
                2
            );

            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(slot.label, x + slotSize / 2, y - 8);

            const mainWeapon = dataManager.data.equipment && dataManager.data.equipment.mainWeapon;
            if (slot.key === 'MainGun' && mainWeapon) {
                const rarityColor = GameConfig.Rarity[mainWeapon.rarity] || '#ffffff';
                ctx.fillStyle = rarityColor;
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`级 ${mainWeapon.level}`, x + slotSize / 2, y + slotSize / 2 + 10);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '26px Arial';
                ctx.fillText('+', x + slotSize / 2, y + slotSize / 2 + 10);
            }
        });
    }

    renderStartButton(ctx) {
        const pulse = Math.sin(Date.now() / 260) * 4;
        const x = this.btnStart.x - pulse / 2;
        const y = this.btnStart.y - pulse / 2;
        const w = this.btnStart.w + pulse;
        const h = this.btnStart.h + pulse;

        RenderUtils.fillRoundRect(ctx, x, y, w, h, 44, '#ff4d5d', '#ffffff', 3);
        RenderUtils.drawGlowingText(ctx, '开始任务', this.width / 2, y + 56, 36, '#ffffff', '#ff7f8e');
    }

    handleInput(type, x, y) {
        if (type !== 'touchstart') return false;

        if (this.activePopup) {
            const handled = this.activePopup.handleInput(x, y);
            if (!this.activePopup.visible) this.activePopup = null;
            return handled;
        }

        if (this.hitRect(x, y, this.btnProfile)) {
            this.sceneManager.switchScene('PROFILE');
            return true;
        }

        if (this.hitRect(x, y, this.btnStart)) {
            this.sceneManager.switchScene('BATTLE');
            return true;
        }

        if (this.hitRect(x, y, this.fighterTapZone)) {
            this.sceneManager.switchScene('HANGAR');
            return true;
        }

        for (let i = 0; i < this.slotHitBoxes.length; i++) {
            const slot = this.slotHitBoxes[i];
            if (this.hitRect(x, y, slot)) {
                this.equipPopup.showSlot(slot.key);
                this.activePopup = this.equipPopup;
                return true;
            }
        }
        return false;
    }

    hitRect(x, y, rect) {
        if (!rect) return false;
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }
}
