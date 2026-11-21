# Dados geográficos

## Área de validação de Santos

- Arquivo consumido pelo backend: `backend/data/santos-service-area.geojson`.
- Fonte: Malha Municipal 2025 do IBGE para São Paulo (`SP_Municipios_2025.zip`).
- Feição selecionada pelo código IBGE `3548500` (Santos).
- CRS de origem: SIRGAS 2000 geográfico (EPSG:4674); as coordenadas geográficas são registradas como longitude/latitude no GeoJSON para uso pelo Leaflet e pelo validador JTS.
- Geometria: `MultiPolygon`, validada antes de entrar no projeto.

O IBGE publica as malhas municipais e sua nota metodológica na [página oficial da Malha Municipal](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html). A geometria representa a divisa político-administrativa do município. Ela só deve ser usada como limite operacional depois que a organização responsável confirmar que o atendimento cobre exatamente esse território.

O backend configura o arquivo por `SANTOS_SERVICE_AREA_GEOJSON`. Em produção, mantenha a mesma origem e registre mudanças da malha com sua versão e fonte.
