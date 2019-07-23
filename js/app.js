base = "http://localhost:5000/"


function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  
  //signed in , redirect to dashboard
  $.post(base+"signin",  //To track the number of users I have 
  {
    name: profile.getName(),  //For Flask API that will later post in DB
    email: profile.getEmail()
  },
  function(data, status){   
    console.log(data)
    localStorage.setItem("email",profile.getEmail()); //localStorage is the browser of the person visiting the site
    window.location.href ="dashboard.html"    //sets the user email on successful sign in
  });

}

function signedIn(){
  var email = localStorage.getItem("email")
  if(email == null){
    window.location.href="signin.html"
  }

}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    localStorage.clear();
    if(email == null){
      window.location.href="signin.html"
    }
  });
}

function getData(c) {
  $.post(base+"dashboard",   
  {
    email: localStorage.getItem("email")  //Send to server (Flask API)
  },
  function(payload, status){   //Response from Flask
    data = JSON.parse(payload);
    console.log(data)
    chart.xaxis = data["ts"]
    chart.pm25 = data["pm25"]
    chart.pm25ave = data["pm25ave"]
    chart.pm10 = data["pm10"]
    chart.pm10ave = data["pm10ave"]
    chart.co = data["co"]
    chart.coave = data["coave"]
    chart.co2 = data["co2"]
    chart.co2ave = data["co2ave"]
    chart.humidity = data["humidity"]
    chart.temp = data["temp"]

    if(c){
      chart.initDashboardPageCharts();
      return;
    }

    for(i=0;i<data["ts"].length;i++){
      var newHtml = '<tr><td>' + data.pm25[i] + '</td>'
      + '<td>' + data.pm10[i] + '</td>'
      + '<td>' + data.co[i] + '</td>'
      + '<td>' + data.co2[i] + '</td>'
      + '<td>' + data.humidity[i] + '</td>'
      + '<td>' + data.temp[i] + '</td></tr>'
      $('#data tr:last').after(newHtml);
    }
    
  });
}

function subscribe() {
  var phonenumber = ""
  $('#subform').submit(function(){  
    phonenumber = $('#get').val()
    console.log(phonenumber)
    var pattern = "\\+254[0-9]{9}"
    var res = phonenumber.match(pattern)
    console.log(res)
    if(res){
      document.getElementById('popUp').style.visibility ='hidden'
      document.getElementById('error').style.display='none'
      console.log(phonenumber)

      $.post(base+"subscribe",   
      {
        email: localStorage.getItem("email"), //Send to server (Flask API)
        phonenumber: phonenumber
      },
      function(data, status){   //Response from Flask
        console.log(data) 
      });
    }else{
      document.getElementById('error').style.visibility ='visible'
      document.getElementById('error').style.color ='red'
     
    }
    
    return false; // return false to prevent typical submit behavior

});
  
}

