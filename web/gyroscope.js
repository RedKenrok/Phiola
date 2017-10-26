/*! Phiola, https://github.com/RedKenrok/Phiola, MIT License */
// Static mathematics namespace for generic calulations.

var gyroscope = {};

(function() {
	
	'use strict';
	
		// Objects
	
	function Rotation(alpha, beta, gamma, absolute) {
		this.alpha = alpha;
		this.beta = beta;
		this.gamma = gamma;
		this.absolute = absolute;
	}
	
		// Configuration
	
	gyroscope.alphaMin = -60; // Number
	gyroscope.alphaMax = 60; // Number
	gyroscope.betaMin = -60; // Number
	gyroscope.betaMax = 60; // Number
	gyroscope.gammaMin = -60; // Number
	gyroscope.gammaMax = 60; // Number
	
		// Variables
	
	// Time between gyroscopic data in miliseconds.
	let gyroFrequency = 20; // Number
	
	// The GyroNorm object.
	let gyroNorm; // GyroNorm
	
	// Raw gyroscopic data.
	let gyroDataRaw; // Rotation
	// The normal compared to the raw gyroscopic data.
	let gyroNormal; // Rotation
	
	gyroscope.initialize = function(start) {
		// GyroNorm
		gyroDataRaw = new Rotation(0, 0, 0, 0);
		gyroNormal = new Rotation(0, 0, 0, 0);
		gyroscope.gyroData = new Rotation(0, 0, 0, 0);
		
		gyroNorm = new GyroNorm();
		gyroNorm.init({
					frequency: gyroFrequency,
					gravityNormalized: true,
					orientationBase: GyroNorm.GAME,
					decimalCount: 4,
					screenAdjusted: false
				})
			.then(
				function() {
					if (start) {
						gyroscope.start();
					}
				})
			.catch(
				function(error) {
					console.error('Error: ' + error);
				});
	}
	
	gyroscope.start = function() {
		if (!gyroNorm) {
			gyroscope.initialize(true);
		}
		else {
			gyroNorm.start(
				function(data) {
					onOrientation(data.do);
					onMotion(data.dm);
				});
		}
	}
	
	gyroscope.stop = function() {
		if (gyroNorm) {
			gyroNorm.stop();
		}
	}
	
	gyroscope.reset = function() {
		// Remove GyroNorm callback and remove from memory it.
		if (gyroNorm) {
			gyroNorm.end();
			gyroNorm = null;
		}
	}
	
	gyroscope.normalize = function() {
		// Set raw values as new normals.
		gyroNormal = new Rotation(
			gyroDataRaw.alpha,
			gyroDataRaw.beta,
			gyroDataRaw.gamma,
			0
			);
		// Reset current data.
		gyroscope.gyroData = new Rotation(0, 0, 0, 0);
	}
	
	function onOrientation(data) {
		// Check if the data has changed since the previous itteration.
		if (gyroDataRaw.alpha == data.alpha && gyroDataRaw.beta == data.beta && gyroDataRaw.gamma == data.gamma && gyroDataRaw.absolute == data.absolute) {
			return;
		}
		
		// Angle axis: alpha -> z, beta -> x, gamma -> y
		// Angle ranges: beta -180 to 180, gamma -90 to 90. Except Safari beta -90 to 90, gamma -180 to 180.
		gyroDataRaw = new Rotation(
			data.alpha,
			data.beta,
			data.gamma,
			data.absolute
			);
		gyroscope.gyroData = new Rotation(
			math.normalizeAngle(gyroDataRaw.alpha - gyroNormal.alpha),
			math.normalizeAngle(gyroDataRaw.beta - gyroNormal.beta),
			math.normalizeAngle(gyroDataRaw.gamma - gyroNormal.gamma),
			math.normalizeAngle(gyroDataRaw.absolute - gyroNormal.absolute)
			);
		
		// Dispatch a orientation event with the new data.
		document.dispatchEvent(
			new CustomEvent(
				'orientationchanged',
				{
					detail : {
						orientation: gyroscope.gyroData
					}
				})
			);
	}
	
	function onMotion(data) {
		// Dispatch a motion event with the new data.
		document.dispatchEvent(
			new CustomEvent(
				'motionchanged',
				{
					detail : {
						motion : data
					}
				})
			);
	}
})();