// ==================== ڕێکخستنەکان ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shopBtn = document.getElementById('shopBtn');

const GROUND_Y = 420;
const PLAYER = { x: 40, y: GROUND_Y - 60, w: 50, h: 60 };
const PATH = [
    { x: 760, y: 370 }, { x: 620, y: 370 }, { x: 620, y: 220 },
    { x: 380, y: 220 }, { x: 380, y: 370 }, { x: 120, y: 370 }
];

let enemies = [], towers = [];
let coins = 100, score = 0, wave = 1, enemySpawnTimer = 0, enemySpawnInterval = 90, gameOver = false;
let shopOpen = false;

// ==================== دوژمن ====================
class Enemy {
    constructor() {
        this.x = PATH[0].x; this.y = PATH[0].y;
        this.radius = 14; this.speed = 1.2 + wave * 0.15;
        this.hp = 30 + wave * 10; this.maxHp = this.hp;
        this.pathIndex = 0; this.alive = true;
    }
    update() {
        if (!this.alive) return;
        const target = PATH[this.pathIndex + 1];
        if (!target) { this.alive = false; gameOver = true; return; }
        const dx = target.x - this.x, dy = target.y - this.y, dist = Math.hypot(dx, dy);
        if (dist < 2) this.pathIndex++;
        else { this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed; }
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
        // باری خوێن
        const barW = 30, barH = 5, barX = this.x - barW / 2, barY = this.y - this.radius - 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : '#e67e22';
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }
    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) { this.alive = false; score += 20; coins += 15; }
    }
}

