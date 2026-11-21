# Saneamento Santos

Front-end de uma aplicação para registrar e acompanhar problemas de esgoto em Santos. O projeto prioriza o uso no celular e oferece áreas para cidadãos, Sabesp e Prefeitura.

## Estado do projeto

O front-end está implementado com React, TypeScript e Vite. O modo de demonstração usa dados fictícios em memória, permite conhecer os três perfis e dispensa um servidor Java. Os dados e a sessão da demonstração são reiniciados ao recarregar a página.

O backend Java/Spring inclui identidade, consultas públicas, abertura e acompanhamento de chamados, imagens e workflows da Sabesp, notificações e indicadores da Prefeitura. A API publica sua especificação OpenAPI em `/v3/api-docs` e a interface Swagger em `/swagger-ui/index.html`. Para habilitar gravações reais, configure o GeoJSON oficial da área atendida em `SANTOS_SERVICE_AREA_GEOJSON` e provisione os tipos ativos no MongoDB. As operações de workflow com notificações atômicas exigem um MongoDB compatível com transações (replica set). O storage local de imagens requer volume persistente em produção.

## Executar no Windows

Requisito: Node.js 22.14 ou superior, com npm. No PowerShell, a partir da raiz do projeto:

```powershell
cd .\frontend
npm.cmd ci
npm.cmd run dev
```

Acesse <http://127.0.0.1:5173>. Na tela de acesso, os botões da demonstração permitem entrar como cidadão, Sabesp ou Prefeitura.

## Verificações

Dentro de `frontend/`:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run check:architecture
npm.cmd run format:check
npm.cmd run build
```

Os testes de integração usam o Microsoft Edge instalado, com viewport mobile, e respostas HTTP controladas. Eles não exigem o backend Java e iniciam um servidor temporário na porta 5174. A compilação é gerada em `frontend/dist/`.

## Integração com Java

Por padrão, a aplicação usa o modo `demo`. Para configurar uma API local, copie o exemplo:

```powershell
# Dentro de frontend/
Copy-Item .env.example .env.local
```

Edite `.env.local` e reinicie o Vite:

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=/api/v1
```

O proxy de desenvolvimento encaminha `/api` para `http://127.0.0.1:8080`. Consulte o OpenAPI e o [contrato proposto](docs/CONTRATO_API_PROPOSTO.md) para integrar o adapter HTTP. As variáveis `VITE_*` são públicas no navegador e devem conter somente configurações públicas.

O mapa usa Leaflet e os tiles configurados em `VITE_MAP_TILE_URL`. Sua exibição depende de acesso à internet e da disponibilidade do serviço de mapas.

## Backend Java

O backend usa Java 17, Spring Boot e MongoDB. Configure a URI e o banco localmente em `backend/.env` (esse arquivo é ignorado pelo Git; nunca versione credenciais) e inicie a API:

```powershell
cd .\backend
.\gradlew.bat bootRun
```

A API fica em `http://127.0.0.1:8080`, como esperado pelo proxy do Vite. `GET /api/v1/health` verifica se a aplicação responde. Consulte a especificação em `http://127.0.0.1:8080/v3/api-docs` ou a interface em `http://127.0.0.1:8080/swagger-ui/index.html`. Execute `.\gradlew.bat test bootJar` para verificar e empacotar o backend.

### Dependências locais e integração real

O exemplo de configuração está em `backend/.env.example`; preserve seu `backend/.env` atual e copie apenas as variáveis que decidir configurar. Para um MongoDB local com suporte a transações, use o serviço de desenvolvimento do `compose.yaml`:

```powershell
# Na raiz do projeto; exige Docker Desktop ativo
docker compose up -d mongodb
docker compose exec mongodb mongosh --port 27018 --eval 'try { rs.status(); print("replica set rs0 já iniciado") } catch (e) { rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27018" }] }) }'
```

Se você optar por usar essa instância local, configure a URI no `backend/.env` como `mongodb://127.0.0.1:27018/saneamento_santos?replicaSet=rs0`. O volume `mongodb-data` persiste os dados entre reinícios. Essa instância é local, sem autenticação e ligada somente ao loopback; não a exponha em produção. O valor Mongo que já existe no seu `.env` não é substituído por esta tarefa.

