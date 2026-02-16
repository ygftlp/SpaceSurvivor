import BaseFighter from './BaseFighter.js';

export default class F22 extends BaseFighter {
    constructor() {
        super();
        this.name = '猛禽 F-22';
        this.desc = '【全能空优】空中优势战斗机，矢量推力带来极强机动。';
        this.hp = 100;
        this.speed = 12;
        this.damage = 14;
        this.unlockCost = 0;
        this.engineOffsets = [{ x: -15, y: 90 }, { x: 15, y: 90 }];
        this.thrustColor = '#ff5500';

        this.hardpoints = [
            { x: -65, y: 40, type: 'pylon' },
            { x: 65, y: 40, type: 'pylon' },
            { x: -90, y: 45, type: 'pylon' },
            { x: 90, y: 45, type: 'pylon' }
        ];
    }

    render(ctx, size = 100) {
        const scale = size / 100;
        ctx.save();
        ctx.scale(scale, scale);

        this.applyHover(ctx);
        this.renderParticles(ctx);
        this.renderThruster(ctx, -15, 90, this.thrustColor);
        this.renderThruster(ctx, 15, 90, this.thrustColor);

        // Body
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        
        const mainColor = this.mainColor || '#5D6D7E';
        ctx.fillStyle = mainColor;

        ctx.beginPath();
        // Simplified F-22 Shape (Diamond Wings)
        ctx.moveTo(0, -100); // Nose
        ctx.lineTo(-10, -60);
        ctx.lineTo(-30, -40); // Intake
        ctx.lineTo(-90, 20);  // Wing Tip
        ctx.lineTo(-90, 40);
        ctx.lineTo(-20, 70);
        ctx.lineTo(-30, 95);  // Stab
        ctx.lineTo(-10, 90);
        ctx.lineTo(0, 100);
        
        // Mirror
        ctx.lineTo(10, 90);
        ctx.lineTo(30, 95);
        ctx.lineTo(20, 70);
        ctx.lineTo(90, 40);
        ctx.lineTo(90, 20);
        ctx.lineTo(30, -40);
        ctx.lineTo(10, -60);
        ctx.lineTo(0, -100);
        ctx.closePath();
        ctx.fill();

        // Canopy
        ctx.fillStyle = '#D4AC0D';
        ctx.beginPath();
        ctx.ellipse(0, -50, 6, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        this.renderEquipment(ctx);
        ctx.restore();
    }
}

