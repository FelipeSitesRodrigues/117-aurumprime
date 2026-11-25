// Como funciona: quando os passos entram na tela, os pontos acendem e os fios crescem em
// sequência (.passos-vivos). Uma vez só.
;(() => {
  const lista = document.querySelector('[data-passos]')
  if (!lista) return
  if (!('IntersectionObserver' in window)) return lista.classList.add('passos-vivos')
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return
    lista.classList.add('passos-vivos')
    io.disconnect()
  }, { rootMargin: '0px 0px -20% 0px' })
  io.observe(lista)
})()
