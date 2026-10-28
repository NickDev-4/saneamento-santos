# Saneamento Santos — proposta de contrato front-end / Java

Proposta de alinhamento técnico, consolidada em 28/10/2026. **Não é uma API implementada nem uma especificação OpenAPI executável.** As rotas e os exemplos abaixo tornam o trabalho de integração revisável pelo responsável pelo Java.

Decisões de produto: [PLANO_FRONTEND.md](PLANO_FRONTEND.md). Todos os endpoints, CRUD, validações de negócio e autorizações serão implementados em **Java/Spring**. O front-end consome as respostas e apresenta a interface.

Implementação do gerenciamento de estado e instruções de conexão: [FLUXO_DADOS_FRONTEND.md](FLUXO_DADOS_FRONTEND.md).

## 1. Convenções propostas

| Item | Proposta |
|---|---|
| Base | `/api/v1` |
| Dados | JSON com campos em camelCase; imagens enviadas como multipart |
| IDs | Strings opacas; protocolo é um identificador de apresentação distinto do ID |
| Datas | ISO 8601 com offset ou UTC; tela apresenta no fuso `America/Sao_Paulo` |
| Paginação | `page` começa em zero; `size` padrão 20, máximo 100 |
| Sessão | Preferência por cookie de sessão HttpOnly gerenciado pelo Spring, com proteção CSRF nas alterações |
| Perfil | `CIDADAO`, `SABESP` ou `PREFEITURA`, obtido da sessão |
| Erros | Código estável, mensagem e erros de campos quando aplicável |

A convenção de sessão é uma proposta técnica, não uma escolha já exigida pelo usuário. Se o backend adotar outra forma de autenticação, documentar o fluxo antes de conectar as telas. Configurar origem, cookies e CSRF de forma compatível com o ambiente; não incluir credenciais no código do front-end.

O contrato final deve ser formalizado em OpenAPI e compartilhado entre os dois lados. A proposta não depende de uma versão específica de biblioteca do backend.

## 2. Recursos e campos

### Chamado

| Campo | Finalidade |
|---|---|
| `id`, `protocolo` | Identificação técnica e identificação apresentada ao usuário |
| `tipoId`, `descricao` | Classificação do catálogo e relato do problema |
| `observadoEm` | Data/hora observada pelo cidadão |
| `criadoEm`, `atualizadoEm` | Datas geradas pelo Java |
| `endereco` | CEP, logradouro, número/sem número, bairro, cidade, UF e referência |
| `localizacao` | Objeto com `latitude` e `longitude` confirmadas |
| `status` | Etapa do atendimento |
| `publicacao` | Decisão de exibição pública, independente do status |
| `imagens` | Metadados e referências às imagens autorizadas para o solicitante |
| `previsaoVisita` | Objeto com `inicio` e `fim`, ou `null` |
| `vinculo` | Referência ao atendimento principal em caso de duplicidade |
| `reincidenciaDe` | Referência a um atendimento anterior já resolvido, ou `null` |
| `acoesPermitidas` | Lista opcional de ações calculadas pelo Java para orientar a tela |

Os campos de autor e contato ficam somente nos DTOs autorizados. Observações internas são um recurso separado. Não usar uma resposta completa de operação em endpoints públicos para depois ocultar os campos na interface.

### Valores do contrato

| Campo | Valores propostos |
|---|---|
| `status` | `RECEBIDO`, `EM_ANALISE`, `VISITA_AGENDADA`, `EM_ATENDIMENTO`, `RESOLVIDO`, `VINCULADO`, `ENCERRADO_SEM_ATENDIMENTO`, `CANCELADO` |
| `publicacao` | `PENDENTE`, `APROVADO`, `REJEITADO` |

Os rótulos amigáveis ficam na interface: por exemplo, `VINCULADO` aparece como “Vinculado a outro chamado”. O catálogo de tipos de problema deve vir do Java e ser alinhado com os participantes; não inventar uma classificação oficial.

### DTOs de leitura

| Resposta | Conteúdo |
|---|---|
| Resumo público | Identificação, tipo, local, status, previsão, imagem aprovada de capa e última atualização |
| Detalhe público | Resumo, descrição/fotos aprovadas e histórico público autorizado |
| Detalhe do autor | Próprio registro, situação de publicação, motivos, vínculo e ações permitidas |
| Detalhe de operação | Dados necessários à triagem/atendimento e contato do autor quando necessário |
| Indicadores Prefeitura | Agregados de atendimentos publicados, sem dados pessoais ou observações internas |

