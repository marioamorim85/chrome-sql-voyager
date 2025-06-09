
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: ['chrome-extension://*', 'http://localhost:*'],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

// Main query endpoint
app.post('/query', async (req, res) => {
    const { host, port, database, username, password, query } = req.body;
    
    console.log('Received query request:', {
        host,
        port,
        database,
        username,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
    });

    // Validate required fields
    if (!host || !database || !username || !query) {
        return res.status(400).json({
            error: 'Missing required fields: host, database, username, and query are required'
        });
    }

    let connection;
    
    try {
        // Create MySQL connection
        connection = await mysql.createConnection({
            host: host,
            port: port || 3306,
            user: username,
            password: password || '',
            database: database,
            timeout: 10000, // 10 second timeout
            acquireTimeout: 10000,
            reconnect: true
        });

        console.log('Connected to MySQL database');

        // Execute the query
        const [rows, fields] = await connection.execute(query);
        
        console.log('Query executed successfully, rows:', Array.isArray(rows) ? rows.length : 'non-array result');

        // Determine query type based on the first word
        const queryType = query.trim().toLowerCase().split(/\s+/)[0];
        let result;

        if (queryType === 'select' || queryType === 'show' || queryType === 'describe' || queryType === 'desc') {
            // For SELECT queries, return the data
            result = {
                type: 'select',
                data: rows,
                rowCount: rows.length,
                fields: fields.map(field => ({
                    name: field.name,
                    type: field.type,
                    table: field.table
                }))
            };
        } else {
            // For INSERT, UPDATE, DELETE queries, return execution info
            result = {
                type: 'modify',
                affectedRows: rows.affectedRows,
                insertId: rows.insertId,
                info: rows.info,
                message: `Query executed successfully. ${rows.affectedRows} row(s) affected.`
            };
        }

        res.json(result);

    } catch (error) {
        console.error('Database error:', error);
        
        let errorMessage = 'Database error occurred';
        
        if (error.code) {
            switch (error.code) {
                case 'ECONNREFUSED':
                    errorMessage = `Connection refused. Make sure MySQL is running on ${host}:${port || 3306}`;
                    break;
                case 'ER_ACCESS_DENIED_ERROR':
                    errorMessage = 'Access denied. Check your username and password.';
                    break;
                case 'ER_BAD_DB_ERROR':
                    errorMessage = `Database '${database}' doesn't exist.`;
                    break;
                case 'ER_PARSE_ERROR':
                    errorMessage = 'SQL syntax error in your query.';
                    break;
                case 'ER_NO_SUCH_TABLE':
                    errorMessage = 'Table doesn\'t exist.';
                    break;
                case 'ETIMEDOUT':
                    errorMessage = 'Connection timeout. Check your host and port.';
                    break;
                default:
                    errorMessage = `${error.code}: ${error.message}`;
            }
        } else {
            errorMessage = error.message;
        }

        res.status(400).json({
            error: errorMessage,
            code: error.code,
            sqlState: error.sqlState
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.end();
                console.log('Database connection closed');
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /health - Health check',
            'POST /query - Execute SQL query'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SQL Client Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Ready to accept SQL queries from Chrome extension`);
    console.log(`🔗 Available endpoints:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   POST /query  - Execute SQL query`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Graceful shutdown...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
    process.exit(0);
});
