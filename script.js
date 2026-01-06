let cart = {};
let total = 0;

// Per-browser client identifier (used to target notifications to the device that placed the order)
let clientId = localStorage.getItem('clientId_v1');
if (!clientId) {
    clientId = 'C' + Date.now() + Math.random().toString(36).slice(2,8);
    localStorage.setItem('clientId_v1', clientId);
}

function addToCart(name, price) {
    if (cart[name]) {
        cart[name].qty++;
    } else {
        cart[name] = { price: price, qty: 1 };
    }
    renderCart();
}

function increase(name) {
    cart[name].qty++;
    renderCart();
}

function decrease(name) {
    cart[name].qty--;
    if (cart[name].qty <= 0) delete cart[name];
    renderCart();
}

function updateQty(name, input) {
    let value = parseInt(input.value);

    if (isNaN(value) || value <= 0) {
        delete cart[name];
    } else {
        cart[name].qty = value;
    }
    renderCart();
}

function renderCart() {
    const cartList = document.getElementById("cart");
    cartList.innerHTML = "";
    total = 0;

    for (let name in cart) {
        let item = cart[name];
        let itemTotal = item.price * item.qty;
        total += itemTotal;

        let li = document.createElement("li");
        li.innerHTML = `
            <b>${name}</b> - $${item.price} × 
            <input type="number" min="1" value="${item.qty}"
                onchange="updateQty('${name}', this)">
            = <b>$${itemTotal}</b>
            <button onclick="decrease('${name}')">➖</button>
            <button onclick="increase('${name}')">➕</button>
        `;
        cartList.appendChild(li);
    }

    document.getElementById("total").textContent = total;
}

const radios = document.getElementsByName("orderType");
const dineInBox = document.getElementById("dineInInfo");

// Show/hide dine-in controls based on selection
radios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "Delivery" && radio.checked) {
            dineInBox.style.display = "none";
        } else if (radio.value === "Dine in" && radio.checked) {
            dineInBox.style.display = "flex";
        }
    });
});

// Initialize visibility based on default selection
const selected = document.querySelector('input[name="orderType"]:checked').value;
if (selected === "Delivery") {
    dineInBox.style.display = "none";
} else {
    dineInBox.style.display = "flex";
}

function confirmOrder() {
    const name = document.getElementById("name").value.trim();
    const people = document.getElementById("people").value;
    const date = document.getElementById("date") ? document.getElementById("date").value : "";
    const time = document.getElementById("time").value;
    const table = document.getElementById("table") ? document.getElementById("table").value : "";
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    const address = document.getElementById("address") ? document.getElementById("address").value.trim() : "";
    const phone = document.getElementById("phone") ? document.getElementById("phone").value.trim() : "";

    if (Object.keys(cart).length === 0) {
        alert("Vui lòng chọn món!");
        return;
    }

    if (!name) {
        alert("Vui lòng nhập tên khách hàng!");
        return;
    }

    if (orderType === "Delivery") {
        if (!address || !phone) {
            alert("Vui lòng nhập địa chỉ và số điện thoại!");
            return;
        }

    } else { // Dine in
        if (!people || !date || !time || !table) {
            alert("Vui lòng nhập đầy đủ thông tin đặt chỗ (số người, ngày, giờ, chọn bàn)!");
            return;
        }
    }

    // Build order object
    const orderId = 'ORD' + Date.now();
    const items = Object.keys(cart).map(name => ({ name, price: cart[name].price, qty: cart[name].qty }));

    const order = {
        id: orderId,
        items,
        total: total,
        name,
        people,
        date,
        time,
        table,
        orderType,
        address,
        phone,
        createdAt: Date.now(),
        status: 'active',
        ownerId: clientId // identify which client placed this order
    };

    // Save order
    orders.push(order);
    saveOrders();
    renderOrders();

    // Clear cart
    cart = {};
    renderCart();

    // Notify user
    alert("🎉 ĐẶT HÀNG THÀNH CÔNG!\nMã đơn: " + orderId);
}

// --- Order history helpers (persistent in localStorage) ---
let orders = JSON.parse(localStorage.getItem('orders_v1') || '[]');

function saveOrders() {
    localStorage.setItem('orders_v1', JSON.stringify(orders));
    // keep prev snapshot in sync (for storage change detection)
    _prevOrdersJSON = JSON.stringify(orders);
}

