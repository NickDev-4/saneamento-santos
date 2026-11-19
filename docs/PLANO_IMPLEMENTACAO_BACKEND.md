# Plano de implementação do backend

Este documento organiza a entrega da API Java/Spring e define os fluxos de negócio, as rotas e os critérios de conclusão. Ele complementa o [contrato da API](CONTRATO_API_PROPOSTO.md) e os serviços HTTP existentes no front-end. As rotas listadas são o contrato-alvo; o estado real de implementação é registrado na seção final.

## 1. Objetivo e decisões de base

- Java 17, Spring Boot, Spring Web MVC, Spring Security, Bean Validation e MongoDB.
- Prefixo `/api/v1` para recursos. A rota operacional `/actuator/health` pode permanecer separada e restrita conforme o ambiente.
- Sessão de servidor com cookie `HttpOnly`; perfil carregado da sessão, nunca aceito como autoridade vindo do corpo da requisição.
- Proteção CSRF para operações com estado. Em produção, cookies `Secure` e `SameSite`; CORS, se necessário, somente para origens explicitamente permitidas.
- DTOs distintos para respostas públicas, do cidadão e da operação. Não devolver documentos Mongo diretamente.
- Datas ISO 8601 com offset; paginação iniciando em zero, tamanho padrão 20 e máximo 100.
- Credenciais, chaves e configuração de provedores apenas por variáveis/segredos do ambiente. Não usar contas pessoais em testes ou exemplos.
- Cada rota deve validar autenticação, perfil, propriedade do recurso, estado atual e dados de entrada no servidor.

### Organização sugerida

```text
backend/src/main/java/com/example/backend/
  api/
    auth/
    addresses/
    cases/
    notices/
    indicators/
    dto/
    exception/
  application/       # casos de uso e transações
  domain/            # entidades, enums e regras de transição
  infrastructure/
    persistence/     # documentos, repositórios e índices Mongo
    files/           # armazenamento e leitura autorizada de imagens
    geocoding/       # adaptador do provedor externo
  security/          # sessão, CSRF, autorização e configuração
```

Cada feature mantém controller fino, DTOs de entrada/saída, serviço de aplicação, validação e repositório. Regras de estado ficam no domínio/serviço, não em controllers nem em lógica do front-end.

## 2. Pipelines funcionais e rotas

Todas as rotas abaixo são relativas a `/api/v1`. `{id}` é um identificador opaco; filtros de lista usam paginação (`page`, `size`) e os filtros de negócio descritos no contrato.

### Pipeline A — inicialização e sessão segura

1. O serviço inicia com configuração externa, verifica a conexão/indicadores de dependências e expõe health check.
2. O cliente obtém um token CSRF antes de enviar formulários ou alterações.
3. O navegador mantém a sessão em cookie; o token CSRF é enviado no cabeçalho `X-XSRF-TOKEN`.

| Método e rota | Acesso | Uso |
|---|---|---|
| `GET /health` | Público | Verificar que a API está respondendo (`{ "status": "UP" }`). Não afirmar que o Mongo está pronto sem verificar essa dependência. |
| `GET /auth/csrf` | Público | Emitir/renovar o cookie `XSRF-TOKEN`; resposta sem dados de usuário. O front-end deve chamar esta rota antes da primeira operação mutável. |

`GET /auth/csrf` é uma adição necessária: o cliente HTTP lê o cookie, mas atualmente não tem uma chamada explícita de bootstrap CSRF. Ajustar o adapter para chamar essa rota na inicialização e renovar o token após login/logout quando necessário.

### Pipeline B — cadastro, login, perfil e recuperação

Cadastro público cria somente cidadão. Contas Sabesp/Prefeitura são provisionadas fora do cadastro público.

| Método e rota | Acesso | Uso |
|---|---|---|
| `POST /auth/cadastro` | Público + CSRF | Criar cidadão; validar nome, e-mail único normalizado e senha. Nunca aceitar perfil institucional. |
| `POST /auth/login` | Público + CSRF | Validar credenciais, renovar ID de sessão e retornar usuário autenticado. |
| `GET /auth/me` | Sessão | Restaurar o usuário atual; `401` significa sessão ausente/expirada. |
| `POST /auth/logout` | Sessão + CSRF | Invalidar a sessão no servidor e limpar cookies. |
| `PATCH /me` | Cidadão + CSRF | Alterar somente campos permitidos do próprio perfil (nome/telefone no adapter atual). |
| `POST /auth/recuperacao` | Público + CSRF | Iniciar recuperação; quando o canal estiver configurado, responder uniformemente sem enumeração de contas. |
| `POST /auth/redefinicao` | Público + CSRF | Validar token de uso único e expiração, trocar a senha e invalidar sessões existentes. |

