/*! Phiola, https://github.com/RedKenrok/Phiola, MIT License */
// Synthesizer object for interacting with the flocking synths.

let synthesizer = {};

(function() {
	
	'use strict';
	
	// Synth environment.
	let flockEnvironment; // FlockEnvironment
	// Synth object.
	let flockSynth; // FlockSynth
	
	// Initializes all the needed elements of the synth.
	function initialize(configuration) {
		flockEnvironment = flock.init({
			buffersize: 4096
		});
		synthesizer.reinitialize(configuration);
	}
	
	// Creates the synthesizer with the current configuration.
	synthesizer.reinitialize = function(configuration) {
		flockSynth = flock.synth(configuration);
	}
	
	synthesizer.start = function(configuration) {
		if (!flockEnvironment) {
			initialize(configuration);
		}
		flockEnvironment.start();
	}
	
	synthesizer.stop = function() {
		if (flockEnvironment) {
			flockEnvironment.stop();
		}
	}
	
	synthesizer.reset = function() {
		flockEnvironment = null;
	}
	
	// Sets item matching id, string, to the value, decimal, given.
	synthesizer.set = function(id, value) {
		flockSynth.set(id, value);
	}
})();