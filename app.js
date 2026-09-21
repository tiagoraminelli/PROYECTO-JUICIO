// ============================================================
// NOTAS — estado
// ============================================================
const nombresMeses = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

let estadoNota = {
  fecha: '',
  destinatario: '',
  cargoDest: '',
  institucion: 'Hospital San Cristóbal',
  remitente: '',
  cargoRem: '',
  motivo: '',
  items: [],
  cierre: 'Esperando le den utilidad y cuidado a los mismos. Atte.'
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
// PERSISTENCIA
// ============================================================
function guardar() {
  localStorage.setItem('nota_estado', JSON.stringify(estadoNota));
}

function cargar() {
  const raw = localStorage.getItem('nota_estado');
  if (raw) {
    try { estadoNota = { ...estadoNota, ...JSON.parse(raw) }; }
    catch(e) { console.warn('Error cargando nota', e); }
  }

  // Fecha siempre automática del día
  estadoNota.fecha = hoyISO();
  guardar();

  document.getElementById('cfgFecha').value = formatearFechaLarga(estadoNota.fecha);
  document.getElementById('cfgDestinatario').value = estadoNota.destinatario || '';
  document.getElementById('cfgCargoDest').value = estadoNota.cargoDest || '';
  document.getElementById('cfgInstitucion').value = estadoNota.institucion || '';
  document.getElementById('cfgRemitente').value = estadoNota.remitente || '';
  document.getElementById('cfgCargoRem').value = estadoNota.cargoRem || '';
  document.getElementById('notaMotivo').value = estadoNota.motivo || '';
  document.getElementById('notaCierre').value = estadoNota.cierre || '';

  renderItems();
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

function actualizarNota() {
  estadoNota.motivo = document.getElementById('notaMotivo').value;
  estadoNota.cierre = document.getElementById('notaCierre').value;
  guardar();
  renderPreview();
}

// ============================================================
// ÍTEMS
// ============================================================
function agregarItem(valor = '') {
  estadoNota.items.push(valor);
  guardar();
  renderItems();
  renderPreview();
  const rows = document.querySelectorAll('#notaItemsList .nota-item-row input');
  if (rows.length) rows[rows.length - 1].focus();
}

function quitarItem(idx) {
  estadoNota.items.splice(idx, 1);
  guardar();
  renderItems();
  renderPreview();
}

function actualizarItem(idx, valor) {
  estadoNota.items[idx] = valor;
  guardar();
  renderPreview();
}

function moverItem(idx, dir) {
  const n = idx + dir;
  if (n < 0 || n >= estadoNota.items.length) return;
  [estadoNota.items[idx], estadoNota.items[n]] = [estadoNota.items[n], estadoNota.items[idx]];
  guardar();
  renderItems();
  renderPreview();
}

function renderItems() {
  const cont = document.getElementById('notaItemsList');
  const contador = document.getElementById('contadorItems');
  contador.textContent = `${estadoNota.items.length} ítem${estadoNota.items.length === 1 ? '' : 's'}`;

  if (estadoNota.items.length === 0) {
    cont.innerHTML = '<div style="color:#9ca3af;font-size:12.5px;padding:8px 0;">No hay ítems. Agregá uno con el botón de abajo.</div>';
    return;
  }

  cont.innerHTML = estadoNota.items.map((it, i) => `
    <div class="nota-item-row">
      <span class="num">${i + 1}.</span>
      <input type="text" value="${escapeAttr(it)}" placeholder="Ej: Hacia la belleza, David Foenkinos."
             oninput="actualizarItem(${i}, this.value)"
             onkeydown="if(event.key==='Enter'){event.preventDefault();agregarItem();}">
      <button class="btn-mini" onclick="moverItem(${i}, -1)" title="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="btn-mini" onclick="moverItem(${i}, 1)" title="Bajar" ${i === estadoNota.items.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="btn-mini danger" onclick="quitarItem(${i})" title="Quitar">✕</button>
    </div>
  `).join('');
}

// ============================================================
// DOCUMENTO
// ============================================================
function notaHTML() {
  const fechaLarga = estadoNota.fecha ? formatearFechaLarga(estadoNota.fecha) : '—';
  const destinatario = estadoNota.destinatario || '___________________';
  const cargoDest = estadoNota.cargoDest || '';
  const institucion = estadoNota.institucion || 'Hospital San Cristóbal';
  const remitente = estadoNota.remitente || '___________________';
  const cargoRem = estadoNota.cargoRem || '';
  const motivo = estadoNota.motivo || '';
  const cierre = estadoNota.cierre || '';
  const items = estadoNota.items.filter(i => i && i.trim());

  return `
    <div class="nota-doc">
      <div class="nota-header">
        <img src="santa fe.webp" alt="Santa Fe Provincia" class="logo-santafe">
        <img src="logo-hospital.jpg" alt="Hospital Julio César Villanueva" class="logo-hospital">
        <h3>NOTA</h3>
        <div class="sub"><strong>Hospital Julio César Villanueva</strong> — San Cristóbal</div>
      </div>

      <p class="nota-lugar">San Cristóbal, ${fechaLarga}.-</p>

      <div class="nota-destinatario">
        <p><strong>${escapeHtml(destinatario)}</strong>${cargoDest ? ` <span style="color:#6b7280">(${escapeHtml(cargoDest)})</span>` : ''}</p>
        <p>${escapeHtml(institucion)}</p>
      </div>

      ${motivo ? `<p class="nota-motivo">${escapeHtml(motivo)}</p>` : ''}

      ${items.length ? `
        <ol class="nota-lista">
          ${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
        </ol>
      ` : ''}

      ${cierre ? `<p class="nota-cierre">${escapeHtml(cierre)}</p>` : ''}

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
  // Refrescar fecha al momento de imprimir
  estadoNota.fecha = hoyISO();
  guardar();
  document.getElementById('cfgFecha').value = formatearFechaLarga(estadoNota.fecha);

  const zona = document.getElementById('zonaImpresion');
  zona.innerHTML = notaHTML();
  setTimeout(() => window.print(), 150);
}

// ============================================================
// VACIAR / EXPORTAR / IMPORTAR
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
    motivo: '',
    items: [],
    cierre: 'Esperando le den utilidad y cuidado a los mismos. Atte.'
  };
  guardar();
  cargar();
}

function exportarJSON() {
  const data = JSON.stringify(estadoNota, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const nombre = estadoNota.fecha ? estadoNota.fecha.replace(/-/g,'') : 'sin_fecha';
  a.href = url;
  a.download = `nota_${nombre}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') throw new Error('Formato inválido');
      estadoNota = { ...estadoNota, ...data };
      estadoNota.fecha = hoyISO(); // siempre fecha del día
      guardar();
      cargar();
      alert('✅ Nota importada.');
    } catch(err) { alert('Error al importar: ' + err.message); }
  };
  reader.readAsText(file);
  event.target.value = '';
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