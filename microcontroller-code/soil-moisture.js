'use strict';

const request = require('request');

const Tessel = require('tessel-io');
const five = require('johnny-five');
const board = new five.Board({
  io: new Tessel()
});

board.on('ready', () => {
  const dry = new five.Led('b2');
  const wet = new five.Led('b3');
  const moistureSensor = new five.Sensor('a7');
  const monitor = new five.Multi({
    controller: 'BME280'
  });

  dry.on();

  //** sensor data **
  let waterLevel;
  let temperature;
  let humidity;
  let barometer;

  //phant info
  const privateKey = '2mvZePN5kMu7y0lArPRZ';
  const publicKey = 'ZG4drKRxMocl6a5L7WrY';

  moistureSensor.on('change', () => {
    waterLevel = moistureSensor.value;
    
    if (moistureSensor.value < 300) {
      dry.on();
      wet.off();
    }

    if (moistureSensor.value > 300) {
      dry.off();
      wet.on();
    }
  });

  monitor.on('change', () => {
     temperature = Math.round(monitor.thermometer.fahrenheit);
     humidity = Math.round(monitor.hygrometer.relativeHumidity);
     barometer = Math.round(monitor.barometer.pressure);
  });

  const logLevels = () => {
    if(waterLevel || temperature || humidity || barometer) {
      request(`http://data.sparkfun.com/input/${publicKey}?private_key=${privateKey}&humidity=${humidity}&moisturelevel=${waterLevel}&pressure=${barometer}&temp=${temperature}`, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          console.log(body);
        }
        if(error) {
          console.error(error);
        }
      });
    }
    setTimeout(logLevels, 10000);
  };

  logLevels();
});