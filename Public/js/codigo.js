// Obtener nombre de usuario del título

var fromusername = document.getElementById('nombre').textContent;
const user = fromusername.substring(12);
var previousMessagesLength = 0;

// Función para mostrar notificaciones
function mostrarNotificacionReal() {
    // Crear la notificación
    var notification = new Notification("Nuevo mensaje", { body: "ssss" });

    // Reproducir el sonido de notificación
    var audio = document.getElementById("notificationSound");
    audio.play();
}

function EditarRead(check) {
    console.log("Check: " + check)

    check = {id: check}
    
    fetch('/read', {

        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(check) // `data` es tu objeto JSON que contiene el ID y otros campos para actualizar el mensaje
        })

        .then(response => {

            if (!response.ok) {
                throw new Error('Error al actualizar el mensaje');
            }
            return response.json();
        })
        .then(data => {
            console.log("Listo check")
        // Manejar la respuesta del servidor
        })
        .catch(error => {
        console.log('Error:', error);
        });
}

// Actualiza la interfaz con los mensajes recibidos
function actualizarInterfaz(messages) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    messages.forEach(message => {

        id = message._id
        console.log("que: " + message.read)
        

        const messageElement = document.createElement('div');
        

        if (message.sender === user) {
            messageElement.textContent = `YO: ${message.message} `;
            
        } else {
            if (message.read == false) {
                EditarRead(id)
                mostrarNotificacionReal()
                
            }

            
            
            messageElement.textContent = `Usuario:${message.sender}  -  Mensaje:${message.message} `;


            // Mostrar notificación para los mensajes recibidos de otros usuarios
            
            
        }
        
        messagesList.appendChild(messageElement);
    });

    previousMessagesLength = messages.length;
}

// Función para obtener los mensajes del servidor
function obtenerMensajes() {
    // Obtener el nombre de usuario del destinatario de los mensajes
    const User = { username: user }; // Reemplaza 'bueno' con el nombre de usuario del destinatario

    fetch('/mensajes-recibidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(User)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener mensajes');
        }
        return response.json();
    })
    .then(data => {
        const messages = data.mensajes;

        if (previousMessagesLength !== messages.length) {
           
            actualizarInterfaz(messages);

        }
    })
    .catch(error => {
        console.log('Error:', error);
        const messagesList = document.getElementById('messagesList');
        messagesList.textContent = 'Error al obtener mensajes';
    });
}

obtenerMensajes(); // Obtener mensajes cuando se carga la página

// Obtener mensajes cada 5 segundos (5000 milisegundos)
setInterval(obtenerMensajes, 500);

const tieneSoporteUserMedia = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

if (!tieneSoporteUserMedia()) {
    alert("Tu navegador no soporta la API de getUserMedia");
  }

  let mediaRecorder;
  let tiempoInicio;
  let idIntervalo;

  const limpiarSelect = () => {
    const $listaDeDispositivos = document.querySelector("#listaDeDispositivos");
  for (let x = $listaDeDispositivos.options.length - 1; x >= 0; x--) {
    $listaDeDispositivos.options.remove(x);
  }
}

const segundosATiempo = numeroDeSegundos => {
  let horas = Math.floor(numeroDeSegundos / 60 / 60);
  numeroDeSegundos -= horas * 60 * 60;
  let minutos = Math.floor(numeroDeSegundos / 60);
  numeroDeSegundos -= minutos * 60;
  numeroDeSegundos = parseInt(numeroDeSegundos);
  if (horas < 10) horas = "0" + horas;
  if (minutos < 10) minutos = "0" + minutos;
  if (numeroDeSegundos < 10) numeroDeSegundos = "0" + numeroDeSegundos;

  return `${horas}:${minutos}:${numeroDeSegundos}`;
};

const comenzarAContar = () => {
  tiempoInicio = Date.now();
  idIntervalo = setInterval(() => {
    const duracion = document.querySelector("#duracion");
    duracion.textContent = "Tiempo transcurrido: " + segundosATiempo((Date.now() - tiempoInicio) / 1000);
  }, 1000);
};

const detenerConteo = () => {
  clearInterval(idIntervalo);
  tiempoInicio = null;
  document.getElementById('btnComenzarGrabacion').disabled = false;
  document.getElementById('btnDetenerGrabacion').disabled = true;
}

const comenzarAGrabar = () => {
  if (mediaRecorder) return alert("Ya se está grabando");
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      comenzarAContar();
      const fragmentosDeAudio = [];
      mediaRecorder.addEventListener("dataavailable", evento => {
        fragmentosDeAudio.push(evento.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        stream.getTracks().forEach(track => track.stop());
        detenerConteo();
        
        const blobAudio = new Blob(fragmentosDeAudio, { 'type': 'audio/webm' });
        
        const urlParaDescargar = URL.createObjectURL(blobAudio);
        const audioElement = document.getElementById('audio-player');
        audioElement.src = urlParaDescargar;
        
        // Crear FormData y agregar el Blob de audio al formulario
        const formData = new FormData();
        formData.append('audio', blobAudio, 'grabacion.webm');
        
        // Realizar la solicitud Fetch al servidor
        fetch('/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al enviar los datos al servidor');
          }
          return response.json(); // Otra vez, cambia a response.text(), response.blob() u otro según el tipo de respuesta esperado
        })
        .then(data => {
          // Manejar la respuesta del servidor
          console.log('Respuesta del servidor:', data);
        })
        .catch(error => {
          console.error('Error al enviar los datos al servidor:', error);
        });
      });
    })
    .catch(error => console.log("Error al obtener acceso al micrófono:", error));
};

const detenerGrabacion = () => {
  if (!mediaRecorder) return alert("No se está grabando");
  mediaRecorder.stop();
  detenerConteo();
};-

//document.getElementById("btnComenzarGrabacion").addEventListener("click", comenzarAGrabar);
//document.getElementById("btnDetenerGrabacion").addEventListener("click", detenerGrabacion);

document.getElementById('sendMessageForm').addEventListener('button', function(event) {
  event.preventDefault();
  console.log("mierda1")
})


// Event listener para el envío de mensajes
document.getElementById('sendMessageForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const message = document.getElementById('message').value;

    const messageSend = {
        recipient: recipient,
        message: message,
        fromusername: user,
        datos: datos,
        tipo: tipo
    };

    fetch('/enviar-mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageSend)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Error');
        }
    })
    .then(data => {
        function MensajeEnviado() {
            document.getElementById('registroMessage').textContent = data.mensaje;

            // Esperar 2000 milisegundos (2 segundos)
            setTimeout(function() {
                document.getElementById('registroMessage').textContent = "Online";
            }, 1000);
        }

        MensajeEnviado();
    })
    .catch(error => {
        console.log('Error al enviar:', error);
        document.getElementById('registroMessage').textContent = 'Error al enviar';
    });
});