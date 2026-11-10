const API_URL = "src/api/index.php";
let csrfToken = "";
let currentUser = null;
let products = [];
let cartItems = [];
let selectedCategory = "Tout";
let toastTimer;

const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function money(value, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {style:"currency", currency}).format(Number(value || 0));
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function openPanel(id) {
  document.querySelectorAll(".app-panel").forEach(panel => panel.hidden = panel.id !== id);
  document.body.style.overflow = "hidden";
}
function closePanels() {
  document.querySelectorAll(".app-panel").forEach(panel => panel.hidden = true);
  document.body.style.overflow = "";
}
document.querySelectorAll("[data-close-panel]").forEach(button => button.addEventListener("click", closePanels));
document.querySelectorAll(".app-panel").forEach(panel => panel.addEventListener("click", event => {
  if (event.target === panel) closePanels();
}));
document.addEventListener("keydown", event => { if (event.key === "Escape") closePanels(); });

async function api(action, options = {}) {
  const method = options.method || "GET";
  const headers = {"Accept":"application/json", ...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {})};
  if (method !== "GET" && method !== "HEAD" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  const response = await fetch(API_URL + "?action=" + encodeURIComponent(action) + (options.query || ""), {
    method, headers, credentials:"same-origin", body: options.body ? JSON.stringify(options.body) : undefined
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("Réponse du serveur illisible."); }
  if (!response.ok || result.success === false) throw new Error(result.error || "Une erreur est survenue.");
  if (result.csrf_token) csrfToken = result.csrf_token;
  return result;
}
async function init() {
  document.querySelector("#year").textContent = new Date().getFullYear();
  try {
    const token = await api("csrf");
    csrfToken = token.csrf_token;
    try { const me = await api("me"); currentUser = me.user; csrfToken = me.csrf_token || csrfToken; } catch {}
    await loadProducts();
    await refreshCartCount();
    updateAccountButton();
  } catch (error) {
    grid.innerHTML = '<p class="empty-state">La boutique ne peut pas joindre le serveur. Vérifiez la configuration PHP/MySQL et réessayez.</p>';
    notify(error.message);
  }
}
async function loadProducts() {
  const result = await api("products");
  products = result.data || [];
  renderProducts();
}
function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  const visible = products.filter(product => {
    const category = product.category || "";
    const categoryMatch = selectedCategory === "Tout" || category.toLocaleLowerCase("fr") === selectedCategory.toLocaleLowerCase("fr") ||
      (selectedCategory === "Chaussures" && category.toLocaleLowerCase("fr").includes("chauss")) ||
      (selectedCategory === "Accessoires" && category.toLocaleLowerCase("fr").includes("access"));
    const searchMatch = (product.name + " " + category + " " + (product.description || "")).toLocaleLowerCase("fr").includes(query);
    return categoryMatch && searchMatch;
  });
  document.querySelector("#productTotal").textContent = visible.length + (visible.length > 1 ? " articles" : " article");
  if (!visible.length) {
    grid.innerHTML = '<p class="empty-state">Aucun article disponible pour le moment.</p>';
    return;
  }
  grid.innerHTML = visible.map(product => {
    const image = product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=85";
    return `<article class="product-card">
      <div class="product-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy"><span class="product-tag">${escapeHtml(product.category || "E-SOURCE")}</span></div>
      <div class="product-info"><p class="product-category">${escapeHtml(product.category || "Boutique")}</p>
      <h3 class="product-name">${escapeHtml(product.name)}</h3>
      <div class="product-bottom"><span class="product-price">${money(product.price, product.currency || "USD")}</span>
      <button class="add-button" data-add="${Number(product.id)}" ${Number(product.stock_quantity) < 1 ? "disabled" : ""}>${Number(product.stock_quantity) < 1 ? "Indisponible" : "+ Ajouter"}</button></div>
      <p class="product-stock">${Number(product.stock_quantity) > 0 ? "En stock : " + Number(product.stock_quantity) : "Rupture de stock"}</p></div></article>`;
  }).join("");
}
function selectCategory(category) {
  selectedCategory = category;
  document.querySelectorAll(".filter").forEach(button => button.classList.toggle("active", button.dataset.category === category));
  renderProducts();
}
document.querySelector("#filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (button) selectCategory(button.dataset.category);
});
document.querySelectorAll("[data-nav-category]").forEach(link => link.addEventListener("click", () => selectCategory(link.dataset.navCategory)));
searchInput.addEventListener("input", renderProducts);

