# Sensor Direct
This is a simple Cordova app desigend to talk to Adafruit Bluefruit devices via UART. To set the project up do the following:

## Build App
1. Follow the instructions at https://cordova.apache.org/#getstarted to setup Cordova on your platform.

```
cordova create sensordirect com.kittley.sensordirect SensorDirect
cordova requirements
brew install gradle
cordova platform add android
cordova platform add ios
cordova plugin add cordova-plugin-inappbrowser
cordova plugin add cordova-plugin-ble-central
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-splashscreen
```

2. Copy the conents of this repository to the root of the newly created app. This will overwrite all the nessesary parts.

3. Create the images for splash screens and icons `python res/makeimages.py`

4. Build for IOS `cordova build ios`

5. Now open the XCode project `open ./platforms/ios/SensorDirect.xcworkspace`

6. Sign the project.

7. Use Xcode to deploy to a device.

## Adafruit Feather

Open  `_hardware/bleuart.ino` and upload to the feather.
Open the serial monitor and send messages.
Messages with the format `data=z,y,z` will be processed as a comma seporated list. Always end with a `,null` to prevent erronious charictors in the last value.