## 3. Rotas propostas

Todas as rotas usam o prefixo `/api/v1`.

### Acesso e conta

| Método e rota | Responsabilidade |
|---|---|
| `POST /auth/cadastro` | Criar cidadão; não aceitar escolha de perfil institucional |
| `POST /auth/login` | Iniciar sessão e retornar perfil/dados de apresentação |
| `POST /auth/logout` | Encerrar sessão |
| `GET /auth/me` | Consultar usuário autenticado |
| `POST /auth/recuperacao` | Iniciar recuperação de acesso |
| `POST /auth/redefinicao` | Concluir recuperação mediante credencial temporária validada pelo Java |
| `PATCH /me` | Alterar campos cadastrais permitidos; regras para alteração de e-mail/senha a detalhar no backend |

As contas institucionais são provisionadas previamente no Java. Não há cadastro público de Sabesp ou Prefeitura. O método de entrega da recuperação de acesso é um alinhamento técnico com o backend; a interface demonstra os estados do fluxo.

### Consulta pública e localização

| Método e rota | Responsabilidade |
|---|---|
| `GET /public/tipos-chamado` | Catálogo de tipos disponíveis |
| `GET /public/chamados` | Lista paginada de atendimentos publicados; usar DTO público |
| `GET /public/chamados/{id}` | Detalhe público de atendimento publicado |
| `GET /enderecos/cep/{cep}` | Endereço por CEP consultado pelo Java |
| `POST /enderecos/geocodificacao` | Sugestão de coordenadas a partir do endereço informado |

Filtros da consulta pública: `status`, `tipoId`, `bairro`, `criadoDe`, `criadoAte`, `q` e `bbox`. O período é a **data de criação**, nomeada assim na interface. `bbox` segue a ordem `minLongitude,minLatitude,maxLongitude,maxLatitude`; os objetos de localização usam campos nomeados para evitar inversão.

A lista tem paginação mesmo quando há filtro por área do mapa. Para representar todos os resultados de uma área, o cliente precisa percorrer as páginas ou o Java deve oferecer um recurso específico de pontos, com limites explícitos. Não apresentar uma página parcial como se fosse o total do mapa.

As consultas de endereço retornam dados/sugestões. Quem confirma o ponto é o usuário; quem valida definitivamente a área de Santos é o Java. O provedor de geocodificação será escolhido pelo responsável pela integração, sem acoplar a interface a ele.

### Cidadão

| Método e rota | Responsabilidade |
|---|---|
| `GET /me/chamados` | Registros do autor, inclusive privados e vinculados |
| `POST /chamados` | Criar chamado com dados e fotos; estado inicial definido pelo Java |
| `GET /chamados/{id}` | Detalhe autorizado: autor ou Sabesp |
| `PATCH /chamados/{id}` | Editar dados/anexos permitidos do próprio chamado ainda Recebido |
| `POST /chamados/{id}/cancelamento` | Cancelar o próprio chamado ainda Recebido |
| `GET /me/notificacoes` | Avisos internos do cidadão |
| `PATCH /me/notificacoes/{id}/leitura` | Marcar aviso como lido |

### Sabesp e Prefeitura

| Método e rota | Perfil / responsabilidade |
|---|---|
| `GET /operacao/chamados` | Sabesp: fila, incluindo registros privados |
| `PATCH /chamados/{id}/status` | Sabesp: transição autorizada e justificativa quando exigida |
| `PATCH /chamados/{id}/publicacao` | Sabesp: aprovar/rejeitar exibição do relato e anexos |
| `PATCH /chamados/{id}/previsao` | Sabesp: registrar/alterar janela de visita |
| `POST /chamados/{id}/atualizacoes-publicas` | Sabesp: mensagem de acompanhamento público após publicação |
| `GET /chamados/{id}/observacoes-internas` | Somente Sabesp: consultar observações internas |
| `POST /chamados/{id}/observacoes-internas` | Somente Sabesp: adicionar observação interna |
| `POST /chamados/{id}/vinculo` | Sabesp: vincular relato duplicado a atendimento principal |
| `GET /prefeitura/indicadores` | Prefeitura: agregados de atendimentos publicados e filtrados |

