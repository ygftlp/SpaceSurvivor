import RenderUtils from '../utils/renderUtils.js';
import { GameConfig } from '../config.js';

export default class Obstacle {
    constructor(x, y, type = 'ASTEROID_M') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;

        // Stats based on type
        switch (type) {
            case 'ASTEROID_L':
                this.width = 100;
                this.height = 100;
                this.hp = 999; // Practically indestructible
                this.damage = 50; // High collision damage
                break;
            case 'ASTEROID_S':
                this.width = 40;
                this.height = 40;
                this.hp = 20; // Destroyable
                this.damage = 10;
                break;
            case 'WRECKAGE':
                this.width = 60;
                this.height = 60;
                this.hp = 50;
                this.damage = 20;
                break;
            default: // ASTEROID_M
                this.width = 70;
                this.height = 70;
                this.hp = 60;
                this.damage = 30;
                break;
        }

        // Physics
        this.vx = (Math.random() - 0.5) * 50; // Slow drift X
        this.vy = 50 + Math.random() * 100;   // Downward drift
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 2.0;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotationSpeed * dt;

        // Out of bounds
        if (this.y > GameConfig.Screen.height + 100 || this.x < -100 || this.x > GameConfig.Screen.width + 100) {
            this.active = false;
        }
    }

    // Optional: Obstacles can take damage?
    takeDamage(amount) {
        // Large asteroids might be immune
        if (this.type === 'ASTEROID_L') return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.active = false;
            // Spawn particle effect?
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw based on type
        ctx.fillStyle = '#888888';
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 3;

        // Irregular Polygon for Asteroid
        ctx.beginPath();
        const r = this.width / 2;
        // Simple 6-sided rock
        ctx.moveTo(r, 0);
        ctx.lineTo(r * 0.5, r * 0.8);
        ctx.lineTo(-r * 0.5, r * 0.6);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.5, -r * 0.7);
        ctx.lineTo(r * 0.6, -r * 0.6);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Cracks / Detail
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, -r * 0.2);
        ctx.lineTo(r * 0.3, r * 0.1);
        ctx.stroke();

        ctx.restore();
    }
}
