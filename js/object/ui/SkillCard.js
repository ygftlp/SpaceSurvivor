/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 技能选择卡片组件
 */
import Component from './Component.js';
import RenderUtils from '../../utils/renderUtils.js';

export default class SkillCard extends Component {
    constructor(x, y, w, h, skill, index) {
        super(x, y, w, h);
        this.skill = skill; // { id, name, desc, iconColor }
        this.index = index;
        this.isSelected = false;

        // Style
        this.bgColor = 'rgba(0, 0, 0, 0.8)';
        this.borderColor = '#444';
        this.textColor = '#fff';
    }

    handleInput(type, x, y) {
        if (!this.visible) return false;

        // Simple Click
        if (type === 'touchstart' && this.checkClicked(x, y)) {
            this.isSelected = true;
            return true;
        }
        return false;
    }

    render(ctx) {
        if (!this.visible) return;

        // Card Background
        RenderUtils.fillRoundRect(ctx, this.x, this.y, this.width, this.height, 10, this.bgColor);

        // Border (Highlight if needed)
        ctx.save();
        ctx.strokeStyle = this.isSelected ? '#ffff00' : this.borderColor;
        ctx.lineWidth = 2;
        RenderUtils.strokeRoundRect(ctx, this.x, this.y, this.width, this.height, 10);

        // Icon Placeholder (Left)
        const iconSize = 40;
        const iconX = this.x + 20;
        const iconY = this.y + (this.height - iconSize) / 2;

        ctx.fillStyle = this.skill.iconColor || '#00a8ff';
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Text (Title)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.skill.name, iconX + iconSize + 20, this.y + 20);

        // Text (Desc)
        ctx.fillStyle = '#ccc';
        ctx.font = '16px Arial';
        ctx.fillText(this.skill.desc, iconX + iconSize + 20, this.y + 55);

        ctx.restore();
    }
}
