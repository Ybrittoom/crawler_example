const express = require('express')
const app = express()
const port = 3001
const path = require('path')

app.use(express.static('public'))

app.get('/dados.json', (req, res) => {
    res.sendFile(path.join(__dirname + '/dados.json'))
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})