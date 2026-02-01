
class PlayerRadarSystem {
    constructor() {
        this.types = {
            'RADAR_STANDARD': {
                name: 'Standard Pulse Radar',
                range: 400,
                scanSpeed: 0.05,
                color: '#00FF00',
                description: 'Standard issue fleet radar. Balanced range and scan speed.',
                render: this.renderStandard
            },
            'RADAR_LONG_RANGE': {
                name: 'Deep Space Array',
                range: 800,
                scanSpeed: 0.02,
                color: '#0088FF',
                description: 'High-power emitter for long-range detection. Slow scan rate.',
                render: this.renderLongRange
            },
            'RADAR_RAPID': {
                name: 'Rapid Response Scanner',
                range: 250,
                scanSpeed: 0.15,
                color: '#FFDD00',
                description: 'High-speed rotation for close-quarters combat awareness.',
                render: this.renderRapid
            },
            'RADAR_STEALTH': {
                name: 'Passive Phase Array',
                range: 350,
                scanSpeed: 0.04,
                color: '#A0A0FF',
                description: 'Low-emission system to reduce electromagnetic signature.',
                render: this.renderStealth
            },
            'RADAR_DOPPLER': {
                name: 'Doppler Motion Sensor',
                range: 300,
                scanSpeed: 0.08,
                color: '#FF4444',
                description: 'Optimized for tracking high-velocity targets.',
                render: this.renderDoppler
            },
            'RADAR_OMNI': {
                name: 'Omni-Directional Sphere',
                range: 200,
                scanSpeed: 0.1,
                color: '#00FFFF',
                description: 'Continuous 360-degree coverage bubble.',
                render: this.renderOmni
            },
            'RADAR_QUANTUM': {
                name: 'Quantum Entanglement Scanner',
                range: 600,
                scanSpeed: 0.06,
                color: '#E000FF',
                description: 'Uses quantum states for instant detection. Experimental.',
                render: this.renderQuantum
            },
            'RADAR_THERMAL': {
                name: 'Thermal Imaging Sensor',
                range: 300,
                scanSpeed: 0.05,
                color: '#FF8800',
                description: 'Detects heat signatures of engines and weapons.',
                render: this.renderThermal
            },
            'RADAR_AESA': {
                name: 'AESA Multi-Track',
                range: 500,
                scanSpeed: 0.07,
                color: '#44FF88',
                description: 'Active Electronically Scanned Array. Tracks multiple targets.',
                render: this.renderAESA
            },
            'RADAR_COMMAND': {
                name: 'Fleet Command Link',
                range: 1000,
                scanSpeed: 0.01,
                color: '#FFFFFF',
                description: 'Massive capital ship system for sector-wide coordination.',
                render: this.renderCommand
            }
        };
    }

    create(type) {
        const config = this.types[type];
        if (!config) {
            console.warn(`Radar type ${type} not found, using Standard.`);
            return this.create('RADAR_STANDARD');
        }

        return {
            type: type,
            ...config,
            angle: 0,
            active: true,
            update: function() {
                this.angle += this.scanSpeed;
                if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
            }
        };
    }

    // --- Rendering Methods (2.5D Realistic Style) ---

    renderStandard(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Base - Metallic
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rotating Dish
        ctx.rotate(this.angle);
        
        // Dish Structure
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(0, -8, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Arm
        ctx.fillStyle = '#555';
        ctx.fillRect(-2, -5, 4, 10);

        // Sweep Effect
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 100, -0.2, 0.2);
        ctx.lineTo(0, 0);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fill();

        ctx.restore();
    }

    renderLongRange(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Base - Rectangular Heavy
        ctx.fillStyle = '#334';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeStyle = '#556';
        ctx.strokeRect(-12, -12, 24, 24);

        // Antenna Array - Rotating
        ctx.rotate(this.angle);
        
        // Main Boom
        ctx.fillStyle = '#889';
        ctx.fillRect(-2, -20, 4, 40);

        // Cross Dipoles
        for(let i = -15; i <= 15; i += 10) {
            ctx.strokeStyle = '#0088FF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, i);
            ctx.lineTo(10, i);
            ctx.stroke();
        }

        // Pulse Emission
        ctx.beginPath();
        ctx.arc(0, 0, 120, this.angle - 0.1, this.angle + 0.1);
        ctx.strokeStyle = 'rgba(0, 136, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    renderRapid(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Base - Circular Fast
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // High Speed Spinner
        ctx.rotate(this.angle * 2); // Visual spin is faster
        
        ctx.fillStyle = '#FFDD00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5, -15);
        ctx.lineTo(5, -15);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5, 15);
        ctx.lineTo(5, 15);
        ctx.closePath();
        ctx.fill();

