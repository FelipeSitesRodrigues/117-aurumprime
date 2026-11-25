/**
 * Filme da abertura (ou de qualquer trecho): grava os quadros que o compositor produz
 * (screencast do Chrome) e monta uma grade com N quadros. É assim que se confere animação:
 * o page.screenshot() devolve quadro velho das camadas animadas na GPU. (cópia do 000)
 *
 * Uso: node scripts/filme.mjs [--de 0.3] [--ate 3] [--quadros 16] [--largura 1440]
 *                             [--altura 900] [--saida revisao/filme.png]
 */
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const opt = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d }
const de = Number(opt('de', 0.3)), ate = Number(opt('ate', 3)), n = Number(opt('quadros', 16))
const largura = Number(opt('largura', 1440)), altura = Number(opt('altura', 900))
const saida = opt('saida', 'revisao/filme.png')
mkdirSync(path.dirname(saida), { recursive: true })

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: largura, height: altura, isMobile: largura < 600, hasTouch: largura < 600 })
const cdp = await p.createCDPSession()
const quadros = []
cdp.on('Page.screencastFrame', async (f) => {
  quadros.push({ t: f.metadata.timestamp, data: f.data })
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, everyNthFrame: 1 })
const inicio = Date.now() / 1000
await p.goto(process.env.BASE_URL ?? 'http://localhost:3417/', { waitUntil: 'domcontentloaded' })
await new Promise((r) => setTimeout(r, (ate + 0.4) * 1000))
await cdp.send('Page.stopScreencast')
await b.close()

const todos = quadros.map((q) => ({ ...q, s: q.t - inicio })); console.log('faixa', todos[0]?.s.toFixed(2), todos.at(-1)?.s.toFixed(2)); const janela = todos.filter((q) => q.s >= de && q.s <= ate)
const passo = Math.max(1, Math.floor(janela.length / n))
const escolhidos = janela.filter((_, i) => i % passo === 0).slice(0, n)
const meta = await sharp(Buffer.from(escolhidos[0].data, 'base64')).metadata()
const fator = meta.width > 600 ? 0.4 : 0.6
const W = Math.round(meta.width * fator), H = Math.round(meta.height * fator), col = 4
const partes = await Promise.all(escolhidos.map(async (q) => {
  const img = await sharp(Buffer.from(q.data, 'base64')).resize(W, H).toBuffer()
  const rot = Buffer.from(`<svg width="90" height="24"><rect width="90" height="24" fill="#000" opacity=".6"/><text x="6" y="17" font-size="15" fill="#fff" font-family="Arial">${q.s.toFixed(2)} s</text></svg>`)
  return sharp(img).composite([{ input: rot, top: 0, left: 0 }]).png().toBuffer()
}))
const linhas = Math.ceil(partes.length / col)
await sharp({ create: { width: (W + 6) * col, height: (H + 6) * linhas, channels: 3, background: '#777' } })
  .composite(partes.map((input, i) => ({ input, left: (i % col) * (W + 6), top: Math.floor(i / col) * (H + 6) })))
  .png().toFile(saida)
console.log(`${quadros.length} quadros gravados, ${partes.length} na grade → ${saida}`)
