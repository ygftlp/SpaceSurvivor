/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 主页场景 (HomeScene)，应用 RenderUtils 进行视觉打磨，并增加了个人中心入口。
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import Player from '../object/faction/player/Player.js';
import EquipmentPopup from '../ui/equipmentPopup.js';
import RenderUtils from '../utils/renderUtils.js';
import Button from '../object/ui/Button.js';

export default class HomeScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);

        this.width = GameConfig.Screen.width;
        this.height = this.sceneManager.game.logicHeight || 1280;

        // UI Components
        this.btnStart = { x: 0, y: 0, w: 220, h: 80 };
        this.uiComponents = [];

        // Profile Button (Aligned with Menu Capsule)
        const safeTop = GameConfig.SafeArea.top || 20;
        const safeLeft = (GameConfig.SafeArea.left !== undefined) ? GameConfig.SafeArea.left : 20;
        const capsuleH = GameConfig.SafeArea.height || 32;
        // Square or Circle button
        this.btnProfile = { x: safeLeft, y: safeTop, w: capsuleH, h: capsuleH };

        // Menu System (Removed - Moved to BattleScene)
        // this.menuExpanded = false;
        // this.btnMenu... 

        // 装备槽位 (仍保留展示，作为快捷入口)
        this.slotHitBoxes = [];
        this.equipPopup = new EquipmentPopup();
        this.activePopup = null;

        // Player Model
        this.demoPlayer = new Player(this.width / 2, this.height / 2);

        // 机库按钮
        const w = this.width;
        const h = this.height;
        this.btnHangar = new Button(w / 2, h / 2 + 80, 160, 50, '机库');
        this.btnHangar.setStyle('#2c3e50', '#fff', 20, 10).setCallback(() => {
            this.sceneManager.switchScene('HANGAR');
        });
        this.uiComponents.push(this.btnHangar);
    }

    enter() {
        this.height = this.sceneManager.game.logicHeight;

        // 动态布局
        const cx = this.width / 2;
        this.btnStart.x = cx - 110;
        this.btnStart.y = this.height - 220;

        // Update Profile Button Position Update (in case safe area loaded late)
        this.btnProfile.y = GameConfig.SafeArea.top;
        this.btnProfile.w = GameConfig.SafeArea.height;
        this.btnProfile.h = GameConfig.SafeArea.height;

        this.demoPlayer.y = this.height / 2 - 50;

        console.log('HomeScene: Enter');
    }

    render(ctx) {
        // 1. 绘制科幻背景 (深蓝渐变)
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0f1020');
        grad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. 绘制网格线 (Holographic Grid)
        this.renderGrid(ctx);

        // 3. 标题
        RenderUtils.drawGlowingText(ctx, '太空幸存者', this.width / 2, 180, 50, '#fff', '#00A8FF');

        this.renderValueProposition(ctx);

        // 4. 资源栏 (简化，整合到 Profile 旁或保留)
        // 这里仅在右上角显示金币，作为 Top Bar
        this.renderTopBar(ctx);

        // 5. 战机展示
        this.demoPlayer.render(ctx);
        // Hint Text
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('点击更换战机', this.width / 2, this.demoPlayer.y + 60);

        // 6. 装备槽位 (使用新样式)
        this.renderEquipmentSlots(ctx);

        // 7. 开始按钮 (使用新样式)
        this.renderStartButton(ctx);

        // 8. 弹窗
        if (this.activePopup) {
            this.activePopup.render(ctx);
        }
    }

    renderGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 168, 255, 0.1)';
        ctx.lineWidth = 1;
        const step = 80;
        // 垂直线
        for (let x = 0; x <= this.width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        // 水平线
        for (let y = 0; y <= this.height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    renderTopBar(ctx) {
        // Profile Button (Left Top)
        const r = this.btnProfile.w / 2;
        const cx = this.btnProfile.x + r;
        const cy = this.btnProfile.y + r;

        RenderUtils.fillRoundRect(ctx, this.btnProfile.x, this.btnProfile.y, this.btnProfile.w, this.btnProfile.h, r, '#555', '#fff', 2);

        // 简单画一个人头示意
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        // Head
        ctx.arc(cx, cy - r * 0.2, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Body (Chest)
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.9, r * 0.7, Math.PI, Math.PI * 2); // Bottom arc
        ctx.fill();

        // 资源 (Right Top)
        const goldVal = dataManager.getGold();
        const goldStr = `💰 ${goldVal}`;
        ctx.font = '24px Arial';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.textAlign = 'right';
        // Align Text with Capsule center Y
        ctx.textBaseline = 'middle';
        ctx.fillText(goldStr, this.width - 20, cy);
        ctx.textBaseline = 'alphabetic'; // Reset
    }

    renderValueProposition(ctx) {
        const x = this.width / 2;
        const y = 240;

        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '18px Arial';
        ctx.fillText('90秒一局 · 护航母舰跃迁 · 三选一构筑流派', x, y);

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '14px Arial';
        ctx.fillText('轻松上手但不无脑：拆机库→暴露核心→击破BOSS', x, y + 26);

        ctx.fillStyle = 'rgba(0, 168, 255, 0.18)';
        ctx.fillRect(this.width / 2 - 220, y + 44, 440, 1);

        ctx.restore();
    }

    renderEquipmentSlots(ctx) {
        const slotsY = 320;
        const slotSize = 80;
        const gap = 30;
        const totalW = (slotSize * 4) + (gap * 3);
        let startX = (this.width - totalW) / 2;

        const equipment = dataManager.data.equipment;
        // Localized Slots
        const slots = ['主炮', '装甲', '僚机', '雷达'];

        this.slotHitBoxes = [];

        slots.forEach((name, i) => {
            const bx = startX + i * (slotSize + gap);
            const by = slotsY;

            this.slotHitBoxes.push({ name: name, x: bx, y: by, w: slotSize, h: slotSize });

            // 槽位背景 (半透明科幻框)
            RenderUtils.fillRoundRect(ctx, bx, by, slotSize, slotSize, 10, 'rgba(255, 255, 255, 0.1)', '#00A8FF', 1);

            // 连接线 (指向中间飞机的视觉引导，可选)
            // ...

            // 槽位名称
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(name, bx + slotSize / 2, by - 8);

            // 装备等级
            // check for '主炮' instead of 'MainGun'
            if (name === '主炮' && equipment.mainWeapon) {
                const wp = equipment.mainWeapon;
                ctx.fillStyle = GameConfig.Rarity[wp.rarity] || '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`Lv.${wp.level}`, bx + slotSize / 2, by + slotSize / 2 + 8);
            } else {
                ctx.fillStyle = '#555';
                ctx.font = '24px Arial';
                ctx.fillText('+', bx + slotSize / 2, by + slotSize / 2 + 8);
            }
        });
    }

    renderStartButton(ctx) {
        // 动态发光按钮
        const glowColor = Math.floor(Date.now() / 20) % 255;
        const glowStyle = `rgb(255, ${glowColor}, 0)`; // 呼吸灯效果

        RenderUtils.fillRoundRect(
            ctx, this.btnStart.x, this.btnStart.y, this.btnStart.w, this.btnStart.h,
            40, '#ff4757', '#fff', 3
        );

        // 文字
        RenderUtils.drawGlowingText(ctx, '开始任务',
            this.btnStart.x + this.btnStart.w / 2,
            this.btnStart.y + 52,
            32, '#fff', '#ff6b81'
        );
    }

    handleInput(type, x, y) {
        if (type === 'touchstart') {
            if (this.activePopup) {
                const handled = this.activePopup.handleInput(x, y);
                if (!this.activePopup.visible) this.activePopup = null;
                return handled;
            }

            // 1. Profile Click
            if (x >= this.btnProfile.x && x <= this.btnProfile.x + this.btnProfile.w &&
                y >= this.btnProfile.y && y <= this.btnProfile.y + this.btnProfile.h) {
                this.sceneManager.switchScene('PROFILE');
                return true;
            }

            // 2. Start
            if (x >= this.btnStart.x && x <= this.btnStart.x + this.btnStart.w &&
                y >= this.btnStart.y && y <= this.btnStart.y + this.btnStart.h) {
                this.sceneManager.switchScene('BATTLE');
                return true;
            }

            // 2.5 Fighter Model Click -> Shortcut to Hangar
            // Fighter is roughly at width/2, height/2 - 50, size ~64-80
            const fx = this.width / 2;
            const fy = this.height / 2 - 50;
            if (Math.abs(x - fx) < 80 && Math.abs(y - fy) < 100) {
                this.sceneManager.switchScene('PROFILE', { tab: '战机' });
                return true;
            }

            // 3. Slots (Keep functionality)
            for (let slot of this.slotHitBoxes) {
                if (x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h) {
                    this.equipPopup.showSlot(slot.name);
                    this.activePopup = this.equipPopup;
                    return true;
                }
            }
        }
    }
}
