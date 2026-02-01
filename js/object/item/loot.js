/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 掉落物类，代表金币或物品。
 */

export default class Loot {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'gold' or 'chest'
        this.active = true;
        this.width = 30;
        this.height = 30;

        // 磁吸效果相关
        this.speedX = (Math.random() - 0.5) * 5; // 初始爆开
        this.speedY = (Math.random() - 0.5) * 5 - 5; // 向上爆开
        this.isMagnetized = false;
    }

    update(dt) {
        if (!this.active) return;

        // 简单的物理运动：先散开，然后缓慢下落
        this.x += this.speedX;
        this.y += this.speedY;

        this.speedX *= 0.95; // 阻力
        this.speedY += 0.5; // 重力

        // 边界销毁
        if (this.y > 1300) this.active = false;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'gold') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'exp') {
            // EXP Orb - Blue
            ctx.fillStyle = '#00a8ff';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'energy') {
            // 能量电池 - 黄色发光
            ctx.fillStyle = '#ffcc00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffcc00';
            ctx.beginPath();
            ctx.rect(-8, -12, 16, 24);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // 电池顶端
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(-4, -16, 8, 4);
        } else {
            ctx.fillStyle = '#00FF00'; // Chest
            ctx.fillRect(-10, -10, 20, 20);
        }

        ctx.restore();
    }
}
