# Sound System - App
This repository is part of a larger project which brings together Raspberry PI's, SDStore, Arduino style microcontrollers, Smart phones, BLE and RFM69 radios, to create a sound level monitoring local area sensor network. In this repository you will find the code for a Cordova cross platform app. The app is designed to communicate with nodes on an RFM69 radio network via BLE. A [BLE to RFM69 Gateway Node](https://github.com/jkittley/soundsystem-hardware/tree/master/rfm69_ble) is required. For more information see kittley.com.

## Build App
1. Follow the instructions at https://cordova.apache.org/#getstarted to setup Cordova on your platform.

2. Clone this repository to your local machine and open the folder.

```
git clone https://github.com/jkittley/soundsystem-app.git

cd soundsystem-app
```

3. Add the platform you want to deploy to i.e. Android or iOS.

```
cordova platform add android
cordova platform add ios
```

4. Check you have all the requirements you need to build the app.

```
cordova requirements
```

5. You may need to install Grade:

    ***MacOS***: On mac you may need to run ```brew install gradle```

    ***Linux***: Follow these [instruction to install gradle](http://exponential.io/blog/2015/03/30/install-gradle-on-ubuntu-linux/) and then replace the ```path/to/android/sdk/tools``` with the contents of this [zip](https://dl.google.com/android/repository/tools_r25.2.3-linux.zip)


### Build for IOS 

1. Run: `cordova build ios` 

2. Open the XCode project `open ./platforms/ios/SensorDirect.xcworkspace`

3. Sign the project.

4. Use Xcode to deploy to a device.

### Build for Android 

1. Run `cordova build android` 

2. Run `cordova run android` to deploy to the emulator or connected device

