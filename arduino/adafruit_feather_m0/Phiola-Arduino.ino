/*! Phiola, MIT license, https://github.com/RedKenrok/Phiola */
#include <Arduino.h>
#include <SPI.h>

#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BLEGatt.h"

#include "BluefruitConfig.h"

// Bluefruit
#define FACTORYRESET_ENABLE 1

// Bluetooth GAP information
#define GAP_NAME "Phiola"
#define GAP_FLAGS "02-01-06"
	// 02 = Number of bytes in entery
	// 01 = Data Type Value of 'Flag'
	// 06 = General discoverable and BLE only
#define GAP_SERVICES "05-03-15-18-0f-18"
	// 07 = Number of bytes in entery
	// 03 = Data Type Value of 'Complete List of 16-bit Service Class UUIDs'
	// 15-18 = 16-bit UUID 0x1815 of org.bluetooth.service.automation_io
	// 0F-18 = 16-bit UUID 0x1815 of org.bluetooth.service.battery_service
// Bluetooth GATT services
#define UUID_BATTERY_SERVICE 0x180f // org.bluetooth.service.battery_service
#define UUID_BATTERY_CHARACTERISTIC 0x2a19 // org.bluetooth.characteristic.battery_level
#define UUID_POTENTIOMETER_SERVICE 0x1815 // org.bluetooth.service.automation_io
#define UUID_POTENTIOMETER_CHARACTERISTIC 0x2a58 // org.bluetooth.characteristic.analog

// Eddystone
#define MINIMUM_FIRMWARE_VERSION "0.7.0"
#define BEACON_URL "https://goo.gl/znROFh"

// Battery
#define BATTERY_PIN A7
#define BATTERY_VOLTAGE_MIN 3.2
#define BATTERY_VOLTAGE_MAX 4.2

// Potentiometer
#define POTENTIOMETER_PIN A1
#define POTENTIOMETER_THRESHOLD 15

// Bluefruit Bluetooth low energy module.
Adafruit_BluefruitLE_SPI ble(BLUEFRUIT_SPI_CS, BLUEFRUIT_SPI_IRQ, BLUEFRUIT_SPI_RST);
// Gatt service
Adafruit_BLEGatt gatt(ble);

int8_t uuidBatteryService;
int8_t uuidBatteryCharacteristic;
int8_t uuidBatteryCharacteristicSize = 1;
uint8_t valueBattery;
uint8_t valueBatteryTemp;

int8_t uuidPotentiometerService;
int8_t uuidPotentiometerCharacteristic;
int8_t uuidPotentiometerCharacteristicSize = 2; // It is one 16bit unsigned integer therefore a size of two 8bit unsigned integers.
uint16_t valuePotentiometer;
uint16_t valuePotentiometerTemp;

// Helper function for error handling.
void error(const __FlashStringHelper*msg) {
	Serial.println(msg);
	while (1);
}

// Called once at the start.
void setup(void) {
	Serial.begin(115200);
	Serial.println(F("Setup"));
	
	// Initialize the Bluefruit Bluetooth Low Energy Module.
	setupBluefruit();
	// Initialize the GAP information.
	setupGap();
	// Initialize the GATT services.
	setupGatt();
	// Reset module in order to let the changes go in effect.
	ble.reset();
}

// Initializes the Bluefruit Bluetooth Low Energy Module.
void setupBluefruit(void) {
	// Remove standard debug information.
	ble.verbose(false);
	
	// Retrieve Bluefruit module.
	if (!ble.begin(VERBOSE_MODE)) {
		error(F("Unable to find Bluefruit module."));
	}
	// Perform a factory reset.
	if (FACTORYRESET_ENABLE) {
		if (!ble.factoryReset()) {
		error(F("Unable to perform factory reset."));
		}
	}
	// Disable echo command.
	ble.echo(false);
	// Print Bluefruit module information.
	ble.info();
}

void setupGap(void) {
	// Set to command mode.
	uint8_t mode = ble.getMode();
	if (mode == BLUEFRUIT_MODE_DATA ) {
		ble.setMode(BLUEFRUIT_MODE_COMMAND);
	}
	
	ble.print(F("AT+GAPDEVNAME="));
	ble.print(GAP_NAME);
	ble.println();
	if (!ble.waitForOK()) {
		error(F("Unable to set device name."));
	}
	
	// Sets advertisment data.
	ble.print(F("AT+GAPSETADVDATA="));
	ble.print(GAP_FLAGS);
	ble.print(F("-"));
	ble.print(GAP_SERVICES);
	ble.println();
	if (!ble.waitForOK()) {
		error(F("Unable to set advertisment data."));
	}
	
	// Set back to previous mode if necessary.
	if (mode == BLUEFRUIT_MODE_DATA) {
		ble.setMode(BLUEFRUIT_MODE_DATA);
	}
}