async function refreshCartCount() {
  if (!currentUser) { document.querySelector("#cartCount").textContent = "0"; return; }
  const result = await api("cart");
  cartItems = result.data || [];
  document.querySelector("#cartCount").textContent = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);
}
function updateAccountButton() {
  document.querySelector("#accountButton").textContent = currentUser ? (currentUser.first_name || "Mon compte") : "Connexion";
}
grid.addEventListener("click", async event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  if (!currentUser) { renderAuth(); openPanel("accountPanel"); notify("Connectez-vous pour ajouter un article au panier."); return; }
  try {
    await api("cart", {method:"POST", body:{product_id:Number(button.dataset.add), quantity:1}});
    await refreshCartCount();
    const product = products.find(item => Number(item.id) === Number(button.dataset.add));
    notify((product?.name || "Article") + " ajouté au panier.");
  } catch (error) { notify(error.message); }
});

function renderAuth(mode = "login") {
  const register = mode === "register";
  document.querySelector("#accountTitle").textContent = currentUser ? "Mon espace client" : (register ? "Créer un compte" : "Connexion");
  const content = document.querySelector("#accountContent");
  if (currentUser) {
    content.innerHTML = `<p>Bonjour <strong>${escapeHtml(currentUser.first_name)} ${escapeHtml(currentUser.last_name)}</strong>.</p>
      <p class="app-muted">${escapeHtml(currentUser.email)}</p>
      <div class="app-tabs"><button id="myOrdersButton">Mes commandes</button>${currentUser.role === "admin" ? '<button id="adminOpenButton">Administration</button>' : ""}</div>
      <button class="app-submit" id="logoutButton">Se déconnecter</button>`;
    document.querySelector("#logoutButton").addEventListener("click", logout);
    document.querySelector("#myOrdersButton").addEventListener("click", showMyOrders);
    document.querySelector("#adminOpenButton")?.addEventListener("click", showAdmin);
    return;
  }
  content.innerHTML = `<form class="app-form" id="authForm">
    ${register ? '<label>Prénom<input name="first_name" required autocomplete="given-name"></label><label>Nom<input name="last_name" required autocomplete="family-name"></label><label>Téléphone<input name="phone" autocomplete="tel"></label>' : ""}
    <label>Adresse e-mail<input name="email" type="email" required autocomplete="email"></label>
    <label>Mot de passe<input name="password" type="password" minlength="${register ? "10" : "1"}" required autocomplete="${register ? "new-password" : "current-password"}"></label>
    <button class="app-submit" type="submit">${register ? "Créer mon compte" : "Se connecter"}</button></form>
    <button class="app-link" id="switchAuth">${register ? "J'ai déjà un compte — me connecter" : "Créer un nouveau compte"}</button>`;
  content.querySelector("#switchAuth").addEventListener("click", () => renderAuth(register ? "login" : "register"));
  content.querySelector("#authForm").addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await api(register ? "register" : "login", {method:"POST", body:data});
      currentUser = result.user; csrfToken = result.csrf_token || csrfToken;
      updateAccountButton(); await refreshCartCount(); renderAuth(); notify("Bienvenue chez E-SOURCE !");
    } catch (error) { notify(error.message); }
  });
}
async function logout() {
  try { await api("logout", {method:"POST", body:{}}); currentUser = null; cartItems = []; updateAccountButton(); await refreshCartCount(); closePanels(); notify("Vous êtes déconnecté."); }
  catch (error) { notify(error.message); }
}
document.querySelector("#accountButton").addEventListener("click", () => { renderAuth(); openPanel("accountPanel"); });

