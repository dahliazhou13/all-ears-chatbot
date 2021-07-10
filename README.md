# all-ears-chatbot
A voice chatbot developed in DialogFlow that helps senior with medical difficulties during the pandemic

## Set up the chatbot
import pill-agent.zip to your Dialogflow project. Go to Fulfilment, enable inline editor, and replace index.js with the content in [index.js](index.js).

Follow **Set up the Google Calendar API** to find calendar ids of the patient calendar and the doctor calendar.

## Set up the Google Calendar API
Follow this tutorial [Node.js quickstart](https://developers.google.com/calendar/api/quickstart/nodejs)

## Schedule a pill reminder
Sample phrases: remind me to take heart pills at 10am tomorrow.

Required parameter: date, time, pill type

## Schedule a doctor appointment
Sample phrases: I have a stomache. Can I schedule an appointment tomorrow at 5

Required parameter: date, time, symptom