# Sensor Direct
This is a simple Cordova app desigend to talk to Adafruit Bluefruit devices via UART. To set the project up do the following:

## Build App
Forllow the instructions at https://cordova.apache.org/#getstarted to setup Cordova on your platform.

```
cordova create sensordirect com.kittley.sensordirect SensorDirect
cordova requirements
brew install gradle
cordova platform add android
cordova platform add ios
cordova plugin add cordova-plugin-inappbrowser
cordova plugin add cordova-plugin-ble-central
```

Now copy the conents of this repository to the root of the newly created app. This will overwrite all the nessesary parts.

Now run `cordova build ios`

Now open the xcode project `open ./platforms/ios/SensorDirect.xcworkspace`

Sign the project.

Build it to a device.

## Adafruit Feather

Open  `_hardware/bleuart.ino` and upload to the feather.
Open the serial monitor and send messages.
Messages with the format `data=z,y,z` will be processed as a comma seporated list. Always end with a `,null` to prevent erronious charictors in the last value.