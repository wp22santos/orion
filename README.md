# Sistema Policial Offline

Sistema web para registro de abordagens policiais com funcionalidade offline.

## Funcionalidades

- Sistema de login e cadastro local
- Registro de abordagens
- Armazenamento offline
- Busca avançada
- Associação de indivíduos
- Registro de veículos

## Tecnologias Utilizadas

- HTML5
- CSS3 (Material Design Lite)
- JavaScript
- IndexedDB (Dexie.js)
- Service Workers
- PWA (Progressive Web App)
- CryptoJS para criptografia

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```
3. Inicie o servidor:
```bash
npm start
```

## Estrutura do Projeto

```
├── index.html
├── manifest.json
├── service-worker.js
├── styles/
│   └── main.css
├── js/
│   ├── app.js
│   ├── auth.js
│   └── db.js
└── images/
    ├── icon-192x192.png
    └── icon-512x512.png
```

## Desenvolvimento

O projeto está estruturado em módulos:

- `auth.js`: Sistema de autenticação
- `db.js`: Configuração do banco de dados IndexedDB
- `app.js`: Lógica principal da aplicação

## Segurança

- Senhas são hasheadas usando PBKDF2
- Dados sensíveis são criptografados com AES
- Armazenamento local seguro

## Próximos Passos

1. Implementar registro de abordagens
2. Adicionar sistema de busca
3. Implementar associação de indivíduos
4. Adicionar backup automático 