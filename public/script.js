//script.js
function acessarDados() {
    mostrarDados()
}

function fecharDados() {
    const divConteudo = document.getElementById('conteudo')
    divConteudo.textContent = ''
}

function enviarUrl() {

    const input = document.getElementById('novaUrl')
    const url = input.value.trim()

    if (!url) {
        alert("Por favor, insira uma url valida")
        return
    }

    fetch('/adicionar-site', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensagem || 'URl adicionada com sucesso')

        //aqui vai recarregar os novos dados(urls) 
        fetch('/dados.json')
            .then(res => res.json())
            .then(dados => {
                todosOsDados = dados
                const seletor = document.getElementById('seletorDeSites')
                seletor.innerHTML = '<option value = "">Escolha um site</option>' //limpar o select
                preencherSeletorDeSites()
            })
    })
    .catch(err => {
        console.error(err)
        alert('Erro ao adicionar URL:')
    })
}

function mostrarDados() {
    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            const conteudo = document.getElementById('conteudo')
            conteudo.innerHTML = ''
            const porSite = {}

            // Agrupar links por site
            dados.forEach(item => {
                if (!porSite[item.site]) porSite[item.site] = []
                porSite[item.site].push(item)
            });

            // Criar blocos por site 
            Object.entries(porSite).forEach(([site, links]) => {
                const bloco = document.createElement('div')
                bloco.className = 'site'

                const titulo = document.createElement('h2')
                titulo.innerText = site
                bloco.appendChild(titulo)

                links.forEach(link => {
                    const linha = document.createElement('div')
                    linha.className = 'link'

                    if (link.tipo === 'img') { //verifica se é imagem ou se link no site visitado bb
                        const img = document.createElement('img')
                        img.src = link.href;
                        img.alt = link.texto || 'Imagem';
                        img.style.maxWidth = '200px';
                        img.style.marginTop = '8px';
                        linha.appendChild(img);
                    } else {
                        const a = document.createElement('a');
                        a.href = link.href;
                        a.target = '_blank';
                        a.innerText = link.texto || link.href;
                        linha.appendChild(a);
                    }

                    bloco.appendChild(linha)
                })

                conteudo.appendChild(bloco)
            })
        })
        .catch(err => {
            document.getElementById('conteudo').innerHTML = 'Erro ao carregar os dados'
            console.error(err)
        })
}

let todosOsDados = []

//carregar os dados quando o usuario acessar a pagina
window.addEventListener('DOMContentLoaded', () => {
    fetch('/dados.json')
        .then(res => res.json())
        .then(dados => {
            todosOsDados = dados
            preencherSeletorDeSites()
        })
        .catch(err => {
            console.error(err)
        })
})

function preencherSeletorDeSites() {
    const seletorLinks = document.getElementById('seletorDeSites')
    const seletorImagens = document.getElementById('seletorDeImagens')

    const sitesUnicos = [...new Set(todosOsDados.map(item => item.site))]

    seletorLinks.innerHTML = '<option value="">Escolha um site</option>'
    seletorImagens.innerHTML = '<option value="">Escolha um site</option>'

    sitesUnicos.forEach(site => {
        const option1 = document.createElement('option')
        option1.value = site
        option1.innerText = site
        seletorLinks.appendChild(option1)

        const option2 = option1.cloneNode(true)
        seletorImagens.appendChild(option2)
    })
}

function mostrarLinksPorSite() {
    const siteSelecionado = document.getElementById('seletorDeSites').value
    const lista = document.getElementById('linksColetados')
    lista.innerHTML = ''

    if (!siteSelecionado) return

    const links = todosOsDados.filter(item => item.site === siteSelecionado)

    links.forEach(link =>{
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.href = link.href
        a.target = '_blank'
        a.innerText = link.texto || link.href
        li.appendChild(a)
        lista.appendChild(li) 
    })
}
function mostrarImagensPorSite() {
    const siteSelecionado = document.getElementById('seletorDeImagens').value
    const lista = document.getElementById('ImagensColetadas')
    lista.innerHTML = ''

    if (!siteSelecionado) return

    const imagens = todosOsDados.filter(item => item.site === siteSelecionado && item.tipo === 'img')

    imagens.forEach(img => {
        const li = document.createElement('li')
        const imagem = document.createElement('img')
        imagem.src = img.href
        imagem.alt = img.texto || 'Imagem'
        imagem.style.maxWidth = '200px'
        imagem.style.marginBottom = '10px'
        li.appendChild(imagem)
        lista.appendChild(li)
    })
}   



//SETOR DO MODAL//

document.getElementById('abrirModal').onclick = () => {
    document.getElementById('modal').style.display = 'block'
    carregarSites()
}

document.getElementById('fecharModal').onclick = () => {
    document.getElementById('modal').style.display = 'none'
}

document.getElementById("filtroSites").oninput = function () {
    const filtro = this.value.toLowerCase()
    const itens = document.querySelectorAll('#listaSites li')
    itens.forEach(item => {
        const texto = item.textContent.toLowerCase()
        item.style.display = texto.includes(filtro) ? 'flex' : 'none'
    })
}

async function carregarSites() {
    const res = await fetch('/dados.json')
    const dados = await res.json()

    const sitesUnicos = [...new Set(dados.map(d => d.site))]

    const lista = document.getElementById('listaSites')
    lista.innerHTML = '' //limpa antes de popular

    sitesUnicos.forEach(site => {
        const li = document.createElement('li')
        li.innerHTML = `
            <span>${site}</span>
            <button onclick="excluirSite('${site}')">Excluir</button>
        `;
        lista.appendChild(li)
    
    })

}

async function excluirSite(site) {
    if (!confirm(`tem certeza que deseja excluir todos os dados do site:\n${site} (OS DADOS FICARAO SALVOS EM LOG)?`)) return

    const res = await fetch('/excluir-site', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ site })
    })

    if (res.ok) {
        alert('Site excluido com sucesso!')
        carregarSites()//atualiza a lista
    } else {
        alert('Erro ao excluir site')
    }
}