var http = require("http");
var AWS = require('aws-sdk');
//var options = require('./config.js'); // very important to keep the keys safe and secure.
AWS.config.update({region:'us-east-1'});
var AWSaccessKey = ''; //Enter AWSaccesskey
var secretAccessKey = ''; //Enter AWSSecretAccessKey

var creds = new AWS.Credentials({
  accessKeyId: AWSaccessKey, secretAccessKey: secretAccessKey
});

var sqs = new AWS.SQS({apiVersion: '2012-11-05', credentials : creds});

var sns = new AWS.SNS({apiVersion: '2010-03-31',credentials : creds});

var topicArn = ""; //Enter SNS Topic ARN

var watson = require('watson-developer-cloud');

var alchemy_language = watson.alchemy_language({
  api_key: '' // Enter Alchemy API Key
});

var recParams = {
  QueueUrl: '', /* Enter SQS URL */
  MaxNumberOfMessages: 1,
  AttributeNames: [
  "All"
  ],
  /* more items */
  VisibilityTimeout: 43200,
  WaitTimeSeconds: 20
};


(function loop() {
  console.log("trying to fetch tweets from SQS queue...\n");
  sqs.receiveMessage(recParams, function(err, data) {
      if (err) {
        console.log(err);
        }// an error occurred
      else {
        fetchedText = JSON.parse(data.Messages[0].Body);
        console.log("Fetched: ",JSON.parse(data.Messages[0].Body))

        var alchemyParams = {
          text: fetchedText.text,
          outputMode: 'json',
          showSourceText: 1   };

          console.log("Doing Sentimental Analysis now...\n");
          alchemy_language.sentiment(alchemyParams, function (err, response) {
            if (err) {
              console.log("Alchemy Error Occured...Moving on to next tweet\n"+JSON.stringify(err)); // an error occurred 
              process.nextTick(loop);
          }
            else {
              var sentiment = JSON.parse(JSON.stringify(response)).docSentiment;
              var message = {"default":`{"Message from IC"}`, "http":`{"username": "${fetchedText.username}", "text": "${fetchedText.text}", "location": ${JSON.stringify(fetchedText.location)}, "sentiment": ${JSON.stringify(sentiment)}}`};
              var SNSParams = {
                Message: JSON.stringify(message), /* required */
                TopicArn: ''}; // Enter SNS Topic ARN
              sns.publish(SNSParams, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     {
                    console.log(data);           // successful response
                    console.log("SNS Params: "+SNSParams.toString());
                    process.nextTick(loop);
                  }

              });

            }

          });
        }
      });

}());
