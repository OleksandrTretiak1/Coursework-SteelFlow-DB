const API = '/api';
let currentEmployee = null;
let cache = {};

async function api(url, options = {}) {
    const res = await fetch(API + url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function openModal(title, bodyHtml, footerHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function statusBadge(s) {
    const map = { 'завершено': 'success', 'в обробці': 'warning', 'нове': 'info', 'скасовано': 'danger' };
    return `<span class="badge badge-${map[s] || 'info'}">${s}</span>`;
}

function money(v) {
    return `<span class="money">${Number(v).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴</span>`;
}

function searchBar() {
    return `<input class="form-control" id="tableSearch" placeholder="Пошук..." oninput="filterTable()" style="width:260px;">`;
}

function filterTable() {
    const q = document.getElementById('tableSearch').value.toLowerCase();
    document.querySelectorAll('#mainContent tbody tr').forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

function confirmDialog(message) {
    return new Promise(function(resolve) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `<div class="confirm-dialog">
            <div class="confirm-icon">⚠️</div>
            <div class="confirm-title">Підтвердження</div>
            <div class="confirm-text">${message}</div>
            <div class="confirm-buttons">
                <button class="btn btn-secondary" id="confirmNo">Скасувати</button>
                <button class="btn btn-danger" id="confirmYes">Видалити</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#confirmYes').onclick = function() { overlay.remove(); resolve(true); };
        overlay.querySelector('#confirmNo').onclick = function() { overlay.remove(); resolve(false); };
    });
}

async function loadEmployeeSelect() {
    const emps = await api('/employees');
    const sel = document.getElementById('employeeSelect');
    sel.innerHTML = '<option value="">-- Оберіть --</option>' +
        emps.map(e => `<option value="${e.employeeId}">${e.lastName} ${e.firstName} — ${e.position}</option>`).join('');
}

function login() {
    const sel = document.getElementById('employeeSelect');
    if (!sel.value) return toast('Оберіть працівника', 'error');
    const opt = sel.options[sel.selectedIndex];
    currentEmployee = { id: +sel.value, name: opt.textContent };
    document.getElementById('currentUser').textContent = currentEmployee.name;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appLayout').style.display = 'block';
    navigate('dashboard');
}

function logout() {
    currentEmployee = null;
    cache = {};
    document.getElementById('loginScreen').style.display = '';
    document.getElementById('appLayout').style.display = 'none';
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
});

function navigate(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const pages = { dashboard: renderDashboard, categories: renderCategories, products: renderProducts, clients: renderClients, employees: renderEmployees, orders: renderOrders };
    if (pages[page]) pages[page]();
}

async function renderDashboard() {
    const [products, clients, orders, employees] = await Promise.all([
        api('/products'), api('/clients'), api('/orders'), api('/employees')
    ]);
    cache = { products, clients, orders, employees };
    const completed = orders.filter(o => o.status === 'завершено');
    const revenue = completed.reduce((s, o) => s + o.totalAmount, 0);
    document.getElementById('mainContent').innerHTML = `<div class="page">
        <div class="page-header"><h1>Головна панель</h1></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="label">Товарів на складі</div><div class="value accent">${products.length}</div></div>
            <div class="stat-card"><div class="label">Клієнтів</div><div class="value info">${clients.length}</div></div>
            <div class="stat-card"><div class="label">Замовлень</div><div class="value warning">${orders.length}</div></div>
            <div class="stat-card"><div class="label">Дохід (завершені)</div><div class="value success">${Number(revenue).toLocaleString('uk-UA')} ₴</div></div>
        </div>
        <div class="card"><div class="card-header"><h2>Останні замовлення</h2></div><div class="card-body">
            <table><thead><tr><th>ID</th><th>Клієнт</th><th>Дата</th><th>Сума</th><th>Статус</th></tr></thead>
            <tbody>${orders.slice(0, 5).map(o => `<tr><td>#${o.orderId}</td><td>${o.client?.companyName || ''}</td>
            <td>${new Date(o.orderDate).toLocaleDateString('uk-UA')}</td><td>${money(o.totalAmount)}</td><td>${statusBadge(o.status)}</td></tr>`).join('')}</tbody></table>
        </div></div></div>`;
}

async function renderCategories() {
    const cats = await api('/categories');
    document.getElementById('mainContent').innerHTML = `<div class="page">
        <div class="page-header"><h1>Категорії</h1><div style="display:flex;gap:8px;align-items:center">${searchBar()}<button class="btn btn-primary" onclick="openCategoryForm()">+ Додати</button></div></div>
        <div class="card"><div class="card-body"><table><thead><tr><th>ID</th><th>Назва</th><th>Опис</th><th>Дії</th></tr></thead>
        <tbody>${cats.map(c => `<tr><td>${c.categoryId}</td><td>${c.name}</td><td>${c.description || '—'}</td>
        <td class="actions"><button class="btn btn-secondary btn-sm" onclick="openCategoryForm(${c.categoryId},'${esc(c.name)}','${esc(c.description || '')}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.categoryId})">🗑</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function esc(s) { return (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

function openCategoryForm(id, name, desc) {
    const isEdit = !!id;
    openModal(isEdit ? 'Редагувати категорію' : 'Нова категорія',
        `<div class="form-group"><label>Назва</label><input class="form-control" id="fName" value="${name || ''}"></div>
         <div class="form-group"><label>Опис</label><input class="form-control" id="fDesc" value="${desc || ''}"></div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Скасувати</button>
         <button class="btn btn-primary" onclick="saveCategory(${id || 0})">Зберегти</button>`);
}

async function saveCategory(id) {
    const body = { name: document.getElementById('fName').value, description: document.getElementById('fDesc').value || null };
    if (!body.name) return toast('Введіть назву', 'error');
    if (id) await api(`/categories/${id}`, { method: 'PUT', body });
    else await api('/categories', { method: 'POST', body });
    closeModal(); toast(id ? 'Категорію оновлено' : 'Категорію додано'); renderCategories();
}

async function deleteCategory(id) {
    if (!await confirmDialog('Ви дійсно хочете видалити цю категорію?')) return;
    try { await api(`/categories/${id}`, { method: 'DELETE' }); toast('Видалено'); renderCategories(); }
    catch (e) { toast('Не можна видалити: є товари', 'error'); }
}

async function renderProducts() {
    const [prods, cats] = await Promise.all([api('/products'), api('/categories')]);
    cache.categories = cats;
    document.getElementById('mainContent').innerHTML = `<div class="page">
        <div class="page-header"><h1>Товари</h1><div style="display:flex;gap:8px;align-items:center">${searchBar()}<button class="btn btn-primary" onclick="openProductForm()">+ Додати</button></div></div>
        <div class="card"><div class="card-body"><table><thead><tr><th>ID</th><th>Назва</th><th>Категорія</th><th>Од.</th><th>Ціна</th><th>Залишок</th><th>Дії</th></tr></thead>
        <tbody>${prods.map(p => `<tr><td>${p.productId}</td><td>${p.name}</td><td>${p.category?.name || ''}</td><td>${p.unit}</td>
        <td>${money(p.pricePerUnit)}</td><td>${p.stockQuantity}</td>
        <td class="actions"><button class="btn btn-secondary btn-sm" onclick='openProductForm(${JSON.stringify(p).replace(/'/g,"&#39;")})'>✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.productId})">🗑</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function openProductForm(p) {
    const isEdit = !!p;
    const cats = cache.categories || [];
    openModal(isEdit ? 'Редагувати товар' : 'Новий товар',
        `<div class="form-group"><label>Категорія</label><select class="form-control" id="fCat">${cats.map(c =>
            `<option value="${c.categoryId}" ${p && p.categoryId === c.categoryId ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Назва</label><input class="form-control" id="fName" value="${p?.name || ''}"></div>
        <div class="form-row">
            <div class="form-group"><label>Одиниця</label><select class="form-control" id="fUnit">
                <option value="т" ${p?.unit === 'т' ? 'selected' : ''}>т (тонна)</option>
                <option value="м" ${p?.unit === 'м' ? 'selected' : ''}>м (метр)</option>
                <option value="шт" ${p?.unit === 'шт' ? 'selected' : ''}>шт</option>
                <option value="кг" ${p?.unit === 'кг' ? 'selected' : ''}>кг</option></select></div>
            <div class="form-group"><label>Ціна за од.</label><input type="number" step="0.01" class="form-control" id="fPrice" value="${p?.pricePerUnit || ''}"></div>
        </div>
        <div class="form-group"><label>Залишок на складі</label><input type="number" step="0.001" class="form-control" id="fStock" value="${p?.stockQuantity || 0}"></div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Скасувати</button>
         <button class="btn btn-primary" onclick="saveProduct(${p?.productId || 0})">Зберегти</button>`);
}

async function saveProduct(id) {
    const body = { categoryId: +document.getElementById('fCat').value, name: document.getElementById('fName').value,
        unit: document.getElementById('fUnit').value, pricePerUnit: +document.getElementById('fPrice').value,
        stockQuantity: +document.getElementById('fStock').value };
    if (!body.name || !body.pricePerUnit) return toast('Заповніть обовʼязкові поля', 'error');
    if (id) await api(`/products/${id}`, { method: 'PUT', body });
    else await api('/products', { method: 'POST', body });
    closeModal(); toast(id ? 'Товар оновлено' : 'Товар додано'); renderProducts();
}

async function deleteProduct(id) {
    if (!await confirmDialog('Ви дійсно хочете видалити цей товар?')) return;
    try { await api(`/products/${id}`, { method: 'DELETE' }); toast('Видалено'); renderProducts(); }
    catch (e) { toast('Не можна видалити: є замовлення', 'error'); }
}

async function renderClients() {
    const cls = await api('/clients');
    document.getElementById('mainContent').innerHTML = `<div class="page">
        <div class="page-header"><h1>Клієнти</h1><div style="display:flex;gap:8px;align-items:center">${searchBar()}<button class="btn btn-primary" onclick="openClientForm()">+ Додати</button></div></div>
        <div class="card"><div class="card-body"><table><thead><tr><th>ID</th><th>Компанія</th><th>Контакт</th><th>Телефон</th><th>Email</th><th>Знижка</th><th>Дії</th></tr></thead>
        <tbody>${cls.map(c => `<tr><td>${c.clientId}</td><td>${c.companyName}</td><td>${c.contactPerson || '—'}</td>
        <td>${c.phone || '—'}</td><td>${c.email || '—'}</td><td><span class="badge badge-success">${c.discountPercent}%</span></td>
        <td class="actions"><button class="btn btn-secondary btn-sm" onclick='openClientForm(${JSON.stringify(c).replace(/'/g,"&#39;")})'>✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteClient(${c.clientId})">🗑</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function openClientForm(c) {
    const isEdit = !!c;
    openModal(isEdit ? 'Редагувати клієнта' : 'Новий клієнт',
        `<div class="form-group"><label>Назва компанії</label><input class="form-control" id="fCompany" value="${c?.companyName || ''}"></div>
        <div class="form-group"><label>Контактна особа</label><input class="form-control" id="fContact" value="${c?.contactPerson || ''}"></div>
        <div class="form-row">
            <div class="form-group"><label>Телефон</label><input class="form-control" id="fPhone" value="${c?.phone || ''}"></div>
            <div class="form-group"><label>Email</label><input class="form-control" id="fEmail" value="${c?.email || ''}"></div>
        </div>
        <div class="form-group"><label>Знижка (%)</label><input type="number" step="0.01" min="0" max="100" class="form-control" id="fDiscount" value="${c?.discountPercent || 0}"></div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Скасувати</button>
         <button class="btn btn-primary" onclick="saveClient(${c?.clientId || 0})">Зберегти</button>`);
}

async function saveClient(id) {
    const body = { companyName: document.getElementById('fCompany').value, contactPerson: document.getElementById('fContact').value || null,
        phone: document.getElementById('fPhone').value || null, email: document.getElementById('fEmail').value || null,
        discountPercent: +document.getElementById('fDiscount').value };
    if (!body.companyName) return toast('Введіть назву компанії', 'error');
    if (id) await api(`/clients/${id}`, { method: 'PUT', body });
    else await api('/clients', { method: 'POST', body });
    closeModal(); toast(id ? 'Клієнта оновлено' : 'Клієнта додано'); renderClients();
}

async function deleteClient(id) {
    if (!await confirmDialog('Ви дійсно хочете видалити цього клієнта?')) return;
    try { await api(`/clients/${id}`, { method: 'DELETE' }); toast('Видалено'); renderClients(); }
    catch (e) { toast('Не можна видалити: є замовлення', 'error'); }
}

async function renderEmployees() {
    const emps = await api('/employees');
    document.getElementById('mainContent').innerHTML = `<div class="page">
        <div class="page-header"><h1>Працівники</h1><div style="display:flex;gap:8px;align-items:center">${searchBar()}<button class="btn btn-primary" onclick="openEmployeeForm()">+ Додати</button></div></div>
        <div class="card"><div class="card-body"><table><thead><tr><th>ID</th><th>Прізвище</th><th>Ім'я</th><th>Посада</th><th>Телефон</th><th>Дата найму</th><th>Дії</th></tr></thead>
        <tbody>${emps.map(e => `<tr><td>${e.employeeId}</td><td>${e.lastName}</td><td>${e.firstName}</td><td>${e.position}</td>
        <td>${e.phone || '—'}</td><td>${e.hireDate}</td>
        <td class="actions"><button class="btn btn-secondary btn-sm" onclick='openEmployeeForm(${JSON.stringify(e).replace(/'/g,"&#39;")})'>✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${e.employeeId})">🗑</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function openEmployeeForm(e) {
    openModal(e ? 'Редагувати працівника' : 'Новий працівник',
        `<div class="form-row">
            <div class="form-group"><label>Ім'я</label><input class="form-control" id="fFirst" value="${e?.firstName || ''}"></div>
            <div class="form-group"><label>Прізвище</label><input class="form-control" id="fLast" value="${e?.lastName || ''}"></div>
        </div>
        <div class="form-group"><label>Посада</label><input class="form-control" id="fPos" value="${e?.position || ''}"></div>
        <div class="form-group"><label>Телефон</label><input class="form-control" id="fPhone" value="${e?.phone || ''}"></div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Скасувати</button>
         <button class="btn btn-primary" onclick="saveEmployee(${e?.employeeId || 0})">Зберегти</button>`);
}

async function saveEmployee(id) {
    const body = { firstName: document.getElementById('fFirst').value, lastName: document.getElementById('fLast').value,
        position: document.getElementById('fPos').value, phone: document.getElementById('fPhone').value || null };
    if (!body.firstName || !body.lastName || !body.position) return toast('Заповніть обовʼязкові поля', 'error');
    if (id) await api(`/employees/${id}`, { method: 'PUT', body });
    else await api('/employees', { method: 'POST', body });
    closeModal(); toast(id ? 'Працівника оновлено' : 'Працівника додано'); renderEmployees();
}

async function deleteEmployee(id) {
    if (!await confirmDialog('Ви дійсно хочете видалити цього працівника?')) return;
    try { await api(`/employees/${id}`, { method: 'DELETE' }); toast('Видалено'); renderEmployees(); }
    catch (e) { toast('Не можна видалити: є замовлення', 'error'); }
}

async function renderOrders() {
    const orders = await api('/orders');
    document.getElementById('mainContent').innerHTML = `<div class="page">
        <div class="page-header"><h1>Замовлення</h1><div style="display:flex;gap:8px;align-items:center">${searchBar()}<button class="btn btn-primary" onclick="openOrderForm()">+ Нове замовлення</button></div></div>
        <div class="card"><div class="card-body"><table><thead><tr><th>ID</th><th>Клієнт</th><th>Працівник</th><th>Дата</th><th>Сума</th><th>Статус</th><th>Дії</th></tr></thead>
        <tbody>${orders.map(o => `<tr><td>#${o.orderId}</td><td>${o.client?.companyName || ''}</td>
        <td>${o.employee ? o.employee.lastName + ' ' + o.employee.firstName : ''}</td>
        <td>${new Date(o.orderDate).toLocaleDateString('uk-UA')}</td><td>${money(o.totalAmount)}</td><td>${statusBadge(o.status)}</td>
        <td class="actions"><button class="btn btn-secondary btn-sm" onclick="viewOrder(${o.orderId})">👁</button>
        <button class="btn btn-danger btn-sm" onclick="deleteOrder(${o.orderId})">🗑</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
}

let orderItems = [];

async function openOrderForm() {
    const [clients, products] = await Promise.all([api('/clients'), api('/products')]);
    cache.clients = clients; cache.products = products;
    orderItems = [{ productId: '', quantity: 1 }];
    openModal('Нове замовлення', buildOrderFormHtml(clients, products),
        `<button class="btn btn-secondary" onclick="closeModal()">Скасувати</button>
         <button class="btn btn-primary" onclick="submitOrder()">Оформити замовлення</button>`);
}

function buildOrderFormHtml(clients, products) {
    return `<div class="form-group"><label>Клієнт</label><select class="form-control" id="fClient" onchange="updateOrderSummary()">
        <option value="">-- Оберіть --</option>${clients.map(c => `<option value="${c.clientId}" data-discount="${c.discountPercent}">${c.companyName} (знижка ${c.discountPercent}%)</option>`).join('')}</select></div>
        <div class="form-group"><label>Товари</label><div id="orderItemsList">${orderItems.map((_, i) => orderItemRow(i, products)).join('')}</div>
        <button class="btn btn-secondary btn-sm" onclick="addOrderItem()" style="margin-top:8px">+ Додати товар</button></div>
        <div class="order-summary" id="orderSummary"><div class="line">Оберіть клієнта та товари</div></div>`;
}

function orderItemRow(i, products) {
    products = products || cache.products || [];
    return `<div class="order-item-row" id="oi${i}"><div class="form-group" style="margin:0">
        <select class="form-control" onchange="updateOrderSummary()" id="oiProd${i}">
        <option value="">-- Товар --</option>${products.map(p => `<option value="${p.productId}" data-price="${p.pricePerUnit}" data-unit="${p.unit}">${p.name} (${money(p.pricePerUnit)}/${p.unit})</option>`).join('')}</select></div>
        <div class="form-group" style="margin:0"><input type="number" step="0.001" min="0.001" class="form-control" id="oiQty${i}" value="1" onchange="updateOrderSummary()"></div>
        <button class="btn btn-danger btn-sm" onclick="removeOrderItem(${i})" style="height:38px; padding:0; justify-content:center;">✕</button></div>`;
}

function addOrderItem() {
    orderItems.push({ productId: '', quantity: 1 });
    document.getElementById('orderItemsList').insertAdjacentHTML('beforeend', orderItemRow(orderItems.length - 1));
}

function removeOrderItem(i) {
    const el = document.getElementById(`oi${i}`);
    if (el) el.remove();
    orderItems[i] = null;
}

function updateOrderSummary() {
    const clientSel = document.getElementById('fClient');
    if (!clientSel || !clientSel.value) { document.getElementById('orderSummary').innerHTML = '<div class="line">Оберіть клієнта та товари</div>'; return; }
    const discount = +clientSel.options[clientSel.selectedIndex].dataset.discount || 0;
    let lines = [], total = 0;
    orderItems.forEach((_, i) => {
        const ps = document.getElementById(`oiProd${i}`);
        const qs = document.getElementById(`oiQty${i}`);
        if (!ps || !ps.value) return;
        const price = +ps.options[ps.selectedIndex].dataset.price;
        const qty = +qs.value;
        const lt = qty * price * (1 - discount / 100);
        total += lt;
        lines.push(`<div class="line"><span>${ps.options[ps.selectedIndex].text.split('(')[0].trim()} × ${qty}</span><span>${money(lt)}</span></div>`);
    });
    document.getElementById('orderSummary').innerHTML =
        (lines.length ? lines.join('') : '<div class="line">Додайте товари</div>') +
        `<div class="line"><span>Знижка клієнта</span><span>${discount}%</span></div>
         <div class="line total"><span>Разом</span><span>${money(total)}</span></div>`;
}

async function submitOrder() {
    const clientId = +document.getElementById('fClient').value;
    if (!clientId) return toast('Оберіть клієнта', 'error');
    const items = [];
    orderItems.forEach((_, i) => {
        const ps = document.getElementById(`oiProd${i}`);
        const qs = document.getElementById(`oiQty${i}`);
        if (ps && ps.value) items.push({ productId: +ps.value, quantity: +qs.value });
    });
    if (!items.length) return toast('Додайте хоча б один товар', 'error');
    try {
        await api('/orders', { method: 'POST', body: { clientId, employeeId: currentEmployee.id, items } });
        closeModal(); toast('Замовлення оформлено!'); renderOrders();
    } catch (e) { toast(e.message, 'error'); }
}

async function viewOrder(id) {
    const o = await api(`/orders/${id}`);
    const items = (o.orderItems || []).map(oi =>
        `<tr><td>${oi.product?.name || oi.productId}</td><td>${oi.quantity}</td><td>${money(oi.unitPrice)}</td><td>${oi.discountPercent}%</td><td>${money(oi.lineTotal)}</td></tr>`).join('');
    openModal(`Замовлення #${o.orderId}`,
        `<div style="margin-bottom:16px"><strong>Клієнт:</strong> ${o.client?.companyName || ''}<br>
        <strong>Працівник:</strong> ${o.employee ? o.employee.lastName + ' ' + o.employee.firstName : ''}<br>
        <strong>Дата:</strong> ${new Date(o.orderDate).toLocaleString('uk-UA')}<br>
        <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <strong>Статус:</strong>
            <select class="form-control" style="width:auto; padding:4px 10px;" onchange="updateOrderStatus(${o.orderId}, this.value)">
                <option value="нове" ${o.status==='нове'?'selected':''}>нове</option>
                <option value="в обробці" ${o.status==='в обробці'?'selected':''}>в обробці</option>
                <option value="завершено" ${o.status==='завершено'?'selected':''}>завершено</option>
                <option value="скасовано" ${o.status==='скасовано'?'selected':''}>скасовано</option>
            </select>
        </div></div>
        <table><thead><tr><th>Товар</th><th>К-сть</th><th>Ціна</th><th>Знижка</th><th>Сума</th></tr></thead><tbody>${items}</tbody></table>
        <div class="order-summary"><div class="line total"><span>Загалом</span><span>${money(o.totalAmount)}</span></div></div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Закрити</button>`);
}

async function deleteOrder(id) {
    if (!await confirmDialog('Ви дійсно хочете видалити це замовлення?')) return;
    await api(`/orders/${id}`, { method: 'DELETE' }); toast('Видалено'); renderOrders();
}

async function updateOrderStatus(id, status) {
    try {
        await api(`/orders/${id}/status`, { method: 'PUT', body: status });
        toast('Статус оновлено');
        renderOrders();
        closeModal();
    } catch (e) { toast(e.message, 'error'); }
}

loadEmployeeSelect();
