/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 通用按钮组件
 */
import Component from './Component.js';
import RenderUtils from '../../utils/renderUtils.js';

export default class Button extends Component {
    constructor(x, y, w, h, text = '') {
        super(x, y, w, h);
        this.text = text;
        this.onClick = null;

        // Styles
        this.bgColor = '#333';
        this.fgColor = '#fff';
        this.radius = 10;
        this.fontSize = 20;
    }

    setCallback(cb) {
        this.onClick = cb;
        return this; // Chainable
    }

    setStyle(bgColor, fgColor, fontSize = 20, radius = 10) {
        this.bgColor = bgColor;
        this.fgColor = fgColor;
        this.fontSize = fontSize;
        this.radius = radius;
        return this;
    }

    // Handle input directly if needed, or called by Scene
    handleInput(type, x, y) {
        if (type === 'touchstart' && this.checkClicked(x, y)) {
            if (this.onClick) {
                this.onClick();
            }
            return true;
        }
        return false;
    }

    render(ctx) {
        if (!this.visible) return;

        // 绘制按钮背景（支持透明）
        if (this.bgColor && this.bgColor !== 'transparent') {
            RenderUtils.fillRoundRect(ctx, this.x, this.y, this.width, this.height, this.radius, this.bgColor);
        }

        // 绘制按钮文字
        if (this.text) {
            ctx.save();
            ctx.fillStyle = this.fgColor;
            ctx.font = `${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 如果背景透明，添加文字阴影提升可读性
            if (!this.bgColor || this.bgColor === 'transparent') {
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
            }
            
            ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
            ctx.restore();
        }
    }
}
