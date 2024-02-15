// model/vendedor_model_registro.js

const connection = require('../database/connection');

function insertarVendedor(datosVendedor, callback) {
    const { nombre, apaterno, amaterno, id_rol, email, telefono, foto, username, password } = datosVendedor;
    connection.query(
        'INSERT INTO vendedor (Nombre, A_Paterno, A_Materno, ID_Rol, Email, Telefono, Foto, Username, Password, Fecha_Alta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [nombre, apaterno, amaterno, id_rol, email, telefono, foto, username, password],
        (error, results) => {
            callback(error, results);
        }
    );
}

module.exports = {
    insertarVendedor
};
