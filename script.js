"use strict";

/* =========================================
   SPICE GARDEN - MENU DATA
========================================= */

const dishes = [
  { id: 1, name: "Cream of Tomato Soup", type: "Soup", price: 80, icon: "🍅", desc: "Creamy, smooth and comforting", pop: "A warm starter" },
  { id: 2, name: "Sweet Corn Veg Soup", type: "Soup", price: 90, icon: "🥣", desc: "Light soup with sweet corn", pop: "Guest favourite" },
  { id: 3, name: "Crispy Veg Spring Rolls", type: "Starter", price: 120, icon: "🥟", desc: "Crunchy bites with dipping sauce", pop: "Perfect to share" },
  { id: 4, name: "Paneer Butter Masala", type: "Main Course", price: 180, icon: "🍛", desc: "Paneer in a rich tomato gravy", pop: "Vegetarian favourite" },
  { id: 5, name: "Veg Biriyani", type: "Main Course", price: 150, icon: "🍚", desc: "Fragrant rice with spices", pop: "Popular choice" },
  { id: 6, name: "Chicken Biriyani", type: "Main Course", price: 200, icon: "🍗", desc: "Aromatic biriyani with chicken", pop: "Bestseller" },
  { id: 7, name: "Butter Chicken", type: "Main Course", price: 240, icon: "🍲", desc: "Classic creamy chicken curry", pop: "Chef favourite" },
  { id: 8, name: "Fresh Orange Juice", type: "Beverage", price: 55, icon: "🍊", desc: "Fresh and citrusy", pop: "Freshly squeezed" },
  { id: 9, name: "Mint Lime Cooler", type: "Beverage", price: 45, icon: "🍋", desc: "Cool, zesty and refreshing", pop: "Refreshing pick" },
  { id: 10, name: "Cold Coffee", type: "Beverage", price: 70, icon: "🥤", desc: "Chilled coffee, creamy finish", pop: "Coffee favourite" },
  { id: 11, name: "Chocolate Brownie", type: "Dessert", price: 85, icon: "🍫", desc: "Rich chocolate treat", pop: "Sweet finish" },
  { id: 12, name: "Gulab Jamun", type: "Dessert", price: 60, icon: "🍮", desc: "Soft, warm and syrupy", pop: "Classic dessert" },
  { id: 13, name: "Vanilla Ice Cream", type: "Dessert", price: 65, icon: "🍨", desc: "Cool and creamy scoops", pop: "Cool finish" },
  { id: 14, name: "Butter Naan", type: "Side", price: 35, icon: "🫓", desc: "Soft naan brushed with butter", pop: "Pairs with curry" }
];

/* =========================================
   APP STATE AND HELPERS
========================================= */

let cart = {};
let activeFilter = "All";
let dismissedSuggestions = new Set();
let suggestionsHidden = false;
let lastOrder = null;
let staffAuthenticated = false;

const money = amount =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);

const byId = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function readOrders() {
  try {
    const value = JSON.parse(localStorage.getItem("spiceGardenOrders") || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn("Could not read saved orders.", error);
    return [];
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem("spiceGardenOrders", JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error("Could not save orders.", error);
    return false;
  }
}

function scrollToCart() {
  byId("order-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================================
   MENU RENDERING, SEARCH AND FILTERS
========================================= */

function renderMenu() {
  const query = byId("search").value.trim().toLowerCase();

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory =
      activeFilter === "All" || dish.type === activeFilter;

    const searchableText =
      `${dish.name} ${dish.type} ${dish.desc}`.toLowerCase();

    return matchesCategory && searchableText.includes(query);
  });

  byId("menu").innerHTML = filteredDishes.length
    ? filteredDishes.map(dish => `
        <article class="food">
          <div class="food-icon" aria-hidden="true">${dish.icon}</div>

          <div class="food-info">
            <div class="food-top">
              <span class="type">${escapeHTML(dish.type)}</span>
              <span class="price">${money(dish.price)}</span>
            </div>

            <h3>${escapeHTML(dish.name)}</h3>
            <div class="desc">${escapeHTML(dish.desc)}</div>

            <div class="food-bottom">
              <span class="popular">★ ${escapeHTML(dish.pop)}</span>
              <button class="add" onclick="addToCart(${dish.id})">
                ＋ Add
              </button>
            </div>
          </div>
        </article>
      `).join("")
    : "<p>No dishes found. Try another search or category.</p>";
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderMenu();
  });
});

