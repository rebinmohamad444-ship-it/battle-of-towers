
// ==================== سیستمی کڕین ====================
let shopOpen = false;

function showShop() {
    shopOpen = !shopOpen;
    if (shopOpen) {
        // نیشاندانی پەنجەرەی کڕین (بە شێوەی سادە)
        alert('🛒 Shop:\n1. Arrow (50 coins) - Damage: 15\n2. Catapult (100 coins) - Damage: 30\n3. Fire Bow (150 coins) - Damage: 20 + Burn');
    }
}

// زیادکردنی دوگمەی کڕین بۆ یارییەکە
document.addEventListener('keydown', (e) => {
    if (e.key === 's' || e.key === 'S') {
        showShop();
    }
});

// زیادکردنی دوگمەی کڕین بۆ مۆبایل (لەسەر تەلەفۆن)
// دوگمەیەکی بینراو زیاد دەکەین
const shopBtn = document.createElement('button');
shopBtn.innerText = '🛒 Shop';
shopBtn.style.position = 'absolute';
shopBtn.style.bottom = '20px';
shopBtn.style.right = '20px';
shopBtn.style.padding = '10px 20px';
shopBtn.style.background = '#f1c40f';
shopBtn.style.border = 'none';
shopBtn.style.borderRadius = '8px';
shopBtn.style.fontSize = '18px';
shopBtn.style.zIndex = '10';
shopBtn.onclick = showShop;
document.body.appendChild(shopBtn);
