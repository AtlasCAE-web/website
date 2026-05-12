/* ═══════════════════════════════════════════════════
   ATLAS CAE — Calculadora de Ahorro Energético
   Lógica de aplicación

   Secciones:
   1.  CONFIG       — Límites y tipos de archivo válidos
   2.  HELPERS      — Mensajes de campo y estado
   3.  VALIDAR      — Campo numérico
   4.  VALIDAR      — Archivo (tipo + tamaño)
   5.  CALCULADORA  — Cálculo de ahorro energético
   6.  TOGGLE       — Detalle "Saber más"
   7.  NAVEGACIÓN   — Cambio de sección
   8.  JUSTIFICACIÓN — Flujo de pasos + progreso
   9.  ENVÍO        — Estado de carga y éxito
   10. BLOQUEAR     — Teclas no numéricas
   11. INIT
═══════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────
   1. CONFIG — Límites realistas para validación
───────────────────────────────────────────────────── */
const LIMITES = {
    cva:      { min: 0.1, max: 30,     warn: 25,    label: 'consumo antiguo' },
    cvn:      { min: 0.1, max: 80,     warn: 60,    label: 'consumo nuevo' },
    km_anual: { min: 100, max: 300000, warn: 150000, label: 'kilometraje' }
};

const TIPOS_VALIDOS = [
    'application/pdf', 'image/jpeg', 'image/jpg',
    'image/png', 'image/heic', 'image/webp'
];
const EXTENSIONES_VALIDAS = ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/* ─────────────────────────────────────────────────────
   2. HELPERS — Mensajes de campo y estado
───────────────────────────────────────────────────── */
function mostrarError(idMsg, texto) {
    const el = document.getElementById(idMsg);
    if (!el) return;
    el.textContent = texto;
    el.className = 'field-msg error';
}

function mostrarAviso(idMsg, texto) {
    const el = document.getElementById(idMsg);
    if (!el) return;
    el.textContent = texto;
    el.className = 'field-msg warn';
}

function limpiarMsg(idMsg) {
    const el = document.getElementById(idMsg);
    if (!el) return;
    el.textContent = '';
    el.className = 'field-msg';
}

function setFieldState(idField, estado) {
    const el = document.getElementById(idField);
    if (!el) return;
    el.classList.remove('has-error', 'has-warn');
    if (estado) el.classList.add(estado);
}

/* ─────────────────────────────────────────────────────
   3. VALIDAR — Un campo numérico
   Devuelve true si es aceptable para calcular.
───────────────────────────────────────────────────── */
function validarNumerico(id) {
    const input = document.getElementById(id);
    const lim   = LIMITES[id];
    const idMsg = 'msg-' + (id === 'km_anual' ? 'km' : id);
    const idFld = 'field-' + (id === 'km_anual' ? 'km' : id);
    const raw   = input.value.trim();

    if (raw === '' || raw === null) {
        limpiarMsg(idMsg);
        setFieldState(idFld, null);
        return false;
    }

    const val = parseFloat(raw);

    if (isNaN(val)) {
        mostrarError(idMsg, 'Introduce un número válido.');
        setFieldState(idFld, 'has-error');
        return false;
    }
    if (val < lim.min) {
        mostrarError(idMsg, `El valor mínimo es ${lim.min}.`);
        setFieldState(idFld, 'has-error');
        return false;
    }
    if (val > lim.max) {
        mostrarError(idMsg, `El valor máximo es ${lim.max.toLocaleString('es-ES')}.`);
        setFieldState(idFld, 'has-error');
        return false;
    }
    if (val > lim.warn) {
        mostrarAviso(idMsg, `Valor alto para ${lim.label}. Comprueba que es correcto.`);
        setFieldState(idFld, 'has-warn');
        return true;
    }

    limpiarMsg(idMsg);
    setFieldState(idFld, null);
    return true;
}

/* ─────────────────────────────────────────────────────
   4. VALIDAR — Archivo (tipo + tamaño)
───────────────────────────────────────────────────── */
function validarArchivo(archivos, idMsg) {
    for (const archivo of archivos) {
        const extension = '.' + archivo.name.split('.').pop().toLowerCase();
        const tipoValido = TIPOS_VALIDOS.includes(archivo.type) ||
                           EXTENSIONES_VALIDAS.includes(extension);
        if (!tipoValido) {
            mostrarError(idMsg, 'Formato no válido. Usa PDF, JPG, PNG, HEIC o WEBP.');
            return false;
        }
        if (archivo.size > MAX_BYTES) {
            mostrarError(idMsg, `El archivo "${archivo.name}" supera el límite de 10 MB.`);
            return false;
        }
    }
    limpiarMsg(idMsg);
    return true;
}

/* ─────────────────────────────────────────────────────
   5. CALCULADORA — Cálculo de ahorro energético
───────────────────────────────────────────────────── */
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

    if (!okCVA || !okCVN || !okKM || CVA === 0 || L === 0) {
        elRes.textContent = '—';
        elDin.textContent = '—';
        return;
    }

    const ahorro = (((CVA * f) - CVN) / 100) * L;
    const dinero = ahorro * 0.12;

    elRes.textContent = ahorro.toFixed(2) + ' kWh/año';
    elDin.textContent = dinero.toFixed(2) + ' €';
}

function actualizarFactor() {
    const tipo = document.getElementById('combustible').value;
    const factores = { diesel: 10, gasolina: 9.19, glp: 7.16, gnv: 13.33 };
    document.getElementById('factor').value = factores[tipo] ?? 1;
    calcularAETotal();
}

