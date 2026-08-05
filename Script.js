// ================================
// پڕۆژەی فری بۆ یارییەکە
// ================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shopBtn = document.getElementById('shopBtn');

const GROUND_Y = 420;
const CASTLE = { x: 20, y: GROUND_Y - 90, w: 70, h: 90 };

// ڕێڕەوی دوژمن
const PATH = [
    { x: 750, y: 370 },
    { x: 600, y: 370 },
    { x: 600, y: 200 },
    { x: 350, y: 200 },
    { x: 350, y: 370 },
    { x: 100, y: 370 }
];

// دۆخەکان
let enemies = [];
let towers = [];
let arrows = [];
let coins = 1000;
let score = 0;
let wave = 1;
let enemySpawnTimer = 0;
let enemySpawnInterval = 60;
let gameOver = false;
let selectedWeapon = null;

// ==================== یاریزان ====================
const player = {
    x: 50,
    y: GROUND_Y - 40,
    w: 30,
    h: 40,
    attackCooldown: 0,
    attackSpeed: 20,
    damage: 25,
    range: 250,
    color: '#2ecc71'
};

// ==================== دوژمن ====================
class Enemy {
    constructor() {
        this.x = PATH[0].x;
        this.y = PATH[0].y;
        this.radius = 14;
        this.speed = 1.0 + wave * 0.1;
        this.hp = 30 + wave * 8;
        this.maxHp = this.hp;
        this.pathIndex = 0;
        this.alive = true;
    }

    update() {
        if (!this.alive) return;
        const target = PATH[this.pathIndex + 1];
        if (!target) {
            this.alive = false;
            gameOver = true;
            return;
        }
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2) {
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        if (!this.alive) return;
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        const barW = 30,
            barH = 5;
        const barX = this.x - barW / 2;
        const barY = this.y - this.radius - 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : '#e67e22';
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.alive = false;
            score += 20;
            coins += 20;
        }
    }
}

// ==================== تاوەر ====================
class Tower {
    constructor(x, y, weaponType = null) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.cooldown = 0;
        this.attackSpeed = 25;
        this.damage = 20;
        this.range = 200;
        this.color = '#3498db';
        this.name = 'Arrow';

        if (weaponType) {
            if (weaponType === 'catapult') {
                this.damage = 40;
                this.range = 160;
                this.color = '#e67e22';
                this.name = 'Catapult';
            } else if (weaponType === 'fire') {
                this.damage = 30;
                this.range = 180;
                this.color = '#e74c3c';
                this.name = 'Fire';
            }
        }
    }

    draw() {
        ctx.fillStyle = '#5d4e37';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
        let target = null;
        for (const e of enemies) {
            if (!e.alive) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            if (Math.hypot(dx, dy) < this.range) {
                target = e;
                break;
            }
        }
        if (target && this.cooldown === 0) {
            this.cooldown = this.attackSpeed;
            target.takeDamage(this.damage);
            arrows.push({ x: this.x, y: this.y, tx: target.x, ty: target.y, life: 20 });
        }
    }
}

// ==================== یاریزان (حەرەس) ====================
function updatePlayer() {
    if (player.attackCooldown > 0) player.attackCooldown--;

    // گەڕان بۆ دوژمن
    let target = null;
    for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (Math.hypot(dx, dy) < player.range) {
            target = e;
            break;
        }
    }

    if (target && player.attackCooldown === 0) {
        player.attackCooldown = player.attackSpeed;
        target.takeDamage(player.damage);
        arrows.push({ x: player.x, y: player.y - 10, tx: target.x, ty: target.y, life: 20 });
    }
}

function drawPlayer() {
    ctx.fillStyle = '#2ecc71';
    ctx.font = '32px Arial';
    ctx.fillText('🏹', player.x - 10, player.y - 10);
}

