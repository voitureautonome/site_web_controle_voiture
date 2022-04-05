const
    http = require("http"),
    express = require("express"),
    socketio = require("socket.io");
const {
    exec
} = require("child_process");
const https = require('https');
const fs = require("fs");
const voiture = require("./addon/build/Release/teslawish.node")
const { StreamCamera, Codec, Flip, SensorMode,StillCamera } = require('pi-camera-connect');

voiture.init();
// const streamCamera = new StreamCamera({
//     codec: Codec.MJPEG,
//     flip: Flip.Both,
//     sensorMode: SensorMode.Mode6
// });

// async function cameraStartCapture() {
//     await streamCamera.startCapture();
// }

const avancerVoiture = (millis)=>{
    voiture.avancer(20);
    setTimeout(voiture.arreter, millis);
}

const reculerVoiture = (millis)=>{
    voiture.reculer(millis);
    setTimeout(voiture.arreter, millis);
}

const directionVoiture = (angle)=>{
    voiture.direction(parseInt(angle));
}
const stopVoiture = ()=>{
    voiture.arreter();
}

const SERVER_PORT = 3000;
// create a new express app
const app = express();
// create http server and wrap the express app
let credentials = {
    key: fs.readFileSync("./credentials/key.pem", "utf-8"),
    cert: fs.readFileSync("./credentials/cert.pem", "utf-8")
};
const server = https.createServer(credentials, app);
const io = socketio(server);

let nextVisitorNumber = 1;
const onlineClients = new Set();

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has connected.`);
    onlineClients.add(socket.id);

    socket.on("disconnect", () => {
        onlineClients.delete(socket.id);
        console.info(`Socket ${socket.id} has disconnected.`);
    });

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
    socket.on("stop",()=>{
        stopVoiture();
        io.emit("etat","La voiture s'arrete");
    });
    // streamCamera.on('frame', (data) => {
    //     io.emit('pi-video-stream', "data:image/jpeg;base64," + data.toString("base64"));
    // });
}

function startServer() {
    // example on how to serve static files from a given folder
    app.use(express.static("public"));

    // will fire for every new websocket connection
    io.on("connection", onNewWebsocketConnection);
    // important! must listen from `server`, not `app`, otherwise socket.io won't function correctly
    server.listen(SERVER_PORT, () => console.info(`Listening on port ${SERVER_PORT}.`));

    // will send one message per second to all its clients
    let secondsSinceServerStarted = 0;

    // cameraStartCapture().then(() => {
    //     console.log('Camera is now capturing');
    // });
    // setInterval(()=>{
    //     streamCamera.takeImage().then((photo)=>{
    //         io.emit('pi-video-stream', "data:image/jpeg;base64," + photo.toString("base64"));
    //     });
    // },60);
    setInterval(() => {
        secondsSinceServerStarted++;
        io.emit("online", onlineClients.size);
    }, 1000);
}

startServer();