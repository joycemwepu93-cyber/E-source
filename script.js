(() => {
"use strict";
const API = "src/api/index.php";
const $ = (s) => document.querySelector(s);
const grid=$("#productGrid"), search=$("#searchInput"), toast=$("#toast");
let products=[], categories=[], category="Tout", csrfToken="", currentUser=null, cartItems=[];
let mode="login", toastTimer;
const money=(v,c="USD")=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:c}).format(Number(v)||0);
const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(action,{method="GET",data=null,query=""}={}){
 const headers={"Accept":"application/json"};
 if(data!==null){headers["Content-Type"]="application/json";if(csrfToken)headers["X-CSRF-Token"]=csrfToken;}
 const response=await fetch(API+"?action="+encodeURIComponent(action)+query,{method,headers,credentials:"same-origin",body:data===null?undefined:JSON.stringify(data)});
 const result=await response.json().catch(()=>({success:false,error:"Réponse serveur invalide."}));
 if(result.csrf_token)csrfToken=result.csrf_token;
 if(!response.ok||!result.success)throw new Error(result.error||"Une erreur est survenue.");
 return result;
}
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),3000);}
function renderProducts(){
 const q=search.value.trim().toLocaleLowerCase("fr");
 const visible=products.filter(p=>(category==="Tout"||p.category===category||(category==="Chaussures"&&p.category==="Chaussures")||(category==="Accessoires"&&p.category==="Accessoires"))&&(p.name+" "+(p.category||"")+" "+(p.description||"")).toLocaleLowerCase("fr").includes(q));
 $("#productTotal").textContent=visible.length+" article"+(visible.length>1?"s":"");
 grid.innerHTML=visible.length?visible.map(p=>`<article class="product-card"><div class="product-image">${p.image_url?'<img src="'+esc(p.image_url)+'" alt="'+esc(p.name)+'" loading="lazy">':'<div class="no-product-image">E-SOURCE</div>'}<span class="product-tag">${esc(p.category||"Catalogue")}</span></div><div class="product-info"><p class="product-category">En stock : ${Number(p.stock_quantity)||0}</p><h3 class="product-name">${esc(p.name)}</h3><div class="product-bottom"><span class="product-price">${money(p.price,p.currency)}</span><button class="add-button" data-add="${Number(p.id)}" ${Number(p.stock_quantity)<1?"disabled":""}>+ Ajouter</button></div></div></article>`).join(""):'<p class="empty-state">Aucun article ne correspond à votre recherche.</p>';
}
function selectCategory(c){category=c;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.category===c));renderProducts();}
async function loadCatalog(){
 const [p,c]=await Promise.all([api("products"),api("categories")]);products=p.data||[];categories=c.data||[];
 // Les filtres visuels existants sont conservés ; les catégories disponibles restent pilotées par la base.
 renderProducts();
}
function showDialog(id){const d=$("#"+id);if(d&&!d.open)d.showModal();}
function closeDialogs(){document.querySelectorAll(".app-dialog").forEach(d=>d.close());}
function accountMode(next){mode=next;$("#accountTitle").textContent=next==="login"?"Connexion":"Créer un compte";$("#registerFields").hidden=next!=="register";$("#accountForm").querySelector('[name="password"]').autocomplete=next==="login"?"current-password":"new-password";document.querySelectorAll(".account-tab").forEach(b=>b.classList.toggle("active",b.dataset.accountMode===next));$("#accountStatus").textContent="";}
function renderAccount(){
 $("#accountButton").textContent=currentUser?("Bonjour, "+currentUser.first_name):"Mon compte";
 $("#accountProfile").hidden=!currentUser;
 $("#accountForm").hidden=!!currentUser;
 if(currentUser){$("#accountProfile").innerHTML='<p>Connecté en tant que <strong>'+esc(currentUser.first_name+" "+currentUser.last_name)+'</strong><br>'+esc(currentUser.email)+'</p>'+(currentUser.role==="admin"?'<button class="primary-button" id="openAdmin" type="button">Ouvrir l’administration →</button>':'')+'<button class="cart-button" id="logoutButton" type="button">Se déconnecter</button>';$("#logoutButton").addEventListener("click",logout);$("#openAdmin")?.addEventListener("click",openAdmin);}
}
async function refreshUser(){try{const r=await api("me");currentUser=r.user;csrfToken=r.csrf_token||csrfToken;}catch(e){currentUser=null;}renderAccount();}
async function openAccount(){if(!csrfToken){const r=await api("csrf");csrfToken=r.csrf_token;}accountMode("login");$("#accountStatus").textContent="";renderAccount();showDialog("accountDialog");}
$("#accountButton").addEventListener("click",openAccount);
document.querySelectorAll("[data-account-mode]").forEach(b=>b.addEventListener("click",()=>accountMode(b.dataset.accountMode)));
$("#accountForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget),data=Object.fromEntries(f.entries());$("#accountStatus").textContent="Traitement…";try{const r=await api(mode==="login"?"login":"register",{method:"POST",data});currentUser=r.user;csrfToken=r.csrf_token||csrfToken;renderAccount();$("#accountStatus").textContent="Compte connecté.";await refreshCart();}catch(err){$("#accountStatus").textContent=err.message;}});
async function logout(){try{await api("logout",{method:"POST",data:{}});currentUser=null;cartItems=[];updateCartCount();renderAccount();$("#accountStatus").textContent="Vous êtes déconnecté.";}catch(e){notify(e.message);}}
function updateCartCount(){const n=cartItems.reduce((sum,i)=>sum+Number(i.quantity),0);$("#cartCount").textContent=n;}
async function refreshCart(){if(!currentUser){cartItems=[];updateCartCount();return;}const r=await api("cart");cartItems=r.data||[];updateCartCount();renderCart();}
async function addToCart(id){if(!currentUser){notify("Connectez-vous pour ajouter un article au panier.");await openAccount();return;}const old=cartItems.find(i=>Number(i.product_id)===id),p=products.find(x=>Number(x.id)===id);if(!p)return;try{await api("cart",{method:"POST",data:{product_id:id,quantity:(old?Number(old.quantity):0)+1}});await refreshCart();notify(p.name+" ajouté au panier.");}catch(e){notify(e.message);}}
function renderCart(){const box=$("#cartItems");if(!cartItems.length){box.innerHTML='<p class="empty-state">Votre panier est vide.</p>';$("#cartSummary").textContent="";$("#checkoutButton").disabled=true;return;}let total=0;box.innerHTML=cartItems.map(i=>{const line=Number(i.price)*Number(i.quantity);total+=line;return '<div class="cart-line"><div><strong>'+esc(i.name)+'</strong><small>'+money(i.price,i.currency)+' × '+Number(i.quantity)+'</small></div><div><strong>'+money(line,i.currency)+'</strong><button class="remove-cart" data-remove="'+Number(i.product_id)+'" type="button">Retirer</button></div></div>';}).join("");$("#cartSummary").textContent="Total : "+money(total,cartItems[0]?.currency||"USD");$("#checkoutButton").disabled=false;}
$("#cartItems").addEventListener("click",async e=>{const b=e.target.closest("[data-remove]");if(!b)return;try{await api("cart",{method:"DELETE",data:{product_id:Number(b.dataset.remove)}});await refreshCart();}catch(err){$("#cartStatus").textContent=err.message;}});
$("#cartButton").addEventListener("click",async()=>{if(!currentUser){await openAccount();notify("Connectez-vous pour consulter votre panier.");return;}try{await refreshCart();$("#cartStatus").textContent="";showDialog("cartDialog");}catch(e){notify(e.message);}});
$("#checkoutButton").addEventListener("click",async()=>{const b=$("#checkoutButton");b.disabled=true;try{const r=await api("orders",{method:"POST",data:{payment_method:$("#paymentMethod").value,customer_note:$("#orderNote").value}});$("#cartStatus").textContent="Commande "+r.order.order_number+" enregistrée. Le paiement sera confirmé par la boutique.";await refreshCart();notify("Commande enregistrée avec succès.");}catch(e){$("#cartStatus").textContent=e.message;}finally{b.disabled=!cartItems.length;}});
async function openAdmin(){showDialog("adminDialog");try{const [c,o]=await Promise.all([api("categories"),api("admin/orders")]);$("#adminCategory").innerHTML=c.data.map(x=>'<option value="'+Number(x.id)+'">'+esc(x.name)+'</option>').join("");$("#adminOrders").innerHTML=(o.data||[]).map(x=>'<div class="admin-order"><strong>'+esc(x.order_number)+'</strong> — '+esc(x.first_name+" "+x.last_name)+'<br><small>'+money(x.total_amount,x.currency)+' · '+esc(x.status)+'</small></div>').join("")||"<p>Aucune commande.</p>";}catch(e){$("#adminStatus").textContent=e.message;}}
$("#adminProductForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget),data=Object.fromEntries(f.entries());data.category_id=Number(data.category_id);data.price=Number(data.price);data.stock_quantity=Number(data.stock_quantity);data.is_active=f.has("is_active");try{await api("admin/products",{method:"POST",data});$("#adminStatus").textContent="Produit enregistré.";e.currentTarget.reset();await loadCatalog();}catch(err){$("#adminStatus").textContent=err.message;}});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeDialogs));
document.querySelectorAll(".app-dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close();}));
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b)selectCategory(b.dataset.category);});
document.querySelectorAll("[data-nav-category]").forEach(a=>a.addEventListener("click",()=>selectCategory(a.dataset.navCategory)));
search.addEventListener("input",renderProducts);
grid.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(Number(b.dataset.add));});
$("#year").textContent=new Date().getFullYear();
(async()=>{try{await loadCatalog();await refreshUser();if(currentUser)await refreshCart();}catch(e){grid.innerHTML='<p class="empty-state">Le catalogue ne peut pas être chargé. Vérifiez la configuration PHP/MySQL dans src/README.md.</p>';notify(e.message);}})();
})();