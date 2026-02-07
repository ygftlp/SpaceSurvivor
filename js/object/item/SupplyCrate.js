import { dataManager } from '../../manager/dataManager.js';
import { audioManager } from '../../manager/audioManager.js';
import { GameConfig } from '../../config.js';

export default class SupplyCrate {
    constructor(x, y, goldValue) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.goldValue = goldValue;
        this.active = true;
        this.lifeTime = 30; // Disappear after 30 seconds if not picked

        // Float animation
        this.baseY = y;
        this.floatOffset = 0;

        // Movement (Drift)
        const speed = 50 + Math.random() * 50; // Random speed 50-100 px/sec
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(dt) {
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.active = false;
        }

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounce off walls
        if (this.x < 30 || this.x > GameConfig.Screen.width - 30) {
            this.vx *= -1;
            this.x = Math.max(30, Math.min(this.x, GameConfig.Screen.width - 30));
        }
        if (this.y < 100 || this.y > GameConfig.Screen.height - 30) { // Keep below HUD
            this.vy *= -1;
            this.y = Math.max(100, Math.min(this.y, GameConfig.Screen.height - 30));
        }

        // Float visual only
        this.floatOffset = Math.sin(Date.now() / 300) * 10;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y + this.floatOffset);

        // Draw Crate
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-20, -20, 40, 40);

        // Detail (Cross or $)
        ctx.strokeStyle = '#c65102';
        ctx.lineWidth = 3;
        ctx.strokeRect(-20, -20, 40, 40);

        ctx.fillStyle = '#c65102';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 8);

        // Glow
        const pulse = Math.abs(Math.sin(Date.now() / 500));
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10 + pulse * 10;
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.strokeRect(-25, -25, 50, 50);

        // Timer bar if fading soon
        if (this.lifeTime < 5) {
            ctx.fillStyle = 'red';
            ctx.fillRect(-20, 25, 40 * (this.lifeTime / 5), 4);
        }

        ctx.restore();
    }
}
