document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('connectionForm');
    const executeBtn = document.getElementById('executeBtn');
    const btnText = document.querySelector('.btn-text');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const resultsSection = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const errorSection = document.getElementById('error');
    const errorContent = document.getElementById('errorContent');
    const loadDatabasesBtn = document.getElementById('loadDatabasesBtn');
    const databaseDropdown = document.getElementById('databaseDropdown');
    const databaseInput = document.getElementById('database');
    const errorMsg = document.getElementById('databaseErrorMsg');
    const btnIcon = loadDatabasesBtn.querySelector('.btn-icon');
    const spinner = loadDatabasesBtn.querySelector('.spinner');

    // Load saved values from localStorage
    loadSavedValues();
    // Load and render query history
    renderQueryHistory();
    // Load and render connections
    renderConnections();

    // --- MULTIPLE CONNECTIONS LOGIC ---
    function getConnectionKey() {
        // Use host, port, database, username as a unique key
        return [
            document.getElementById('host').value.trim(),
            document.getElementById('port').value.trim(),
            document.getElementById('database').value.trim(),
            document.getElementById('username').value.trim()
        ].join(':');
    }

    function saveConnection() {
        const conn = {
            host: document.getElementById('host').value.trim(),
            port: document.getElementById('port').value.trim(),
            database: document.getElementById('database').value.trim(),
            username: document.getElementById('username').value.trim()
        };
        if (!conn.host || !conn.port || !conn.database || !conn.username) return;
        let connections = JSON.parse(localStorage.getItem('sqlClientConnections') || '[]');
        // Remove duplicates
        connections = connections.filter(c =>
            !(c.host === conn.host && c.port === conn.port && c.database === conn.database && c.username === conn.username)
        );
        connections.unshift(conn);
        if (connections.length > 10) connections = connections.slice(0, 10);
        localStorage.setItem('sqlClientConnections', JSON.stringify(connections));
        renderConnections();
    }

    function renderConnections() {
        let connections = JSON.parse(localStorage.getItem('sqlClientConnections') || '[]');
        let container = document.getElementById('connectionsList');
        if (!container) return;
        container.innerHTML = '';
        if (connections.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        connections.forEach((c, idx) => {
            const item = document.createElement('div');
            item.className = 'connection-item';
            item.textContent = `${c.username}@${c.host}:${c.port}/${c.database}`;
            item.title = item.textContent;
            item.tabIndex = 0;
            item.addEventListener('click', () => {
                document.getElementById('host').value = c.host;
                document.getElementById('port').value = c.port;
                document.getElementById('database').value = c.database;
                document.getElementById('username').value = c.username;
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    document.getElementById('host').value = c.host;
                    document.getElementById('port').value = c.port;
                    document.getElementById('database').value = c.database;
                    document.getElementById('username').value = c.username;
                }
            });
            // Botão para remover
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-connection-btn';
            removeBtn.textContent = '✕';
            removeBtn.title = 'Remover conexão';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                connections.splice(idx, 1);
                localStorage.setItem('sqlClientConnections', JSON.stringify(connections));
                renderConnections();
            });
            item.appendChild(removeBtn);
            container.appendChild(item);
        });
    }

    // Load and render query history
    renderQueryHistory();

    // --- SEGURANÇA: Avisos e bloqueio de comandos perigosos ---
    function isDangerousQuery(query) {
        // Regex para comandos perigosos (case-insensitive, ignora espaços antes do comando)
        return /(^|\s)(DROP\s+DATABASE|DROP\s+TABLE|TRUNCATE\s+TABLE|ALTER\s+USER|GRANT\s+ALL|DELETE\s+FROM\s+\w+\s*;?\s*$)/i.test(query.trim());
    }

    function showSecurityWarning(message, onConfirm) {
        if (window.confirm(message + '\n\nTens a certeza que queres continuar?')) {
            onConfirm();
        } else {
            setLoadingState(false);
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Save form values (NUNCA guarda password)
        saveFormValues();
        // Save query to history
        saveQueryToHistory(document.getElementById('query').value.trim());
        // Show loading state
        setLoadingState(true);
        hideResults();
        const formData = {
            host: document.getElementById('host').value.trim(),
            port: parseInt(document.getElementById('port').value) || 3306,
            database: document.getElementById('database').value.trim(),
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value, // password só em memória
            query: document.getElementById('query').value.trim()
        };
        // Aviso de segurança se não for localhost
        if (formData.host !== 'localhost' && formData.host !== '127.0.0.1') {
            showSecurityWarning('Atenção: Estás a conectar a um host remoto (' + formData.host + '). Certifica-te que confias neste servidor.', () => submitQuery(formData));
            return;
        }
        // Bloqueio/Confirmação para comandos perigosos
        if (isDangerousQuery(formData.query)) {
            showSecurityWarning('Comando SQL potencialmente perigoso detectado: ' + formData.query, () => submitQuery(formData));
            return;
        }
        // Normal
        submitQuery(formData);
    });

    async function submitQuery(formData) {
        try {
            console.log('Sending query request:', { ...formData, password: '***' });
            const response = await fetch('http://localhost:3000/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            console.log('Received response:', result);
            if (response.ok) {
                showResults(result);
            } else {
                showError(result.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Request failed:', error);
            showError(`Connection failed: ${error.message}\n\nMake sure the backend server is running on http://localhost:3000`);
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(loading) {
        executeBtn.disabled = loading;
        if (loading) {
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'inline';
        } else {
            btnText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
        }
    }

    function hideResults() {
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
    }

    function showResults(result) {
        errorSection.style.display = 'none';
        resultsSection.style.display = 'block';

        if (result.type === 'select' && result.data && result.data.length > 0) {
            // Show table for SELECT queries
            const table = createTable(result.data);
            resultsContent.innerHTML = '';
            resultsContent.appendChild(table);
        } else if (result.type === 'modify') {
            // Show success message for INSERT/UPDATE/DELETE
            resultsContent.innerHTML = `
                <div class="success-message">
                    Query executed successfully!
                    ${result.affectedRows !== undefined ? `\nAffected rows: ${result.affectedRows}` : ''}
                    ${result.insertId !== undefined ? `\nInsert ID: ${result.insertId}` : ''}
                </div>
            `;
        } else {
            resultsContent.innerHTML = '<div class="success-message">Query executed successfully!</div>';
        }
        // Ajusta dinamicamente a altura do popup conforme o conteúdo dos resultados
        setTimeout(() => {
            const minHeight = 420;
            const maxHeight = 900;
            const extra = resultsSection.scrollHeight + 60;
            const newHeight = Math.max(minHeight, Math.min(extra, maxHeight));
            window.resizeTo(window.outerWidth, newHeight);
            resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Placeholder dinâmico
    const queryInput = document.getElementById('query');
    queryInput.addEventListener('input', function() {
        const value = queryInput.value.trim().toUpperCase();
        if (value.startsWith('SELECT')) {
            queryInput.placeholder = 'Ex: SELECT * FROM users;';
        } else if (value.startsWith('INSERT')) {
            queryInput.placeholder = 'Ex: INSERT INTO users (name, email) VALUES ("Ana", "ana@email.com");';
        } else if (value.startsWith('UPDATE')) {
            queryInput.placeholder = 'Ex: UPDATE users SET name = "Novo Nome" WHERE id = 1;';
        } else if (value.startsWith('DELETE')) {
            queryInput.placeholder = 'Ex: DELETE FROM users WHERE id = 1;';
        } else {
            queryInput.placeholder = 'SELECT * FROM table_name LIMIT 10;';
        }
    });

    // Botão Limpar Query
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = 'Limpar';
    clearBtn.className = 'clear-query-btn';
    clearBtn.style.marginLeft = '8px';
    queryInput.parentNode.appendChild(clearBtn);
    clearBtn.addEventListener('click', function() {
        queryInput.value = '';
        queryInput.placeholder = 'SELECT * FROM table_name LIMIT 10;';
        queryInput.focus();
        // Limpa erros e resultados
        errorSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorContent.textContent = '';
        resultsContent.innerHTML = '';
    });

    // Feedback visual para erros de conexão
    function showError(error) {
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        errorContent.textContent = error;
        errorSection.classList.add('error-highlight');
        setTimeout(() => errorSection.classList.remove('error-highlight'), 1200);
        // Scroll automático para o erro
        setTimeout(() => {
            errorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    function createTable(data) {
        const table = document.createElement('table');
        table.className = 'results-table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        if (data.length > 0) {
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value !== null ? value : 'NULL';
                if (value === null) {
                    td.style.fontStyle = 'italic';
                    td.style.color = '#999';
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    function saveFormValues() {
        const values = {
            host: document.getElementById('host').value,
            port: document.getElementById('port').value,
            database: document.getElementById('database').value,
            username: document.getElementById('username').value,
            // NUNCA guardar password
        };
        localStorage.setItem('sqlClientFormValues', JSON.stringify(values));
    }

    function loadSavedValues() {
        const saved = localStorage.getItem('sqlClientFormValues');
        if (saved) {
            try {
                const values = JSON.parse(saved);
                if (values.host) document.getElementById('host').value = values.host;
                if (values.port) document.getElementById('port').value = values.port;
                if (values.database) document.getElementById('database').value = values.database;
                if (values.username) document.getElementById('username').value = values.username;
            } catch (e) {
                console.error('Failed to load saved values:', e);
            }
        }
    }

    // Query History Logic
    function saveQueryToHistory(query) {
        if (!query) return;
        let history = JSON.parse(localStorage.getItem('sqlClientQueryHistory') || '[]');
        // Remove duplicates and keep most recent on top
        history = history.filter(q => q !== query);
        history.unshift(query);
        // Limit history to 20 items
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem('sqlClientQueryHistory', JSON.stringify(history));
        renderQueryHistory();
    }

    function renderQueryHistory() {
        let history = JSON.parse(localStorage.getItem('sqlClientQueryHistory') || '[]');
        let container = document.getElementById('queryHistory');
        if (!container) return;
        container.innerHTML = '';
        if (history.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        history.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'query-history-item';
            item.textContent = q.length > 80 ? q.slice(0, 77) + '...' : q;
            item.title = q;
            item.tabIndex = 0;
            item.addEventListener('click', (e) => {
                // Só preenche o campo se não clicar no X
                if (e.target === item) {
                    document.getElementById('query').value = q;
                }
            });
            item.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === item) {
                    document.getElementById('query').value = q;
                }
            });
            // Botão X para remover
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-query-btn';
            removeBtn.textContent = '✕';
            removeBtn.title = 'Remover query do histórico';
            removeBtn.tabIndex = 0;
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                history.splice(idx, 1);
                localStorage.setItem('sqlClientQueryHistory', JSON.stringify(history));
                renderQueryHistory();
            });
            item.appendChild(removeBtn);
            container.appendChild(item);
        });
    }

    // --- Toggle Dark Mode Button ---
    const header = document.querySelector('.header');
    const darkToggle = document.createElement('button');
    darkToggle.type = 'button';
    darkToggle.className = 'dark-toggle-btn';
    darkToggle.title = 'Alternar modo escuro/claro';
    darkToggle.innerHTML = '<span class="dark-toggle-icon" id="darkIcon">🌙</span>';
    header.appendChild(darkToggle);
    header.style.position = 'relative';
    darkToggle.style.position = 'absolute';
    darkToggle.style.right = '16px';
    darkToggle.style.top = '50%';
    darkToggle.style.transform = 'translateY(-50%)';

    function updateDarkIcon() {
        const icon = document.getElementById('darkIcon');
        if (document.body.classList.contains('dark-mode')) {
            icon.textContent = '☀️';
            darkToggle.title = 'Modo claro';
        } else {
            icon.textContent = '🌙';
            darkToggle.title = 'Modo escuro';
        }
    }

    darkToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('sqlClientDarkMode', document.body.classList.contains('dark-mode') ? '1' : '0');
        updateDarkIcon();
    });

    // Preferência do utilizador
    function setDarkMode() {
        const userPref = localStorage.getItem('sqlClientDarkMode');
        if (userPref === '1') {
            document.body.classList.add('dark-mode');
        } else if (userPref === '0') {
            document.body.classList.remove('dark-mode');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        updateDarkIcon();
    }
    setDarkMode();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setDarkMode);

    loadDatabasesBtn.addEventListener('click', async function() {
        // Limpa mensagens e prepara UI
        errorMsg.textContent = '';
        databaseDropdown.innerHTML = '';
        databaseDropdown.style.display = 'none';
        databaseDropdown.style.opacity = 0;
        databaseInput.style.display = '';
        databaseInput.style.opacity = 1;
        btnIcon.style.display = 'none';
        spinner.style.display = '';
        loadDatabasesBtn.disabled = true;
        // --- Fix: Set dropdown width/height to match input exatamente (incluindo largura computada) ---
        const inputRect = databaseInput.getBoundingClientRect();
        const inputStyle = window.getComputedStyle(databaseInput);
        databaseDropdown.style.width = inputRect.width + 'px';
        databaseDropdown.style.minWidth = inputRect.width + 'px';
        databaseDropdown.style.maxWidth = inputRect.width + 'px';
        databaseDropdown.style.height = inputRect.height + 'px';
        databaseDropdown.style.minHeight = inputRect.height + 'px';
        databaseDropdown.style.maxHeight = inputRect.height + 'px';
        databaseDropdown.style.boxSizing = inputStyle.boxSizing;
        // Placeholder de loading
        const loadingOption = document.createElement('option');
        loadingOption.textContent = 'A carregar...';
        loadingOption.disabled = true;
        loadingOption.selected = true;
        databaseDropdown.appendChild(loadingOption);
        databaseDropdown.style.display = '';
        databaseDropdown.style.opacity = 1;
        databaseInput.style.opacity = 0.5;
        const host = document.getElementById('host').value.trim();
        const port = document.getElementById('port').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!host || !port || !username) {
            errorMsg.textContent = 'Preenche host, port e username primeiro!';
            btnIcon.style.display = '';
            spinner.style.display = 'none';
            loadDatabasesBtn.disabled = false;
            databaseDropdown.style.display = 'none';
            databaseInput.style.opacity = 1;
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host, port, username, password })
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data.databases)) {
                databaseDropdown.innerHTML = '';
                data.databases.forEach(db => {
                    const option = document.createElement('option');
                    option.value = db;
                    option.textContent = db;
                    databaseDropdown.appendChild(option);
                });
                // --- Fix: Set dropdown width/height to match input novamente (em caso de redimensionamento) ---
                const inputRect2 = databaseInput.getBoundingClientRect();
                const inputStyle2 = window.getComputedStyle(databaseInput);
                databaseDropdown.style.width = inputRect2.width + 'px';
                databaseDropdown.style.minWidth = inputRect2.width + 'px';
                databaseDropdown.style.maxWidth = inputRect2.width + 'px';
                databaseDropdown.style.height = inputRect2.height + 'px';
                databaseDropdown.style.minHeight = inputRect2.height + 'px';
                databaseDropdown.style.maxHeight = inputRect2.height + 'px';
                databaseDropdown.style.boxSizing = inputStyle2.boxSizing;
                databaseDropdown.style.display = '';
                databaseDropdown.style.opacity = 1;
                databaseInput.style.opacity = 0;
                // Seleciona o valor atual se existir
                const current = databaseInput.value.trim();
                if (current) databaseDropdown.value = current;
                databaseDropdown.onchange = function() {
                    databaseInput.value = databaseDropdown.value;
                };
                // Atualiza input ao selecionar
                databaseInput.value = databaseDropdown.value;
            } else {
                throw new Error(data.error || 'Erro ao carregar bases de dados');
            }
        } catch (err) {
            errorMsg.textContent = 'Erro ao carregar bases de dados: ' + err.message;
            databaseDropdown.style.display = 'none';
            databaseDropdown.style.opacity = 0;
            databaseInput.style.display = '';
            databaseInput.style.opacity = 1;
        } finally {
            btnIcon.style.display = '';
            spinner.style.display = 'none';
            loadDatabasesBtn.disabled = false;
        }
    });
});