async function showCart() {
  if (!currentUser) { renderAuth(); openPanel("accountPanel"); return; }
  try {
    await refreshCartCount();
    const content = document.querySelector("#cartContent");
    if (!cartItems.length) {
      content.innerHTML = '<p class="app-muted">Votre panier est encore vide. Découvrez notre catalogue.</p>';
      openPanel("cartPanel"); return;
    }
    const total = cartItems.reduce((sum,item) => sum + Number(item.price) * Number(item.quantity), 0);
    const currency = cartItems[0].currency || "USD";
    content.innerHTML = cartItems.map(item => `<div class="app-row"><div><strong>${escapeHtml(item.name)}</strong><small>${money(item.price,item.currency)} · Stock : ${Number(item.stock_quantity)}</small></div>
      <div class="app-qty"><button data-qty="${Number(item.product_id)}" data-value="${Math.max(1,Number(item.quantity)-1)}">−</button><span>${Number(item.quantity)}</span><button data-qty="${Number(item.product_id)}" data-value="${Number(item.quantity)+1}">+</button><button class="app-remove" data-remove="${Number(item.product_id)}">×</button></div></div>`).join("") +
      `<div class="app-total"><span>Total</span><span>${money(total,currency)}</span></div>
      <form class="app-form" id="checkoutForm"><label>Mode de paiement<select name="payment_method"><option value="cash">Espèces à la livraison / au retrait</option><option value="mobile_money">Mobile Money (validation manuelle pour le moment)</option><option value="credit">Crédit client (si autorisé)</option></select></label>
      <label>Note (facultatif)<textarea name="customer_note"></textarea></label><button class="app-submit">Confirmer la commande</button></form>
      <p class="app-muted">Le crédit doit être autorisé par la boutique. Le paiement Mobile Money en ligne nécessite encore la connexion à un opérateur.</p>`;
    content.querySelectorAll("[data-qty]").forEach(button => button.addEventListener("click", async () => {
      try { await api("cart",{method:"PATCH",body:{product_id:Number(button.dataset.qty),quantity:Number(button.dataset.value)}}); await showCart(); await refreshCartCount(); }
      catch(error){notify(error.message);}
    }));
    content.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", async () => {
      try { await api("cart",{method:"DELETE",body:{product_id:Number(button.dataset.remove)}}); await showCart(); await refreshCartCount(); }
      catch(error){notify(error.message);}
    }));
    content.querySelector("#checkoutForm").addEventListener("submit", async event => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        const result = await api("orders",{method:"POST",body});
        await refreshCartCount(); closePanels();
        notify("Commande " + result.order.order_number + " enregistrée.");
        await loadProducts();
      } catch(error){notify(error.message);}
    });
    openPanel("cartPanel");
  } catch(error){notify(error.message);}
}
document.querySelector("#cartButton").addEventListener("click", showCart);

async function showMyOrders() {
  try {
    const result = await api("orders");
    const content = document.querySelector("#accountContent");
    content.innerHTML = '<button class="app-link" id="backAccount">← Retour au compte</button><h3>Mes commandes</h3>' +
      (result.data.length ? result.data.map(order => `<div class="app-row"><div><strong>${escapeHtml(order.order_number)}</strong><small>${new Date(order.created_at).toLocaleDateString("fr-FR")} · ${escapeHtml(order.payment_method)} · ${escapeHtml(order.payment_status)}</small></div><div>${money(order.total_amount,order.currency)}</div></div>`).join("") : '<p class="app-muted">Vous n’avez pas encore passé de commande.</p>');
    content.querySelector("#backAccount").addEventListener("click", () => renderAuth());
  } catch(error){notify(error.message);}
}

