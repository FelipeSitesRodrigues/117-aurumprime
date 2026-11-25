// Dúvidas: sanfona (abre uma e fecha a que estava aberta) e, no computador, o brilho que segue
// o mouse dentro de cada lâmina de vidro (variáveis só enquanto o mouse está em cima).
;(() => {
  const lista = document.querySelector('[data-duvidas]')
  if (!lista) return
  const itens = [...lista.querySelectorAll('.duvida')]
  const abrir = (item, sim) => {
    item.classList.toggle('duvida--aberta', sim)
    item.querySelector('.duvida__q').setAttribute('aria-expanded', String(sim))
  }
  lista.addEventListener('click', (e) => {
    const q = e.target.closest('.duvida__q')
    if (!q) return
    const item = q.closest('.duvida')
    const sim = !item.classList.contains('duvida--aberta')
    itens.forEach((o) => o !== item && o.classList.contains('duvida--aberta') && abrir(o, false))
    abrir(item, sim)
  })
  abrir(itens[0], true)
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  lista.addEventListener('pointermove', (e) => {
    const item = e.target.closest('.duvida')
    if (!item) return
    const r = item.getBoundingClientRect()
    item.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`)
    item.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`)
  })
})()