A Prefeitura utiliza a consulta pública para mapa/lista/detalhe e a rota de indicadores para sua visão de gestão. Não recebe a fila privada de operação.

## 4. Criação e imagens

Proposta de `POST /chamados`: `multipart/form-data`, com uma parte `dados` em JSON e de uma a três partes de arquivo chamadas `imagens`.

Exemplo de conteúdo da parte `dados`:

```json
{
  "tipoId": "tipo-de-teste",
  "descricao": "Relato fictício para avaliação das telas.",
  "observadoEm": "2026-11-01T09:30:00-03:00",
  "endereco": {
    "cep": "00000000",
    "logradouro": "Logradouro de teste",
    "numero": null,
    "semNumero": true,
    "bairro": "Bairro de teste",
    "cidade": "Santos",
    "uf": "SP",
    "referencia": "Referência fictícia"
  },
  "localizacao": {
    "latitude": -23.96,
    "longitude": -46.33
  },
  "reincidenciaDe": null
}
```

O exemplo ilustra o **formato**. CEP, logradouro e tipo são placeholders, não dados válidos para cadastro; as coordenadas não resultam da geocodificação desse endereço fictício.

O Java define autor, perfil, protocolo, datas de criação, status inicial `RECEBIDO` e publicação `PENDENTE`. O cliente não escolhe esses campos na criação.

Limites técnicos iniciais propostos para alinhamento: JPEG, PNG e WebP; até 5 MiB por arquivo. O Java valida formato, tamanho e quantidade. A interface informa o motivo da rejeição e conserva os campos preenchidos para correção.

Para edição com alterações em anexos, manter multipart: parte `dados`, IDs de imagens mantidas em `imagensMantidas` e novos arquivos em `imagens`. Validar que os IDs pertencem ao chamado e que o resultado final mantém de uma a três imagens.

O armazenamento e a entrega das imagens são responsabilidade do backend. Imagens de registros privados devem ser acessíveis somente ao autor e à Sabesp; os links públicos só devem expor imagens aprovadas.

No encerramento como `RESOLVIDO`, a rota de status recebe `comentarioPublico` obrigatório e pode receber `imagemResolucao` opcional. Para manter os dois casos no mesmo contrato, propor multipart também nessa rota: parte `dados` com a transição e, quando houver, o arquivo de resolução.

Sucesso na criação: HTTP `201`, com ID, protocolo e detalhe autorizado do novo registro. Desabilitar o botão durante o envio; não repetir automaticamente operações de escrita após erro de rede. A estratégia para reconhecer reenvios após perda de resposta deve ser alinhada com o Java.

## 5. Fluxo de estados e publicação

Fluxo principal: `RECEBIDO → EM_ANALISE → VISITA_AGENDADA → EM_ATENDIMENTO → RESOLVIDO`.

Proposta inicial de transições para implementação no Java:

| Origem | Destino | Responsável / condição |
|---|---|---|
| `RECEBIDO` | `EM_ANALISE` | Sabesp inicia triagem; edição pelo cidadão termina |
| `RECEBIDO` | `CANCELADO` | Autor cancela antes da análise |
| `EM_ANALISE` | `VISITA_AGENDADA` | Sabesp registra janela válida de visita |
| `VISITA_AGENDADA` | `EM_ATENDIMENTO` | Sabesp inicia atendimento |
| `EM_ATENDIMENTO` | `RESOLVIDO` | Sabesp informa solução pública; foto final opcional |
| Estado ativo em análise/agendamento/atendimento | `VINCULADO` | Sabesp confirma duplicata, informa principal e justificativa |
| Estado ativo em análise/agendamento/atendimento | `ENCERRADO_SEM_ATENDIMENTO` | Sabesp justifica o encerramento |

Se um vínculo ou encerramento acontecer depois do agendamento, o Java desativa a visita daquele registro. As transições e seus efeitos precisam ser atômicos no backend; a tabela é uma proposta a alinhar com seu responsável.

Registrar previsão enquanto `EM_ANALISE` deve produzir `VISITA_AGENDADA` na mesma operação. Alterar a janela mantém esse status e registra histórico/aviso. A interface mostra “Sem previsão informada” quando não houver janela; não inventa um prazo nem calcula uma previsão de chegada.

Os horários `inicio` e `fim` precisam representar uma janela válida e usar o formato de data do contrato. A validação definitiva é do Java.

