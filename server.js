//server.js

//modulos e configuraçoes iniciais
const express = require('express')
const app = express()
const port = 3001
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')
const chalk = require('chalk')

//Middleware e Arquivos Estáticos
app.use(express.static('public')) //permite acessar arquivos da pasta public
app.use(express.json()) //permite ler req.body em JSON

//Envia o conteúdo do arquivo dados.json com todos os links salvos.
app.get('/dados.json', (req, res) => {
    res.sendFile(path.join(__dirname + '/dados.json'))
})


const sites = []

//Criando a pasta imagens(dentro de public) caso nao exista ela bb
const pastaImagens = path.join(__dirname, 'public', 'imagens')
if (!fs.existsSync(pastaImagens)) {
    fs.mkdirSync(pastaImagens, { recursive: true })
}

//rota principal

app.post('/adicionar-site', async (req, res) => {
    //valida se a URL foi enviada
    const { url } = req.body
    if (!url) {
        return res.status(400).json({ mensagem: 'URL inválida' })
    }

    // Carregar o array atual de sites
    try {
        console.log(`🌐 Iniciando crawler para: ${url}`)
        const resultado = await crawler(url)

        if (!resultado || !resultado.links || resultado.links.length === 0) {
            return res.status(500).json({ mensagem: 'Nenhum link encontrado na página' })
        }

        //le os dados ja salvos no arquivo dados.json
        let dados = []
        if (fs.existsSync('dados.json')) {
            dados = JSON.parse(fs.readFileSync('dados.json', 'utf-8'))
        }

        // Adiciona novos links no dados.json
        dados.push(...resultado.links)

        // Remove links duplicados
        const setDeLinks = new Set() //usa um set pra eliminar duplicadas com base no site+href
        const linksUnicos = []
        for (let link of dados) {
            const chave = `${link.site}|${link.href}`
            if (!setDeLinks.has(chave)) {
                setDeLinks.add(chave)
                linksUnicos.push(link)
            }
        }

        //atualiza os dados.json
        fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8')
        console.log(chalk.green('✅ dados.json atualizado'))

        // Salva o log dessa página individualmente
        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)

        resultado.dataHoraLog = dataHora.formatoHumano

        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')
        console.log(`📄 Log salvo em: ${caminhoCompleto}`)

        res.json({ message: 'URL escaneada e dados adicionados com sucesso' })

    } catch (erro) {
        console.error(chalk.red('Erro ao ler dados.json:', erro))
    }
})

