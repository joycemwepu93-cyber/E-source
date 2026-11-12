const API_URL = new URL("src/api/index.php", document.baseURI).toString();
const GITHUB_IMAGES = [
"WhatsApp Image 2026-10-31 at 18.15.40 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.40.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.41 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.41.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.42 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.42.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.43 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.43.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.45.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.46.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.47.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.48.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.49.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.50 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.50.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.51.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.52 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.54 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.54.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.55 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.55 (2).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.55.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.56 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.56.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.57 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.57.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.58 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.15.58.jpeg",
"WhatsApp Image 2026-10-31 at 18.15.59.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.00.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.01 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.16.01.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.02.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.03.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.04 (1).jpeg",
"WhatsApp Image 2026-10-31 at 18.16.04.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.05.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.06.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.07.jpeg",
"WhatsApp Image 2026-10-31 at 18.16.23.jpeg"
];
let products = [];
let selectedCategory = "Tout";
let toastTimer;
const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const filters = document.querySelector("#filters");

function imageUrl(filename) {
  return "https://raw.githubusercontent.com/joycemwepu93-cyber/E-source/main/documentation/photoEcommerce/" +
    filename.split("/").map(encodeURIComponent).join("/");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

async function apiGet(action) {
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error("Le serveur a retourné une réponse invalide."); }
  if (!response.ok || result.success !== true) {
    throw new Error(result.error || `Erreur serveur (${response.status}).`);
  }
  return result.data;
}

function createFilterButtons() {
  const names = ["Tout", "Femmes", "Hommes", "Enfants", "Autres"];
  filters.replaceChildren();
  names.forEach(name => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter" + (name === selectedCategory ? " active" : "");
    button.dataset.category = name;
    button.textContent = name === "Tout" ? "Tout voir" : name;
    filters.append(button);
  });
}

