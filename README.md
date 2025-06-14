# SQL Client Chrome Extension

Uma extensão para Google Chrome que permite executar queries SQL diretamente no browser, conectando-se a bases de dados MySQL através de um servidor backend local.

## 🆕 Melhorias e Funcionalidades Avançadas

Ao longo do desenvolvimento, foram implementadas várias melhorias para tornar a extensão mais segura, prática e poderosa:

- **Histórico de Conexões**: Guarda as últimas conexões (exceto passwords) para reutilização rápida, com opção de remover.
- **Histórico de Queries**: Guarda as últimas queries executadas, com interface para reutilizar ou remover queries antigas.
- **Gestão de Múltiplas Conexões**: Permite alternar facilmente entre diferentes bases de dados e utilizadores.
- **Proteção de Segurança**: Avisos e confirmação para comandos perigosos (DROP, TRUNCATE, etc.) e para conexões remotas.
- **Nunca guarda passwords**: As passwords nunca são armazenadas em localStorage nem em disco.
- **Feedback Visual de Erros**: Destaque visual e scroll automático para mensagens de erro.
- **Botão "Limpar"**: Limpa rapidamente o campo de query e os resultados/erros.
- **Dark Mode**: Modo escuro automático e manual, com botão de alternância (🌙/☀️).
- **UI Responsiva e Moderna**: Popup redimensionável, área de resultados dinâmica, histórico junto ao botão de execução, e sugestões visuais harmoniosas.
- **Autocomplete SQL Inteligente**: Sugestões de comandos SQL, tabelas e colunas, contextuais à query e à base de dados ligada, com dropdown moderno e navegação por teclado.
- **Backend sem opções inválidas**: Limpeza das opções de ligação MySQL para evitar warnings.
- **Logo como Favicon e Ícone**: O logo da extensão aparece como favicon e ícone na barra do Chrome.

Estas melhorias tornam a extensão mais segura, produtiva e agradável de usar no dia a dia!

## 🚀 Funcionalidades

- **Interface Simples**: Popup limpo e intuitivo para inserir credenciais e queries
- **Conexão MySQL**: Suporte completo para bases de dados MySQL
- **Execução de Queries**: Execute SELECT, INSERT, UPDATE, DELETE e outras queries SQL
- **Visualização de Resultados**: Resultados apresentados em tabelas organizadas
- **Feedback Visual**: Estados de loading, sucesso e erro bem definidos
- **Armazenamento Local**: Guarda credenciais de conexão (exceto passwords) para conveniência

## 📋 Estrutura do Projeto

```
sql-client-extension/
├── manifest.json           # Configuração da extensão (Manifest V3)
├── popup.html              # Interface do popup
├── popup.css               # Estilos da interface
├── popup.js                # Lógica do frontend
├── background.js           # Script de background (mínimo)
├── assets/
│   └── logo.png            # Ícone da extensão
├── api/
│   ├── server.js           # Servidor backend Node.js
│   └── package.json        # Dependências do backend
└── README.md               # Este ficheiro
```

## 🛠️ Instalação e Configuração

### 1. Configurar o Backend

```bash
# Navegar para a pasta do backend
cd api

# Instalar dependências
npm install

# Iniciar o servidor
npm start
```

O servidor ficará disponível em `http://localhost:3000`

### 2. Instalar a Extensão no Chrome

1. Abrir o Chrome e navegar para `chrome://extensions/`
2. Ativar o "Modo de programador" (Developer mode)
3. Clicar em "Carregar extensão descompactada" (Load unpacked)
4. Selecionar a pasta raiz do projeto da extensão
5. A extensão aparecerá na barra de ferramentas

### 3. Configurar Base de Dados MySQL

Certifica-te que tens uma instância MySQL a correr e acessível. Exemplo de configuração:

```sql
-- Criar uma base de dados de teste
CREATE DATABASE test_db;
USE test_db;

-- Criar uma tabela de exemplo
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de exemplo
INSERT INTO users (name, email) VALUES
('João Silva', 'joao@example.com'),
('Maria Santos', 'maria@example.com'),
('Pedro Costa', 'pedro@example.com');
```

## 🔧 Como Usar

