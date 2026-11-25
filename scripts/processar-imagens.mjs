/**
 * Imagens do site da Aurum Prime em src/assets/img (AVIF e WebP em várias larguras, com
 * manifesto.json pro width/height do <img>), ícones em src/raiz e a abertura (peças da logo +
 * parcial 97-abertura.html). Base da 0116.
 *
 * Origem (../0117 - Aurum Prime/Recursos Site):
 *  - fotos/: as 11 fotos limpas do ChatGPT (hero, 6 serviços, sobre, como funciona, dúvidas, cta)
 *  - logo-aurum-prime.png: logo dourada no preto (1254x1254). Vira transparente aqui: alfa pelo
 *    brilho e a cor dividida pelo alfa (o dourado continua com o degradê original)
 * Uso: node scripts/processar-imagens.mjs [hero servicos ... logo]   (depois: node build.mjs)
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

sharp.cache(false)
const REC = '../0117 - Aurum Prime/Recursos Site'
const FOTOS = `${REC}/fotos`
const OUT = 'src/assets/img'
const RAIZ = 'src/raiz'
const so = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })
mkdirSync(RAIZ, { recursive: true })
if (!so.length) for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f), { recursive: true, force: true })
const manifesto = so.length ? JSON.parse(readFileSync(path.join(OUT, 'manifesto.json'), 'utf8')) : {}
const quer = (n) => !so.length || so.includes(n)

async function gravar(pipeline, nome) {
  const info = await pipeline.toFile(path.join(OUT, nome))
  manifesto[nome] = { w: info.width, h: info.height, kb: Math.round(info.size / 1024) }
}

// recorta na proporção (w/h) em volta de um ponto {x, y} em fração da imagem
async function proporcao(arq, prop, foco = { x: 0.5, y: 0.5 }) {
  const buf = await sharp(arq).toBuffer()
  const m = await sharp(buf).metadata()
  const w = Math.min(m.width, Math.round(m.height * prop))
  const h = Math.min(m.height, Math.round(w / prop))
  const left = Math.max(0, Math.min(m.width - w, Math.round(foco.x * m.width - w / 2)))
  const top = Math.max(0, Math.min(m.height - h, Math.round(foco.y * m.height - h / 2)))
  return sharp(buf).extract({ left, top, width: w, height: h }).toBuffer()
}

async function variantes(nome, buf, larguras, { q = 52, alfa = false } = {}) {
  const { width } = await sharp(buf).metadata()
  for (const w of larguras) {
    const lw = Math.min(w, width)
    for (const f of ['avif', 'webp']) {
      let p = sharp(buf).resize({ width: lw, kernel: 'lanczos3' })
      if (!alfa) p = p.removeAlpha()
      p = f === 'avif' ? p.avif({ quality: q, effort: 7 }) : p.webp({ quality: alfa ? 84 : 74, alphaQuality: 90, effort: 6, smartSubsample: true })
      await gravar(p, `${nome}-${lw}.${f}`)
    }
  }
  console.log(nome.padEnd(26), larguras.join(', '))
}

// ---------------------------------------------------------------- hero
if (quer('hero')) {
  // q alta: a foto do ChatGPT tem 1672 px e a tela larga já estica; com q 50 o AVIF borrava
  // o rosto e o carro (Felipe, 2026-11-25). Nitidez leve pra compensar o esticão
  await variantes('hero', await sharp(`${FOTOS}/hero-homem-suv.png`).sharpen({ sigma: 0.6 }).toBuffer(), [960, 1440, 1672], { q: 72 })
  // celular: a foto vertical própria (9:16, 941x1672), gerada no mesmo chat do mockup
  await variantes('hero-cel', await sharp(`${FOTOS}/hero-vertical-celular.png`).sharpen({ sigma: 0.5 }).toBuffer(), [480, 720, 941], { q: 66 })
}

// ---------------------------------------------------------------- serviços (6 cartões 4:5)
if (quer('servicos')) {
  for (const n of ['veiculo', 'imovel', 'reducao-juros', 'quitacao', 'negociacao', 'analise'])
    await variantes(`servico-${n}`, await sharp(`${FOTOS}/servico-${n}.png`).toBuffer(), [360, 540, 720], { q: 50 })
}

// ---------------------------------------------------------------- sobre, como funciona, dúvidas, cta
if (quer('secoes')) {
  await variantes('sobre', await sharp(`${FOTOS}/sobre-escritorio.png`).toBuffer(), [480, 720, 1000], { q: 50 })
  await variantes('avenida', await sharp(`${FOTOS}/como-funciona-avenida.png`).toBuffer(), [960, 1440, 1672], { q: 46 })
  await variantes('duvidas', await sharp(`${FOTOS}/duvidas-homem-carro.png`).toBuffer(), [420, 640, 900], { q: 52 })
  await variantes('cidade', await sharp(`${FOTOS}/cta-cidade-noite.png`).toBuffer(), [960, 1440, 1672], { q: 44 })
}

// ---------------------------------------------------------------- logo
// Fundo preto puro: alfa = brilho do pixel (0 abaixo de 16, cheio a partir de 190) e a cor
// dividida pelo alfa, pra borda não escurecer. Recortes em pixels da logo de 1254.
const LOGO = `${REC}/logo-aurum-prime.png`
const R_ESFERA = { left: 296, top: 142, width: 658, height: 676 }
const R_NOME = { left: 86, top: 842, width: 1072, height: 126 }
const R_TAG = { left: 208, top: 994, width: 832, height: 62 }
async function transparente(r) {
  const { data, info } = await sharp(LOGO).extract(r).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const o = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const m = Math.max(data[i], data[i + 1], data[i + 2])
    const a = Math.max(0, Math.min(1, (m - 16) / (190 - 16)))
    if (a <= 0) continue
    o[j] = Math.min(255, Math.round(data[i] / Math.max(a, m / 255)))
    o[j + 1] = Math.min(255, Math.round(data[i + 1] / Math.max(a, m / 255)))
    o[j + 2] = Math.min(255, Math.round(data[i + 2] / Math.max(a, m / 255)))
    o[j + 3] = Math.round(a * 255)
  }
  return sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
}

if (quer('logo')) {
  const esfera = await transparente(R_ESFERA)
  const nome = await transparente(R_NOME)
  const tag = await transparente(R_TAG)
  const me = await sharp(esfera).metadata()
  const mn = await sharp(nome).metadata()
  const mt = await sharp(tag).metadata()
  // lockup empilhado igual ao original (esfera, nome, assinatura), com os espaços da logo
  const L = mn.width
  const gNome = R_NOME.top - (R_ESFERA.top + R_ESFERA.height)
  const gTag = R_TAG.top - (R_NOME.top + R_NOME.height)
  const yNome = me.height + gNome
  const yTag = yNome + mn.height + gTag
  const H = yTag + mt.height
  const xE = Math.round((L - me.width) / 2)
  const xT = Math.round((L - mt.width) / 2)
  const pilha = await sharp({ create: { width: L, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: esfera, left: xE, top: 0 },
      { input: nome, left: 0, top: yNome },
      { input: tag, left: xT, top: yTag },
    ])
    .png()
    .toBuffer()
  // nome + assinatura (topo do site, ao lado da esfera)
  const palavra = await sharp({ create: { width: L, height: mn.height + gTag + mt.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: nome, left: 0, top: 0 }, { input: tag, left: xT, top: mn.height + gTag }])
    .png()
    .toBuffer()
  await variantes('logo-esfera', esfera, [96, 192], { q: 70, alfa: true })
  await variantes('logo-palavra', palavra, [300, 600], { q: 80, alfa: true })
  await variantes('logo-pilha', pilha, [320, 560], { q: 80, alfa: true })

  // ícones do navegador: a esfera no preto
  const quadrado = async (lado, margem) => {
    const ic = await sharp(esfera).resize({ height: Math.round(lado * (1 - margem * 2)) }).toBuffer()
    const m = await sharp(ic).metadata()
    return sharp({ create: { width: lado, height: lado, channels: 4, background: '#070605' } }).composite([{ input: ic, left: Math.round((lado - m.width) / 2), top: Math.round((lado - m.height) / 2) }]).png()
  }
  await (await quadrado(32, 0.03)).toFile(`${RAIZ}/favicon-32.png`)
  await (await quadrado(180, 0.12)).toFile(`${RAIZ}/apple-touch-icon.png`)
  await (await quadrado(192, 0.12)).toFile(`${RAIZ}/icon-192.png`)
  await (await quadrado(512, 0.12)).toFile(`${RAIZ}/icon-512.png`)

  // compartilhamento 1200x630: a foto do hero escurecida à esquerda e a logo por cima
  const fundo = await sharp(`${FOTOS}/hero-homem-suv.png`).resize(1200, 630, { fit: 'cover', position: 'right' }).toBuffer()
  const veu = Buffer.from(`<svg width="1200" height="630"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#070605" stop-opacity=".92"/><stop offset=".5" stop-color="#070605" stop-opacity=".55"/><stop offset="1" stop-color="#070605" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`)
  const lg = await sharp(pilha).resize({ width: 400 }).toBuffer()
  const ml = await sharp(lg).metadata()
  await sharp(fundo)
    .composite([{ input: veu }, { input: lg, left: 90, top: Math.round((630 - ml.height) / 2) }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, 'og.jpg'))

  // ------------------------------------------------------------ abertura: a logo em pedaços
  // Esfera inteira, cada letra de AURUM PRIME (colunas vazias do alfa) e a assinatura inteira.
  // Peças gravadas pra um lockup de 640 px (2x do tamanho na tela). Coreografia no 97-abertura.css.
  const colunas = async (buf, quer) => {
    const { data, info } = await sharp(buf).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true })
    const n = Array.from({ length: info.width }, (_, x) => { let c = 0; for (let y = 0; y < info.height; y++) if (data[y * info.width + x] > 110) c++; return c })
    const runs = []
    let ini = -1
    for (let x = 0; x <= info.width; x++) {
      const cheio = x < info.width && n[x] > 0
      if (cheio && ini < 0) ini = x
      if (!cheio && ini >= 0) { if (x - ini > 3) runs.push([ini, x]); ini = -1 }
    }
    while (runs.length < quer) {
      const i = runs.reduce((m, r, j) => (r[1] - r[0] > runs[m][1] - runs[m][0] ? j : m), 0)
      const [a, b] = runs[i]
      let corte = Math.round(a + (b - a) * 0.3)
      for (let x = corte; x < a + (b - a) * 0.7; x++) if (n[x] < n[corte]) corte = x
      runs.splice(i, 1, [a, corte], [corte, b])
    }
    // a peça vai até o meio do vão: o brilho em volta da letra não fica cortado
    return runs.map(([a, b], i) => [i ? Math.round((runs[i - 1][1] + a) / 2) : Math.max(0, a - 4), i < runs.length - 1 ? Math.round((b + runs[i + 1][0]) / 2) : Math.min(info.width, b + 4)])
  }
  const rl = await colunas(nome, 10)
  if (rl.length !== 10) throw new Error(`abertura: esperava 10 letras em AURUM PRIME, veio ${rl.length}`)
  console.log('letras:', rl.map(([a, b]) => b - a).join(' '))
  const ESC = 640 / L
  const pecas = [
    ['esfera', xE, 0, me.width, me.height],
    ...rl.map(([a, b], i) => [`letra-${i}`, a, yNome, b - a, mn.height]),
    ['assinatura', xT, yTag, mt.width, mt.height],
  ]
  const pct = (v, t) => `${+((v / t) * 100).toFixed(3)}%`
  const imgs = []
  for (const [peca, left, top, width, height] of pecas) {
    const w = Math.max(1, Math.round(width * ESC))
    const h = Math.max(1, Math.round(height * ESC))
    // a esfera pontilhada não comprime: sai em 1,5x e qualidade menor (115 KB em 2x q84)
    const esf = peca === 'esfera'
    await gravar(sharp(await sharp(pilha).extract({ left, top, width, height }).png().toBuffer()).resize(esf ? Math.round(w * 0.75) : w, esf ? Math.round(h * 0.75) : h).webp({ quality: esf ? 70 : 84, alphaQuality: esf ? 80 : 90 }), `abertura-${peca}.webp`)
    const letra = peca.startsWith('letra-')
    const l = letra ? Number(peca.slice(6)) : 0
    imgs.push(`        <img class="abertura__p" data-peca="${letra ? 'letra' : peca}" src="/assets/img/abertura-${peca}.webp" alt="" width="${w}" height="${h}" style="left:${pct(left, L)};top:${pct(top, H)};width:${pct(width, L)}${letra ? `;--l:${l}` : ''}">`)
  }
  writeFileSync('src/partials/97-abertura.html', `<!-- abertura (gerado por scripts/processar-imagens.mjs, não editar à mão): a esfera gira e
     acende, AURUM PRIME sobe letra a letra e a assinatura se fecha no lugar; depois a tela sobe
     com a borda curva e o fio dourado, revelando o hero. Coreografia no 97-abertura.css.
     O script segura a abertura e o hero (abre-espera) até as peças decodificarem, no máximo 0,6 s -->
<div class="abertura" aria-hidden="true" data-abertura>
  <div class="abertura__marca">
    <span class="abertura__luz"></span>
    <div class="abertura__logo" style="aspect-ratio:${L} / ${H}">
${imgs.join('\n')}
    </div>
  </div>
</div>
<script>(()=>{const h=document.documentElement;if(!h.classList.contains('js')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;h.classList.add('abre-espera');const solta=()=>h.classList.remove('abre-espera');Promise.race([Promise.all([...document.querySelectorAll('[data-abertura] img')].map((i)=>i.decode().catch(()=>{}))),new Promise((r)=>setTimeout(r,600))]).then(solta)})()</script>
`)
}

writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1))
const total = Object.values(manifesto).reduce((s, m) => s + m.kb, 0)
console.log(`\n${Object.keys(manifesto).length} arquivos, ${total} KB no total`)
