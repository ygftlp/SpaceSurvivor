import BaseFighter from './BaseFighter.js';

export default class F16 extends BaseFighter {
    constructor() {
        super();
        this.name = '战隼 F-16';
        this.desc = '轻型多用途战机，高推重比，机动灵活。';
        this.hp = 80; // Lower HP
        this.speed = 12; // High speed
        this.damage = 10; // Standard Firepower
        this.unlockCost = 800; // Cheaper than J-20/Su-57
        this.engineOffsets = [{ x: 0, y: 95 }]; // Single Engine
        this.thrustColor = '#ff9900'; // Orange/Yellow flame

        // Hardpoints: Wingtips (Missiles), Mid-Wing (Bombs/Missiles)
        this.hardpoints = [
            { x: -75, y: 35, type: 'wingtip' }, // Left Wingtip
            { x: 75, y: 35, type: 'wingtip' },  // Right Wingtip
            { x: -45, y: 45, type: 'pylon' },   // Left Pylon
            { x: 45, y: 45, type: 'pylon' }     // Right Pylon
        ];
    }

    render(ctx, size) {
        const s = size || this.width;
        const scale = s / 100;

        ctx.save();
        ctx.scale(scale, scale);

        // Hover
        this.applyHover(ctx);
        this.renderParticles(ctx);

        // --- Thruster (Single) ---
        this.renderThruster(ctx, 0, 95, this.thrustColor);

        // --- F-16 "Fighting Falcon" Render ---
        // F-16 Render (Shadow inlined)
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;

        // Body Gradient (Standard Grey)
        const bodyGrad = ctx.createLinearGradient(0, -90, 0, 90);
        if (this.mainColor) {
            bodyGrad.addColorStop(0, this.adjustColor(this.mainColor, 40));
            bodyGrad.addColorStop(1, this.adjustColor(this.mainColor, -20));
        } else {
            bodyGrad.addColorStop(0, '#D7DBDD');
            bodyGrad.addColorStop(1, '#85929E');
        }

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();

        // 1. Nose (Radome) - Long and sharp
        ctx.moveTo(0, -110);
        ctx.lineTo(-4, -75);

        // 2. Forebody (Canopy area)
        ctx.lineTo(-7, -45);

        // 3. LERX (Leading Edge Root Extension) - Distinctive strake
        ctx.quadraticCurveTo(-12, -30, -18, -15);

        // 4. Main Wing (Cropped Delta)
        ctx.lineTo(-75, 25);  // Wingtip Leading Edge
        ctx.lineTo(-75, 35);  // Wingtip Trailing Edge
        ctx.lineTo(-20, 55);  // Wing Root Trailing Edge

        // 5. Aft Fuselage blend
        ctx.lineTo(-20, 85);

        // 6. Horizontal Stabilator (Tailplane)
        ctx.lineTo(-45, 105); // Stab Tip
        ctx.lineTo(-15, 100); // Stab Root

        // 7. Engine Nozzle Fairing
        ctx.lineTo(-10, 105);
        ctx.lineTo(0, 110);   // Center Rear
        ctx.lineTo(10, 105);

        // Mirror Right Side
        ctx.lineTo(15, 100);
        ctx.lineTo(45, 105);
        ctx.lineTo(20, 85);
        ctx.lineTo(20, 55);
        ctx.lineTo(75, 35);
        ctx.lineTo(75, 25);
        ctx.lineTo(18, -15);
        ctx.quadraticCurveTo(12, -30, 7, -45);
        ctx.lineTo(4, -75);
        ctx.lineTo(0, -110);

        ctx.closePath();
        ctx.fill();

        // --- 3D Spine Effect (Highlighter) ---
        ctx.save();
        ctx.clip(); // Clip to the body shape

        // Central Spine Highlight (Rounded fuselage top)
        const spineGrad = ctx.createLinearGradient(-15, 0, 15, 0);
        spineGrad.addColorStop(0, 'rgba(0,0,0,0.2)');   // Left shadow
        spineGrad.addColorStop(0.3, 'rgba(0,0,0,0.0)'); // Blend
        spineGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)'); // Top highlight
        spineGrad.addColorStop(0.7, 'rgba(0,0,0,0.0)'); // Blend
        spineGrad.addColorStop(1, 'rgba(0,0,0,0.2)');   // Right shadow

        ctx.fillStyle = spineGrad;
        ctx.fillRect(-80, -120, 160, 240); // Cover entire fighter

        // Wing Leading Edge Highlight
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.moveTo(-75, 25); ctx.lineTo(-18, -15); // Left Wing LE
        ctx.moveTo(75, 25); ctx.lineTo(18, -15);   // Right Wing LE
        ctx.stroke();

        // Wing Trailing Edge Shadow
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.moveTo(-75, 35); ctx.lineTo(-20, 55);
        ctx.moveTo(75, 35); ctx.lineTo(20, 55);
        ctx.stroke();

        // --- Vertical Stabilizer (The Tail Fin) ---
        // In top-down 2D, a vertical fin is a thin profile. 
        // We simulate it with a gradient and a shadow to show height.

        // Shadow (Offset to show height)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(4, 60);  // Shadow starts offset
        ctx.lineTo(4, 105);
        ctx.lineTo(8, 110); // Shadow widens/shifts
        ctx.lineTo(6, 105);
        ctx.fill();

