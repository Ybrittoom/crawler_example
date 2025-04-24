function acessarDados() {
    mostrarDados()
}

function fecharDados() {
    const divConteudo = document.getElementById('conteudo')
    divConteudo.textContent = ''
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

                    const a = document.createElement('a')
                    a.href = link.href
                    a.target = '_blank'
                    a.innerText = link.texto || link.href

                    linha.appendChild(a)
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
