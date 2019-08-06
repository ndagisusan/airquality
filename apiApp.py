'''Flask app with MongoDB'''

import simplejson as json
import africastalking
from pymongo import MongoClient
import pymongo
from flask import Flask, request, Response
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app)


def update_subscribers():
    while True:
        time.sleep(update_period)
        send_sms()
        continue

# THE MAXIMUM LIMITS AS SPECIFIED BY THE NEMA AND UNEP FOR THE INDIVIDUAL POLLUTANTS


def check_limit(parameter, level):
    if parameter == "pm25":
        if level > 75:
            return True
        return False

    if parameter == "pm10":
        if level > 150:
            return True
        return False

    if parameter == "co":
        if level > 9:
            return True
        return False

    if parameter == "co2":
        if level > 1000:
            return True
        return False

    if parameter == "humidity":
        if level > 85:      ##For the DHT sensor
            return True
        return False

    if parameter == "temp":
        if level > 45:      ##For the DHT sensor
            return True
        return False


def resolve_name(name):
    if name == "pm25":
        return "PM 2.5"
    if name == "pm10":
        return "PM 10"
    if name == "co":
        return "Carbon Monoxide (CO)"
    if name == "co2":
        return "Carbon IV Oxide (CO2)"
    if name == "humidity":
        return "Humidity"
    if name == "temp":
        return "Temperature"


# Checking clean air requirements --- ANALYSIS POINT
def send_sms():
    payload = {
        "ts": [],
        "pm25": [],
        "pm10": [],
        "co": [],
        "co2": [],
        "humidity": [],
        "temp": [],
    }

    # FIND IN MONGODB
    data = db.airData  # The collection
    x = data.find_one(sort=[('_id', pymongo.DESCENDING)])
    payload["ts"] = x["ts"]
    payload["pm25"] = x["pm25"]
    payload["pm10"] = x["pm10"]
    payload["co"] = x["co"]
    payload["co2"] = x["co2"]
    payload["humidity"] = x["humidity"]
    payload["temp"] = x["temp"]

    print(json.dumps(payload))
    text = "Warning! The following level(s) have been exceeded:\n"
    i = 1
    for key, value in payload.items():
        is_check_limit = check_limit(key, value)
        print("Is Check Limit:" + str(is_check_limit))
        if is_check_limit:
            text += str(i) + ". " + resolve_name(key) + "\n"
            i += 1

            # Get numbers
            subs = db.userData.find({"PhoneNumber": {"$exists": True}})
            for sub in subs:
                response = sms.send(text, [sub["PhoneNumber"]])  # FOR THE PROGRAM TO SEND ALERT MESSAGES
                print(response)

# AQI calculation
def good(gas, conc):
    level = -1
    if gas == "pm25ave":
        level = 0 + (25/6)*conc
    if gas == "pm10ave":
        level = 0 + (50/54)*conc
    if gas == "coave":
        level = 0 + (125/11)*conc

    if level <= 50:
        return level
    return -1


def moderate(gas,conc):
    level = -1
    if gas == "pm25ave":
        level = 51 + (490/233)*(conc - 12.1)
    if gas == "pm10ave":
        level = 51 + (49/99)*(conc - 55)
    if gas == "coave":
        level = 51 + 10*(conc - 4.5)

    if level <= 100:
        return level
    return -1


def unhealthy_sensitive(gas, conc):
    level = -1
    if gas == "pm25ave":
        level = 101 + (490/199)*(conc - 35.5)
    if gas == "pm10ave":
        level = 101 + (49/99)*(conc - 155)
    if gas == "coave":
        level = 101 + (490/29)*(conc - 9.5)

    if level <= 150:
        return level
    return -1


def unhealthy(gas, conc):
    level = -1
    if gas == "pm25ave":
        level = 151 + (490/949)*(conc - 55.5)
    if gas == "pm10ave":
        level = 151 + (49/99)*(conc - 255)
    if gas == "coave":
        level = 151 + (490/29)*(conc - 12.5)

    if level <= 200:
        return level
    return -1


def very_unhealthy(gas, conc):
    level = -1
    if gas == "pm25ave":
        level = 201 + (990/999)*(conc - 150.5)
    if gas == "pm10ave":
        level = 201 + (99/69)*(conc - 355)
    if gas == "coave":
        level = 201 + (990/149)*(conc - 15.5)

    if level <= 150:
        return level
    return -1


def hazardous(gas, conc):
    level = -1
    if gas == "pm25ave":
        level = 301 + (1990/2499)*(conc - 250.5)
    if gas == "pm10ave":
        level = 301 + (199/179)*(conc - 425)
    if gas == "coave":
        level = 301 + 10*(conc - 30.5)

    return level


def aqi_comparison(level):  #For AQI analysis
    # PM2.5

    # PM10

    # CO

    # Return the largest AQI of the three gases
    pass


@app.route('/signin', methods=['GET', 'POST'])
def sign_in():
    # FIND IN MONGODB
    user = db.userData  # The collection

    name = request.form.get('name')
    email = request.form.get('email')  # from webapp

    result = user.find_one({"Email": email})
    if result:
        print("USER FOUND!")
        return Response(response={"Success": 0})

    user.insert({"Name": name, "Email": email})
    return Response(response={"Success": 1})


@app.route('/subscribe', methods=['GET', 'POST'])
def subscribe():
    # FIND IN MONGODB
    user = db.userData  # The collection

    email = request.form.get('email')  # from JS script
    number = request.form.get('phonenumber')

    query = {"Email": email}
    update = {"$set": {"Email": email, "PhoneNumber": number}}

    user.update_one(query, update)

    return Response(response={"Success": 1})


@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    payload = {
        "ts": [],
        "pm25": [],
        "pm25ave": 0,
        "pm10": [],
        "pm10ave": 0,
        "co": [],
        "coave": 0,
        "co2": [],
        "co2ave": 0,
        "humidity": [],
        "temp": [],
    }

    # FIND IN MONGODB
    data = db.airData  # The collection
    i = 0
    for x in data.find(sort=[('ts', pymongo.DESCENDING)]):  # Structuring the data
        if i >= graph_limit:
            break
        payload["ts"].append(x["ts"])
        payload["pm25"].append(x["pm25"])
        payload["pm10"].append(x["pm10"])
        payload["co"].append(x["co"])
        payload["co2"].append(x["co2"])
        payload["humidity"].append(x["humidity"])
        payload["temp"].append(x["temp"])
        i += 1

        # Arrange the data sent to the dashboard

        payload["pm25ave"] = sum(payload["pm25"]) / float(len(payload["pm25"]))
        payload["pm10ave"] = sum(payload["pm10"]) / float(len(payload["pm10"]))
        payload["coave"] = sum(payload["co"]) / float(len(payload["co"]))
        payload["co2ave"] = sum(payload["co2"]) / float(len(payload["co2"]))

    print(json.dumps(payload))

    return Response(response=json.dumps(payload))  # HTTP response format


if __name__ == '__main__':
    # Initialize SDK
    username = "airProject"  # use 'sandbox' for development in the test environment
    api_key = "7e511cc41bad552a6841c3fe3d761a266e7fc7b29c46daf8c2e419359cd13baa"  # use your sandbox app API key for development in the test environment

    africastalking.initialize(username, api_key)

    # Initialize a service e.g. SMS
    sms = africastalking.SMS

    # Establishing a connection to MongoDB server
    client = MongoClient("mongodb://localhost:27017")
    # The Database used
    db = client.airProject
    update_period = 30
    graph_limit = 20
    thread = threading.Thread(name='sms', target=update_subscribers)
    thread.daemon = True
    thread.start()
    app.run()
