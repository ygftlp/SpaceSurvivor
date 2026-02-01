/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: UI 绘图工具类，提供圆角矩形、渐变按钮、发光文字等绘制方法。
 */

export default class RenderUtils {

    /**
     * 绘制圆角矩形路径
     */
    static roundRectPath(ctx, x, y, w, h, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    /**
     * 绘制填充的圆角矩形 (带可选边框)
     */
    static fillRoundRect(ctx, x, y, w, h, radius, fillStyle, strokeStyle = null, lineWidth = 0) {
        ctx.save();
        this.roundRectPath(ctx, x, y, w, h, radius);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        if (strokeStyle && lineWidth > 0) {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * 绘制发光文字
     */
    static drawGlowingText(ctx, text, x, y, fontSize, color, glowColor = '#00f', align = 'center') {
        ctx.save();
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = align;

        // 阴影/发光层
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);

        // 再次绘制增强发光 (可选)
        // ctx.shadowBlur = 0;
        // ctx.fillText(text, x, y);

        ctx.restore();
    }

    /**
     * 绘制科技感面板背景 (玻璃质感 + 边框)
     */
    static drawPanel(ctx, x, y, w, h) {
        ctx.save();

        // 1. 半透明深色背景
        this.fillRoundRect(ctx, x, y, w, h, 20, 'rgba(30, 39, 46, 0.9)');

        // 2. 渐变边框
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#00d2d3');
        grad.addColorStop(0.5, '#5f27cd');
        grad.addColorStop(1, '#00d2d3');

        ctx.lineWidth = 3;
        ctx.strokeStyle = grad;
        this.roundRectPath(ctx, x, y, w, h, 20);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw enemy fighter based on type
     */
    static drawEnemyFighter(ctx, count = 0, type, color) {
        // Note: Context is already translated/rotated by the caller (Enemy.render)
        // Drawing centered at 0,0

        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        if (type === 'SCOUT') {
            // Needle / Dart shape
            ctx.beginPath();
            ctx.moveTo(0, 30); // Nose (pointing down usually, but enemy is rotated)
            // Actually Enemy.render rotates 0, but logical 'down' is +Y.
            // Let's assume Nose is at +Y? Or -Y?
            // Usually standard is -Y is forward (up). But Enemies fly Down (+Y).
            // Let's draw pointing DOWN (+Y)

            ctx.moveTo(0, 30); // Nose
            ctx.lineTo(10, -20); // Wing tip
            ctx.lineTo(0, -10); // Tail center
            ctx.lineTo(-10, -20); // Wing tip
            ctx.closePath();
            ctx.fill();

            // Engine glow
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath();
            ctx.arc(0, -15, 3, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === 'TANK') {
            // Heavy Bomber / Flying Wing
            ctx.beginPath();
            ctx.moveTo(0, 30); // Nose
            ctx.lineTo(20, 10);
            ctx.lineTo(40, -10); // Wing tip
            ctx.lineTo(15, -20);
            ctx.lineTo(0, -10); // Tail
            ctx.lineTo(-15, -20);
            ctx.lineTo(-40, -10); // Wing tip
            ctx.lineTo(-20, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

        } else {
            // Default Fighter (Inverted F-22 style)
            ctx.beginPath();
            ctx.moveTo(0, 30); // Nose
            ctx.lineTo(10, 5);
            ctx.lineTo(25, 0); // Wing
            ctx.lineTo(25, -15); // Wing back
            ctx.lineTo(5, -10); // Body
            ctx.lineTo(5, -25); // Tail
            ctx.lineTo(0, -20);
            ctx.lineTo(-5, -25);
            ctx.lineTo(-5, -10);
            ctx.lineTo(-25, -15);
            ctx.lineTo(-25, 0);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Cockpit
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.lineTo(3, 0);
            ctx.lineTo(0, -5);
            ctx.lineTo(-3, 0);
            ctx.closePath();
            ctx.fill();
        }
    }

}