async function showAdmin(tab = "products") {
  if (!currentUser || currentUser.role !== "admin") { notify("Accès administrateur requis."); return; }
  openPanel("adminPanel");
  const content = document.querySelector("#adminContent");
  content.innerHTML = '<p class="app-muted">Chargement de votre espace de gestion…</p>';
  try {
    const [productsResult,categoriesResult,ordersResult,customersResult] = await Promise.all([
      api("admin/products"), api("categories"), api("admin/orders"), api("admin/customers")
    ]);
    const categories = categoriesResult.data || [];
    const tabs = `<div class="app-tabs"><button data-tab="products" class="${tab==="products"?"active":""}">Produits</button><button data-tab="orders" class="${tab==="orders"?"active":""}">Commandes</button><button data-tab="customers" class="${tab==="customers"?"active":""}">Clients</button><button data-tab="categories" class="${tab==="categories"?"active":""}">Catégories</button></div>`;
    let body = "";
    if (tab === "products") {
      body = `<h3>Ajouter un produit</h3><form class="admin-form" id="productForm">
        <input name="name" placeholder="Nom du produit" required><select name="category_id"><option value="">Catégorie</option>${categories.map(c=>`<option value="${Number(c.id)}">${escapeHtml(c.name)}</option>`).join("")}</select>
        <input name="price" type="number" step="0.01" min="0" placeholder="Prix" required><input name="stock_quantity" type="number" min="0" placeholder="Stock" required>
        <input name="currency" value="USD" maxlength="3" placeholder="Devise"><input name="image_url" type="url" placeholder="URL de l'image">
        <textarea class="full" name="description" placeholder="Description"></textarea><label class="full"><input type="checkbox" name="is_active" checked> Produit visible dans le catalogue</label><button class="app-submit full">Enregistrer le produit</button></form>
        <h3>Produits du catalogue</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Action</th></tr></thead><tbody>${productsResult.data.map(p=>`<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category||"—")}</td><td>${money(p.price,p.currency)}</td><td>${Number(p.stock_quantity)}</td><td><button class="app-link app-danger" data-deactivate="${Number(p.id)}">Désactiver</button></td></tr>`).join("")}</tbody></table></div>`;
    } else if (tab === "orders") {
      body = '<h3>Commandes reçues</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Référence</th><th>Client</th><th>Total</th><th>Paiement</th><th>Statut</th><th>Enregistrer</th></tr></thead><tbody>' +
        ordersResult.data.map(o=>`<tr><td>${escapeHtml(o.order_number)}</td><td>${escapeHtml(o.first_name)} ${escapeHtml(o.last_name)}</td><td>${money(o.total_amount,o.currency)}</td><td>${escapeHtml(o.payment_method)} / ${escapeHtml(o.payment_status)}</td><td><select data-order-status="${Number(o.id)}">${["pending","confirmed","processing","shipped","completed","cancelled"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></td><td><button class="app-link" data-save-order="${Number(o.id)}">Sauver</button></td></tr>`).join("") + '</tbody></table></div>';
    } else if (tab === "customers") {
      body = '<h3>Clients et autorisations de crédit</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Client</th><th>E-mail</th><th>Crédit autorisé</th><th>Compte actif</th><th>Enregistrer</th></tr></thead><tbody>' +
        customersResult.data.map(c=>`<tr><td>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</td><td>${escapeHtml(c.email)}</td><td><input type="checkbox" data-credit="${Number(c.id)}" ${Number(c.credit_eligible)?"checked":""}></td><td><input type="checkbox" data-customer-active="${Number(c.id)}" ${Number(c.is_active)?"checked":""}></td><td><button class="app-link" data-save-customer="${Number(c.id)}">Sauver</button></td></tr>`).join("") + '</tbody></table></div>';
    } else {
      body = `<h3>Ajouter une catégorie</h3><form class="admin-form" id="categoryForm"><input name="name" placeholder="Nom de la catégorie" required><button class="app-submit">Ajouter</button></form><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Catégorie</th><th>Identifiant</th></tr></thead><tbody>${categories.map(c=>`<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.slug)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    content.innerHTML = tabs + body;
    content.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>showAdmin(button.dataset.tab)));
    content.querySelector("#productForm")?.addEventListener("submit",async event=>{
      event.preventDefault();const d=Object.fromEntries(new FormData(event.currentTarget).entries());d.is_active=event.currentTarget.querySelector('[name="is_active"]').checked;
      try{await api("admin/products",{method:"POST",body:d});notify("Produit enregistré.");await loadProducts();showAdmin("products");}catch(e){notify(e.message);}
    });
    content.querySelectorAll("[data-deactivate]").forEach(button=>button.addEventListener("click",async()=>{
      try{await api("admin/products",{method:"DELETE",query:"&id="+button.dataset.deactivate});notify("Produit désactivé.");await loadProducts();showAdmin("products");}catch(e){notify(e.message);}
    }));
    content.querySelectorAll("[data-save-order]").forEach(button=>button.addEventListener("click",async()=>{
      const id=button.dataset.saveOrder;const status=content.querySelector('[data-order-status="'+id+'"]').value;
      try{await api("admin/orders",{method:"PATCH",body:{order_id:Number(id),status}});notify("Statut de commande mis à jour.");}catch(e){notify(e.message);}
    }));
    content.querySelectorAll("[data-save-customer]").forEach(button=>button.addEventListener("click",async()=>{
      const id=button.dataset.saveCustomer;const credit=content.querySelector('[data-credit="'+id+'"]').checked;const active=content.querySelector('[data-customer-active="'+id+'"]').checked;
      try{await api("admin/customers",{method:"PATCH",body:{user_id:Number(id),credit_eligible:credit,is_active:active}});notify("Fiche client mise à jour.");}catch(e){notify(e.message);}
    }));
    content.querySelector("#categoryForm")?.addEventListener("submit",async event=>{
      event.preventDefault();const d=Object.fromEntries(new FormData(event.currentTarget).entries());
      try{await api("admin/categories",{method:"POST",body:d});notify("Catégorie ajoutée.");showAdmin("categories");}catch(e){notify(e.message);}
    });
  } catch(error) { content.innerHTML = '<p class="app-status">'+escapeHtml(error.message)+'</p>'; }
}
document.querySelector("#adminContent").addEventListener("click",event=>{if(event.target.id==="adminOpenButton")showAdmin();});
init();
