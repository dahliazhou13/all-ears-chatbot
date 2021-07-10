'use strict';

// Import the Dialogflow module from Google client libraries.
const functions = require('firebase-functions');
const {google} = require('googleapis');
const {WebhookClient} = require('dialogflow-fulfillment');

// Enter your calendar ID below and service account JSON below
const doctorcalendarId = "";
const calendarId = "";
const serviceAccount = {
  "type": "service_account",
  "project_id": "",
  "private_key_id": "<private_key_id>",
  "private_key": "<private key here>",
  "client_id": "<client_id>",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": ""
}
; // Starts with {"type": "service_account",...

// Set up Google Calendar Service account credentials
const serviceAccountAuth = new google.auth.JWT({
 email: serviceAccount.client_email,
 key: serviceAccount.private_key,
 scopes: 'https://www.googleapis.com/auth/calendar'
});

const calendar = google.calendar('v3');
process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements

const timeZone = 'America/New_York';
const timeZoneOffset = '-05:00';

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
 const agent = new WebhookClient({ request, response });
 console.log("Parameters", agent.parameters);
 const appointment_type = agent.parameters.AppointmentType;
 const symptom = agent.parameters.symptoms;

  function makeAppointment (agent) {
   // Calculate appointment start and end datetimes (end = +1hr from start)
   const dateTimeStart = new Date(Date.parse(agent.parameters.date.split('T')[0] + 'T' + agent.parameters.time.split('T')[1].split('-')[0] + timeZoneOffset));
   const dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));
   const appointmentTimeString = dateTimeStart.toLocaleString(
     'en-US',
     { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
   );
    // Check the availability of the time, and make an appointment if there is time on the calendar
   return createCalendarEvent(dateTimeStart, dateTimeEnd, appointment_type).then(() => {
     agent.add(`Ok. Medication reminder for ${appointmentTimeString} is set up.`);
   }).catch(() => {
     agent.add(`I'm sorry, there are no slots available for ${appointmentTimeString}.`);
   });
 }

 function makeDoctorAppointment (agent) {
    // Calculate appointment start and end datetimes (end = +1hr from start)
    const dateTimeStart = new Date(Date.parse(agent.parameters.date.split('T')[0] + 'T' + agent.parameters.time.split('T')[1].split('-')[0] + timeZoneOffset));
    const dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));
    const appointmentTimeString = dateTimeStart.toLocaleString(
      'en-US',
      { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
    );
     // Check the availability of the time, and make an appointment if there is time on the calendar
    return createNonConflictCalendarEvent(dateTimeStart, dateTimeEnd, symptom).then(() => {
      agent.add(`Ok, let me see if we can fit you in. ${appointmentTimeString} is fine!. Appointment Scheduled`);
    }).catch(() => {
      agent.add(`I'm sorry, there are no slots available for ${appointmentTimeString}.`);
    });
  }
// Handle the Dialogflow intent named 'Schedule Appointment'.
 let intentMap = new Map();
 intentMap.set('Schedule Appointment', makeAppointment);
 intentMap.set('Schedule Doctor',makeDoctorAppointment);
 agent.handleRequest(intentMap);


});

function getSymptoms (symptoms){
    var text = "";
    for( var i = 0; i < symptoms.length; i++){
        text += symptoms[i];
        if(i != symptoms.length-1){
            text += ' , ';
        }
    }
    return text;
}

function createNonConflictCalendarEvent (dateTimeStart, dateTimeEnd, symptom) {
    return new Promise((resolve, reject) => {
      calendar.events.list({
        auth: serviceAccountAuth, // List events for time period
        calendarId: doctorcalendarId,
        timeMin: dateTimeStart.toISOString(),
        timeMax: dateTimeEnd.toISOString()
      }, (err, calendarResponse) => {
        // Check if there is a event already on the Calendar
        if (err || calendarResponse.data.items.length > 0) {
          reject(err || new Error('Requested time conflicts with another appointment'));
        } else {
          // Create event for the requested time period
          calendar.events.insert({ auth: serviceAccountAuth,
            calendarId: doctorcalendarId,
            resource: {summary: 'Doctor Appointment', description: getSymptoms(symptom),
              start: {dateTime: dateTimeStart},
              end: {dateTime: dateTimeEnd}},
          }, (err, event) => {
            err ? reject(err) : resolve(event);
          }
          );
        }
      });
      calendar.events.list({
        auth: serviceAccountAuth, // List events for time period
        calendarId: calendarId,
        timeMin: dateTimeStart.toISOString(),
        timeMax: dateTimeEnd.toISOString()
      }, (err, calendarResponse) => {
        // Check if there is a event already on the Calendar
        if (err || calendarResponse.data.items.length > 0) {
          reject(err || new Error('Requested time conflicts with another appointment'));
        } else {
          // Create event for the requested time period
          calendar.events.insert({ auth: serviceAccountAuth,
            calendarId: calendarId,
            resource: {summary: 'Doctor Appointment', description: 'Doctor Appointment',
              start: {dateTime: dateTimeStart},
              end: {dateTime: dateTimeEnd}},
          }, (err, event) => {
            err ? reject(err) : resolve(event);
          }
          );
        }
      });
    });
   }

//Creates calendar event in Google Calendar
function createCalendarEvent (dateTimeStart, dateTimeEnd, appointment_type) {
 return new Promise((resolve, reject) => {
   calendar.events.list({
     auth: serviceAccountAuth, // List events for time period
     calendarId: calendarId,
     timeMin: dateTimeStart.toISOString(),
     timeMax: dateTimeEnd.toISOString()
   }, (err, calendarResponse) => {
     // Check if there is a event already on the Calendar

       // Create event for the requested time period
       calendar.events.insert({ auth: serviceAccountAuth,
         calendarId: calendarId,
         resource: {summary: appointment_type +' pills', description: appointment_type,
           start: {dateTime: dateTimeStart},
           end: {dateTime: dateTimeEnd}},
           recurrence: ['RRULE:FREQ=WEEKLY;COUNT=2']
       }, (err, event) => {
         err ? reject(err) : resolve(event);
       }
       );
     }
   );
 });
}
