import paho.mqtt.client as mqtt
import simplejson as json
from pymongo import MongoClient

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("/environment/airData")

# The callback for when a PUBLISH message is received from the ESP8266.
def on_message(client, userdata, message):
    print(message.topic + " " + str(message.payload))
    if message.topic == "/environment/airData":
        print("Sensor data readings update")

        readings_json = json.loads(message.payload)
        print("String:" +str(readings_json))


        #connect to MongoDB
        mongo_client = MongoClient("mongodb://192.168.43.90:27017") #My PC IP
                
        # The Database used
        db = mongo_client.airProject

        # FIND IN MONGODB
        db.airData.insert_one(readings_json)



#MQTT Client
mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message

mqttc.connect("localhost", 1883, 60)    #localhost = RasPI IP = 192.168.43.125

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
mqttc.loop_forever()