function renderOrders() {
    const container = document.getElementById('orderHistory');
    if (!container) return;
    container.innerHTML = '';

    // Show only this client's active orders (ownerId matches clientId)
    const visible = orders.filter(o => o.status === 'active' && o.ownerId === clientId);

    if (visible.length === 0) {
        container.innerHTML = '<p>Bạn hiện không có đơn hàng đang chờ.</p>';
        return;
    }

    // Show newest first
    const list = visible.slice().reverse();

    list.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const statusLabel = order.status === 'processing' ? 'Đang xử lý' : 'Chờ xử lý';

        card.innerHTML = `
            <div class="order-header">
                <div class="order-num">#${order.id}</div>
                <div class="order-time">${new Date(order.createdAt).toLocaleString()}</div>
                <div class="order-status ${order.status}">${statusLabel}</div>
            </div>
            <div class="order-body">
                <div class="order-items">
                    ${order.items.map(i => `<div class="oi">${i.qty} × ${i.name} = $${i.price * i.qty}</div>`).join('')}
                </div>
                <div class="order-meta">
                    <div>Khách: <b>${order.name}</b></div>
                    <div>${order.orderType === 'Delivery' ? ('Địa chỉ: ' + order.address + ' • SĐT: ' + order.phone) : ('Bàn: ' + (order.table || '-') + ' • Ngày: ' + (order.date || '-') + ' • Giờ: ' + (order.time || '-'))}</div>
                </div>
                <div class="order-total">Tổng: $${order.total}</div>
            </div>
            <div class="order-actions">
                ${order.status !== 'cancelled' ? `<button class="cancel-btn" onclick="cancelOrder('${order.id}')">Hủy đơn</button>` : ''}
            </div>
        `;

        container.appendChild(card);
    });
}

function cancelOrder(id) {
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return;
    if (orders[idx].status === 'cancelled') return;
    if (!confirm('Bạn có chắc muốn hủy đơn ' + id + '?')) return;

    // Archive the cancelled order with reason "Hủy bởi khách"
    const archive = JSON.parse(localStorage.getItem('orders_archive_v1') || '{}');
    const o = orders[idx];
    o.status = 'cancelled';
    o.cancelledReason = 'Hủy bởi khách';
    o.cancelledAt = Date.now();
    const k = (new Date(o.createdAt)).toISOString().slice(0,10);
    if (!archive[k]) archive[k] = [];
    archive[k].push(o);
    localStorage.setItem('orders_archive_v1', JSON.stringify(archive));

    // publish last order update for other tabs
    localStorage.setItem('lastOrderUpdate_v1', JSON.stringify({ id: o.id, status: 'cancelled', reason: o.cancelledReason, ownerId: o.ownerId || clientId, ts: Date.now() }));

    // remove from active orders
    orders.splice(idx,1);
    saveOrders();
    renderOrders();
    alert('Đã hủy đơn ' + id);
}

// Listen for changes from other tabs (admin) and update UI
let _prevOrdersJSON = JSON.stringify(orders);
window.addEventListener('storage', (e) => {
    if (e.key === 'orders_v1') {
        const newOrders = JSON.parse(e.newValue || '[]');
        // detect status changes or removals for visible orders
        const prev = JSON.parse(_prevOrdersJSON || '[]');
        const prevMap = {};
        prev.forEach(o => prevMap[o.id] = o);
        const newMap = {};
        newOrders.forEach(o => newMap[o.id] = o);

        // status transitions in place — notify only for completed or cancelled
        newOrders.forEach(o => {
            const p = prevMap[o.id];
            if (p && p.status !== o.status) {
                if (o.status === 'completed' || o.status === 'cancelled') {
                    alert(`Đơn ${o.id} đã được cập nhật: ${o.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}`);
                }
                // do not notify for 'processing' to avoid clutter
            }
        });

        // removed orders (likely archived/processed)
        // Do not notify the user when orders are removed by admin to avoid noisy alerts.
        // If you want a subtle visual cue later, we can add a toast or badge instead.

        orders = newOrders;
        _prevOrdersJSON = JSON.stringify(orders);
        renderOrders();
    }

    if (e.key === 'lastOrderUpdate_v1') {
        try {
            const upd = JSON.parse(e.newValue || '{}');
            if (upd && upd.id) {
                // Only notify the client that owns the order
                const target = upd.ownerId;
                if (!target) return; // unknown owner -> do not broadcast
                if (target !== clientId) return; // not for this client

                if (upd.status === 'cancelled') {
                    alert(`Đơn ${upd.id} đã bị hủy. Lý do: ${upd.reason || 'Không có lý do'}`);
                } else if (upd.status === 'completed') {
                    alert(`Đơn ${upd.id} đã được hoàn thành.`);
                }
            }
        } catch (err) {
            // ignore parse errors
        }
    }
});

// Initialize order list on load
renderOrders();
