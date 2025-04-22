const axios = require('axios') //ele faz requisiçoes HTTP (como fetch)
const cheerio = require('cheerio') // interpreta o HTML
const fs = require('fs') //file system

//1 - defininir a URL que queremos acessar
const sites = [
    'https://www.linkedin.com/in/yago-emanuel-brito-de-moura-417385275/recent-activity/all/',
    'https://github.com/Ybrittoom?tab=repositories',
    'https://www.youtube.com/watch?v=5phnZexAvZM',
    'https://web.whatsapp.com/'
]

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


// crawler que recebe uma URL e rotarna os links encontrados
async function crawler(url) {
    try {
        const response = await axios.get(url)
        const html = response.data
        const $ = cheerio.load(html)

        const links = []

        $('a').each((index, element) => {
            const texto = $(element).text()
            const href = $(element).attr('href')

            if (href) {
                links.push({
                    site: url,
                    texto: texto.trim(),
                    href: href
                })
            }
        })


        console.log(`✅ ${links.length} links encontrados em ${url}`)
        return links

    } catch (error) {
        console.log(`❌ Erro ao acessar ${url}:`, error.message)
        return []
    }
}


//funçao principal
async function iniciarCrawler() {
    const todos_os_links = []

    for (let url of sites) {
        console.log(`\n🌐 Visitando: ${url}`)

        const links = await crawler(url)
        todos_os_links.push(...links)

        await delay(2000)
    }

    // Salva todos os dados encontrados
    fs.writeFileSync('dados.json', JSON.stringify(todos_os_links, null, 2), 'utf-8')
    console.log('\n✅ Todos os dados foram salvos em dados.json')
}

iniciarCrawler()