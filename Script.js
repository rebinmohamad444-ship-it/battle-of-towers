// ==================== ڕێکخستنەکان ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shopBtn = document.getElementById('shopBtn');

const GROUND_Y = 420;
const CASTLE = { x: 30, y: GROUND_Y - 100, w: 100, h: 100 };
const BRIDGE = { x: 680, y: GROUND_Y - 10, w: 100, h: 20 };

// ڕێڕەوی دوژمن (لە پردەوە بۆ قەڵا)
const PATH = [
    { x: 740, y: 370 },  // لە پردەوە
    { x: 620, y: 370 },
    { x: 620, y: 220 },
    { x: 380, y: 220 },
    { x: 380, y: 370 },
    { x: 140, y: 370 }   // لە قەڵا
];

// دۆخەکان
let enemies = [];
let towers = [];
let coins = 1000; // زۆر بۆ تاقیکردنەوە
let score = 0;
let wave = 1;
let enemySpawnTimer = 0;
let enemySpawnInterval = 70;
let gameOver = false;
let selectedWeapon = null;

// چەکەکان
const weapons = {
    arrow: { name: 'Arrow', cost: 50, damage: 20, range: 200, color: '#3498db' },
    catapult: { name: 'Catapult', cost: 100, damage: 40, range: 160, color: '#e67e22' },
    fire: { name: 'Fire Bow', cost: 150, damage: 30, range: 180, color: '#e74c3c' }
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
        // جەستە
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        // چاو
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y - 6, 2, 0, Math.PI * 2);
        ctx.fill();
        // باری خوێن
        const barW = 30, barH = 5;
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
        this.radius = 18;
        this.cooldown = 0;
        this.attackSpeed = 25;
        
        if (weaponType && weapons[weaponType]) {
            this.damage = weapons[weaponType].damage;
            this.range = weapons[weaponType].range;
            this.color = weapons[weaponType].color;
            this.name = weapons[weaponType].name;
        } else {
            this.damage = 20;
            this.range = 200;
            this.color = '#3498db';
            this.name = 'Arrow Tower';
        }
        this.arrowColor = '#f1c40f';
    }

    draw() {
        ctx.fillStyle = '#5d4e37';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 6, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        // ناو
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name || '', this.x, this.y + 30);
        ctx.textAlign = 'start';
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
            // تیر
            ctx.strokeStyle = this.arrowColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.fillStyle = this.arrowColor;
            ctx.beginPath();
            ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ==================== ماپ (Ground) ====================
function drawMap() {
    // ئاسمان
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a2a6c');
    grad.addColorStop(0.5, '#4a90d9');
    grad.addColorStop(1, '#87CEEB');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    // زەوی
    ctx.fillStyle = '#2d5a1b';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.fillStyle = '#4c7a34';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, GROUND_Y + 4, 14, 4);
    }

    // ڕێگا (ڕێڕەوی دوژمن)
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
    ctx.fillRect(BRIDGE.x, BRIDGE.y, BRIDGE.w, BRIDGE.h);
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < BRIDGE.w; i += 15) {
        ctx.fillRect(BRIDGE.x + i, BRIDGE.y - 3, 3, BRIDGE.h + 6);
    }
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(BRIDGE.x - 10, BRIDGE.y - 5, BRIDGE.w + 20, 5);

    // قەڵا
    ctx.fillStyle = '#5d4e37';
    ctx.fillRect(CASTLE.x - 10, CASTLE.y - 20, CASTLE.w + 20, CASTLE.h + 20);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(CASTLE.x, CASTLE.y, CASTLE.w, CASTLE.h);
    ctx.fillStyle = '#A0522D';
    // تاوەری قەڵا
    ctx.fillRect(CASTLE.x - 8, CASTLE.y - 30, 15, 30);
    ctx.fillRect(CASTLE.x + CASTLE.w - 7, CASTLE.y - 30, 15, 30);
    // دروازە
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(CASTLE.x + 35, CASTLE.y + 30, 30, 40);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '32px Arial';
    ctx.fillText('🏰', CASTLE.x + 15, CASTLE.y - 10);
    
    // سەرباز (یاریزان) لە نزیک قەڵا
    ctx.fillStyle = '#2ecc71';
    ctx.font = '24px Arial';
    ctx.fillText('👤', CASTLE.x + CASTLE.w + 20, CASTLE.y + 30);
}

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
        const weapon = weapons[selectedWeapon];
        const tower = new Tower(x, y, selectedWeapon);
        towers.push(tower);
        selectedWeapon = null;
        canvas.style.cursor = 'default';
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
        const tower = new Tower(x, y, selectedWeapon);
        towers.push(tower);
        selectedWeapon = null;
    } else if (coins >= 50) {
        towers.push(new Tower(x, y));
        coins -= 50;
    }
}, { passive: false });

// ==================== Shop ====================
shopBtn.addEventListener('click', () => {
    const choice = prompt(
        '🛒 SHOP:\n' +
        '1. Arrow Tower (50💰) - Damage: 20\n' +
        '2. Catapult (100💰) - Damage: 40\n' +
        '3. Fire Bow (150💰) - Damage: 30\n\n' +
        'ژمارەی چەکەکە بنووسە (1, 2, 3):'
    );
    
    if (choice === null) return;
    
    let weaponKey = null;
    let cost = 0;
    if (choice === '1') { weaponKey = 'arrow'; cost = weapons.arrow.cost; }
    else if (choice === '2') { weaponKey = 'catapult'; cost = weapons.catapult.cost; }
    else if (choice === '3') { weaponKey = 'fire'; cost = weapons.fire.cost; }
    else { alert('ژمارەی نادروست!'); return; }
    
    if (coins >= cost) {
        coins -= cost;
        selectedWeapon = weaponKey;
        alert(`${weapons[weaponKey].name} کڕدرا! کلیک لەسەر زەوی بکە بۆ دانانی.`);
        canvas.style.cursor = 'crosshair';
    } else {
        alert('کۆینت بەس نییە!');
    }
});

// ==================== یاری ====================
function spawnEnemy() {
    if (!gameOver) {
        enemies.push(new Enemy());
        // هەندێک جار دوو دانە
        if (wave > 2 && Math.random() < 0.3) enemies.push(new Enemy());
    }
}

function gameLoop() {
    if (!gameOver) {
        enemySpawnTimer++;
        const spawnRate = Math.max(20, enemySpawnInterval - wave * 2);
        if (enemySpawnTimer >= spawnRate) {
            enemySpawnTimer = 0;
            spawnEnemy();
        }
        for (const e of enemies) e.update();
        for (const t of towers) t.update();
        enemies = enemies.filter(e => e.alive);
        if (enemies.length === 0 && enemySpawnTimer > 30) {
            wave++;
            enemySpawnInterval = Math.max(30, enemySpawnInterval - 3);
        }
    }

    // کێشان
    drawMap();
    for (const e of enemies) e.draw();
    for (const t of towers) t.draw();

    // زانیاری
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`💰 ${coins}`, 20, 40);
    ctx.fillText(`⭐ ${score}`, 20, 70);
    ctx.fillText(`🌊 Wave ${wave}`, 20, 100);
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '13px Arial';
    ctx.fillText('🔨 کلیک لەسەر زەوی بکە بۆ تاوەر', 20, 130);

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
