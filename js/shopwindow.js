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
  { name: 'T-Shirt 1', price: '$25.00', image: './assets/shop/placeholder1.jpg' },
  { name: 'Hoodie', price: '$45.00', image: './assets/shop/placeholder2.jpg' },
  { name: 'Cap', price: '$20.00', image: './assets/shop/placeholder3.jpg' },
  { name: 'Sticker Pack', price: '$10.00', image: './assets/shop/placeholder4.jpg' },
  { name: 'Poster', price: '$15.00', image: './assets/shop/placeholder5.jpg' },
  { name: 'Mug', price: '$12.00', image: './assets/shop/placeholder6.jpg' },
  { name: 'Pin Set', price: '$8.00', image: './assets/shop/placeholder7.jpg' },
  { name: 'Tote Bag', price: '$18.00', image: './assets/shop/placeholder8.jpg' }
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
