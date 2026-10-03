// Inline SVG icons (line style, inherit currentColor).
const line = (d, extra = '') =>
  `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icons = {
  cake: line('<path d="M4 21h16M5 21v-6.5A2.5 2.5 0 0 1 7.5 12h9a2.5 2.5 0 0 1 2.5 2.5V21"/><path d="M5 16.5c1.2.9 2.3.9 3.5 0s2.3-.9 3.5 0 2.3.9 3.5 0 2.3-.9 3.5 0"/><path d="M12 12V8.5"/><path d="M12 6.5c1-.9 1-2 0-3-1 1-1 2.1 0 3z"/>'),
  birthday: line('<path d="M4 21h16M5 21v-6.5A2.5 2.5 0 0 1 7.5 12h9a2.5 2.5 0 0 1 2.5 2.5V21"/><path d="M5 16.5c1.2.9 2.3.9 3.5 0s2.3-.9 3.5 0 2.3.9 3.5 0 2.3-.9 3.5 0"/><path d="M8 12V9.5M12 12V9.5M16 12V9.5"/><path d="M8 7.3c.6-.5.6-1.2 0-1.8-.6.6-.6 1.3 0 1.8zM12 7.3c.6-.5.6-1.2 0-1.8-.6.6-.6 1.3 0 1.8zM16 7.3c.6-.5.6-1.2 0-1.8-.6.6-.6 1.3 0 1.8z"/>'),
  wedding: line('<path d="M5 21h14M6.5 21v-4.5h11V21M8.5 16.5V13h7v3.5M10.5 13v-3h3v3"/><path d="M12 7.6s-2-1.2-2-2.7a1.1 1.1 0 0 1 2-.6 1.1 1.1 0 0 1 2 .6c0 1.5-2 2.7-2 2.7z"/>'),
  ring: line('<circle cx="12" cy="15" r="6"/><path d="M9.5 5 11 3h2l1.5 2L12 8.5z"/>'),
  heart: line('<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>'),
  kids: line('<ellipse cx="12" cy="9" rx="5" ry="6"/><path d="M12 15l-1 1.6h2L12 15zM12 16.6c0 1.8-2 2.2-2 4.4"/><path d="M9.6 6.2a2.8 2.8 0 0 1 2-1.3"/>'),
  baby: line('<path d="M10 2.5h4v3h-4z"/><path d="M9 5.5h6l1.2 3v10.5a2 2 0 0 1-2 2H9.8a2 2 0 0 1-2-2V8.5z"/><path d="M7.8 12h3.5M7.8 15h3.5"/>'),
  graduation: line('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.2 9 2.2 12 0v-5"/><path d="M22 9v5"/>'),
  gift: line('<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8C10.5 4 7 4.5 7.5 6.5S12 8 12 8zM12 8c1.5-4 5-3.5 4.5-1.5S12 8 12 8z"/>'),
  sparkle: line('<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 7c.6 3 2 4.4 5 5-3 .6-4.4 2-5 5-.6-3-2-4.4-5-5 3-.6 4.4-2 5-5z"/>'),
  leaf: line('<path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>'),
  hand: line('<path d="M12 20s-6-3.7-6-8.2A3.3 3.3 0 0 1 12 9.9a3.3 3.3 0 0 1 6 1.9C18 16.3 12 20 12 20z"/><path d="M12 4v2M7 5l1 1.6M17 5l-1 1.6"/>'),
  instagram: line('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'),
  facebook: line('<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>'),
  mail: line('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
  pin: line('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  menu: line('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  close: line('<path d="M6 6l12 12M18 6 6 18"/>'),
  arrow: line('<path d="M5 12h14M13 6l6 6-6 6"/>', 'flip-rtl'),
  chevron: line('<path d="m9 6 6 6-6 6"/>', 'flip-rtl'),
  chevronBack: line('<path d="m15 6-6 6 6 6"/>', 'flip-rtl'),
  globe: line('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
  zoom: line('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5"/>'),
  whatsapp:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.4z"/></svg>',
};

export const icon = (name) => icons[name] || icons.cake;

// Icon keys available for occasions (used by the admin dropdown too)
export const OCCASION_ICONS = ['birthday', 'wedding', 'ring', 'heart', 'kids', 'baby', 'graduation', 'gift', 'cake', 'sparkle'];
