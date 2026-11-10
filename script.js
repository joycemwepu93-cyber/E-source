const API_URL = new URL("src/api/index.php", document.baseURI).toString();

let products = [];
let selectedCategory = "Tout";
let toastTimer;

const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const filters = document.querySelector("#filters");

async function apiGet(action) {
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Le serveur a retourné une réponse invalide.");
  }

  if (!response.ok || result.success !== true) {
    throw new Error(result.error || `Erreur serveur (${response.status}).`);
  }
  return result.data;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function createFilterButtons(categories) {
  const names = ["Tout", ...categories.map(category => category.name)];
  filters.replaceChildren();

  names.forEach(name => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter" + (name === selectedCategory ? " active" : "");
    button.dataset.category = name;
    button.textContent = name;
    filters.append(button);
  });
}

function formatPrice(price, currency) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Prix à confirmer";
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency || "USD"}`;
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  const visible = products.filter(product => {
    const categoryMatch = selectedCategory === "Tout" ||
      product.category === selectedCategory ||
      (selectedCategory === "Chaussures" && product.category === "Chaussures");
    const searchMatch = [product.name, product.category, product.description]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("fr")
      .includes(query);
    return categoryMatch && searchMatch;
  });

  document.querySelector("#productTotal").textContent =
    `${visible.length} ${visible.length > 1 ? "articles" : "article"}`;

  grid.replaceChildren();

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Aucun article ne correspond à votre recherche.";
    grid.append(empty);
    return;
  }

  visible.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image";

    const image = document.createElement("img");
    image.src = product.image_url || "https://placehold.co/800x1000?text=E-source";
    image.alt = product.name;
    image.loading = "lazy";
    image.onerror = () => {
      image.onerror = null;
      image.src = "https://placehold.co/800x1000?text=Image+indisponible";
    };

    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = product.category || "Autres";
    imageWrap.append(image, tag);

    const info = document.createElement("div");
    info.className = "product-info";

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category || "Boutique";

    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.name;

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatPrice(product.price, product.currency);

    const stock = document.createElement("span");
    stock.className = "product-category";
    const quantity = Number(product.stock_quantity);
    stock.textContent = quantity > 0 ? `En stock : ${quantity}` : "Rupture de stock";

    bottom.append(price);
    info.append(category, name, bottom, stock);
    card.append(imageWrap, info);
    grid.append(card);
  });
}

function selectCategory(category) {
  selectedCategory = category;
  filters.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.category === category);
  });
  renderProducts();
}

filters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (button) selectCategory(button.dataset.category);
});

document.querySelectorAll("[data-nav-category]").forEach(link => {
  link.addEventListener("click", () => selectCategory(link.dataset.navCategory));
});

searchInput.addEventListener("input", renderProducts);

document.querySelector("#cartButton").addEventListener("click", () => {
  showToast("Le panier connecté sera finalisé à l’étape suivante.");
});

async function initializeCatalog() {
  grid.textContent = "Chargement du catalogue…";

  try {
    const [categoryData, productData] = await Promise.all([
      apiGet("categories"),
      apiGet("products")
    ]);

    products = Array.isArray(productData) ? productData : [];
    createFilterButtons(Array.isArray(categoryData) ? categoryData : []);
    renderProducts();
  } catch (error) {
    grid.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = `Impossible de charger le catalogue : ${error.message} Vérifiez que XAMPP (Apache et MySQL) est démarré et que la base e_source est configurée.`;
    grid.append(message);
    document.querySelector("#productTotal").textContent = "Catalogue indisponible";
  }
}

document.querySelector("#year").textContent = new Date().getFullYear();
initializeCatalog();
