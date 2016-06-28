if (!process.env.SENDGRID_KEY) {
  console.log("SENDGRID_KEY environment variable required.");
  process.exit(1);
}

if (!process.env.TO_EMAILS) {
  console.log("TO_EMAILS environment variable required.");
  process.exit(1);
}

var port = process.env.PORT || 8080;
var toEmails = process.env.TO_EMAILS.split(',');

var debug = require('debug')('ts');
var cors = require('cors');
var bodyParser = require('body-parser');
var express = require('express');

var sendgrid = require('sendgrid');
var sg_helper = sendgrid.mail;
var sg = sendgrid.SendGrid(process.env.SENDGRID_KEY);

/**
 * Sends a demo email.
 *
 * @param      {string}            from      Sender email.
 * @param      {string}            fromName  Sender name (optional).
 * @param      {(Array|string[])}  to        Array of recipient emails.
 * @param      {Function}          fn        Callback function.
 */
function sendDemoEmail(from, fromName, to, fn) {
  if (to.constructor != Array) {
    to = [to];
  }

  var fromEmail = new sg_helper.Email(from, fromName);
  var toEmails = [];
  to.forEach(function (e) {
    toEmails.push(new sg_helper.Email(e));
  });
  var subject = 'Testing Services Demo Request (landing page)';
  var requester = fromName ? fromName + ' (' + from + ')' : from;
  var content = new sg_helper.Content('text/plain', 'Hi,\n\nTesting Services Demo requested by ' + requester);
  
  // build mail
  var mail = new sg_helper.Mail();
  mail.setFrom(fromEmail);
  
  var personalization = new sg_helper.Personalization();
  toEmails.forEach(function (to) {
    personalization.addTo(to);
  });
  mail.addPersonalization(personalization);

  mail.setSubject(subject);
  mail.addContent(content);

  // build request
  var requestBody = mail.toJSON();
  var request = sg.emptyRequest();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;

  debug('Sending email from ' + from + ' to: ' + to.join(','));
  sg.API(request, function (response) {
    debug('Response status code: ' + response.statusCode);
    fn();
  });
}


// configure express app
var app = express();

// CORS
app.use(cors());

// JSON body parsing
app.use(bodyParser.json());

/**
 * Healthcheck endpoint.
 */
app.get('/', function (req, res) {
  res.send('OK');
});

/**
 * Sends pre-defined email from sender specified by parameters: {email, name}
 */
app.post('/', function (req, res) {
  var email = req.body.email;
  if (!email) {
    return res.status(400).end('email parameter required.');
  }

  var name = req.body.name;
  sendDemoEmail(email, name, toEmails, function () {
    res.end();
  });
});
 
app.listen(port, function () {
  debug('Listening on port: ' + port);
});