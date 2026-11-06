const products = [
  {id:1,name:"Chemise classique",category:"Hommes",type:"Vêtements",price:28,image:"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85"},
  {id:2,name:"Ensemble élégant",category:"Femmes",type:"Vêtements",price:42,image:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85"},
  {id:3,name:"Sneakers urbaines",category:"Chaussures",type:"Chaussures",price:55,image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85"},
  {id:4,name:"Veste décontractée",category:"Hommes",type:"Vêtements",price:48,image:"https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85"},
  {id:5,name:"Sac du quotidien",category:"Accessoires",type:"Accessoires",price:32,image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85"},
  {id:6,name:"Robe moderne",category:"Femmes",type:"Vêtements",price:38,image:"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=85"},
  {id:7,name:"Tenue enfant",category:"Enfants",type:"Vêtements",price:24,image:"https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=85"},
  {id:8,name:"Montre minimaliste",category:"Accessoires",type:"Accessoires",price:35,image:"https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=85"}
];
let selectedCategory = "Tout";
let cart = 0;
const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
let toastTimer;

function renderProducts(){
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  const visible = products.filter(product => {
    const categoryMatch = selectedCategory === "Tout" || product.category === selectedCategory || (selectedCategory === "Chaussures" && product.type === "Chaussures");
    const searchMatch = (product.name + " " + product.category + " " + product.type).toLocaleLowerCase("fr").includes(query);
    return categoryMatch && searchMatch;
  });
  document.querySelector("#productTotal").textContent = visible.length + (visible.length > 1 ? " articles" : " article");
  if(!visible.length){
    grid.innerHTML = '<p class="empty-state">Aucun article ne correspond à votre recherche.</p>';
    return;
  }
  grid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-tag">${product.category}</span>
      </div>
      <div class="product-info">
        <p class="product-category">${product.type}</p>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-bottom">
          <span class="product-price">${product.price.toLocaleString("fr-FR")} $</span>
          <button class="add-button" data-add="${product.id}">+ Ajouter</button>
        </div>
      </div>
    </article>`).join("");
}
function selectCategory(category){
  selectedCategory = category;
  document.querySelectorAll(".filter").forEach(button => button.classList.toggle("active",button.dataset.category === category));
  renderProducts();
}
document.querySelector("#filters").addEventListener("click",event=>{
  const button = event.target.closest("[data-category]");
  if(button) selectCategory(button.dataset.category);
});
document.querySelectorAll("[data-nav-category]").forEach(link=>link.addEventListener("click",()=>selectCategory(link.dataset.navCategory)));
searchInput.addEventListener("input",renderProducts);
grid.addEventListener("click",event=>{
  const button = event.target.closest("[data-add]");
  if(!button) return;
  const product = products.find(item=>item.id === Number(button.dataset.add));
  cart++;
  document.querySelector("#cartCount").textContent = cart;
  toast.textContent = product.name + " ajouté au panier (démo).";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"),2400);
});
document.querySelector("#cartButton").addEventListener("click",()=>{
  toast.textContent = cart ? cart + " article(s) dans votre panier. Le panier complet sera ajouté dans une prochaine étape." : "Votre panier est encore vide.";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"),3000);
});
document.querySelector("#year").textContent = new Date().getFullYear();
renderProducts();