chart = {
  // xaxis: [],
  pm25: [],
  pm25ave: [],
  pm10: [],
  pm10ave: [],
  co: [],
  coave: [],
  co2: [],
  co2ave: [],
  humidity: [],
  temp: [],

  initDashboardPageCharts: function() {

    chartColor = "#FFFFFF";

    // General configuration for the charts with Line gradientStroke //OPTIONS
    gradientChartOptionsConfiguration = {
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      tooltips: {
        bodySpacing: 4,
        mode: "nearest",
        intersect: 0,
        position: "nearest",
        xPadding: 10,
        yPadding: 10,
        caretPadding: 10
      },
      responsive: 1,
      scales: {
        yAxes: [{
          display: 0,
          gridLines: 0,
          ticks: {
            display: false
          },
          gridLines: {
            zeroLineColor: "transparent",
            drawTicks: false,
            display: false,
            drawBorder: false
          }
        }],
        xAxes: [{
          display: 0,
          gridLines: 0,
          ticks: {
            display: false
          },
          gridLines: {
            zeroLineColor: "transparent",
            drawTicks: false,
            display: false,
            drawBorder: false
          }
        }]
      },
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 15,
          bottom: 15
        }
      }
    };
  
    //Average Concentration
    var ctx = document.getElementById("AverageReadingsChart").getContext("2d");
    console.log(chart.xaxis)
    var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, '#80b6f4');
    gradientStroke.addColorStop(1, chartColor);

    var gradientFill = ctx.createLinearGradient(0, 200, 0, 50);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    gradientFill.addColorStop(1, "rgba(255, 255, 255, 0.24)");
    
    var mixedChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chart.xaxis, //ts
        datasets: [{
          label: "PM2.5",
          yAxisID: "A",
          borderColor: "#f96332",
          pointBorderColor: chartColor,
          pointBackgroundColor: "#1e3d60",
          pointHoverBackgroundColor: "#1e3d60",
          pointHoverBorderColor: chartColor,
          pointBorderWidth: 1,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          backgroundColor: "#f96332",
          borderWidth: 2,
          data: chart.pm25 //PM2.5 data from DB
        },{
          label: "PM10",
          yAxisID: "A",
          borderColor: "yellow",
          pointBorderColor: chartColor,
          pointBackgroundColor: "#1e3d60",
          pointHoverBackgroundColor: "#1e3d60",
          pointHoverBorderColor: chartColor,
          pointBorderWidth: 1,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          backgroundColor: "yellow",
          borderWidth: 2,
          data: chart.pm10 //PM10 data from DB
        },{
          label: "CO",
          yAxisID: "A",
          borderColor: "red",
          pointBorderColor: chartColor,
          pointBackgroundColor: "#1e3d60",
          pointHoverBackgroundColor: "#1e3d60",
          pointHoverBorderColor: chartColor,
          pointBorderWidth: 1,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          backgroundColor: "red",
          borderWidth: 2,
          data: chart.co //CO data from DB
        },{
          label: "CO2",
          yAxisID: "A",
          borderColor: "#7DF481",
          pointBorderColor: chartColor,
          pointBackgroundColor: "#1e3d60",
          pointHoverBackgroundColor: "#1e3d60",
          pointHoverBorderColor: chartColor,
          pointBorderWidth: 1,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          backgroundColor: "#7DF481",
          borderWidth: 2,
          data: chart.co2 //CO2 data from DB
        },{
          type: "line",
          label: "Temperature",
          yAxisID: "B",
          borderColor: "#CC8899",
          pointBorderColor: chartColor,
          pointBackgroundColor: "#1e3d60",
          pointHoverBackgroundColor: "#1e3d60",
          pointHoverBorderColor: chartColor,
          pointBorderWidth: 1,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          backgroundColor: "transparent",
          borderWidth: 2,
          data: chart.temp //Temperature readings from DB
        },{
          type: "line",
          label: "Humidity",
          yAxisID: "B",
          borderColor: "#0080FF",
          pointBorderColor: chartColor,
          pointBackgroundColor: "#1e3d60",
          pointHoverBackgroundColor: "#1e3d60",
          pointHoverBorderColor: chartColor,
          pointBorderWidth: 1,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          backgroundColor: "transparent",
          borderWidth: 2,
          data: chart.humidity //Humidity readings from DB  
        }]
      },
      options: {
        layout: {
          padding: {
            left: 20,
            right: 20,
            top: 10,
            bottom: 10
          }
        },
        maintainAspectRatio: false,
        tooltips: {
          backgroundColor: '#fff',
          titleFontColor: '#333',
          bodyFontColor: '#666',
          bodySpacing: 4,
          xPadding: 10,
          yPadding: 10,
          caretPadding: 10,
          mode: "nearest",
          intersect: 0,
          position: "nearest"
        },
        legend: {
          position: "bottom",
          fillStyle: "#FFF",
          display: false
        },
        responsive: 1,
        scales: {
          yAxes: [
          //   {
          //   gridLines: 0,
          //   gridLines: {
          //     zeroLineColor: "transparent",
          //     drawBorder: false
          //   } 
          // },
          {
            id: "A",
              type: "linear",
              position: "left",
              color: "black"
              // ticks: {
              //   max: 2000,
              //   min: 0
            },
            {
              id: "B",
              type: "linear",
              position: "right",
              ticks: {
                max: 100,
                min: 0
              }
            }],
          xAxes: [{
            display: 0,
            gridLines: 0,
            ticks: {
              display: false
            },
            gridLines: {
              zeroLineColor: "transparent",
              drawTicks: false,
              display: false,
              drawBorder: false
            }
          }]
        }
      }
    });

    //PM Concentration
    var cardStatsMiniLineColor = "#fff",
      cardStatsMiniDotColor = "#fff";

    ctx = document.getElementById('PMConcentrationChart').getContext("2d");

    gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, '#80b6f4');
    gradientStroke.addColorStop(1, chartColor);

    gradientFill = ctx.createLinearGradient(0, 170, 0, 50);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    gradientFill.addColorStop(1, "rgba(249, 99, 59, 0.40)");

    var myChart = new Chart(ctx, {
      type: 'line',
      responsive: true,
      data: {
        labels: chart.xaxis,  //ts
        datasets: [{
          label: "PM 2.5",
          borderColor: "#f96332",
          pointBorderColor: "#FFF",
          pointBackgroundColor: "#f96332",
          pointBorderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 1,
          pointRadius: 4,
          fill: true,
          backgroundColor: "#FFF",
          borderWidth: 2,
          data: chart.pm25  //PM 2.5 data from DB
        },{
          label: "PM 10",
          borderColor: "#C49102",
          pointBorderColor: "#FFF",
          pointBackgroundColor: "#C49102",
          pointBorderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 1,
          pointRadius: 4,
          fill: true,
          backgroundColor: "#FFF",
          borderWidth: 2,
          data: chart.pm10  // PM 10 data from DB //FOR COMPARISON  
        }]
      },
      options: gradientChartOptionsConfiguration
    });

    // CO concentration
    ctx = document.getElementById('COConcentrationChart').getContext("2d");

    gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, 'red');
    gradientStroke.addColorStop(1, chartColor);

    gradientFill = ctx.createLinearGradient(0, 170, 0, 50);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    gradientFill.addColorStop(1, hexToRGB('#18ce0f', 0.4));

    myChart = new Chart(ctx, {
      type: 'line',
      responsive: true,
      data: {
        labels: chart.xaxis,  //ts
        datasets: [{
          label: "CO",
          borderColor: "red",
          pointBorderColor: "#FFF",
          pointBackgroundColor: "red",
          pointBorderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 1,
          pointRadius: 4,
          fill: true,
          backgroundColor: "#FFF",
          borderWidth: 2,
          data: chart.co   //CO data from DB
        }]
      },
      options: gradientChartOptionsConfiguration
    });

    // CO2 concentration
    ctx = document.getElementById('CO2ConcentrationChart').getContext("2d");

    gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, '#18ce0f');
    gradientStroke.addColorStop(1, chartColor);

    gradientFill = ctx.createLinearGradient(0, 170, 0, 50);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    gradientFill.addColorStop(1, hexToRGB('#18ce0f', 0.4));

    myChart = new Chart(ctx, {
      type: 'line',
      responsive: true,
      data: {
        labels: chart.xaxis,  //ts
        datasets: [{
          label: "CO2",
          borderColor: "#18ce0f",
          pointBorderColor: "#FFF",
          pointBackgroundColor: "#18ce0f",
          pointBorderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 1,
          pointRadius: 4,
          fill: true,
          backgroundColor: "#FFF",
          borderWidth: 2,
          data: chart.co2   //CO2 data from DB
        }]
      },
      options: gradientChartOptionsConfiguration
    });

    // Pie Chart
    ctx = document.getElementById('pieChart').getContext("2d");

    gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, '#18ce0f');
    gradientStroke.addColorStop(1, chartColor);

    gradientFill = ctx.createLinearGradient(0, 170, 0, 50);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    gradientFill.addColorStop(1, hexToRGB('#18ce0f', 0.4));

    var mypieChart = new Chart(ctx, {
      type: 'doughnut',
      responsive: true,
    //   data = {
    //     datasets: [{
    //         data: [10, 20, 30]
    //     }],
    
    //     // These labels appear in the legend and in the tooltips when hovering different arcs
    //     labels: [
    //         'Red',
    //         'Yellow',
    //         'Blue'
    //     ]
    //   }
    // });
      data: {
        // labels: xaxis,  //ts
        datasets: [{
          label: "PM 2.5",
          fill: true,
          backgroundColor: "red",
          data: chart.pm25ave   //PM25ave data from DB
        },{
          label: "PM 10",
          fill: true,
          backgroundColor: "blue",
          data: chart.pm10ave   //PM10ave data from DB
        },{
          label: "CO",
          fill: true,
          backgroundColor: "yellow",
          data: chart.coave   //COave data from DB
        },{
          label: "CO2",
          fill: true,
          backgroundColor: "green",
          data: chart.co2ave   //CO2ave data from DB
        }]
      },
      options: gradientChartOptionsConfiguration
    });
  },

  // initGoogleMaps: function() {
  //   var myLatLng = new google.maps.LatLng(-1.0891, 37.0105);
  //   var mapOptions = {
  //     zoom: 13,
  //     center: myLatLng,
  //     scrollwheel: false, //we have disabled the scroll over the map, it is really annoing when you scroll through page
  //     styles: [{
  //       "featureType": "water",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#e9e9e9"
  //       }, {
  //         "lightness": 17
  //       }]
  //     }, {
  //       "featureType": "landscape",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#f5f5f5"
  //       }, {
  //         "lightness": 20
  //       }]
  //     }, {
  //       "featureType": "road.highway",
  //       "elementType": "geometry.fill",
  //       "stylers": [{
  //         "color": "#ffffff"
  //       }, {
  //         "lightness": 17
  //       }]
  //     }, {
  //       "featureType": "road.highway",
  //       "elementType": "geometry.stroke",
  //       "stylers": [{
  //         "color": "#ffffff"
  //       }, {
  //         "lightness": 29
  //       }, {
  //         "weight": 0.2
  //       }]
  //     }, {
  //       "featureType": "road.arterial",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#ffffff"
  //       }, {
  //         "lightness": 18
  //       }]
  //     }, {
  //       "featureType": "road.local",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#ffffff"
  //       }, {
  //         "lightness": 16
  //       }]
  //     }, {
  //       "featureType": "poi",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#f5f5f5"
  //       }, {
  //         "lightness": 21
  //       }]
  //     }, {
  //       "featureType": "poi.park",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#dedede"
  //       }, {
  //         "lightness": 21
  //       }]
  //     }, {
  //       "elementType": "labels.text.stroke",
  //       "stylers": [{
  //         "visibility": "on"
  //       }, {
  //         "color": "#ffffff"
  //       }, {
  //         "lightness": 16
  //       }]
  //     }, {
  //       "elementType": "labels.text.fill",
  //       "stylers": [{
  //         "saturation": 36
  //       }, {
  //         "color": "#333333"
  //       }, {
  //         "lightness": 40
  //       }]
  //     }, {
  //       "elementType": "labels.icon",
  //       "stylers": [{
  //         "visibility": "off"
  //       }]
  //     }, {
  //       "featureType": "transit",
  //       "elementType": "geometry",
  //       "stylers": [{
  //         "color": "#f2f2f2"
  //       }, {
  //         "lightness": 19
  //       }]
  //     }, {
  //       "featureType": "administrative",
  //       "elementType": "geometry.fill",
  //       "stylers": [{
  //         "color": "#fefefe"
  //       }, {
  //         "lightness": 20
  //       }]
  //     }, {
  //       "featureType": "administrative",
  //       "elementType": "geometry.stroke",
  //       "stylers": [{
  //         "color": "#fefefe"
  //       }, {
  //         "lightness": 17
  //       }, {
  //         "weight": 1.2
  //       }]
  //     }]
  //   };

  //   var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  //   var marker = new google.maps.Marker({
  //     position: myLatLng,
  //     title: "JKUAT Juja"
  //   });

  //   // To add the marker to the map, call setMap();
  //   marker.setMap(map);
  // }
}