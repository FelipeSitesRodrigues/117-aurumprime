// Topo: vidro escuro depois de rolar um pouco, some ao descer e volta ao subir. Menu do celular.
;(() => {
  const topo = document.querySelector('[data-topo]')
  if (!topo) return
  let ultimo = 0 // ler o scrollY aqui forçava o 1º layout (101 ms a 4x); o rAF lê depois
  let raf = 0
  const atualizar = () => {
    raf = 0
    const y = scrollY
    topo.classList.toggle('topo--solido', y > 40)
    if (Math.abs(y - ultimo) > 6) {
      topo.classList.toggle('topo--some', y > ultimo && y > innerHeight * 0.8)
      ultimo = y
    }
  }
  addEventListener('scroll', () => raf || (raf = requestAnimationFrame(atualizar)), { passive: true })
  raf = requestAnimationFrame(atualizar) // fora da carga: ler o scroll ali pagava o 1º layout da página

  const botao = topo.querySelector('[data-menu-botao]')
  const menu = topo.querySelector('[data-menu]')
  const abrir = (sim) => {
    botao.setAttribute('aria-expanded', String(sim))
    botao.setAttribute('aria-label', sim ? 'Fechar menu' : 'Abrir menu')
    if (sim) {
      menu.hidden = false
      requestAnimationFrame(() => requestAnimationFrame(() => topo.classList.add('topo--aberto')))
      window.lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
    } else {
      topo.classList.remove('topo--aberto')
      document.documentElement.style.overflow = ''
      window.lenis?.start()
      setTimeout(() => topo.classList.contains('topo--aberto') || (menu.hidden = true), 450)
    }
  }
  botao.addEventListener('click', () => abrir(botao.getAttribute('aria-expanded') !== 'true'))
  menu.addEventListener('click', (e) => e.target.closest('a') && abrir(false))
  addEventListener('keydown', (e) => e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true' && abrir(false))
})()