function formatPrice(price, currency) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Prix à confirmer";
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency || "USD"}`;
}

function categoryGroup(category) {
  const value = String(category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/femme|women/.test(value)) return "Femmes";
  if (/homme|men/.test(value)) return "Hommes";
  if (/enfant|kids|baby/.test(value)) return "Enfants";
  return "Autres";
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  const visible = products.map((product, index) => ({ product, index })).filter(({ product }) => {
    const categoryMatch = selectedCategory === "Tout" ||
      categoryGroup(product.category) === selectedCategory;
    const searchMatch = [product.name, product.category, product.description]
      .filter(Boolean).join(" ").toLocaleLowerCase("fr").includes(query);
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
  visible.forEach(({ product, index }) => {
    const card = document.createElement("article");
    card.className = "product-card";
    const imageWrap = document.createElement("button");
    imageWrap.type = "button";
    imageWrap.className = "product-image product-image-button";
    imageWrap.dataset.openProduct = String(index);
    imageWrap.setAttribute("aria-label", `Voir les détails de ${product.name || "cet article"}`);
    const image = document.createElement("img");
    image.src = product.image_url || imageUrl(GITHUB_IMAGES[index % 8]);
    image.alt = product.name || "Article E-source";
    image.loading = "lazy";
    image.onerror = () => {
      image.onerror = null;
      image.src = "https://placehold.co/800x1000/f1eee7/17243b?text=E-SOURCE";
    };
    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = product.category || "Sélection";
    imageWrap.append(image, tag);
    const info = document.createElement("div");
    info.className = "product-info";
    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category || "E-source";
    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.name || "Article E-source";
    const bottom = document.createElement("div");
    bottom.className = "product-bottom";
    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatPrice(product.price, product.currency);
    const stock = document.createElement("span");
    const quantity = Number(product.stock_quantity);
    stock.className = "product-stock" + (quantity > 0 ? "" : " out");
    stock.textContent = quantity > 0 ? "Disponible" : "Indisponible";
    bottom.append(price, stock);
    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "product-details-button";
    detailsButton.dataset.openProduct = String(index);
    detailsButton.textContent = "Voir les détails";
    info.append(category, name, bottom, detailsButton);
    card.append(imageWrap, info);
    grid.append(card);
  });
}

function categoryDescription(category) {
  const group = categoryGroup(category);
  const descriptions = {
    Femmes: "Découvrez cette pièce de la sélection Femme de Boutique La Source. Pour connaître les matières, les tailles disponibles et les conseils d'entretien, contactez notre équipe.",
    Hommes: "Découvrez cette pièce de la sélection Homme de Boutique La Source. Pour connaître les matières, les tailles disponibles et les conseils d'entretien, contactez notre équipe.",
    Enfants: "Découvrez cet article de la sélection Enfant de Boutique La Source. Pour connaître les tailles disponibles et les détails, contactez notre équipe.",
    Autres: "Découvrez cet article parmi les chaussures, sacs et accessoires sélectionnés par Boutique La Source. Contactez notre équipe pour obtenir tous les détails."
  };
  return descriptions[group];
}

function openProductDetails(index) {
  const product = products[index];
  if (!product) return;
  const modal = document.querySelector("#productModal");
  const image = document.querySelector("#detailImage");
  image.src = product.image_url || "https://placehold.co/900x1100/f1eee7/17243b?text=E-SOURCE";
  image.alt = product.name || "Article E-source";
  image.onerror = () => {
    image.onerror = null;
    image.src = "https://placehold.co/900x1100/f1eee7/17243b?text=E-SOURCE";
  };
  document.querySelector("#detailCategory").textContent = product.category || "Collection E-source";
  document.querySelector("#detailName").textContent = product.name || "Article E-source";
  document.querySelector("#detailPrice").textContent = formatPrice(product.price, product.currency);
  document.querySelector("#detailDescription").textContent =
    product.description?.trim() || categoryDescription(product.category);
  const quantity = Number(product.stock_quantity);
  const stock = document.querySelector("#detailStock");
  stock.textContent = quantity > 0 ? "● Disponible en boutique" : "● Actuellement indisponible";
  stock.classList.toggle("out", !(quantity > 0));
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

grid.addEventListener("click", event => {
  const trigger = event.target.closest("[data-open-product]");
  if (trigger) openProductDetails(Number(trigger.dataset.openProduct));
});

const productModal = document.querySelector("#productModal");
function closeProductModal() {
  if (typeof productModal.close === "function" && productModal.open) productModal.close();
  else productModal.removeAttribute("open");
}
document.querySelector("#modalClose").addEventListener("click", closeProductModal);
document.querySelector("#modalDone").addEventListener("click", closeProductModal);
productModal.addEventListener("click", event => {
  if (event.target === productModal) closeProductModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeProductModal();
});

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
  link.addEventListener("click", () => {
    selectCategory(link.dataset.navCategory);
    document.querySelector("#mainNav")?.classList.remove("open");
    document.querySelector("#menuToggle")?.setAttribute("aria-expanded", "false");
  });
});
searchInput.addEventListener("input", renderProducts);
document.querySelector("#cartButton").addEventListener("click", () => {
  showToast("Le panier connecté sera disponible dans la prochaine étape.");
});

function renderLookbook() {
  const track = document.querySelector("#lookbookTrack");
  if (!track) return;
  GITHUB_IMAGES.forEach((filename, index) => {
    const item = document.createElement("figure");
    item.className = "lookbook-item";
    const image = document.createElement("img");
    image.src = imageUrl(filename);
    image.alt = `Inspiration mode E-source ${index + 1}`;
    image.loading = "lazy";
    image.onerror = () => item.remove();
    item.append(image);
    track.append(item);
  });
}

document.querySelector("#menuToggle").addEventListener("click", event => {
  const nav = document.querySelector("#mainNav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

async function initializeCatalog() {
  grid.innerHTML = '<div class="catalogue-loading"><span></span><p>Nous préparons votre sélection…</p></div>';
  try {
    const [categoryData, productData] = await Promise.all([
      apiGet("categories"), apiGet("products")
    ]);
    products = Array.isArray(productData) ? productData : [];
    createFilterButtons();
    renderProducts();
  } catch (error) {
    grid.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = `Impossible de charger le catalogue : ${error.message} Vérifiez que le serveur et la base de données sont démarrés.`;
    grid.append(message);
    document.querySelector("#productTotal").textContent = "Catalogue indisponible";
  }
}

document.querySelector("#year").textContent = new Date().getFullYear();
renderLookbook();
initializeCatalog();