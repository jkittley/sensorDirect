# Sensor Direct
This is a simple Cordova app desigend to talk to Adafruit Bluefruit devices via UART. To set the project up do the following:

## Build App
1. Follow the instructions at https://cordova.apache.org/#getstarted to setup Cordova on your platform.

```
cordova create sensordirect com.kittley.sensordirect SensorDirect
cordova platform add android
cordova platform add ios
```
2. We need to install Grade

### For Mac
2.1. On mac you may need to run ```brew install gradle```

### For Linux
2.1. Follow these [instruction to install gradle](http://exponential.io/blog/2015/03/30/install-gradle-on-ubuntu-linux/). 

2.2 Replace the ```path/to/android/sdk/tools``` with the contents of this [zip](https://dl.google.com/android/repository/tools_r25.2.3-linux.zip)

### For all
3. Now check the reuirements are met:

```
cordova requirements
```

4. Install the plugins

```
cordova plugin add cordova-plugin-inappbrowser
cordova plugin add cordova-plugin-ble-central
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-splashscreen
```

5. Copy the conents of this repository to the root of the newly created app. This will overwrite all the nessesary parts.

6. Create the images for splash screens and icons `python res/makeimages.py`

### Build for IOS 

7. Run: `cordova build ios` 
7.2. Open the XCode project `open ./platforms/ios/SensorDirect.xcworkspace`
7.3 Sign the project.
7.4 Use Xcode to deploy to a device.

### Build for Android 
7. Run `cordova build android` 
7.2. Run `cordova run android` to deploy to the emulator or connected device

## Adafruit Feather

Open  `_hardware/bleuart.ino` and upload to the feather.
Open the serial monitor and send messages.
Messages with the format `data=z,y,z` will be processed as a comma seporated list. Always end with a `,null` to prevent erronious charictors in the last value.
