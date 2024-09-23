// Game setup
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;

// Game state
let money = 100;
let lives = 10;
let wave = 0;
let enemies = [];
let towers = [];
let projectiles = [];

// Path for enemies (now with multiple paths)
const paths = [
    [
        {x: 0, y: 100},
        {x: 700, y: 100},
        {x: 700, y: 500},
        {x: 800, y: 500}
    ],
    [
        {x: 0, y: 300},
        {x: 400, y: 300},
        {x: 400, y: 200},
        {x: 800, y: 200}
    ]
];

// Enemy class
class Enemy {
    constructor(pathIndex) {
        this.pathIndex = pathIndex;
        this.path = paths[pathIndex];
        this.x = this.path[0].x;
        this.y = this.path[0].y;
        this.health = 100;
        this.speed = 1;
        this.pathProgress = 0;
    }

    move() {
        this.pathProgress += this.speed;
        const totalLength = this.getPathLength();
        if (this.pathProgress >= totalLength) {
            lives--;
            return true;
        }

        let distanceTraveled = 0;
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const segmentLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            if (distanceTraveled + segmentLength > this.pathProgress) {
                const remainingDistance = this.pathProgress - distanceTraveled;
                const ratio = remainingDistance / segmentLength;
                this.x = start.x + (end.x - start.x) * ratio;
                this.y = start.y + (end.y - start.y) * ratio;
                break;
            }
            distanceTraveled += segmentLength;
        }
        return false;
    }

    getPathLength() {
        let length = 0;
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            length += Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        }
        return length;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Tower class
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 100;
        this.damage = 20;
        this.cooldown = 0;
        this.level = 1;
        this.health = 100;
    }

    draw() {
        ctx.fillStyle = this.health < 50 ? 'lightblue' : 'blue';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Lv${this.level}`, this.x - 10, this.y + 5);
    }

    shoot() {
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.range) {
                projectiles.push(new Projectile(this.x, this.y, enemy, this.damage));
                this.cooldown = 30;
                break;
            }
        }
    }

    upgrade() {
        if (money >= 50) {
            this.level++;
            this.range += 20;
            this.damage += 10;
            money -= 50;
        }
    }

    repair() {
        if (money >= 20 && this.health < 100) {
            this.health = Math.min(100, this.health + 20);
            money -= 20;
        }
    }
}

// Projectile class (unchanged)
class Projectile {
    constructor(x, y, target, damage) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = 5;
    }

    move() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.target.health -= this.damage;
            if (this.target.health <= 0) {
                enemies = enemies.filter(e => e !== this.target);
                money += 10;
            }
            return true;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        return false;
    }

    draw() {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paths
    ctx.strokeStyle = 'gray';
    paths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
    });

    // Move and draw enemies
    enemies.forEach((enemy, index) => {
        if (enemy.move()) {
            enemies.splice(index, 1);
        }
        enemy.draw();
    });

    // Tower actions
    towers.forEach(tower => {
        tower.draw();
        tower.shoot();
    });

    // Move and draw projectiles
    projectiles = projectiles.filter(p => !p.move());
    projectiles.forEach(p => p.draw());

    // Draw UI
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Money: $${money}  Lives: ${lives}  Wave: ${wave}`, 10, 30);

    // Check win/lose conditions
    if (lives <= 0) {
        ctx.fillStyle = 'red';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    if (enemies.length === 0) {
        wave++;
        for (let i = 0; i < wave * 5; i++) {
            setTimeout(() => enemies.push(new Enemy(Math.floor(Math.random() * paths.length))), i * 1000);
        }
    }

    requestAnimationFrame(gameLoop);
}

// Place tower on click
canvas.addEventListener('click', (e) => {
    const clickedTower = towers.find(t => 
        e.clientX >= t.x - 15 && e.clientX <= t.x + 15 &&
        e.clientY >= t.y - 15 && e.clientY <= t.y + 15
    );

    if (clickedTower) {
        // Upgrade or repair existing tower
        if (e.shiftKey) {
            clickedTower.repair();
        } else {
            clickedTower.upgrade();
        }
    } else if (money >= 50) {
        // Place new tower
        towers.push(new Tower(e.clientX, e.clientY));
        money -= 50;
    }
});

// Start game
gameLoop();

