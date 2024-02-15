const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const path = require('path');


const app = express();
const server = http.createServer(app);

// Configurar la conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ultraninja75',
    database: 'citichrysler'
});

// Middleware para servir archivos estáticos desde las carpetas 'views' y 'Controller'
app.use(express.static('views'));
app.use(express.static('Controller'));
app.use(express.static('Model'));

// Parsear el cuerpo de las solicitudes con datos JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para servir el archivo HTML del índice general
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para manejar las solicitudes de inicio de sesión
app.post('/login', (req, res) => {
    const { Username, Password } = req.body;

    // Verificar en la tabla vendedor si el usuario existe y obtener su rol
    connection.query('SELECT ID_Rol FROM vendedor WHERE Username = ? AND Password = ?', [Username, Password], (error, results) => {
        if (error) {
            console.error('Error al verificar el inicio de sesión del vendedor:', error);
            return res.status(500).send('Error interno del servidor');
        }

        if (results.length > 0) {
            // Si el usuario es un usuario normal, redirigirlo a la página del usuario
            if (results[0].ID_Rol === 2) {
                return res.redirect('/Vendedor');
            }
            // Si el usuario es un administrador, redirigirlo a la página del administrador
            if (results[0].ID_Rol === 1) {
                return res.redirect('/Administrador');
            }
        }

        // Si el usuario no es un vendedor, verificar en la tabla usuario
        connection.query('SELECT ID_Rol FROM usuario WHERE Username = ? AND Password = ?', [Username, Password], (error, results) => {
            if (error) {
                console.error('Error al verificar el inicio de sesión del usuario:', error);
                return res.status(500).send('Error interno del servidor');
            }

            if (results.length > 0) {
                // Si el usuario es un usuario normal, redirigirlo a la página del usuario
                if (results[0].ID_Rol === 3) {
                    return res.redirect('/Usuario');
                }
                // Si el usuario es un administrador, redirigirlo a la página del administrador
                if (results[0].ID_Rol === 1) {
                    return res.redirect('/Administrador');
                }
            }

            // Si el usuario no existe o la contraseña es incorrecta, mostrar un mensaje de error
            return res.send('Usuario o contraseña incorrectos');
        });
    });
});

// Rutas para servir las páginas HTML de cada tipo de usuario
app.get('/Administrador', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Administrador', 'index.html'));
});

app.get('/Usuario', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Usuario', 'index.html'));
});

app.get('/Vendedor', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Vendedor', 'index.html'));
});

// Configurar el servidor estático
app.use(express.static('public'));

// Conectar a la base de datos MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos MySQL:', err);
    } else {
        console.log('Conexión exitosa a la base de datos MySQL');
        // Iniciar el servidor después de la conexión exitosa a la base de datos
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Servidor en ejecución en http://localhost:${PORT}`);
        });
    }
});
