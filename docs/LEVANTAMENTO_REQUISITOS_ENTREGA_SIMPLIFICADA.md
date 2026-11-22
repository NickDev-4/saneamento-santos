# Levantamento de requisitos — entrega simplificada

## 1. Objetivo

Entregar uma versão simples do **Saneamento Santos** para registrar e acompanhar chamados relacionados a problemas de esgoto. A versão deve demonstrar o fluxo entre cidadão, Sabesp e Prefeitura e exibir os chamados em um mapa.

Este levantamento compara as funcionalidades encontradas no projeto com o recorte mínimo recomendado para a entrega. Ele descreve o estado do repositório consultado em 22/11/2026; não representa validação de implantação em produção.

## 2. Perfis e necessidades

| Perfil | Necessidade principal |
|---|---|
| Cidadão | Registrar um problema com local, tipo, data, hora e imagem; acompanhar o status. |
| Sabesp | Consultar os registros, atualizar o status e escrever um comentário de acompanhamento. |
| Prefeitura | Acompanhar os chamados e filtrar a consulta. |
| Visitante | Consultar os chamados publicados no mapa e abrir seus detalhes. |

## 3. Requisitos funcionais mínimos da entrega

### RF-01 — Registrar chamado

O cidadão deve informar o endereço do problema, o tipo de ocorrência, a data e a hora em que foi observada e pelo menos uma imagem. O formulário deve validar os campos obrigatórios, permitir revisar os dados e confirmar o envio.

O endereço é o local do problema, não necessariamente o endereço residencial do cidadão. O chamado recebe um identificador/protocolo, data de registro e status inicial **Recebido**.

### RF-02 — Consultar chamados

O sistema deve apresentar os chamados em mapa e em lista. Ao selecionar um chamado, deve mostrar pelo menos tipo, endereço/local, data/hora informada, imagem, status e comentários públicos.

O mapa deve posicionar cada marcador de acordo com a localização do chamado. A lista deve continuar disponível quando o mapa ou o provedor de tiles não puder ser carregado.

### RF-03 — Acompanhar pela Sabesp

O perfil Sabesp deve consultar os chamados e abrir seus detalhes. Para cada chamado, deve poder alterar o status dentro do fluxo definido para a entrega e registrar um comentário visível no acompanhamento.

Fluxo mínimo sugerido: **Recebido → Em análise → Em atendimento → Resolvido**. O agendamento de visita pode ser uma etapa opcional entre análise e atendimento, como já ocorre no backend. A transição de status e o comentário devem ser associados ao chamado e ao histórico de acompanhamento.

### RF-04 — Acompanhar pela Prefeitura

O perfil Prefeitura deve consultar os chamados e aplicar filtros por status, tipo, bairro e período, conforme os dados disponíveis. A consulta pode ser apresentada em lista e no mapa; não precisa incluir gráficos ou indicadores para cumprir o escopo mínimo.

### RF-05 — Restringir ações por perfil

As telas e operações devem respeitar os três perfis: cidadão registra e acompanha, Sabesp atualiza chamados e Prefeitura consulta e filtra. Uma demonstração pode oferecer acesso de teste para cada perfil; esse seletor não deve ser apresentado como autenticação institucional real.

## 4. Funcionalidades presentes no projeto consultado

O inventário abaixo foi conferido nas rotas, páginas e operações do front-end e nos endpoints do backend.

| Área | Funcionalidades atualmente apresentadas | Requisito da versão atual | Decisão para a entrega simplificada |
|---|---|---|---|
| Mapa público | Mapa Leaflet de Santos, marcadores dos chamados publicados, cores por status, busca textual, filtro por bairro e status, legenda, lista em painel, prévia/detalhe, controles de zoom/localização e alternativa em lista quando o mapa falha. | Consultar chamados publicados no mapa e abrir seus detalhes. | **Manter:** mapa, marcadores, lista, detalhe e filtro de status. Busca e filtro de bairro podem ficar se não aumentarem o esforço; localização e legenda são apoio. |
| Registro do cidadão | Cadastro/login; formulário por etapas; consulta de CEP; rua, número/sem número, bairro, referência e cidade; posição ajustável no mapa; tipo, descrição, data/hora observada; até três imagens; revisão antes do envio; confirmação com protocolo. | Criar chamado com endereço/local, tipo, data, hora e imagem. | **Manter:** endereço e coordenada, tipo, data/hora, ao menos uma imagem, validação, revisão e protocolo. Descrição curta pode permanecer como complemento. |
| Acompanhamento do cidadão | Lista “Meus chamados”, detalhe, status, histórico público; edição/cancelamento antes do início da análise; registro de reincidência após resolução; avisos internos. | Permitir consultar o andamento do chamado do cidadão. | **Manter:** consulta e detalhe do próprio chamado. Edição, cancelamento, reincidência e avisos ficam fora do mínimo. |
| Conta e perfil | Cadastro de cidadão, login, sessão, logout, recuperação/redefinição de senha, alteração de dados de perfil e troca de perfil de demonstração. | Controlar o acesso às operações de cidadão, Sabesp e Prefeitura. | **Manter:** autenticação e autorização por perfil (ou acesso de demonstração claramente identificado). Recuperação e edição de perfil podem sair. |
| Operação Sabesp | Fila de chamados; busca e filtro por status/publicação; indicadores de fila; abertura do detalhe; análise; aprovar/rejeitar publicação; alterar status; agendar visita; registrar atualização pública ou observação interna; resolver com texto/foto; encerrar com justificativa; vincular duplicata. | Ver chamado, atualizar status e escrever comentário. | **Manter:** fila, detalhe, mudança de status, comentário público e aprovação simples para publicar o chamado no mapa. Remover indicadores, filtro separado de publicação, rejeição, nota interna, resolução com anexo, encerramento e vínculo de duplicata. O agendamento permanece apenas se necessário para avançar o fluxo já implementado. |
| Acompanhamento Prefeitura | Indicadores agregados, gráficos de status/bairro, filtros por bairro/status/período, lista e alternância para mapa; detalhes abertos a partir da lista/mapa. | Consultar chamados e filtrar o acompanhamento. | **Manter:** lista, filtros de status/bairro/período e mapa funcional. Gráficos e indicadores podem sair. |
| Notificações | Lista de avisos por usuário e marcação de leitura. | Não é necessária para o fluxo mínimo. | Deixar fora da entrega simplificada. |
| Serviços de apoio e operação | API HTTP e modo de demonstração local; carregamento/erro/vazio; validação e armazenamento de imagens; integração de CEP; tentativa de geocodificação; checagem de área de atendimento; documentação OpenAPI/Swagger; proteção por sessão, CSRF e perfil. | Sustentar persistência, localização, imagens e separação das ações de cada perfil. | Preservar as dependências estritamente necessárias ao fluxo escolhido. Identificar claramente modo de demonstração e limitações de ambiente. |

