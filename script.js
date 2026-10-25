// ============================================
// ACCELERATE GLOBAL IMPACT SUMMIT 2026 - JAVASCRIPT
// Theme: FRESH OIL — For Innovative Thinking
// Powered by CCYI Global & Access Chapel
// ============================================

// ===== GOOGLE SHEETS REGISTRATION ENDPOINT =====
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzL6X5CrqI0u08AJNwFN6KD68DEhHLF45-jWGivI7S41-zzAjvA3QxhD8qbm-ENRUcjTg/exec';

// ===== EVENTS REQUIRING PAYMENT =====
const PAID_EVENTS = [
  'Friday, 27th November 2026',
  'Both Days'
];

function requiresPayment(eventValue) {
  if (!eventValue) return false;
  return PAID_EVENTS.some(p => eventValue.toLowerCase().includes(p.toLowerCase()));
}

// ===== RECEIPT NUMBER GENERATOR =====
function generateReceiptNumber() {
  const prefix = 'AGIS26';
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const stamp  = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${random}-${stamp}`;
}

// ===== RENDER RECEIPT =====
function renderReceipt(data) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };
  set('receiptNumber', data.receiptNumber);
  set('receiptName',   data.fullName);
  set('receiptEmail',  data.email);
  set('receiptPhone',  data.phone);
  set('receiptEvent',  data.event);
  
  const statusEl = document.getElementById('receiptStatus');
  if (statusEl) {
    if (requiresPayment(data.event)) {
      statusEl.innerHTML = '<span class="status-badge status-pending">₦5,000 Due (Transfer)</span>';
    } else {
      statusEl.innerHTML = '<span class="status-badge status-confirmed">Free Admission</span>';
    }
  }

  set('receiptDate', new Date(data.issuedAt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }));
}

// ===== EVENT SELECT COST INDICATOR =====
const eventSelect = document.getElementById('event');
const eventCostIndicator = document.getElementById('eventCostIndicator');
const eventCostBadge = document.getElementById('eventCostBadge');
const eventCostText = document.getElementById('eventCostText');

if (eventSelect && eventCostIndicator) {
  eventSelect.addEventListener('change', () => {
    const val = eventSelect.value;
    if (!val) {
      eventCostIndicator.classList.add('hidden');
      return;
    }
    eventCostIndicator.classList.remove('hidden');
    if (requiresPayment(val)) {
      eventCostBadge.className = 'badge-price';
      eventCostBadge.textContent = 'Fee: ₦5,000';
      eventCostText.textContent = val.includes('Both') 
        ? 'Includes Friday Tech Summit (₦5,000) + Free Saturday Grand Summit access.'
        : 'Access to Friday Tech Summit masterclass sessions & materials.';
    } else {
      eventCostBadge.className = 'badge-free';
      eventCostBadge.textContent = 'Admission: FREE';
      eventCostText.textContent = 'Complimentary pass for Saturday Grand Summit sessions.';
    }
  });
}

// ===== REGISTRATION FORM + RECEIPT + PAYMENT =====
const registerForm = document.getElementById('registerForm');
const formSuccess = document.getElementById('formSuccess');
const paymentPanel = document.getElementById('paymentPanel');

if (registerForm && formSuccess) {
  let isSubmitting = false;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fullNameInput = document.getElementById('fullName');
    const emailInput    = document.getElementById('email');
    const phoneInput    = document.getElementById('phone');
    const eventInput    = document.getElementById('event');

    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    const email    = emailInput    ? emailInput.value.trim()    : '';
    const phone    = phoneInput    ? phoneInput.value.trim()    : '';
    const eventVal = eventInput    ? eventInput.value           : '';

    // Simple validation
    if (!fullName || !email || !phone || !eventVal) {
      alert('Please complete all required fields.');
      return;
    }

    isSubmitting = true;
    const receiptNumber = generateReceiptNumber();
    const issuedAt      = new Date().toISOString();
    const needsPayment  = requiresPayment(eventVal);

    const formData = {
      fullName,
      email,
      phone,
      event: eventVal,
      receiptNumber,
      issuedAt,
      paymentStatus: needsPayment ? 'PENDING' : 'NOT_REQUIRED'
    };

    // Save to localStorage as a safety backup
    try {
      const stored = JSON.parse(localStorage.getItem('agis_registrations') || '[]');
      stored.push(formData);
      localStorage.setItem('agis_registrations', JSON.stringify(stored));
      localStorage.setItem('agis_last_registration', JSON.stringify(formData));
    } catch (storageErr) {
      console.warn('LocalStorage save skipped:', storageErr);
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Registration...';
    submitBtn.disabled = true;

    // Timeout helper for Google Sheets fetch
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      // Send to Google Sheets (non-blocking if slow)
      await Promise.race([
        fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData)
        }),
        timeoutPromise
      ]).catch(err => {
        console.warn('Google Sheet sync notice:', err.message);
      });

      renderReceipt(formData);
      registerForm.style.display = 'none';
      formSuccess.classList.remove('hidden');

      if (needsPayment) {
        const refEl = document.getElementById('paymentRef');
        if (refEl) refEl.textContent = receiptNumber;
        const refNotice = document.getElementById('paymentRefNotice');
        if (refNotice) refNotice.textContent = receiptNumber;

        // Customise WhatsApp Proof Link
        const waBtn = document.getElementById('whatsappProofBtn');
        if (waBtn) {
          const msg = encodeURIComponent(
            `Hello AGIS Team, I just registered for AGIS 2026.\n\n` +
            `*Name:* ${fullName}\n` +
            `*Receipt No:* ${receiptNumber}\n` +
            `*Event:* ${eventVal}\n\n` +
            `Here is my proof of payment (₦5,000) to GTBank 0131301273.`
          );
          waBtn.href = `https://wa.me/2348035690386?text=${msg}`;
        }

        if (paymentPanel) paymentPanel.classList.remove('hidden');
      } else {
        if (paymentPanel) paymentPanel.classList.add('hidden');
      }

      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
      console.error('Registration processing error:', error);
      // Still show receipt because data is captured locally!
      renderReceipt(formData);
      registerForm.style.display = 'none';
      formSuccess.classList.remove('hidden');
    } finally {
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.disabled = false;
      isSubmitting = false;
    }
  });
}

