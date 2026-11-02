# CONTEXTO CODEX - CleanBoost

Este arquivo e a memoria curta do app para abrir tarefas novas sem depender de conversas antigas do Codex. Manter abaixo de 10.000 caracteres e atualizar sempre que mudar licenca, download, updater, release ou fluxo principal.

## Identidade
- Produto: CleanBoost
- Pasta local principal: manter conforme projeto local do app
- Repositorio GitHub: https://github.com/GhuzzBeatz/cleanboost
- package.name: cleanboost
- package.version atual: 1.0.5
- build.productName: CleanBoost
- build.appId: com.ghzplugin.cleanboost
- ID publico de download/update: cleanboost
- Objetivo: Limpeza/otimizacao de PC com licenca online via backend PHP.

## Regras que nao podem quebrar
- Nao trocar o ID publico `cleanboost` depois de publicado; ele e usado pelo HTML de venda, pelo updater do app e pelo endpoint central de download.
- O manifest de atualizacao deve continuar em `https://ghzplugin.com.br/api/ghz-update.php?app=cleanboost`.
- O download direto deve continuar em `https://ghzplugin.com.br/api/ghz-update.php?app=cleanboost&download=1`.
- O release do GitHub precisa conter o instalador esperado pelo roteador de downloads: assetPrefix: CleanBoost.Setup..
- A pagina publica de download, quando existir, deve permanecer em `https://ghzplugin.com.br/baixar/cleanboost.html` ou manter redirect/compatibilidade.
- Nunca versionar tokens, service role keys, chaves privadas, senhas, admin token, `GITHUB_RELEASE_TOKEN` ou `.env` real. Use somente nomes das variaveis e deixe valores no servidor PHP/GitHub Secrets.
- Antes de mexer em auto-update, instalador ou release, conferir `package.json`, `electron-builder`, `main.js` e `update-manifest.json` se existir.
- Manter padrao visual GHZ: app Electron sem barra nativa do Windows quando esse padrao ja estiver aplicado, barra superior/rodape de suporte GHZ, links de site/suporte e aba/tela de atualizacao.
- Preferir alterar comportamento em codigo-fonte e testes, nunca editar arquivos gerados em `dist`, `release`, `win-unpacked` ou backups.

## Licenca e seguranca
- Licenca validada online pelo backend PHP: https://ghzplugin.com.br/api/ghz-license.php. Administracao dos dados via phpMyAdmin.
- Preservar prefixo, formato e compatibilidade com licencas ja emitidas.
- Nunca incluir credenciais do servidor ou banco de dados no app.

## Downloads e releases
- GHZ update API: https://ghzplugin.com.br/api/ghz-update.php
- Manifest: https://ghzplugin.com.br/api/ghz-update.php?app=cleanboost
- Download direto: https://ghzplugin.com.br/api/ghz-update.php?app=cleanboost&download=1
- Versao publicada no manifest local: 1.0.5
- Repo release usado pelo roteador: https://github.com/GhuzzBeatz/cleanboost/releases
- Asset esperado pelo roteador de downloads: CleanBoost.Setup.exe
- Se o repositorio for privado, o token de GitHub fica apenas como secret do servidor PHP/GitHub Actions, nunca dentro do app.
- Notas de release nao devem vazar URL interna, token ou link temporario.

## Stack e pontos de entrada
- Stack detectada: Electron + HTML/CSS/JS, empacotamento por electron-builder quando package.json tiver build.
- Entrada declarada no package.json: main.js
- Scripts npm: start, build
- Telas ficam normalmente em index.html, pages/, components/, js/, css/ e assets/.
- Base de ajuda IA, quando existir, fica em docs/ai/.
- Backend PHP externo em https://ghzplugin.com.br/api/; codigo PHP ausente nesta copia.
- Testes, quando existirem, ficam em tests/; validar pelo script npm test ou validacao direcionada antes de release.

## Fluxo recomendado para uma tarefa nova
1. Leia este arquivo primeiro.
2. Leia `package.json`, `main.js`, `preload.js` e arquivos da tela afetada.
3. Verifique se a mudanca toca licenca, update, download, backend PHP ou release.
4. Se tocar, confirme IDs, endpoints e asset esperado antes de editar.
5. Rode testes ou ao menos validacao direcionada e registre no PR/commit o que foi conferido.

## Referencia visual
- Interface adaptada de GHZ_APP_STANDARD, commit 680e7d950910fa39564b521ab1f7d00fed9c2e83 (copia local limpa _GHZ_APP_STANDARD).
- CSS base em css/app-standard.css; adaptacoes para as telas iframe e identidade vermelha em css/cleanboost-standard.css.
- Componentes GHZ de navegacao, ajuda offline e controles de janela em components/. Textos de cada aba em js/page-help-content.js.
- Tema compartilhado entre a janela e os iframes por js/standard-theme.js. Licenciamento online PHP preservado; nenhum servico de nuvem do template foi importado.
