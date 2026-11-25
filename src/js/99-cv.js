// 1º clique numa âncora interna: desenha todas as seções puladas pelo content-visibility antes
// de rolar, pra a rolagem parar no alvo certo (memória content-visibility-ancoras).
;(() => {
  const html = document.documentElement
  document.addEventListener('click', (e) => {
    if (html.classList.contains('cv-off')) return
    const a = e.target.closest('a[href^="#"]')
    if (!a || a.getAttribute('href').length < 2) return
    html.classList.add('cv-off')
    void html.offsetHeight
  }, true)
})()
