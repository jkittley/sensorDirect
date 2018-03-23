
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
var bluefruit = {
    serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
    rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // receive is from the phone's perspective
};

var app = {
    initialize: function() {
        this.bindEvents();
        detailPage.hidden = true;
        searchPage.hidden = true;
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        disconnectButton.addEventListener('touchend', this.disconnect, false);
        deviceList.addEventListener('touchend', this.connect, false); // assume not scrolling
        goHome.addEventListener('touchstart', this.showMainPage, false); 
        directConnect.addEventListener('touchstart', this.showSearchPage, false); 
        openBrowser.addEventListener('touchstart', this.showBrowser, false);

        sendButton.addEventListener('click', this.sendData, false);
    },

    onDeviceReady: function() {
      
    },

    refreshDeviceList: function() {
        searchSpinner.hidden = false;
        refreshButton.hidden = true;
        deviceList.innerHTML = ''; // empties the list
        // scan for all devices
        ble.scan([], 5, app.onDiscoverDevice, app.onError);
        // Stop Scan
        setTimeout(function() {
            ble.stopScan(
                function() { 
                    console.log("Scan complete"); 
                    searchSpinner.hidden = true;
                    refreshButton.hidden = false;
                },
                function() { console.log("stopScan failed"); }
            );
        }, 5000);

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
            .append(badge);

        lielm.data("device-id", device.id); 

        $("#deviceList").append(lielm);
    },

    connect: function(e) {
        var target = $(e.target);
        var deviceId = null;
        console.log(target);
        if (target.is( "li.device-item" )) {
            deviceId = target.data('device-id');
        } else {
            deviceId = target.closest('li.device-item').data('device-id');
        }
        console.log(deviceId);
        
        onConnect = function(peripheral) {
            app.determineWriteType(peripheral);
            // subscribe for incoming data
            ble.startNotification(deviceId, bluefruit.serviceUUID, bluefruit.rxCharacteristic, app.onData, app.onError);
            sendButton.dataset.deviceId = deviceId;
            disconnectButton.dataset.deviceId = deviceId;
            resultDiv.innerHTML = "";
            app.showDetailPage();
        };

        if (deviceId !== null) ble.connect(deviceId, onConnect, app.onError);
    },

    determineWriteType: function(peripheral) {
        // Adafruit nRF8001 breakout uses WriteWithoutResponse for the TX characteristic
        // Newer Bluefruit devices use Write Request for the TX characteristic
        var characteristic = peripheral.characteristics.filter(function(element) {
            if (element.characteristic.toLowerCase() === bluefruit.txCharacteristic) {
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
            console.log(chunks);
            $('#bar-signal .progress-bar').css("width", chunks[0]).prop("aria-valuenow", chunks[0]).html(chunks[0]); 
            $('#bar-volume .progress-bar').css("width", chunks[1]).prop("aria-valuenow", chunks[1]).html(chunks[1]); 
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
        var deviceId = event.target.dataset.deviceId;

        if (app.writeWithoutResponse) {
            ble.writeWithoutResponse(
                deviceId,
                bluefruit.serviceUUID,
                bluefruit.txCharacteristic,
                data, success, failure
            );
        } else {
            ble.write(
                deviceId,
                bluefruit.serviceUUID,
                bluefruit.txCharacteristic,
                data, success, failure
            );
        }

    },

    disconnect: function(event) {
        var deviceId = event.target.dataset.deviceId;
        ble.disconnect(deviceId, app.showMainPage, app.onError);
    },

    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
        searchPage.hidden = true;
    },

    showSearchPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = true;
        searchPage.hidden = false;
        app.refreshDeviceList();
    },

    showDetailPage: function() {
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

    onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }

};