**Sequência:** `GET /auth/csrf` → cadastro ou login → `GET /auth/me` ao restaurar a aplicação → `PATCH /me` conforme necessário → logout. Recuperação: `POST /auth/recuperacao` → entrega externa do token → `POST /auth/redefinicao` → login.

Senhas devem ser armazenadas com algoritmo adaptativo aprovado pelo Spring Security; jamais em texto puro ou log. Tokens de recuperação devem ser de uso único, armazenados de forma não reversível e expirar. Não confirmar a existência de conta na resposta de recuperação.

Até a escolha/configuração do serviço de entrega, ambas as rotas de recuperação respondem explicitamente `503 RECOVERY_DELIVERY_UNAVAILABLE`; não geram token nem afirmam que um e-mail foi enviado.

### Pipeline C — consulta pública, mapa e endereços

| Método e rota | Acesso | Uso |
|---|---|---|
| `GET /public/tipos-chamado` | Público | Retornar o catálogo de tipos ativo, sem inventar categorias no front-end. Se ainda não houver tipos provisionados, retorna lista vazia. |
| `GET /public/chamados` | Público | Lista paginada de chamados principais aprovados para publicação. Aceita filtros `status`, `tipoId`, `bairro`, `criadoDe`, `criadoAte`, `q`, `bbox`, `page` e `size`. |
| `GET /public/chamados/{id}` | Público | Detalhe público somente se publicado; nunca incluir dados pessoais ou observações internas. |
| `GET /enderecos/cep/{cep}` | Público, com limite de uso | Consultar CEP e retornar endereço/sugestão; falha externa não deve impedir preenchimento manual. |
| `POST /enderecos/geocodificacao` | Público + CSRF e limite de uso | Sugerir coordenadas para endereço; resultado não confirma por si só que o ponto está dentro da área atendida. |

**Sequência de descoberta:** carregar tipos → consultar lista/mapa com filtros e paginação → consultar detalhe público. `bbox` segue `minLongitude,minLatitude,maxLongitude,maxLatitude`; coordenadas ficam em campos nomeados. O backend valida faixas, datas, tamanho de página e limites da área de busca.

CEP usa ViaCEP com timeouts e tratamento explícito de indisponibilidade. Não expor chaves do provedor ao navegador. A rota de geocodificação responde explicitamente `503 GEOCODING_PROVIDER_UNAVAILABLE` até que o provedor seja escolhido e configurado.

### Pipeline D — abertura e acompanhamento do chamado pelo cidadão

| Método e rota | Acesso | Uso |
|---|---|---|
| `GET /me/chamados` | Cidadão | Lista todos os chamados do autor, inclusive privados, cancelados e vinculados. |
| `POST /chamados` | Cidadão + CSRF | Criar chamado em `multipart/form-data`: parte JSON `dados` e 1–3 arquivos `imagens`; retornar `201`, ID e protocolo. |
| `GET /chamados/{id}` | Autor ou Sabesp | Retornar detalhe apropriado ao perfil; o autor vê apenas o próprio registro. |
| `PATCH /chamados/{id}` | Autor + CSRF | Editar dados/anexos somente enquanto `RECEBIDO`; validar novamente propriedade, estado e imagens preservadas. |
| `POST /chamados/{id}/cancelamento` | Autor + CSRF | Cancelar somente o próprio chamado ainda `RECEBIDO`. |

Na criação, o servidor determina autor, protocolo, datas, `status=RECEBIDO` e `publicacao=PENDENTE`. Rejeitar campos de sistema enviados pelo cliente. Validar `tipoId`, endereço em Santos/SP, localização dentro do polígono GeoJSON oficial, descrição, data observada e arquivos. Os limites são de uma a três imagens JPEG/PNG/WebP, até 5 MiB por arquivo e 16 MiB por requisição multipart.