// ===== REGISTER ANOTHER PERSON BUTTON =====
const registerAnotherBtn = document.getElementById('registerAnotherBtn');
if (registerAnotherBtn && registerForm && formSuccess) {
  registerAnotherBtn.addEventListener('click', () => {
    registerForm.reset();
    registerForm.style.display = 'block';
    formSuccess.classList.add('hidden');
    if (eventCostIndicator) eventCostIndicator.classList.add('hidden');
    registerForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// ===== COPY ACCOUNT NUMBER =====
const copyAcctBtn = document.getElementById('copyAcctBtn');
if (copyAcctBtn) {
  copyAcctBtn.addEventListener('click', async () => {
    const acct = '0131301273';
    try {
      await navigator.clipboard.writeText(acct);
      copyAcctBtn.innerHTML = '<i class="fas fa-check"></i> Copied (0131301273)!';
      setTimeout(() => {
        copyAcctBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Account Number';
      }, 2500);
    } catch (err) {
      // Fallback
      const input = document.createElement('input');
      input.value = acct;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copyAcctBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        copyAcctBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Account Number';
      }, 2500);
    }
  });
}

// ===== PRINT RECEIPT =====
const printReceiptBtn = document.getElementById('printReceiptBtn');
if (printReceiptBtn) {
  printReceiptBtn.addEventListener('click', () => {
    window.print();
  });
}

// ===== DOWNLOAD RECEIPT AS IMAGE =====
const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
if (downloadReceiptBtn) {
  downloadReceiptBtn.addEventListener('click', async () => {
    const receipt = document.getElementById('receipt');
    if (!receipt) return;

    const originalBtn = downloadReceiptBtn.innerHTML;
    downloadReceiptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Image...';
    downloadReceiptBtn.disabled = true;

    // Temporarily hide action buttons from capture
    const actions = receipt.querySelector('.receipt-actions');
    if (actions) actions.style.display = 'none';

    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library is not loaded');
      }

      const canvas = await html2canvas(receipt, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });

      const attendeeName = (document.getElementById('receiptName')?.textContent || 'attendee')
        .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const receiptNo = (document.getElementById('receiptNumber')?.textContent || 'AGIS26-RECEIPT');

      const link = document.createElement('a');
      link.download = `${receiptNo}-${attendeeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (err) {
      console.error('Receipt download failed:', err);
      alert('Could not download image directly. You can use the "Print Receipt" button or take a screenshot of your screen.');
    } finally {
      if (actions) actions.style.display = '';
      downloadReceiptBtn.innerHTML = originalBtn;
      downloadReceiptBtn.disabled = false;
    }
  });
}

// ===== PRELOADER =====
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 600);
  }
});

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
if (navbar) {
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
}

// ===== MOBILE MENU =====
const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');

if (menuBtn && navMenu) {
  const icon = menuBtn.querySelector('i');
  const closeMenu = () => {
    navMenu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (icon) {
      icon.classList.add('fa-bars');
      icon.classList.remove('fa-times');
    }
  };
  
  menuBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (icon) {
      icon.classList.toggle('fa-bars', !isOpen);
      icon.classList.toggle('fa-times', isOpen);
    }
  });

  navMenu.querySelectorAll('a').forEach(link => {
    if (link.classList.contains('nav-dropdown-toggle')) return;
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !menuBtn.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ===== NAV DROPDOWN =====
const navDropdown = document.querySelector('.nav-dropdown');
if (navDropdown) {
  const toggle = navDropdown.querySelector('.nav-dropdown-toggle');

  if (toggle) {
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const isOpen = navDropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });
  }

  navDropdown.querySelectorAll('.nav-dropdown-menu a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        navDropdown.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (navDropdown.classList.contains('open') && !navDropdown.contains(e.target)) {
      navDropdown.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== COUNTDOWN TIMER =====
// Target: November 27, 2026 at 11:00 AM (Nigeria / GMT+1)
const eventDate = new Date('2026-11-27T11:00:00+01:00').getTime();

function updateCountdown() {
  const now = Date.now();
  const diff = eventDate - now;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val).padStart(2, '0');
  };

  if (diff <= 0) {
    ['days', 'hours', 'minutes', 'seconds'].forEach(id => setText(id, 0));
    return;
  }

  setText('days',    Math.floor(diff / (1000 * 60 * 60 * 24)));
  setText('hours',   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  setText('minutes', Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  setText('seconds', Math.floor((diff % (1000 * 60)) / 1000));
}

if (document.getElementById('countdown')) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ===== SCROLL TO TOP =====
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  let topTicking = false;
  window.addEventListener('scroll', () => {
    if (!topTicking) {
      window.requestAnimationFrame(() => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
        topTicking = false;
      });
      topTicking = true;
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== SMOOTH SCROLL FOR IN-PAGE ANCHORS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (!targetId || targetId === '#' || targetId.length < 2) return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const navHeight = navbar ? navbar.offsetHeight : 70;
    const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

console.log('✝ AGIS 2026 loaded — FRESH OIL | Christ • Character • Competence • Capacity');
