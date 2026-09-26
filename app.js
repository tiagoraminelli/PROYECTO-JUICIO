// ============================================================
// LOGOS DISPONIBLES
// ============================================================
const LOGOS_DISPONIBLES = [
  { archivo: 'logo-hospital.jpg',    nombre: 'Rosetón (color)' },
  { archivo: 'hospital.png',    nombre: 'Original' },
  { archivo: 'logo-hospital-v2.png', nombre: 'Escudo Hospital San Cristóbal' },
];

let logoSeleccionado = 'logo-hospital.jpg';

// ============================================================
// ESTADO
// ============================================================
const nombresMeses = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

let estadoNota = {
  fecha: '',
  destinatario: '',
  cargoDest: '',
  institucion: 'Hospital San Cristóbal',
  remitente: '',
  cargoRem: '',
  bloques: []
};

// ============================================================
// FECHAS
// ============================================================
function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatearFechaLarga(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  if (!y||!m||!d) return '';
  return `${parseInt(d)} de ${nombresMeses[parseInt(m)]} de ${y}`;
}

// ============================================================
// LOGO
// ============================================================
function poblarSelectorLogos() {
  const sel = document.getElementById('cfgLogo');
  if (!sel) return;
  sel.innerHTML = LOGOS_DISPONIBLES.map(l =>
    `<option value="${l.archivo}">${l.nombre}</option>`
  ).join('');
  sel.value = logoSeleccionado;
}
function cambiarLogo(archivo) {
  logoSeleccionado = archivo;
  localStorage.setItem('nota_logo', archivo);
  aplicarLogo();
  renderPreview();
}
function aplicarLogo() {
  const brand = document.getElementById('brandLogo');
  if (brand) brand.src = logoSeleccionado;
  const fav = document.getElementById('favicon');
  if (fav) fav.href = logoSeleccionado;
}

// ============================================================
// PERSISTENCIA
// ============================================================
function guardar() {
  try {
    localStorage.setItem('nota_estado', JSON.stringify(estadoNota));
    return true;
  } catch(e) {
    console.warn('No se pudo guardar en localStorage', e);
    return false;
  }
}

// Comprime una imagen (dataURL) si supera maxDim píxeles de lado.
function comprimirImagen(dataUrl, maxDim = 1600, calidad = 0.85) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (Math.max(w, h) <= maxDim) return resolve(dataUrl);
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
function cargar() {
  const logoGuardado = localStorage.getItem('nota_logo');
  if (logoGuardado && LOGOS_DISPONIBLES.some(l => l.archivo === logoGuardado)) {
    logoSeleccionado = logoGuardado;
  }
  poblarSelectorLogos();
  aplicarLogo();

  const raw = localStorage.getItem('nota_estado');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      estadoNota = { ...estadoNota, ...data };
      if (!Array.isArray(estadoNota.bloques)) estadoNota.bloques = [];
    } catch(e) { console.warn('Error cargando nota', e); }
  }
  estadoNota.fecha = hoyISO();
  guardar();

  document.getElementById('cfgFecha').value = formatearFechaLarga(estadoNota.fecha);
  document.getElementById('cfgDestinatario').value = estadoNota.destinatario || '';
  document.getElementById('cfgCargoDest').value = estadoNota.cargoDest || '';
  document.getElementById('cfgInstitucion').value = estadoNota.institucion || '';
  document.getElementById('cfgRemitente').value = estadoNota.remitente || '';
  document.getElementById('cfgCargoRem').value = estadoNota.cargoRem || '';

  renderBloques();
  renderPreview();
}

// ============================================================
// CONFIG
// ============================================================
function actualizarConfig() {
  estadoNota.destinatario = document.getElementById('cfgDestinatario').value.trim();
  estadoNota.cargoDest = document.getElementById('cfgCargoDest').value.trim();
  estadoNota.institucion = document.getElementById('cfgInstitucion').value.trim();
  estadoNota.remitente = document.getElementById('cfgRemitente').value.trim().toUpperCase();
  estadoNota.cargoRem = document.getElementById('cfgCargoRem').value.trim();
  guardar();
  renderPreview();
}

// ============================================================
// BLOQUES
// ============================================================
function agregarBloque(tipo) {
  if (tipo === 'texto') {
    estadoNota.bloques.push({ tipo: 'texto', contenido: '' });
  } else if (tipo === 'items') {
    estadoNota.bloques.push({ tipo: 'items', items: [''] });
  }
  guardar();
  renderBloques();
  renderPreview();
  setTimeout(() => {
    const cont = document.getElementById('bloquesList');
    const ultimo = cont.lastElementChild;
    if (!ultimo) return;
    const campo = ultimo.querySelector('textarea, input');
    if (campo) campo.focus();
  }, 50);
}

