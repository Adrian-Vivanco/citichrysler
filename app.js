const express = require('express');
const bodyParser = require('body-parser');
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

// Configurar body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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


//MODULO DEL ADMINISTRADOR
//INSERTAR VENDEDOR 
app.post('/Administrador/procesar_formulario', (req, res) => {
    
    const { Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol } = req.body;

    console.log('Datos recibidos del formulario:');
    console.log('Nombre:', Nombre);
    console.log('Apellido Paterno:', A_Paterno);
    console.log('Apellido Materno:', A_Materno);
    console.log('Email:', Email);
    console.log('Teléfono:', Telefono);
    console.log('Nombre de Usuario:', Username);
    console.log('Contraseña:', Password);
    console.log('ID Rol:', ID_Rol);

    connection.query('INSERT INTO vendedor (Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol, Fecha_Alta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())', [Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol], (error, results) => {
        if (error) {
            console.error('Error al insertar vendedor en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Vendedor registrado exitosamente en la base de datos');
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
            if (vendedor.Foto !== null) {
                vendedor.Foto = Buffer.from(vendedor.Foto, 'binary').toString('base64');
            }
        });
        res.json(results);
    });
});

// ELIMINAR VENDEDOR
app.delete('/eliminar_vendedor/:id', (req, res) => {
    const vendedorId = req.params.id;

    connection.query('DELETE FROM vendedor WHERE ID_Vendedor = ?', vendedorId, (error, results) => {
        if (error) {
            console.error('Error al eliminar vendedor:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        console.log(`Vendedor con ID ${vendedorId} eliminado exitosamente`);

        // Envía una respuesta JSON indicando que el vendedor ha sido eliminado exitosamente
        return res.status(200).json({ message: `Vendedor con ID ${vendedorId} eliminado exitosamente` });
    });
});

// ACTUALIZAR DATOS DEL VENDEDOR
app.put('/actualizar_vendedor/:id', (req, res) => {
    const vendedorId = req.params.id;
    const { Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol } = req.body;

    connection.query('UPDATE vendedor SET Nombre=?, A_Paterno=?, A_Materno=?, Email=?, Telefono=?, Username=?, Password=?, ID_Rol=? WHERE ID_Vendedor=?',
        [Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol, vendedorId],
        (error, results) => {
            if (error) {
                console.error('Error al actualizar vendedor:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            console.log(`Vendedor con ID ${vendedorId} actualizado exitosamente`);

            return res.status(200).json({ message: `Vendedor con ID ${vendedorId} actualizado exitosamente` });
        });
});










//MODULO DEL VENDEDOR
//CONSULTAR CITAS
app.get('/consultar_citas', (req, res) => {
    connection.query(`
        SELECT 
            c.ID_Cita, 
            c.Asunto, 
            CONCAT(u.Nombre, ' ', u.A_Paterno, ' ', u.A_Materno) AS Nombre_Usuario,
            CONCAT(v.Nombre, ' ', v.A_Paterno, ' ', v.A_Materno) AS Nombre_Vendedor, 
            ce.Estado AS Estado_Cita, 
            ca.Asistencia_Estado AS Asistencia_Cita, 
            cp.Pioridad AS Pioridad_Cita, 
            d.Prueba_Manejo, 
            d.Comprobante_Domicilio, 
            d.Identificacion_Oficial, 
            d.Cotizacion, 
            c.Fecha_Cita, 
            c.Fecha_Alta
        FROM 
            citas c
        LEFT JOIN 
            usuario u ON c.ID_Usuario = u.ID_Usuario
        LEFT JOIN 
            vendedor v ON c.ID_Vendedor = v.ID_Vendedor
        LEFT JOIN 
            cita_estado ce ON c.ID_Cita_Estado = ce.ID_Cita_Estado
        LEFT JOIN 
            cita_asistencia ca ON c.ID_Cita_Asistencia = ca.ID_Cita_Asistencia
        LEFT JOIN 
            cita_pioridad cp ON c.ID_Cita_Pioridad = cp.ID_Cita_Pioridad
        LEFT JOIN 
            documentos d ON c.ID_Documentos = d.ID_Documentos
            WHERE
            c.ID_Vendedor IS NULL
    `, (error, results) => {
        if (error) {
            console.error('Error al consultar citas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        res.json(results);
    });
});













//VALIDACIÓN DE VENDEDOR ACTUAL
// Ruta para obtener los datos del vendedor actualmente autenticado
app.get('/obtener_datos_vendedor_actual', (req, res) => {
    const vendedorId = req.session.vendedorId; // Obtener el ID del vendedor de la sesión

    // Consultar la base de datos para obtener los datos del vendedor actual
    connection.query('SELECT * FROM vendedor WHERE ID_Vendedor = ?', vendedorId, (error, results) => {
        if (error) {
            console.error('Error al obtener los datos del vendedor:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        // Devolver los datos del vendedor como respuesta
        res.json(results[0]);
    });
});












//LOGIN
app.post('/login', (req, res) => {
    const { Username, Password } = req.body;

    connection.query('SELECT ID_Rol FROM vendedor WHERE Username = ? AND Password = ?', [Username, Password], (error, results) => {
        if (error) {
            console.error('Error al verificar el inicio de sesión del vendedor:', error);
            return res.status(500).send('Error interno del servidor');
        }

        if (results.length > 0) {
            if (results[0].ID_Rol === 2) {
                return res.redirect('/Vendedor');
            }
            if (results[0].ID_Rol === 1) {
                return res.redirect('/Administrador');
            }
        }

        connection.query('SELECT ID_Rol FROM usuario WHERE Username = ? AND Password = ?', [Username, Password], (error, results) => {
            if (error) {
                console.error('Error al verificar el inicio de sesión del usuario:', error);
                return res.status(500).send('Error interno del servidor');
            }

            if (results.length > 0) {
                if (results[0].ID_Rol === 3) {
                    return res.redirect('/Usuario');
                }
                if (results[0].ID_Rol === 1) {
                    return res.redirect('/Administrador');
                }
            }

            return res.send('Usuario o contraseña incorrectos');
        });
    });
});

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
