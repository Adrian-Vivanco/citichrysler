const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const argon2 = require('argon2');
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

//configuración de express-sesion

app.use(session({
    secret: 'tu_secreto',
    resave: false,
    saveUninitialized: true
}));



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
app.post('/Administrador/procesar_formulario', async (req, res) => {
    const { Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol } = req.body;
    const imagenBase64 = req.body.Foto; // Capturando la imagen en base64 desde el formulario

    // Convertir la imagen base64 a un buffer
    const imageBuffer = Buffer.from(imagenBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    console.log('Datos recibidos del formulario:');
    console.log('Nombre:', Nombre);
    console.log('Apellido Paterno:', A_Paterno);
    console.log('Apellido Materno:', A_Materno);
    console.log('Email:', Email);
    console.log('Teléfono:', Telefono);
    console.log('Nombre de Usuario:', Username);
    console.log('Contraseña:', Password);
    console.log('ID Rol:', ID_Rol);
    console.log('Imagen:', imagenBase64); // Solo para verificar que la imagen se recibe correctamente

    try {
        // Encriptar la contraseña utilizando Argon2
        const hashedPassword = await argon2.hash(Password);

        // Verificar si el correo electrónico ya está registrado
        connection.query('SELECT * FROM vendedor WHERE Email = ? LIMIT 1', [Email], async (error, results) => {
            if (error) {
                console.error('Error al verificar correo electrónico en la base de datos:', error);
                return res.status(500).send('Error interno del servidor');
            }

            if (results.length > 0) {
                console.log('El correo electrónico ya está registrado');
                return res.status(400).send('El correo electrónico ya está registrado');
            }

            // Verificar si el nombre de usuario ya está registrado
            connection.query('SELECT * FROM vendedor WHERE Username = ? LIMIT 1', [Username], async (error, results) => {
                if (error) {
                    console.error('Error al verificar nombre de usuario en la base de datos:', error);
                    return res.status(500).send('Error interno del servidor');
                }

                if (results.length > 0) {
                    console.log('El nombre de usuario ya está en uso');
                    return res.status(400).send('El nombre de usuario ya está en uso');
                }

                // Si el correo electrónico y el nombre de usuario no están registrados, insertar el nuevo vendedor
                connection.query('INSERT INTO vendedor (Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol, Foto, Fecha_Alta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                    [Nombre, A_Paterno, A_Materno, Email, Telefono, Username, hashedPassword, ID_Rol, imageBuffer],
                    (error, results) => {
                        if (error) {
                            console.error('Error al insertar vendedor en la base de datos:', error);
                            return res.status(500).send('Error interno del servidor');
                        }
                        console.log('Vendedor registrado exitosamente en la base de datos');
                        return res.status(200).send('Vendedor registrado exitosamente');
                    }
                );
            });
        });
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        return res.status(500).send('Error interno del servidor');
    }
});



//CONSULTAR VENDEDORES
app.get('/consultar_vendedores', (req, res) => {
    connection.query('SELECT * FROM vendedor WHERE ID_Rol = 2', (error, results) => {
        if (error) {
            console.error('Error al consultar vendedores:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        // CONVERTIR IMAGEN A BASE64
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

//CONSULTAR CITAS ASIGNADAS DEL VENDEDOR
app.get('/consultar_citas_por_vendedor', (req, res) => {
    const vendedorId = req.query.id; // Obtener el ID del vendedor de la consulta HTTP

    // Verificar que el ID del vendedor esté presente
    if (!vendedorId) {
        return res.status(400).json({ error: 'ID de vendedor no proporcionado' });
    }

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
            c.ID_Vendedor = ?
    `, [vendedorId], (error, results) => {
        if (error) {
            console.error('Error al consultar citas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        res.json(results);
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



//CONSULTAR CITAS POR VENDEDOR
// Obtener citas del vendedor actual
app.get('/consultar_citas_vendedor', (req, res) => {
    if (req.session.user) {
        const vendedorId = req.session.user.ID_Vendedor;

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
                c.ID_Vendedor = ?
        `, [vendedorId], (error, results) => {
            if (error) {
                console.error('Error al consultar citas del vendedor:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            res.json(results);
        });
    } else {
        res.status(401).send('No se ha iniciado sesión');
    }
});


// MIS DATOS EN MI CUENTA
app.get('/obtener_datos_vendedor_actual', (req, res) => {
    if (req.session.user) {
        const vendedorId = req.session.user.ID_Vendedor;

        connection.query('SELECT * FROM vendedor WHERE ID_Vendedor = ?', [vendedorId], (error, results) => {
            if (error) {
                console.error('Error al obtener los datos del vendedor:', error);
                return res.status(500).send('Error interno del servidor');
            }

            if (results.length > 0) {
                res.json(results[0]); // Devolver los datos del vendedor actualmente autenticado
            } else {
                res.status(404).send('Datos del vendedor no encontrados');
            }
        });
    } else {
        res.status(401).send('No se ha iniciado sesión');
    }
});


//VENDEDOR TOMA CITA
app.post('/Vendedor/tomar_cita', (req, res) => {
    const idVendedor = req.session.user.ID_Vendedor; 
    const idCita = req.body.idCita; 

    connection.query('UPDATE citas SET ID_Vendedor = ? WHERE ID_Cita = ?', [idVendedor, idCita], (error, results) => {
        if (error) {
            console.error('Error al tomar la cita:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Cita tomada exitosamente');
        return res.status(200).send('Cita tomada exitosamente');
    });
});

//VENDEDOR DEJAR CITA
app.post('/Vendedor/dejar_cita', (req, res) => {
    const idVendedor = req.session.user.ID_Vendedor;
    const idCita = req.body.idCita;

    connection.query('UPDATE citas SET ID_Vendedor = NULL WHERE ID_Cita = ? AND ID_Vendedor = ?', [idCita, idVendedor], (error, results) => {
        if (error) {
            console.error('Error al dejar la cita:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Cita dejada exitosamente');
        return res.status(200).send('Cita dejada exitosamente');
    });
});

//VENDEDOR CAMBIAR ESTADO DE CITA
app.put('/cambiar_estado_cita/:idCita/:nuevoEstado', (req, res) => {
    const idCita = req.params.idCita;
    const nuevoEstado = req.params.nuevoEstado;

    connection.query('UPDATE citas SET ID_Cita_Estado = ? WHERE ID_Cita = ?', [nuevoEstado, idCita], (error, results) => {
        if (error) {
            console.error('Error al cambiar el estado de la cita:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Estado de la cita cambiado exitosamente');
        return res.status(200).send('Estado de la cita cambiado exitosamente');
    });
});

// VENDEDOR CAMBIAR ASISTENCIA DE CITA
app.put('/cambiar_asistencia_cita/:idCita/:nuevaAsistencia', (req, res) => {
    const idCita = req.params.idCita;
    const nuevaAsistencia = req.params.nuevaAsistencia;

    connection.query('UPDATE citas SET ID_Cita_Asistencia = ? WHERE ID_Cita = ?', [nuevaAsistencia, idCita], (error, results) => {
        if (error) {
            console.error('Error al cambiar la asistencia de la cita:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Asistencia de la cita cambiada exitosamente');
        return res.status(200).send('Asistencia de la cita cambiada exitosamente');
    });
});



// VENDEDOR CAMBIA FECHA DE CITA
app.put('/modificar_fecha_cita/:idCita', (req, res) => {
    const idCita = req.params.idCita;
    const nuevaFecha = req.body.nuevaFecha; // Aquí obtenemos la nueva fecha del cuerpo de la solicitud

    connection.query('UPDATE citas SET Fecha_Cita = ? WHERE ID_Cita = ?', [nuevaFecha, idCita], (error, results) => {
        if (error) {
            console.error('Error al cambiar la fecha de la cita:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Fecha de la cita cambiada exitosamente');
        return res.status(200).send('Fecha de la cita cambiada exitosamente');
    });
});




// VENDEDOR VISUALIZA DOCUMENTOS DE CITA
app.get('/obtener_documentos_cita/:idCita', (req, res) => {
    const idCita = req.params.idCita;

    connection.query(`
    SELECT 
        CONVERT(d.Prueba_Manejo USING utf8) AS Prueba_Manejo,
        CONVERT(d.Comprobante_Domicilio USING utf8) AS Comprobante_Domicilio,
        CONVERT(d.Identificacion_Oficial USING utf8) AS Identificacion_Oficial,
        CONVERT(d.Cotizacion USING utf8) AS Cotizacion
    FROM 
        citas c
    LEFT JOIN 
        documentos d ON c.ID_Documentos = d.ID_Documentos
    WHERE
        c.ID_Cita = ?
    `, [idCita], (error, results) => {
        if (error) {
            console.error('Error al obtener documentos de la cita:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        // Convertir los resultados a base64
        const documentosBase64 = {};

        // Verificar si los valores no son null antes de convertirlos a base64
        if (results[0].Prueba_Manejo !== null) {
            documentosBase64.Prueba_Manejo = Buffer.from(results[0].Prueba_Manejo).toString('base64');
        }
        if (results[0].Comprobante_Domicilio !== null) {
            documentosBase64.Comprobante_Domicilio = Buffer.from(results[0].Comprobante_Domicilio).toString('base64');
        }
        if (results[0].Identificacion_Oficial !== null) {
            documentosBase64.Identificacion_Oficial = Buffer.from(results[0].Identificacion_Oficial).toString('base64');
        }
        if (results[0].Cotizacion !== null) {
            documentosBase64.Cotizacion = Buffer.from(results[0].Cotizacion).toString('base64');
        }

        res.json(documentosBase64);
    });
});

// VENDEDOR CONSULTA POR FILTRO ESTADO
app.get('/consultar_citas_vendedor_estado/:estado', (req, res) => {
    if (req.session.user) {
        const vendedorId = req.session.user.ID_Vendedor;
        const estado = req.params.estado;

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
                c.ID_Vendedor = ? AND
                ce.Estado = ?
        `, [vendedorId, estado], (error, results) => {
            if (error) {
                console.error('Error al consultar citas del vendedor por estado:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            res.json(results);
        });
    } else {
        res.status(401).send('No se ha iniciado sesión');
    }
});


















//MÓDULO DEL USUARIO 
//CREAR CUENTA DE USUARIO
app.post('/registro_usuario_nuevo', async (req, res) => {
    const { Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password } = req.body;

    try {
        // Encriptar la contraseña con Argon2
        const hashedPassword = await argon2.hash(Password);

        // Verificar si el correo electrónico ya existe en la base de datos
        connection.query('SELECT COUNT(*) AS count FROM usuario WHERE Email = ?', [Email], async (error, results) => {
            if (error) {
                console.error('Error al verificar el correo electrónico:', error);
                return res.status(500).send('Error interno del servidor');
            }

            const count = results[0].count;
            if (count > 0) {
                console.log('El correo electrónico ya está registrado');
                return res.status(400).send('El correo electrónico ya está registrado');
            }

            // Verificar si el nombre de usuario ya está en uso
            connection.query('SELECT COUNT(*) AS count FROM usuario WHERE Username = ?', [Username], async (error, results) => {
                if (error) {
                    console.error('Error al verificar el nombre de usuario:', error);
                    return res.status(500).send('Error interno del servidor');
                }

                const count = results[0].count;
                if (count > 0) {
                    console.log('El nombre de usuario ya está en uso');
                    return res.status(400).send('El nombre de usuario ya está en uso');
                }

                // Si el correo electrónico y el nombre de usuario no están en uso, insertar la nueva cuenta de usuario en la base de datos
                connection.query('INSERT INTO usuario (Nombre, A_Paterno, A_Materno, Email, Telefono, Username, Password, ID_Rol, Fecha_Alta) VALUES (?, ?, ?, ?, ?, ?, ?, 3, NOW())', [Nombre, A_Paterno, A_Materno, Email, Telefono, Username, hashedPassword], (error, results) => {
                    if (error) {
                        console.error('Error al insertar usuario en la base de datos:', error);
                        return res.status(500).send('Error interno del servidor');
                    }
                    console.log('Cuenta creada exitosamente');
                    // Redireccionar al usuario a login.html después de insertar los datos en la base de datos
                    res.redirect('/login.html');
                });
            });
        });
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        return res.status(500).send('Error interno del servidor');
    }
});







// CONSULTAR CITAS POR USUARIO
app.get('/consultar_citas_usuario', (req, res) => {
    if (req.session.user) {
        const userId = req.session.user.ID_Usuario;

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
                c.ID_Usuario = ?
        `, [userId], (error, results) => {
            if (error) {
                console.error('Error al consultar citas del usuario:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            res.json(results);
        });
    } else {
        res.status(401).send('No se ha iniciado sesión');
    }
});



// INSERTAR CITA
app.post('/Usuario/procesar_formulario_cita', (req, res) => {
    const { Asunto, Fecha_Cita } = req.body;
    const ID_Usuario = req.session.user.ID_Usuario; 

    let ID_Cita_Prioridad = 2; // Prioridad baja por defecto
    if (req.body.ID_Documentos) {
        ID_Cita_Prioridad = 1; // Prioridad alta si hay documentos
    }

    const fechaActual = new Date();
    const fechaCita = new Date(Fecha_Cita);
    if (fechaCita <= fechaActual) {
        return res.status(400).send('La fecha de la cita debe ser posterior a la fecha actual');
    }

    const horaCita = fechaCita.getHours();
    if (horaCita < 10 || horaCita >= 18) {
        return res.status(400).send('La hora de la cita debe estar entre las 10:00 am y las 6:00 pm');
    }

    console.log('Datos recibidos del formulario de cita:');
    console.log('Asunto:', Asunto);
    console.log('Fecha de Cita:', Fecha_Cita);
    console.log('ID_Usuario:', ID_Usuario);
    console.log('ID_Cita_Prioridad:', ID_Cita_Prioridad);

    const query = 'INSERT INTO citas (Asunto, ID_Usuario, ID_Cita_Pioridad, ID_Cita_Estado, Fecha_Cita, Fecha_Alta) VALUES (?, ?, ?, 1, ?, NOW())';
    connection.query(query, [Asunto, ID_Usuario, ID_Cita_Prioridad, Fecha_Cita], (error, results) => {
        if (error) {
            console.error('Error al insertar cita en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Cita registrada exitosamente en la base de datos');
        return res.status(200).send('Cita registrada exitosamente');
    });
});




// INTERTAR DOCUMENTOS CON LA CITA
app.post('/Usuario/guardar_documentos', (req, res) => {
    const { pruebaManejo, comprobanteDomicilio, identificacionOficial, cotizacion } = req.body;
    const ID_Usuario = req.session.user.ID_Usuario;

    // Primero, insertamos los documentos
    const documentosQuery = 'INSERT INTO documentos (ID_Usuario, Prueba_Manejo, Comprobante_Domicilio, Identificacion_Oficial, Cotizacion, Fecha_Alta) VALUES (?, ?, ?, ?, ?, NOW())';
    connection.query(documentosQuery, [ID_Usuario, pruebaManejo, comprobanteDomicilio, identificacionOficial, cotizacion], (error, documentosResult) => {
        if (error) {
            console.error('Error al guardar los documentos en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }

        // Obtener el ID_Documentos generado
        const ID_Documentos = documentosResult.insertId;

        // Ahora, insertamos la cita en la tabla citas con el ID_Documentos generado y ID_Prioridad = 1
        const citaQuery = 'INSERT INTO citas (Asunto, ID_Usuario, Fecha_Cita, ID_Cita_Pioridad, ID_Documentos, Fecha_Alta) VALUES (?, ?, ?, ?, ?, NOW())';
        connection.query(citaQuery, ['Cita generada automáticamente', ID_Usuario, new Date(), 1, ID_Documentos], (error, citaResult) => {
            if (error) {
                console.error('Error al guardar la cita en la base de datos:', error);
                return res.status(500).send('Error interno del servidor');
            }

            console.log('Documentos y cita guardados exitosamente en la base de datos');
            return res.status(200).send('Documentos y cita guardados exitosamente');
        });
    });
});




// INSERTAR DOCUMENTOS CON LA CITA
app.post('/Usuario/insertar_documentos_cita', (req, res) => {
    const { pruebaManejo, comprobanteDomicilio, identificacionOficial, cotizacion, citaId } = req.body;

    // Primero, insertamos los documentos
    const documentosQuery = 'INSERT INTO documentos (Prueba_Manejo, Comprobante_Domicilio, Identificacion_Oficial, Cotizacion, Fecha_Alta) VALUES (?, ?, ?, ?, NOW())';
    connection.query(documentosQuery, [pruebaManejo, comprobanteDomicilio, identificacionOficial, cotizacion], (error, documentosResult) => {
        if (error) {
            console.error('Error al guardar los documentos en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }

        // Obtener el ID_Documentos generado
        const ID_Documentos = documentosResult.insertId;

        // Actualizamos la cita en la tabla citas con el ID_Documentos generado y ID_Prioridad = 1
        const citaUpdateQuery = 'UPDATE citas SET ID_Cita_Pioridad = 1, ID_Documentos = ? WHERE ID_Cita = ?';
        connection.query(citaUpdateQuery, [ID_Documentos, citaId], (error, updateResult) => {
            if (error) {
                console.error('Error al actualizar la cita en la base de datos:', error);
                return res.status(500).send('Error interno del servidor');
            }

            console.log('Documentos y cita actualizados exitosamente en la base de datos');
            return res.status(200).send('Documentos y cita actualizados exitosamente');
        });
    });
});








// CANCELAR CITA
app.post('/cancelar_cita', (req, res) => {
    const citaId = req.body.citaId;

    // Verificar si el campo de vendedor está vacío
    connection.query('SELECT ID_Vendedor FROM citas WHERE ID_Cita = ?', [citaId], (error, results) => {
        if (error) {
            console.error('Error al verificar la cita:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const idVendedor = results[0].ID_Vendedor;

        if (idVendedor) {
            // Si el campo de vendedor no está vacío, la cita no puede ser cancelada
            return res.status(400).json({ error: 'No se puede cancelar la cita porque está asignada a un vendedor.' });
        } else {
            // Si el campo de vendedor está vacío, la cita puede ser cancelada
            connection.query('DELETE FROM citas WHERE ID_Cita = ?', [citaId], (error, results) => {
                if (error) {
                    console.error('Error al cancelar la cita:', error);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }

                res.json({ success: true });
            });
        }
    });
});












// OBTENER DATOS DEL USUARIO INICIANDO SESIÓN
app.get('/obtener_datos_usuario_actual', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user); // Devolver los datos del usuario almacenados en la sesión
    } else {
        res.status(401).send('No se ha iniciado sesión');
    }
});






// RESTRINGIR ACCESO SI NO INICIARON SESIÓN 










//LOGIN
app.post('/login', async (req, res) => {
    const { Username, Password } = req.body;

    try {
        connection.query('SELECT * FROM vendedor WHERE Username = ?', [Username], async (error, results) => {
            if (error) {
                console.error('Error al verificar el inicio de sesión del vendedor:', error);
                return res.status(500).send('Error interno del servidor');
            }

            if (results.length > 0) {
                const vendedor = results[0];
                // Verificar si la contraseña coincidida usando Argon2
                const passwordMatched = await argon2.verify(vendedor.Password, Password);
                if (passwordMatched) {
                    req.session.user = vendedor; // Guardar datos del vendedor en la sesión
                    if (vendedor.ID_Rol === 2) {
                        return res.redirect('/Vendedor');
                    } else if (vendedor.ID_Rol === 1) {
                        return res.redirect('/Administrador');
                    }
                }
            }

            connection.query('SELECT * FROM usuario WHERE Username = ?', [Username], async (error, results) => {
                if (error) {
                    console.error('Error al verificar el inicio de sesión del usuario:', error);
                    return res.status(500).send('Error interno del servidor');
                }

                if (results.length > 0) {
                    const usuario = results[0];
                    // Verificar si la contraseña coincidida usando Argon2
                    const passwordMatched = await argon2.verify(usuario.Password, Password);
                    if (passwordMatched) {
                        req.session.user = usuario; // Guardar datos del usuario en la sesión
                        if (usuario.ID_Rol === 3) {
                            return res.redirect('/Usuario');
                        } else if (usuario.ID_Rol === 1) {
                            return res.redirect('/Administrador');
                        }
                    }
                }

                return res.send('Usuario o contraseña incorrectos');
            });
        });
    } catch (error) {
        console.error('Error al desencriptar la contraseña:', error);
        return res.status(500).send('Error interno del servidor');
    }
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
