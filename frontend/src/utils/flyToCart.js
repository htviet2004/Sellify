const TARGET_SELECTOR = '.cart-btn';

function getElement(elOrSelector) {
  if (!elOrSelector) return null;
  if (typeof elOrSelector === 'string') {
    return document.querySelector(elOrSelector);
  }
  return elOrSelector;
}

export default function flyToCart(sourceEl, options = {}) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const source = getElement(sourceEl || options.sourceSelector);
  if (!source) return;

  const target = getElement(options.targetSelector || TARGET_SELECTOR);
  if (!target) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (!sourceRect.width || !sourceRect.height) return;

  const clone = source.cloneNode(true);
  clone.classList.add('fly-to-cart-clone');
  clone.style.position = 'fixed';
  clone.style.pointerEvents = 'none';
  clone.style.margin = '0';
  clone.style.top = `${sourceRect.top}px`;
  clone.style.left = `${sourceRect.left}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease';
  clone.style.willChange = 'transform, opacity';
  clone.style.opacity = '0.9';
  document.body.appendChild(clone);

  const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
  const scale = Math.max(0.25, Math.min(0.4, targetRect.width / sourceRect.width));

  requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scale})`;
    clone.style.opacity = '0.2';
  });

  const cleanup = () => {
    clone.removeEventListener('transitionend', cleanup);
    clone.remove();
  };
  clone.addEventListener('transitionend', cleanup);

  target.classList.add('cart-btn--pulse');
  window.setTimeout(() => target.classList.remove('cart-btn--pulse'), 600);
}