### Requisitos adicionais já implementados no sistema completo

Para não confundir o levantamento atual com o escopo de entrega, o projeto também contempla recuperação de conta, manutenção de perfil, edição/cancelamento do relato, reincidência, notificações, rejeição de publicação, anotações internas, anexos de resolução, encerramento justificado, vínculo de chamados duplicados e painel analítico da Prefeitura. São capacidades existentes, mas não são necessárias para demonstrar o fluxo mínimo solicitado. A aprovação simples é mantida porque o mapa público exibe apenas chamados publicados.

## 5. Estado técnico observado e limites da demonstração

- O front-end usa a API Java por padrão; `VITE_DATA_MODE=demo` ativa o modo local com registros fictícios em memória, que se perdem ao recarregar a página.
- O backend implementa cadastro, consultas, chamados, imagens, fluxo Sabesp, notificações e indicadores. A execução real ainda depende de MongoDB configurado e das definições de ambiente do backend.
- O perfil `demo`, junto com `app.demo.seed.enabled=true`, carrega 12 chamados em bairros de Santos, tipos e três contas fictícias. A carga é idempotente e grava na base MongoDB configurada; deve ser usada somente em base de demonstração.
- A criação real de novos chamados depende do GeoJSON da área atendida. As operações de fluxo que gravam chamado e notificações juntas requerem MongoDB com suporte a transações; em ambiente hospedado, as imagens precisam de armazenamento persistente.
- Consulta de CEP está implementada no backend; geocodificação retorna indisponibilidade até que um provedor seja escolhido/configurado. O mapa depende de internet e do serviço de tiles configurado.
- Os dados de exemplo e imagens demonstrativas são fictícios. A demonstração dos perfis não comprova integração oficial com Sabesp ou Prefeitura.

## 6. Fora do escopo mínimo recomendado

Para manter a entrega pequena, não incluir como requisito de aceite: recuperação de senha, edição de perfil, notificações, anexos de resolução, notas internas, rejeição de publicação, encerramento com justificativa, vínculo de duplicatas, reincidência, gráficos de gestão e indicadores agregados. Agendamento de visita pode sair se o fluxo simplificado permitir iniciar o atendimento diretamente após a análise. A aprovação simples de publicação permanece para disponibilizar o chamado no mapa.

Esses recursos já fazem parte da experiência mais completa do projeto e podem permanecer disponíveis em outra versão, mas não são necessários para demonstrar o fluxo principal solicitado.

## 7. Critérios de aceite

1. Um cidadão consegue preencher endereço, tipo, data, hora e imagem, revisar e receber confirmação do chamado.
2. O chamado aparece com sua localização no mapa e também na lista; abrir o item mostra os dados e o status.
3. A Sabesp consegue encontrar o chamado, alterar seu status no fluxo acordado e publicar um comentário.
4. A Prefeitura consegue visualizar os chamados e restringir a lista por filtros definidos para a apresentação.
5. Os acessos de demonstração deixam claro qual perfil está ativo e não oferecem ações de outro perfil.
6. A equipe informa se a demonstração usa dados temporários ou API persistente; não se apresenta dado fictício como ocorrência real.

## 8. Decisões a fechar antes de derivar a branch

- A entrega será uma demonstração local com dados temporários ou precisa persistir registros via API Java?
- O cidadão precisa criar conta para abrir chamado ou a apresentação aceitará um acesso de demonstração?
- Quais tipos de problema serão apresentados no catálogo?
- O cidadão e a Prefeitura verão todos os chamados ou somente os chamados autorizados para publicação?
- O comentário da Sabesp será público para quem acompanha o chamado?
- Quais filtros são obrigatórios na apresentação: status, tipo, bairro e/ou período?
- A Prefeitura deverá ver todo chamado registrado ou apenas os publicados pela Sabesp? Hoje o mapa e os dados da Prefeitura seguem a regra de visibilidade pública.
- O status inicial e os nomes/transições do fluxo devem permanecer como no sistema atual ou ser reduzidos a “Recebido”, “Em análise”, “Em atendimento” e “Resolvido”?

As decisões pendentes não mudam o fluxo essencial, mas alteram autenticação, privacidade, configuração da API e o conteúdo da interface.
