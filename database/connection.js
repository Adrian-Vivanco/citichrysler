// database/connection.js

const mysql = require('mysql2');

// Configuración de la conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ultraninja75',
    database: 'citichrysler'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos MySQL:', err);
    } else {
        console.log('Conexión exitosa a la base de datos MySQL');
    }
});

module.exports = connection;