        // Blur effect
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 221, 0, 0.2)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
    }

    renderStealth(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Faceted Dome (Stealth look)
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(13, -7);
        ctx.lineTo(13, 7);
        ctx.lineTo(0, 15);
        ctx.lineTo(-13, 7);
        ctx.lineTo(-13, -7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#445';
        ctx.stroke();

        // Passive Sensor "Eye" - Non-rotating base, internal scan
        const scanOffset = Math.sin(this.angle * 2) * 10;
        ctx.fillStyle = '#111';
        ctx.fillRect(-10, -2, 20, 4);
        
        ctx.fillStyle = '#A0A0FF';
        ctx.beginPath();
        ctx.arc(scanOffset, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderDoppler(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Base
        ctx.fillStyle = '#422';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Horns
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(0, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#AA2222';
        ctx.beginPath();
        ctx.arc(0, 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Wavefronts
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -10, 20 + Math.sin(this.angle * 5) * 5, -0.5, 0.5); // Pulsing
        ctx.stroke();

        ctx.restore();
    }

    renderOmni(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Glowing Orb
        const pulse = 1 + Math.sin(this.angle * 4) * 0.1;
        
        const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 15);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, '#00FFFF');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Tech Rings
        ctx.rotate(this.angle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    renderQuantum(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Core
        ctx.fillStyle = '#200022';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Floating Cubes (Quantum Bits)
        const time = Date.now() * 0.002;
        for(let i = 0; i < 3; i++) {
            const angle = this.angle + (i * Math.PI * 2 / 3);
            const dist = 15 + Math.sin(time + i) * 3;
            const cx = Math.cos(angle) * dist;
            const cy = Math.sin(angle) * dist;
            
            ctx.fillStyle = '#E000FF';
            ctx.fillRect(cx - 3, cy - 3, 6, 6);
            
            // Connection lines
            ctx.strokeStyle = 'rgba(224, 0, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(cx, cy);
            ctx.stroke();
        }

        ctx.restore();
    }

    renderThermal(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Housing
        ctx.fillStyle = '#530';
        ctx.fillRect(-10, -10, 20, 20);

        // Lens
        ctx.rotate(this.angle);
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.arc(8, 0, 6, 0, Math.PI * 2); // Offset lens
        ctx.fill();
        
        // Reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(6, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Heat Haze Cone
        ctx.fillStyle = 'rgba(255, 136, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.arc(8, 0, 80, -0.3, 0.3);
        ctx.fill();

        ctx.restore();
    }

    renderAESA(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Hexagonal Plate
        ctx.fillStyle = '#344';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = Math.cos(angle) * 15;
            const py = Math.sin(angle) * 15;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#44FF88';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Modules (T/R Modules)
        ctx.fillStyle = '#0F0';
        // Grid of dots
        const rows = [-8, 0, 8];
        const cols = [-8, 0, 8];
        rows.forEach(r => {
            cols.forEach(c => {
                // Random activation
                if (Math.random() > 0.7) {
                    ctx.globalAlpha = 1;
                } else {
                    ctx.globalAlpha = 0.2;
                }
                ctx.fillRect(c - 1, r - 1, 2, 2);
            });
        });
        
        // Electronic Beam Steering (Visualized as lines)
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#44FF88';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const beamAngle = Math.sin(this.angle * 3) * 0.5; // Fast scanning
        ctx.lineTo(Math.cos(beamAngle) * 100, Math.sin(beamAngle) * 100);
        ctx.stroke();

        ctx.restore();
    }

    renderCommand(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Massive Structure
        ctx.fillStyle = '#DDD';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating Ring
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();

        // Satellites on ring
        for(let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#000';
            ctx.fillRect(23, -3, 6, 6);
        }

        // Central Hologram
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerRadarSystem;
} else {
    window.PlayerRadarSystem = PlayerRadarSystem;
}