void setupGatt(void) {
	// Battery service.
	uuidBatteryService = gatt.addService(UUID_BATTERY_SERVICE);
	if (uuidBatteryService == 0) {
		error(F("Unable to add battery service."));
	}
	// Battery level characteristic, set to read and the optional notify.
	uuidBatteryCharacteristic = gatt.addCharacteristic(UUID_BATTERY_CHARACTERISTIC, GATT_CHARS_PROPERTIES_READ | GATT_CHARS_PROPERTIES_NOTIFY, uuidBatteryCharacteristicSize, uuidBatteryCharacteristicSize, BLE_DATATYPE_INTEGER);
	if (uuidBatteryCharacteristic == 0) {
		error(F("Unable to add battery characteristic."));
	}
	
	// Automation IO service.
	uuidPotentiometerService = gatt.addService(UUID_POTENTIOMETER_SERVICE);
	if (uuidPotentiometerService == 0) {
		error(F("Unable to add automation IO service."));
	}
	// Analog characteristic, set to read and notify.
	uuidPotentiometerCharacteristic = gatt.addCharacteristic(UUID_POTENTIOMETER_CHARACTERISTIC, GATT_CHARS_PROPERTIES_READ | GATT_CHARS_PROPERTIES_NOTIFY, uuidPotentiometerCharacteristicSize, uuidPotentiometerCharacteristicSize, BLE_DATATYPE_INTEGER);
	if (uuidPotentiometerCharacteristic == 0) {
		error(F("Unable to add analog characteristic."));
	}
}

// Called after setup and loops once ended.
void loop(void) {
	updateBattery();
	updatePotentiometer();
	
	delay(50);
}

// Updates the battery value.
void updateBattery(void) {
	// Battery charged percentage. Analog read forumula; multiply by 2 due to resistors, multiply by reference voltage of 3.3, devide by range of 1024, to get voltage.
	valueBatteryTemp = (uint8_t)ratio(clamp((analogRead(BATTERY_PIN) * 6.6) / 1024, BATTERY_VOLTAGE_MIN, BATTERY_VOLTAGE_MAX), BATTERY_VOLTAGE_MIN, BATTERY_VOLTAGE_MAX, 0, 100);
	
	// Continue if battery value has not been set yet or differences compared to the previous itteration.
	if (valueBattery != NULL && valueBattery == valueBatteryTemp) {
		return;
	}
	// Override previous value with current value for use in next itteration.
	valueBattery = valueBatteryTemp;
	
	Serial.println(valueBattery);
	
	// Set GATT characteristic of battery level characteristic to the current value.
	uint16_t argtype[] = { AT_ARGTYPE_UINT8, AT_ARGTYPE_UINT8 };
	uint32_t args[] = { uuidBatteryCharacteristic, valueBattery };
  	ble.atcommand_full(F("AT+GATTCHAR"), NULL, 2, argtype, args);
}

// Updates the potentiometer value.
void updatePotentiometer(void) {
	// Get potentiometer value, in range if 0 to 1023.
	valuePotentiometerTemp = analogRead(POTENTIOMETER_PIN);
	if (valuePotentiometerTemp <= POTENTIOMETER_THRESHOLD) {
		valuePotentiometerTemp = 0;
	}
	
	// Continue if potentiometer value has not been set yet or differences compared to the previous itteration.
	if (valuePotentiometer != NULL && valuePotentiometer == valuePotentiometerTemp) {
		return;
	}
	// Override previous value with current value for use in next itteration.
	valuePotentiometer = valuePotentiometerTemp;

	// Set GATT characteristic of analog characteristic to the current value.
	uint16_t argtype[] = { AT_ARGTYPE_UINT8, AT_ARGTYPE_UINT16 };
	uint32_t args[] = { uuidPotentiometerCharacteristic, __builtin_bswap16(valuePotentiometer) }; // bug possibly in chip firmware swaps the hexdecimal bytes, therefore __builtin_bswap16 swaps the bytes around before sending.
  	ble.atcommand_full(F("AT+GATTCHAR"), NULL, 2, argtype, args);
}

// Clamps the value between the min and max.
float clamp(float value, float min, float max) {
  	if (min >= value) {
		return min;
	}
	if (value >= max) {
		return max;
	}
	return value;
}

// Scales the ratio from relting between the value min and value max to the target min and target max.
float ratio(float value, float valueMin, float valueMax, float targetMin, float targetMax) {
    return (value - valueMin) * (targetMax - targetMin) / (valueMax - valueMin) + targetMin;
}
