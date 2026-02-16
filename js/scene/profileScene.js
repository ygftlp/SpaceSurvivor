import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import RenderUtils from '../utils/renderUtils.js';
import { dataManager } from '../manager/dataManager.js';
import FighterFactory from '../object/faction/player/fighter/FighterFactory.js';

const TABS = [
    { key: 'account', label: '账户' },
    { key: 'settings', label: '设置' },
    { key: 'fighter', label: '战机' },
    { key: 'equipment', label: '装备' }
];

const FIGHTER_ORDER = ['J-20', 'F-22', 'Su-57', 'F-16'];

export default class ProfileScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        this.width = GameConfig.Screen.width;
        this.height = this.sceneManager.game.logicHeight || 1280;

        const safeTop = GameConfig.SafeArea.top || 20;
        const safeLeft = Number.isFinite(GameConfig.SafeArea.left) ? GameConfig.SafeArea.left : 20;
        const capsuleH = GameConfig.SafeArea.height || 38;

        this.sidebarWidth = 128;
        this.currentTab = 'account';
        this.tabButtons = [];
        this.fighterButtons = [];
        this.toast = null;

        this.btnBack = { x: safeLeft, y: safeTop, w: 84, h: capsuleH };
    }

    enter(params) {
        this.height = this.sceneManager.game.logicHeight;
        this.btnBack.y = GameConfig.SafeArea.top || 20;
        this.btnBack.h = GameConfig.SafeArea.height || 38;

        const tabMap = {
            Account: 'account',
            Settings: 'settings',
            Fighter: 'fighter',
            Equipment: 'equipment',
            账户: 'account',
            设置: 'settings',
            战机: 'fighter',
            装备: 'equipment'
        };
        const tabKey = params && params.tab ? tabMap[params.tab] : null;
        this.currentTab = tabKey || 'account';

        this.initTabs();
    }

    initTabs() {
        this.tabButtons = [];
        const startY = 150;
        const h = 56;
        const gap = 14;
        TABS.forEach((tab, i) => {
            this.tabButtons.push({
                key: tab.key,
                label: tab.label,
                x: 10,
                y: startY + i * (h + gap),
                w: this.sidebarWidth - 14,
                h
            });
        });
    }

    update(dt) {
        if (!this.toast) return;
        this.toast.life -= dt;
        if (this.toast.life <= 0) this.toast = null;
    }

    showToast(text, color = '#74b9ff', life = 1.6) {
        this.toast = { text, color, life };
    }

    render(ctx) {
        this.fighterButtons = [];
        this.renderBackground(ctx);
        this.renderSidebar(ctx);
        this.renderContent(ctx);
        this.renderToast(ctx);
    }

    renderBackground(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0a1024');
        grad.addColorStop(1, '#131a35');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = 'rgba(0,168,255,0.08)';
        ctx.lineWidth = 1;
        for (let y = 0; y < this.height; y += 56) {
            ctx.beginPath();
            ctx.moveTo(this.sidebarWidth, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    renderSidebar(ctx) {
        ctx.fillStyle = 'rgba(10, 15, 34, 0.9)';
        ctx.fillRect(0, 0, this.sidebarWidth, this.height);

        RenderUtils.fillRoundRect(
            ctx,
            this.btnBack.x,
            this.btnBack.y,
            this.btnBack.w,
            this.btnBack.h,
            this.btnBack.h / 2,
            'rgba(255,255,255,0.12)',
            'rgba(255,255,255,0.25)',
            1
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('返回', this.btnBack.x + this.btnBack.w / 2, this.btnBack.y + this.btnBack.h / 2);
        ctx.textBaseline = 'alphabetic';

        this.tabButtons.forEach((tab) => {
            const active = tab.key === this.currentTab;
            RenderUtils.fillRoundRect(
                ctx,
                tab.x,
                tab.y,
                tab.w,
                tab.h,
                10,
                active ? '#1696e8' : 'rgba(255,255,255,0.14)'
            );
            ctx.fillStyle = '#ffffff';
            ctx.font = active ? 'bold 26px Arial' : '22px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(tab.label, tab.x + 18, tab.y + 36);
        });
    }

    renderContent(ctx) {
        const x = this.sidebarWidth + 14;
        const y = 96;
        const w = this.width - this.sidebarWidth - 28;
        const h = this.height - 112;

        RenderUtils.drawCyberPanel(ctx, x, y, w, h, { color: '#00ccff', bgAlpha: 0.22, corner: 14 });

        if (this.currentTab === 'account') {
            this.renderAccount(ctx, x, y, w, h);
        } else if (this.currentTab === 'equipment') {
            this.renderEquipment(ctx, x, y, w, h);
        } else if (this.currentTab === 'fighter') {
            this.renderFighters(ctx, x, y, w, h);
        } else {
            this.renderSettings(ctx, x, y, w, h);
        }
    }

    renderFighters(ctx, x, y, w, h) {
        const titleY = y + 46;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('战机机库', x + 24, titleY);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '16px Arial';
        ctx.fillText('选择当前出战机型，不同战机拥有不同技能定位', x + 24, titleY + 28);

        const currentId = dataManager.data.currentFighter;
        const unlocked = dataManager.data.unlockedFighters || [];
        const fighters = FIGHTER_ORDER.filter((id) => FighterFactory.getAllFighters().includes(id));

        const listX = x + 20;
        let cardY = y + 98;
        const cardW = w - 40;
        const cardH = 118;
        const gap = 14;

        fighters.forEach((id) => {
            const info = FighterFactory.getFighterInfo(id);
            const isUnlocked = unlocked.includes(id);
            const isCurrent = currentId === id;

            RenderUtils.fillRoundRect(
                ctx,
                listX,
                cardY,
                cardW,
                cardH,
                12,
                isCurrent ? 'rgba(26,106,230,0.52)' : 'rgba(255,255,255,0.11)',
                isCurrent ? 'rgba(98,196,255,0.92)' : 'rgba(255,255,255,0.2)',
                isCurrent ? 2 : 1
            );

            const iconBox = { x: listX + 12, y: cardY + 14, w: 84, h: 84 };
            RenderUtils.fillRoundRect(ctx, iconBox.x, iconBox.y, iconBox.w, iconBox.h, 10, 'rgba(0,0,0,0.25)');
            ctx.save();
            ctx.beginPath();
            ctx.rect(iconBox.x, iconBox.y, iconBox.w, iconBox.h);
            ctx.clip();
            const fighter = FighterFactory.createFighter(id);
            ctx.translate(iconBox.x + iconBox.w / 2, iconBox.y + iconBox.h / 2 + 6);
            fighter.render(ctx, 34);
            ctx.restore();

            const textX = iconBox.x + iconBox.w + 14;
            const textW = cardW - (textX - listX) - 124;
            const name = info.name || id;
            const desc = info.desc || '暂无描述';
            const statText = `速度 ${info.speed || 0}  生命 ${info.hp || 0}`;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(name, textX, cardY + 36);

            ctx.fillStyle = '#d0d7e5';
            ctx.font = '18px Arial';
            const descLine = this.fitText(ctx, desc, textW);
            ctx.fillText(descLine, textX, cardY + 64);

            ctx.fillStyle = '#38efc4';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(statText, textX, cardY + 92);

            const btn = { x: listX + cardW - 106, y: cardY + 34, w: 90, h: 50 };
            if (isCurrent) {
                RenderUtils.fillRoundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8, '#43d26a');
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('已装备', btn.x + btn.w / 2, btn.y + 32);
            } else if (isUnlocked) {
                RenderUtils.fillRoundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8, '#1293e8');
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('装备', btn.x + btn.w / 2, btn.y + 32);
                this.fighterButtons.push({ x: btn.x, y: btn.y, w: btn.w, h: btn.h, id, action: 'equip' });
            } else {
                RenderUtils.fillRoundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8, '#ef7c5d');
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('解锁', btn.x + btn.w / 2, btn.y + 20);
                ctx.font = 'bold 14px Arial';
                ctx.fillText(`${info.unlockCost || 0} 金币`, btn.x + btn.w / 2, btn.y + 40);
                this.fighterButtons.push({ x: btn.x, y: btn.y, w: btn.w, h: btn.h, id, action: 'unlock' });
            }

            cardY += cardH + gap;
        });
    }

    renderAccount(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px Arial';
        ctx.fillText('指挥官档案', x + 30, y + 52);

        RenderUtils.fillRoundRect(ctx, x + 32, y + 88, 120, 120, 60, 'rgba(255,255,255,0.18)');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('指挥官', x + 182, y + 136);
        ctx.fillStyle = '#c8d6e5';
        ctx.font = '24px Arial';
        ctx.fillText(`等级：${dataManager.data.playerLevel}`, x + 182, y + 176);

        const rows = [
            `金币：${dataManager.getGold()}`,
            `钻石：${dataManager.data.diamonds || 0}`,
            `当前战机：${dataManager.data.currentFighter || 'J-20'}`
        ];
        rows.forEach((line, i) => {
            ctx.fillStyle = '#e5ecf6';
            ctx.font = '24px Arial';
            ctx.fillText(line, x + 34, y + 280 + i * 56);
        });
    }

    renderEquipment(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px Arial';
        ctx.fillText('装备总览', x + 30, y + 52);

        const slots = [
            { label: '主炮', value: dataManager.data.equipment.mainWeapon ? `Lv.${dataManager.data.equipment.mainWeapon.level}` : '未装备' },
            { label: '装甲', value: '开发中' },
            { label: '僚机', value: '开发中' },
            { label: '雷达', value: '开发中' }
        ];
        slots.forEach((slot, i) => {
            const rowY = y + 106 + i * 82;
            RenderUtils.fillRoundRect(ctx, x + 24, rowY, this.width - this.sidebarWidth - 80, 64, 10, 'rgba(255,255,255,0.12)');
            ctx.fillStyle = '#d7e6ff';
            ctx.font = 'bold 26px Arial';
            ctx.fillText(slot.label, x + 46, rowY + 40);
            ctx.fillStyle = '#90f0da';
            ctx.font = '24px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(slot.value, this.width - 40, rowY + 40);
            ctx.textAlign = 'left';
        });
    }

    renderSettings(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px Arial';
        ctx.fillText('系统设置', x + 30, y + 52);
        ctx.fillStyle = '#c8d6e5';
        ctx.font = '24px Arial';
        ctx.fillText('设置面板将在下一阶段补全。', x + 30, y + 120);
    }

    renderToast(ctx) {
        if (!this.toast) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.toast.life));
        ctx.fillStyle = this.toast.color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.toast.text, this.width / 2, this.height - 34);
        ctx.restore();
    }

    fitText(ctx, text, maxWidth) {
        let out = String(text || '');
        while (out.length > 0 && ctx.measureText(out).width > maxWidth) {
            out = out.slice(0, -1);
        }
        return out;
    }

    handleInput(type, x, y) {
        if (type !== 'touchstart') return false;

        if (this.hitRect(x, y, this.btnBack)) {
            this.sceneManager.switchScene('HOME');
            return true;
        }

        for (let i = 0; i < this.tabButtons.length; i++) {
            const tab = this.tabButtons[i];
            if (this.hitRect(x, y, tab)) {
                this.currentTab = tab.key;
                return true;
            }
        }

        if (this.currentTab !== 'fighter') return false;

        for (let i = 0; i < this.fighterButtons.length; i++) {
            const btn = this.fighterButtons[i];
            if (!this.hitRect(x, y, btn)) continue;

            const fInfo = FighterFactory.getFighterInfo(btn.id);
            if (btn.action === 'equip') {
                dataManager.setFighter(btn.id);
                this.showToast(`已切换为 ${btn.id}`, '#2ecc71');
                return true;
            }

            if (btn.action === 'unlock') {
                const cost = fInfo.unlockCost || 0;
                if (dataManager.getGold() >= cost) {
                    dataManager.addGold(-cost);
                    dataManager.unlockFighter(btn.id);
                    dataManager.setFighter(btn.id);
                    this.showToast(`已解锁并装备 ${btn.id}`, '#feca57');
                } else {
                    this.showToast('金币不足', '#ff8f70');
                }
                return true;
            }
        }

        return false;
    }

    hitRect(x, y, rect) {
        return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }
}
