// Basic open/close functionality
const shopPane = document.getElementById('shopPane');
const closeShopBtn = document.getElementById('closeShopPane');

// Open when the shop link is clicked
document.getElementById('shoplink')?.addEventListener('click', () => {
  shopPane.classList.add('open');
  shopPane.setAttribute('aria-hidden', 'false');
  shopPane.style.pointerEvents = 'auto';
  shopPane.style.zIndex = '1000';
});

// Close on button or ESC
function closeShopPane() {
  shopPane.classList.remove('open');
  shopPane.setAttribute('aria-hidden', 'true');
  shopPane.style.pointerEvents = 'none';
  shopPane.style.zIndex = '-1';
}

closeShopBtn.addEventListener('click', closeShopPane);
window.addEventListener('keydown', (e) => { 
  if (e.key === 'Escape') closeShopPane(); 
});

// Populate shop items (this could later be replaced with dynamic data)
const shopItems = [
  { name: 'T-Shirt 1', price: '$25.00', image: './assets/shop/tshirt1.png' },
  { name: 'Hoodie', price: '$45.00', image: './assets/shop/hoodie1.png' },
  { name: 'Cap', price: '$20.00', image: './assets/shop/cap1.png' },
  { name: 'Sticker Pack', price: '$10.00', image: './assets/shop/stickerpack1.png' },
  { name: 'Poster', price: '$15.00', image: './assets/shop/poster1.png' },
  { name: 'Mug', price: '$12.00', image: './assets/shop/mug1.png' },
  { name: 'Pin Set', price: '$8.00', image: './assets/shop/pin1.png' },
  { name: 'Tote Bag', price: '$18.00', image: './assets/shop/totebag1.png' }
];

// Create shop grid on load
window.addEventListener('DOMContentLoaded', () => {
  const shopGrid = document.getElementById('shopGrid');
  shopItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'shop-item';
    itemElement.innerHTML = `
      <div class="shop-item-inner">
        <div class="item-image"></div>
        <div class="item-details">
          <span class="item-name">${item.name}</span>
          <span class="item-price">${item.price}</span>
        </div>
      </div>
    `;
    shopGrid.appendChild(itemElement);
  });
});
