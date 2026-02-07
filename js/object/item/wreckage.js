import { dataManager } from '../../manager/dataManager.js';
import { audioManager } from '../../manager/audioManager.js';
import { GameConfig } from '../../config.js';

export default class Wreckage {
    constructor(x, y, gold) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.gold = gold;
        this.hp = 300; // Requires some shooting to break
        this.active = true;
        this.isWreckage = true; // Tag for collision
    }

    update(dt) {
        // Stationary, maybe slight drift or pulse
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Visual: Black Box (Orange Recorder)
        ctx.fillStyle = '#ff9f43'; // Orange
        ctx.fillRect(-20, -15, 40, 30);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-20, -15, 40, 30);

        // Label "REC"
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('REC', 0, 5);

        // Warning / Signal Light (Blinking Red)
        const pulse = Math.abs(Math.sin(Date.now() / 200));
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, -25, 5, 0, Math.PI * 2);
        ctx.fill();

        // Text Hint
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLACK BOX', 0, 40);

        ctx.restore();
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.explode();
        }
    }

    explode() {
        this.active = false;
        audioManager.play('explosion');

        // Reward
        dataManager.addGold(this.gold);
        dataManager.clearWreck();

        console.log(`Shadow Challenge Completed! Found ${this.gold} gold.`);
    }
}
