/* Fixed email destination; the public form identifier is not a secret. */
(() => {
  'use strict';
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const result = document.querySelector('#contact-status');
  const errors = document.querySelector('#contact-errors');
  const submit = form.querySelector('button[type="submit"]');
  const fields = ['name', 'email', 'message'].map(key => form.elements.namedItem(key));
  let pending = false;
  let captchaLoaded = false;
  const loadCaptcha = () => {
    if (captchaLoaded) return;
    captchaLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?recaptchacompat=off';
    script.async = true;
    script.onerror = () => {
      result.textContent = 'The spam check could not load. Please reload or use the email link.';
    };
    document.head.append(script);
  };
  form.addEventListener('focusin', loadCaptcha, {once: true});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { loadCaptcha(); observer.disconnect(); }
    }, {rootMargin: '250px'});
    observer.observe(form);
  } else loadCaptcha();
  function clearError(field) {
    field.removeAttribute('aria-invalid');
    document.querySelector(`#${field.id}-error`).textContent = '';
  }
  form.addEventListener('input', event => {
    if (fields.includes(event.target)) clearError(event.target);
    errors.hidden = true;
    if (!pending) result.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    fields.forEach(clearError);
    const [name, email, message] = fields;
    const invalid = [];
    if (name.value.trim().length < 2 || name.value.length > 80 || /[\r\n\u0000-\u001f]/.test(name.value)) invalid.push([name, 'Enter your name using 2–80 characters.']);
    if (!email.value.trim() || !email.validity.valid || email.value.length > 254) invalid.push([email, 'Enter a valid email address.']);
    if (message.value.trim().length < 10 || message.value.length > 1400) invalid.push([message, 'Add a message of 10–1,400 characters.']);
    if (invalid.length) {
      for (const [field, text] of invalid) {
        field.setAttribute('aria-invalid', 'true');
        document.querySelector(`#${field.id}-error`).textContent = text;
      }
      errors.textContent = 'Please check the highlighted fields.';
      errors.hidden = false;
      invalid[0][0].focus();
      return;
    }
    if (form.elements.namedItem('botcheck').checked) return;
    const captcha = form.querySelector('[name="h-captcha-response"]')?.value;
    if (!captcha) {
      loadCaptcha();
      result.textContent = 'Please complete the spam check, then send your message.';
      result.focus({preventScroll: true});
      return;
    }
    const payload = {
      access_key: form.elements.namedItem('access_key').value,
      subject: 'New portfolio enquiry — Sikandar Studio',
      from_name: 'Sikandar Studio Portfolio',
      name: name.value.trim(), email: email.value.trim(),
      project: form.elements.namedItem('project').value,
      message: message.value.trim(), 'h-captcha-response': captcha,
      botcheck: false
    };
    pending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const locked = [...form.querySelectorAll('input:not([type="hidden"]),textarea,select')].filter(field => !field.disabled && field.name !== 'h-captcha-response');
    locked.forEach(field => field.disabled = true);
    result.textContent = 'Sending your message…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify(payload), signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error('Unconfirmed');
      result.textContent = 'Message sent. Thank you for getting in touch—I’ll reply to your email.';
      form.reset();
    } catch {
      result.textContent = 'Delivery could not be confirmed. Your message is still here. Please use the email link if needed; retrying may send a duplicate.';
    } finally {
      clearTimeout(timer);
      window.hcaptcha?.reset();
      locked.forEach(field => field.disabled = false);
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      pending = false;
      result.focus({preventScroll: true});
    }
  });
})();
