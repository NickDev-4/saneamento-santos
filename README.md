# Saneamento Santos

Front-end de uma aplicação para registrar e acompanhar problemas de esgoto em Santos. O projeto prioriza o uso no celular e oferece áreas para cidadãos, Sabesp e Prefeitura.

## Estado do projeto

O front-end está implementado com React, TypeScript e Vite. O modo de demonstração usa dados fictícios em memória, permite conhecer os três perfis e dispensa um servidor Java. Os dados e a sessão da demonstração são reiniciados ao recarregar a página.

O backend será desenvolvido separadamente em Java. Persistência, autenticação real, permissões, regras de negócio, uploads e operações de cadastro, consulta, atualização e exclusão serão responsabilidade dele. O adapter HTTP e os contratos do front-end servem como base para alinhar essa integração; o contrato de API ainda é uma proposta.

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

O proxy de desenvolvimento encaminha `/api` para `http://127.0.0.1:8080`. A API Java precisa implementar os endpoints e alinhar os formatos descritos na documentação para esse modo funcionar. As variáveis `VITE_*` são públicas no navegador e devem conter somente configurações públicas.

O mapa usa Leaflet e os tiles configurados em `VITE_MAP_TILE_URL`. Sua exibição depende de acesso à internet e da disponibilidade do serviço de mapas.

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

Os registros, usuários e imagens ilustrativas da demonstração são fictícios. A existência de perfis institucionais no protótipo não representa adoção oficial pelas instituições.
