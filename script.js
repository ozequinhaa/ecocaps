// =========================================================
// 1. TEMA CLARO / ESCURO
// =========================================================
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('ecocaps-theme');
if (savedTheme === 'dark') document.body.classList.add('dark');
updateThemeButton();

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('ecocaps-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton();
});

function updateThemeButton() {
  const dark = document.body.classList.contains('dark');
  themeToggle.textContent = dark ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
}

// =========================================================
// 2. NAVEGAÇÃO MOBILE (BOTTOM BAR) & SCROLLSPY
// =========================================================
const navLinks = document.querySelectorAll('.main-nav .nav-link, .bottom-nav__item[data-section]');
const trackedSections = ['inicio', 'projeto', 'composicao', 'pedido', 'coleta']
  .map(id => document.getElementById(id))
  .filter(Boolean);

function setActiveNav(sectionId) {
  // Mapeia 'projeto' para 'inicio' na barra inferior se necessário
  const bottomTarget = sectionId === 'projeto' ? 'inicio' : sectionId;

  document.querySelectorAll('.main-nav .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === sectionId);
  });

  document.querySelectorAll('.bottom-nav__item[data-section]').forEach(item => {
    item.classList.toggle('active', item.dataset.section === bottomTarget);
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', event => {
    const targetId = link.dataset.section;
    const sectionEl = document.getElementById(targetId);
    if (sectionEl) {
      event.preventDefault();
      setActiveNav(targetId);
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + window.innerHeight * 0.35;
  let currentId = 'inicio';

  trackedSections.forEach(section => {
    if (scrollPos >= section.offsetTop) {
      currentId = section.id;
    }
  });

  setActiveNav(currentId);
}, { passive: true });

// =========================================================
// 3. ANIMAÇÕES DE ENTRADA (REVEAL)
// =========================================================
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal, .feature-card, .ingredient-card, .timeline-item, .product-card').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

// =========================================================
// 4. LOGIN E CADASTRO COM E-MAIL E SENHA
// =========================================================
const USERS_KEY = 'ecocaps-users';
const SESSION_KEY = 'ecocaps-session';
const ORDERS_KEY = 'ecocaps-orders';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setCurrentUser(user, persistent = true) {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  if (user) {
    const store = persistent ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(user));
  }
  atualizarEstadoContaUI();
}

function atualizarEstadoContaUI() {
  const user = getCurrentUser();
  const headerAuthText = document.getElementById('headerAuthText');
  const bottomAccountLabel = document.getElementById('bottomAccountLabel');

  if (user) {
    const firstName = user.nome.trim().split(' ')[0];
    headerAuthText.textContent = firstName;
    bottomAccountLabel.textContent = firstName;

    // Preenche formulários automaticamente se estiverem vazios
    const orderNome = document.getElementById('orderNome');
    const orderEmail = document.getElementById('orderEmail');
    const coletaEmail = document.getElementById('coletaEmail');

    if (orderNome && !orderNome.value) orderNome.value = user.nome;
    if (orderEmail && !orderEmail.value) orderEmail.value = user.email;
    if (coletaEmail && !coletaEmail.value) coletaEmail.value = user.email;
  } else {
    headerAuthText.textContent = 'Entrar';
    bottomAccountLabel.textContent = 'Entrar';
  }
}

