/*! Phiola, https://github.com/RedKenrok/Phiola, MIT License */
// Phiola object for connecting all the instrument's individual parts and performing the interactions between them.

let phiola = {};

(function() {
	
	'use strict';
	
	// Initial configuration of the synthesizer
	let configurationSynthesizer = {
		synthDef: {
			id: 'wave',
			ugen: 'flock.ugen.sinOsc',
			freq: 220,
			mul: {
				id: 'note',
				ugen: 'flock.ugen.envGen',
				envelope: {
					id: 'envelope',
					type: 'flock.envelope.adsr',
					delay: 0.1,
					attack: 1,
					decay: 0.5,
					peak: 1,
					sutain: 0.5,
					release: 1
				},
				gate: 0,
				mul: 1
			}
		}
	};
	
	// Initial configuration of the input
	let configurationInput = {
		battery: [],
		potentiometer: [
			{
				affect: 'note.gate'
			}
		],
		potentiometerLast: [
			{
				affect: 'wave.freq',
				inputMin: 0,
				inputMax: 1023,
				outputMin: 293.7,
				outputMax: 587.3
			}
		],
		orientation: {
			alpha: [
				{
					affect: 'wave.freq',
					inputMin: -30,
					inputMax: 30,
					outputMin: 45,
					outputMax: -45
				}
			],
			beta: [
				{
					affect: 'note.mul',
					inputMin: -30,
					inputMax: 30,
					outputMin: 0,
					outputMax: 4
				}
			],
			gamma: []
		},
		motion: {
			x: [],
			y: [],
			z: [],
			gx: [],
			gy: [],
			gz: [],
			alpha: [],
			beta: [],
			gamma: []
		}
	};
	
	let inputLayout = [
		{
			id: 'battery'
		}, {
			id: 'potentiometer'
		}, {
			id: 'potentiometerLast'
		}, {
			id: 'orientation',
			properties: [
				{
					id: 'alpha',
				}, {
					id: 'beta',
				}, {
					id: 'gamma',
				}
			]
		}, {
			id: 'motion',
			properties: [
				{
					id: 'x'
				}, {
					id: 'y'
				}, {
					id: 'z'
				}, {
					id: 'gx'
				}, {
					id: 'gy'
				}, {
					id: 'gz'
				}, {
					id: 'alpha',
				}, {
					id: 'beta',
				}, {
					id: 'gamma',
				}, 
			]
		}
	];
	
	let inputRotational = {
		battery: false,
		potentiometer: false,
		potentiometerLast: false,
		orientation: {
			alpha: true,
			beta: true,
			gamma: true
		},
		motion: {
			x: false,
			y: false,
			z: false,
			gx: false,
			gy: false,
			gz: false,
			alpha: true,
			beta: true,
			gamma: true
		}
	}
	
	// Input property containing all the inputs used for the synthesizer
	let input = {};
	
	phiola.initialize = function() {
		// Initialize gyroscope before start will be called.
		gyroscope.initialize(false);
		
		// Configuration
		// Synthesizer
		document.getElementById('configurationSynthesizer')
			.value = JSON.stringify(configurationSynthesizer, null, 1);
		// Input
		document.getElementById('configurationInput')
			.value = JSON.stringify(configurationInput, null, 1);
		
		// Input data microcontroller
		document.addEventListener(
			'microcontrollerchanged',
			function(event) {
				document.getElementById('connectedMicrocontroller').innerHTML = 'Name\n' + event.detail.device.name;
			});
		document.addEventListener(
			'batterychanged',
			function(event) {
				input.battery = event.detail.value;
				document.getElementById('characteristicBattery').innerHTML = 'Battery\n' + input.battery + '%';
				set('battery');
			});
		document.addEventListener(
			'potentiometerchanged',
			function(event) {
				input.potentiometer = event.detail.value;
				document.getElementById('characteristicPotentiometer').innerHTML = 'Potentiometer\n' + input.potentiometer;
				set('potentiometer');
				
				if (input.potentiometer != 0) {
					input.potentiometerLast = input.potentiometer;
					set('potentiometerLast');
				}
			});
		
		// Input data mobile device
		document.addEventListener(
			'orientationchanged',
			function(event) {
				input.orientation = event.detail.orientation;
				document.getElementById('deviceOrientation').innerHTML = 'Orientation\n(' + math.toFixed(input.orientation.alpha, 3) + ', ' + math.toFixed(input.orientation.beta, 3) + ', ' + math.toFixed(input.orientation.gamma, 3) + ', ' + input.orientation.absolute + ')';
				set('orientation.alpha');
				set('orientation.beta');
				set('orientation.gamma');
			});
		document.addEventListener(
			'motionchanged',
			function(event) {
				input.motion = event.detail.motion;
				document.getElementById('deviceMotion').innerHTML = 'Motion\n(' + math.toFixed(input.motion.x, 3) + ', ' + math.toFixed(input.motion.y, 3) + ', ' + math.toFixed(input.motion.z, 3) + ')\n(' + math.toFixed(input.motion.gx, 3) + ', ' + math.toFixed(input.motion.gy, 3) + ', ' + math.toFixed(input.motion.gz, 3) + ')\n(' + math.toFixed(input.motion.alpha, 3) + ', ' + math.toFixed(input.motion.beta, 3) + ', ' + math.toFixed(input.motion.gamma, 3) + ')';
				set('motion.x');
				set('motion.y');
				set('motion.z');
				set('motion.gx');
				set('motion.gy');
				set('motion.gz');
				set('motion.alpha');
				set('motion.beta');
				set('motion.gamma');
			});
	}
	
	phiola.onStart = function() {
		bluetooth.start();
		gyroscope.start();
		synthesizer.start(configurationSynthesizer);
	}
	
	phiola.onStop = function() {
		bluetooth.stop();
		gyroscope.stop();
		synthesizer.stop();
	}
	
	phiola.onReset = function() {
		bluetooth.reset();
		gyroscope.reset();
		synthesizer.reset();
	}
	
	phiola.onNormalize = function() {
		gyroscope.normalize();
	}
	
	phiola.onConfigureSynthesizer = function(value) {
		try {
			configurationSynthesizer = JSON.parse(value);
			synthesizer.reinitialize(configurationSynthesizer);
		}
		catch(error) {
			console.log('Synthesizer configuration error: ' + error);
			// Add indicator in the html page.
		}
	}
	
	phiola.onConfigureInput = function(value) {
		try {
			configurationInput = JSON.parse(value);
			// Perform check to see which sensors need to be off or turned on
		}
		catch(error) {
			console.log('Input configuration error: ' + error);
			// Add indicator in the html page.
		}
	}
	
	// Update synthesizer variables
	// To-do: Optimize this function.
	function set(path) {
		let properties = get(configurationInput, path);
		if (!Array.isArray(properties)) {
			console.error('Object not of type array at: ' + path + ', in the input configuration.');
			return;
		}
		// Check if array has any content.
		if (properties.length <= 0) {
			return;
		}
		
		let affects = [],
			affectPaths;
		
		let inputId,
			inputConfiguration,
			inputPropertiesId;
		for (let j = 0; j < properties.length; j++) {
			if (!properties[j].hasOwnProperty('affect')) {
				console.error('push properties[j] required \'affect\' parameter at: ' + path + '[' + j + '], in the input configuration.');
				return;
			}
			// Skip if already in the list.
			if (affects.indexOf(properties[j]['affect']) != -1) {
				continue;
			}
			affects.push(properties[j]['affect']);
			
			// Clear variable in each loop.
			affectPaths = [];
			// Itterate through the input configuration retrieving all properties with the same affect.
			for (let k = 0; k < inputLayout.length; k++) {
				inputId = inputLayout[k].id;
				if (!configurationInput.hasOwnProperty(inputId)) {
					// Property not present skip.
					continue;
				}
				inputConfiguration = configurationInput[inputId];
				// If there is another series.
				// To-do: Make recursive.
				if (inputLayout[k].hasOwnProperty('properties')) {
					// Itterate through those.
					for (let l = 0; l < inputLayout[k].properties.length; l++) {
						inputPropertiesId = inputLayout[k].properties[l].id;
						if (inputConfiguration.hasOwnProperty(inputPropertiesId) && Array.isArray(inputConfiguration[inputPropertiesId])) {
							for (let m = 0; m < inputConfiguration[inputPropertiesId].length; m++) {
								if (inputConfiguration[inputPropertiesId][m].hasOwnProperty('affect') && inputConfiguration[inputPropertiesId][m]['affect'] === properties[j]['affect']) {
									affectPaths.push(inputId + '.' + inputPropertiesId + '.' + m);
								}
							}
						}
					}
				}
				// Else add property if the 'affect' is the same.
				else {
					for (let n = 0; n < inputConfiguration.length; n++) {
						if (inputConfiguration[n].hasOwnProperty('affect') && inputConfiguration[n]['affect'] === properties[j]['affect']) {
							affectPaths.push(inputId + '.' + n);
						}
					}
				}
			}
			
			if (affectPaths.length <= 0) {
				console.error('No path affects found.');
			}
			
			// Calculate the sum of all properties.
			let result = 0;
			
			let layoutProperty,
				isRotational,
				valueRetrieved,
				valueCalculated;
			for (let o = 0; o < affectPaths.length; o++) {
				isRotational = get(inputRotational, affectPaths[o]);
				valueRetrieved = get(input, affectPaths[o])
				if (typeof valueRetrieved != 'number') {
					console.warn('Retrieved value not a number. Possibly not initialized yet.');
					continue;
				}
				valueCalculated = calculateValue(
					valueRetrieved,
					get(configurationInput, affectPaths[o]),
					isRotational
					);
				if (!isNaN(valueCalculated)) {
					result += valueCalculated;
				}
			}
			// Apply affect to the synthesizer.
			synthesizer.set(properties[j]['affect'], result);
		}
	}
	
	function get(root, path) {
        if (!root || !path || path === "") {
			console.log('Invalid root or path given.');
            return root;
        }
		
        let pathSplit = path.split('.'),
			properties = root,
			propertiesTemp;
		for (let i = 0; i < pathSplit.length; i++) {
			if (Array.isArray(properties)) {
				propertiesTemp = properties[parseInt(pathSplit[i])];
				if (propertiesTemp === null || typeof propertiesTemp === 'undefined') {
					return properties;
				}
				properties = propertiesTemp;
			}
			else if (properties.hasOwnProperty(pathSplit[i])) {
				propertiesTemp = properties[pathSplit[i]];
				if (propertiesTemp === null || typeof propertiesTemp === 'undefined') {
					return properties;
				}
				properties = propertiesTemp;
			}
			else {
				return properties;
			}
		}
		return properties;
	}
	
	function calculateValue(value, property, isRotational) {
		if (!property) {
			return value;
		}
		// Clamp
		if (property.hasOwnProperty('inputMin') && property.hasOwnProperty('inputMax')) {
			// Non-rotational
			if (isRotational === false) {
				value = math.clamp(
					value,
					property.inputMin,
					property.inputMax
					);
			}
			// Else is rotational
			else {
				value = math.clampAngle(
					value,
					property.inputMin,
					property.inputMax
					);
				value = math.distanceAngle(
					value,
					0
					);
			}
		}
		
		// Scale
		if (property.hasOwnProperty('outputMin') && property.hasOwnProperty('outputMax')) {
			value = math.ratio(
				value,
				property.inputMin,
				property.inputMax,
				property.outputMin,
				property.outputMax
				);
		}

		// Return result.
		return value;
	}
}());

$(document).ready(function() {
	phiola.initialize();
});