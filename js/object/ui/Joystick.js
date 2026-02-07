/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 虚拟摇杆组件 (Virtual Joystick) - Floating & Cyberpunk Style
 */
import Component from './Component.js';

export default class Joystick extends Component {
    constructor(x, y, radius = 60, floating = false) {
        super(x - radius, y - radius, radius * 2, radius * 2);
        this.radius = radius;
        this.defaultX = x;
        this.defaultY = y;

        this.originX = x;
        this.originY = y;
        this.knobX = x;
        this.knobY = y;
        this.knobRadius = radius / 3;

        this.inputActive = false;
        this.normalized = { x: 0, y: 0 };
        this.value = 0;

        this.floating = floating;
        if (this.floating) {
            this.visible = false; // Initially hidden if floating
        }
    }

    handleInput(type, x, y) {
        if (!this.active) return false;

        if (type === 'touchstart') {
            if (this.floating) {
                // Floating Mode: Snap to touch
                this.originX = x;
                this.originY = y;
                this.knobX = x;
                this.knobY = y;
                this.visible = true;
                this.inputActive = true;
                return true;
            } else {
                // Fixed Mode: Check distance
                const distance = Math.sqrt((x - this.originX) ** 2 + (y - this.originY) ** 2);
                if (distance <= this.radius * 1.5) {
                    this.inputActive = true;
                    this.updateKnob(x, y);
                    return true;
                }
            }
        } else if (type === 'touchmove') {
            if (this.inputActive) {
                this.updateKnob(x, y);
                return true;
            }
        } else if (type === 'touchend') {
            if (this.inputActive) {
                this.inputActive = false;
                this.resetKnob();
                if (this.floating) {
                    this.visible = false;
                }
                return true;
            }
        }

        return false;
    }

    updateKnob(x, y) {
        const dx = x - this.originX;
        const dy = y - this.originY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let moveX = dx;
        let moveY = dy;

        // Clamp to radius
        if (dist > this.radius) {
            const ratio = this.radius / dist;
            moveX = dx * ratio;
            moveY = dy * ratio;
        }

        this.knobX = this.originX + moveX;
        this.knobY = this.originY + moveY;

        // Calculate Output
        this.normalized.x = moveX / this.radius;
        this.normalized.y = moveY / this.radius;
        this.value = Math.min(dist / this.radius, 1);
    }

    resetKnob() {
        this.knobX = this.originX;
        this.knobY = this.originY;
        this.normalized.x = 0;
        this.normalized.y = 0;
        this.value = 0;
    }

    getDirection() {
        return this.normalized;
    }

    render(ctx) {
        if (!this.visible && this.floating) return;

        ctx.save();

        // --- Outer Base (Cyberpunk Ring) ---
        ctx.beginPath();
        ctx.arc(this.originX, this.originY, this.radius, 0, Math.PI * 2);

        // Gradient Base
        const gradBase = ctx.createRadialGradient(this.originX, this.originY, this.radius * 0.5, this.originX, this.originY, this.radius);
        gradBase.addColorStop(0, 'rgba(0, 255, 255, 0.05)');
        gradBase.addColorStop(0.8, 'rgba(0, 255, 255, 0.1)');
        gradBase.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
        ctx.fillStyle = gradBase;
        ctx.fill();

        ctx.strokeStyle = '#00d2d3'; // Cyan
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]); // Dashed Ring
        ctx.stroke();
        ctx.setLineDash([]);

        // --- Inner Knob ---
        ctx.beginPath();
        ctx.arc(this.knobX, this.knobY, this.knobRadius, 0, Math.PI * 2);

        // Gradient Knob
        const gradKnob = ctx.createRadialGradient(this.knobX - 5, this.knobY - 5, 2, this.knobX, this.knobY, this.knobRadius);
        gradKnob.addColorStop(0, '#ffffff');
        gradKnob.addColorStop(1, '#00b894'); // Teal

        ctx.fillStyle = gradKnob;
        ctx.fill();

        // Glow Effect
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}
