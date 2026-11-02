// Shared code of the card widgets. Each widget page calls Widget.load() and renders from data/products.json,
// so a push to the repo changes the cards in every Superhive description that embeds them.
const Widget = (() => {
  const params = new URLSearchParams(location.search);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  async function load() {
    // GitHub Pages lets browsers cache for 10 minutes; ask for a fresh copy so changes show up right away.
    const res = await fetch('../data/products.json', { cache: 'no-cache' });
    const data = await res.json();
    const self = data.products[params.get('p')] || null;
    const related = self ? self.related : data.order;
    return { data, self, related: related.map(id => data.products[id]).filter(Boolean) };
  }

  // Product links open in the Superhive tab itself; everything else in a new tab.
  const productLink = p => `href="${esc(p.url)}" target="_top"`;
  const externalLink = url => `href="${esc(url)}" target="_blank" rel="noopener"`;
  const badges = p => p.badges.map(b => `<span>${esc(b)}</span>`).join('');
  const flag = p => (p.flag ? `<span class="flag">${esc(p.flag)}</span>` : '');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const icons = {
    x: '<path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>',
    website: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.3 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.3-3.6-8.5s1-6.1 3.6-8.5z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.website}</svg>`;

  return { params, esc, load, productLink, externalLink, badges, flag, icon, reducedMotion };
})();
