window.TokoApp = (() => {
  const MENU_KEY = 'toko_layang_menu';
  const ORDERS_KEY = 'toko_layang_orders';

  const defaultMenu = [
    { id: 1, name: 'Nasi Rames Speciaal', category: 'Hoofdgerechten', price: 13.50, desc: 'Witte rijst met rendang, ajam smoor, sajoer lodeh en ei.' },
    { id: 2, name: 'Daging Rendang', category: 'Hoofdgerechten', price: 14.50, desc: 'Langzaam gegaard rundvlees in kruidige kokossaus.' },
    { id: 3, name: 'Sate Ajam (4 stokjes)', category: 'Bijgerechten', price: 6.75, desc: 'Gegrilde kipsaté met huisgemaakte pindasaus.' },
    { id: 4, name: 'Pisang Goreng (3 stuks)', category: 'Snacks', price: 4.50, desc: 'Krokant gebakken banaan.' },
    { id: 5, name: 'Es Tjendol', category: 'Dranken', price: 3.75, desc: 'Verfrissende kokosdrank met palmsuiker en pandan.' }
  ];

  let cart = [];

  function getMenu() {
    const stored = localStorage.getItem(MENU_KEY);
    if (!stored) {
      localStorage.setItem(MENU_KEY, JSON.stringify(defaultMenu));
      return [...defaultMenu];
    }
    return JSON.parse(stored);
  }

  function saveMenu(menu) {
    localStorage.setItem(MENU_KEY, JSON.stringify(menu));
    renderMenu();
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function formatPrice(amount) {
    return '€ ' + Number(amount).toFixed(2).replace('.', ',');
  }

  // Centrale view-schakelaar
  function switchView(viewName) {
    document.querySelectorAll('.view').forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewName}`);
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    window.location.hash = viewName;
  }

  function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    const search = (document.getElementById('menu-search')?.value || '').toLowerCase();
    const category = document.getElementById('menu-category')?.value || 'alle';

    const items = getMenu().filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search) || item.desc.toLowerCase().includes(search);
      const matchesCat = category === 'alle' || item.category === category;
      return matchesSearch && matchesCat;
    });

    grid.innerHTML = items.map(item => `
      <div class="dish-card">
        <div>
          <span class="badge">${item.category}</span>
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
        </div>
        <div class="dish-footer">
          <strong>${formatPrice(item.price)}</strong>
          <button class="btn primary" onclick="TokoApp.addToCart(${item.id})">+ Toevoegen</button>
        </div>
      </div>
    `).join('');
  }

  function addToCart(id) {
    const dish = getMenu().find(d => d.id === id);
    if (!dish) return;

    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...dish, qty: 1 });
    }
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');

    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    countEl.textContent = totalCount;
    totalEl.textContent = formatPrice(totalPrice);

    if (cart.length === 0) {
      container.innerHTML = '<p>Je winkelwagen is nog leeg.</p>';
      return;
    }

    container.innerHTML = cart.map(item => `
      <div class="cart-row">
        <span>${item.qty}x ${item.name}</span>
        <div>
          <strong>${formatPrice(item.price * item.qty)}</strong>
          <button class="btn danger" onclick="TokoApp.removeFromCart(${item.id})">X</button>
        </div>
      </div>
    `).join('');
  }

  function init() {
    // Navigatieknoppen koppelen
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', () => switchView(el.dataset.view));
    });

    // Zoek- en filterevents
    document.getElementById('menu-search')?.addEventListener('input', renderMenu);
    document.getElementById('menu-category')?.addEventListener('change', renderMenu);

    // Bestelformulier verwerken
    document.getElementById('order-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const feedback = document.getElementById('order-feedback');
      if (cart.length === 0) {
        feedback.textContent = 'Voeg eerst gerechten toe vanuit het menu.';
        return;
      }

      const orders = getOrders();
      orders.push({
        id: Date.now(),
        customer: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        pickupTime: document.getElementById('pickup-time').value,
        notes: document.getElementById('order-notes').value,
        items: [...cart],
        total: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
        status: 'Nieuw'
      });
      saveOrders(orders);

      cart = [];
      renderCart();
      e.target.reset();
      feedback.textContent = 'Bedankt! Je bestelling is ontvangen.';
      document.dispatchEvent(new Event('ordersUpdated'));
    });

    // Startscherm bepalen via URL-hash of standaard 'home'
    const initialView = window.location.hash.replace('#', '') || 'home';
    switchView(initialView);
    renderMenu();
    renderCart();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    getMenu,
    saveMenu,
    getOrders,
    saveOrders,
    formatPrice,
    switchView,
    addToCart,
    removeFromCart
  };
})();