CRAWLER(URL)‼️⚠️
INÍCIO
  ↓
Recebe uma URL
  ↓
Tenta acessar a página com axios.get()
  ↓
Se erro:
  → Exibe erro no console e RETORNA null
  ↓
Carrega HTML com cheerio
  ↓
Extrai o <title>
  ↓
Percorre todas as tags <a>
  ↓
  Para cada <a>:
    → Captura texto e href
    → Salva no array `links`
  ↓
Percorre todas as tags <img>
  ↓
  Para cada <img>:
    → Ajusta URL da imagem
    → Cria nome de arquivo único
    → Chama `baixarImagem()`
    → Salva no array de imagens
  ↓
Aguarda baixar todas as imagens
  ↓
Combina links + imagens
  ↓
Verifica se arquivo `dados.json` existe
  ↓
Se sim, carrega dados existentes
  ↓
Adiciona novos dados e salva no `dados.json`
  ↓
RETORNA objeto com título, site, total e links
//////////////////////////////////////////////////////////////


---------------------------------
INICIARCRAWLER()‼️⚠️
INÍCIO
  ↓
Cria array `todos_os_links`
  ↓
Para cada site na lista:
  ↓
  Exibe "Visitando"
  ↓
  Chama `crawler(url)`
  ↓
  Se resultado for nulo:
    → Exibe aviso e continua próximo site
  ↓
  Adiciona links ao `todos_os_links`
  ↓
  Gera nome de log com `getDataHoraAtual()`
  ↓
  Salva resultado em arquivo de log (pasta logs)
  ↓
  Aguarda 2 segundos
↓
Remove links duplicados com Set
↓
Salva links únicos em `dados.json`
↓
Exibe "✅ Dados salvos"
/////////////////////////////////////////////////////////////////


-----------------------------------------
BAIXARIMAGENS(URLIMAGEM, NOMEARQUIVO)‼️⚠️
INÍCIO
  ↓
Define caminho do arquivo local
  ↓
Tenta baixar a imagem com axios (modo stream)
  ↓
  Se sucesso:
    → Cria stream de escrita para salvar imagem
    → Aguarda stream finalizar
    → RETORNA caminho "/imagens/nomeArquivo"
  ↓
  Se erro:
    → Exibe erro no console
    → Exibe status e resposta se disponíveis
    → Não retorna nada (undefined)
////////////////////////////////////////////////////


--------------------------
getDataHoraAtual()‼️⚠️
INÍCIO
  ↓
Cria objeto Date com hora atual
  ↓
Extrai ano, mês, dia, hora e minuto
  ↓
Formata:
  → formatoArquivo: "AAAA-MM-DD_HH-MM"
  → formatoHumano: "DD/MM/AAAA HH:MM"
  ↓
RETORNA objeto com os dois formatos
