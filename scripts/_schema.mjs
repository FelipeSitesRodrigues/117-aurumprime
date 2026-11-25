// JSON-LD da Aurum Prime (ProfessionalService com endereço) e das perguntas (FAQPage), puxado pelo build.
// LegalService só quando confirmarem advogado com OAB por trás (pendência no site.config.json).
import * as cheerio from 'cheerio'

export function schemaEmpresa(html, cfg) {
  const base = (cfg.dominio || '').replace(/\/$/, '')
  const e = cfg.endereco || {}
  const empresa = {
    '@type': 'ProfessionalService',
    '@id': `${base}/#empresa`,
    name: 'Aurum Prime Assessoria Jurídica',
    alternateName: 'Aurum Prime',
    description: cfg.descricao,
    image: `${base}/assets/img/og.jpg`,
    logo: `${base}/icon-512.png`,
    telephone: `+${cfg.whatsapp}`,
    address: { '@type': 'PostalAddress', streetAddress: [e.rua, e.complemento].filter(Boolean).join(', '), addressLocality: e.cidade, addressRegion: e.uf, postalCode: e.cep, addressCountry: 'BR' },
    areaServed: [{ '@type': 'City', name: 'Santo André' }, { '@type': 'AdministrativeArea', name: 'Grande ABC' }],
    serviceType: 'Revisão de contrato de financiamento',
    knowsAbout: ['Revisão de financiamento de veículo', 'Revisão de financiamento imobiliário', 'Juros abusivos', 'Quitação de financiamento', 'Negociação de dívida com banco', 'Análise de contrato bancário'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Serviços',
      itemListElement: ['Financiamento de veículo', 'Financiamento de imóvel', 'Redução de juros', 'Quitação negociada', 'Negociação com bancos', 'Análise de contrato'].map((n) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })),
    },
    sameAs: Object.values(cfg.redes || {}).filter(Boolean),
  }
  if (base) empresa.url = `${base}/`
  const $ = cheerio.load(html)
  const perguntas = $('#perguntas .duvida')
    .map((_, d) => ({
      '@type': 'Question',
      name: $(d).find('.duvida__q').text().replace(/\s+/g, ' ').trim(),
      acceptedAnswer: { '@type': 'Answer', text: $(d).find('.duvida__r').text().replace(/\s+/g, ' ').trim() },
    }))
    .get()
    .filter((q) => q.name && q.acceptedAnswer.text)
  const grafo = [empresa]
  if (perguntas.length) grafo.push({ '@type': 'FAQPage', '@id': `${base}/#perguntas`, mainEntity: perguntas })
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo })}</script>`
}