1. **Clicar no ícone da extensão** na barra de ferramentas
2. **Preencher os campos de conexão**:
   - Host: `localhost` (ou IP do servidor MySQL)
   - Port: `3306` (ou porta personalizada)
   - Database: Nome da base de dados
   - Username: Utilizador MySQL
   - Password: Password (opcional)
3. **Escrever a query SQL** no campo de texto
4. **Clicar em "Execute Query"**
5. **Ver os resultados** na área abaixo

### Exemplos de Queries

```sql
-- Listar todos os utilizadores
SELECT * FROM users;

-- Buscar utilizador específico
SELECT * FROM users WHERE name LIKE '%João%';

-- Inserir novo utilizador
INSERT INTO users (name, email) VALUES ('Ana Pereira', 'ana@example.com');

-- Atualizar utilizador
UPDATE users SET email = 'joao.silva@example.com' WHERE id = 1;

-- Mostrar estrutura da tabela
DESCRIBE users;

-- Listar todas as tabelas
SHOW TABLES;
```

## 🔐 Segurança

⚠️ **Aviso Importante**: Esta extensão foi criada para desenvolvimento e uso local. Para uso em produção:

- Nunca exponhas credenciais em código
- Utiliza variáveis de ambiente para informações sensíveis
- Considera implementar autenticação adequada
- Usa HTTPS em ambientes de produção

## 🛠️ Desenvolvimento

### Dependências do Backend

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.5",
  "cors": "^2.8.5"
}
```

### Scripts Disponíveis

```bash
# Iniciar servidor
npm start

# Desenvolvimento com auto-reload
npm run dev

# Instalar dependências
npm run install-deps
```

### Estrutura da API

**POST /query**

```json
{
  "host": "localhost",
  "port": 3306,
  "database": "test_db",
  "username": "root",
  "password": "password",
  "query": "SELECT * FROM users"
}
```

**Resposta de Sucesso (SELECT)**

```json
{
  "type": "select",
  "data": [...],
  "rowCount": 3,
  "fields": [...]
}
```

**Resposta de Sucesso (INSERT/UPDATE/DELETE)**

```json
{
  "type": "modify",
  "affectedRows": 1,
  "insertId": 4,
  "message": "Query executed successfully. 1 row(s) affected."
}
```

## 🚦 Arranque Automático do Backend com PM2

Para que o servidor backend arranque automaticamente sempre que inicias o computador (sem precisares de correr `npm start` manualmente), podes usar o [PM2](https://pm2.keymetrics.io/):

```bash
# Instalar o PM2 globalmente (apenas uma vez)
npm install -g pm2

# Na pasta do backend (api), iniciar o servidor com PM2
cd api
pm2 start server.js --name sql-client-backend

# Guardar o estado atual dos processos do PM2
pm2 save
```

### Arranque automático no Windows

Para restaurar automaticamente o backend após reiniciar o Windows:

1. Cria um ficheiro chamado `pm2-resurrect.bat` com o seguinte conteúdo:
   ```bat
   pm2 resurrect
   ```
2. Move esse ficheiro para a pasta de arranque do Windows:
   ```powershell
   Move-Item -Path "CAMINHO\pm2-resurrect.bat" -Destination "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
   ```
   (ou copia manualmente para `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`)

Assim, o backend Node.js será restaurado automaticamente sempre que iniciares o computador.

---

## 🐛 Troubleshooting

### Problemas Comuns

1. **"Connection refused"**

   - Verificar se o MySQL está a correr
   - Confirmar host e porta corretos

2. **"Access denied"**

   - Verificar username e password
   - Confirmar permissões do utilizador MySQL

3. **"Database doesn't exist"**

   - Verificar se a base de dados foi criada
   - Confirmar nome da base de dados

4. **"Extension doesn't load"**
   - Ativar modo de programador no Chrome
   - Verificar erros na consola de extensões

### Logs do Servidor

O servidor mostra logs detalhados no terminal:

```bash
🚀 SQL Client Backend Server running on http://localhost:3000
📊 Ready to accept SQL queries from Chrome extension
```

## 📝 Licença

Este projeto está sob a licença MIT. Ver ficheiro LICENSE para mais detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Criar branch para a feature (`git checkout -b feature/amazing-feature`)
3. Commit das alterações (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📞 Suporte

Para dúvidas ou problemas:

- Abrir issue no repositório
- Verificar logs do servidor backend
- Consultar documentação do MySQL
