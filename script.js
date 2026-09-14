// Mobile nav toggle
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Menu tabs — filter the grid by category
const menuCards = document.querySelectorAll('#menuGrid .menu-card');

function filterMenu(category) {
  menuCards.forEach(card => {
    card.hidden = card.dataset.category !== category;
  });
}

document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    filterMenu(tab.dataset.category);
  });
});

const initialTab = document.querySelector('.menu-tab.active');
if (initialTab) filterMenu(initialTab.dataset.category);

// Gallery lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
let lastFocusedEl = null;

document.querySelectorAll('.gallery-grid a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    lastFocusedEl = link;
    const img = link.querySelector('img');
    lightboxImage.src = link.dataset.full || img.src;
    lightboxImage.alt = img.alt || '';
    lightbox.showModal();
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener('click', () => lightbox.close());
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    lightboxImage.src = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  });
}

// Placeholder links (social icons, legal pages) — avoid jarring scroll-to-top
document.querySelectorAll('.social-row a[href="#"], .footer-col a[href="#"]').forEach(link => {
  link.addEventListener('click', (e) => e.preventDefault());
});

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => observer.observe(el));

// Contact form (no backend wired up — validates and shows local feedback)
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!contactForm.checkValidity()) {
      formStatus.textContent = 'Please fill in your name, email, and message.';
      formStatus.className = 'form-status error';
      contactForm.reportValidity();
      return;
    }

    const name = contactForm.querySelector('#name').value.trim();
    formStatus.textContent = `Thanks, ${name}! We'll get back to you within one business day.`;
    formStatus.className = 'form-status success';
    contactForm.reset();
  });
}

// Newsletter form
const newsletterForm = document.getElementById('newsletterForm');
const newsletterStatus = document.getElementById('newsletterStatus');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input[type="email"]');
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    input.value = '';
    if (newsletterStatus) {
      newsletterStatus.textContent = "You're subscribed! Look out for new roasts in your inbox. ☕";
      newsletterStatus.className = 'form-status newsletter-status success';
    }
  });
}
