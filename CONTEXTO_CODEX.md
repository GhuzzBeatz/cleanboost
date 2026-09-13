# CONTEXTO CODEX - CleanBoost

Este arquivo e a memoria curta do app para abrir tarefas novas sem depender de conversas antigas do Codex. Manter abaixo de 10.000 caracteres e atualizar sempre que mudar licenca, download, updater, release ou fluxo principal.

## Identidade
- Produto: CleanBoost
- Pasta local principal: manter conforme projeto local do app
- Repositorio GitHub: https://github.com/GhuzzBeatz/cleanboost
- package.name: cleanboost
- package.version atual: 1.0.2
- build.productName: CleanBoost
- build.appId: com.ghzplugin.cleanboost
- ID publico de download/update: cleanboost
- Objetivo: Limpeza/otimizacao de PC com licenca local.

## Regras que nao podem quebrar
- Nao trocar o ID publico `cleanboost` depois de publicado; ele e usado pelo HTML de venda, pelo updater do app e pelo endpoint central de download.
- O manifest de atualizacao deve continuar em `https://wpkaaxarresldcstaatj.supabase.co/functions/v1/ghz-app-downloads?app=cleanboost`.
- O download direto deve continuar em `https://wpkaaxarresldcstaatj.supabase.co/functions/v1/ghz-app-downloads?app=cleanboost&download=1`.
- O release do GitHub precisa conter o instalador esperado pelo roteador de downloads: assetPrefix: CleanBoost.Setup..
- A pagina publica de download, quando existir, deve permanecer em `https://ghzplugin.com.br/baixar/cleanboost.html` ou manter redirect/compatibilidade.
- Nunca versionar tokens, service role keys, chaves privadas, senhas, admin token, `GITHUB_RELEASE_TOKEN` ou `.env` real. Use somente nomes das variaveis e deixe valores no Supabase/GitHub Secrets.
- Antes de mexer em auto-update, instalador ou release, conferir `package.json`, `electron-builder`, `main.js` e `update-manifest.json` se existir.
- Manter padrao visual GHZ: app Electron sem barra nativa do Windows quando esse padrao ja estiver aplicado, barra superior/rodape de suporte GHZ, links de site/suporte e aba/tela de atualizacao.
- Preferir alterar comportamento em codigo-fonte e testes, nunca editar arquivos gerados em `dist`, `release`, `win-unpacked` ou backups.

## Licenca e seguranca
- Licenca local/offline: preservar prefixo e algoritmo depois de vender, porque chaves antigas dependem disso.
- Nao trocar salt, multiplicador, prefixo ou formato sem criar compatibilidade com licencas ja emitidas.
- Se migrar para Supabase no futuro, manter fallback/periodo de transicao para clientes existentes.

## Downloads e releases
- GHZ update API: https://ghzplugin.com.br/api/ghz-update.php
- Manifest: https://ghzplugin.com.br/api/ghz-update.php?app=cleanboost
- Download direto: https://ghzplugin.com.br/api/ghz-update.php?app=cleanboost&download=1
- Versao publicada no manifest local: 1.0.2
- Repo release usado pelo roteador: https://github.com/GhuzzBeatz/cleanboost/releases
- Asset esperado pelo roteador de downloads: CleanBoost.Setup.exe
- Se o repositorio for privado, o token de GitHub fica apenas como secret da Edge Function/GitHub Actions, nunca dentro do app.
- Notas de release nao devem vazar URL interna, token ou link temporario.

## Stack e pontos de entrada
- Stack detectada: Electron + HTML/CSS/JS, empacotamento por electron-builder quando package.json tiver build.
- Entrada declarada no package.json: main.js
- Scripts npm: start, build
- Telas ficam normalmente em index.html, pages/, components/, js/, css/ e assets/.
- Base de ajuda IA, quando existir, fica em docs/ai/.
- Backend/edge functions, quando existir, fica em cloud/ ou supabase/.
- Testes, quando existirem, ficam em tests/; validar pelo script npm test ou validacao direcionada antes de release.

## Fluxo recomendado para uma tarefa nova
1. Leia este arquivo primeiro.
2. Leia `package.json`, `main.js`, `preload.js` e arquivos da tela afetada.
3. Verifique se a mudanca toca licenca, update, download, Supabase ou release.
4. Se tocar, confirme IDs, endpoints e asset esperado antes de editar.
5. Rode testes ou ao menos validacao direcionada e registre no PR/commit o que foi conferido.