// ==================== تاوەر ====================
class Tower {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = 18; this.range = 180;
        this.cooldown = 0; this.damage = 15;
        this.attackSpeed = 30;
        this.color = '#3498db';
        this.arrowColor = '#f1c40f';
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
            const dx = e.x - this.x, dy = e.y - this.y;
            if (Math.hypot(dx, dy) < this.range) { target = e; break; }
        }
        if (target && this.cooldown === 0) {
            this.cooldown = this.attackSpeed;
            target.takeDamage(this.damage);
            ctx.strokeStyle = this.arrowColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.fillStyle = this.arrowColor;
            ctx.beginPath();
            ctx.arc(target.x, target.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ==================== کێشان ====================
function drawGround() {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a2a6c'); grad.addColorStop(0.5, '#4a90d9'); grad.addColorStop(1, '#87CEEB');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    ctx.fillStyle = '#2d5a1b';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.fillStyle = '#4c7a34';
    for (let i = 0; i < canvas.width; i += 30) ctx.fillRect(i, GROUND_Y + 4, 14, 4);
    ctx.shadowColor = '#b8860b';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5d4e37';
    ctx.fillRect(PLAYER.x - 10, PLAYER.y - 20, PLAYER.w + 20, PLAYER.h + 20);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(PLAYER.x + 8, PLAYER.y - 30, 12, 30);
    ctx.fillRect(PLAYER.x + 30, PLAYER.y - 30, 12, 30);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '22px Arial';
    ctx.fillText('🏰', PLAYER.x + 6, PLAYER.y - 8);
    ctx.shadowBlur = 0;
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
    if (coins >= 50) { towers.push(new Tower(x, y)); coins -= 50; }
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
    if (coins >= 50) { towers.push(new Tower(x, y)); coins -= 50; }
}, { passive: false });

// ==================== دوگمەی Shop ====================
shopBtn.addEventListener('click', () => {
    shopOpen = !shopOpen;
    if (shopOpen) {
        alert('🛒 Shop:\n1. Arrow Tower (50 coins) - Damage: 15\n2. Catapult (100 coins) - Damage: 30\n3. Fire Bow (150 coins) - Damage: 20 + Burn');
    }
});

// ==================== هێنانی دوژمن ====================
function spawnEnemy() { if (!gameOver) enemies.push(new Enemy()); }

// ==================== گەڕۆک ====================
function gameLoop() {
    if (!gameOver) {
        enemySpawnTimer++;
        const spawnRate = Math.max(20, enemySpawnInterval - wave * 2);
        if (enemySpawnTimer >= spawnRate) {
            enemySpawnTimer = 0;
            spawnEnemy();
            if (wave > 3 && Math.random() < 0.3) spawnEnemy();
        }
        for (const e of enemies) e.update();
        for (const t of towers) t.update();
        enemies = enemies.filter(e => e.alive);
        if (enemies.length === 0 && enemySpawnTimer > 30) {
            wave++;
            enemySpawnInterval = Math.max(30, enemySpawnInterval - 3);
        }
    }
    drawGround();
    for (const e of enemies) e.draw();
    for (const t of towers) t.draw();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '13px Arial';
    ctx.fillText('🔨 کلیک لەسەر زەوی بکە بۆ تاوەر (💰50)', 20, 130);
    requestAnimationFrame(gameLoop);
}

gameLoop();
// ==================== سیستمی کڕین ====================
let selectedWeapon = null; // چەکی هەڵبژێردراو

const weapons = {
    arrow: { name: 'Arrow Tower', cost: 50, damage: 15, range: 200, color: '#3498db' },
    catapult: { name: 'Catapult', cost: 100, damage: 30, range: 150, color: '#e67e22' },
    fire: { name: 'Fire Bow', cost: 150, damage: 20, range: 180, color: '#e74c3c' }
};

// گۆڕینی دوگمەی Shop بۆ کڕین
shopBtn.addEventListener('click', () => {
    const choice = prompt(
        '🛒 Shop:\n' +
        '1. Arrow Tower (50 coins) - Damage: 15\n' +
        '2. Catapult (100 coins) - Damage: 30\n' +
        '3. Fire Bow (150 coins) - Damage: 20 + Burn\n\n' +
        'ژمارەی چەکەکە بنووسە (1, 2, 3):'
    );
    
    if (choice === null) return; // هەڵوەشاندنەوە
    
    let weaponKey = null;
    let weaponCost = 0;
    
    if (choice === '1') { weaponKey = 'arrow'; weaponCost = weapons.arrow.cost; }
    else if (choice === '2') { weaponKey = 'catapult'; weaponCost = weapons.catapult.cost; }
    else if (choice === '3') { weaponKey = 'fire'; weaponCost = weapons.fire.cost; }
    else { alert('ژمارەی نادروست!'); return; }
    
    if (coins >= weaponCost) {
        coins -= weaponCost;
        selectedWeapon = weaponKey;
        alert(`${weapons[weaponKey].name} کڕدرا! ئێستا کلیک لەسەر زەوی بکە بۆ دانانی.`);
        // دوای کڕین، دەتوانیت تاوەرەکە دابنێیت
        canvas.style.cursor = 'crosshair';
    } else {
        alert('کۆینت بەس نییە!');
    }
});

// گۆڕینی سیستمی دانانی تاوەر بۆ کڕینی چەکی هەڵبژێردراو
canvas.addEventListener('click', (e) => {
    if (gameOver) { document.location.reload(); return; }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (y < GROUND_Y - 20 || y > GROUND_Y + 10) return;
    
    // ئەگەر چەکێک هەڵبژێردرابوو، بەکاری بهێنە
    if (selectedWeapon) {
        const weapon = weapons[selectedWeapon];
        // دروستکردنی تاوەر بە تایبەتمەندییەکانی چەکەکە
        const tower = new Tower(x, y);
        tower.damage = weapon.damage;
        tower.range = weapon.range;
        tower.color = weapon.color;
        towers.push(tower);
        selectedWeapon = null;
        canvas.style.cursor = 'default';
    } else if (coins >= 50) {
        // تاوەری بنەڕەت
        towers.push(new Tower(x, y));
        coins -= 50;
    }
});

// هەمان شت بۆ مۆبایل
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
        const weapon = weapons[selectedWeapon];
        const tower = new Tower(x, y);
        tower.damage = weapon.damage;
        tower.range = weapon.range;
        tower.color = weapon.color;
        towers.push(tower);
        selectedWeapon = null;
    } else if (coins >= 50) {
        towers.push(new Tower(x, y));
        coins -= 50;
    }
}, { passive: false });
