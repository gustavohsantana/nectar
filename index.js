'use strict';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
	  
	  // Get the sender PSID
	  let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
	  PSID = sender_psid;
	  
	  // Check if the event is a message or postback and
	  // pass the event to the appropriate handler function
	  if (webhook_event.message) {
		handleMessage(sender_psid, webhook_event.message);        
	  } else if (webhook_event.postback) {
		handlePostback(sender_psid, webhook_event.postback);
	  }
	  
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
	
	let response,response2;
	
	var promo;
	
	promo = getRandomResponse();

	// Check if the message contains text
	if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "text": `Procuramos um desconto para: "${received_message.text}". Olha oque encontramos para você! 😎`
    }
  } else if (received_message.attachments) {
  
    // Gets the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
	
	response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
	  }
	}
  
  } 
  
  response2 = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": promo[0],
            "subtitle": "Aperte o botão para gerar o desconto",
            "image_url": promo[1],
            "buttons": [
              {
                "type": "postback",
                "title": "Quero o desconto! 👍",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "Não, obrigado! 👎",
                "payload": "no",
              }
            ],
          }]
        }
	  }
	}
  
  // Sends the response message
  callSendAPI(sender_psid, response);  
  
  // Sends the response2 message
  callSendAPI(sender_psid, response2);  

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
	
   let response,response2,response3;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = {"text": "Acabou de sair do forno 😄! Abaixo está seu cupom: " }
	response2 = {"text": "CUPOM: Feliz2K18" }
  } else if (payload === 'no') {
    response = { "text": "Oops.. Que tal procurar por outras promoções ? " }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
  
  if (payload === 'yes') {
  callSendAPI(sender_psid, response2);
  }
  
  response3 = {"text": "Assim que precisar de mais cupons é só chamar 😉" }
  callSendAPI(sender_psid, response3);

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
	
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  
  // Send
  
  request({
    "uri": "https://graph.facebook.com/v2.6/"+"sender_psid"+"?fields=first_name,last_name,profile_pic&access_token=<PAGE_ACCESS_TOKEN>",
    "method": "GET",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
	  console.log(res);
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
  
}


// Other methods

function getRandomResponse(){
	var matrix = [["Descontos de R$:10,00 para compras acima de R$:50,00 no supermercado Central","https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyG6d3Ol9zaUh-AEMnpBkbLM4SZeV-txFPjgyiXcjYkcQNodNf"],
	["Descontos de R$:4,00 no corte de cabelo no BarberShop", "http://schottdesigner.com/wp-content/uploads/2017/08/barbearia-espaco-mb-logo-portfolio.jpg"],
	["Desconto de R$:5,00 no restaurante Panela de Ferro", "http://www.bloglosophy.com/wp-content/uploads/2014/04/spicy-sausage-hot-pot-600.jpg"]];  
	
	return matrix[Math.floor(Math.random() * matrix.length)];
}