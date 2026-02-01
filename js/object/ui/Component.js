/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: UI 组件基类
 */
export default class Component {
    constructor(x = 0, y = 0, w = 0, h = 0) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.visible = true;
        this.active = true;
        this.children = [];
    }

    /**
     * Check if point is inside component
     */
    checkClicked(touchX, touchY) {
        if (!this.visible || !this.active) return false;

        return (
            touchX >= this.x &&
            touchX <= this.x + this.width &&
            touchY >= this.y &&
            touchY <= this.y + this.height
        );
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
    }

    update(dt) {
        // Override
    }

    render(ctx) {
        // Override
    }
}
