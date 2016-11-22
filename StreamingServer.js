AWS = require('aws-sdk');
var Twitter = require('twitter');
//var options = require('./config.js');
AWS.config.update({region:'us-east-1b'});
var AWSaccessKey = ''; //AWS accessKey
var secretAccessKey = ''; //AWSSecretAccessKey

var creds = new AWS.Credentials({
        accessKeyId: AWSaccessKey, secretAccessKey: secretAccessKey
});

var sqs = new AWS.SQS({apiVersion: '2012-11-05', credentials : creds});


var client = new Twitter({
        consumer_key:'', //EnterTwitterCredentials
  consumer_secret: '', //EnterTwitterCredentials
  access_token_key: '', //EnterTwitterCredentials
  access_token_secret: '' //EnterTwitterCredentials
});
 //Pushing tweets into Amazon SQS.
 console.log("Pushing tweets to Amazon SQS now...");
 var hashtags = 'music,food,trump,thanksgiving,clinton,phone,usa,srk,life,body,live,gym,hello';

 client.stream('statuses/filter', {track: hashtags}, function(stream) {
        stream.on('data', function(tweet) {
        if(tweet.geo != null) { // Insert into SQS when tweet with location is found
                console.log("Tweet: "+tweet);
                var obj = {
                        'username': tweet.user.name,
                        'text': tweet.text,
                        'location': tweet.geo
                }

                var sendParams = {
                        MessageBody: JSON.stringify(obj),
                        /* required */
                        QueueUrl: '', /* SQS URL required */
                        DelaySeconds: 0,
                        MessageAttributes: {

                        }
                };

                sqs.sendMessage(sendParams, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else    { console.log("Pushed to SQS\n");

    }
  });

        }
  });
        stream.on('error', function(error) {
                throw error;
        });
 });