function subirImagen(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('El archivo debe ser una imagen.');
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    if (!confirm('La imagen pesa más de 3 MB. Puede hacer lenta la app. ¿Continuar?')) return;
  }
  const reader = new FileReader();
  reader.onload = async e => {
    estadoNota.bloques.push({ tipo: 'imagen', src: e.target.result, caption: '' });
    if (!guardar()) {
      // Cuota de localStorage excedida: intentar con la imagen comprimida
      const idx = estadoNota.bloques.length - 1;
      estadoNota.bloques[idx].src = await comprimirImagen(estadoNota.bloques[idx].src);
      if (!guardar()) {
        estadoNota.bloques.pop();
        alert('La imagen es demasiado grande para guardarse en el navegador. Probá con una más chica o en formato JPG.');
        renderBloques();
        renderPreview();
        return;
      }
    }
    renderBloques();
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function quitarBloque(idx) {
  if (!confirm('¿Quitar este bloque?')) return;
  estadoNota.bloques.splice(idx, 1);
  guardar();
  renderBloques();
  renderPreview();
}

function moverBloque(idx, dir) {
  const n = idx + dir;
  if (n < 0 || n >= estadoNota.bloques.length) return;
  [estadoNota.bloques[idx], estadoNota.bloques[n]] = [estadoNota.bloques[n], estadoNota.bloques[idx]];
  guardar();
  renderBloques();
  renderPreview();
}

function actualizarTextoBloque(idx, valor) {
  estadoNota.bloques[idx].contenido = valor;
  guardar();
  renderPreview();
}

function actualizarCaptionBloque(idx, valor) {
  estadoNota.bloques[idx].caption = valor;
  guardar();
  renderPreview();
}

// ---------- Ítems dentro de un bloque lista ----------
function agregarItemBloque(bIdx, valor = '') {
  estadoNota.bloques[bIdx].items.push(valor);
  guardar();
  renderBloques();
  renderPreview();
  setTimeout(() => {
    const rows = document.querySelectorAll(`#bloquesList .bloque[data-idx="${bIdx}"] .bloque-item-row input`);
    if (rows.length) rows[rows.length - 1].focus();
  }, 50);
}
function quitarItemBloque(bIdx, iIdx) {
  estadoNota.bloques[bIdx].items.splice(iIdx, 1);
  guardar();
  renderBloques();
  renderPreview();
}
function actualizarItemBloque(bIdx, iIdx, valor) {
  estadoNota.bloques[bIdx].items[iIdx] = valor;
  guardar();
  renderPreview();
}
function moverItemBloque(bIdx, iIdx, dir) {
  const arr = estadoNota.bloques[bIdx].items;
  const n = iIdx + dir;
  if (n < 0 || n >= arr.length) return;
  [arr[iIdx], arr[n]] = [arr[n], arr[iIdx]];
  guardar();
  renderBloques();
  renderPreview();
}

// ============================================================
// RENDER — editor de bloques
// ============================================================
function renderBloques() {
  const cont = document.getElementById('bloquesList');
  const empty = document.getElementById('emptyBloques');
  const contador = document.getElementById('contadorBloques');

  contador.textContent = `${estadoNota.bloques.length} bloque${estadoNota.bloques.length === 1 ? '' : 's'}`;

  if (estadoNota.bloques.length === 0) {
    cont.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  cont.innerHTML = estadoNota.bloques.map((b, i) => {
    const moverBotones = `
      <div class="bloque-acciones">
        <button onclick="moverBloque(${i}, -1)" title="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button onclick="moverBloque(${i}, 1)" title="Bajar" ${i === estadoNota.bloques.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="danger" onclick="quitarBloque(${i})" title="Quitar">✕</button>
      </div>
    `;

    if (b.tipo === 'texto') {
      return `
        <div class="bloque" data-idx="${i}">
          <div class="bloque-head">
            <span class="bloque-tipo">Texto</span>
            ${moverBotones}
          </div>
          <textarea class="bloque-textarea" placeholder="Escribí el párrafo..."
                    oninput="actualizarTextoBloque(${i}, this.value)">${escapeHtml(b.contenido || '')}</textarea>
        </div>
      `;
    }

    if (b.tipo === 'items') {
      const items = (b.items || ['']).map((it, j) => `
        <div class="bloque-item-row">
          <span class="num">${j + 1}.</span>
          <input type="text" value="${escapeAttr(it)}" placeholder="Ej: Hacia la belleza, David Foenkinos."
                 oninput="actualizarItemBloque(${i}, ${j}, this.value)"
                 onkeydown="if(event.key==='Enter'){event.preventDefault();agregarItemBloque(${i});}">
          <button class="btn-mini" onclick="moverItemBloque(${i}, ${j}, -1)" title="Subir" ${j === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-mini" onclick="moverItemBloque(${i}, ${j}, 1)" title="Bajar" ${j === b.items.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-mini danger" onclick="quitarItemBloque(${i}, ${j})" title="Quitar">✕</button>
        </div>
      `).join('');
      return `
        <div class="bloque" data-idx="${i}">
          <div class="bloque-head">
            <span class="bloque-tipo">Lista de ítems</span>
            ${moverBotones}
          </div>
          <div class="bloque-items-list">${items || '<div style="color:#9ca3af;font-size:12px;">Sin ítems. Agregá uno abajo.</div>'}</div>
          <button class="bloque-add-item" onclick="agregarItemBloque(${i})">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar ítem
          </button>
        </div>
      `;
    }

    if (b.tipo === 'imagen') {
      return `
        <div class="bloque" data-idx="${i}">
          <div class="bloque-head">
            <span class="bloque-tipo">Imagen</span>
            ${moverBotones}
          </div>
          <img src="${b.src}" alt="Adjunto" class="bloque-img-preview">
          <input type="text" class="bloque-img-caption" value="${escapeAttr(b.caption || '')}"
                 placeholder="Epígrafe (opcional)"
                 oninput="actualizarCaptionBloque(${i}, this.value)">
        </div>
      `;
    }

    return '';
  }).join('');
}

// ============================================================
// DOCUMENTO — render imprimible
// ============================================================
function bloquesHTML() {
  return estadoNota.bloques.map(b => {
    if (b.tipo === 'texto') {
      const txt = (b.contenido || '').trim();
      if (!txt) return '';
      return `<div class="nota-bloque texto"><p>${escapeHtml(txt).replace(/\n/g, '<br>')}</p></div>`;
    }
    if (b.tipo === 'items') {
      const items = (b.items || []).filter(i => i && i.trim());
      if (!items.length) return '';
      return `
        <div class="nota-bloque lista">
          <ol>
            ${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ol>
        </div>
      `;
    }
    if (b.tipo === 'imagen') {
      if (!b.src) return '';
      return `
        <div class="nota-bloque imagen">
          <img src="${b.src}" alt="Adjunto">
          ${b.caption ? `<span class="epigrafe">${escapeHtml(b.caption)}</span>` : ''}
        </div>
      `;
    }
    return '';
  }).join('');
}

function notaHTML() {
  const fechaLarga = estadoNota.fecha ? formatearFechaLarga(estadoNota.fecha) : '—';
  const destinatario = estadoNota.destinatario || '___________________';
  const cargoDest = estadoNota.cargoDest || '';
  const institucion = estadoNota.institucion || 'Hospital San Cristóbal';
  const remitente = estadoNota.remitente || '___________________';
  const cargoRem = estadoNota.cargoRem || '';

  return `
    <div class="nota-doc">
      <div class="nota-header">
        <img src="santa fe.webp" alt="Santa Fe Provincia" class="logo-santafe">
        <img src="${logoSeleccionado}" alt="Hospital Julio César Villanueva" class="logo-hospital">
        <h3>NOTA</h3>
        <div class="sub"><strong>Hospital Julio César Villanueva</strong> — San Cristóbal</div>
      </div>

      <p class="nota-lugar">San Cristóbal, ${fechaLarga}.-</p>

      <div class="nota-destinatario">
        <p><strong>${escapeHtml(destinatario)}</strong>${cargoDest ? ` <span style="color:#6b7280">(${escapeHtml(cargoDest)})</span>` : ''}</p>
        <p>${escapeHtml(institucion)}</p>
      </div>

      ${bloquesHTML()}

      <div class="nota-remitente">
        <p><strong>${escapeHtml(remitente)}</strong></p>
        ${cargoRem ? `<p class="cargo">${escapeHtml(cargoRem)}</p>` : ''}
      </div>

      <div class="nota-firma">
        <div>Firma y Aclaración</div>
      </div>
    </div>
  `;
}

function renderPreview() {
  const cont = document.getElementById('previewNota');
  if (!cont) return;
  cont.innerHTML = notaHTML();
}

// ============================================================
// IMPRESIÓN
// ============================================================
function imprimirNota() {
  estadoNota.fecha = hoyISO();
  guardar();
  document.getElementById('cfgFecha').value = formatearFechaLarga(estadoNota.fecha);

  const zona = document.getElementById('zonaImpresion');
  zona.innerHTML = notaHTML();

  // Esperar a que todas las imágenes terminen de cargar antes de imprimir
  const imgs = Array.from(zona.querySelectorAll('img'));
  const cargadas = imgs.map(img => img.complete
    ? Promise.resolve()
    : new Promise(res => { img.onload = img.onerror = res; })
  );
  Promise.all(cargadas).then(() => setTimeout(() => window.print(), 100));
}

// ============================================================
// VACIAR
// ============================================================
function vaciarTodo() {
  if (!confirm('¿Vaciar la nota actual? Esta acción no se puede deshacer.')) return;
  estadoNota = {
    fecha: hoyISO(),
    destinatario: '',
    cargoDest: '',
    institucion: 'Hospital San Cristóbal',
    remitente: '',
    cargoRem: '',
    bloques: []
  };
  guardar();
  cargar();
}

// ============================================================
// UTILIDADES
// ============================================================
function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/`/g, '&#96;');
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
window.addEventListener('DOMContentLoaded', cargar);