function getDataHoraAtual() {
    const agora = new Date() //cria um objeto date com data e horas atuais
    const ano = agora.getFullYear() //pega os componentes de data/hora
    const mes = String(agora.getMonth() + 1).padStart(2, '0')//getMonth() retorna de 0 a 11, por isso soma 1. padStart(2, '0') garante que fique com dois dígitos (ex: 05 em vez de 5).
    //seguem o mesmo padrao: garantir que tudo tenham dois digitos
    const dia = String(agora.getDate()).padStart(2, '0')
    const horas = String(agora.getHours()).padStart(2, '0')
    const minutos = String(agora.getMinutes()).padStart(2, '0')


    return {
        //Fica algo como 2025-05-02_14-37
        //Esse formato é seguro para nome de arquivos, sem caracteres proibidos como : ou /.
        formatoArquivo: `${ano}-${mes}-${dia}_${horas}-${minutos}`,
        //Fica como 02/05/2025 14:37
        //Bom para logs e exibição na tela.
        formatoHumano: `${dia}/${mes}/${ano} ${horas}:${minutos}`
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const pastaLogs = path.join(__dirname, 'logs')
if (!fs.existsSync(pastaLogs)) {
    fs.mkdirSync(pastaLogs)
    console.log(chalk.green('Pasta de logs criada'))
}

async function crawler(url) {
    /*Acessa a URL
      Extrai o titulo da pagina e todos os links<a>
      Extrai e baixa todas as imagens <img>
      Junta tudo e retorna um objeto com os dados*/

      //tenta acessar a pagina
    try {
        const response = await axios.get(url)//faz uma requisiçao GET para obter o conteudo HTML
        const html = response.data
        const $ = cheerio.load(html)//carrega o html para poder manipular com JQUERY-LIKE

        //pega o titulo da pagina
        const title = $('title').text().trim()//extrai o conteudo <title> e remove os espços extras

        //extrai todos os links
        const links = [] 
        $('a').each((index, element) => {
            const texto = $(element).text()
            const href = $(element).attr('href')
            /*para cada tag <a>, coleta o texto visivel e o atributo href
              adiciona no array links, com:
                site: URL base,
                texto: conteudo dentro do link,
                href: o destino do link*/
            if (href) {
                links.push({
                    site: url,
                    texto: texto.trim(),
                    href: href
                })
            }
        })

        //extrai e baixa todas as imagens
       const imagem = $('img').map(async (_, el) => {
        let src = $(el).attr('src') //percorre todas as tags <img> e pega o src
        if (!src) return null //se src estiver vazio, ignora

        //resolve o caminho da imagem
        const dominio = new URL(url).origin
        if (src.startsWith('/')) src = dominio + src // se começar com '/', junta com a origem
        else if (!src.startsWith('http')) src = `${dominio}/${src}` //se for relativo sem http, tambem ajusta

        //define o nome e extensao da imagem
        const extensao = path.extname(new URL(src).pathname).split('?')[0] || '.jpg' //decobre a extensao da imagem(ex. .jpg,png)
        const nomeArquivo = `${Date.now()}-${Math.floor(Math.random() * 10000)}${extensao}` //cria um nome de arquivo unico com timestamp + numero aleatorio
        
        //baixa a imagem e salva
        const caminhoLocal = await baixarImagem(src, nomeArquivo)//usa a funçao baixarImagem() para fazer o download e salvar
        if (caminhoLocal) { //retorna um objeto com dados da imagem baixada caso de certo
            return { 
                site: url,
                tipo: 'img',
                href: caminhoLocal, 
                text: ''
            }
        }
        return null
       }).get()

       //aguarda todas as imagens baixarem
       const imagensBaixadas = (await Promise.all(imagem)).filter(Boolean)

       //combina links e imagens
       const todos = [...links, ...imagensBaixadas]

       //atualiza o arquivo dados.json
       const caminhoJSON = path.join(__dirname, 'dados.json') //le o arquivo atual
       let dadosExistentes = []
       if (fs.existsSync(caminhoJSON)) {
        const raw = fs.readFileSync(caminhoJSON, 'utf8')
            dadosExistentes = JSON.parse(raw)
       }
       dadosExistentes.push(...todos)
       fs.writeFileSync(caminhoJSON, JSON.stringify(dadosExistentes, null, 2))

        //retorna os resultados
        const resultado = {
            titulo: title,
            site: url,
            totalLinks: todos.length,
            links: todos
        }
        
        console.log(`✅ ${links.length} links encontrados em ${url}`)
        return resultado
    } catch (error) { //tratamento de erro
        console.log(chalk.red(`Erro ao acessar ${url}:`, error.message))
        return null
    }
}

async function iniciarCrawler() {
    const todos_os_links = [] //cria um array para ganhar todos os links

    //percorre cada URL da lista
    for (let url of sites) {
        //para cada site da lista exibe no terminal que esta visitando
        console.log(`\n🌐 Visitando: ${url}`)

        //chama o crawler()
        const resultado = await crawler(url)

        //caso o site nao rernar algo, ele pula para o proximo ou encerra
        if (!resultado || !resultado.links) {
            console.log(chalk.yellow(`⚠️ Nenhum dado retornado de ${url}. Pulando.`))
            continue
        }

        // Adiciona os daos no array principal
        todos_os_links.push(...resultado.links)

        //cria o nome do arquivo e salva dentro da pasta logs
        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora.formatoArquivo}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)

        resultado.dataHoraLog = dataHora.formatoHumano

        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')

        console.log(`📄 Log salvo em: ${caminhoCompleto}`)

        // Espera 2 segundos para evitar bloqueios
        await delay(2000)
    }

    //remove linksUnicos
    const linksUnicos = []
    const setDeLinks = new Set()//cria um set para garantir que cada link seja unico

    for (let link of todos_os_links) {
        const chave = `${link.site}|${link.href}` //identificador unico
        if (!setDeLinks.has(chave)) {
            setDeLinks.add(chave)
            linksUnicos.push(link)
        }
    }

    // Salva todos os links juntos
    fs.writeFileSync('dados.json', JSON.stringify(linksUnicos, null, 2), 'utf-8')
    console.log(chalk.green('\n✅ Todos os dados foram salvos em dados.json'))
}


async function baixarImagem(urlImagem, nomeArquivo) {
    //define o caminho completo da imagem no disco
    const caminhoCompleto = path.join(pastaImagens, nomeArquivo)

    try {
        //faz a requisiçao http da imagem
        const response = await axios({//usa o axios com reponseType: 'stream para baixar a imagem como um fluxo(stream)
            method: 'GET',
            url: urlImagem,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        })

        //salva a imagem no disco usando stream
        await new Promise((resolve, reject) => {//A Promise é usada para esperar a conclusão da escrita no arquivo:
            const writer = fs.createWriteStream(caminhoCompleto) //cria um write para escrever a imagem no dicos
            response.data.pipe(writer)// liga a resposta da requisição direto na gravação do arquivo.
            writer.on('finish', resolve)//finish resolve a promessa (concluído com sucesso)
            writer.on('error', reject)//error rejeita a promessa (ocorreu erro ao salvar)
        })
        //Retorna o caminho relativo para uso futuro
        return `/imagens/${nomeArquivo}`
    } catch (error) { //tratamento de erro
        console.error(chalk.red(`Erro ao baixar a imagem ${urlImagem}: ${error.message}`))//usa chalk para destacar o erro e melhor visibilidade 
        if (error.response) {
            console.error(`Status: ${error.response.status}`)
            console.error(`Resposta: ${error.response.data}`)
        }
    }
}

app.post('/excluir-site', (req, res) => {
    const { site } = req.body;

    if (!site) return res.status(400).json({ erro: 'Site não informado' });
  
    const caminho = path.join(__dirname, 'dados.json');
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });

    const dados = JSON.parse(fs.readFileSync(caminho, 'utf-8'))
    const novosDados = dados.filter(d => d.site !== site)

    fs.writeFileSync(caminho, JSON.stringify(novosDados, null, 2), 'utf-8')
    res.json({ mensagem: 'Site excluido com sucesso' })
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})