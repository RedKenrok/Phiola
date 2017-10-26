/*! Phiola, v0.0.0, https://github.com/RedKenrok/Phiola-Web, MIT License */
// Bluetooth object for interacting with the bluetooth device.

var bluetooth = {};

(function() {
	
	'use strict';
	
	let uuidBatteryService  = 0x180f // org.bluetooth.service.battery_service
	let uuidBatteryCharacteristic = 0x2a19 // org.bluetooth.characteristic.battery_level
	let uuidPotentiometerService = 0x1815 // org.bluetooth.service.automation_io
	let uuidPotentiometerCharacteristic = 0x2a58 // org.bluetooth.characteristic.analog
	
	let characteristicBattery;
	let characteristicPotentiometer;
	
	bluetooth.request = function() {
		navigator.bluetooth
			.requestDevice({
				filters: [{ services: [ uuidPotentiometerService ] }],
				optionalServices: [ uuidBatteryService ]
				})
			.then(
				function(device) {
					bluetooth.device = device;
					bluetooth.device.addEventListener(
						'gattserverdisconnected',
						onDisconnected
					);
					document.dispatchEvent(
						new CustomEvent(
							'microcontrollerchanged',
							{
								detail : {
									device : device
								}
							})
						);
					connect();
				})
			.catch(
				function(error) {
					bluetooth.device = null;
					console.error('Connection error: ' + error);
				});
	}
	
	function onDisconnected(event) {
		connect();
	}
	
	function connect() {
		if (bluetooth.device.gatt.connected) {
			return Promise.resolve();
		}
		
		let server;
		bluetooth.device.gatt.connect()
			// Server
			.then(
				function(_server) {
					server = _server;
				})
			// Battery
			.then(
				function() {
					return server.getPrimaryService(uuidBatteryService);
				})
			.then(
				function(service) {
					return service.getCharacteristic(uuidBatteryCharacteristic);
				})
			.then(
				function(characteristic) {
					// Stores characteristic.
					characteristicBattery = characteristic;
					// Start notifications
					return characteristic.startNotifications();
				})
			.then(
				function(characteristic) {
					// Event listener
					characteristic.addEventListener(
						'characteristicvaluechanged',
						onBatteryChanged
						);
					return characteristic.readValue();
				})
			.then(
				function(value) {
					// Fires event for current listeners to initialize data.
					let valueConverted = value.getUint8(0);
					document.dispatchEvent(
						new CustomEvent(
							'batterychanged',
							{
								detail : {
									value : valueConverted
								}
							})
						);
				})
			// Potentiometer
			.then (
				function() {
					return server.getPrimaryService(uuidPotentiometerService);
				})
			.then(
				function(service) {
					return service.getCharacteristic(uuidPotentiometerCharacteristic);
				})
			.then(
				function(characteristic) {
					// Stores characteristic.
					characteristicPotentiometer = characteristic;
					// Start notifications
					return characteristic.startNotifications();
				})
			.then(
				function(characteristic) {
					// Event listener
					characteristic.addEventListener(
						'characteristicvaluechanged',
						onPotentiometerChanged
						);
					return characteristic.readValue();
				})
			.then(
				function(value) {
					let valueConverted = value.getUint16(0);
					document.dispatchEvent(
						new CustomEvent(
							'potentiometerchanged',
							{
								detail : {
									value : valueConverted
								}
							})
						);
				})
			.catch(
				function(error) {
					console.error("Device connect error: " + error);
				});
	}
	
	function onBatteryChanged(event) {
		bluetooth.batteryLevel = event.target.value.getUint8(0);
		//console.log('Battery: ' + value);
		document.dispatchEvent(
			new CustomEvent(
				'batterychanged',
				{
					detail : {
						value : bluetooth.batteryLevel
					}
				})
			);
	}
	
	function onPotentiometerChanged(event) {
		bluetooth.potentiometerValue = event.target.value.getUint16(0);
		//console.log('Potentiometer: ' + value);
		document.dispatchEvent(
			new CustomEvent(
				'potentiometerchanged',
				{
					detail : {
						value : bluetooth.potentiometerValue
					}
				})
			);
	}
	
	bluetooth.start = function() {
		if (!bluetooth.device) {
			bluetooth.request();
			return;
		}
		// Enable notifications.
		if (characteristicBattery) {
			characteristicBattery.startNotifications();
		}
		if (characteristicPotentiometer) {
			characteristicPotentiometer.startNotifications();
		}
	}
	
	bluetooth.stop = function() {
		// Disable notifications.
		if (characteristicBattery) {
			characteristicBattery.stopNotifications();
		}
		if (characteristicPotentiometer) {
			characteristicPotentiometer.stopNotifications();
		}
	}
	
	bluetooth.reset = function() {
		if (characteristicBattery) {
			characteristicBattery.removeEventListener(
				'characteristicvaluechanged',
				onBatteryChanged
			)
			characteristicBattery = null;
		}
		if (characteristicPotentiometer) {
			characteristicPotentiometer.removeEventListener(
				'characteristicvaluechanged',
				onPotentiometerChanged
			)
			characteristicPotentiometer = null;
		}
		
		bluetooth.device = null;
	}
}());