O endpoint de geocodificação usa o Nominatim público do OpenStreetMap por padrão e pode ser trocado por `GEOCODING_NOMINATIM_URL`. A API só consulta após a ação de busca do usuário, inclui o identificador `GEOCODING_USER_AGENT`, limita cada instância a menos de uma consulta por segundo e mantém cache em memória. A consulta envia logradouro, bairro, cidade e UF; não envia número, CEP, referência ou dados de contato. O usuário ainda confirma/ajusta o ponto no mapa. O mapa exibe a atribuição OpenStreetMap. Respeite a [política de uso do Nominatim](https://operations.osmfoundation.org/policies/nominatim/): serviço público tem capacidade limitada e não deve receber dados pessoais ou confidenciais. Para maior volume, escolha um fornecedor próprio/terceirizado ou hospede uma instância.

Para ativar a recuperação de senha, configure no ambiente do backend `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `RECOVERY_EMAIL_FROM` e `RECOVERY_FRONTEND_URL`. O remetente precisa ser aceito pelo relay; a URL deve ser a origem HTTPS do frontend publicado (em local, `http://127.0.0.1:5173`). Tokens aleatórios de 256 bits expiram em 30 minutos por padrão, são armazenados somente por SHA-256 e invalidam sessões anteriores quando a senha é trocada. Sem essas variáveis, a API retorna `503` para recuperação em vez de afirmar que um e-mail foi enviado.

Contas locais de demonstração para cidadão, Sabesp e Prefeitura podem ser criadas uma vez, sem rota pública de promoção, quando o backend inicia com seus grupos `SEED_CIDADAO_*`, `SEED_SABESP_*` e `SEED_PREFEITURA_*` (email, name e password). Configure senhas fora do Git; cada senha precisa ter pelo menos 12 caracteres. O processo só cria uma conta se o e-mail ainda não existir, nunca altera uma conta existente e falha se o e-mail já pertencer a outro perfil. Para os tipos de chamado, prepare `backend/data/case-types.json` com elementos `{ "id": "...", "nome": "...", "ativo": true }`, configure `CASE_TYPES_SEED_FILE=./data/case-types.json` no `.env` local ou `CASE_TYPES_SEED_FILE=/app/config/case-types.json` no compose e inicie a API. O carregador é aditivo: insere IDs novos e preserva os já cadastrados.

### Imagens e implantação

`compose.production.yaml` e os Dockerfiles oferecem um ponto de partida independente de provedor: MongoDB fica externo, frontend e API compartilham uma origem, cookies são `Secure` e o diretório de imagens usa um volume persistente. O arquivo `backend/data/santos-service-area.geojson` acompanha o projeto. Para produção, use MongoDB Atlas ou replica set gerenciado, guarde variáveis sensíveis em secrets, publique por HTTPS e configure armazenamento persistente/compartilhado para as imagens. O volume Docker mostrado atende uma instância única; múltiplas instâncias precisam de filesystem compartilhado ou storage de objetos.

Antes de usar o limite municipal como regra real do serviço, confirme que a área de atendimento coincide com a divisa do município. A configuração atual usa o GeoJSON derivado da malha municipal IBGE 2025 que você forneceu. O catálogo de tipos oficiais e as credenciais institucionais continuam dependendo de dados aprovados pela organização.

Uploads usam arquivos com nomes opacos e armazenamento em filesystem local, configurável por `FILES_STORAGE_DIRECTORY` (padrão `./uploads`). Em produção, esse diretório precisa ser persistente e compartilhado entre instâncias; não use disco efêmero. O cadastro de chamados exige o polígono oficial da área em GeoJSON, configurado por `SANTOS_SERVICE_AREA_GEOJSON`. Sem esse arquivo, a criação/edição retorna `503 SERVICE_AREA_UNAVAILABLE` em vez de aceitar coordenadas sem validação geográfica. Os tipos de chamado também precisam ser provisionados no catálogo MongoDB. Os workflows que atualizam chamado e notificações em conjunto requerem MongoDB em replica set; em deployment, use URI/configuração compatível.

O workflow de CI em `.github/workflows/ci.yml` executa `test bootJar` no backend e testes unitários/build do frontend em pull requests e pushes para `main`. Deploy automatizado não foi configurado porque o projeto ainda não define provedor ou ambiente de hospedagem.

## Organização

- `frontend/src/features/`: funcionalidades com páginas, componentes, hooks e contexts próprios.
- `frontend/src/shared/`: componentes visuais reutilizáveis, formatação e erros tipados.
- `frontend/src/app/routes/`: rotas públicas, rotas por perfil e proteção de acesso.
- `frontend/src/app/layout/`: cabeçalho e navegação compartilhados.
- `frontend/src/app/contexts/`: sessão, injeção de API e mensagens via Context API.
- `frontend/src/app/data/`: cache por sessão, consultas e invalidação.
- `frontend/src/services/http/`: cliente HTTP e endpoints separados por domínio.
- `frontend/src/services/demo/`: serviços de demonstração com estado isolado por instância.
- `frontend/src/contracts/`: tipos compartilhados da integração.
- `frontend/tests/`: testes de cache e integração.
- `docs/`: planejamento e documentação técnica.
- `Exemplos/`: referências visuais fornecidas para o projeto.

## Documentação

- [Plano do front-end](docs/PLANO_FRONTEND.md)
- [Fluxo de dados e Context API](docs/FLUXO_DADOS_FRONTEND.md)
- [Arquitetura e organização dos arquivos](docs/ARQUITETURA_FRONTEND.md)
- [Contrato de API proposto](docs/CONTRATO_API_PROPOSTO.md)
- [Plano de implementação do backend, pipelines e rotas](docs/PLANO_IMPLEMENTACAO_BACKEND.md)

Os registros, usuários e imagens ilustrativas da demonstração são fictícios. A existência de perfis institucionais no protótipo não representa adoção oficial pelas instituições.
