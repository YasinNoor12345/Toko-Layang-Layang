(() => {
  const ADMIN_PASS = 'toko2026';

  function renderAdminDashboard() {
    const menuList = document.getElementById('admin-menu-list');
    const ordersList = document.getElementById('admin-orders-list');
    if (!menuList || !ordersList) return;

    // Menukaart in beheer tonen
    const menu = TokoApp.getMenu();
    menuList.innerHTML = menu.map(item => `
      <li>
        <span><strong>${item.name}</strong> (${TokoApp.formatPrice(item.price)})</span>
        <button class="btn danger" data-delete-id="${item.id}">Verwijderen</button>
      </li>
    `).join('');

    menuList.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.deleteId);
        const updated = TokoApp.getMenu().filter(d => d.id !== id);
        TokoApp.saveMenu(updated);
        renderAdminDashboard();
      });
    });

    // Bestellingen tonen
    const orders = TokoApp.getOrders();
    if (orders.length === 0) {
      ordersList.innerHTML = '<p>Nog geen bestellingen geplaatst.</p>';
      return;
    }

    ordersList.innerHTML = orders.map(order => `
      <div class="cart-row">
        <div>
          <strong>${order.customer}</strong> (${order.phone}) – Afhalen om ${order.pickupTime}<br>
          <small>${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</small>
          ${order.notes ? `<br><em>Opmerking: ${order.notes}</em>` : ''}
        </div>
        <div>
          <strong>${TokoApp.formatPrice(order.total)}</strong>
          <button class="btn secondary" data-complete-id="${order.id}">Afronden</button>
        </div>
      </div>
    `).join('');

    ordersList.querySelectorAll('[data-complete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.completeId);
        const remaining = TokoApp.getOrders().filter(o => o.id !== id);
        TokoApp.saveOrders(remaining);
        renderAdminDashboard();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');
    const loginError = document.getElementById('login-error');

    loginForm?.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('admin-password').value;
      if (input === ADMIN_PASS) {
        loginForm.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loginError.textContent = '';
        renderAdminDashboard();
      } else {
        loginError.textContent = 'Onjuist wachtwoord.';
      }
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      adminPanel.classList.add('hidden');
      loginForm.classList.remove('hidden');
      loginForm.reset();
    });

    document.getElementById('add-dish-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const menu = TokoApp.getMenu();
      menu.push({
        id: Date.now(),
        name: document.getElementById('dish-name').value,
        category: document.getElementById('dish-category').value,
        price: parseFloat(document.getElementById('dish-price').value),
        desc: document.getElementById('dish-desc').value
      });
      TokoApp.saveMenu(menu);
      e.target.reset();
      renderAdminDashboard();
    });

    document.addEventListener('ordersUpdated', renderAdminDashboard);
  });
})();