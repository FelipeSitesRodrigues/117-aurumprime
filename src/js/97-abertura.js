// abertura: some do layout quando termina de subir, pra não ficar uma camada fixa por cima
;(() => {
  const a = document.querySelector('[data-abertura]')
  if (!a) return
  a.addEventListener('animationend', (e) => { if (e.target === a) a.classList.add('acabou') })
  setTimeout(() => a.classList.add('acabou'), 2600)
})()
