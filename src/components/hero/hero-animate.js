import gsap from 'gsap';

/**
 * @param {ShadowRoot | HTMLElement} root
 * @returns {{ cleanup: () => void }}
 */
export function playHeroAnimation(root) {
  const car = root.querySelector('.hero__media-car');
  const charger = root.querySelector('.hero__media-charger');
  const wire = root.querySelector('.hero__media-wire');

  if (!car || !charger || !wire) {
    return { cleanup: () => {} };
  }

  const targets = [car, charger, wire];
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    gsap.set(targets, { clearProps: 'all' });
    gsap.set(charger, { opacity: 1 });
    gsap.set(wire, { clipPath: 'inset(0 0 0 0)' });
    return { cleanup: () => {} };
  }

  gsap.set(car, { xPercent: -110, opacity: 1 });
  gsap.set(charger, { opacity: 0 });
  gsap.set(wire, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });

  const tl = gsap.timeline();

  tl.to(car, {
    xPercent: 0,
    duration: 1.1,
    ease: 'power3.out',
  });

  tl.to(
    charger,
    {
      opacity: 1,
      duration: 0.65,
      ease: 'power1.out',
    },
    '-=0.4',
  );

  tl.to(
    wire,
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1,
      ease: 'power2.inOut',
    },
    '-=0.15',
  );

  return {
    cleanup: () => {
      tl.kill();
      gsap.killTweensOf(targets);
    },
  };
}