function abrirModalConta() {
  const user = getCurrentUser();
  const modal = document.getElementById('authModal');
  if (!modal) return;

  if (user) {
    alternarTelaAuth('profile');
    renderizarPerfil(user);
  } else {
    alternarTelaAuth('login');
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function alternarTelaAuth(view) {
  document.getElementById('loginView').hidden = view !== 'login';
  document.getElementById('cadastroView').hidden = view !== 'cadastro';
  document.getElementById('profileView').hidden = view !== 'profile';
  document.getElementById('loginError').hidden = true;
  document.getElementById('cadastroError').hidden = true;
}

// Mostrar / ocultar senha
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// Preencher conta demo para facilitar testes
document.getElementById('fillDemoLogin').addEventListener('click', () => {
  document.getElementById('loginEmail').value = 'cliente@ecocaps.com.br';
  document.getElementById('loginPass').value = '123456';
});

// Submit Login com E-mail e Senha
document.getElementById('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const senha = document.getElementById('loginPass').value;
  const remember = document.getElementById('rememberUser').checked;
  const errorEl = document.getElementById('loginError');

  // Aceita conta demo padrão ou contas cadastradas no navegador
  if (email === 'cliente@ecocaps.com.br' && senha === '123456') {
    setCurrentUser({ nome: 'Cliente EcoCaps', email }, remember);
    fecharModal('authModal');
    return;
  }

  const users = getUsers();
  const found = users.find(u => u.email === email && u.senha === senha);

  if (!found) {
    errorEl.textContent = 'E-mail ou senha incorretos. Verifique seus dados ou crie um cadastro.';
    errorEl.hidden = false;
    return;
  }

  setCurrentUser({ nome: found.nome, email: found.email }, remember);
  fecharModal('authModal');
});

// Submit Cadastro com Nome, E-mail e Senha
document.getElementById('cadastroForm').addEventListener('submit', event => {
  event.preventDefault();
  const nome = document.getElementById('cadastroNome').value.trim();
  const email = document.getElementById('cadastroEmail').value.trim().toLowerCase();
  const senha = document.getElementById('cadastroPass').value;
  const confirm = document.getElementById('cadastroPassConfirm').value;
  const errorEl = document.getElementById('cadastroError');

  if (senha !== confirm) {
    errorEl.textContent = 'As senhas não coincidem. Digite novamente.';
    errorEl.hidden = false;
    return;
  }

  const users = getUsers();
  if (users.some(u => u.email === email)) {
    errorEl.textContent = 'Este e-mail já está cadastrado. Faça login na aba anterior.';
    errorEl.hidden = false;
    return;
  }

  users.push({ nome, email, senha });
  saveUsers(users);
  setCurrentUser({ nome, email }, true);
  event.target.reset();
  fecharModal('authModal');
});

function renderizarPerfil(user) {
  document.getElementById('profileAvatar').textContent = user.nome.charAt(0).toUpperCase();
  document.getElementById('profileName').textContent = user.nome;
  document.getElementById('profileEmail').textContent = user.email;

  const ordersListEl = document.getElementById('profileOrdersList');
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    orders = [];
  }

  const userOrders = orders.filter(o => o.email === user.email);
  if (userOrders.length === 0) {
    ordersListEl.innerHTML = '<p class="empty-orders">Nenhum pedido realizado com este e-mail ainda.</p>';
    return;
  }

  ordersListEl.innerHTML = userOrders
    .slice()
    .reverse()
    .map(o => `
      <div class="saved-order-item">
        <strong>Pedido ${o.codigo}</strong> • ${o.data}<br>
        <span>${o.resumo} — <b>${o.total}</b> (${o.modalidade})</span>
      </div>
    `)
    .join('');
}

document.getElementById('btnLogout').addEventListener('click', () => {
  setCurrentUser(null);
  fecharModal('authModal');
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', event => {
    if (event.target === modal) fecharModal(modal.id);
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal.open').forEach(modal => fecharModal(modal.id));
  }
});

