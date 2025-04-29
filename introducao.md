dependencias {
    axios,
    cheerio,
    node,
}

Etapas {
    criando um crawler simples,
    Salvando os dados em um arquivo JSON
    crawler com delay para evitar bloqueio
    vistar varios sites,
    criar um frontend,
    salvando separadamente os links em arquivos json dentro de logs
    
}

O QUE EU TENHO QUE FAZER AMANHA {
    resolver a estilizaçao e o script.js
}


arquivo de index.js para caso precisar:
    //index.js
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const site = []

function getDataHoraAtual() {
    const agora = new Date()
    const ano = agora.getFullYear()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')
    const horas = String(agora.getHours()).padStart(2, '0')
    const minutos = String(agora.getMinutes()).padStart(2, '0')

    return {
        formatoArquivo: `${ano}-${mes}-${dia}_${horas}-${minutos}`,
        formatoHumano: `${dia}/${mes}/${ano} ${horas}:${minutos}`
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const pastaLogs = path.join(__dirname, 'logs')
if (!fs.existsSync(pastaLogs)) {
    fs.mkdirSync(pastaLogs)
    console.log('Pasta de logs criada!!')
}

async function crawler(url) {
    try {
        const response = await axios.get(url)
        const html = response.data
        const $ = cheerio.load(html)

        const title = $('title').text().trim()
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

        const resultado = {
            titulo: title,
            site: url,
            totalLinks: links.length,
            links: links
        }

        console.log(`✅ ${links.length} links encontrados em ${url}`)
        return resultado

    } catch (error) {
        console.log(`❌ Erro ao acessar ${url}:`, error.message)
        return null
    }
}

async function iniciarCrawler() {
    const todos_os_links = []

    for (let url of sites) {
        console.log(`\n🌐 Visitando: ${url}`)

        const resultado = await crawler(url)

        if (!resultado || !resultado.links) {
            console.log(`⚠️ Nenhum dado retornado de ${url}. Pulando.`)
            continue
        }

        // Adiciona os links ao array principal
        todos_os_links.push(...resultado.links)

        //cria o nome do arquivo e salva dentro da pasta logs
        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)
        
        resultado.dataHoraLog = dataHora.formatoHumano

        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')

        console.log(`📄 Log salvo em: ${caminhoCompleto}`)

        // Espera 2 segundos para evitar bloqueios
        await delay(2000)
    }

    const linksUnicos = []
    const setDeLinks = new Set()

    for (let link of todos_os_links) {
        const chave = `${link.site}|${link.href}` //identificador unico
        if (!setDeLinks.has(chave)) {
            setDeLinks.add(chave)
            linksUnicos.push(link)
        }
    }

    // Salva todos os dados encontrados juntos
    fs.writeFileSync('dados.json', JSON.stringify(todos_os_links, null, 2), 'utf-8')
    console.log('\n✅ Todos os dados foram salvos em dados.json')
}

iniciarCrawler()