`publicacao` não avança automaticamente com o atendimento. O Java guarda quem aprovou/rejeitou e quando. A consulta pública retorna somente registros aprovados que representem atendimentos principais; vinculados e cancelados ficam fora dos pontos públicos. Atendimentos resolvidos podem continuar no histórico público, acessíveis pelos filtros.

Mensagens públicas de um registro ainda privado ficam visíveis somente nos contextos autorizados até sua aprovação. Observações internas nunca são publicadas por mudança de status.

O Java deve rejeitar uma edição do cidadão se a análise tiver começado entre a abertura da tela e o envio. O front-end informa a mudança e atualiza as ações disponíveis.

## 6. Vínculo de duplicatas e reincidência

Exemplo de `POST /chamados/{id}/vinculo`:

```json
{
  "chamadoPrincipalId": "id-do-atendimento-principal",
  "justificativa": "A triagem identificou o mesmo problema já em atendimento."
}
```

O Java valida a relação, impede vínculos consigo mesmo/ciclos e garante que o principal represente um atendimento ativo. Preserva o registro enviado, altera sua apresentação para vinculado e gera aviso ao autor.

O detalhe do autor deve trazer um resumo autorizado do vínculo: protocolo principal, status atual, previsão quando disponível e destino de acompanhamento. Esse resumo não expõe dados pessoais do autor do chamado principal nem conteúdo ainda não aprovado para o destinatário.

Ao consultar o vínculo, retornar o estado atual do principal. Novas atualizações relevantes do principal devem gerar notificações aos autores dos registros vinculados, além do autor original.

Na reincidência, um **novo** chamado aponta em `reincidenciaDe` para o anterior já resolvido. O anterior conserva o histórico e o status de resolução; o novo percorre sua própria análise.

## 7. Filtros e indicadores

Definir os indicadores sobre atendimentos publicados e principais, com o mesmo recorte dos filtros de gestão:

- **Ativos:** `EM_ANALISE`, `VISITA_AGENDADA` e `EM_ATENDIMENTO` aprovados.
- **Resolvidos:** atendimentos principais aprovados com status `RESOLVIDO`.
- **Encerrados sem atendimento:** categoria separada quando aprovada para consulta pública.
- **Distribuição:** por bairro, tipo e status, com filtros por data de criação.

Uma reincidência representa outro atendimento. Um relato vinculado por duplicidade não acrescenta outro atendimento aos indicadores.

Se a Sabesp precisar de volume de entradas, apresentar **relatos recebidos** como outra medida, explicitamente distinta de **atendimentos únicos**. Não somar as duas medidas em um total de problemas.

## 8. Respostas e erros

Formato proposto de lista paginada:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Formato proposto de erro de preenchimento:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Revise os campos indicados.",
  "fieldErrors": {
    "endereco.cep": "Informe um CEP válido."
  }
}
```

Respostas relevantes: `400` para preenchimento inválido, `401` para ausência/expiração de sessão, `403` para ação sem permissão, `404` para recurso não encontrado ou não acessível, `409` para conflito com o estado atual e `413` para tamanho de envio excedido. A distinção entre `403` e `404` em recursos privados deve ser uniforme no Java.

O front-end trata carregamento, falha de conexão, serviço temporariamente indisponível, lista vazia e nova tentativa. Mensagens de sucesso dependem da confirmação do servidor.

## 9. Alinhamentos técnicos antes da integração

Estes pontos são escolhas de implementação a acertar com o responsável pelo Java, sem reabrir as decisões de produto:

1. Aceitar/ajustar rotas, enums, DTOs e formatos; publicar o contrato OpenAPI acordado.
2. Confirmar autenticação, sessão, CSRF e origens de desenvolvimento.
3. Definir catálogo de tipos, validação da área de Santos e provedor de geocodificação.
4. Confirmar limites multipart, armazenamento e acesso às imagens privadas/públicas.
5. Definir provisionamento das contas de teste e recuperação de acesso.
6. Ajustar transições excepcionais e estratégia contra reenvios repetidos.
7. Disponibilizar exemplos de sucesso/erro e informar a ordem de entrega dos endpoints.

Até esse alinhamento, os mocks do front-end representam somente respostas de demonstração. O teste de CRUD, persistência e autorização será feito contra a API Java.
