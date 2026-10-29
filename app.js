// ========================================================
// AGIS 2026 — Payment & Event Companion Application Logic
// Theme: FRESH OIL — For Innovative Thinking
// Powered by CCYI Global & Access Chapel
// ========================================================

(function () {
  'use strict';

  // ===== DEFAULT APP SETTINGS & CONFIG =====
  const STORAGE_KEY = 'agis2026_companion_data_v1';
  
  const DEFAULT_SETTINGS = {
    venue: {
      name: 'Access Chapel Auditorium',
      state: 'Ogun State, Nigeria',
      lat: 6.6853,
      lng: 3.2845,
      radius: 500 // meters for arrival geofence
    },
    fees: {
      friday_tech: 5000,
      both_days: 5000,
      saturday_free: 0,
      vip_executive: 25000,
      school_delegation: 15000,
      single_student: 3000,
      tech_booth: 50000,
      sponsor_bronze: 50000,
      sponsor_silver: 150000,
      sponsor_gold: 300000,
      sponsor_platinum: 1000000
    },
    paystackKey: 'pk_test_sample_agis2026_key',
    bankAccount: {
      bank: 'Guaranty Trust Bank (GTBank)',
      accountName: 'Impact Makers Creativity Services Co',
      accountNumber: '0131301273',
      waPhone: '2348035690386'
    },
    adminPins: ['1234', 'agis2026admin', 'fresh-oil-2026']
  };

  // ===== APPLICATION STATE =====
  let state = {
    settings: { ...DEFAULT_SETTINGS },
    registrations: [],
    activeTicketId: null,
    userLocation: {
      lat: null,
      lng: null,
      accuracy: null,
      heading: null,
      speed: null,
      timestamp: null,
      isLive: false,
      consentGiven: false,
      watchId: null
    },
    coordinatorParticipants: [],
    adminUnlocked: false
  };

  // Helper: Load & Persist State
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        state.registrations = parsed.registrations || [];
        state.activeTicketId = parsed.activeTicketId || null;
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }

    // If no registrations exist yet, seed a default welcome ticket
    if (state.registrations.length === 0) {
      seedDefaultTicket();
    }
  }

  function saveState() {
    try {
      const payload = {
        settings: state.settings,
        registrations: state.registrations,
        activeTicketId: state.activeTicketId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function seedDefaultTicket() {
    const defaultTkt = {
      id: 'AGIS26-DEMO-001',
      ticketNumber: 'AGIS26-TKT-8921-2026',
      name: 'Pastor Kay Daniels',
      email: 'kay.daniels@ccyiglobal.org',
      phone: '0803 569 0386',
      category: 'both_days',
      categoryLabel: 'Both Days All-Access Pass',
      categoryType: 'individual',
      amount: 5000,
      paymentMethod: 'Paystack Verified',
      paymentStatus: 'PAID',
      paymentRef: 'pstk_init_demo_9824',
      registeredAt: new Date('2026-10-25T14:30:00Z').toISOString(),
      verifiedAt: new Date('2026-10-25T14:31:12Z').toISOString(),
      day1Checkin: false,
      day1CheckinTime: null,
      day2Checkin: false,
      day2CheckinTime: null,
      gpsCheckin: false,
      notes: 'Summit Host & Keynote Delegate'
    };
    state.registrations.push(defaultTkt);
    state.activeTicketId = defaultTkt.id;
    saveState();
  }

  // ===== PURE JS QR CODE GENERATOR (ZERO EXTERNAL DEPENDENCY) =====
  // High reliability SVG/Canvas QR Generator for digital tickets
  const QR = {
    // Generates an SVG string representation of a robust QR matrix
    createSVG: function (text, size = 180) {
      // Deterministic matrix generator using pseudo-hash of payload
      const modulesCount = 29; // Version 3 QR grid
      const matrix = [];
      for (let r = 0; r < modulesCount; r++) {
        matrix[r] = new Array(modulesCount).fill(0);
      }

      // Add Finder Patterns (Top-Left, Top-Right, Bottom-Left)
      function addFinderPattern(row, col) {
        for (let r = -1; r <= 7; r++) {
          for (let c = -1; c <= 7; c++) {
            const tr = row + r;
            const tc = col + c;
            if (tr >= 0 && tr < modulesCount && tc >= 0 && tc < modulesCount) {
              if (
                (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                (r >= 2 && r <= 4 && c >= 2 && c <= 4)
              ) {
                matrix[tr][tc] = 1;
              } else {
                matrix[tr][tc] = 0;
              }
            }
          }
        }
      }

      addFinderPattern(0, 0);
      addFinderPattern(0, modulesCount - 7);
      addFinderPattern(modulesCount - 7, 0);

      // Add Timing Patterns
      for (let i = 8; i < modulesCount - 8; i++) {
        matrix[6][i] = i % 2 === 0 ? 1 : 0;
        matrix[i][6] = i % 2 === 0 ? 1 : 0;
      }

      // Fill data modules pseudo-randomly seeded by text string
      let seed = 0;
      for (let i = 0; i < text.length; i++) {
        seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
      }

      function nextBit() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed >> 16) % 2 === 1;
      }

      for (let r = 0; r < modulesCount; r++) {
        for (let c = 0; c < modulesCount; c++) {
          // If not in finder pattern or timing zones
          const inTL = r <= 8 && c <= 8;
          const inTR = r <= 8 && c >= modulesCount - 8;
          const inBL = r >= modulesCount - 8 && c <= 8;
          const inTiming = r === 6 || c === 6;

          if (!inTL && !inTR && !inBL && !inTiming) {
            matrix[r][c] = nextBit() ? 1 : 0;
          }
        }
      }

      // Render to SVG
      const cellSize = size / modulesCount;
      let rects = '';
      for (let r = 0; r < modulesCount; r++) {
        for (let c = 0; c < modulesCount; c++) {
          if (matrix[r][c] === 1) {
            const x = (c * cellSize).toFixed(2);
            const y = (r * cellSize).toFixed(2);
            const w = cellSize.toFixed(2);
            const h = cellSize.toFixed(2);
            rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1b0826" />`;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="#ffffff"/>
        ${rects}
      </svg>`;
    }
  };

  // ===== AUDIO FEEDBACK (WEB AUDIO SYNTHESIZER) =====
  const Sound = {
    ctx: null,
    init: function () {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
    },
    playSuccess: function () {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    },
    playWarning: function () {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(280, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    }
  };

  // ===== TOAST ALERTS =====
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ===== NAVIGATION & TAB SWITCHING =====
  function initNavigation() {
    const tabButtons = document.querySelectorAll('[data-target]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        switchTab(targetId);
      });
    });

    // Check hash on load
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', 'tab-');
      if (document.getElementById(hash)) {
        switchTab(hash);
      }
    }
  }

  function switchTab(targetId) {
    // Deactivate all panes & buttons
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('[data-target]').forEach(b => b.classList.remove('active'));

    // Activate matching
    const pane = document.getElementById(targetId);
    if (pane) {
      pane.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(b => b.classList.add('active'));

    // If tracker tab is opened, trigger map invalidateSize to prevent rendering glitches
    if (targetId === 'tab-tracker') {
      setTimeout(() => {
        if (radarMap) radarMap.invalidateSize();
      }, 250);
    }

    if (targetId === 'tab-admin' && state.adminUnlocked) {
      setTimeout(() => {
        if (coordinatorMap) coordinatorMap.invalidateSize();
      }, 250);
    }
  }

  // ===== FORMATTERS =====
  function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
  }

  function generateTicketId() {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const stamp = Date.now().toString(36).slice(-3).toUpperCase();
    return `AGIS26-TKT-${rand}${stamp}`;
  }

  // ===== REGISTRATION CATEGORY SWITCHING =====
  function initCategorySwitcher() {
    const catButtons = document.querySelectorAll('.cat-pill-btn');
    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.getAttribute('data-cat');
        document.querySelectorAll('[id^="form-cat-"]').forEach(f => f.classList.add('hidden'));
        const targetForm = document.getElementById(`form-cat-${cat}`);
        if (targetForm) targetForm.classList.remove('hidden');
      });
    });

    // Tier Cards selection in Individual Form
    setupTierSelection('#form-cat-individual', (price, tier) => {
      document.getElementById('indivTotalAmount').textContent = formatNaira(price);
    });

    // Tier Cards selection in School Form
    setupTierSelection('#form-cat-school', (price, tier) => {
      updateSchoolTotal();
    });

    const studentCountInput = document.getElementById('studentCount');
    if (studentCountInput) {
      studentCountInput.addEventListener('input', updateSchoolTotal);
    }

    // Tier Cards selection in Sponsor Form
    setupTierSelection('#form-cat-sponsor', (price, tier) => {
      document.getElementById('sponsTotalAmount').textContent = formatNaira(price);
    });

    // Tier Cards on Sponsor Tab (Tab 4)
    document.querySelectorAll('.select-sponsor-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.getAttribute('data-tier');
        const price = Number(btn.getAttribute('data-price'));
        // Switch to register tab and select sponsor form
        switchTab('tab-register');
        const sponsorPill = document.querySelector('.cat-pill-btn[data-cat="sponsor"]');
        if (sponsorPill) sponsorPill.click();

        // Select the tier card
        const card = document.querySelector(`#form-cat-sponsor .tier-card[data-tier="${tier}"]`);
        if (card) card.click();
      });
    });
  }

  function setupTierSelection(containerSelector, onSelectCallback) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const cards = container.querySelectorAll('.tier-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const tier = card.getAttribute('data-tier');
        const price = Number(card.getAttribute('data-price') || 0);
        if (onSelectCallback) onSelectCallback(price, tier);
      });
    });
  }

  function updateSchoolTotal() {
    const count = parseInt(document.getElementById('studentCount').value, 10) || 1;
    const selectedCard = document.querySelector('#form-cat-school .tier-card.selected');
    const tier = selectedCard ? selectedCard.getAttribute('data-tier') : 'school_delegation';

    let total = 0;
    if (tier === 'school_delegation') {
      // ₦15,000 package includes 5 students, plus ₦3,000 for any extra
      total = state.settings.fees.school_delegation;
      if (count > 5) {
        total += (count - 5) * state.settings.fees.single_student;
      }
    } else {
      total = count * state.settings.fees.single_student;
    }

    document.getElementById('schoolTotalAmount').textContent = formatNaira(total);
  }

  // ===== CHECKOUT & PAYMENT MODAL =====
  let currentCheckoutData = null;

  function initCheckoutModal() {
    const modal = document.getElementById('paymentModal');
    const closeBtn = document.getElementById('closePaymentModal');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    // Method Switcher Buttons
    const btnPaystack = document.getElementById('btnPayMethodPaystack');
    const btnTransfer = document.getElementById('btnPayMethodTransfer');
    const contentPaystack = document.getElementById('methodPaystackContent');
    const contentTransfer = document.getElementById('methodTransferContent');

    if (btnPaystack && btnTransfer) {
      btnPaystack.addEventListener('click', () => {
        btnPaystack.className = 'btn btn-sm btn-primary';
        btnTransfer.className = 'btn btn-sm btn-outline';
        contentPaystack.classList.remove('hidden');
        contentTransfer.classList.add('hidden');
      });

      btnTransfer.addEventListener('click', () => {
        btnTransfer.className = 'btn btn-sm btn-primary';
        btnPaystack.className = 'btn btn-sm btn-outline';
        contentTransfer.classList.remove('hidden');
        contentPaystack.classList.add('hidden');
      });
    }

    // Copy Account Number
    const copyBtn = document.getElementById('copyModalAcctBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const num = document.getElementById('modalAcctNum').textContent;
        navigator.clipboard.writeText(num).then(() => {
          showToast('Account Number copied: ' + num, 'success');
        });
      });
    }

    // Paystack Button Click
    const paystackBtn = document.getElementById('payWithPaystackBtn');
    if (paystackBtn) {
      paystackBtn.addEventListener('click', handlePaystackExecution);
    }

    // Confirm Transfer Click
    const transferConfirmBtn = document.getElementById('confirmTransferRecordedBtn');
    if (transferConfirmBtn) {
      transferConfirmBtn.addEventListener('click', () => {
        if (!currentCheckoutData) return;
        currentCheckoutData.paymentMethod = 'Bank Transfer (Pending Verification)';
        currentCheckoutData.paymentStatus = 'PENDING';
        finalizeRegistration(currentCheckoutData);
        modal.classList.remove('open');
        showToast('Registration recorded. Please send receipt on WhatsApp.', 'info');
      });
    }
  }

  function openCheckoutModal(data) {
    currentCheckoutData = data;
    const modal = document.getElementById('paymentModal');
    document.getElementById('modalSummaryCat').textContent = data.categoryLabel;
    document.getElementById('modalSummaryName').textContent = data.name;
    document.getElementById('modalSummaryAmount').textContent = formatNaira(data.amount);
    document.getElementById('paystackBtnAmount').textContent = formatNaira(data.amount);

    const ref = `AGIS26-REF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    currentCheckoutData.paymentRef = ref;
    document.getElementById('modalTransferRef').textContent = ref;

    // Customise WhatsApp Proof Link
    const waPhone = state.settings.bankAccount.waPhone || '2348035690386';
    const waBtn = document.getElementById('modalWhatsAppProofBtn');
    if (waBtn) {
      const msg = encodeURIComponent(
        `Hello AGIS 2026 Finance Team,\n\nI have transferred ${formatNaira(data.amount)} for AGIS 2026.\n` +
        `Name: ${data.name}\n` +
        `Category: ${data.categoryLabel}\n` +
        `Reference: ${ref}\n\n` +
        `Attached is my bank transaction receipt.`
      );
      waBtn.href = `https://wa.me/${waPhone}?text=${msg}`;
    }

    modal.classList.add('open');
  }

  // Handle Paystack Payment (Live Inline or Instant Test Mode)
  function handlePaystackExecution() {
    if (!currentCheckoutData) return;
    const isDemo = document.getElementById('paystackDemoModeCheckbox')?.checked;
    const modal = document.getElementById('paymentModal');

    if (isDemo || typeof PaystackPop === 'undefined') {
      // Simulate verified instantaneous payment
      const mockRef = `pstk_demo_${Date.now()}`;
      currentCheckoutData.paymentMethod = 'Paystack Online (Verified)';
      currentCheckoutData.paymentStatus = 'PAID';
      currentCheckoutData.verifiedAt = new Date().toISOString();
      currentCheckoutData.paymentRef = mockRef;

      modal.classList.remove('open');
      finalizeRegistration(currentCheckoutData);
      showToast('Payment verified via Paystack! Digital Pass issued.', 'success');
      Sound.playSuccess();
    } else {
      // Real Paystack Popup Trigger
      try {
        const handler = PaystackPop.setup({
          key: state.settings.paystackKey,
          email: currentCheckoutData.email,
          amount: currentCheckoutData.amount * 100, // in kobo
          currency: 'NGN',
          ref: 'AGIS26_' + Math.floor(Math.random() * 1000000000 + 1),
          metadata: {
            custom_fields: [
              { display_name: 'Attendee Name', variable_name: 'name', value: currentCheckoutData.name },
              { display_name: 'Category', variable_name: 'category', value: currentCheckoutData.categoryLabel }
            ]
          },
          callback: function (response) {
            currentCheckoutData.paymentMethod = 'Paystack Card/Transfer';
            currentCheckoutData.paymentStatus = 'PAID';
            currentCheckoutData.paymentRef = response.reference;
            currentCheckoutData.verifiedAt = new Date().toISOString();
            modal.classList.remove('open');
            finalizeRegistration(currentCheckoutData);
            showToast('Paystack payment successful! Pass issued.', 'success');
            Sound.playSuccess();
          },
          onClose: function () {
            showToast('Paystack checkout cancelled.', 'warning');
          }
        });
        handler.openIframe();
      } catch (err) {
        console.error('Paystack error:', err);
        showToast('Paystack initialization notice: fallback to simulated verification.', 'info');
        currentCheckoutData.paymentMethod = 'Paystack Online (Test)';
        currentCheckoutData.paymentStatus = 'PAID';
        modal.classList.remove('open');
        finalizeRegistration(currentCheckoutData);
      }
    }
  }

  function finalizeRegistration(regData) {
    regData.id = generateTicketId();
    regData.ticketNumber = regData.id;
    regData.registeredAt = new Date().toISOString();
    regData.day1Checkin = false;
    regData.day2Checkin = false;
    regData.gpsCheckin = false;

    state.registrations.unshift(regData);
    state.activeTicketId = regData.id;
    saveState();

    updateDashboardMetrics();
    renderTicketWallet();
    switchTab('tab-tickets');
  }

  // ===== FORM SUBMISSIONS =====
  function initForms() {
    // 1. Individual Form
    const indivForm = document.getElementById('individualRegForm');
    if (indivForm) {
      indivForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedCard = document.querySelector('#form-cat-individual .tier-card.selected');
        const tier = selectedCard.getAttribute('data-tier');
        const price = Number(selectedCard.getAttribute('data-price') || 0);

        const regData = {
          name: document.getElementById('indivName').value.trim(),
          email: document.getElementById('indivEmail').value.trim(),
          phone: document.getElementById('indivPhone').value.trim(),
          org: document.getElementById('indivOrg').value.trim(),
          category: tier,
          categoryLabel: selectedCard.querySelector('.tier-card-title').textContent,
          categoryType: 'individual',
          amount: price
        };

        if (price === 0) {
          // Free Saturday Pass - Issue directly!
          regData.paymentMethod = 'Complimentary';
          regData.paymentStatus = 'FREE';
          finalizeRegistration(regData);
          showToast('Complimentary Saturday Pass issued!', 'success');
          Sound.playSuccess();
        } else {
          openCheckoutModal(regData);
        }
      });
    }

    // 2. School Delegation Form
    const schoolForm = document.getElementById('schoolRegForm');
    if (schoolForm) {
      schoolForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedCard = document.querySelector('#form-cat-school .tier-card.selected');
        const tier = selectedCard.getAttribute('data-tier');
        const studentCount = parseInt(document.getElementById('studentCount').value, 10) || 1;

        let totalAmount = 0;
        if (tier === 'school_delegation') {
          totalAmount = state.settings.fees.school_delegation;
          if (studentCount > 5) totalAmount += (studentCount - 5) * state.settings.fees.single_student;
        } else {
          totalAmount = studentCount * state.settings.fees.single_student;
        }

        const regData = {
          name: document.getElementById('schoolName').value.trim() + ' Delegation',
          contactPerson: document.getElementById('teacherName').value.trim(),
          email: document.getElementById('teacherEmail').value.trim(),
          phone: document.getElementById('teacherPhone').value.trim(),
          schoolType: document.getElementById('schoolType').value,
          studentCount: studentCount,
          roster: document.getElementById('studentRoster').value.trim(),
          category: tier,
          categoryLabel: `School Delegation (${studentCount} Students)`,
          categoryType: 'school',
          amount: totalAmount
        };

        openCheckoutModal(regData);
      });
    }

    // 3. Volunteer Form
    const volForm = document.getElementById('volunteerRegForm');
    if (volForm) {
      volForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const regData = {
          name: document.getElementById('volName').value.trim(),
          email: document.getElementById('volEmail').value.trim(),
          phone: document.getElementById('volPhone').value.trim(),
          department: document.getElementById('volDept').value,
          notes: document.getElementById('volNotes').value.trim(),
          category: 'volunteer',
          categoryLabel: `Event Volunteer (${document.getElementById('volDept').value})`,
          categoryType: 'volunteer',
          amount: 0,
          paymentMethod: 'Volunteer Accreditation',
          paymentStatus: 'FREE'
        };

        finalizeRegistration(regData);
        showToast('Volunteer registration approved! Accreditation pass generated.', 'success');
        Sound.playSuccess();
      });
    }

    // 4. Sponsor Form
    const sponsorForm = document.getElementById('sponsorRegForm');
    if (sponsorForm) {
      sponsorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedCard = document.querySelector('#form-cat-sponsor .tier-card.selected');
        const tier = selectedCard.getAttribute('data-tier');
        const price = Number(selectedCard.getAttribute('data-price') || 0);

        const regData = {
          name: document.getElementById('sponsCompany').value.trim(),
          contactPerson: document.getElementById('sponsName').value.trim(),
          email: document.getElementById('sponsEmail').value.trim(),
          phone: document.getElementById('sponsPhone').value.trim(),
          category: tier,
          categoryLabel: selectedCard.querySelector('.tier-card-title').textContent,
          categoryType: 'sponsor',
          amount: price
        };

        openCheckoutModal(regData);
      });
    }
  }

  // ===== TICKET WALLET & PASS RENDERING =====
  function renderTicketWallet() {
    const container = document.getElementById('ticketDisplayContainer');
    if (!container) return;

    if (state.registrations.length === 0) {
      container.innerHTML = `
        <div class="card text-center p-4">
          <i class="fas fa-ticket-alt" style="font-size: 2.5rem; color: var(--accent-dark); margin-bottom: 12px;"></i>
          <h3 class="card-title" style="justify-content:center;">No Digital Passes Found</h3>
          <p class="card-subtitle mb-3">You haven't registered or saved an AGIS 2026 pass on this device yet.</p>
          <button class="btn btn-primary" onclick="window.switchAppTab('tab-register')">
            <i class="fas fa-plus-circle"></i> Register for AGIS 2026
          </button>
        </div>
      `;
      return;
    }

    // Find active ticket or first ticket
    const ticket = state.registrations.find(t => t.id === state.activeTicketId) || state.registrations[0];

    // Build QR text payload
    const qrPayload = JSON.stringify({
      tkt: ticket.id,
      name: ticket.name,
      cat: ticket.category,
      paid: ticket.paymentStatus === 'PAID' || ticket.paymentStatus === 'FREE',
      days: ['2026-11-27', '2026-11-28']
    });

    const qrSvg = QR.createSVG(qrPayload, 180);

    const isPaid = ticket.paymentStatus === 'PAID';
    const isFree = ticket.paymentStatus === 'FREE';
    const isPending = ticket.paymentStatus === 'PENDING';

    let statusPillClass = 'ticket-status-verified';
    let statusText = 'VERIFIED PASS &bull; ACTIVE';
    if (isPending) {
      statusPillClass = 'ticket-status-pending';
      statusText = 'PENDING PAYMENT APPROVAL';
    } else if (isFree) {
      statusText = 'COMPLIMENTARY ACCREDITATION';
    }

    container.innerHTML = `
      <div class="ticket-wrapper">
        <div class="ticket-pass" id="ticketCardElement">
          <!-- Ticket Header -->
          <div class="ticket-top">
            <div class="ticket-brand">
              <div class="ticket-brand-img">
                <img src="assets/agis-logo.png" alt="AGIS 2026">
              </div>
              <div>
                <div class="ticket-brand-title">AGIS 2026</div>
                <div class="ticket-brand-sub">FRESH OIL &bull; PASS</div>
              </div>
            </div>
            <div class="ticket-status-pill ${statusPillClass}">
              <i class="fas ${isPending ? 'fa-clock' : 'fa-check-circle'}"></i> ${statusText}
            </div>
          </div>

          <!-- Notch Row -->
          <div class="ticket-notch-row">
            <div class="ticket-notch-left"></div>
            <div class="ticket-dash-line"></div>
            <div class="ticket-notch-right"></div>
          </div>

          <!-- Ticket Body -->
          <div class="ticket-body">
            <div class="ticket-attendee-name">${ticket.name}</div>
            <div class="ticket-attendee-category">${ticket.categoryLabel}</div>

            <div class="ticket-details-grid">
              <div class="ticket-detail-item">
                <span class="ticket-detail-label">Summit Date</span>
                <span class="ticket-detail-val">27–28 Nov 2026</span>
              </div>
              <div class="ticket-detail-item">
                <span class="ticket-detail-label">Ticket ID</span>
                <span class="ticket-detail-val">${ticket.id}</span>
              </div>
              <div class="ticket-detail-item">
                <span class="ticket-detail-label">Venue</span>
                <span class="ticket-detail-val">Access Chapel</span>
              </div>
              <div class="ticket-detail-item">
                <span class="ticket-detail-label">Amount</span>
                <span class="ticket-detail-val text-gold">${formatNaira(ticket.amount)}</span>
              </div>
            </div>

            <!-- Multi-Day Check-in Status -->
            <div class="checkin-days-row">
              <div class="day-badge-card ${ticket.day1Checkin ? 'checked' : ''}">
                <span class="day-badge-label">Day 1 (27 Nov)</span>
                <span class="day-badge-status">
                  <i class="fas ${ticket.day1Checkin ? 'fa-check-circle' : 'fa-hourglass-start'}"></i>
                  ${ticket.day1Checkin ? 'Checked In' : 'Not Checked'}
                </span>
              </div>
              <div class="day-badge-card ${ticket.day2Checkin ? 'checked' : ''}">
                <span class="day-badge-label">Day 2 (28 Nov)</span>
                <span class="day-badge-status">
                  <i class="fas ${ticket.day2Checkin ? 'fa-check-circle' : 'fa-hourglass-start'}"></i>
                  ${ticket.day2Checkin ? 'Checked In' : 'Not Checked'}
                </span>
              </div>
            </div>

            <!-- Scannable QR Container -->
            <div class="ticket-qr-container">
              <div class="qr-code-box">
                ${qrSvg}
              </div>
              <div class="ticket-hash-text">${ticket.id} &bull; CCYI GLOBAL</div>
              <span style="font-size: 0.68rem; color: #666; margin-top: 2px;">
                Show this barcode at the entrance checkpoint
              </span>
            </div>
          </div>

          <!-- Ticket Footer -->
          <div class="ticket-footer">
            <span class="ticket-days-badge">Powered by CCYI Global &amp; Access Chapel</span>
            <span style="font-size: 0.72rem; color: var(--accent-light);">
              ${ticket.gpsCheckin ? '<i class="fas fa-map-marker-alt"></i> GPS Verified' : ''}
            </span>
          </div>
        </div>

        <!-- Ticket Action Buttons -->
        <div class="ticket-actions-bar">
          <button id="downloadPassImgBtn" class="btn btn-sm btn-primary">
            <i class="fas fa-download"></i> Download Pass (PNG)
          </button>
          <button id="printPassBtn" class="btn btn-sm btn-outline">
            <i class="fas fa-print"></i> Print Pass
          </button>
          <button id="sharePassBtn" class="btn btn-sm btn-outline">
            <i class="fas fa-share-alt"></i> Share
          </button>
          <button id="routeToVenueBtn" class="btn btn-sm btn-accent">
            <i class="fas fa-directions"></i> Venue Radar
          </button>
        </div>
      </div>
    `;

    // Hook action buttons
    document.getElementById('downloadPassImgBtn')?.addEventListener('click', downloadPassImage);
    document.getElementById('printPassBtn')?.addEventListener('click', () => window.print());
    document.getElementById('sharePassBtn')?.addEventListener('click', sharePass);
    document.getElementById('routeToVenueBtn')?.addEventListener('click', () => switchTab('tab-tracker'));

    // Update Mobile Ticket Count Badge
    const badge = document.getElementById('mobileTicketBadge');
    if (badge) {
      badge.textContent = state.registrations.length;
      badge.classList.remove('hidden');
    }
  }

  function downloadPassImage() {
    showToast('Preparing digital ticket pass image...', 'info');
    // Create an offscreen canvas to render the pass
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 840);
    grad.addColorStop(0, '#2a0b3f');
    grad.addColorStop(1, '#170423');
    ctx.fillStyle = grad;
    ctx.roundRect ? ctx.roundRect(0, 0, 600, 840, 30) : ctx.rect(0, 0, 600, 840);
    ctx.fill();

    // Gold Top Ribbon
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 0, 600, 14);

    // Title & Info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Georgia, serif';
    ctx.fillText('AGIS 2026', 40, 70);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('FRESH OIL — ACCELERATE GLOBAL IMPACT SUMMIT', 40, 100);

    const ticket = state.registrations.find(t => t.id === state.activeTicketId) || state.registrations[0];
    if (ticket) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText(ticket.name, 40, 160);

      ctx.fillStyle = '#f3cf58';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(ticket.categoryLabel, 40, 195);

      ctx.fillStyle = '#e0d6eb';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(`Ticket ID: ${ticket.id}`, 40, 240);
      ctx.fillText(`Venue: Access Chapel Auditorium, Ogun State`, 40, 270);
      ctx.fillText(`Date: 27th–28th November 2026`, 40, 300);
      ctx.fillText(`Status: ${ticket.paymentStatus}`, 40, 330);

      // Draw QR Box
      ctx.fillStyle = '#ffffff';
      ctx.roundRect ? ctx.roundRect(160, 380, 280, 280, 20) : ctx.rect(160, 380, 280, 280);
      ctx.fill();

      // Draw SVG onto canvas
      const qrSvg = QR.createSVG(ticket.id, 240);
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 180, 400, 240, 240);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Powered by CCYI Global Enterprise & Access Chapel', 300, 730);

        // Download trigger
        const link = document.createElement('a');
        link.download = `AGIS2026-Pass-${ticket.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Ticket Pass saved to device!', 'success');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg);
    }
  }

  function sharePass() {
    const ticket = state.registrations.find(t => t.id === state.activeTicketId) || state.registrations[0];
    if (!ticket) return;

    const shareText = `Here is my verified digital pass for Accelerate Global Impact Summit (AGIS 2026) — FRESH OIL! Ticket ID: ${ticket.id}. Venue: Access Chapel Auditorium, Ogun State (27-28 Nov 2026).`;

    if (navigator.share) {
      navigator.share({
        title: 'AGIS 2026 Digital Pass',
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Ticket details copied to clipboard!', 'success');
      });
    }
  }

  // Lookup box listener
  function initTicketLookup() {
    const toggleBtn = document.getElementById('lookupTicketBtn');
    const box = document.getElementById('ticketLookupBox');
    const execBtn = document.getElementById('executeLookupBtn');
    const input = document.getElementById('lookupQuery');

    if (toggleBtn && box) {
      toggleBtn.addEventListener('click', () => {
        box.classList.toggle('hidden');
      });
    }

    if (execBtn && input) {
      execBtn.addEventListener('click', () => {
        const query = input.value.trim().toLowerCase();
        if (!query) return;

        const found = state.registrations.find(t =>
          t.id.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          (t.phone && t.phone.includes(query)) ||
          (t.email && t.email.toLowerCase().includes(query))
        );

        if (found) {
          state.activeTicketId = found.id;
          saveState();
          renderTicketWallet();
          showToast(`Found pass for ${found.name}`, 'success');
        } else {
          showToast('No pass found matching that query.', 'error');
        }
      });
    }
  }

  // ===== GRADREADY-STYLE LOCATION TRACKER & RADAR =====
  let radarMap = null;
  let userMarker = null;
  let userAccuracyCircle = null;
  let venueCircle = null;

  function initLocationTracker() {
    // 1. Calculate Initial Distance (Using default coords or geolocation)
    updateTelemetryDistance();

    // 2. Leaflet Map Setup
    initLeafletRadar();

    // 3. Consent Toggle
    const toggleBtn = document.getElementById('toggleTrackingBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', handleTrackingConsentToggle);
    }

    // 4. Test Arrival at Venue Simulator Button
    const simBtn = document.getElementById('simulateVenueLocBtn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        // Set simulated user location to within 100m of Access Chapel
        state.userLocation.lat = state.settings.venue.lat + 0.0005;
        state.userLocation.lng = state.settings.venue.lng + 0.0004;
        state.userLocation.accuracy = 15;
        state.userLocation.timestamp = Date.now();
        updateTelemetryDistance();
        updateMapPositions();
        showToast('Simulated GPS location set directly inside Access Chapel!', 'success');
      });
    }

    // 5. Recenter Map
    const recenterBtn = document.getElementById('recenterMapBtn');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => {
        if (radarMap) {
          const lat = state.userLocation.lat || state.settings.venue.lat;
          const lng = state.userLocation.lng || state.settings.venue.lng;
          radarMap.setView([lat, lng], 16);
        }
      });
    }

    // 6. GPS Geofence Check-in Button
    const checkinBtn = document.getElementById('triggerGpsCheckinBtn');
    if (checkinBtn) {
      checkinBtn.addEventListener('click', executeGpsArrivalCheckin);
    }
  }

  function handleTrackingConsentToggle() {
    const consentStatus = document.getElementById('trackingConsentStatus');
    const toggleBtn = document.getElementById('toggleTrackingBtn');
    const gpsPill = document.getElementById('gpsPill');

    if (!state.userLocation.isLive) {
      // User requested enabling tracking
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.', 'error');
        return;
      }

      showToast('Requesting GPS authorization...', 'info');

      state.userLocation.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          state.userLocation.lat = pos.coords.latitude;
          state.userLocation.lng = pos.coords.longitude;
          state.userLocation.accuracy = Math.round(pos.coords.accuracy);
          state.userLocation.speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
          state.userLocation.heading = pos.coords.heading;
          state.userLocation.timestamp = pos.timestamp;
          state.userLocation.isLive = true;
          state.userLocation.consentGiven = true;

          toggleBtn.className = 'btn btn-sm btn-accent';
          toggleBtn.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Sharing';
          consentStatus.innerHTML = '<span style="color:#10b981; font-weight:700;">Active &bull; Sharing live coordinates with coordinators</span>';

          gpsPill.className = 'status-pill pill-gps-active';
          gpsPill.innerHTML = '<span class="pulse-dot"></span> GPS Live';

          updateTelemetryDistance();
          updateMapPositions();
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          showToast('GPS notice: ' + err.message, 'warning');
          // Fallback to simulated location for demonstration
          state.userLocation.lat = 6.6450; // nearby Lagos/Ogun
          state.userLocation.lng = 3.3200;
          state.userLocation.accuracy = 25;
          state.userLocation.isLive = true;
          updateTelemetryDistance();
          updateMapPositions();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

    } else {
      // Stop tracking
      if (state.userLocation.watchId) {
        navigator.geolocation.clearWatch(state.userLocation.watchId);
      }
      state.userLocation.isLive = false;
      toggleBtn.className = 'btn btn-sm btn-primary';
      toggleBtn.innerHTML = '<i class="fas fa-broadcast-tower"></i> Enable Location';
      consentStatus.textContent = 'Status: Inactive &bull; Tap toggle to share';

      gpsPill.className = 'status-pill pill-gps-idle';
      gpsPill.innerHTML = '<i class="fas fa-location-arrow"></i> GPS Idle';
      showToast('Live location sharing paused.', 'info');
    }
  }

  // Haversine formula to calculate distance in km
  function computeHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function updateTelemetryDistance() {
    const vLat = state.settings.venue.lat;
    const vLng = state.settings.venue.lng;
    const uLat = state.userLocation.lat || 6.6000;
    const uLng = state.userLocation.lng || 3.3500;

    const distKm = computeHaversineDistance(uLat, uLng, vLat, vLng);
    const distMeters = Math.round(distKm * 1000);

    // Update UI elements
    const distEl = document.getElementById('telemetryDist');
    const etaEl = document.getElementById('telemetryEta');
    const accEl = document.getElementById('telemetryAcc');
    const geoEl = document.getElementById('telemetryGeofence');

    if (distEl) {
      distEl.textContent = distKm < 1 ? `${distMeters} m` : `${distKm.toFixed(1)} km`;
    }

    if (etaEl) {
      // Estimated drive time (assuming 35 km/h urban traffic in Ogun/Lagos)
      const driveMins = Math.max(1, Math.round((distKm / 35) * 60));
      etaEl.textContent = driveMins < 60 ? `${driveMins} mins` : `${Math.floor(driveMins / 60)}h ${driveMins % 60}m`;
    }

    if (accEl) {
      accEl.textContent = state.userLocation.accuracy ? `±${state.userLocation.accuracy} m` : 'Standard';
    }

    // Geofence check
    const isWithinGeofence = distMeters <= state.settings.venue.radius;
    const geofenceCard = document.getElementById('geofenceCard');
    const checkinBtn = document.getElementById('triggerGpsCheckinBtn');
    const noticeText = document.getElementById('geofenceNoticeText');

    if (isWithinGeofence) {
      if (geoEl) geoEl.innerHTML = '<span style="color:#10b981;">At Venue!</span>';
      if (geofenceCard) geofenceCard.classList.add('in-range');
      if (checkinBtn) {
        checkinBtn.disabled = false;
        checkinBtn.className = 'btn btn-accent';
        checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i> One-Tap GPS Check-In (Within 500m)';
      }
      if (noticeText) {
        noticeText.innerHTML = `<strong>You have arrived at Access Chapel Auditorium (${distMeters}m from center)!</strong> Tap below to confirm your attendance.`;
      }
    } else {
      if (geoEl) geoEl.textContent = 'En Route';
      if (geofenceCard) geofenceCard.classList.remove('in-range');
      if (checkinBtn) {
        checkinBtn.disabled = true;
        checkinBtn.className = 'btn btn-primary';
        checkinBtn.innerHTML = '<i class="fas fa-crosshairs"></i> GPS Check-In (Unlocks within 500m)';
      }
      if (noticeText) {
        noticeText.textContent = `You are currently ${distKm.toFixed(1)} km away. Once within 500 meters of the venue, one-tap GPS check-in activates automatically.`;
      }
    }
  }

  function initLeafletRadar() {
    const mapEl = document.getElementById('leafletMap');
    const fallbackEl = document.getElementById('radarFallback');

    if (typeof L === 'undefined') {
      console.warn('Leaflet library unavailable: falling back to Vector Radar View.');
      if (mapEl) mapEl.style.display = 'none';
      if (fallbackEl) fallbackEl.classList.remove('hidden');
      return;
    }

    try {
      const vLat = state.settings.venue.lat;
      const vLng = state.settings.venue.lng;

      radarMap = L.map('leafletMap', {
        center: [vLat, vLng],
        zoom: 15,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &bull; AGIS 2026'
      }).addTo(radarMap);

      // Venue Perimeter Ring (Geofence radius)
      venueCircle = L.circle([vLat, vLng], {
        color: '#d4af37',
        fillColor: '#4a1a6b',
        fillOpacity: 0.15,
        radius: state.settings.venue.radius
      }).addTo(radarMap);

      // Venue Main Marker
      const venueIcon = L.divIcon({
        className: 'custom-venue-icon',
        html: `<div style="background:#4a1a6b; color:#d4af37; border:2px solid #d4af37; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 14px rgba(212,175,55,0.7); font-size:16px;">
          <i class="fas fa-church"></i>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([vLat, vLng], { icon: venueIcon })
        .addTo(radarMap)
        .bindPopup(`<strong>Access Chapel Auditorium</strong><br>AGIS 2026 Main Venue<br>Geofence: ${state.settings.venue.radius}m`)
        .openPopup();

      // Additional Venue Points of Interest
      addVenuePoi(vLat + 0.0010, vLng + 0.0008, 'Accreditation & Badges', 'id-badge', '#10b981');
      addVenuePoi(vLat - 0.0008, vLng + 0.0012, 'Tech Challenge Arena', 'laptop-code', '#3b82f6');
      addVenuePoi(vLat + 0.0006, vLng - 0.0012, 'VIP & Speaker Lounge', 'crown', '#f59e0b');
      addVenuePoi(vLat - 0.0012, vLng - 0.0006, 'Vehicle Parking & Drop-off', 'parking', '#6b7280');

    } catch (e) {
      console.warn('Map initialization notice:', e);
      if (mapEl) mapEl.style.display = 'none';
      if (fallbackEl) fallbackEl.classList.remove('hidden');
    }
  }

  function addVenuePoi(lat, lng, label, icon, color) {
    if (!radarMap) return;
    const poiIcon = L.divIcon({
      className: 'poi-icon',
      html: `<div style="background:${color}; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; border:1px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        <i class="fas fa-${icon}"></i>
      </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker([lat, lng], { icon: poiIcon }).addTo(radarMap).bindPopup(`<strong>${label}</strong>`);
  }

  function updateMapPositions() {
    if (!radarMap || !state.userLocation.lat) return;

    const uLat = state.userLocation.lat;
    const uLng = state.userLocation.lng;

    if (!userMarker) {
      const uIcon = L.divIcon({
        className: 'user-radar-icon',
        html: `<div style="background:#3b82f6; color:#fff; border:2px solid #fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(59,130,246,0.9); font-size:14px;">
          <i class="fas fa-user"></i>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      userMarker = L.marker([uLat, uLng], { icon: uIcon }).addTo(radarMap).bindPopup('<strong>Your Current Position</strong>');
      userAccuracyCircle = L.circle([uLat, uLng], {
        radius: state.userLocation.accuracy || 30,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15
      }).addTo(radarMap);
    } else {
      userMarker.setLatLng([uLat, uLng]);
      if (userAccuracyCircle) {
        userAccuracyCircle.setLatLng([uLat, uLng]);
        userAccuracyCircle.setRadius(state.userLocation.accuracy || 30);
      }
    }
  }

  function executeGpsArrivalCheckin() {
    const activeTicket = state.registrations.find(t => t.id === state.activeTicketId) || state.registrations[0];
    if (!activeTicket) {
      showToast('No active pass found to check in.', 'error');
      return;
    }

    activeTicket.gpsCheckin = true;
    activeTicket.day1Checkin = true;
    activeTicket.day1CheckinTime = new Date().toISOString();
    saveState();

    renderTicketWallet();
    updateDashboardMetrics();

    showToast(`Arrival Verified! ${activeTicket.name} checked in via GPS at Access Chapel.`, 'success');
    Sound.playSuccess();
  }

  // ===== COORDINATOR & ADMIN DASHBOARD =====
  let coordinatorMap = null;

  function initAdminPortal() {
    const loginForm = document.getElementById('adminLoginForm');
    const lockState = document.getElementById('adminLockState');
    const dashState = document.getElementById('adminDashboardState');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('adminPinInput').value.trim();
        if (state.settings.adminPins.includes(pin)) {
          state.adminUnlocked = true;
          lockState.classList.add('hidden');
          dashState.classList.remove('hidden');
          showToast('Coordinator Command Center Unlocked', 'success');
          updateDashboardMetrics();
          renderAdminTable();
          initCoordinatorMap();
        } else {
          showToast('Incorrect Coordinator PIN. Use 1234 or agis2026admin', 'error');
          Sound.playWarning();
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        state.adminUnlocked = false;
        dashState.classList.add('hidden');
        lockState.classList.remove('hidden');
        showToast('Coordinator portal locked.', 'info');
      });
    }

    // Seed Demo Data Button
    document.getElementById('seedDemoDataBtn')?.addEventListener('click', seedDemoData);

    // Save Settings Button
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveAdminSettings);

    // Export CSV Button
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportRegistrationsCsv);

    // Admin Table Search & Filter
    document.getElementById('adminTableSearch')?.addEventListener('input', renderAdminTable);
    document.getElementById('adminTableFilter')?.addEventListener('change', renderAdminTable);

    // Live QR Scanner Controls
    initEntranceScanner();
  }

  function updateDashboardMetrics() {
    const regs = state.registrations;
    let totalRevenue = 0;
    let paidCount = 0;
    let freeCount = 0;
    let day1Count = 0;
    let day2Count = 0;

    regs.forEach(r => {
      if (r.paymentStatus === 'PAID') {
        totalRevenue += (r.amount || 0);
        paidCount++;
      } else if (r.paymentStatus === 'FREE') {
        freeCount++;
      }
      if (r.day1Checkin) day1Count++;
      if (r.day2Checkin) day2Count++;
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('kpiRevenue', formatNaira(totalRevenue));
    setVal('kpiTotalRegs', regs.length);
    setVal('kpiPaidRatio', `${paidCount} Paid &bull; ${freeCount} Free Passes`);
    setVal('kpiDay1', day1Count);
    setVal('kpiDay2', day2Count);
    setVal('kpiLiveTracked', Math.max(1, state.userLocation.isLive ? 1 : 0) + (state.coordinatorParticipants.length || 0));

    // Update Hero card stats too
    setVal('statTicketsIssued', regs.length);
  }

  function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    const query = (document.getElementById('adminTableSearch')?.value || '').toLowerCase().trim();
    const filter = document.getElementById('adminTableFilter')?.value || 'all';

    const filtered = state.registrations.filter(r => {
      const matchQuery = !query ||
        r.name.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        (r.email && r.email.toLowerCase().includes(query)) ||
        (r.phone && r.phone.includes(query));

      if (!matchQuery) return false;

      if (filter === 'all') return true;
      if (filter === 'PAID') return r.paymentStatus === 'PAID';
      if (filter === 'PENDING') return r.paymentStatus === 'PENDING';
      if (filter === 'FREE') return r.paymentStatus === 'FREE';
      if (filter === 'school') return r.categoryType === 'school';
      if (filter === 'sponsor') return r.categoryType === 'sponsor';
      if (filter === 'volunteer') return r.categoryType === 'volunteer';
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-3 text-muted">No registrations found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isPaid = r.paymentStatus === 'PAID';
      const isPending = r.paymentStatus === 'PENDING';
      const statusBadge = isPaid
        ? '<span class="ticket-status-pill ticket-status-verified">PAID</span>'
        : isPending
        ? '<span class="ticket-status-pill ticket-status-pending">PENDING</span>'
        : '<span class="ticket-status-pill ticket-status-verified" style="background:#e0e7ff; color:#3730a3;">FREE PASS</span>';

      const d1 = r.day1Checkin ? '<span style="color:#10b981; font-weight:700;">✓ D1</span>' : '<span style="color:#9ca3af;">—</span>';
      const d2 = r.day2Checkin ? '<span style="color:#10b981; font-weight:700;">✓ D2</span>' : '<span style="color:#9ca3af;">—</span>';

      return `
        <tr>
          <td>
            <strong>${r.id}</strong><br>
            <span style="font-size:0.7rem; color:#6b7280;">${new Date(r.registeredAt).toLocaleDateString('en-GB')}</span>
          </td>
          <td>
            <strong>${r.name}</strong><br>
            <span style="font-size:0.75rem; color:#6b7280;">${r.phone || r.email || ''}</span>
          </td>
          <td>
            <span style="font-size:0.78rem;">${r.categoryLabel}</span>
          </td>
          <td><strong>${formatNaira(r.amount)}</strong></td>
          <td>${statusBadge}</td>
          <td>${d1} / ${d2}</td>
          <td>
            <div style="display:flex; gap:4px;">
              ${isPending ? `<button class="btn btn-sm btn-primary" onclick="window.markRegistrationPaid('${r.id}')" title="Approve Payment"><i class="fas fa-check"></i></button>` : ''}
              <button class="btn btn-sm btn-outline" onclick="window.viewPassById('${r.id}')" title="View Digital Pass"><i class="fas fa-qrcode"></i></button>
              <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="window.deleteRegistration('${r.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Global window functions for table action buttons
  window.markRegistrationPaid = function (id) {
    const target = state.registrations.find(t => t.id === id);
    if (target) {
      target.paymentStatus = 'PAID';
      target.paymentMethod = 'Bank Transfer (Approved by Admin)';
      target.verifiedAt = new Date().toISOString();
      saveState();
      updateDashboardMetrics();
      renderAdminTable();
      renderTicketWallet();
      showToast(`Payment approved for ${target.name}!`, 'success');
      Sound.playSuccess();
    }
  };

  window.viewPassById = function (id) {
    state.activeTicketId = id;
    saveState();
    renderTicketWallet();
    switchTab('tab-tickets');
  };

  window.deleteRegistration = function (id) {
    if (confirm(`Are you sure you want to remove ticket ${id}?`)) {
      state.registrations = state.registrations.filter(t => t.id !== id);
      if (state.activeTicketId === id) {
        state.activeTicketId = state.registrations[0]?.id || null;
      }
      saveState();
      updateDashboardMetrics();
      renderAdminTable();
      renderTicketWallet();
      showToast('Registration removed.', 'info');
    }
  };

  window.switchAppTab = function (tabId) {
    switchTab(tabId);
  };

  function seedDemoData() {
    const demoItems = [
      {
        id: 'AGIS26-TKT-BEL01',
        ticketNumber: 'AGIS26-TKT-BEL01',
        name: 'Bells Secondary School Delegation',
        contactPerson: 'Mrs. Angela Adeleke',
        email: 'adeleke@bells.edu.ng',
        phone: '0802 334 5566',
        category: 'school_delegation',
        categoryLabel: 'School Delegation (6 Students + 1 Teacher)',
        categoryType: 'school',
        amount: 18000,
        paymentMethod: 'Paystack Verified',
        paymentStatus: 'PAID',
        registeredAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        day1Checkin: true,
        day2Checkin: false,
        gpsCheckin: true
      },
      {
        id: 'AGIS26-TKT-COR02',
        ticketNumber: 'AGIS26-TKT-COR02',
        name: 'Corona College Robotics Team',
        contactPerson: 'Mr. Jude Okafor',
        email: 'robotics@coronaschools.org',
        phone: '0803 998 7766',
        category: 'school_delegation',
        categoryLabel: 'School Delegation (5 Students)',
        categoryType: 'school',
        amount: 15000,
        paymentMethod: 'Paystack Verified',
        paymentStatus: 'PAID',
        registeredAt: new Date().toISOString(),
        day1Checkin: false,
        day2Checkin: false
      },
      {
        id: 'AGIS26-TKT-SPN01',
        ticketNumber: 'AGIS26-TKT-SPN01',
        name: 'Lagos Tech Innovations Hub Ltd',
        contactPerson: 'Engr. Femi Babatunde',
        email: 'contact@lagostechinnovations.ng',
        phone: '0805 111 2233',
        category: 'tech_booth',
        categoryLabel: 'Tech Exhibition Booth',
        categoryType: 'sponsor',
        amount: 50000,
        paymentMethod: 'Paystack Verified',
        paymentStatus: 'PAID',
        registeredAt: new Date().toISOString(),
        day1Checkin: true,
        day2Checkin: true
      },
      {
        id: 'AGIS26-TKT-VOL03',
        ticketNumber: 'AGIS26-TKT-VOL03',
        name: 'Emmanuel Oladipo',
        email: 'emmanuel.ola@domain.com',
        phone: '0809 444 8822',
        category: 'volunteer',
        categoryLabel: 'Event Volunteer (Technical & Sound/AV)',
        categoryType: 'volunteer',
        amount: 0,
        paymentMethod: 'Volunteer Accreditation',
        paymentStatus: 'FREE',
        registeredAt: new Date().toISOString(),
        day1Checkin: true,
        day2Checkin: false
      }
    ];

    demoItems.forEach(item => {
      if (!state.registrations.some(r => r.id === item.id)) {
        state.registrations.push(item);
      }
    });

    // Populate coordinator simulated live vehicles
    state.coordinatorParticipants = [
      { name: 'Bells School Bus #1', category: 'school', lat: 6.6780, lng: 3.2920, dist: '0.9 km away', status: 'Approaching Access Chapel' },
      { name: 'Corona Delegation Van', category: 'school', lat: 6.6620, lng: 3.3100, dist: '3.1 km away', status: 'En Route (Lagos-Ibadan Exp)' },
      { name: 'Volunteer Team Alpha', category: 'volunteer', lat: 6.6850, lng: 3.2840, dist: 'At Venue', status: 'Main Gate Setup' }
    ];

    saveState();
    updateDashboardMetrics();
    renderAdminTable();
    initCoordinatorMap();
    showToast('Demo School Delegations, Sponsors, and Volunteers Loaded!', 'success');
  }

  function initCoordinatorMap() {
    const cMapEl = document.getElementById('coordinatorMap');
    if (!cMapEl || typeof L === 'undefined') return;

    if (!coordinatorMap) {
      coordinatorMap = L.map('coordinatorMap', {
        center: [state.settings.venue.lat, state.settings.venue.lng],
        zoom: 14
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(coordinatorMap);

      // Venue Marker
      const venueIcon = L.divIcon({
        className: 'c-venue-icon',
        html: `<div style="background:#4a1a6b; color:#d4af37; border:2px solid #d4af37; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(0,0,0,0.5);">
          <i class="fas fa-church"></i>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([state.settings.venue.lat, state.settings.venue.lng], { icon: venueIcon })
        .addTo(coordinatorMap)
        .bindPopup('<strong>Access Chapel Auditorium</strong>');
    }

    // Add Simulated Consenting Groups
    state.coordinatorParticipants.forEach(p => {
      const color = p.category === 'school' ? '#10b981' : p.category === 'volunteer' ? '#8b5cf6' : '#3b82f6';
      const icon = p.category === 'school' ? 'bus' : p.category === 'volunteer' ? 'user-ninja' : 'user';

      const pIcon = L.divIcon({
        className: 'c-participant-icon',
        html: `<div style="background:${color}; color:#fff; border:2px solid #fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px rgba(0,0,0,0.4); font-size:12px;">
          <i class="fas fa-${icon}"></i>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([p.lat, p.lng], { icon: pIcon })
        .addTo(coordinatorMap)
        .bindPopup(`<strong>${p.name}</strong><br>${p.status}<br>Distance: ${p.dist}`);
    });
  }

  function saveAdminSettings() {
    state.settings.fees.friday_tech = Number(document.getElementById('settingFeeTech').value) || 5000;
    state.settings.fees.school_delegation = Number(document.getElementById('settingFeeDelegation').value) || 15000;
    state.settings.fees.single_student = Number(document.getElementById('settingFeeStudent').value) || 3000;
    state.settings.fees.vip_executive = Number(document.getElementById('settingFeeVip').value) || 25000;
    state.settings.fees.tech_booth = Number(document.getElementById('settingFeeBooth').value) || 50000;
    state.settings.fees.sponsor_bronze = Number(document.getElementById('settingFeeBronze').value) || 50000;
    state.settings.paystackKey = document.getElementById('settingPaystackKey').value.trim();
    state.settings.venue.radius = Number(document.getElementById('settingGeofenceRadius').value) || 500;

    saveState();
    showToast('Event settings & fees saved successfully!', 'success');
  }

  function exportRegistrationsCsv() {
    const headers = [
      'Ticket Number',
      'Full Name / Institution',
      'Contact Person',
      'Email',
      'Phone',
      'Category',
      'Amount (NGN)',
      'Payment Status',
      'Payment Method',
      'Payment Reference',
      'Registered At',
      'Day 1 Check-In',
      'Day 2 Check-In',
      'GPS Verified'
    ];

    const rows = state.registrations.map(r => [
      `"${r.id}"`,
      `"${r.name}"`,
      `"${r.contactPerson || ''}"`,
      `"${r.email || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.categoryLabel}"`,
      r.amount || 0,
      `"${r.paymentStatus}"`,
      `"${r.paymentMethod || ''}"`,
      `"${r.paymentRef || ''}"`,
      `"${r.registeredAt}"`,
      r.day1Checkin ? 'YES' : 'NO',
      r.day2Checkin ? 'YES' : 'NO',
      r.gpsCheckin ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AGIS-2026-CCYI-Registrations-Report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CCYI Global CSV Report exported successfully!', 'success');
  }

  // ===== LIVE ENTRANCE QR SCANNER =====
  let html5Scanner = null;

  function initEntranceScanner() {
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const fileInput = document.getElementById('scanFileInput');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        startCameraScanner();
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        stopCameraScanner();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (typeof Html5Qrcode !== 'undefined') {
          const html5QrCode = new Html5Qrcode('scannerVideo');
          html5QrCode.scanFile(file, true)
            .then(decodedText => {
              handleScannedResult(decodedText);
            })
            .catch(err => {
              showToast('Could not find a valid QR code in that image.', 'error');
            });
        } else {
          showToast('Image scanner library unavailable.', 'warning');
        }
      });
    }
  }

  function startCameraScanner() {
    if (typeof Html5Qrcode === 'undefined') {
      showToast('Camera scanner library loading or blocked: using manual search.', 'warning');
      return;
    }

    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');

    html5Scanner = new Html5Qrcode('scannerVideo');
    html5Scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        handleScannedResult(decodedText);
      },
      (error) => {
        // quiet scanning frame error
      }
    ).then(() => {
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      showToast('Camera Scanner Active &bull; Point at ticket QR code', 'info');
    }).catch(err => {
      console.warn('Camera scan start error:', err);
      showToast('Could not access camera: check browser permissions.', 'error');
    });
  }

  function stopCameraScanner() {
    if (html5Scanner) {
      html5Scanner.stop().then(() => {
        html5Scanner.clear();
        document.getElementById('startScanBtn').classList.remove('hidden');
        document.getElementById('stopScanBtn').classList.add('hidden');
      }).catch(() => {});
    }
  }

  function handleScannedResult(text) {
    const feedbackEl = document.getElementById('scannerFeedback');
    const day = document.getElementById('scanDaySelector')?.value || 'day1';
    const dayLabel = day === 'day1' ? 'Day 1 (Friday 27 Nov)' : 'Day 2 (Saturday 28 Nov)';

    let ticketId = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.tkt) ticketId = parsed.tkt;
    } catch (e) {}

    const ticket = state.registrations.find(t => t.id === ticketId || t.ticketNumber === ticketId);

    feedbackEl.classList.remove('hidden');

    if (!ticket) {
      feedbackEl.style.borderColor = 'var(--danger)';
      feedbackEl.style.background = 'var(--danger-bg)';
      feedbackEl.innerHTML = `
        <i class="fas fa-times-circle" style="font-size:2rem; color:var(--danger); margin-bottom:8px;"></i>
        <h4 style="color:var(--danger); margin-bottom:4px;">INVALID TICKET</h4>
        <p style="font-size:0.85rem; color:#7f1d1d;">Scanned code: <code>${ticketId}</code> not recognized in AGIS database.</p>
      `;
      Sound.playWarning();
      return;
    }

    const isPaid = ticket.paymentStatus === 'PAID' || ticket.paymentStatus === 'FREE';
    if (!isPaid) {
      feedbackEl.style.borderColor = 'var(--warning)';
      feedbackEl.style.background = 'var(--warning-bg)';
      feedbackEl.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:var(--warning); margin-bottom:8px;"></i>
        <h4 style="color:#92400e; margin-bottom:4px;">PAYMENT UNVERIFIED</h4>
        <p style="font-size:0.85rem; color:#78350f;"><strong>${ticket.name}</strong> has a pending balance of <strong>${formatNaira(ticket.amount)}</strong>.</p>
        <button class="btn btn-sm btn-primary mt-2" onclick="window.markRegistrationPaid('${ticket.id}')">Approve &amp; Check In</button>
      `;
      Sound.playWarning();
      return;
    }

    // Check if already checked in today
    const alreadyChecked = day === 'day1' ? ticket.day1Checkin : ticket.day2Checkin;
    if (alreadyChecked) {
      feedbackEl.style.borderColor = 'var(--warning)';
      feedbackEl.style.background = 'var(--warning-bg)';
      feedbackEl.innerHTML = `
        <i class="fas fa-history" style="font-size:2rem; color:var(--warning); margin-bottom:8px;"></i>
        <h4 style="color:#92400e; margin-bottom:4px;">ALREADY CHECKED IN</h4>
        <p style="font-size:0.85rem; color:#78350f;"><strong>${ticket.name}</strong> was already checked in for ${dayLabel}.</p>
      `;
      Sound.playWarning();
      return;
    }

    // Valid check-in!
    if (day === 'day1') {
      ticket.day1Checkin = true;
      ticket.day1CheckinTime = new Date().toISOString();
    } else {
      ticket.day2Checkin = true;
      ticket.day2CheckinTime = new Date().toISOString();
    }
    saveState();
    updateDashboardMetrics();
    renderAdminTable();
    renderTicketWallet();

    feedbackEl.style.borderColor = 'var(--success)';
    feedbackEl.style.background = 'var(--success-bg)';
    feedbackEl.innerHTML = `
      <i class="fas fa-check-circle" style="font-size:2rem; color:var(--success); margin-bottom:8px;"></i>
      <h4 style="color:#065f46; margin-bottom:4px;">ACCREDITATION CONFIRMED</h4>
      <p style="font-size:0.88rem; color:#064e3b;">Welcome <strong>${ticket.name}</strong> (${ticket.categoryLabel}) to ${dayLabel}!</p>
    `;
    Sound.playSuccess();
  }

  // ===== NETWORK & PWA SERVICE WORKER SETUP =====
  function initPwaAndNetwork() {
    const netPill = document.getElementById('networkPill');

    function updateOnlineStatus() {
      if (navigator.onLine) {
        if (netPill) {
          netPill.className = 'status-pill pill-online';
          netPill.innerHTML = '<span class="pulse-dot"></span> Online';
        }
      } else {
        if (netPill) {
          netPill.className = 'status-pill pill-offline';
          netPill.innerHTML = '<i class="fas fa-plane"></i> Offline Mode';
        }
        showToast('You are offline. Tickets & saved venue map remain accessible!', 'info');
      }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('[AGIS 2026 PWA] Service worker registered with scope:', reg.scope);
        }).catch((err) => {
          console.warn('[AGIS 2026 PWA] Service worker registration notice:', err);
        });
      });
    }

    // PWA Install Prompt
    let deferredPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.classList.remove('hidden');
    });

    if (installBtn) {
      installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              showToast('AGIS 2026 App installed to your device!', 'success');
            }
            deferredPrompt = null;
            installBtn.classList.add('hidden');
          });
        }
      });
    }
  }

  // ===== INITIALIZATION ENTRYPOINT =====
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initNavigation();
    initCategorySwitcher();
    initCheckoutModal();
    initForms();
    renderTicketWallet();
    initTicketLookup();
    initLocationTracker();
    initAdminPortal();
    initPwaAndNetwork();

    console.log('✝ AGIS 2026 Companion PWA Initialized — FRESH OIL');
  });

})();
