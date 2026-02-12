/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: UI 绘图工具类，提供圆角矩形、渐变按钮、发光文字等绘制方法。
 */

export default class RenderUtils {

    /**
     * 绘制赛博朋克风格面板 (切角 + 边框 + 扫描线)
     */
    static drawCyberPanel(ctx, x, y, w, h, options = {}) {
        const cornerSize = options.corner || 20;
        const color = options.color || '#00d2d3';
        const bgAlpha = options.bgAlpha !== undefined ? options.bgAlpha : 0.85;
        
        ctx.save();
        
        // 1. Path Definition (Cut Corners)
        ctx.beginPath();
        ctx.moveTo(x + cornerSize, y);
        ctx.lineTo(x + w - cornerSize, y);
        ctx.lineTo(x + w, y + cornerSize);
        ctx.lineTo(x + w, y + h - cornerSize);
        ctx.lineTo(x + w - cornerSize, y + h);
        ctx.lineTo(x + cornerSize, y + h);
        ctx.lineTo(x, y + h - cornerSize);
        ctx.lineTo(x, y + cornerSize);
        ctx.closePath();
        
        // 2. Background
        ctx.fillStyle = `rgba(10, 15, 30, ${bgAlpha})`;
        ctx.fill();
        
        // 3. Grid / Scanlines (Optional Decoration)
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = `rgba(255,255,255,0.03)`;
        ctx.lineWidth = 1;
        for(let i=0; i<h; i+=10) {
            ctx.beginPath(); ctx.moveTo(x, y+i); ctx.lineTo(x+w, y+i); ctx.stroke();
        }
        ctx.restore();

        // 4. Glow Border
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 5. Decorative Accents (Corner Brackets)
        const bracketLen = 15;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        
        // Top Left
        ctx.beginPath(); ctx.moveTo(x, y + cornerSize + bracketLen); ctx.lineTo(x, y + cornerSize); ctx.lineTo(x + cornerSize, y); ctx.lineTo(x + cornerSize + bracketLen, y); ctx.stroke();
        // Bottom Right
        ctx.beginPath(); ctx.moveTo(x + w, y + h - cornerSize - bracketLen); ctx.lineTo(x + w, y + h - cornerSize); ctx.lineTo(x + w - cornerSize, y + h); ctx.lineTo(x + w - cornerSize - bracketLen, y + h); ctx.stroke();

        ctx.restore();
    }

    /**
     * 绘制科技感按钮
     */
    static drawButton(ctx, x, y, w, h, text, options = {}) {
        const isHover = options.hover || false;
        const color = options.color || '#00d2d3';
        
        ctx.save();
        
        // Glow if hover
        if (isHover) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
        }

        // Background
        ctx.fillStyle = isHover ? color : 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, h);
        
        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        // Text
        ctx.fillStyle = isHover ? '#000' : color;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w/2, y + h/2);
        
        ctx.restore();
    }

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

        // 统一光效
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        if (type === 'SCOUT') {
            // === 侦察机/无人机 (Drone) ===
            // 设计：菱形/飞镖形，轻盈
            ctx.beginPath();
            ctx.moveTo(0, 25);  // 机头
            ctx.lineTo(15, -15); // 右翼尖
            ctx.lineTo(0, -5);   // 尾部凹槽
            ctx.lineTo(-15, -15);// 左翼尖
            ctx.closePath();
            ctx.fill();
            
            // 核心亮灯
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === 'TANK') {
            // === 重装战机/轰炸机 (Heavy) ===
            // 设计：厚重的倒三角形/飞翼，带装甲感
            ctx.fillStyle = color; // 深色主体
            
            // 主体
            ctx.beginPath();
            ctx.moveTo(0, 30);   // 机头
            ctx.lineTo(25, 5);   // 右前翼
            ctx.lineTo(35, -20); // 右翼尖
            ctx.lineTo(10, -25); // 右引擎
            ctx.lineTo(0, -15);  // 尾喷口
            ctx.lineTo(-10, -25);// 左引擎
            ctx.lineTo(-35, -20);// 左翼尖
            ctx.lineTo(-25, 5);  // 左前翼
            ctx.closePath();
            ctx.fill();
            
            // 结构线
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 双引擎喷口
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath();
            ctx.arc(-15, -20, 4, 0, Math.PI * 2);
            ctx.arc(15, -20, 4, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // === 标准战机 (Fighter) ===
            // 设计：类似 F-22/Su-57 的前掠翼或后掠翼设计
            
            // 机翼下层 (暗色)
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.lineTo(30, -10);
            ctx.lineTo(30, -20);
            ctx.lineTo(-30, -20);
            ctx.lineTo(-30, -10);
            ctx.closePath();
            ctx.fill();

            // 机身主体
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, 35);   // 机头
            ctx.lineTo(8, 0);    // 机身右侧
            ctx.lineTo(25, -15); // 右翼
            ctx.lineTo(10, -20); // 右尾翼前缘
            ctx.lineTo(12, -30); // 右垂尾
            ctx.lineTo(0, -25);  // 尾喷口中心
            ctx.lineTo(-12, -30);// 左垂尾
            ctx.lineTo(-10, -20);// 左尾翼前缘
            ctx.lineTo(-25, -15);// 左翼
            ctx.lineTo(-8, 0);   // 机身左侧
            ctx.closePath();
            ctx.fill();
            
            // 驾驶舱盖
            ctx.fillStyle = '#2d3436';
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(4, 5);
            ctx.lineTo(0, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            
            // 引擎光效
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0984e3';
            ctx.fillStyle = '#74b9ff';
            ctx.beginPath();
            ctx.rect(-6, -28, 12, 4);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0; // Reset
    }

}
