
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('connectionForm');
    const executeBtn = document.getElementById('executeBtn');
    const btnText = document.querySelector('.btn-text');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const resultsSection = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const errorSection = document.getElementById('error');
    const errorContent = document.getElementById('errorContent');

    // Load saved values from localStorage
    loadSavedValues();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Save form values
        saveFormValues();
        
        // Show loading state
        setLoadingState(true);
        hideResults();
        
        const formData = {
            host: document.getElementById('host').value.trim(),
            port: parseInt(document.getElementById('port').value) || 3306,
            database: document.getElementById('database').value.trim(),
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value,
            query: document.getElementById('query').value.trim()
        };

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
    });

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
    }

    function showError(error) {
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        errorContent.textContent = error;
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
            // Note: We don't save password for security reasons
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
});
