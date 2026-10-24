# Análise de aplicativo

Esta pasta é permanente e serve como área de trabalho temporária para análises de bugs e melhorias deste aplicativo.

## Fluxo de análise

1. O Codex analisa o problema no contexto do aplicativo e registra aqui a solicitação, as evidências relevantes e seu parecer.
2. O Claude consulta este material, faz uma análise independente e registra seu parecer nesta pasta.
3. O Codex compara os dois pareceres e registra uma proposta final para revisão do usuário.
4. O usuário aprova ou solicita ajustes. A aprovação da proposta não autoriza publicação automática.
5. Depois que a alteração aprovada for implementada e conferida, remova os arquivos e subpastas temporários desta pasta. Mantenha este README.

## Organização sugerida para cada rodada

Crie uma subpasta por análise, com um identificador curto e descritivo, por exemplo:

```text
analise-de-aplicativo/
  README.md
  bug-login-2026-10/
    solicitacao.md
    evidencias/
    analise-codex.md
    analise-claude.md
    proposta-final.md
```

## Cuidados

- Inclua somente arquivos e trechos necessários para entender o problema.
- Não copie chaves, tokens, senhas, arquivos .env, dados pessoais ou dados reais de clientes.
- Registre caminhos, mensagens de erro, passos para reproduzir e resultados observados.
- Preserve o material da rodada até a alteração aprovada estar implementada e conferida.
- Ao encerrar a rodada, apague o conteúdo temporário e deixe esta pasta somente com este README.
- Não publique nem faça merge de alterações sem aprovação explícita do usuário.