// =========================================================
// 5. ÁREA DO CLIENTE PARA PEDIR O PRODUTO (CARRINHO & CHECKOUT)
// =========================================================
const cart = {
  'kit-iniciante': { name: 'Kit Iniciante (12 Cápsulas)', price: 19.90, qty: 0 },
  'kit-horta': { name: 'Kit Horta & Jardim (30 Cápsulas)', price: 42.90, qty: 1 },
  'kit-refil': { name: 'Refil Kraft (20 Cápsulas)', price: 29.90, qty: 0 },
  'kit-produtor': { name: 'Kit Comunitário (60 Cápsulas)', price: 74.90, qty: 0 }
};

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarCarrinhoUI() {
  const cartListEl = document.getElementById('cartList');
  const subtotalEl = document.getElementById('cartSubtotal');
  const shippingEl = document.getElementById('cartShipping');
  const totalEl = document.getElementById('cartTotal');
  const itemsCountEl = document.getElementById('orderItemsCount');
  const headerBadge = document.getElementById('headerCartBadge');
  const bottomBadge = document.getElementById('bottomCartBadge');

  const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value || 'entrega';

  let totalQty = 0;
  let subtotal = 0;
  const lines = [];

  Object.entries(cart).forEach(([id, item]) => {
    const qtySpan = document.getElementById(`qty-${id}`);
    if (qtySpan) qtySpan.textContent = item.qty;

    if (item.qty > 0) {
      totalQty += item.qty;
      const itemSum = item.qty * item.price;
      subtotal += itemSum;
      lines.push(`
        <div class="cart-item-row">
          <span>${item.qty}x ${item.name}</span>
          <strong>${formatBRL(itemSum)}</strong>
        </div>
      `);
    }
  });

  if (lines.length === 0) {
    cartListEl.innerHTML = '<p class="cart-empty-msg">Seu carrinho está vazio. Adicione um kit ao lado.</p>';
  } else {
    cartListEl.innerHTML = lines.join('');
  }

  const shipping = totalQty === 0 || deliveryType === 'retirada' || subtotal >= 60 ? 0 : 6.0;
  const grandTotal = subtotal + shipping;

  subtotalEl.textContent = formatBRL(subtotal);
  shippingEl.textContent = shipping === 0 ? 'Grátis' : formatBRL(shipping);
  totalEl.textContent = formatBRL(grandTotal);

  itemsCountEl.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'itens'}`;
  headerBadge.textContent = String(totalQty);
  bottomBadge.textContent = String(totalQty);
  bottomBadge.style.display = totalQty > 0 ? 'grid' : 'none';
}

document.querySelectorAll('.product-card').forEach(card => {
  const id = card.dataset.id;
  card.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'plus') {
        cart[id].qty += 1;
      } else if (action === 'minus' && cart[id].qty > 0) {
        cart[id].qty -= 1;
      }
      atualizarCarrinhoUI();
    });
  });
});

document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const label = document.getElementById('orderEnderecoLabel');
    const input = document.getElementById('orderEndereco');
    if (radio.value === 'retirada') {
      label.textContent = 'Ponto de retirada escolhido';
      input.placeholder = 'Selecione um ponto no mapa abaixo ou informe o bairro';
    } else {
      label.textContent = 'Endereço de entrega ou localização do mapa';
      input.placeholder = 'Rua, número, bairro ou ponto selecionado';
    }
    atualizarCarrinhoUI();
  });
});

document.getElementById('orderForm').addEventListener('submit', event => {
  event.preventDefault();
  const selectedItems = Object.values(cart).filter(i => i.qty > 0);
  if (selectedItems.length === 0) {
    alert('Selecione pelo menos 1 kit de EcoCaps antes de confirmar o pedido.');
    return;
  }

  const nome = document.getElementById('orderNome').value.trim();
  const email = document.getElementById('orderEmail').value.trim().toLowerCase();
  const tel = document.getElementById('orderTel').value.trim();
  const endereco = document.getElementById('orderEndereco').value.trim();
  const pagamento = document.getElementById('orderPagamento').value;
  const modalidade = document.querySelector('input[name="deliveryType"]:checked')?.value === 'retirada'
    ? 'Retirada em ponto'
    : 'Entrega em domicílio';
  const totalTexto = document.getElementById('cartTotal').textContent;

  const codigo = `#ECO-${Math.floor(1000 + Math.random() * 9000)}`;
  const resumo = selectedItems.map(i => `${i.qty}x ${i.name}`).join(', ');
  const data = new Date().toLocaleDateString('pt-BR');

  // Salva histórico local
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    orders = [];
  }
  orders.push({ codigo, nome, email, tel, endereco, pagamento, modalidade, resumo, total: totalTexto, data });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  const msgWhats = encodeURIComponent(
    `Olá, equipe EcoCaps! Gostaria de confirmar meu pedido ${codigo}:\n` +
    `• Cliente: ${nome}\n` +
    `• Itens: ${resumo}\n` +
    `• Modalidade: ${modalidade}\n` +
    `• Local: ${endereco}\n` +
    `• Pagamento: ${pagamento}\n` +
    `• Total: ${totalTexto}`
  );

  const feedback = document.getElementById('orderFeedback');
  feedback.innerHTML = `
    <strong>Pedido ${codigo} registrado com sucesso!</strong><br>
    Resumo: ${resumo} (${totalTexto}).<br>
    <a href="https://wa.me/5531997865500?text=${msgWhats}" target="_blank" rel="noopener">
      Enviar comprovante direto no WhatsApp ↗
    </a>
  `;
  feedback.hidden = false;
});

// =========================================================
// 6. MAPA INTERATIVO PARA LOCALIZAR PONTOS E COLETA
// =========================================================
let mapa = null;
let marcadorUsuario = null;
let localSelecionadoTexto = '';
let camadaPontos = null;

const pontosEcoCaps = [
  {
    nome: 'Ponto Central EcoCaps • Praça Tiradentes',
    tipo: 'retirada',
    tipoLabel: 'Retirada EcoCaps & Coleta',
    lat: -19.4658,
    lng: -44.2469,
    endereco: 'Centro, Sete Lagoas - MG • Seg a Sáb, 08h às 18h'
  },
  {
    nome: 'Ecoponto Orgânico • Lagoa Paulino',
    tipo: 'coleta',
    tipoLabel: 'Coleta de Resíduos Orgânicos',
    lat: -19.4612,
    lng: -44.2415,
    endereco: 'Orla da Lagoa Paulino, Sete Lagoas - MG • Todos os dias, 07h às 19h'
  },
  {
    nome: 'Núcleo Verde • Bairro Boa Vista',
    tipo: 'retirada',
    tipoLabel: 'Retirada EcoCaps',
    lat: -19.4725,
    lng: -44.2530,
    endereco: 'Av. Norte-Sul, Boa Vista, Sete Lagoas - MG • Seg a Sex, 09h às 17h'
  },
  {
    nome: 'Horta Comunitária • Santo Antônio',
    tipo: 'coleta',
    tipoLabel: 'Coleta Orgânica & Demonstração',
    lat: -19.4575,
    lng: -44.2555,
    endereco: 'Rua das Acácias, Santo Antônio, Sete Lagoas - MG • Sábados, 08h às 13h'
  }
];