// ==================== ماپ ====================
function drawMap() {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0f0c29');
    grad.addColorStop(0.5, '#302b63');
    grad.addColorStop(1, '#24243e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    ctx.fillStyle = '#2d5a1b';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.fillStyle = '#4c7a34';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, GROUND_Y + 4, 14, 4);
    }

    // ڕێگا
    ctx.shadowColor = '#b8860b';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // پرد
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(700, GROUND_Y - 8, 100, 16);
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < 100; i += 12) {
        ctx.fillRect(700 + i, GROUND_Y - 12, 3, 20);
    }

    // قەڵا
    ctx.fillStyle = '#5d4e37';
    ctx.fillRect(CASTLE.x - 8, CASTLE.y - 15, CASTLE.w + 16, CASTLE.h + 15);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(CASTLE.x, CASTLE.y, CASTLE.w, CASTLE.h);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(CASTLE.x - 6, CASTLE.y - 25, 12, 25);
    ctx.fillRect(CASTLE.x + CASTLE.w - 6, CASTLE.y - 25, 12, 25);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(CASTLE.x + 20, CASTLE.y + 30, 30, 30);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '28px Arial';
    ctx.fillText('🏰', CASTLE.x + 8, CASTLE.y - 8);
}

// ==================== Shop ====================
shopBtn.addEventListener('click', () => {
    const choice = prompt(
        '🛒 SHOP:\n' +
        '1. Arrow Tower (50💰) - Damage: 20\n' +
        '2. Catapult (100💰) - Damage: 40\n' +
        '3. Fire Bow (150💰) - Damage: 30\n\n' +
        'ژمارە بنووسە (1, 2, 3):'
    );
    if (choice === null) return;
    let weaponType = null;
    let cost = 0;
    if (choice === '1') { weaponType = 'arrow';
        cost = 50; } else if (choice === '2') { weaponType = 'catapult';
        cost = 100; } else if (choice === '3') { weaponType = 'fire';
        cost = 150; } else { alert('هەڵە!'); return; }
    if (coins >= cost) {
        coins -= cost;
        selectedWeapon = weaponType;
        alert('کڕدرا! کلیک لەسەر زەوی بکە بۆ دانانی.');
    } else {
        alert('کۆینت بەس نییە!');
    }
});

// ==================== کارلێک ====================
canvas.addEventListener('click', (e) => {
    if (gameOver) { document.location.reload(); return; }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    if (y < GROUND_Y - 20 || y > GROUND_Y + 10) return;
    if (selectedWeapon) {
        towers.push(new Tower(x, y, selectedWeapon));
        selectedWeapon = null;
    } else if (coins >= 50) {
        towers.push(new Tower(x, y));
        coins -= 50;
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) { document.location.reload(); return; }
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    if (y < GROUND_Y - 20 || y > GROUND_Y + 10) return;
    if (selectedWeapon) {
        towers.push(new Tower(x, y, selectedWeapon));
        selectedWeapon = null;
    } else if (coins >= 50) {
        towers.push(new Tower(x, y));
        coins -= 50;
    }
}, { passive: false });

// ==================== هێنانی دوژمن ====================
function spawnEnemy() {
    if (!gameOver) {
        enemies.push(new Enemy());
        if (wave > 2 && Math.random() < 0.3) enemies.push(new Enemy());
    }
}

// ==================== گەڕۆک ====================
function gameLoop() {
    if (!gameOver) {
        enemySpawnTimer++;
        const spawnRate = Math.max(20, enemySpawnInterval - wave * 3);
        if (enemySpawnTimer >= spawnRate) {
            enemySpawnTimer = 0;
            spawnEnemy();
        }

        for (const e of enemies) e.update();
        for (const t of towers) t.update();
        updatePlayer();

        enemies = enemies.filter(e => e.alive);
        arrows = arrows.filter(a => a.life > 0);

        if (enemies.length === 0 && enemySpawnTimer > 30) {
            wave++;
            enemySpawnInterval = Math.max(30, enemySpawnInterval - 3);
        }
    }

    drawMap();
    for (const e of enemies) e.draw();
    for (const t of towers) t.draw();
    drawPlayer();

    // تیرەکان
    for (const a of arrows) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.tx, a.ty);
        ctx.stroke();
        a.life--;
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`💰 ${coins}`, 20, 40);
    ctx.fillText(`⭐ ${score}`, 20, 70);
    ctx.fillText(`🌊 Wave ${wave}`, 20, 100);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💀 GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '22px Arial';
        ctx.fillText('کلیک بکە بۆ دەستپێکردنەوە', canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = 'start';
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