**Sequência:** CEP/geocodificação opcional → confirmação de localização pelo cidadão → `POST /chamados` → `GET /me/chamados` e `GET /chamados/{id}` para acompanhar. Alterações posteriores são recusadas com `409` se a triagem já começou. Não repetir automaticamente escrita após falha de rede.

A primeira versão não oferece exclusão física por `DELETE`: o cidadão pode cancelar enquanto `RECEBIDO`, e o registro permanece para auditoria e histórico.

### Pipeline E — triagem, publicação e atendimento pela Sabesp

| Método e rota | Acesso | Uso |
|---|---|---|
| `GET /operacao/chamados` | Sabesp | Fila paginada, inclusive chamados privados; filtros por status e demais campos operacionais acordados. |
| `GET /chamados/{id}` | Sabesp | Detalhe operacional com contato necessário ao atendimento. |
| `PATCH /chamados/{id}/publicacao` | Sabesp + CSRF | Aprovar/rejeitar publicação; rejeição exige justificativa. |
| `PATCH /chamados/{id}/status` | Sabesp + CSRF | Aplicar transição autorizada. Exigir justificativa para `ENCERRADO_SEM_ATENDIMENTO`; para resolução, multipart com `dados.comentarioPublico` obrigatório e `imagemResolucao` opcional. |
| `PATCH /chamados/{id}/previsao` | Sabesp + CSRF | Definir/alterar janela válida `inicio`/`fim`; ao agendar em `EM_ANALISE`, muda para `VISITA_AGENDADA` atomicamente. |
| `POST /chamados/{id}/atualizacoes-publicas` | Sabesp + CSRF | Registrar mensagem pública de acompanhamento. Enquanto o chamado estiver privado, mostrar somente aos perfis autorizados. |
| `GET /chamados/{id}/observacoes-internas` | Sabesp | Ler notas operacionais privadas. |
| `POST /chamados/{id}/observacoes-internas` | Sabesp + CSRF | Criar nota que nunca pode aparecer em DTO, busca ou rota pública. |
| `POST /chamados/{id}/vinculo` | Sabesp + CSRF | Vincular duplicata ativa a outro chamado principal ativo; exige justificativa. |

**Transições permitidas no primeiro corte:**

| Origem | Destino | Condição |
|---|---|---|
| `RECEBIDO` | `EM_ANALISE` | Sabesp inicia triagem; encerra edição/cancelamento pelo cidadão. |
| `RECEBIDO` | `CANCELADO` | Somente pelo autor, via rota de cancelamento. |
| `EM_ANALISE` | `VISITA_AGENDADA` | Sabesp registra janela válida. |
| `VISITA_AGENDADA` | `EM_ATENDIMENTO` | Sabesp inicia atendimento. |
| `EM_ATENDIMENTO` | `RESOLVIDO` | Sabesp registra comentário público; foto final opcional. |
| Estado ativo | `VINCULADO` | Sabesp informa principal válido e justificativa; desativa previsão anterior. |
| Estado ativo | `ENCERRADO_SEM_ATENDIMENTO` | Sabesp fornece justificativa; desativa previsão anterior. |

Toda mutação verifica estado atual e permissão na mesma operação; conflito de concorrência retorna `409`. Status e publicação são dimensões distintas. Só chamados aprovados, principais e publicáveis entram na consulta pública. Mudanças geram histórico auditável e notificações no mesmo commit quando aplicável.

### Pipeline F — vínculo, reincidência e anexos

- Duplicidade: `POST /chamados/{id}/vinculo`; validar que não é auto-vínculo, ciclo ou principal inativo. Preservar o chamado enviado e seu protocolo. Notificar o autor e permitir acompanhamento do principal sem expor dados pessoais.
- Reincidência: enviar `reincidenciaDe` na parte `dados` de um novo `POST /chamados`; o anterior precisa estar resolvido. É um novo atendimento, não um vínculo de duplicidade.
- Upload: usar multipart nas rotas de criação/edição/status conforme acima. Validar conteúdo real do arquivo, tamanho, quantidade, autorização e associação ao chamado; não confiar apenas em extensão ou MIME informado pelo navegador.
- Entrega de arquivos:

| Método e rota | Acesso | Uso |
|---|---|---|
| `GET /public/imagens/{id}` | Público | Servir somente imagem aprovada para publicação. |
| `GET /imagens/{id}` | Autor do chamado ou Sabesp | Servir imagem privada após conferir autorização para o recurso associado. |

