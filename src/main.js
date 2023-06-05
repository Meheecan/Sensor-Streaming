//date when they are sent not when they arrive( have both)
        //make it easier to implement more beacons
        
const fs = require('fs')
function convertToCSV(arr) {
  const csv = arr.map(row => row.map(value => `"${value}"`).join(',')).join('\n');
  return csv;
}
function addValuesToCSV(values,name) {
  const filePath = '/csv'+name;
  const csvRow = convertToCSV([values]);
  fs.appendFile(filePath, csvRow + '\n', (err) => {
    if (err) {
      console.error('Error appending to CSV file:', err);
    } else {
      console.log('Values added to CSV file successfully.');
    }
  });
}

        function downloadCsv(data, filename) {
          const csvString = data.map(row => row.join(",")).join("\n");
          const blob = new Blob([csvString], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.innerText = "Download: " + filename;
          const button = document.createElement("button")
          button.appendChild(link);
          document.body.appendChild(button)

      }

      // Code to upload to Bangle.js
      var BANGLE_CODE = `
  accelInterval = 200;
  magnetInterval = 200;
  temperatureInterval = 2000;

  Bangle.setCompassPower(1);
  deviceid1 = "dc:45:11:fb:ea:c4 random";
  deviceid2 = "da:e3:63:e6:e3:c9 random";
  deviceid3 = "de:7c:5f:f1:fb:e6 random";

  function getDate(){
  const d = new Date();
  const m = parseInt(d.getMonth()) + 1;
  const date =  d.getDate() + "/" +
          m +"/" + 
          d.getFullYear() + " " +
          d.getHours() + ":" + 
          d.getMinutes() + ":" + 
          d.getSeconds() + ":"+
          d.getMilliseconds();
return date;
}
setInterval(function(){
accel = Bangle.getAccel();
d = getDate();
var a = [
  "A",
  accel.x.toFixed(3),
  accel.y.toFixed(3),
  accel.z.toFixed(3),
  d
  ];
  Bluetooth.println(a.join(","));
},accelInterval)

setInterval(function(){
magnet = Bangle.getCompass();
d = getDate();
var m = [
  "M",
  magnet.x.toFixed(3),
  magnet.y.toFixed(3),
  magnet.z.toFixed(3),
  d
  ];
  Bluetooth.println(m.join(","));
},magnetInterval)


Bangle.setHRMPower(1)
Bangle.on('HRM',function(hrm) {
  d = getDate();
  var hr = [
    "H",
    hrm.bpm,
    hrm.confidence,
    d
    ];
  Bluetooth.println(hr.join(","));
});

setInterval(function(){
  temp = E.getTemperature();
  d = getDate();
var t = [
  "T",
  temp,
  d
];
Bluetooth.println(t.join(","))
},temperatureInterval)

NRF.setScan(function(device) {
    if (device.id == deviceid1) {
        d = getDate();
        var rssi1 = [
            "Sensor1",
            device.rssi,
            device.id,
            d
        ];
        Bluetooth.println(rssi1.join(","));
    
    }
    if (device.id == deviceid2){
        d = getDate();
        var rssi2 = [
            "Sensor2",
            device.rssi,
            device.id,
            d
        ];
        Bluetooth.println(rssi2.join(","))
    }
    if (device.id == deviceid3){
        d = getDate();
        var rssi3 = [
            "Sensor3",
            device.rssi,
            device.id,
            d
        ];
        Bluetooth.println(rssi3.join(","))
    }
},{ filters: [{ id: deviceid1 },{id:deviceid2},{id:deviceid3}] });

`

      // When we click the connect button...
      var connection;
      document.getElementById("btnConnect").addEventListener("click", function () {
          if (connection) {
              connection.close();
              connection = undefined;
          }
          // Connect
          Puck.connect(function (c) {
              if (!c) {
                  alert("Couldn't connect!");
                  return;
              }
              connection = c;
              var buf = "";
              connection.on("data", function (d) {
                  buf += d;
                  var l = buf.split("\n");
                  buf = l.pop();
                  l.forEach(onLine);
              });
              // First, reset the Bangle
              connection.write("reset();\n", function () {
                  // Wait for it to reset itself
                  setTimeout(function () {
                      // Now upload our code to it
                      connection.write("\x03\x10if(1){" + BANGLE_CODE + "}\n",
                          function () { console.log("Ready..."); });
                  }, 1500);
              });
          });
      });
      document.getElementById("stop").addEventListener("click", function () {
          if (connection) {
              connection.close();
              connection = undefined;
              downloadCsv(dataHR, "heartrate.csv")
              downloadCsv(dataAcceleration, "acceleration.csv")
              downloadCsv(dataTemperature, "temperature.csv")
              downloadCsv(dataRSSI, "RSSI.csv")
              downloadCsv(dataMagnetometer, "Magnetometer.csv")
          }
      })

      //Chart Setup
      //Arrays for rssi values
      var dps1 = [];
      var dps2 = [];
      var dps3 = [];

      //array for heartrate values
      var dpsHR = [];

      //array for temperature
      var dpsT = [];

      //acceleration data
      var Ax = [];
      var Ay = [];
      var Az = [];

      //magnetometer data
      var Mx = [];
      var My = [];
      var Mz = [];

      //arrays for csv files 
      var dataRSSI = [["Value[dbm]", "Mac Address", "Time received", "Time sent"]];
      var dataHR = [["Value[bpm]", "Time received", "Time sent"]];
      var dataTemperature = [["Value[celcius]", "Time received", "Time sent"]];
      var dataAcceleration = [["x", "y", "z", "Time received", "Time sent"]];
      var dataMagnetometer = [["x", "y", "z", "Time received", "Time sent"]];
     
      //charts
      var chartRSSI = new CanvasJS.Chart("chartRSSI", {
          title: {
              text: "RSSI Values"
          },
          axisY: {
              title: "dbm",
          },
          axisX: {
              title: "Time",
              valueFormatString: "HH:mm:ss",
          },
          legend: {
              horizontalAlign: "center", // "center" , "right"
              verticalAlign: "top",  // "top" , "bottom"
              fontSize: 12
          },
          data: [{
              type: "spline",
              showInLegend: true,
              legendText: "dc:45:11:fb:ea:c4",
              dataPoints: dps1
          },
          {
              type: "spline",
              showInLegend: true,
              legendText: "da:e3:63:e6:e3:c9",
              dataPoints: dps2
          },
          {
              type: "spline",
              showInLegend: true,
              legendText: "de:7c:5f:f1:fb:e6",
              dataPoints: dps3
          }
          ]

      });
      var chartAccel = new CanvasJS.Chart("accel", {
          title: {
              text: "Acceleration"
          },
          axisY: {
              title: "m/s^2",
          },
          axisX: {
              title: "Time",
              valueFormatString: "HH:mm:ss",
          },
          legend: {
              horizontalAlign: "center", // "center" , "right"
              verticalAlign: "top",  // "top" , "bottom"
              fontSize: 12
          },
          data: [{
              type: "line",
              showInLegend: true,
              legendText: "x",

              dataPoints: Ax
          },
          {
              type: "line",
              showInLegend: true,
              legendText: "y",

              dataPoints: Ay
          },
          {
              type: "line",
              showInLegend: true,
              legendText: "z",

              dataPoints: Az
          }
          ]

      });
      var chartHR = new CanvasJS.Chart("chartHR", {
          title: {
              text: "Heartrate"
          },
          axisY: {
              title: "bpm"
          },
          axisX: {
              title: "Time",
              valueFormatString: "HH:mm:ss"
          },
          data: [{
              type: "line",
              color: "red",
              indexLabel: "{y}",
              dataPoints: dpsHR
          }]
      });
      var chartTemp = new CanvasJS.Chart("chartTemp", {
          title: {
              text: "Temperature"
          },
          axisY: {
              title: "Celcius"
          },
          axisX: {
              title: "Time",
              valueFormatString: "HH:mm:ss"
          },
          data: [{
              type: "line",
              color: "green",
              indexLabel: "{y}",
              dataPoints: dpsT
          }]
      })
      var chartMagnet = new CanvasJS.Chart("magnet", {
          title: {
              text: "Magnetometer"
          },
          axisY: {
              title: "μT"
          },
          axisX: {
              title: "Time",
              valueFormatString: "HH:mm:ss"
          },
          legend: {
              horizontalAlign: "center", // "center" , "right"
              verticalAlign: "top",  // "top" , "bottom"
              fontSize: 12
          },
          data: [{
              type: "line",
              showInLegend: true,
              legendText: "x",

              dataPoints: Mx
          },
          {
              type: "line",
              showInLegend: true,
              legendText: "y",

              dataPoints: My
          },
          {
              type: "line",
              showInLegend: true,
              legendText: "z",

              dataPoints: Mz
          }
          ]
      })
      chartRSSI.render();
      chartHR.render();
      chartTemp.render();
      chartAccel.render();
      chartMagnet.render();
      var dataLength = 30; // number of dataPoints visible at any point

      var updateRSSI = function (dataArray, value, mac, dateSent) {
          if (dataArray.length <= dataLength) {
              xVal = new Date(dateSent);
              dateReceived = getDate()
              yVal = value;
              dataArray.push({
                  x: xVal,
                  y: yVal
              });
              dataRSSI.push([value, mac, dateReceived, dateSent])
          }
          if (dataArray.length > dataLength) {
              dataArray.shift();
          }
          chartRSSI.render();
      };

      var updateTempOrHr = function (dataArray, value, store, chart, dateSent) {
          if (dataArray.length <= dataLength) {
              xVal = new Date(dateSent);
              dateReceived = getDate()
              yVal = value;
              dataArray.push({
                  x: xVal,
                  y: yVal
              });
              values = [yVal, dateReceived, dateSent]
              addValuesToCSV(values,"hr.csv")
              store.push([yVal, dateReceived, dateSent])

          }
          if (dataArray.length > dataLength) {
              dataArray.shift();
          }
          chartHR.render();
          chartTemp.render();

      };

      var updateAccelOrMagnet = function (x, y, z, dataX, dataY, dataZ, storageArray, dateSent) {
          if (dataX.length <= dataLength) {
              xVal = new Date(dateSent);
              dateReceived = getDate();
              yValx = x * 1;
              yValy = y * 1;
              yValz = z * 1;
              dataX.push({
                  x: xVal,
                  y: yValx
              });
              dataY.push({
                  x: xVal,
                  y: yValy
              });
              dataZ.push({
                  x: xVal,
                  y: yValz
              });
              storageArray.push([yValx, yValy, yValz, dateReceived, dateSent])



          }
          if (dataX.length > dataLength) {
              dataX.shift();
          }
          if (dataY.length > dataLength) {
              dataY.shift();
          }
          if (dataZ.length > dataLength) {
              dataZ.shift();
          }
          chartAccel.render();
          chartMagnet.render();
      }

      function onLine(line) {
          var d = line.split(",");
          if (d.length == 5 && d[0] == "A") {
              x = d[1];
              y = d[2];
              z = d[3];
              dateSent = d[4];
              updateAccelOrMagnet(x, y, z, Ax, Ay, Az, dataAcceleration, dateSent)
          }
          if (d.length == 5 && d[0] == "M") {
              x = d[1];
              y = d[2];
              z = d[3];
              dateSent = d[4];
              updateAccelOrMagnet(x, y, z, Mx, My, Mz, dataMagnetometer, dateSent)
          }
          if (d.length == 4 && d[0] == "Sensor1") {
              var rssi = parseInt(d[1])
              var mac = d[2]
              dateSent = d[3]
              updateRSSI(dps1, rssi, mac, dateSent)
          }
          if (d.length == 4 && d[0] == "Sensor2") {
              var rssi = parseInt(d[1])
              var mac = d[2]
              dateSent = d[3]
              updateRSSI(dps2, rssi, mac, dateSent)
          }
          if (d.length == 4 && d[0] == "Sensor3") {
              var rssi = parseInt(d[1])
              var mac = d[2]
              dateSent = [3]
              updateRSSI(dps3, rssi, mac, dateSent)
          }


          if (d.length == 4 && d[0] == "H") {
              var value = parseInt(d[1]);
              var dateSent = d[3];
              updateTempOrHr(dpsHR, value, dataHR, chartHR, dateSent);
          }
          if (d.length == 3 && d[0] == "T") {
              var temp = parseFloat(d[1]);
              var dateSent = d[2];
              updateTempOrHr(dpsT, temp, dataTemperature, chartTemp, dateSent);

          }
      }
      function getDate() {
          const d = new Date();
          const m = parseInt(d.getMonth()) + 1;
          const date = d.getDate() + "/" +
              m + "/" +
              d.getFullYear() + " " +
              d.getHours() + ":" +
              d.getMinutes() + ":" +
              d.getSeconds() + ":" +
              d.getMilliseconds();
          return date;
      }