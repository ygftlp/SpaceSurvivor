
// Weapon Strategies
// Each strategy implements: update(enemy, dt)

export const WeaponStrategies = {
    // None: Just a body collision enemy
    NONE: {
        update: (enemy, dt) => {
            // Do nothing
        }
    },

    // Standard Gun: Fires straight down
    PEA_SHOOTER: {
        update: (enemy, dt) => {
            enemy.fireTimer = (enemy.fireTimer || 0) - dt;
            if (enemy.fireTimer <= 0) {
                // Fire
                if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                    const cfg = enemy.config.weaponConfig || {};
                    const speed = cfg.speed || 300;
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                }
                enemy.fireTimer = enemy.fireRate || 2.0; // Reset
            }
        }
    },

    // Spread: Three bullets fan out
    SPREAD: {
        update: (enemy, dt) => {
            enemy.fireTimer = (enemy.fireTimer || 0) - dt;
            if (enemy.fireTimer <= 0) {
                if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                    const cfg = enemy.config.weaponConfig || {};
                    const speed = cfg.speed || 300;
                    
                    // Center
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                    // Left
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, -15, speed, cfg); // Use degrees if Bullet uses degrees? Bullet uses degrees.
                    // Right
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 15, speed, cfg);
                }
                enemy.fireTimer = enemy.fireRate || 3.0;
            }
        }
    },

    // Rapid: Fast low damage shots
    RAPID: {
        update: (enemy, dt) => {
            enemy.fireTimer = (enemy.fireTimer || 0) - dt;
            if (enemy.fireTimer <= 0) {
                if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                    const cfg = enemy.config.weaponConfig || {};
                    const speed = (cfg.speed || 300) * 1.2;
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                }
                enemy.fireTimer = 0.5; // Fast
            }
        }
    },

    // Sniper: Fast bullet, slow rate
    SNIPER: {
        update: (enemy, dt) => {
             enemy.fireTimer = (enemy.fireTimer || 0) - dt;
             if (enemy.fireTimer <= 0) {
                 if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                     const cfg = enemy.config.weaponConfig || {};
                     const speed = (cfg.speed || 300) * 2.0;
                     enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                 }
                 enemy.fireTimer = 4.0; // Slow
             }
        }
    },

    // Procedural: The Ultimate Weapon Generator
    // Reads enemy.config.weaponConfig to determine attack pattern
    PROCEDURAL: {
        update: (enemy, dt) => {
            const cfg = enemy.config.weaponConfig || {};
            enemy.fireTimer = (enemy.fireTimer || 0) - dt;
            
            if (enemy.fireTimer <= 0) {
                if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                    const speed = cfg.speed || 300;
                    
                    // Pattern Logic
                    switch (cfg.pattern) {
                        case 'SPREAD':
                            // N-way spread
                            const count = cfg.count || 3;
                            const spread = cfg.spread || 30; // Degrees
                            const startAngle = -spread / 2;
                            const step = spread / (count - 1 || 1);
                            
                            for (let i = 0; i < count; i++) {
                                const angle = startAngle + step * i;
                                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, angle, speed, cfg);
                            }
                            break;
                            
                        case 'RING':
                            // 360 burst
                            const rCount = cfg.count || 8;
                            for (let i = 0; i < rCount; i++) {
                                const angle = (360 / rCount) * i;
                                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, angle, speed, cfg);
                            }
                            break;
                            
                        case 'SPIRAL_EMITTER':
                            // Rotating stream
                            enemy.weaponAngle = (enemy.weaponAngle || 0) + (cfg.spinSpeed || 10);
                            enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, enemy.weaponAngle, speed, cfg);
                            // Fire very fast for spiral
                            enemy.fireTimer = 0.1; 
                            return; // Override timer reset
                            
                        case 'V_SHAPE':
                            // Backwards V
                            const vCount = 2;
                            enemy.scene.spawnEnemyBullet(enemy.x - 20, enemy.y, 0, speed, cfg);
                            enemy.scene.spawnEnemyBullet(enemy.x + 20, enemy.y, 0, speed, cfg);
                            break;
                            
                        case 'CROSS':
                            // + Shape (0, 90, 180, 270)
                            const cCount = 4;
                            const baseAngle = (enemy.weaponAngle || 0); // Can rotate
                            enemy.weaponAngle = baseAngle + (cfg.spinSpeed || 0);
                            
                            for (let i = 0; i < cCount; i++) {
                                const angle = baseAngle + (90 * i);
                                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, angle, speed, cfg);
                            }
                            break;

                        case 'WAVE':
                            // Sine wave offset position
                            const wPhase = (Date.now() / 500) * (cfg.spinSpeed || 5);
                            const wOffset = Math.sin(wPhase) * (cfg.spread || 20);
                            enemy.scene.spawnEnemyBullet(enemy.x + wOffset, enemy.y + enemy.height/2, 0, speed, cfg);
                            enemy.fireTimer = 0.15; // Fast fire
                            return;

                        case 'TORNADO':
                            // Two spiraling streams in opposite directions
                            enemy.weaponAngle = (enemy.weaponAngle || 0) + (cfg.spinSpeed || 5);
                            enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, enemy.weaponAngle, speed, cfg);
                            enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, -enemy.weaponAngle, speed, cfg);
                            enemy.fireTimer = 0.1;
                            return;

                        case 'TARGETED_SPREAD':
                            // Fires towards player (if scene provides player info) but we simulate it with simple tracking or just random if no player
                            // For now, assume simple spread but focused
                            const tCount = cfg.count || 3;
                            const tSpread = 15; // Tight spread
                            const tStart = -tSpread / 2;
                            const tStep = tSpread / (tCount - 1 || 1);
                            
                            for (let i = 0; i < tCount; i++) {
                                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, tStart + tStep * i, speed, cfg);
                            }
                            break;

                        case 'RANDOM':
                            // Shotgun spray
                            const rndCount = cfg.count || 5;
                            for (let i = 0; i < rndCount; i++) {
                                const angle = (Math.random() - 0.5) * (cfg.spread || 45);
                                const spdVar = speed * (0.8 + Math.random() * 0.4);
                                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height/2, angle, spdVar, cfg);
                            }
                            break;

                        case 'STRAIGHT':
                        default:
                            enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                            break;
                    }
                }
                enemy.fireTimer = enemy.fireRate || cfg.rate || 2.0;
            }
        }
    }
};