Usar UUIDs opacos, metadados no Mongo e conteúdo em armazenamento de arquivos; nunca aceitar caminho arbitrário do cliente. A implementação inicial usa filesystem configurável por `FILES_STORAGE_DIRECTORY` (padrão `./uploads`), que precisa de volume persistente/compartilhado em produção. A troca para armazenamento de objetos fica isolada pela interface de storage. O polígono oficial GeoJSON é indicado por `SANTOS_SERVICE_AREA_GEOJSON`; se não estiver configurado ou for inválido, a criação/edição retorna `503 SERVICE_AREA_UNAVAILABLE`. Respostas públicas não podem incluir URL privada. Aplicar `Content-Type`, limites de cache e `X-Content-Type-Options: nosniff`.

### Pipeline G — notificações e visão da Prefeitura

| Método e rota | Acesso | Uso |
|---|---|---|
| `GET /me/notificacoes` | Cidadão | Lista paginada dos avisos do usuário autenticado. |
| `PATCH /me/notificacoes/{id}/leitura` | Dono + CSRF | Marcar como lida; não permitir alterar aviso de outro usuário. |
| `GET /prefeitura/indicadores` | Prefeitura | Agregados de chamados publicados, principais e filtrados, sem dados pessoais nem notas internas. |
| `GET /public/chamados` | Público/Prefeitura | Reutilizar a consulta pública para mapa e listagem; sem fila privada. |
| `GET /public/chamados/{id}` | Público/Prefeitura | Reutilizar o detalhe público autorizado. |

**Eventos que podem criar notificações:** início de análise, publicação/rejeição, previsão, atualização pública, resolução, encerramento, vínculo e mudança relevante do chamado principal. Notificações são privadas por usuário. Indicadores contam atendimentos principais: vínculos não duplicam atendimentos e reincidências contam separadamente.

## 3. Matriz de autorização

| Recurso | Anônimo | Cidadão autor | Sabesp | Prefeitura |
|---|---:|---:|---:|---:|
| Lista/detalhe público aprovado | Sim | Sim | Sim | Sim |
| Próprios chamados, inclusive privados | Não | Sim | Sim, para operação | Não |
| Fila e dados operacionais privados | Não | Não | Sim | Não |
| Observações internas e contato necessário | Não | Não | Sim | Não |
| Perfil e notificações | Não | Próprio | Conforme provisionamento | Conforme provisionamento |
| Indicadores públicos agregados | Não/Sim conforme publicação | Sim | Sim | Sim |
| Aprovar, alterar status, agendar, vincular | Não | Não | Sim | Não |

`404` deve ser usado de forma consistente para recursos privados que não possam ser revelados ao solicitante. Ocultar controles no front-end não substitui essa matriz aplicada no servidor.

## 4. Contratos e erros

- Lista: `{ "items": [], "page": 0, "size": 20, "totalItems": 0, "totalPages": 0 }`.
- Validação: HTTP `400`, `{ "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": {} }`.
- Sem sessão `401`; sem permissão `403` ou `404` conforme política uniforme; conflito de estado `409`; arquivo excedido `413`; dependência indisponível `503`.
- Nunca devolver stack trace, senha, token, conteúdo interno ou documento Mongo em erros.
- Identificadores, enums, nomes de campos e DTOs devem ser compartilhados com os tipos do front-end; alterações do contrato exigem atualizar testes/serviços.
- Não usar `200` com erro nem resposta vazia de sucesso para operações que deveriam devolver o recurso criado/alterado.

## 5. Entregas em quatro commits

Cada etapa deve ser validada antes do commit. O commit só inclui arquivos do escopo descrito; não versionar `.env`, credenciais ou dados reais.

