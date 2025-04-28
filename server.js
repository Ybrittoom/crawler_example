//server.js
const express = require('express')
const app = express()
const port = 3001
const path = require('path')
const fs = require('fs')

app.use(express.static('public'))

app.get('/dados.json', (req, res) => {
    res.sendFile(path.join(__dirname + '/dados.json'))
})

app.use(express.json())

const sites = ['https://myaccount.mercadolivre.com.br/bookmarks/list#nav-header',
    'https://www.google.com/search?q=jogos&oq=j&gs_lcrp=EgZjaHJvbWUqDQgCEAAYgwEYsQMYgAQyBggAEEUYOTIQCAEQLhjHARixAxjRAxiABDINCAIQABiDARixAxiABDINCAMQABiDARixAxiABDIHCAQQABiABDIHCAUQABiABDIKCAYQABixAxiABDINCAcQLhiDARixAxiABDIHCAgQABiPAjIHCAkQABiPAtIBCTE1NDEwajBqN6gCALACAA&sourceid=chrome&ie=UTF-8',
    'https://www.google.com/search?gs_ssp=eJzj4tDP1TcwzjYuMmD0YktOLEvMyQcALh4FSA&q=cavalo&oq=cava&gs_lcrp=EgZjaHJvbWUqBwgBEC4YgAQyCQgAEEUYORiABDIHCAEQLhiABDIVCAIQLhgKGIMBGMcBGLEDGNEDGIAEMgcIAxAAGIAEMgcIBBAuGIAEMgcIBRAuGIAEMgcIBhAAGIAEMgcIBxAAGIAEMgcICBAAGI8CMgcICRAAGI8C0gEIMjk3M2owajeoAgCwAgA&sourceid=chrome&ie=UTF-8'
]

app.post('/adicionar-site', async(req, res) => {
    const { url } = req.body

    if (!url || !url.startsWith('http')) {
        return res.status(400).json({ message: 'Url invalida'})
    }

    if (sites.includes(url)) {
        return res.status(200).json({ message: "url ja esta na lista"})
    }

    sites.push(url) 
    console.log(`nova Ulr adicionada: ${url}`)

    //roda crawler individualmente para essa url
    const resultado = await crawler(url)

    if (resultado) {
        const dataHora = getDataHoraAtual()
        const nomeArquivo = `log_${new URL(url).hostname}_${dataHora}.json`
        const caminhoCompleto = path.join(pastaLogs, nomeArquivo)

        resultado.dataHoraLog = dataHora.formatoHumano

        fs.writeFileSync(caminhoCompleto, JSON.stringify(resultado, null, 2), 'utf-8')
        fs.writeFileSync('dados.json', JSON.stringify(resultado.links, null, 2), 'utf-8')
    }
    res.json({ message: 'Crawler executado com sucesso para nova URL' })
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})