#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// Change the credentials below, so your ESP8266 connects to your router
const char* ssid = "SueNet";
const char* password = "nunuazako";

// Change the variable to your Raspberry Pi IP address, so it connects to your MQTT broker
const char* mqtt_server = "192.168.43.125"; //RasPi IP

#define mqttPort 1883
#define MQTT_SERIAL_PUBLISH_CH "/environment/airData"

// Initializes the espClient. You should change the espClient name if you have multiple ESPs running in your home automation system
WiFiClient espClient;
PubSubClient client(espClient);

// Timers auxiliar variables
long now = millis();
long lastMeasure = 0;

// Don't change the function below. This functions connects your ESP8266 to your router
void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("WiFi connected - ESP IP address: ");
  Serial.println(WiFi.localIP());
}

// This function reconnects your ESP8266 to your MQTT broker(The RasPI)
// Change the function below if you want to subscribe to more topics with your ESP8266 
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");  
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

//------------ CONNECTION TO RasPI -------------
// The setup function sets your ESP GPIOs to Outputs, starts the serial communication at a baud rate of 115200
// It also sets your mqtt broker
void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqttPort);
}

void publishSerialData(char *serialData){
  if (!client.connected()) {
    reconnect();
  }
  now = millis();
  // Publishes new readings every 30 seconds
  if (now - lastMeasure > 30000) {
    lastMeasure = now;
  }
  client.publish(MQTT_SERIAL_PUBLISH_CH, serialData);
}

void loop() {
  if(!client.loop())
    client.connect("ESP8266Client");
  if (Serial.available() > 0) {
     char bfr[101];
     memset(bfr,0, 101);
     Serial.readBytesUntil( '\n',bfr,100);
     publishSerialData(bfr);
     //Serial.print(bfr);
   }
}