        // The Fin Itself (Central)
        const tailGrad = ctx.createLinearGradient(-2, 0, 2, 0);
        tailGrad.addColorStop(0, '#99A3A4'); // Light side
        tailGrad.addColorStop(0.5, '#D7DBDD'); // Highlight (Top edge)
        tailGrad.addColorStop(1, '#5D6D7E'); // Dark side

        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        // Dorsal Fairing (Spine blend)
        ctx.moveTo(-2, 55);
        ctx.lineTo(2, 55);
        // Root widens slightly
        ctx.lineTo(3, 100);
        ctx.lineTo(2, 112); // Rear tip (Rudder/Parachute housing)
        ctx.lineTo(-2, 112);
        ctx.lineTo(-3, 100);
        ctx.fill();

        // Fin Leading Edge Highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 55); ctx.lineTo(0, 112);
        ctx.stroke();

        ctx.restore(); // End clipping

        // --- Details ---

        // Ventral Fins (Underneath tail)
        ctx.fillStyle = '#5D6D7E';
        ctx.beginPath();
        // Left Fin
        ctx.moveTo(-8, 95);
        ctx.lineTo(-12, 108);
        ctx.lineTo(-8, 105);
        // Right Fin
        ctx.moveTo(8, 95);
        ctx.lineTo(12, 108);
        ctx.lineTo(8, 105);
        ctx.fill();

        // Intake (The "Smile") - More accurate position
        ctx.fillStyle = '#212F3C';
        ctx.beginPath();
        ctx.moveTo(-7, -25);
        ctx.quadraticCurveTo(0, -20, 7, -25);
        ctx.lineTo(5, -15);
        ctx.lineTo(-5, -15);
        ctx.fill();

        // Panel Lines (Subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Radome separation
        ctx.moveTo(-4, -75); ctx.quadraticCurveTo(0, -72, 4, -75);
        // Wing Flaps/Ailerons
        ctx.moveTo(-75, 30); ctx.lineTo(-25, 50);
        ctx.moveTo(75, 30); ctx.lineTo(25, 50);
        ctx.stroke();

        // Rudder line (on fuselage)
        ctx.moveTo(0, 85); ctx.lineTo(0, 105);
        ctx.stroke();

        // --- Cockpit Detail (Enhanced F-16 Style) ---
        ctx.save();

        // 1. Cockpit Tub (Dark Interior)
        ctx.fillStyle = '#17202A';
        ctx.beginPath();
        // Teardrop shape for the tub
        ctx.moveTo(0, -62);
        ctx.quadraticCurveTo(7, -52, 7, -40);
        ctx.quadraticCurveTo(7, -28, 0, -28);
        ctx.quadraticCurveTo(-7, -28, -7, -40);
        ctx.quadraticCurveTo(-7, -52, 0, -62);
        ctx.fill();

        // 2. ACES II Ejection Seat
        // Headrest (Distinctive boxy shape)
        ctx.fillStyle = '#283747';
        ctx.fillRect(-5, -35, 10, 6);
        // Seat sides/Rails
        ctx.fillStyle = '#566573';
        ctx.fillRect(-6, -38, 2, 12);
        ctx.fillRect(4, -38, 2, 12);

        // 3. Pilot (Top-down view)
        // Flight Suit (Green/Olive)
        ctx.fillStyle = '#2E4053';
        ctx.beginPath();
        ctx.arc(0, -42, 4, 0, Math.PI * 2); // Shoulders/Body
        ctx.fill();
        // Helmet (HGU-55/P or JHMCS - Grey/White)
        ctx.fillStyle = '#D7DBDD';
        ctx.beginPath();
        ctx.arc(0, -40, 3, 0, Math.PI * 2);
        ctx.fill();
        // Visor (Dark)
        ctx.fillStyle = '#1C2833';
        ctx.beginPath();
        ctx.ellipse(0, -41, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Canopy Glass (Gold/Indium Tin Oxide Coating)
        const canopyGrad = ctx.createLinearGradient(0, -70, 0, -20);
        canopyGrad.addColorStop(0, 'rgba(241, 196, 15, 0.3)');   // Gold tint (Radar absorbent)
        canopyGrad.addColorStop(0.4, 'rgba(241, 196, 15, 0.1)'); // Fades in middle
        canopyGrad.addColorStop(1, 'rgba(21, 67, 96, 0.2)');     // Darker base

        ctx.fillStyle = canopyGrad;
        ctx.beginPath();
        ctx.moveTo(0, -64); // Front point (frameless)
        ctx.quadraticCurveTo(8, -52, 8, -40);
        ctx.quadraticCurveTo(8, -25, 0, -25); // Rear
        ctx.quadraticCurveTo(-8, -25, -8, -40);
        ctx.quadraticCurveTo(-8, -52, 0, -64);
        ctx.fill();

        // 5. Specular Highlights (The "Bubble" look)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Long highlight on left
        ctx.moveTo(-4, -55);
        ctx.quadraticCurveTo(-6, -45, -4, -35);
        ctx.stroke();
        // Dot on right
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.arc(4, -50, 1, 0, Math.PI * 2);
        ctx.fill();

        // 6. Canopy Frame (F-16 only has the rear arch "Bow Frame" behind pilot)
        ctx.strokeStyle = '#85929E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -28, 8, Math.PI, 0); // Rear arch
        ctx.stroke();

        // 7. HUD Projector (Green glow at front)
        ctx.fillStyle = 'rgba(46, 204, 113, 0.6)';
        ctx.shadowColor = '#2ECC71';
        ctx.shadowBlur = 5;
        ctx.fillRect(-2.5, -60, 5, 2);
        ctx.shadowBlur = 0; // Reset

        ctx.restore();

        this.renderNavLights(ctx, {
            left: { x: -75, y: 25 },
            right: { x: 75, y: 25 },
            tail: { x: 0, y: 100 }
        });

        // Render Equipment (Missiles, Tanks, etc.)
        this.renderDevices(ctx);

        ctx.restore();
    }
}
