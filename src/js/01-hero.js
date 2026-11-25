// Hero: no computador a cena (foto e marcações) anda de leve com o mouse e, ao rolar, o texto
// sobe um pouco mais rápido que a foto. Só transform, num rAF, e só com o hero na tela. Fora
// da tela, o pulso dos pontos para (hero--fora). Sem mouse no celular nem com movimento reduzido.
;(() => {
  const hero = document.querySelector('[data-hero]')
  if (!hero) return
  let visivel = true
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting
    hero.classList.toggle('hero--fora', !visivel)
  }).observe(hero)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine) and (min-width: 75em)').matches) return
  const cenas = hero.querySelectorAll('[data-hero-cena]')
  const texto = hero.querySelector('[data-hero-texto]')
  let mx = 0
  let my = 0
  let x = 0
  let y = 0
  let raf = 0
  const quadro = () => {
    raf = 0
    x += (mx - x) * 0.07
    y += (my - y) * 0.07
    const r = Math.min(scrollY, innerHeight)
    const t = `translate3d(${(x * -16).toFixed(2)}px, ${(r * 0.14 + y * -8).toFixed(2)}px, 0)`
    cenas.forEach((c) => (c.style.transform = t))
    texto.style.transform = `translate3d(0, ${(r * -0.08).toFixed(2)}px, 0)`
    if (Math.abs(mx - x) > 0.002 || Math.abs(my - y) > 0.002) pedir()
  }
  const pedir = () => visivel && !raf && (raf = requestAnimationFrame(quadro))
  hero.addEventListener('pointermove', (e) => {
    mx = e.clientX / innerWidth - 0.5
    my = e.clientY / innerHeight - 0.5
    pedir()
  })
  addEventListener('scroll', pedir, { passive: true })
})()
