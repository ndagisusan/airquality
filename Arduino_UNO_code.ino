#include <RTClib.h>
#include <DHT.h>
#include <DHT_U.h>
#include <SoftwareSerial.h>

SoftwareSerial sw(2, 3); // RX=NodeMCU TX , TX=NodeMCU RX

#define DHTPIN 10     //the dht pin
#define DHTTYPE DHT11   // DHT 11 type
DHT dht(DHTPIN, DHTTYPE);   // Initialize DHT sensor.

#define pm25Pin 5  // defines pins numbers
#define pm10Pin 6
#define mq9Sensor A0
#define mq135Sensor A1

//DateTime now = rtc.now();
unsigned long tm = 0; //time
int count = 1;  //Counts the number of readings taken

void setup() {
  Serial.begin(115200); // Starts the serial communication
  dht.begin();
  sw.begin(115200);
  Serial.println("AN IoT AIR QUALITY ANALYSIS AND ALERT SYSTEM:");
  Serial.println(" ");
  delay(2000); // 60s(1 min) for stabilization, of the SDS011
}

void loop() {
  tm = millis();  //No of milliseconds that have passed since the program began
  read(); 
  delay(30000);  //sampling time for the unit - 30seconds (CAN BE VARIED)
}

template<typename T>   //For the JSON format
String format(String param,T level){
  String delim("\"");
  return delim+param+delim+":"+level;
} 

void read(){
  int timeoutDelay = 1500000; //(1500000 micro-seconds)1.5 seconds for the pulse sent in the SDS011 for reading

  //----------------------SDS 011-------------------------
  int pm25High = pulseIn(pm25Pin, HIGH, timeoutDelay)/1000;   //in milliseconds
  int pm10High = pulseIn(pm10Pin, HIGH, timeoutDelay)/1000;

  //-------------MQ Sensors--------------
  int mq9Value = analogRead(mq9Sensor);
  int mq135Value = analogRead(mq135Sensor);

  //------------DHT 11------------
  int h = dht.readHumidity();
  float t = dht.readTemperature(); // Read temperature in Celsius (default)

  // Check if any reads from the DHT11 failed and exit early (to try again).
  /*
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  */

  //-----------GPS CO-ORDINATES---------------



  //--------------------------DISPLAY TO SERIAL MONITOR---------------------------------

  Serial.print("Count: ");
  Serial.println(count++);
  Serial.print("PM2.5 concentration: ");
  Serial.print(pm25High-2);
  Serial.println("ug/m3");
  Serial.print("PM10 concentration: ");
  Serial.print(pm10High-2);
  Serial.println("ug/m3");
  Serial.print("CO concentration: ");
  Serial.print(mq9Value);
  Serial.println("ppm");
  Serial.print("CO2 concentration: ");
  Serial.print(mq135Value);
  Serial.println("ppm");  
  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.println("%");
  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.println("*C");


  //--------------------------JSON FORMAT-------------------------------
  String ts = format<unsigned long>("ts",tm);
  String pm25 = format<int>("pm25",pm25High-2);
  String pm10 = format<int>("pm10",pm10High-2);
  String co = format<int>("co",mq9Value);
  String co2 = format<int>("co2",mq135Value);
  String humidity = format<int>("humidity",h);
  String temperature = format<float>("temp",t);

    //Prepare a JSON payload string
  String payload = "{";
  payload += ts;
  payload += ",";
  payload += pm25;
  payload += ",";
  payload += pm10;
  payload += ",";
  payload += co; 
  payload += ",";
  payload += co2;
  payload += ",";
  payload += humidity;
  payload += ",";
  payload += temperature; 
  payload += "}"; 

  //-------SEND TO ESP8266 FOR TRANSMISSION--------------
  Serial.print("JSON String: ");
  Serial.println(payload);
  Serial.println(" ");
  sw.println(payload);
}