byId("search").addEventListener("input", renderMenu);

/* =========================================
   CART
========================================= */

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  renderRecommendations();
  byId("status").textContent = "";
}

function changeQuantity(id, amount) {
  cart[id] = (cart[id] || 0) + amount;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  renderCart();
  renderRecommendations();
}

function cartTotals() {
  let subtotal = 0;
  let count = 0;

  Object.entries(cart).forEach(([id, quantity]) => {
    const dish = dishes.find(item => item.id === Number(id));

    if (dish) {
      subtotal += dish.price * quantity;
      count += quantity;
    }
  });

  const gst = subtotal * 0.05;

  return {
    subtotal,
    gst,
    total: subtotal + gst,
    count
  };
}

function renderCart() {
  const entries = Object.entries(cart);
  const totals = cartTotals();

  if (entries.length === 0) {
    byId("cart-items").innerHTML = `
      <div class="empty">
        🛍️<br>
        Your basket is empty.<br>
        Add any dish you like to get started.
      </div>
    `;
  } else {
    byId("cart-items").innerHTML = entries.map(([id, quantity]) => {
      const dish = dishes.find(item => item.id === Number(id));

      if (!dish) return "";

      return `
        <div class="cart-row">
          <div class="row-head">
            <span>${dish.icon} ${escapeHTML(dish.name)}</span>
            <span>${money(dish.price * quantity)}</span>
          </div>

          <div class="row-sub">
            <span>${money(dish.price)} each</span>

            <div class="qty">
              <button
                onclick="changeQuantity(${dish.id}, -1)"
                aria-label="Remove one ${escapeHTML(dish.name)}"
              >−</button>

              <b>${quantity}</b>

              <button
                onclick="changeQuantity(${dish.id}, 1)"
                aria-label="Add one ${escapeHTML(dish.name)}"
              >＋</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  byId("count").textContent =
    `${totals.count} item${totals.count === 1 ? "" : "s"}`;

  byId("header-count").textContent = totals.count;
  byId("subtotal").textContent = money(totals.subtotal);
  byId("gst").textContent = money(totals.gst);
  byId("grand").textContent = money(totals.total);
}

/* =========================================
   OPTIONAL RECOMMENDATIONS
========================================= */

function hasCategory(type) {
  return Object.keys(cart).some(id => {
    const dish = dishes.find(item => item.id === Number(id));
    return dish && dish.type === type;
  });
}

function availableSuggestions(type) {
  return dishes
    .filter(dish => dish.type === type && !cart[dish.id])
    .slice(0, 3);
}

function getRecommendationGroups() {
  const groups = [];

  if (!hasCategory("Soup")) {
    groups.push({
      key: "soup",
      title: "Start with a soup?",
      description: "A warm start, if you feel like it.",
      items: availableSuggestions("Soup")
    });
  }

  if (hasCategory("Main Course") && !hasCategory("Beverage")) {
    groups.push({
      key: "drink",
      title: "Fancy a drink with that?",
      description: "A fresh juice or cooler could pair nicely.",
      items: availableSuggestions("Beverage")
    });
  }

  if (hasCategory("Main Course") && !hasCategory("Dessert")) {
    groups.push({
      key: "dessert",
      title: "Something sweet afterwards?",
      description: "Only if you want dessert.",
      items: availableSuggestions("Dessert")
    });
  }

  if (!hasCategory("Main Course")) {
    groups.push({
      key: "main",
      title: "Looking for a main course?",
      description: "Here are a few popular main dishes.",
      items: availableSuggestions("Main Course")
    });
  }

  return groups.filter(group => group.items.length > 0);
}

function skipSuggestionGroup(key) {
  dismissedSuggestions.add(key);
  renderRecommendations();
}

function showAllRecs() {
  suggestionsHidden = false;
  dismissedSuggestions.clear();
  renderRecommendations();
}

function hideAllRecs() {
  suggestionsHidden = true;
  renderRecommendations();
}

function renderRecommendations() {
  const container = byId("rec-groups");
  const hiddenMessage = byId("all-hidden");

  hiddenMessage.hidden = !suggestionsHidden;

  byId("rec-subtitle").textContent =
    Object.keys(cart).length > 0
      ? "Optional ideas based on your basket. Skip anything you do not want."
      : "A few optional ideas. Feel free to skip them.";

  if (suggestionsHidden) {
    container.innerHTML = "";
    return;
  }

  const groups = getRecommendationGroups().filter(
    group => !dismissedSuggestions.has(group.key)
  );

  if (!groups.length) {
    container.innerHTML = `
      <div class="dismissed">
        <span>No more suggestions right now. Your basket is ready.</span>
        <button class="text-button" onclick="showAllRecs()">
          Show suggestions again
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = groups.map(group => `
    <div class="rec-group">
      <div class="rec-group-top">
        <div>
          <h3>${escapeHTML(group.title)}</h3>
          <div class="staff-muted">${escapeHTML(group.description)}</div>
        </div>

        <button
          class="skip"
          onclick="skipSuggestionGroup('${group.key}')"
        >Skip this ×</button>
      </div>

      <div class="rec-cards">
        ${group.items.map(dish => `
          <div class="rec-card">
            <div class="rec-icon">${dish.icon}</div>

            <div class="rec-info">
              <strong>${escapeHTML(dish.name)}</strong>
              <small>${escapeHTML(dish.desc)}</small>

              <div class="rec-bottom">
                <b>${money(dish.price)}</b>
                <button
                  class="rec-add"
                  onclick="addToCart(${dish.id})"
                >＋ Add</button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

/* =========================================
   CHECKOUT
========================================= */

function openCheckout() {
  if (Object.keys(cart).length === 0) {
    byId("status").textContent =
      "Please add at least one dish before placing an order.";
    return;
  }

  resetCheckout();
  byId("modal-backdrop").style.display = "flex";
}

function closeCheckout() {
  byId("modal-backdrop").style.display = "none";
}

function resetCheckout() {
  byId("modal-title").textContent = "Your order details";
  byId("order-result").hidden = true;
  byId("order-result").innerHTML = "";
  document.querySelector(".modal-actions").hidden = false;
  document.querySelector(".form-grid").hidden = false;

  document.querySelector(".modal > p").textContent =
    "Enter your details to create a demo order confirmation. This prototype does not actually send emails or take payments.";
}

function buildOrderItems() {
  return Object.entries(cart).map(([id, quantity]) => {
    const dish = dishes.find(item => item.id === Number(id));

    return {
      name: dish.name,
      price: dish.price,
      quantity
    };
  });
}

function placeOrder() {
  const name = byId("cust-name").value.trim();
  const email = byId("cust-email").value.trim();
  const phone = byId("cust-phone").value.trim();
  const payment = byId("payment").value;

  if (!name) {
    alert("Please enter your name.");
    byId("cust-name").focus();
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address.");
    byId("cust-email").focus();
    return;
  }

  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty.");
    closeCheckout();
    return;
  }

  const totals = cartTotals();
  const orderId = "SG" + Math.floor(100000 + Math.random() * 900000);

  const order = {
    orderId,
    name,
    email,
    phone,
    payment,
    items: buildOrderItems(),
    subtotal: totals.subtotal,
    total: totals.total,
    status: "Received",
    createdAt: new Date().toISOString()
  };

  lastOrder = order;

  /*
    This saves the demo order in the current browser.
    It does not send the order to a remote server.
  */
  const orders = readOrders();
  orders.unshift(order);

  const saved = saveOrders(orders);

  showOrderConfirmation(order, saved);

  cart = {};
  renderCart();
  renderRecommendations();

  byId("status").textContent =
    "Your demo order was created. See the confirmation window.";
}

function showOrderConfirmation(order, saved) {
  const itemLines = order.items.map(item =>
    `<li>${item.quantity} × ${escapeHTML(item.name)} — ${money(item.price * item.quantity)}</li>`
  ).join("");

  byId("modal-title").textContent = "Order confirmation";
  document.querySelector(".modal > p").textContent =
    "Your demo order has been created. Review the confirmation and notification previews.";

  document.querySelector(".form-grid").hidden = true;
  document.querySelector(".modal-actions").hidden = true;

  byId("order-result").hidden = false;
  byId("order-result").innerHTML = `
    <div class="order-success">
      <h3>✓ Order ${escapeHTML(order.orderId)} received</h3>
      <p>Thank you, ${escapeHTML(order.name)}!</p>
      <p>
        <strong>Order total:</strong> ${money(order.total)}<br>
        <strong>Status:</strong> Received<br>
        <strong>Preparation estimate:</strong>
        10–15 minutes after staff acceptance
      </p>
      <ul>${itemLines}</ul>
    </div>

    <div class="email-card">
      <h4>Customer confirmation — preview</h4>
      <p><strong>To:</strong> ${escapeHTML(order.email)}</p>
      <p><strong>Subject:</strong> Order ${escapeHTML(order.orderId)} confirmed — Spice Garden</p>
      <p>Hello ${escapeHTML(order.name)}, your demo order has been recorded.</p>
      <p><strong>Total:</strong> ${money(order.total)}</p>
    </div>

    <div class="email-card">
      <h4>Restaurant staff notification — preview</h4>
      <p><strong>To:</strong> restaurant-staff@example.com</p>
      <p><strong>Order:</strong> ${escapeHTML(order.orderId)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.name)}</p>
      <p><strong>Items:</strong> ${order.items.map(item =>
        `${item.quantity} × ${escapeHTML(item.name)}`
      ).join(", ")}</p>
      <p><strong>Total:</strong> ${money(order.total)}</p>
    </div>

    <div class="email-card">
      <h4>Payment status</h4>
      <p><strong>Selected method:</strong> ${escapeHTML(order.payment)}</p>
      <p><strong>Payment status:</strong> Not processed — demo only.</p>
      <p>No payment was charged or verified.</p>
    </div>

    <div class="email-note">
      ${saved
        ? "This demo order was saved in this browser and can appear in its staff dashboard."
        : "The order confirmation is visible, but the browser could not save the order."}
      These notification previews are not actual emails. Real email sending, payment processing,
      and shared orders require connected backend services.
    </div>

    <div class="modal-actions" style="display:flex">
      <button class="secondary" onclick="closeCheckout()">Close</button>
      <button class="primary" onclick="copyOrderSummary()">Copy order summary</button>
    </div>
  `;
}

function copyOrderSummary() {
  if (!lastOrder) return;

  const summary = [
    `Spice Garden demo order ${lastOrder.orderId}`,
    `Customer: ${lastOrder.name}`,
    `Email: ${lastOrder.email}`,
    `Items: ${lastOrder.items.map(item =>
      `${item.quantity} x ${item.name}`
    ).join(", ")}`,
    `Total: ${money(lastOrder.total)}`,
    "Payment status: not processed (demo)"
  ].join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(summary)
      .then(() => alert("Order summary copied."))
      .catch(() => window.prompt("Copy your order summary:", summary));
  } else {
    window.prompt("Copy your order summary:", summary);
  }
}

/* =========================================
   STAFF LOGIN AND DASHBOARD
========================================= */

function enterCustomer() {
  byId("role-chooser").style.display = "none";
}

function enterStaff() {
  byId("role-chooser").style.display = "none";
  openStaff();
}

function openStaff() {
  byId("staff-backdrop").style.display = "flex";

  byId("staff-login").hidden = staffAuthenticated;
  byId("staff-dashboard").hidden = !staffAuthenticated;

  if (staffAuthenticated) {
    renderStaffOrders();
  }
}

function closeStaff() {
  byId("staff-backdrop").style.display = "none";
}

function staffLogin() {
  const username = byId("staff-user").value.trim();
  const password = byId("staff-pass").value;

  /*
    Demo credentials only.
    Real websites need secure server-side authentication.
  */
  if (username === "staff" && password === "spice123") {
    staffAuthenticated = true;
    byId("staff-login").hidden = true;
    byId("staff-dashboard").hidden = false;
    byId("staff-login-error").textContent = "";
    renderStaffOrders();
  } else {
    byId("staff-login-error").textContent =
      "Incorrect username or password. Please try again.";
  }
}

function staffLogout() {
  staffAuthenticated = false;
  byId("staff-dashboard").hidden = true;
  byId("staff-login").hidden = false;
  byId("staff-pass").value = "";
  byId("staff-user").value = "";
}

function updateStaffOrder(orderId, status) {
  const orders = readOrders();
  const order = orders.find(item => item.orderId === orderId);

  if (!order) {
    alert("Order not found in this browser.");
    renderStaffOrders();
    return;
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  saveOrders(orders);
  renderStaffOrders();
}

function renderStaffOrders() {
  if (!staffAuthenticated) return;

  const orders = readOrders();
  const container = byId("staff-orders");

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="staff-empty">
        No orders yet. Place a demo order from the customer page first.
      </div>
    `;
    return;
  }

  const validStatuses = [
    "Received",
    "Accepted",
    "Preparing",
    "Ready for pickup",
    "Completed",
    "Cancelled"
  ];

  container.innerHTML = orders.map(order => {
    const items = Array.isArray(order.items) ? order.items : [];
    const status = validStatuses.includes(order.status)
      ? order.status
      : "Received";

    const orderItems = items.map(item => `
      <li>
        ${Number(item.quantity)} × ${escapeHTML(item.name)}
        — ${money(Number(item.price) * Number(item.quantity))}
      </li>
    `).join("");

    const options = validStatuses.map(option => `
      <option value="${option}" ${status === option ? "selected" : ""}>
        ${option}
      </option>
    `).join("");

    return `
      <article class="staff-order">
        <div class="staff-order-head">
          <div>
            <h3>Order ${escapeHTML(order.orderId)}</h3>
            <div class="staff-muted">
              ${escapeHTML(new Date(order.createdAt).toLocaleString())}
            </div>
          </div>
          <span class="staff-status">${escapeHTML(status)}</span>
        </div>

        <p style="font-size:12px;line-height:1.8">
          <strong>Customer:</strong> ${escapeHTML(order.name)}<br>
          <strong>Email:</strong> ${escapeHTML(order.email)}<br>
          <strong>Phone:</strong> ${escapeHTML(order.phone || "Not provided")}<br>
          <strong>Payment selection:</strong> ${escapeHTML(order.payment)} (demo)
        </p>

        <strong style="font-size:12px">Items</strong>
        <ul>${orderItems}</ul>

        <p><strong>Total: ${money(Number(order.total) || 0)}</strong></p>

        <div class="staff-order-actions">
          <label
            class="staff-muted"
            for="status-${escapeHTML(order.orderId)}"
          >Update status</label>

          <select
            id="status-${escapeHTML(order.orderId)}"
            onchange="updateStaffOrder('${escapeHTML(order.orderId)}', this.value)"
          >
            ${options}
          </select>
        </div>
      </article>
    `;
  }).join("");
}

/* Refresh the staff view if this browser changes the saved orders. */
window.addEventListener("storage", event => {
  if (event.key === "spiceGardenOrders" && staffAuthenticated) {
    renderStaffOrders();
  }
});

/* =========================================
   INITIAL PAGE SETUP
========================================= */

renderMenu();
renderCart();
renderRecommendations();