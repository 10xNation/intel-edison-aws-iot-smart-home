// node.js app for AWS IoT / Intel Edison / Grove Temperature, Humidity, Relay reporting
var sensor1 = require('jsupm_th02');
var th02 = new sensor1.TH02();
var sensor2 = require('jsupm_grove');
var relay = new sensor2.GroveRelay(2);

// Simulate device values
var temp = 24.00;
var humi = 50;
var relayState = false;
var reported_state = {"Temperature":temp, "Humidity": humi, "RelayState": relayState};

// Client token values returned from thingShadows.update() operation / app deps
const thingShadow = require('./node_modules/aws-iot-device-sdk/thing');
var sensor1 = require('jsupm_th02');
var th02 = new sensor1.TH02();
var sensor2 = require('jsupm_grove');
var relay = new sensor2.GroveRelay(2);
var awsIot = require('aws-iot-device-sdk');

var thingShadows = awsIot.thingShadow({
  keyPath: '/home/root/cert/edison_demo_key.pem',
  certPath: '/home/root/cert/edison_demo_crt.pem',
  caPath: '/home/root/cert/root_ca.pem',
  clientId: 'edison_demo_client_id', // Update as required
  region: 'us-east-1' // Update as required
});

// Simulate device values
var temp = 24.00;
var humi = 50;
var relayState = false;

// Client token values returned from thingShadows.update() operations
var clientTokenUpdate;
var thingName = "EdisonDemo"; // Update as required

thingShadows.on('connect', function() {
  thingShadows.register(thingName);
  console.log(thingName + ' registering...');
  setInterval(function(){
   readSensor(sendData);
  }, 5000);
});

// Report the status of update(), get(), and delete() calls
// The clientToken value associated with the event will have the same value which was returned in an earlier call to get(), update(), or delete()
// Use status events to keep track of the status of shadow operations
thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
  console.log('=> Received '+stat+' on '+thingName+': '+ JSON.stringify(stateObject));
});

thingShadows.on('delta', function(thingName, stateObject) {
  console.log('=> Received delta on '+thingName+': '+ JSON.stringify(stateObject));
  if(stateObject.state.RelayState == true){
    relay.on();
    console.log('Relay is in ON position.');
  }
  else if(stateObject.state.RelayState == false) {
    relay.off();
    console.log('Relay is in OFF position.');
  }
});

// If a shadow event operation times out, you'll receive one of these events
// The clientToken value associated with the event will have the same value which was returned in an earlier call to get(), update(), or delete()
thingShadows.on('timeout', function(thingName, clientToken) {
  console.log('=> Received timeout on '+thingName + ' with token: '+ clientToken);
});

function readSensor(callback) {
  temp = th02.getTemperature();
  humi = th02.getHumidity();
  relayState = relay.isOn();
  callback();
};

function sendData() {
  var reported_state = {"Temperature":temp, "Humidity": humi, "RelayState": relayState};
  // Use desired attribute to receive delta
  var relayTH02State = {"state":{desired: reported_state}};
  // Refer to http://docs.aws.amazon.com/iot/latest/developerguide/thing-shadow-mqtt.html#update-pub-sub-message
  clientTokenUpdate = thingShadows.update(thingName, relayTH02State);
  if (clientTokenUpdate === null) {
    console.log('Shadow update failed, operation still in progress');
  }
};
