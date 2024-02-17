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

// Middleware para servir archivos estáticos desde la carpeta 'views'
app.use(express.static(path.join(__dirname, 'views')));

// Middleware para analizar solicitudes con datos en formato JSON
app.use(express.json());

// Middleware para analizar solicitudes con datos codificados en URL
app.use(express.urlencoded({ extended: true }));

// Ruta para servir el archivo HTML del índice general
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


//INSERTAR VENDEDOR 
app.post('/Administrador/procesar_formulario', (req, res) => {
    
    const {Nombre, A_paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol } = req.body;

    connection.query('INSERT INTO vendedor (Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol, Fecha_Alta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())', [Nombre, A_paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol], (error, results) => {
        if (error) {
            console.error('Error al insertar vendedor en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        return res.status(200).send('Vendedor registrado exitosamente');
    });
    
});


//CONSULTAR VENDEDORES
app.get('/consultar_vendedores', (req, res) => {
    connection.query('SELECT * FROM vendedor WHERE ID_Rol = 2', (error, results) => {
        if (error) {
            console.error('Error al consultar vendedores:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        // Convertir la imagen a Base64
        results.forEach(vendedor => {
            vendedor.Foto = Buffer.from(vendedor.Foto, 'binary').toString('base64');
        });
        res.json(results);
    });
});










//LOGIN
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
