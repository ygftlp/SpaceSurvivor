/**
 * Equipment Factory
 * Generates equipment items for fighters.
 */
export default class EquipmentFactory {
    /**
     * Create an equipment item by ID
     * @param {String} id Equipment ID
     */
    static create(id) {
        switch (id) {
            case 'engine_mk2':
                return {
                    id: 'engine_mk2',
                    name: 'Turbofan Engine MkII',
                    type: 'engine',
                    stats: { speed: 15, hp: 0, damage: 0 },
                    description: 'Enhanced thrust for higher speed.',
                    render: null // Internal upgrade
                };
            
            case 'armor_plate':
                return {
                    id: 'armor_plate',
                    name: 'Titanium Armor Plating',
                    type: 'armor',
                    stats: { speed: -5, hp: 50, damage: 0 },
                    description: 'Heavy armor to withstand more damage.',
                    render: null // Internal
                };

            case 'radar_aesa':
                return {
                    id: 'radar_aesa',
                    name: 'AESA Radar Upgrade',
                    type: 'radar',
                    stats: { speed: 0, hp: 0, damage: 5 }, // Better aim = more effective damage
                    description: 'Active Electronically Scanned Array radar.',
                    render: null
                };

            case 'missile_aim120':
                return {
                    id: 'missile_aim120',
                    name: 'AIM-120 AMRAAM',
                    type: 'weapon',
                    stats: { speed: -2, hp: 0, damage: 20 },
                    description: 'Medium-range air-to-air missile.',
                    render: (ctx, fighter) => {
                        // Use Hardpoints if available
                        const hardpoints = fighter.hardpoints || [
                             {x: -50, y: 20}, {x: 50, y: 20} // Fallback
                        ];
                        
                        ctx.fillStyle = '#E5E7E9'; // Missile Body
                        ctx.strokeStyle = '#283747';
                        ctx.lineWidth = 1;

                        // Function to draw a single missile
                        const drawMissile = (x, y) => {
                            ctx.save();
                            ctx.translate(x, y);
                            
                            // Pylon (Connector)
                            ctx.fillStyle = '#555';
                            ctx.fillRect(-2, -5, 4, 10);

                            // Missile Body
                            ctx.fillStyle = '#E5E7E9';
                            ctx.beginPath();
                            ctx.moveTo(0, -25); // Longer nose
                            ctx.lineTo(3, -15);
                            ctx.lineTo(3, 15);
                            ctx.lineTo(-3, 15);
                            ctx.lineTo(-3, -15);
                            ctx.fill();
                            ctx.stroke();
                            
                            // Fins (Dark Grey)
                            ctx.fillStyle = '#2C3E50';
                            // Tail fins
                            ctx.fillRect(-6, 10, 12, 3);
                            // Canards/Mid fins
                            ctx.fillRect(-5, -5, 10, 2); 
                            
                            // Warhead band (Yellow/Brown)
                            ctx.fillStyle = '#F1C40F';
                            ctx.fillRect(-3, -12, 6, 2);

                            ctx.restore();
                        };

                        // Render on all compatible hardpoints
                        hardpoints.forEach(hp => {
                            // Only render on wingtips or pylons for missiles
                            if (!hp.type || hp.type === 'wingtip' || hp.type === 'pylon') {
                                drawMissile(hp.x, hp.y);
                            }
                        });
                    }
                };

            case 'stealth_coating':
                return {
                    id: 'stealth_coating',
                    name: 'RAM Stealth Coating',
                    type: 'skin',
                    stats: { speed: 0, hp: 10, damage: 0 },
                    description: 'Reduces radar cross-section.',
                    render: (ctx, fighter) => {
                        ctx.save();
                        // Overlay a subtle dark shimmer
                        ctx.globalCompositeOperation = 'source-atop';
                        ctx.fillStyle = 'rgba(20, 20, 30, 0.4)';
                        ctx.fillRect(-100, -150, 200, 300);
                        ctx.restore();
                    }
                };

            case 'missile_sidewinder':
                return {
                    id: 'missile_sidewinder',
                    name: 'AIM-9X Sidewinder',
                    type: 'weapon',
                    stats: { speed: 0, hp: 0, damage: 15 },
                    description: 'Short-range heat-seeking missile.',
                    render: (ctx, fighter) => {
                        const hardpoints = fighter.hardpoints || [];
                        
                        const drawSidewinder = (x, y) => {
                            ctx.save();
                            ctx.translate(x, y);
                            // Slim body
                            ctx.fillStyle = '#D6DBDF';
                            ctx.fillRect(-2, -20, 4, 40);
                            // Nose (Seeker)
                            ctx.fillStyle = '#2C3E50';
                            ctx.beginPath(); ctx.arc(0, -20, 2, 0, Math.PI*2); ctx.fill();
                            // Tail Fins
                            ctx.fillStyle = '#7B7D7D';
                            ctx.fillRect(-6, 15, 12, 4);
                            // Front Fins
                            ctx.fillRect(-4, -15, 8, 3);
                            ctx.restore();
                        };

                        hardpoints.forEach(hp => {
                            // Sidewinders prefer wingtips
                            if (hp.type === 'wingtip' || hp.type === 'pylon') {
                                drawSidewinder(hp.x, hp.y);
                            }
                        });
                    }
                };

            case 'engine_afterburner':
                return {
                    id: 'engine_afterburner',
                    name: 'Afterburner Kit',
                    type: 'engine',
                    stats: { speed: 25, hp: 0, damage: 0 },
                    description: 'Maximum thrust output.',
                    thrustColor: '#FF4500', // Red/Orange Heat
                    render: null 
                };
            
            case 'engine_ion':
                return {
                    id: 'engine_ion',
                    name: 'Ion Thruster',
                    type: 'engine',
                    stats: { speed: 10, hp: 0, damage: 0 },
                    description: 'High efficiency, blue trail.',
                    thrustColor: '#0000FF', // Deep Blue
                    render: null
                };

            case 'skin_camo_jungle':
                return {
                    id: 'skin_camo_jungle',
                    name: 'Jungle Camo',
                    type: 'skin',
                    stats: { speed: 0, hp: 20, damage: 0 },
                    description: 'Forest camouflage pattern.',
                    render: (ctx, fighter) => {
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-atop';
                        
                        // Green tint base
                        ctx.fillStyle = 'rgba(50, 100, 50, 0.3)';
                        ctx.fillRect(-100, -150, 200, 300);

                        // Random blobs (Deterministic for same frame?)
                        // We can't use random in render loop easily or it flickers.
                        // We'll use a simple pattern based on coordinates
                        ctx.fillStyle = 'rgba(20, 60, 20, 0.5)';
                        for(let i=0; i<10; i++) {
                            ctx.beginPath();
                            ctx.arc(Math.sin(i)*50, Math.cos(i)*80, 20, 0, Math.PI*2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }
                };
            
            case 'skin_gold_elite':
                return {
                    id: 'skin_gold_elite',
                    name: 'Elite Gold Plating',
                    type: 'skin',
                    stats: { speed: -2, hp: 100, damage: 0 },
                    description: 'Heavy gold plating for prestige and protection.',
                    render: (ctx, fighter) => {
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-atop';
                        // Gold overlay
                        const grad = ctx.createLinearGradient(-50, -50, 50, 50);
                        grad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
                        grad.addColorStop(0.5, 'rgba(255, 255, 200, 0.6)');
                        grad.addColorStop(1, 'rgba(218, 165, 32, 0.4)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(-100, -150, 200, 300);
                        ctx.restore();
                    }
                };

            case 'skin_arctic':
                return {
                    id: 'skin_arctic',
                    name: 'Arctic Camo',
                    type: 'skin',
                    stats: { speed: 0, hp: 10, damage: 0 },
                    description: 'Winter camouflage.',
                    render: (ctx, fighter) => {
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-atop';
                        ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
                        ctx.fillRect(-100, -150, 200, 300);
                        // Ice shards (Deterministic pattern)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        const shards = [
                            {x: -40, y: -80}, {x: 20, y: -50}, {x: -10, y: 10}, 
                            {x: 50, y: 60}, {x: -60, y: 40}, {x: 30, y: -20},
                            {x: 0, y: -100}, {x: -30, y: 90}, {x: 40, y: 0}
                        ];
                        shards.forEach((s, i) => {
                            ctx.beginPath();
                            ctx.moveTo(s.x, s.y);
                            ctx.lineTo(s.x + (i%2 ? 20 : -10), s.y + 30);
                            ctx.lineTo(s.x + (i%3 ? -15 : 25), s.y + 15);
                            ctx.fill();
                        });
                        ctx.restore();
                    }
                };

            case 'skin_digital_desert':
                return {
                    id: 'skin_digital_desert',
                    name: 'Digital Desert',
                    type: 'skin',
                    stats: { speed: 0, hp: 15, damage: 0 },
                    description: 'Desert terrain camouflage.',
                    render: (ctx, fighter) => {
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-atop';
                        ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
                        ctx.fillRect(-100, -150, 200, 300);
                        // Digital blocks (Deterministic)
                        ctx.fillStyle = 'rgba(160, 82, 45, 0.5)';
                        // Use a fixed set of blocks based on a grid
                        for(let x=-80; x<=80; x+=20) {
                            for(let y=-120; y<=120; y+=20) {
                                // Pseudo-random based on position
                                if (Math.abs(Math.sin(x*y)) > 0.7) {
                                    ctx.fillRect(x, y, 15, 15);
                                }
                            }
                        }
                        ctx.restore();
                    }
                };

            case 'engine_plasma':
                return {
                    id: 'engine_plasma',
                    name: 'Plasma Thruster',
                    type: 'engine',
                    stats: { speed: 30, hp: 0, damage: 5 },
                    description: 'Experimental high-energy thrust.',
                    thrustColor: '#9B59B6', // Purple
                    render: null
                };

            case 'weapon_meteor':
                return {
                    id: 'weapon_meteor',
                    name: 'Meteor BVRAAM',
                    type: 'weapon',
                    stats: { speed: -1, hp: 0, damage: 25 },
                    description: 'Long range ramjet missile.',
                    render: (ctx, fighter) => {
                        const hardpoints = fighter.hardpoints || [];
                        const drawMeteor = (x, y) => {
                            ctx.save();
                            ctx.translate(x, y);
                            // Body
                            ctx.fillStyle = '#BDC3C7';
                            ctx.fillRect(-3, -25, 6, 50);
                            // Intakes
                            ctx.fillStyle = '#2C3E50';
                            ctx.fillRect(-4, 5, 2, 10);
                            ctx.fillRect(2, 5, 2, 10);
                            // Fins
                            ctx.fillStyle = '#2C3E50';
                            ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(-3, -15); ctx.lineTo(3, -15); ctx.fill();
                            ctx.fillRect(-6, 15, 12, 5);
                            ctx.restore();
                        };
                        hardpoints.forEach(hp => {
                            if (hp.type === 'pylon') drawMeteor(hp.x, hp.y);
                        });
                    }
                };

            default:
                console.warn(`Equipment ID '${id}' not found.`);
                return null;
        }
    }
}