function selecionarLocalNoMapa(lat, lng, descricao) {
  localSelecionadoTexto = descricao || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  document.getElementById('coord').value = localSelecionadoTexto;
  document.getElementById('mapStatusText').textContent = `Selecionado: ${localSelecionadoTexto}`;
  document.getElementById('btnUsarNoPedido').disabled = false;

  if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
  marcadorUsuario = L.marker([lat, lng])
    .addTo(mapa)
    .bindPopup(`<b>Local selecionado</b><br>${localSelecionadoTexto}`)
    .openPopup();
}

function renderizarPontosMapa(filtro = 'todos') {
  if (!mapa || !camadaPontos) return;
  camadaPontos.clearLayers();

  const filtrados = filtro === 'todos'
    ? pontosEcoCaps
    : pontosEcoCaps.filter(p => p.tipo === filtro);

  filtrados.forEach(ponto => {
    const circleMarker = L.circleMarker([ponto.lat, ponto.lng], {
      radius: 9,
      fillColor: ponto.tipo === 'retirada' ? '#153d2b' : '#6a9e45',
      color: '#ffffff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.95
    });

    circleMarker.bindPopup(`
      <strong>${ponto.nome}</strong><br>
      <small>${ponto.tipoLabel}</small><br>
      <small>${ponto.endereco}</small>
    `);

    circleMarker.on('click', () => {
      selecionarLocalNoMapa(ponto.lat, ponto.lng, `${ponto.nome} (${ponto.lat.toFixed(4)}, ${ponto.lng.toFixed(4)})`);
    });

    circleMarker.addTo(camadaPontos);
  });
}

if (window.L && document.getElementById('mapa')) {
  mapa = L.map('mapa').setView([-19.465, -44.246], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapa);

  camadaPontos = L.layerGroup().addTo(mapa);
  renderizarPontosMapa('todos');

  mapa.on('click', event => {
    const { lat, lng } = event.latlng;
    selecionarLocalNoMapa(lat, lng, `Ponto marcado (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
  });

  setTimeout(() => mapa.invalidateSize(), 300);
} else {
  document.getElementById('mapa').innerHTML =
    '<div style="padding:24px;text-align:center;color:#556;">Não foi possível carregar o mapa. Verifique sua conexão com a internet.</div>';
}

// Filtros do mapa
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderizarPontosMapa(chip.dataset.filter);
  });
});

// Botão de Geolocalização (GPS)
document.getElementById('btnMinhaLocalizacao').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Seu navegador não suporta geolocalização.');
    return;
  }

  const btn = document.getElementById('btnMinhaLocalizacao');
  btn.textContent = 'Localizando...';

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      btn.innerHTML = '<span>◎</span> Usar minha localização atual';
      if (mapa) {
        mapa.setView([latitude, longitude], 16);
        selecionarLocalNoMapa(latitude, longitude, `Minha localização (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
      }
    },
    () => {
      btn.innerHTML = '<span>◎</span> Usar minha localização atual';
      alert('Não foi possível obter sua localização. Permita o acesso ao GPS ou toque diretamente no mapa.');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

// Enviar localização do mapa direto para o formulário de pedido
document.getElementById('btnUsarNoPedido').addEventListener('click', () => {
  if (!localSelecionadoTexto) return;
  const orderEndereco = document.getElementById('orderEndereco');
  orderEndereco.value = localSelecionadoTexto;
  document.getElementById('pedido').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Formulário de sugestão/coleta no mapa
document.getElementById('collectionForm').addEventListener('submit', event => {
  event.preventDefault();
  const coord = document.getElementById('coord').value.trim();
  const email = document.getElementById('coletaEmail').value.trim();
  const tel = document.getElementById('coletaTel').value.trim();

  if (!coord) {
    alert('Toque no mapa ou use sua localização antes de enviar.');
    return;
  }

  if (!email || !tel) {
    alert('Preencha o e-mail e o telefone para continuar.');
    return;
  }

  alert(`Solicitação registrada para: ${coord}. A equipe EcoCaps entrará em contato!`);
  event.target.reset();
});

// Inicializa estado da UI ao carregar
atualizarEstadoContaUI();
atualizarCarrinhoUI();