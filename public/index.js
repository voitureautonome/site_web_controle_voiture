var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
const car = {
  avancer:false,
  reculer:false,
  stopped:true,
  heading:0
}

const socket = io();

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

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
        console.log("update");
        labelDirection.innerText = `Angle : ${angle} degrès`;
    });
    const imgView = document.getElementById('play');
    // socket.on('pi-video-stream', (data, res) => {
    //     imgView.src=data;
    // });
}
function gamepadHandler() {
  if (typeof controllers[0] === 'undefined') return;
  if(controllers[0].buttons[7].pressed && !car.avancer){
    socket.emit("avancer","infinity");
    car.avancer=true;
    car.reculer=false;
    car.stopped=false;
  }else if(controllers[0].buttons[6].pressed && !car.reculer){
    socket.emit("reculer", "infinity")
    car.reculer=true;
    car.avancer=false;
    car.stopped=false;
  }else if(!car.stopped){
    socket.emit("stop");
    car.stopped=true;
    car.avancer=false;
    car.reculer=false;
  }
  const angle = scaleBetween(controllers[0].axes[0],-45,45,-1,-511)
  if(Math.abs(car.heading-angle)>0.5)
    socket.emit("direction", angle);
}
setInterval(gamepadHandler,16);
setInterval(()=>{
  controllers = navigator.getGamepads();
},1000);
main();