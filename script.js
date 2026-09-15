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

// Café Assistant chat widget — rule-based, answers from on-page info only.
(() => {
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chips = document.getElementById('chatSuggestions');

  if (!toggle || !panel || !chatForm || !chatInput || !messagesEl) return;

  const topics = [
    {
      keywords: ['hour', 'hours', 'open', 'close', 'opening'],
      reply: "We're open Monday–Friday 7:00am–6:00pm, Saturday 8:00am–6:00pm, and Sunday 8:00am–4:00pm. Holiday hours are 9:00am–2:00pm."
    },
    {
      keywords: ['menu', 'coffee', 'latte', 'espresso', 'pastry', 'pastries', 'croissant', 'breakfast', 'food', 'price', 'cost'],
      reply: 'Our menu features specialty coffee (Classic Latte $4.50, Pour Over $5.00, Iced Cortado $4.75), fresh pastries (Butter Croissant $3.25, Cinnamon Bun $4.00), and breakfast (Avocado Toast $8.50). See the full <a href="#menu">Menu</a> section for more.'
    },
    {
      keywords: ['where', 'location', 'address', 'located', 'direction'],
      reply: 'You’ll find us at 128 Maple Street, Portland, OR 97205. Check the map in our <a href="#visit">Visit</a> section for directions.'
    },
    {
      keywords: ['wifi', 'wi-fi', 'internet', 'laptop'],
      reply: 'Yes — we offer free Wi-Fi and have laptop-friendly tables, so feel free to bring your work along.'
    },
    {
      keywords: ['park', 'parking'],
      reply: "There's a free parking lot behind the building, plus metered street parking on Maple St."
    },
    {
      keywords: ['vegan', 'vegetarian', 'gluten', 'dairy', 'allerg', 'dietary'],
      reply: 'We offer oat and almond milk alternatives for any coffee drink, and several menu items can be made vegetarian. For specific allergy questions, please ask our staff in person or reach out via our <a href="#contact">Contact</a> form.'
    },
    {
      keywords: ['contact', 'phone', 'call', 'email', 'reach'],
      reply: 'You can reach us at <a href="tel:+15035550148">(503) 555-0148</a> or <a href="mailto:hello@hearthandbean.com">hello@hearthandbean.com</a>, or send a message through our <a href="#contact">Contact</a> form.'
    },
    {
      keywords: ['order', 'reserve', 'reservation', 'book', 'table'],
      reply: 'We don’t take orders through this chat yet — head to our <a href="#menu">Menu</a> and order at the counter, or tap the Order Now button to jump straight there.'
    },
    {
      keywords: ['thank', 'thanks', 'thx'],
      reply: "You're very welcome! Anything else I can help with?"
    },
    {
      keywords: ['hello', 'hey', 'howdy', 'greetings'],
      reply: 'Hi there! Ask me about our hours, menu, location, Wi-Fi, parking, dietary options, or how to contact us.'
    }
  ];

  const fallbackReply = 'I’m not sure about that one — but you can reach our team at <a href="mailto:hello@hearthandbean.com">hello@hearthandbean.com</a> or <a href="tel:+15035550148">(503) 555-0148</a>, or browse the sections above.';

  function findReply(text) {
    const lower = text.toLowerCase();
    const match = topics.find(topic => topic.keywords.some(kw => lower.includes(kw)));
    return match ? match.reply : fallbackReply;
  }

  function addMessage(text, sender) {
    const el = document.createElement('div');
    el.className = `chat-msg ${sender}`;
    if (sender === 'bot') {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  let greeted = false;
  let lastFocused = null;

  function openChat() {
    lastFocused = document.activeElement;
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      addMessage('Hi! I’m the Hearth &amp; Bean assistant — ask me about our hours, menu, location, Wi-Fi, parking, dietary options, or how to reach us.', 'bot');
      greeted = true;
    }
    chatInput.focus();
  }

  function closeChat() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    } else {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => {
    if (panel.hidden) {
      openChat();
    } else {
      closeChat();
    }
  });

  // Jumping to an on-page section (e.g. #menu) from a reply should reveal
  // it, not leave the chat panel covering it.
  messagesEl.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) closeChat();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeChat);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      closeChat();
    }
  });

  if (chips) {
    chips.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const question = chip.dataset.question;
        addMessage(question, 'user');
        addMessage(findReply(question), 'bot');
      });
    });
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = chatInput.value.trim();
    if (!value) return;
    addMessage(value, 'user');
    addMessage(findReply(value), 'bot');
    chatInput.value = '';
  });

  // Explicit Enter-to-send: don't rely on implicit form submission, which
  // some mobile keyboards and automation tools fail to trigger reliably.
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typeof chatForm.requestSubmit === 'function') {
        chatForm.requestSubmit();
      } else {
        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  });
})();
