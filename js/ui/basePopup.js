/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 通用弹窗基类，提供统一的背景遮罩、边框样式和显示/隐藏逻辑。
 */

import { GameConfig } from '../config.js';

export default class BasePopup {
    constructor() {
        this.visible = false;

        // 屏幕尺寸
        this.screenWidth = GameConfig.Screen.width;
        // height 需要在 resize 或渲染时获取 logicHeight，这里暂存 1280
        this.screenHeight = 1280;

        // 弹窗默认尺寸
        this.width = 500;
        this.height = 600;

        // 居中位置
        this.x = (this.screenWidth - this.width) / 2;
        this.y = (this.screenHeight - this.height) / 2;

        // 回调
        this.onCloseCallback = null;
    }

    show(logicHeight) {
        this.visible = true;
        if (logicHeight) {
            this.screenHeight = logicHeight;
            this.y = (this.screenHeight - this.height) / 2;
        }
        console.log('Popup Show');
    }

    hide() {
        this.visible = false;
        if (this.onCloseCallback) this.onCloseCallback();
    }

    /**
     * 处理点击事件
     * @returns {boolean} 是否拦截了事件
     */
    handleInput(x, y) {
        if (!this.visible) return false;

        // 1. 检查是否点击了弹窗内部
        if (x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height) {

            this.onClickContent(x - this.x, y - this.y);
            return true; // 拦截事件，不再传递给下层
        }

        // 2. 点击了遮罩层 -> 关闭?
        // this.hide(); 
        return true; // 遮罩层通常也拦截
    }

    /**
     * 子类重写此方法处理内容点击
     */
    onClickContent(localX, localY) {
        // Override me
    }

    render(ctx) {
        if (!this.visible) return;

        // 1. 绘制半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

        // 2. 绘制弹窗背景
        ctx.save();
        ctx.translate(this.x, this.y);

        // 背景色
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(0, 0, this.width, this.height);

        // 边框
        ctx.strokeStyle = '#00d8d6';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, this.width, this.height);

        // 标题栏背景 (可选)
        // ctx.fillStyle = '#0fbcf9';
        // ctx.fillRect(0, 0, this.width, 60);

        // 3. 绘制子类内容
        this.renderContent(ctx);

        ctx.restore();
    }

    /**
     * 子类重写此方法绘制具体内容
     */
    renderContent(ctx) {
        // Override me
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Base Popup", this.width / 2, 50);
    }
}
