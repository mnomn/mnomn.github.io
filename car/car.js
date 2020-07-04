const serviceUuid = "19b10020-e8f2-537e-4f6c-d104768a1214";

let bluetoothDevice
let ctrlCharacteristic2;
let notifyCharacteristic2;

let buttonValue = 0;
const h = 300;
const w = 300;
const offset = 15;
const offsetR = 40;

sendInProgress = false;
let serviceInput

let connectDisconnectButton
const connectStr = "Connect and drive"
const disconnectStr = "Disconnect"

// TODO: Show on screen if connected or not
// TODO: Listen to disconnect
// TODO: Is notify channel needed?
// TODO: Switch between touch and gyro.

let bottomLine = 0;

function setup() {
  let canvas = createCanvas(h, w);
  background("#698a94");

  let canvasPos = canvas.position()

  bottomLine = canvasPos.y + h + 30

  serviceInput = createInput(serviceUuid);
  serviceInput.position(canvasPos.x, bottomLine + 20);
  serviceInput.size(235, 20)

  connectDisconnectButton = createButton(connectStr)
  connectDisconnectButton.mousePressed(connectButtonPressed);
  connectDisconnectButton.position(canvasPos.x ,bottomLine + 45);
  uiSetConnected(false);

  let x = w/2
  let y = 15
  fill(0);//Black 
  textAlign(CENTER);
  text("Forward", x, y)

  // fill(200, 48, 48, 255)

  // Point fw
  y = h/4
  textSize(72);
  text("\u21a5", x, y)

  // Point back
  y = h - h/10
  textSize(72);
  text("\u21a7", x, y)

  // Point left
  x = w/8
  y = h/2 + 20
  textSize(72);
  text('\u21a4', x, y)

  // Point right
  x = w - w/8
  y = h/2 + 20
  textSize(72);
  text("\u21a6", x, y)

  // Center
  ellipse(h/2, w/2, 20, 20)

}

function draw() {
  noStroke();
  if (mouseIsPressed && mouseY < bottomLine) {
    writeSteerSpeed(mouseX, mouseY)
  }
}

function connectButtonPressed() {
  if (typeof navigator.bluetooth === 'undefined') {
    alert('Your browser does not support Bluetooth');
  }

  let vv = connectDisconnectButton.html();
  if (vv == disconnectStr) {
    disconnectBle()
    return
  }
  connectBle()
}

function connectBle() {
  let serviceName = serviceInput.value()

  navigator.bluetooth.requestDevice({
  filters: [{
    services: [serviceName]
  }]
})
.then(
  device => {
    bluetoothDevice = device;
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    return device.gatt.connect();
  }
)
.then(
  // TODO: If i filter on "name: "BLECare", how do I get serviceName here?
  server => server.getPrimaryService(serviceName)
)
.then(service => service.getCharacteristics())
.then(characteristics => {
  characteristics.forEach(characteristic => {
    console.log(characteristic.properties.write);
    if (characteristic.properties.write) {
      // Save char so we can write to it later
      ctrlCharacteristic2 = characteristic
    }
  })
  uiSetConnected(true)
})
.catch(
  error => { console.log(error); });
}

function onDisconnected(event) {
  // Callback when bluetooth disconnected
  console.log('> Bluetooth Device disconnected callback');
  uiSetConnected(false)
}

function disconnectBle() {
  if (!bluetoothDevice) {
    return;
  }
  console.log('Disconnecting from Bluetooth Device...');
  if (bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  } else {
    console.log('> Bluetooth Device is already disconnected');
  }
  uiSetConnected(false)
}

function uiSetConnected(connected)
{
  if (connected) {
    connectDisconnectButton.html(disconnectStr);
    connectDisconnectButton.style('background-color', "#8888BB");
  } else {
    connectDisconnectButton.html(connectStr)
    connectDisconnectButton.style('background-color', "#BBBBBB");
  }

}

function normalizeSteer(v,range) {
  if (v<0) return 0
  if (v>w) return range
  let r = 0
  r += (range*v)/h
  return int(r);
}

// Translate canvas pos to 0-255 
// Top of canvas is max speed (255)
function normalizeSpeed(v,range) {
  if (v<0) return range
  if (v>h) return 0
  let r = range
  r -= (range*v)/h
  return int(r)
}

function writeSteerSpeed(st, sp) {

  // Do not send if previous send is in progress
  if (sendInProgress) {
    console.log("sendInProgress");
    return
  }

  spN = normalizeSpeed(sp, 127)
  stN = normalizeSteer(st,127)
  console.log(`Sending steer:${stN} speed:${spN}`);

  if (ctrlCharacteristic2) {
    let arr = new Uint8Array([spN,stN])
    sendInProgress = true;
    ctrlCharacteristic2.writeValue(arr)
    .then(()=>{
      console.log("Send2 done!")
      sendInProgress = false;
    }, ()=> {
      console.log("Send2 ERR")
      sendInProgress = false;
    })
  } else {
    console.log("Not connected")

  }
}
