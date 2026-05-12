/* =====================================================
   ATLAS CAE — contacto.js
   Contact form: validation + Formspree submission
   ===================================================== */

(function () {
  'use strict';

  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xjglonql';

  function sanitize(str) {
    return String(str).replace(/[<>'"&]/g, '').trim();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return phone === '' || /^[+]?[\d\s\-().]{7,20}$/.test(phone);
  }

  function setError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const msgEl = document.getElementById('msg-' + fieldId);
    if (field) field.closest('.field')?.classList.add('has-error');
    if (msgEl) { msgEl.textContent = msg; msgEl.className = 'field-msg error'; }
    return false;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const msgEl = document.getElementById('msg-' + fieldId);
    if (field) field.closest('.field')?.classList.remove('has-error');
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'field-msg'; }
  }

  function validateForm(data) {
    let ok = true;
    if (!data.nombre) { setError('cf-nombre', 'Campo obligatorio.'); ok = false; } else clearError('cf-nombre');
    if (!data.email)  { setError('cf-email', 'Campo obligatorio.'); ok = false; }
    else if (!isValidEmail(data.email)) { setError('cf-email', 'Email no válido.'); ok = false; }
    else clearError('cf-email');
    if (!isValidPhone(data.telefono)) { setError('cf-telefono', 'Teléfono no válido.'); ok = false; } else clearError('cf-telefono');
    if (!data.consentimiento) {
      const msgEl = document.getElementById('msg-consentimiento');
      if (msgEl) { msgEl.textContent = 'Debes aceptar la política de privacidad.'; msgEl.className = 'field-msg error'; }
      ok = false;
    } else {
      const msgEl = document.getElementById('msg-consentimiento');
      if (msgEl) { msgEl.textContent = ''; msgEl.className = 'field-msg'; }
    }
    return ok;
  }

  window.addEventListener('DOMContentLoaded', () => {
    const form     = document.getElementById('form-contacto');
    const btnEnviar = document.getElementById('btn-contacto');
    const alertOk  = document.getElementById('contact-ok');
    const alertErr = document.getElementById('contact-err');
    if (!form) return;

    /* Character counter for message */
    const msgInput  = document.getElementById('cf-mensaje');
    const msgCount  = document.getElementById('msg-count');
    if (msgInput && msgCount) {
      msgInput.addEventListener('input', () => {
        msgCount.textContent = msgInput.value.length + '/1000';
      });
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (btnEnviar.disabled) return;

      const data = {
        nombre:        sanitize(document.getElementById('cf-nombre')?.value || ''),
        apellidos:     sanitize(document.getElementById('cf-apellidos')?.value || ''),
        empresa:       sanitize(document.getElementById('cf-empresa')?.value || ''),
        cargo:         sanitize(document.getElementById('cf-cargo')?.value || ''),
        email:         sanitize(document.getElementById('cf-email')?.value || ''),
        telefono:      sanitize(document.getElementById('cf-telefono')?.value || ''),
        provincia:     sanitize(document.getElementById('cf-provincia')?.value || ''),
        tipo_cliente:  sanitize(document.getElementById('cf-tipo-cliente')?.value || ''),
        tipo_cae:      sanitize(document.getElementById('cf-tipo-cae')?.value || ''),
        consumo:       sanitize(document.getElementById('cf-consumo')?.value || ''),
        mensaje:       sanitize(document.getElementById('cf-mensaje')?.value || '').slice(0, 1000),
        consentimiento: document.getElementById('cf-consentimiento')?.checked || false,
      };

      if (!validateForm(data)) return;

      btnEnviar.disabled = true;
      btnEnviar.innerHTML = '<span class="btn-spinner"></span>Enviando…';
      if (alertOk) alertOk.style.display = 'none';
      if (alertErr) alertErr.style.display = 'none';

      const payload = new FormData();
      Object.entries(data).forEach(([k, v]) => payload.append(k, v));

      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: payload,
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Error ' + res.status);
        }
        /* Success */
        form.reset();
        if (alertOk) alertOk.style.display = 'flex';
        form.style.display = 'none';
        window.scrollTo({ top: alertOk?.offsetTop - 80 || 0, behavior: 'smooth' });
      } catch (err) {
        if (alertErr) {
          alertErr.style.display = 'flex';
          alertErr.querySelector('span').textContent =
            'No se pudo enviar el formulario. Inténtalo de nuevo o escríbenos a equipo@atlascae.es.';
        }
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar consulta';
      }
    });

    /* Live validation on blur */
    ['cf-nombre','cf-email','cf-telefono'].forEach(id => {
      document.getElementById(id)?.addEventListener('blur', () => {
        const val = sanitize(document.getElementById(id)?.value || '');
        if (id === 'cf-nombre' && !val) setError(id, 'Campo obligatorio.');
        else if (id === 'cf-email' && val && !isValidEmail(val)) setError(id, 'Email no válido.');
        else if (id === 'cf-telefono' && val && !isValidPhone(val)) setError(id, 'Teléfono no válido.');
        else clearError(id);
      });
    });
  });

})();
