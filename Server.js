const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Console } = require('console');
const app = express();
const port = 80;
const db = 'mongodb+srv://reypele18:mierda@dealgo.psquqeb.mongodb.net/DatosPrivados?retryWrites=true&w=majority&appName=dealgo';
const bodyParser = require('body-parser');

var pagina = {};
let globalusuario;

mongoose.connect(db, {}).then(() => {
    console.log("Conexión exitosa a la base de datos");
}).catch((error) => {
    console.error("Error al conectar a la base de datos:", error);
});

const datosSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const mensajeSchema = mongoose.Schema({
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    message: { type: String},
    datos: {type: Buffer},
    tipo: {type: String},
    filetype: {type: String},
    read: {type: Boolean, required: true}
});

const Cuenta = mongoose.model("Cuenta", datosSchema, "Cuentas");
exports.Cuenta = Cuenta;
const Mensaje = mongoose.model("Mensaje", mensajeSchema, "Mensajes");

const storage = multer.memoryStorage(); // Almacenamiento en memoria para leer los datos del archivo como Buffer
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(bodyParser.json({ limit: '10000mb' })); // Aumenta el límite de carga útil a 10 megabytes



app.post('/registro', (req, res) => {
    const { username, password } = req.body;
    try {
        const usuario = Cuenta.create({ username, password });
        const data = { message: 'Listo', ok: true, data: "cuenta creada" };
        res.status(200).json(data)

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const usuario = await Cuenta.findOne({ username, password });
        if (usuario) {
            console.log("logeado")
            res.status(201).json({ datito: "Logeadoo" })
        } else {
            res.status(401).json({ mensaje: 'Nombre de usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.log('Error al iniciar sesión:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

app.post('/pagina-de-bienvenida', (req, res) => {
    let { username } = req.body;
    
    globalusuario = username

    Cuenta.find({ username: username })
        .then(usuariosEncontrados => {
            if (usuariosEncontrados.length > 0) {
                const filePath = path.join(__dirname, 'public', 'beta.html');

                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.log('Error al leer el archivo de bienvenida:', err);
                        res.status(500).send('Error interno del servidor');
                        return;
                    }

                    // Reemplazar el marcador de posición con el nombre de usuario
                    var htmlWithUsername = data.replace('<span id="usernamePlaceholder"></span>', username);
                    

                    pagina[username] = htmlWithUsername
                    

                    // Enviar el HTML de la página de bienvenida al cliente
                    res.status(200).json({ok: true});
                });

            } else {
                console.log('Usuario no encontrado');
                res.status(404).send(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Usuario no encontrado</title>
                    </head>
                    <body>
                        <h1>Usuario no encontrado</h1>
                    </body>
                    </html>
                `);
            }
        })
        .catch(error => {
            console.error('Error al buscar usuario:', error);
            res.status(500).send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error al buscar usuario</title>
                </head>
                <body>
                    <h1>Error al buscar usuario</h1>
                </body>
                </html>
            `);
        });
});

app.get('/home', (req, res) => {

    if (globalusuario === ""){
        res.send('Se ha cerrado la sesion, vuelve a iniciar sesion:   <a href="login.html">Login</a> <a href="create.html">Create</a>')
    } else {

        res.send(pagina[globalusuario])

        
        globalusuario = ""


    }

})

app.post('/enviar-mensaje', upload.single('audio'), async (req, res) => {
    var { fromusername, recipient, message, tipo} = req.body;
    
    try {

        my_string = String(req.file.originalname)
        console.log(my_string)
        my_list = my_string.split(',')
        fromusername = my_list[1] 
        recipient = my_list[0]
        tipo = my_list[2]
        
        cont1 = my_list[3]
        cont2 = my_list[4]

        conttype = cont1 + "/" + cont2

        
        //Hay que usar tipo y hacerle algo que comienza a partir de una letra f ejemplo: ftext/plain fpdf
        

    } catch {

    }
 
    try {
        
        if (fromusername == recipient) {
            return res.status(201).json({ mensaje: 'No te podes enviar a vos mismo' });

        } else {
            const destinatario = await Cuenta.findOne({ username: recipient });
            if (!destinatario) {
                return res.status(201).json({ mensaje: 'El destinatario no existe' });
            }
            
            else if (tipo == "texto"){
                console.log("Textito gil")
                const nuevoMensaje = await Mensaje.create({ sender: fromusername, recipient, message, tipo: "texto", read: false });
                res.status(200).json({ mensaje: 'Mensaje enviado correctamente' });

            }

            else if (tipo == "file"){
                console.log("Files gil")
                const nuevoMensaje = await Mensaje.create({ sender: fromusername, recipient, datos:req.file.buffer, tipo: "file", filetype:conttype, read: false });
                res.status(200).json({ mensaje: 'Mensaje enviado correctamente' });
                req.file.buffer = "d"
                req = "d"

            }
            
            else {
                console.log("Audio gil")
                const nuevoMensaje = await Mensaje.create({ sender: fromusername, recipient, datos:req.file.buffer, tipo: "audio", read: false });
                res.status(200).json({ mensaje: 'Mensaje enviado correctamente' });
            }
            

        }
        
    } catch (error) {
        console.log('Error al enviar mensaje:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

app.put('/read', async (req, res) => {
    const { id } = req.body;
    
    try {
        
        read = true

        // Busca y actualiza el mensaje por su ID
        const mensajeActualizado = await Mensaje.findByIdAndUpdate(id, { read: read });

      
        res.status(200).json({ mensaje: 'Mensaje actualizado exitosamente' });

    } catch (error) {
        
        console.log('Error al actualizar el mensaje:', error);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
    }
    
    
});


app.post('/mensajes-recibidos', async (req, res) => {
    const { username } = req.body;
    try {
        const mensajes = await Mensaje.find({ $or: [{ recipient: username }, { sender: username }] });
        
        ///const mensajes = await Mensaje.find({ recipient: username});
        ///const lomio = await Mensaje.find({ sender: username});
      
        res.status(200).json({mensajes});
        
        
       
        
        ///console.log(mensajes)
        ///console.log("------------------------")
        ///console.log(lomio)
    } catch (error) {
        console.log('Error al obtener mensajes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
