/* =====================================================
   ATLAS CAE — calculadora.js
   Calculator, justification flow, PDF gate + jsPDF
   ===================================================== */

(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────── */
  const LIMITES = {
    cva:      { min: 0.1,  max: 30,     warn: 25,     label: 'consumo antiguo' },
    cvn:      { min: 0.1,  max: 80,     warn: 60,     label: 'consumo nuevo'   },
    km_anual: { min: 100,  max: 300000, warn: 150000,  label: 'kilometraje'    }
  };
  const TIPOS_VALIDOS     = ['application/pdf','image/jpeg','image/jpg','image/png','image/heic','image/webp'];
  const EXTENSIONES_VALIDAS = ['.pdf','.jpg','.jpeg','.png','.heic','.webp'];
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  const PRECIO_CAE = 0.13; // €/kWh_cumac

  /* ── Helpers ─────────────────────────────────────── */
  function mostrarError(id, txt) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = txt;
    el.className = 'field-msg error';
  }
  function mostrarAviso(id, txt) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = txt;
    el.className = 'field-msg warn';
  }
  function limpiarMsg(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.className = 'field-msg';
  }
  function setFieldState(id, estado) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('has-error','has-warn');
    if (estado) el.classList.add(estado);
  }

  /* ── Validate numeric ────────────────────────────── */
  function validarNumerico(id) {
    const input = document.getElementById(id);
    const lim   = LIMITES[id];
    const idMsg = 'msg-' + (id === 'km_anual' ? 'km' : id);
    const idFld = 'field-' + (id === 'km_anual' ? 'km' : id);
    const raw   = input.value.trim();
    if (raw === '') { limpiarMsg(idMsg); setFieldState(idFld, null); return false; }
    const val = parseFloat(raw);
    if (isNaN(val)) { mostrarError(idMsg, 'Introduce un número válido.'); setFieldState(idFld, 'has-error'); return false; }
    if (val < lim.min) { mostrarError(idMsg, `Valor mínimo: ${lim.min}.`); setFieldState(idFld, 'has-error'); return false; }
    if (val > lim.max) { mostrarError(idMsg, `Valor máximo: ${lim.max.toLocaleString('es-ES')}.`); setFieldState(idFld, 'has-error'); return false; }
    if (val > lim.warn) { mostrarAviso(idMsg, `Valor alto para ${lim.label}. Comprueba que es correcto.`); setFieldState(idFld, 'has-warn'); return true; }
    limpiarMsg(idMsg); setFieldState(idFld, null); return true;
  }

  /* ── Validate file ───────────────────────────────── */
  function validarArchivo(archivos, idMsg) {
    for (const f of archivos) {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      if (!TIPOS_VALIDOS.includes(f.type) && !EXTENSIONES_VALIDAS.includes(ext)) {
        mostrarError(idMsg, 'Formato no válido. Usa PDF, JPG, PNG, HEIC o WEBP.');
        return false;
      }
      if (f.size > MAX_BYTES) {
        mostrarError(idMsg, `"${f.name}" supera el límite de 10 MB.`);
        return false;
      }
    }
    limpiarMsg(idMsg);
    return true;
  }

  /* ── Calculator compute ──────────────────────────── */
  function calcularAETotal() {
    const okCVA = validarNumerico('cva');
    const okCVN = validarNumerico('cvn');
    const okKM  = validarNumerico('km_anual');

    const CVA = parseFloat(document.getElementById('cva').value) || 0;
    const f   = parseFloat(document.getElementById('factor').value) || 0;
    const CVN = parseFloat(document.getElementById('cvn').value) || 0;
    const L   = parseFloat(document.getElementById('km_anual').value) || 0;

    const elRes = document.getElementById('resultado');
    const elDin = document.getElementById('resultado_dinero');
    const pdfArea = document.getElementById('pdf-gate-area');

    if (!okCVA || !okCVN || !okKM || CVA === 0 || L === 0) {
      elRes.textContent = '—';
      elDin.textContent = '—';
      if (pdfArea) pdfArea.style.display = 'none';
      return;
    }

    const ahorro = (((CVA * f) - CVN) / 100) * L;
    const dinero = ahorro * PRECIO_CAE;
    elRes.textContent = ahorro.toFixed(2) + ' kWh/año';
    elDin.textContent = dinero.toFixed(2) + ' €';
    if (pdfArea) pdfArea.style.display = 'flex';
  }

  function actualizarFactor() {
    const tipo = document.getElementById('combustible').value;
    const factores = { diesel: 10, gasolina: 9.19, glp: 7.16, gnv: 13.33 };
    document.getElementById('factor').value = factores[tipo] ?? 1;
    calcularAETotal();
  }

  /* ── Block non-numeric keys ──────────────────────── */
  function bloquearTeclasInvalidas() {
    document.querySelectorAll('input[type="number"]:not([readonly])').forEach(inp => {
      inp.addEventListener('keydown', e => {
        const permitidos = ['Backspace','Delete','Tab','Escape','Enter',
          'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','.', ','];
        if (permitidos.includes(e.key) || e.ctrlKey || e.metaKey) return;
        if (!/^[0-9]$/.test(e.key)) e.preventDefault();
      });
      inp.addEventListener('paste', e => {
        const t = (e.clipboardData || window.clipboardData).getData('text');
        if (!/^\d*\.?\d*$/.test(t.trim())) e.preventDefault();
      });
    });
  }

  /* ── Toggle "Saber más" ──────────────────────────── */
  window.toggleDetalle = function (btn) {
    const paso = btn.closest('.paso-justificacion');
    if (!paso) return;
    const det  = paso.querySelector('.detalle-saber-mas');
    if (!det) return;
    const open = det.style.display === 'block';
    det.style.display = open ? 'none' : 'block';
    btn.textContent   = open ? 'Saber más' : 'Ocultar';
    btn.setAttribute('aria-expanded', String(!open));
  };

  /* ── Section switcher ────────────────────────────── */
  window.showSection = function (sec) {
    ['calculadora','justificacion'].forEach(id => {
      const el  = document.getElementById(id);
      const btn = document.getElementById('nav-' + id);
      const ok  = id === sec;
      if (!el || !btn) return;
      el.style.display = ok ? 'block' : 'none';
      el.classList.remove('animar-entrada');
      btn.classList.toggle('active', ok);
      btn.setAttribute('aria-selected', String(ok));
      if (ok) { void el.offsetWidth; el.classList.add('animar-entrada'); }
    });
  };

  /* ── Justification step flow ─────────────────────── */
  let pasoActual = 0;

  function inicializarJustificacion() {
    const pasos     = document.querySelectorAll('.paso-justificacion');
    const total     = pasos.length;
    const btnEnviar = document.getElementById('btn-enviar');
    const msgFinal  = document.getElementById('mensaje-final');
    const estadoEl  = document.getElementById('estado-justificacion');
    const barraEl   = document.getElementById('barra-progreso');
    const track     = barraEl?.closest('[role="progressbar"]');
    if (!pasos.length) return;

    pasoActual = 0;

    function actualizarVista() {
      pasos.forEach((p, i) => {
        const vis = i === pasoActual;
        p.style.display = vis ? 'block' : 'none';
        p.classList.remove('animar-paso');
        if (vis) { void p.offsetWidth; p.classList.add('animar-paso'); }
      });
      const pct = Math.round(((pasoActual + 1) / total) * 100);
      if (barraEl) barraEl.style.width = pct + '%';
      if (track) track.setAttribute('aria-valuenow', pct);
      if (estadoEl) estadoEl.textContent = `Paso ${pasoActual + 1} de ${total}`;
      if (btnEnviar) btnEnviar.style.display = pasoActual === total - 1 ? 'block' : 'none';
    }

    pasos.forEach((paso, idx) => {
      const input   = paso.querySelector('input[type="file"]');
      if (!input) return;
      const idMsg     = 'msg-file-' + idx;
      const idConfirm = 'confirm-' + idx;

      input.addEventListener('change', () => {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        if (!validarArchivo(files, idMsg)) { input.value = ''; return; }

        const conf  = document.getElementById(idConfirm);
        const label = conf?.querySelector('.confirm-label');
        if (label) {
          label.textContent = files.length > 1
            ? `${files.length} archivos seleccionados`
            : (files[0].name.length > 30 ? files[0].name.slice(0,28) + '…' : files[0].name);
        }
        if (conf) conf.style.display = 'flex';

        setTimeout(() => {
          if (idx < total - 1) { pasoActual = idx + 1; actualizarVista(); }
          else if (msgFinal)    { msgFinal.style.display = 'flex'; }
        }, 500);
      });
    });

    actualizarVista();
  }

  /* ── Form submit (justificación) ─────────────────── */
  function inicializarEnvio() {
    const form = document.getElementById('form-justificacion');
    const btn  = document.getElementById('btn-enviar');
    if (!form || !btn) return;

    const errEl    = document.getElementById('justificacion-error');
    const errSpan  = errEl?.querySelector('span');
    const successEl = document.getElementById('upload-success');

    function showError(msg) {
      if (errSpan) errSpan.textContent = msg;
      else if (errEl) errEl.textContent = msg;
      if (errEl) errEl.style.display = 'flex';
      console.error('[ATLAS] Error mostrado al usuario:', msg);
    }

    function hideError() {
      if (errEl) errEl.style.display = 'none';
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (btn.disabled) return;

      const nombreInput = form.querySelector('[name="nombre"]');
      const emailInput  = form.querySelector('[name="email"]');
      const emailVal    = emailInput?.value.trim() || '';

      hideError();

      if (!nombreInput?.value.trim()) {
        showError('El nombre es obligatorio.');
        nombreInput?.focus();
        return;
      }
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
        showError('Introduce un email válido.');
        emailInput?.focus();
        return;
      }

      const endpoint = form.dataset.endpoint || '';
      if (!endpoint) {
        showError('Endpoint no configurado. Actualiza data-endpoint en calculadora.html con la URL de tu backend.');
        return;
      }

      const formData = new FormData(form);

      // ── Log de diagnóstico (visible en DevTools → Console) ──
      console.group('[ATLAS Upload] Iniciando envío');
      console.log('Endpoint:', endpoint);
      console.log('Campos del formulario:');
      for (const [k, v] of formData.entries()) {
        if (v instanceof File) {
          console.log(`  ${k}: File("${v.name}", ${v.size} bytes, "${v.type || 'sin MIME'}")`);
        } else {
          console.log(`  ${k}: "${v}"`);
        }
      }
      console.groupEnd();

      btn.disabled = true;
      btn.innerHTML = '<span class="btn-spinner"></span>Enviando…';

      let res, data;
      try {
        res  = await fetch(endpoint, { method: 'POST', body: formData });
        data = await res.json().catch(() => ({}));

        console.group('[ATLAS Upload] Respuesta del servidor');
        console.log('Status HTTP:', res.status, res.ok ? '✓ OK' : '✗ ERROR');
        console.log('Body:', data);
        console.groupEnd();

        if (!res.ok) {
          throw new Error(data.message || 'Error del servidor (' + res.status + '). Inténtalo de nuevo.');
        }

        const caseId = data.caseId || '';
        console.log('[ATLAS Upload] Éxito. CaseId:', caseId);

        if (successEl) {
          const caseIdEl    = document.getElementById('upload-case-id');
          const emailUsedEl = document.getElementById('upload-email-used');
          if (caseIdEl)    caseIdEl.textContent    = caseId;
          if (emailUsedEl) emailUsedEl.textContent  = emailVal;
          form.style.display     = 'none';
          successEl.style.display = 'flex';
        } else {
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="rgba(0,0,0,.15)"/>
            <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>Documentación enviada`;
          btn.classList.add('btn-success');
        }

      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Subir documentación';

        // Distinguir error de red (CORS, servidor caído) de error del servidor
        const isNetworkError = !res;
        const mensaje = isNetworkError
          ? `Error de red: no se pudo conectar con el servidor. ¿Está online? (${err.message})`
          : err.message;

        console.group('[ATLAS Upload] ERROR');
        console.error('Tipo:', isNetworkError ? 'Red/CORS' : 'Servidor');
        console.error('Mensaje:', err.message);
        if (res) {
          console.error('HTTP status:', res.status);
          console.error('Respuesta:', data);
        }
        console.error('Objeto completo:', err);
        console.groupEnd();

        showError(mensaje);
      }
    });
  }

  /* ── PDF gate modal ──────────────────────────────── */
  function inicializarPDFGate() {
    const btnAbrir  = document.getElementById('btn-abrir-pdf');
    const overlay   = document.getElementById('pdf-modal-overlay');
    const btnCerrar = document.getElementById('pdf-modal-close');
    const form      = document.getElementById('pdf-gate-form');
    if (!btnAbrir || !overlay || !form) return;

    btnAbrir.addEventListener('click', () => {
      const ahorro = document.getElementById('resultado').textContent;
      if (!ahorro || ahorro === '—') return;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      document.getElementById('pdf-nombre')?.focus();
    });

    btnCerrar?.addEventListener('click', () => cerrarPDFModal());
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrarPDFModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) cerrarPDFModal();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const nombre  = sanitize(document.getElementById('pdf-nombre').value.trim());
      const empresa = sanitize(document.getElementById('pdf-empresa').value.trim());
      const email   = sanitize(document.getElementById('pdf-email').value.trim());
      if (!nombre || !email) return;

      /* Re-calculate values from inputs — never from DOM */
      const CVA = parseFloat(document.getElementById('cva').value) || 0;
      const f   = parseFloat(document.getElementById('factor').value) || 0;
      const CVN = parseFloat(document.getElementById('cvn').value) || 0;
      const L   = parseFloat(document.getElementById('km_anual').value) || 0;
      const combustible = document.getElementById('combustible').options[
        document.getElementById('combustible').selectedIndex].text;

      const ahorro = (((CVA * f) - CVN) / 100) * L;
      const dinero = ahorro * PRECIO_CAE;

      generarPDF({ nombre, empresa, email }, { CVA, f, CVN, L, combustible, ahorro, dinero });
      cerrarPDFModal();
    });
  }

  function cerrarPDFModal() {
    const overlay = document.getElementById('pdf-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function sanitize(str) {
    return str.replace(/[<>'"&]/g, '');
  }

  /* ── PDF generation ──────────────────────────────── */
  function generarPDF(usuario, calc) {
    if (!window.jspdf) {
      alert('La librería PDF no está disponible. Comprueba la conexión a internet.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const NAVY  = [10, 22, 40];
    const TEAL  = [0, 196, 154];
    const GRAY  = [100, 116, 139];
    const LIGHT = [203, 213, 225];

    /* ─ Header ─ */
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 46, 'F');
    doc.setFillColor(...TEAL);
    doc.rect(0, 46, W, 1.5, 'F');

    /* Logo text */
    doc.setFont('helvetica','bold');
    doc.setFontSize(20);
    doc.setTextColor(255,255,255);
    doc.text('ATLAS CAE', 16, 22);
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEAL);
    doc.text('CERTIFICADOS DE AHORRO ENERGÉTICO', 16, 29);

    /* Date */
    doc.setTextColor(...LIGHT);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }), W - 16, 22, { align: 'right' });

    /* ─ Title block ─ */
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.setTextColor(...NAVY);
    doc.text('Informe de Potencial CAE', 16, 62);
    doc.setFontSize(12);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica','normal');
    doc.text('Estimación para vehículos de motor — ATLAS CAE, S.L.', 16, 70);

    /* Divider */
    doc.setDrawColor(230,235,240);
    doc.setLineWidth(0.4);
    doc.line(16, 75, W - 16, 75);

    /* ─ User data ─ */
    let y = 83;
    doc.setFontSize(8.5);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...GRAY);
    doc.text('PREPARADO PARA', 16, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...NAVY);
    doc.text(usuario.nombre, 16, y);
    if (usuario.empresa) {
      doc.setFont('helvetica','normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...GRAY);
      y += 5.5;
      doc.text(usuario.empresa, 16, y);
    }
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    y += 5;
    doc.text(usuario.email, 16, y);

    /* ─ Result box ─ */
    y += 12;
    doc.setFillColor(240, 253, 249);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.8);
    doc.roundedRect(16, y, W - 32, 38, 4, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...GRAY);
    doc.text('RESULTADO DEL CÁLCULO', 24, y + 8);

    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Ahorro energético estimado', 24, y + 16);
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.setTextColor(...TEAL);
    doc.text(calc.ahorro.toFixed(2) + ' kWh/año', W - 24, y + 16, { align: 'right' });

    doc.setFontSize(0.4);
    doc.setDrawColor(220,232,225);
    doc.setLineWidth(0.3);
    doc.line(24, y + 20, W - 24, y + 20);

    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Valor estimado para el cliente (a 0,13 €/kWh_cumac)', 24, y + 28);
    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.setTextColor(...TEAL);
    doc.text(calc.dinero.toFixed(2) + ' €', W - 24, y + 28, { align: 'right' });

    /* ─ Inputs summary ─ */
    y += 50;
    doc.setFont('helvetica','bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text('DATOS INTRODUCIDOS', 16, y);
    y += 6;
    const datos = [
      ['Combustible vehículo antiguo:', calc.combustible],
      ['Consumo vehículo antiguo:', `${calc.CVA} L/100 km`],
      ['Factor de conversión:', `${calc.f} kWh/L`],
      ['Consumo vehículo nuevo (eléctrico):', `${calc.CVN} kWh/100 km`],
      ['Kilometraje anual estimado:', `${Number(calc.L).toLocaleString('es-ES')} km/año`],
    ];
    datos.forEach(([k, v]) => {
      doc.setFont('helvetica','normal');
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(k, 16, y);
      doc.setFont('helvetica','bold');
      doc.setTextColor(...NAVY);
      doc.text(v, W - 16, y, { align: 'right' });
      y += 6;
    });

    /* ─ Disclaimer ─ */
    y += 4;
    doc.setFillColor(249, 250, 252);
    doc.roundedRect(16, y, W - 32, 24, 3, 3, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    const disclaimer = [
      'Esta estimación es orientativa y se calcula a partir de los datos introducidos por el usuario.',
      'El valor real del CAE depende de la verificación técnica, la duración de vida útil de la actuación',
      'y las condiciones del mercado en el momento de la venta. ATLAS CAE, S.L. no garantiza el resultado.',
    ];
    disclaimer.forEach((line, i) => { doc.text(line, 22, y + 7 + i * 5); });

    /* ─ Page 2 ─ */
    doc.addPage();
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 20, 'F');
    doc.setFillColor(...TEAL);
    doc.rect(0, 20, W, 1, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor(255,255,255);
    doc.text('ATLAS CAE', 16, 13);
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEAL);
    doc.text('Certificados de Ahorro Energético', 43, 13);

    y = 34;
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.text('¿Qué es un CAE?', 16, y);
    y += 7;
    doc.setFont('helvetica','normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    const que = doc.splitTextToSize(
      'Un Certificado de Ahorro Energético (CAE) es un activo financiero que acredita un ahorro de energía medible y verificable. En España, las empresas obligadas (distribuidoras eléctricas y gasistas) deben alcanzar un objetivo anual de ahorro y pueden comprarlo a quienes lo generen. El valor del CAE es de 1 kWh_cumac (ahorro acumulado durante la vida útil de la mejora).',
      W - 32
    );
    doc.text(que, 16, y);
    y += que.length * 5.5 + 8;

    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text('Proceso ATLAS CAE en 3 pasos', 16, y);
    y += 8;

    const pasos = [
      ['01', 'Cartografiamos el ahorro', 'Identificamos qué actuaciones de tu empresa son certificables bajo la metodología oficial. Analizamos consumos, documentación y elegibilidad.'],
      ['02', 'Navegamos la regulación', 'Tramitamos toda la documentación: declaración responsable, facturas, verificación y justificación ante el operador. Cuatro fases, gestionadas íntegramente por nosotros.'],
      ['03', 'Monetizamos el certificado', 'Gestionamos la venta del CAE a través de un operador acreditado y te transferimos el importe neto. Plazo máximo de 2 meses desde documentación completa (para operaciones >200 MWh).'],
    ];
    pasos.forEach(([num, titulo, desc]) => {
      doc.setFillColor(...TEAL);
      doc.roundedRect(16, y - 3, 9, 9, 2, 2, 'F');
      doc.setFont('helvetica','bold');
      doc.setFontSize(7);
      doc.setTextColor(255,255,255);
      doc.text(num, 16 + 4.5, y + 3.5, { align: 'center' });

      doc.setFont('helvetica','bold');
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(titulo, 30, y + 2);
      y += 8;
      doc.setFont('helvetica','normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      const lines = doc.splitTextToSize(desc, W - 46);
      doc.text(lines, 30, y);
      y += lines.length * 5 + 6;
    });

    /* ─ Contact block ─ */
    y += 4;
    doc.setFillColor(240, 253, 249);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.roundedRect(16, y, W - 32, 30, 4, 4, 'FD');
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text('¿Quieres que revisemos tu caso?', 24, y + 9);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text('Contacta con nuestro equipo y analizamos sin compromiso tu operación.', 24, y + 15.5);
    doc.setFont('helvetica','bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL);
    doc.text('equipo@atlascae.es', 24, y + 23);
    doc.text('www.atlascae.es', W - 24, y + 23, { align: 'right' });

    /* ─ Footer ─ */
    doc.setDrawColor(230,235,240);
    doc.setLineWidth(0.3);
    doc.line(16, H - 14, W - 16, H - 14);
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('ATLAS CAE, S.L. · Calle Escorial nº 20, Escalera 8, 1º B · 28690, Madrid · legal@atlascae.es', 16, H - 8);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, W - 16, H - 8, { align: 'right' });

    /* ─ Save ─ */
    const nombreArchivo = 'ATLAS-CAE-Informe-' + new Date().toISOString().slice(0,10) + '.pdf';
    doc.save(nombreArchivo);
  }

  /* ── Init ────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    showSection('calculadora');
    actualizarFactor();

    const formCalc = document.getElementById('form-calculadora');
    if (formCalc) {
      formCalc.addEventListener('input', calcularAETotal);
      document.getElementById('combustible')?.addEventListener('change', actualizarFactor);
      ['cva','cvn','km_anual'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => validarNumerico(id));
      });
    }

    bloquearTeclasInvalidas();
    inicializarJustificacion();
    inicializarEnvio();
    inicializarPDFGate();
  });

})();
