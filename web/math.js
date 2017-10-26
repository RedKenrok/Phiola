/*! Phiola, https://github.com/RedKenrok/Phiola, MIT License */
// Static mathematics namespace for generic calulations.

var math = {};

(function() {
	
	'use strict';
	
	// Returns the absolute of the value/
	math.abs = function(value) {
		if (value >= 0) {
			return value;
		}
		return -value;
	}
	
	// Scales the ratio from relting between the value min and value max to the target min and target max.
	math.ratio = function(value, valueMin, valueMax, targetMin, targetMax) {
    	return (value - valueMin) * (targetMax - targetMin) / (valueMax - valueMin) + targetMin;
	}
	
	// Returns the value within the limits.
	math.clamp = function(value, min, max) {
		if (min >= value) {
			return min;
		}
		if (value >= max) {
			return max;
		}
		return value;
	}
	
	// Rounds the number off to the precision given.
	math.toFixed = function(value, precision) {
		let power = Math.pow(10, precision || 0);
		return Math.round(value * power) / power;
	}
	
		// Angles and degree
	
	// Returns the angle between 0 and 360.
	math.normalizeAngle = function(angle) {
		return (360 + (angle % 360)) % 360;
	}
	
	// Returns whether the angle is inclusive inbetween the values given.
	math.isBetweenAngle = function(angle, min, max) {
		angle = math.normalizeAngle(angle);
		min = math.normalizeAngle(min);
		max = math.normalizeAngle(max);
		
		if (min < max) {
			return min <= angle && angle <= max;
		}
		return min <= angle || angle <= max;
	}
	
	// Clamps the value to the nearest min and max, if it is not inbetween.
	math.clampAngle = function(value, min, max) {
		value = math.normalizeAngle(value);
		min = math.normalizeAngle(min);
		max = math.normalizeAngle(max);
		
		if (math.distanceAngle(value, min) < 0) {
			return min;
		}
		if (math.distanceAngle(value, max) > 0) {
			return max;
		}
		return value;
	}
	
	// Calculates the distance from the given angle on a circle in degrees.
	math.distanceAngle = function(value, from) {
		value = math.normalizeAngle(value);
		from = math.normalizeAngle(from);
		
		let to = value - from;
		// If 'to' is smaller than half a circle return without change.
		if (math.abs(to) < 180) {
			return to;
		}
		// Otherwise calculate the other way around of the circle.
		if (to >= 0) {
			return -(360 - math.abs(to));
		}
		return 360 - math.abs(to);
	}
})();