(() => {
  const API = '../src/api/index.php';
  let csrfToken = '';
  let products = [], orders = [], customers = [], categories = [];
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (amount, currency='USD') => new Intl.NumberFormat('fr-FR',{style:'currency',currency}).format(Number(amount || 0));
  const date = (value) => value ? new Date(value.replace(' ','T')).toLocaleDateString('fr-FR') : '—';
  const toast = (message) => { const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2800); };
  async function request(action, options={}) {
    const method = options.method || 'GET';
    const headers = {'Accept':'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), ...(method !== 'GET' && csrfToken ? {'X-CSRF-Token':csrfToken} : {}), ...(options.headers || {})};
    const response = await fetch(API+'?action='+encodeURIComponent(action)+(options.query || ''), {method,headers,credentials:'same-origin',body:options.body ? JSON.stringify(options.body) : undefined});
    let data;
    try { data=await response.json(); } catch { throw new Error('Réponse invalide du serveur.'); }
    if (!response.ok || data.success === false) throw new Error(data.error || 'Une erreur est survenue.');
    if (data.csrf_token) csrfToken=data.csrf_token;
    return data;
  }
  async function initCsrf(){ const data=await request('csrf'); csrfToken=data.csrf_token; }
  function showApp(user){ $('#loginView').hidden=true; $('#appView').hidden=false; $('#adminName').textContent=[user.first_name,user.last_name].filter(Boolean).join(' ') || 'Administrateur'; }
  function showLogin(){ $('#appView').hidden=true; $('#loginView').hidden=false; }
  async function login(event){
    event.preventDefault(); const form=new FormData(event.currentTarget); $('#loginError').textContent='';
    try { await initCsrf(); const data=await request('login',{method:'POST',body:{email:form.get('email'),password:form.get('password')}}); if(data.user?.role!=='admin') throw new Error('Ce compte ne possède pas les droits administrateur.'); showApp(data.user); await loadDashboard(); }
    catch(error){ $('#loginError').textContent=error.message; }
  }
  async function boot(){
    try { await initCsrf(); const data=await request('me'); if(data.user?.role!=='admin') throw new Error('Accès administrateur requis.'); showApp(data.user); await loadDashboard(); }
    catch { showLogin(); }
  }
  async function logout(){ try { await request('logout',{method:'POST'}); } catch(error){ toast(error.message); } showLogin(); $('#loginForm').reset(); }
  function navigate(page){
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    document.querySelectorAll('.page-section').forEach(s=>s.classList.toggle('active',s.id==='page-'+page));
    const titles={dashboard:'Tableau de bord',products:'Produits & stocks',orders:'Commandes',customers:'Clients'};
    $('#pageTitle').textContent=titles[page] || 'Administration'; $('#sidebar').classList.remove('open');
    if(page==='dashboard') loadDashboard(); if(page==='products') loadProducts(); if(page==='orders') loadOrders(); if(page==='customers') loadCustomers();
  }
  async function loadDashboard(){
    try {
      const [p,o,c]=await Promise.all([request('admin/products'),request('admin/orders'),request('admin/customers')]);
      products=p.data||[]; orders=o.data||[]; customers=c.data||[];
      $('#statProducts').textContent=products.length; $('#statOrders').textContent=orders.length; $('#statCustomers').textContent=customers.length;
      $('#statPending').textContent=orders.filter(x=>x.status==='pending').length;
      const recent=[...orders].slice(0,6);
      $('#recentOrders').innerHTML=recent.length?recent.map(o=>`<tr><td><strong>${escapeHtml(o.order_number)}</strong></td><td>${escapeHtml(o.first_name)} ${escapeHtml(o.last_name)}</td><td>${date(o.created_at)}</td><td>${money(o.total_amount,o.currency)}</td><td>${statusPill(o.status)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">Aucune commande pour le moment.</td></tr>';
    } catch(error){ $('#globalMessage').textContent=error.message; }
  }
  function statusPill(status){const labels={pending:'En attente',confirmed:'Confirmée',processing:'En préparation',shipped:'Expédiée',completed:'Terminée',cancelled:'Annulée',paid:'Payé',unpaid:'Non payé',partial:'Partiel',refunded:'Remboursé'};const cls=status==='completed'||status==='paid'?'green':status==='cancelled'||status==='unpaid'?'red':'orange';return `<span class="pill ${cls}">${escapeHtml(labels[status]||status)}</span>`;}
  async function loadCategories(){const data=await request('categories');categories=data.data||[];$('#productCategory').innerHTML='<option value="">Sans catégorie</option>'+categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');}
  async function loadProducts(){
    try {const [p]=await Promise.all([request('admin/products'),loadCategories()]);products=p.data||[];renderProducts();}
    catch(error){$('#productsTable').innerHTML=`<tr><td colspan="6" class="empty">${escapeHtml(error.message)}</td></tr>`;}
  }
  function renderProducts(){
    const q=$('#productSearch').value.trim().toLowerCase();
    const rows=products.filter(p=>(p.name+' '+(p.category||'')).toLowerCase().includes(q));
    $('#productsTable').innerHTML=rows.length?rows.map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${escapeHtml(p.category||'—')}</td><td>${money(p.price,p.currency)}</td><td>${p.stock_quantity}</td><td>${p.is_active==1?'<span class="pill green">Visible</span>':'<span class="pill red">Masqué</span>'}</td><td><button class="table-action" data-edit-product="${p.id}">Modifier</button><button class="table-action danger" data-disable-product="${p.id}">Désactiver</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Aucun produit trouvé.</td></tr>';
  }
  function openProduct(product=null){
    const form=$('#productForm'); form.reset(); form.elements.id.value=product?.id||'';
    $('#productDialogTitle').textContent=product?'Modifier le produit':'Ajouter un produit'; $('#productFormError').textContent='';
    if(product){for(const key of ['name','description','category_id','price','currency','stock_quantity','image_url']) if(form.elements[key]) form.elements[key].value=product[key]??'';form.elements.is_active.checked=product.is_active==1;}
    else {form.elements.currency.value='USD';form.elements.stock_quantity.value=0;form.elements.is_active.checked=true;}
    $('#productDialog').showModal();
  }
  async function saveProduct(event){
    event.preventDefault();const f=event.currentTarget;const data={id:Number(f.elements.id.value)||undefined,name:f.elements.name.value.trim(),description:f.elements.description.value.trim(),category_id:f.elements.category_id.value?Number(f.elements.category_id.value):null,price:Number(f.elements.price.value),currency:f.elements.currency.value,stock_quantity:Number(f.elements.stock_quantity.value),image_url:f.elements.image_url.value.trim()||null,is_active:f.elements.is_active.checked?1:0};
    try{await request('admin/products',{method:data.id?'PATCH':'POST',body:data});$('#productDialog').close();toast('Produit enregistré.');await loadProducts();await loadDashboard();}
    catch(error){$('#productFormError').textContent=error.message;}
  }
  async function disableProduct(id){if(!confirm('Désactiver ce produit ? Il ne sera plus visible dans la boutique.'))return;try{await request('admin/products',{method:'DELETE',query:'&id='+encodeURIComponent(id)});toast('Produit désactivé.');await loadProducts();}catch(e){toast(e.message);}}
  async function addCategory(event){event.preventDefault();const name=new FormData(event.currentTarget).get('name').trim();try{await request('admin/categories',{method:'POST',body:{name}});event.currentTarget.reset();toast('Catégorie ajoutée.');await loadCategories();}catch(e){toast(e.message);}}
  async function loadOrders(){
    try{const data=await request('admin/orders');orders=data.data||[];const states=['pending','confirmed','processing','shipped','completed','cancelled'];const labels={pending:'En attente',confirmed:'Confirmée',processing:'En préparation',shipped:'Expédiée',completed:'Terminée',cancelled:'Annulée'};
      $('#ordersTable').innerHTML=orders.length?orders.map(o=>`<tr><td><strong>${escapeHtml(o.order_number)}</strong></td><td>${escapeHtml(o.first_name)} ${escapeHtml(o.last_name)}<br><small>${escapeHtml(o.email)}</small></td><td>${date(o.created_at)}</td><td>${escapeHtml(o.payment_method)}</td><td>${money(o.total_amount,o.currency)}</td><td>${statusPill(o.status)}</td><td><select class="status-select" data-order-status="${o.id}">${states.map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${labels[s]}</option>`).join('')}</select></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Aucune commande enregistrée.</td></tr>';
    }catch(e){$('#ordersTable').innerHTML=`<tr><td colspan="7" class="empty">${escapeHtml(e.message)}</td></tr>`;}
  }
  async function updateOrder(id,status){try{await request('admin/orders',{method:'PATCH',body:{order_id:Number(id),status}});toast('Statut de commande mis à jour.');await loadOrders();}catch(e){toast(e.message);await loadOrders();}}
  async function loadCustomers(){
    try{const data=await request('admin/customers');customers=data.data||[];$('#customersTable').innerHTML=customers.length?customers.map(c=>`<tr><td><strong>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</strong></td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.phone||'—')}</td><td>${c.credit_eligible==1?'<span class="pill green">Autorisé</span>':'<span class="pill orange">Non autorisé</span>'}</td><td>${c.is_active==1?'<span class="pill green">Actif</span>':'<span class="pill red">Désactivé</span>'}</td><td><button class="table-action" data-customer-id="${c.id}" data-credit="${c.credit_eligible==1?0:1}" data-active="${c.is_active==1?1:0}">${c.credit_eligible==1?'Retirer crédit':'Autoriser crédit'}</button><button class="table-action danger" data-customer-active="${c.id}" data-next-active="${c.is_active==1?0:1}">${c.is_active==1?'Désactiver':'Activer'}</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Aucun client enregistré.</td></tr>';}
    catch(e){$('#customersTable').innerHTML=`<tr><td colspan="6" class="empty">${escapeHtml(e.message)}</td></tr>`;}
  }
  async function updateCustomer(id,credit,active){try{await request('admin/customers',{method:'PATCH',body:{user_id:Number(id),credit_eligible:Number(credit),is_active:Number(active)}});toast('Fiche client mise à jour.');await loadCustomers();}catch(e){toast(e.message);}}
  document.addEventListener('click',(event)=>{
    const nav=event.target.closest('[data-page]');if(nav)navigate(nav.dataset.page);
    const go=event.target.closest('[data-go]');if(go)navigate(go.dataset.go);
    const edit=event.target.closest('[data-edit-product]');if(edit)openProduct(products.find(p=>p.id==edit.dataset.editProduct));
    const disable=event.target.closest('[data-disable-product]');if(disable)disableProduct(disable.dataset.disableProduct);
    const credit=event.target.closest('[data-customer-id]');if(credit)updateCustomer(credit.dataset.customerId,credit.dataset.credit,credit.dataset.active);
    const active=event.target.closest('[data-customer-active]');if(active)updateCustomer(active.dataset.customerActive,customers.find(c=>c.id==active.dataset.customerActive)?.credit_eligible||0,active.dataset.nextActive);
  });
  document.addEventListener('change',(event)=>{if(event.target.matches('[data-order-status]'))updateOrder(event.target.dataset.orderStatus,event.target.value);});
  $('#loginForm').addEventListener('submit',login);$('#logoutButton').addEventListener('click',logout);
  $('#addProductButton').addEventListener('click',()=>openProduct());$('#productForm').addEventListener('submit',saveProduct);
  $('#closeProductDialog').addEventListener('click',()=>$('#productDialog').close());$('#cancelProduct').addEventListener('click',()=>$('#productDialog').close());
  $('#productSearch').addEventListener('input',renderProducts);$('#categoryForm').addEventListener('submit',addCategory);
  $('#refreshDashboard').addEventListener('click',loadDashboard);$('#refreshOrders').addEventListener('click',loadOrders);$('#refreshCustomers').addEventListener('click',loadCustomers);
  $('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  boot();
})();