const socket = io();

async function ajax(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.addEventListener("load", function () {
            try {
                resolve(this.responseText);
            } catch (error) {
                reject(error);
            }
        });
        request.open("GET", url);
        request.send();
        request.addEventListener("error", reject)
    });
}

/** @returns {void} */
async function main() {

    socket.on("connect", () => socket.emit("hello", `Hi there! I am ${window.navigator.userAgent}`));

    const welcomeElement = document.getElementById("welcome");
    socket.on("online", online => onlineElement.innerText = online.toString());

    const onlineElement = document.getElementById("online");
    socket.on("welcome", welcomeMessage => welcomeElement.innerText = welcomeMessage);

    const etatElement = document.getElementById("etat");
    socket.on("etat", message => etatElement.innerText = message);

    const temps = document.getElementById("number");
    const btnAvancer = document.getElementById("btn-avancer");
    btnAvancer.addEventListener("click", () => socket.emit("avancer", temps.value));

    const btnReculer = document.getElementById("btn-reculer");
    btnReculer.addEventListener("click", () => socket.emit("reculer", temps.value));

    const sliderDirection = document.getElementById("slider-direction");
    const labelDirection = document.getElementById("angle");
    sliderDirection.addEventListener("input", () => {
        socket.emit("direction", sliderDirection.value);
        labelDirection.innerText = `Angle : ${sliderDirection.value} degrès`;
    });
    socket.on("direction", angle => {
        sliderDirection.value = angle;
        labelDirection.innerText = `Angle : ${angle} degrès`;
    });
    const imgView = document.getElementById('play');
    socket.on('pi-video-stream', (data, res) => {
        imgView.src=data;
    });
}

main();