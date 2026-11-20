window.TokoApp = (() => {
  // Nieuwe key zodat de placeholder-menukaart ook verschijnt bij bezoekers met oude opgeslagen data
  const MENU_KEY = 'toko_layang_menu_v2';
  const ORDERS_KEY = 'toko_layang_orders';

  // PLACEHOLDERS: vervang later door de echte producten.
  // Optioneel veld "img": URL van een foto, bijv. img: 'fotos/nasi.jpg'
  const defaultMenu = [
    { id: 1, name: 'Gerecht naam 1', category: 'Gerechten', price: 0, desc: 'Korte beschrijving van het gerecht komt hier.' },
    { id: 2, name: 'Gerecht naam 2', category: 'Gerechten', price: 0, desc: 'Korte beschrijving van het gerecht komt hier.' },
    { id: 3, name: 'Gerecht naam 3', category: 'Gerechten', price: 0, desc: 'Korte beschrijving van het gerecht komt hier.' },
    { id: 4, name: 'Voordeelmenu naam 1', category: "Voordeelmenu's", price: 0, desc: 'Korte beschrijving van het menu komt hier.' },
    { id: 5, name: 'Voordeelmenu naam 2', category: "Voordeelmenu's", price: 0, desc: 'Korte beschrijving van het menu komt hier.' },
    { id: 6, name: 'Rijsttafel naam 1', category: 'Rijsttafels', price: 0, desc: 'Korte beschrijving van de rijsttafel komt hier.' },
    { id: 7, name: 'Bubble tea naam 1', category: 'Bubble Tea', price: 0, desc: 'Korte beschrijving van de smaak komt hier.' },
    { id: 8, name: 'Bubble tea naam 2', category: 'Bubble Tea', price: 0, desc: 'Korte beschrijving van de smaak komt hier.' }
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

  // Voorkomt dat ingevoerde tekst als HTML wordt uitgevoerd
  function esc(text) {
    const d = document.createElement('div');
    d.textContent = text ?? '';
    return d.innerHTML;
  }

  function switchView(viewName) {
    document.querySelectorAll('.view').forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewName}`);
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    window.location.hash = viewName;
    window.scrollTo({ top: 0 });
  }

  function dishCard(item) {
    const imgStyle = item.img ? ` style="background-image:url('${esc(item.img)}')"` : '';
    return `
      <div class="dish-card">
        <div>
          <div class="ph dish-img"${imgStyle}>${item.img ? '' : '<span>Foto</span>'}</div>
          <span class="badge">${esc(item.category)}</span>
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.desc)}</p>
        </div>
        <div class="dish-footer">
          <strong>${formatPrice(item.price)}</strong>
          <button class="btn primary" onclick="TokoApp.addToCart(${item.id})">+ Toevoegen</button>
        </div>
      </div>`;
  }

  function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    const search = (document.getElementById('menu-search')?.value || '').toLowerCase();
    const category = document.getElementById('menu-category')?.value || 'alle';
    const menu = getMenu();

    const items = menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search) || item.desc.toLowerCase().includes(search);
      const matchesCat = category === 'alle' || item.category === category;
      return matchesSearch && matchesCat;
    });
    grid.innerHTML = items.length ? items.map(dishCard).join('') : '<p>Geen gerechten gevonden.</p>';

    // Favorieten op home: eerste 4 gerechten van de menukaart
    const featured = document.getElementById('featured-grid');
    if (featured) featured.innerHTML = menu.slice(0, 4).map(dishCard).join('');
  }

  function addToCart(id) {
    const dish = getMenu().find(d => d.id === id);
    if (!dish) return;
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ ...dish, qty: 1 });
    renderCart();
  }

  function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
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
      container.innerHTML = '<p>Je winkelwagen is nog leeg. Kies gerechten uit het menu.</p>';
      return;
    }

    container.innerHTML = cart.map(item => `
      <div class="cart-row">
        <span>${esc(item.name)}</span>
        <div>
          <span class="qty">
            <button aria-label="Minder" onclick="TokoApp.changeQty(${item.id}, -1)">−</button>
            ${item.qty}
            <button aria-label="Meer" onclick="TokoApp.changeQty(${item.id}, 1)">+</button>
          </span>
          <strong>${formatPrice(item.price * item.qty)}</strong>
          <button class="btn danger" aria-label="Verwijderen" onclick="TokoApp.removeFromCart(${item.id})">X</button>
        </div>
      </div>
    `).join('');
  }

  function init() {
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', () => switchView(el.dataset.view));
    });

    // Categoriekaarten op home: open het menu met die categorie
    document.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('menu-category').value = el.dataset.cat;
        renderMenu();
      });
    });

    document.getElementById('menu-search')?.addEventListener('input', renderMenu);
    document.getElementById('menu-category')?.addEventListener('change', renderMenu);

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

    const validViews = ['home', 'menu', 'bestellen', 'security'];
    const hash = window.location.hash.replace('#', '');
    switchView(validViews.includes(hash) ? hash : 'home');
    renderMenu();
    renderCart();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getMenu, saveMenu, getOrders, saveOrders, formatPrice, switchView, addToCart, changeQty, removeFromCart };
})();