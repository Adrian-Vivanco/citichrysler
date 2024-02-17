document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar el formulario y el botón de registro
    const formularioRegistro = document.getElementById('registroForm');
    const btnRegistrar = document.getElementById('btnRegistrar');

    // Agregar evento click al botón de registro
    btnRegistrar.addEventListener('click', function(event) {
        event.preventDefault();

        // Obtener los datos del formulario
        const nombre = document.getElementById('nombre').value;
        const apaterno = document.getElementById('apaterno').value;
        const amaterno = document.getElementById('amaterno').value;
        const id_rol = document.getElementById('rol').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const foto = document.getElementById('foto').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Realizar la inserción en la base de datos
        fetch('/registrar-vendedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                apaterno: apaterno,
                amaterno: amaterno,
                id_rol: id_rol,
                email: email,
                telefono: telefono,
                foto: foto,
                username: username,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al registrar el vendedor');
            }
            return response.text();
        })
        .then(data => {
            console.log(data); // Manejar la respuesta del servidor, por ejemplo, mostrar un mensaje de éxito
            alert('Vendedor registrado exitosamente');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al registrar el vendedor');
        });
    });
});
