import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://localhost:3417/', { waitUntil: 'load' })
await p.evaluate(() => document.documentElement.classList.remove('abre-espera'))
for (const t of [100, 300, 550, 800, 1100, 1500, 1700, 2400, 3600]) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t }), t)
  await p.screenshot({ path: `revisao/ab-${t}.png` })
}
const sw = await p.evaluate(() => document.documentElement.scrollWidth)
console.log('scrollWidth', sw)
await b.close()
