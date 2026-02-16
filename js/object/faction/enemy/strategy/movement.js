
// Movement Strategies
// Each strategy implements: update(enemy, dt)

export const MovementStrategies = {
    // Linear: Moves straight down (with optional slight angle)
    LINEAR: {
        update: (enemy, dt) => {
            enemy.y += enemy.speed * dt;
            // X drift if specified
            if (enemy.driftX) {
                enemy.x += enemy.driftX * dt;
            }
        }
    },

    // Sine: Moves down in a wave pattern
    SINE: {
        update: (enemy, dt) => {
            enemy.y += enemy.speed * dt;

            // Calculate wave
            enemy.flightTime = (enemy.flightTime || 0) + dt;
            const amplitude = enemy.amplitude || 100;
            const frequency = enemy.frequency || 2;

            // x = centerX + sin(t) * amp
            if (!enemy.centerX) enemy.centerX = enemy.x;
            enemy.x = enemy.centerX + Math.sin(enemy.flightTime * frequency) * amplitude;
        }
    },

    // Zigzag: stable side-to-side motion while descending.
    ZIGZAG: {
        update: (enemy, dt) => {
            enemy.y += enemy.speed * dt;
            enemy.flightTime = (enemy.flightTime || 0) + dt;
            const amplitude = enemy.amplitude || 90;
            const frequency = enemy.frequency || 3.4;
            if (!enemy.centerX) enemy.centerX = enemy.x;
            enemy.x = enemy.centerX + Math.sin(enemy.flightTime * frequency) * amplitude;
        }
    },

    // Tracker: Slowly rotates towards player
    TRACKER: {
        update: (enemy, dt) => {
            // Move forward
            enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
            enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;

            // Target Player
            if (enemy.target) {
                const dx = enemy.target.x - enemy.x;
                const dy = enemy.target.y - enemy.y;
                const targetAngle = Math.atan2(dy, dx); // Radians

                // Lerp angle
                let diff = targetAngle - enemy.angle;
                // Normalize diff
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;

                const turnSpeed = 2.0; // Rads per sec
                // Apply rotation
                if (Math.abs(diff) < turnSpeed * dt) {
                    enemy.angle = targetAngle;
                } else {
                    enemy.angle += Math.sign(diff) * turnSpeed * dt;
                }
            } else {
                enemy.angle = Math.PI / 2;
            }
        }
    },

    // Procedural: The Ultimate Strategy Generator
    // Reads enemy.config.movementConfig to determine complex behavior
    PROCEDURAL: {
        update: (enemy, dt) => {
            const cfg = enemy.config.movementConfig || {};
            const t = (enemy.time || 0);

            // Base Vertical Movement
            let dy = enemy.speed * dt;
            let dx = 0;

            // Pattern Logic
            switch (cfg.pattern) {
                case 'SINE':
                    // Sinusoidal X
                    const amp = cfg.radius || 100;
                    const freq = cfg.speedX || 2;
                    if (!enemy.centerX) enemy.centerX = enemy.x;
                    enemy.x = enemy.centerX + Math.sin(t * freq + (cfg.phase || 0)) * amp;
                    break;

                case 'ZIGZAG':
                    // Linear bouncing X
                    const zSpeed = cfg.speedX || 100;
                    const zWidth = cfg.radius || 150;
                    if (!enemy.centerX) enemy.centerX = enemy.x;
                    // Triangle wave approximation
                    const p = (t * zSpeed) % (zWidth * 4);
                    let offset = 0;
                    if (p < zWidth) offset = p;
                    else if (p < zWidth * 3) offset = zWidth * 2 - p;
                    else offset = p - zWidth * 4;
                    enemy.x = enemy.centerX + offset;
                    break;

                case 'SPIRAL':
                    // Circular motion + Drop
                    const r = cfg.radius || 100;
                    const w = cfg.speedX || 2;
                    if (!enemy.centerX) enemy.centerX = enemy.x; // Lock center X
                    // Spiral center moves down
                    enemy.centerY = (enemy.centerY || enemy.y) + dy;
                    
                    enemy.x = enemy.centerX + Math.cos(t * w) * r;
                    enemy.y = enemy.centerY + Math.sin(t * w) * r;
                    return; // Override standard y update

                case 'SWOOP':
                    // Fast entry, slow down, then exit
                    // Speed curve
                    if (t < 1.0) dy *= 2.0; // Fast in
                    else if (t < 3.0) dy *= 0.2; // Hover/Slow
                    else dy *= 1.5; // Fast out
                    
                    // Side sway
                    if (!enemy.centerX) enemy.centerX = enemy.x;
                    enemy.x = enemy.centerX + Math.sin(t) * 50;
                    break;
                
                case 'NOISE':
                    // Perlin-ish random walk
                    if (!enemy.noiseOffset) enemy.noiseOffset = Math.random() * 1000;
                    const n = Math.sin(t * 2 + enemy.noiseOffset) + Math.sin(t * 5 + enemy.noiseOffset * 2) * 0.5;
                    dx = n * (cfg.speedX || 50) * dt;
                    break;

                case 'LINEAR':
                default:
                    dx = (cfg.drift || 0) * dt;
                    break;
            }

            // Apply calculated deltas
            enemy.y += dy;
            enemy.x += dx;
        }
    },

    // MOTHERSHIP_HUNTER: 专门追踪母舰的自杀式攻击
    MOTHERSHIP_HUNTER: {
        update: (enemy, dt) => {
            // 获取母舰位置
            const mothership = enemy.scene.mothership;
            if (!mothership || !mothership.isAlive) {
                // 母舰已毁，转为普通直线移动
                enemy.y += enemy.speed * dt;
                return;
            }

            // 计算到母舰的方向
            const dx = mothership.x - enemy.x;
            const dy = mothership.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // 归一化并移动
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
                
                // 更新旋转角度（面向母舰）
                enemy.rotation = Math.atan2(dy, dx) + Math.PI / 2;
            }

            // 检测与母舰碰撞
            const collisionDist = (enemy.width + mothership.width) / 2.5;
            if (dist < collisionDist) {
                // 撞击母舰！
                mothership.takeDamage(enemy.damage * 2); // 撞击造成双倍伤害
                enemy.active = false; // 敌人自毁
                
                // 播放撞击特效
                if (enemy.scene.effectManager) {
                    enemy.scene.effectManager.spawnExplosion(enemy.x, enemy.y, 'medium');
                }
            }
        }
    }
};
