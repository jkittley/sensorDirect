
// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// ASCII only
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

// this is Nordic's UART service



var app = {

    is_connected: false,
    connected_device: null,
    device_list: [],
    bluefruit: {
        serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
        rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // receive is from the phone's perspective
    },

    initialize: function() {
        this.bindEvents();
        detailPage.hidden = true;
        searchPage.hidden = true;
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        disconnectButton.addEventListener('touchend', this.disconnect, false);
        // deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
        goHome.addEventListener('touchstart', this.showMainPage, false); 
        directConnect.addEventListener('touchstart', this.showSearchPage, false); 
        openBrowser.addEventListener('touchstart', this.openBrowser, false);
        directConnectImg.addEventListener('touchstart', this.showSearchPage, false); 
        openBrowserImg.addEventListener('touchstart', this.openBrowser, false);
        sendButton.addEventListener('click', this.sendData, false);
        setDataViewerURL.addEventListener('click', this.setDataViewerURL, false);
    },

    
    onDeviceReady: function() {
        // Check if URL is set
        if (window.localStorage.getItem('data_view_url')===null) app.setDataViewerURL();
    },

    setDataViewerURL: function() {
        var storage = window.localStorage;
        var promptCallback = function(results) {
            if (results.buttonIndex === 1) {
                storage.setItem('data_view_url', results.input1);
            }
        };
        var defaultValue = storage.getItem('data_view_url')===null ? 'http://192.168.1.104/' : storage.getItem('data_view_url');
        navigator.notification.prompt("Please set the server URL", promptCallback, 'Server URL', ['Save', 'Cancel'], defaultValue);
    },

    openBrowser: function() {
        var storage = window.localStorage;
        var url = storage.getItem('data_view_url') + '?device=tablet'; 
        var win = cordova.InAppBrowser.open(url, '_blank', 'location=no');
        win.addEventListener( "loaderror", function(params) {          
            win.close();
            //alert("Unable to connect to server");
        });
        win.addEventListener('loadstop', function(event) {        
            if (event.url.match("#close")) {
                win.close();
                return;
            }
            // Check the loaded page is the soundsystem raspberry pi and not an error
            // To do this we inject a small script to check if a window var has been defined.
            var code = "(function(x) { if (window.appTag===undefined) return 'no'; else return 'yes'; })(window);";
            win.executeScript({ code: code }, function(appTagDetected) {
                if(appTagDetected == 'no') {
                    alert("Unable to load server: No App tag"); 
                    win.close();
                 }
            });
        });
    },


    scanForRelay: function() {
        app.device_list = [];
        searchSpinner.hidden = false;
        refreshButton.hidden = true;
        searchConnect.hidden = true;
        deviceList.innerHTML = ''; // empties the list
        // scan for all devices
        ble.scan([], 5, app.onDiscoverDevice, app.onError);
        // Stop Scan after 5 seconds if nothing found
        setTimeout(app.stopRelayScan, 5000);    
    },

    stopRelayScan: function(allowSearchAgain=true, cb=null) {
        ble.stopScan(
            function() { 
                console.log("Scan complete"); 
                if (allowSearchAgain===true) {
                    searchSpinner.hidden = true;
                    refreshButton.hidden = false;
                    $('.device-item').removeClass('disabled');
                }
                if (cb !==null) cb();
            },
            function() { 
                alert("Scan stop failed");
            }
        );
    },

    onDiscoverDevice: function(device) {
        console.log(JSON.stringify(device));

        var badge = $('<span>')
                .addClass("badge badge-primary badge-pill")
            .html('RSSI: '+device.rssi);
                    
        var lielm = $('<li>')
            .html('<b>' + device.name + '</b>')
            .addClass('device-item')
            .addClass('d-flex')
            .addClass("list-group-item ")
            .addClass("justify-content-between")
            .addClass("align-items-center")
            .addClass("disabled")
            .append(badge);

        lielm.data("device-id", device.id); 

        if (device.name !== undefined && app.device_list.indexOf(device.id) < 0) {
            app.device_list.push(device.id);
            $("#deviceList").append(lielm);

            // Auto connect
            if (device.name.includes("Adafruit Bluefruit")) {
                searchSpinner.hidden = true;
                searchConnect.hidden = false;
                app.stopRelayScan(false, function() {  
                    app.connectToRelay(device.id);
                });
            }
        }
    },

    // connect: function(e) {
    //     var target = $(e.target);
    //     console.log(target);
    //     if (!target.is( "li.device-item" )) {
    //         target = target.closest('li.device-item');
    //     }
    //     deviceId = target.data('device-id');
    //     target.addClass('active');
    //     refreshButton.hidden = true;
    //     app.connectToRelay(deviceId);
    //     target.removeClass('active');
    // },

    connectToRelay: function(deviceId) {
        $('#searchPage h3').html('Connecting...');
        app.is_connected = true;
        app.connected_device = deviceId;
        onConnect = function(peripheral) {
            try {
                app.determineWriteType(peripheral);
                // subscribe for incoming data
                ble.startNotification(deviceId, app.bluefruit.serviceUUID, app.bluefruit.rxCharacteristic, app.onData, app.onError);
                resultDiv.innerHTML = "";
                app.showDetailPage();
            } catch (error) {
                error.errorDescription = "Failed to connect. Device may not be a compatable sensor.";
                app.onError(error);
            } finally {
                refreshButton.hidden = false;
                searchConnect.hidden = true;
            }
        };
        onDisconnect = function() {
            error = {}
            error.errorDescription = "Lost connection to device.";
            app.onError(error);
        };
        if (deviceId !== null) ble.connect(deviceId, onConnect, onDisconnect);
    },

    determineWriteType: function(peripheral) {
        // Adafruit nRF8001 breakout uses WriteWithoutResponse for the TX characteristic
        // Newer Bluefruit devices use Write Request for the TX characteristic
        var characteristic = peripheral.characteristics.filter(function(element) {
            if (element.characteristic.toLowerCase() === app.bluefruit.txCharacteristic) {
                return element;
            }
        })[0];

        if (characteristic.properties.indexOf('WriteWithoutResponse') > -1) {
            app.writeWithoutResponse = true;
        } else {
            app.writeWithoutResponse = false;
        }
    },

    onData: function(data) { // data received from Arduino
        console.log("NEW DATA");
        console.log(data);
        var asString=bytesToString(data);
        resultDiv.innerHTML = resultDiv.innerHTML + "Received: " + asString + "<br/>";
        resultDiv.scrollTop = resultDiv.scrollHeight;

        if (asString.startsWith('data=')) {
            var chunks = asString.replace('data=','').split(',');
            var signal = chunks[1];
            var volume = chunks[2];
            var battery = chunks[3];
            var relay_node_battery = chunks[4];

            $('#bar-signal').attr('src', 'img/signal_'+Math.max(0, Math.min(5, signal))+'.svg');
            $('#bar-volume').attr('src', 'img/volume_'+Math.max(0, Math.min(5, volume))+'.svg');
            // $('#bar-signal .progress-bar').css("width", chunks[0]).prop("aria-valuenow", chunks[0]).html(chunks[0]); 
            // $('#bar-volume .progress-bar').css("width", chunks[1]).prop("aria-valuenow", chunks[1]).html(chunks[1]); 
        }
    },

    sendData: function(event) { // send data to Arduino

        var success = function() {
            console.log("success");
            resultDiv.innerHTML = resultDiv.innerHTML + "Sent: " + messageInput.value + "<br/>";
            resultDiv.scrollTop = resultDiv.scrollHeight;
        };

        var failure = function() {
            alert("Failed writing data to the bluefruit le");
        };

        var data = stringToBytes(messageInput.value);
        var deviceId = app.connected_device;

        if (app.writeWithoutResponse) {
            ble.writeWithoutResponse(
                deviceId,
                app.bluefruit.serviceUUID,
                app.bluefruit.txCharacteristic,
                data, success, failure
            );
        } else {
            ble.write(
                deviceId,
                app.bluefruit.serviceUUID,
                app.bluefruit.txCharacteristic,
                data, success, failure
            );
        }

    },

    disconnect: function(event) {
        console.log("Disconnecting");
        ble.disconnect(app.connected_device, app.showMainPage, app.onError);
        app.is_connected = false;
        app.connected_device = null;
    },

    showMainPage: function() {
        if (app.is_connected) { app.disconnect(); }
        mainPage.hidden = false;
        detailPage.hidden = true;
        searchPage.hidden = true;
    },

    showSearchPage: function() {
        ble.isEnabled(
            function() {
                if (app.is_connected) { app.disconnect(); }
                mainPage.hidden = true;
                detailPage.hidden = true;
                searchPage.hidden = false;
                searchConnect.hidden = true;
                app.scanForRelay();
            },
            function() {
                console.log("Bluetooth is NOT enabled");
                navigator.notification.alert("Bluetooth is NOT enabled! Please turn it on and try again.", app.showMainPage);
            }
        );
    },

    showDetailPage: function() {
        $('#bar-signal').attr('src', 'img/signal_0.svg');
        $('#bar-volume').attr('src', 'img/volume_0.svg');
        mainPage.hidden = true;
        detailPage.hidden = false;
        searchPage.hidden = true;
    },
   
    showBrowser: function() {
        var url = 'https://cordova.apache.org';
        var target = '_blank';
        var options = "location = no"
        var ref = cordova.InAppBrowser.open(url, target, options);
        
        ref.addEventListener('loadstart', loadstartCallback);
        ref.addEventListener('loadstop', loadstopCallback);
        ref.addEventListener('loadloaderror', loaderrorCallback);
        ref.addEventListener('exit', exitCallback);
        
        function loadstartCallback(event) {
            console.log('Loading started: '  + event.url)
        }
        
        function loadstopCallback(event) {
            console.log('Loading finished: ' + event.url)
        }
        
        function loaderrorCallback(error) {
            console.log('Loading error: ' + error.message)
        }
        
        function exitCallback() {
            console.log('Browser is closed...')
        }
    },

    onError: function(err) {
        console.log(err);
        var errorMsg = "Unknown error";
        if ('errorDescription' in err) {
            errorMsg = err.errorDescription;
        } else if ('name' in err) {
            errorMsg = err.name;
        } 
        app.is_connected = false;
        app.connected_device = null;
        navigator.notification.alert(
            errorMsg,  // message
            app.showSearchPage,    // callback
            'Error',               // title
            'Done'                 // buttonName
        );
        // alert(err.errorDescription); // real apps should use notification.alert
    }

};

