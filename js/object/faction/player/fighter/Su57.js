import BaseFighter from './BaseFighter.js';

export default class Su57 extends BaseFighter {
    constructor() {
        super();
        this.name = '苏-57 罪犯';
        this.desc = '【近战格斗】重型前线战机。机动性与火力并重。';
        this.hp = 110;
        this.speed = 11;
        this.damage = 15;
        this.unlockCost = 0;
        this.engineOffsets = [{ x: -18, y: 95 }, { x: 18, y: 95 }];
        this.thrustColor = '#0000ff';

        this.hardpoints = [
            { x: -70, y: 45, type: 'pylon' },
            { x: 70, y: 45, type: 'pylon' },
            { x: -95, y: 50, type: 'pylon' },
            { x: 95, y: 50, type: 'pylon' }
        ];
    }

    render(ctx, size = 100) {
        const scale = size / 100;
        ctx.save();
        ctx.scale(scale, scale);

        this.applyHover(ctx);
        this.renderParticles(ctx);
        this.renderThruster(ctx, -18, 95, this.thrustColor);
        this.renderThruster(ctx, 18, 95, this.thrustColor);

        // Body
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        
        const mainColor = this.mainColor || '#85929E';
        ctx.fillStyle = mainColor;

        ctx.beginPath();
        // Flattened Su-57 Shape
        ctx.moveTo(0, -110);
        ctx.lineTo(-8, -70);
        ctx.lineTo(-20, -40); // LERX
        ctx.lineTo(-95, 30);  // Wing
        ctx.lineTo(-95, 50);
        ctx.lineTo(-25, 80);
        ctx.lineTo(-25, 100); // Sting
        ctx.lineTo(-30, 110);
        ctx.lineTo(-10, 105);
        ctx.lineTo(0, 115);

        // Mirror
        ctx.lineTo(10, 105);
        ctx.lineTo(30, 110);
        ctx.lineTo(25, 100);
        ctx.lineTo(25, 80);
        ctx.lineTo(95, 50);
        ctx.lineTo(95, 30);
        ctx.lineTo(20, -40);
        ctx.lineTo(8, -70);
        ctx.lineTo(0, -110);
        ctx.closePath();
        ctx.fill();

        // Canopy
        ctx.fillStyle = '#212F3C';
        ctx.beginPath();
        ctx.ellipse(0, -60, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        this.renderEquipment(ctx);
        ctx.restore();
    }
}