| Commit | Escopo e rotas entregues | Critério de aceite |
|---|---|---|
| 1. `feat(backend): secure API foundation` | Configuração Spring, health, erros comuns, sessão, CSRF e políticas públicas/privadas. `GET /health`, `GET /auth/csrf`. | Testes de health, cookie CSRF, bloqueio de escrita sem token e `401` em rota privada; sem dependência do Atlas real. |
| 2. `feat(backend): implement identity and public queries` | Cadastro, login/logout, perfil, recuperação, catálogo, consultas públicas, endereços e geocodificação. Rotas dos pipelines B e C. | Testes de sessão/perfil/CSRF, privacidade dos DTOs públicos, paginação/filtros e falhas do provedor externo. |
| 3. `feat(backend): implement citizen cases and image storage` | Persistência, histórico, criação/consulta/edição/cancelamento, anexos privados/públicos e reincidência. Rotas do pipeline D e entrega de imagens do pipeline F. | Testes de propriedade, transições concorrentes, validação multipart, limites e controle de acesso a imagens. |
| 4. `feat(backend): add staff workflows and reporting` | Fila Sabesp, publicação, status, previsão, comentários, notas, vínculo, avisos, indicadores, OpenAPI e CI/deploy. Rotas dos pipelines E e G. | Matriz de transições, atomicidade, autorização e indicadores cobertos; build/teste/smoke test aprovados. |

Dependências: commit 2 depende da fundação do commit 1; commit 3 depende da identidade do commit 2; commit 4 depende do modelo de chamado do commit 3. O trabalho pode ser desenvolvido em paralelo apenas depois de congelados os DTOs e interfaces compartilhadas.

## 6. Testes e pipeline de CI

Pipeline esperado para cada pull request:

1. Checkout e configuração do JDK 17; usar Gradle Wrapper e cache de dependências.
2. `.\gradlew.bat test` no Windows ou `./gradlew test` em runner Linux.
3. Verificar compilação/empacotamento com `.\gradlew.bat bootJar`.
4. Executar testes de unidade de domínio e validação; testes MVC para rotas/erros/autorização; integração Mongo em banco isolado de teste, nunca Atlas de produção.
5. Verificar dependências e artefato; bloquear publicação caso teste ou build falhe.
6. Após implantação em ambiente de teste, executar smoke test de `/api/v1/health` e operações de leitura autenticadas. Produção exige aprovação e segredos configurados no ambiente, não no repositório.

**Casos mínimos por pipeline:** anônimo não lê chamado privado; cidadão A não lê/altera chamado do cidadão B; perfil institucional não é escolhível no cadastro; Sabesp não publica nota interna; transição inválida retorna `409`; imagem privada não é servida publicamente; token CSRF ausente/inválido bloqueia escrita; indicadores não contam duplicatas.

## 7. Pontos bloqueadores antes da integração real

1. Rotacionar a credencial MongoDB que foi exposta na conversa e verificar que nenhum segredo foi commitado; usar credencial nova com privilégio mínimo.
2. Escolher/confirmar serviço de geocodificação, limites da área atendida e política de indisponibilidade.
3. Escolher armazenamento de imagens e regras de retenção/acesso.
4. Confirmar canal de entrega de recuperação de senha e provisionamento das contas institucionais.
5. Atualizar o front-end para bootstrap CSRF e para consumir as rotas de recuperação/arquivos quando implementadas.

## 8. Situação atual

Commit 1 concluído: health em `/api/v1/health`, erros padronizados, sessão, CSRF, cookies configuráveis e políticas de acesso estão implementados e cobertos por testes.

Commit 2 entregue: cadastro de cidadão, login/logout de sessão, consulta/atualização do perfil, catálogo e consultas públicas paginadas, CEP via ViaCEP e bootstrap CSRF automático no cliente HTTP estão implementados. E-mails são normalizados e protegidos por índice único; senhas usam BCrypt e o hash não é guardado no principal da sessão.

Recuperação de senha e geocodificação retornam `503` explicitamente até a configuração dos provedores; o catálogo retorna `[]` até que os tipos oficiais sejam provisionados. Chamados públicos só terão dados após a entrega de escrita/persistência do commit 3. Em produção, manter `MONGODB_AUTO_INDEX_CREATION=true` (padrão) ou provisionar o índice único `uq_users_email` antes de atender requisições.

Commit 3 entregue: rotas de criação, listagem do cidadão, detalhe, edição e cancelamento; controle otimista de concorrência; validação multipart e storage local configurável; entrega de imagens privadas/públicas com verificação de propriedade/publicação. Para habilitar gravações reais, ainda é necessário fornecer o GeoJSON oficial em `SANTOS_SERVICE_AREA_GEOJSON` e provisionar os tipos ativos no MongoDB. O storage local requer volume persistente em produção.
