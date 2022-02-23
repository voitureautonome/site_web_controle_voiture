const
    http = require("http"),
    express = require("express"),
    socketio = require("socket.io");
const {
    exec
} = require("child_process");

const { StreamCamera, Codec, Flip, SensorMode } = require('pi-camera-connect');

const streamCamera = new StreamCamera({
    codec: Codec.MJPEG,
    flip: Flip.Vertical,
    sensorMode: SensorMode.Mode6
});


async function cameraStartCapture() {
    await streamCamera.startCapture();
}


//fonction qui lance la commaned avancer 
function avancerVoiture(millis) {
    console.log(`avancer la voiture pendant ${millis} milli-secondes`);
    exec(`avancer ${parseInt(millis)}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function reculerVoiture(millis) {
    console.log(`reculer la voiture pendant ${millis} milli-secondes`);
    exec(`reculer ${parseInt(millis)}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function directionVoiture(angle) {
    console.log(`oriente  la direction a ${angle} degrès `);
    exec(`direction ${parseInt(angle)}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}


const SERVER_PORT = 3000;
// create a new express app
const app = express();
// create http server and wrap the express app
const server = http.createServer(app);
const io = socketio(server);

let nextVisitorNumber = 1;
const onlineClients = new Set();

function generateRandomNumber() {
    return (Math.floor(Math.random() * 1000)).toString();
}

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has connected.`);
    onlineClients.add(socket.id);

    socket.on("disconnect", () => {
        onlineClients.delete(socket.id);
        console.info(`Socket ${socket.id} has disconnected.`);
    });

    // echoes on the terminal every "hello" message this socket sends
    socket.on("hello", helloMsg => console.info(`Socket ${socket.id} says: "${helloMsg}"`));

    // will send a message only to this socket (different than using `io.emit()`, which would broadcast it)
    socket.emit("welcome", `Vous êtes le pilote numéro  ${nextVisitorNumber++}`);

    socket.on("avancer", msg => {
        avancerVoiture(msg);
        io.emit("etat", `La voiture avance pendant ${parseInt(msg)/1000} secondes`);
    });
    socket.on("reculer", msg => {
        reculerVoiture(msg);
        io.emit("etat", `La voiture recule pendant ${parseInt(msg)/1000} secondes`);
    });
    socket.on("direction", msg => {
        directionVoiture(msg);
        io.emit("etat", `La voiture oriente ses roues à ${parseInt(msg)} degrès`);
        io.emit("direction", msg);
    });
    streamCamera.on('frame', (data) => {
        io.emit('pi-video-stream', "data:image/jpeg;base64," + data.toString("base64"));
    });
}

function startServer() {

    // example on how to serve a simple API
    app.get("/random", (req, res) => res.send(generateRandomNumber()));

    // example on how to serve static files from a given folder
    app.use(express.static("public"));

    // will fire for every new websocket connection
    io.on("connection", onNewWebsocketConnection);
    // important! must listen from `server`, not `app`, otherwise socket.io won't function correctly
    server.listen(SERVER_PORT, () => console.info(`Listening on port ${SERVER_PORT}.`));

    // will send one message per second to all its clients
    let secondsSinceServerStarted = 0;

    cameraStartCapture().then(() => {
        console.log('Camera is now capturing');
    });

    setInterval(() => {
        secondsSinceServerStarted++;
        io.emit("online", onlineClients.size);
    }, 1000);
}

startServer();