/* ─────────────────────────────────────────────────────
   6. TOGGLE — Detalle "Saber más"
───────────────────────────────────────────────────── */
function toggleDetalle(boton) {
    const paso    = boton.closest('.paso-justificacion');
    if (!paso) return;
    const detalle = paso.querySelector('.detalle-saber-mas');
    if (!detalle) return;
    const abierto = detalle.style.display === 'block';
    detalle.style.display  = abierto ? 'none' : 'block';
    boton.textContent      = abierto ? 'Saber más' : 'Ocultar';
    boton.setAttribute('aria-expanded', String(!abierto));
}

/* ─────────────────────────────────────────────────────
   7. NAVEGACIÓN — Cambio de sección
───────────────────────────────────────────────────── */
function showSection(seccion) {
    const ids = ['calculadora', 'justificacion'];
    ids.forEach(id => {
        const el  = document.getElementById(id);
        const nav = document.getElementById('nav-' + id);
        const activa = id === seccion;
        el.style.display = activa ? 'block' : 'none';
        el.classList.remove('animar-entrada');
        nav.classList.toggle('active', activa);
        nav.setAttribute('aria-selected', String(activa));
        if (activa) {
            void el.offsetWidth;
            el.classList.add('animar-entrada');
        }
    });
}

/* ─────────────────────────────────────────────────────
   8. JUSTIFICACIÓN — Flujo de pasos + progreso
───────────────────────────────────────────────────── */
let pasoActual = 0;

function inicializarJustificacion() {
    const pasos      = document.querySelectorAll('.paso-justificacion');
    const totalPasos = pasos.length;
    const btnEnviar  = document.getElementById('btn-enviar');
    const msgFinal   = document.getElementById('mensaje-final');
    const estadoEl   = document.getElementById('estado-justificacion');
    const barraEl    = document.getElementById('barra-progreso');
    const progrTrack = barraEl.closest('[role="progressbar"]');

    pasoActual = 0;

    function actualizarVista() {
        pasos.forEach((paso, i) => {
            const visible = i === pasoActual;
            paso.style.display = visible ? 'block' : 'none';
            paso.classList.remove('animar-paso');
            if (visible) { void paso.offsetWidth; paso.classList.add('animar-paso'); }
        });
        const porcentaje = Math.round(((pasoActual + 1) / totalPasos) * 100);
        barraEl.style.width = porcentaje + '%';
        progrTrack.setAttribute('aria-valuenow', porcentaje);
        estadoEl.textContent = `Paso ${pasoActual + 1} de ${totalPasos}`;
        btnEnviar.style.display = pasoActual === totalPasos - 1 ? 'block' : 'none';
    }

    pasos.forEach((paso, index) => {
        const input = paso.querySelector('input[type="file"]');
        if (!input) return;
        const idMsg     = 'msg-file-' + index;
        const idConfirm = 'confirm-' + index;

        input.addEventListener('change', () => {
            const archivos = Array.from(input.files || []);
            if (!archivos.length) return;

            if (!validarArchivo(archivos, idMsg)) {
                input.value = '';
                return;
            }

            const confirmDiv = document.getElementById(idConfirm);
            const labelSpan  = confirmDiv?.querySelector('.confirm-label');
            if (labelSpan) {
                labelSpan.textContent = archivos.length > 1
                    ? `${archivos.length} archivos seleccionados`
                    : archivos[0].name.length > 30
                        ? archivos[0].name.slice(0, 28) + '…'
                        : archivos[0].name;
            }
            if (confirmDiv) confirmDiv.style.display = 'flex';

            setTimeout(() => {
                if (index < totalPasos - 1) {
                    pasoActual = index + 1;
                    actualizarVista();
                } else {
                    msgFinal.style.display = 'flex';
                }
            }, 500);
        });
    });

    actualizarVista();
}

/* ─────────────────────────────────────────────────────
   9. ENVÍO — Estado de carga y éxito
───────────────────────────────────────────────────── */
function inicializarEnvio() {
    const form      = document.getElementById('form-justificacion');
    const btnEnviar = document.getElementById('btn-enviar');
    if (!form || !btnEnviar) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (btnEnviar.disabled) return;
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<span class="btn-spinner"></span>Enviando…';
        setTimeout(() => {
            btnEnviar.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="8" fill="rgba(0,0,0,0.15)"/>
                    <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="white" stroke-width="1.6"
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Documentación enviada`;
            btnEnviar.classList.add('btn-success');
        }, 1500);
    });
}

/* ─────────────────────────────────────────────────────
   10. BLOQUEAR — Teclas no numéricas en inputs number
───────────────────────────────────────────────────── */
function bloquearTeclasInvalidas() {
    const inputs = document.querySelectorAll('input[type="number"]:not([readonly])');
    inputs.forEach(input => {
        input.addEventListener('keydown', e => {
            const permitidas = [
                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End', '.', ','
            ];
            if (permitidas.includes(e.key)) return;
            if (e.ctrlKey || e.metaKey) return; // Ctrl+C, Ctrl+V, etc.
            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
        });
        input.addEventListener('paste', e => {
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^\d*\.?\d*$/.test(texto.trim())) e.preventDefault();
        });
    });
}

/* ─────────────────────────────────────────────────────
   11. INIT
───────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
    showSection('calculadora');
    actualizarFactor();

    document.getElementById('form-calculadora').addEventListener('input', () => {
        calcularAETotal();
    });
    document.getElementById('combustible').addEventListener('change', actualizarFactor);

    ['cva', 'cvn', 'km_anual'].forEach(id => {
        document.getElementById(id).addEventListener('blur', () => validarNumerico(id));
    });

    bloquearTeclasInvalidas();
    inicializarJustificacion();
    inicializarEnvio();
});
