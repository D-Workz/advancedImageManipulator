let utils = {};
const config = require('config');

const cloudantUrl = "https://" + config.get('cloudant.username') + ":" + config.get('cloudant.password') + "@" + config.get('cloudant.host');
const cloudant = require('@cloudant/cloudant')({url: cloudantUrl});
let cloudantDb = cloudant.use(config.get('cloudant.dbName'));

const Kafka = require('node-rdkafka');

let opts = {};
let services;

utils.sendToKafka = function (message){
    services = config.get('event-stream');
    opts.brokers = services.kafka_brokers_sasl;
    opts.api_key = services.api_key;
    opts.calocation = '/etc/ssl/certs';
    let driver_options = {
        //'debug': 'all',
        'metadata.broker.list': opts.brokers,
        'security.protocol': 'sasl_ssl',
        'ssl.ca.location': opts.calocation,
        'sasl.mechanisms': 'PLAIN',
        'sasl.username': 'token',
        'sasl.password': opts.api_key,
        'api.version.request': true,
        'broker.version.fallback': '0.10.2.1',
        'log.connection.close' : false
    };
    let producer_opts = {
        'client.id': 'kafka-nodejs-console-sample-producer',
        'dr_msg_cb': true  // Enable delivery reports with message payload
    };
    for (let key in driver_options) {
        producer_opts[key] = driver_options[key];
    }
    buildProducer(producer_opts, message)
}

function buildProducer(producer_opts, message) {
    return new Promise(function (resolve, reject) {

        // Create Kafka producer
        let topicOpts = {
            'request.required.acks': -1,
            'produce.offset.report': true
        };
        let producer = new Kafka.Producer(producer_opts, topicOpts);
        // Register error listener
        producer.on('event.error', function(err) {
            console.error('Error from producer:' + JSON.stringify(err));
        });
        // Register delivery report listener
        producer.on('delivery-report', function(err, dr) {
            if (err) {
                console.error('Delivery report: Failed sending message ' + dr.value);
                console.error(err);
                // We could retry sending the message
            } else {
                console.log('Message produced, offset: ' + dr.offset);
            }
            producer.disconnect();
            resolve();
        });
        producer.on('ready', function() {
            var key = 'Key';
            console.log('The producer has started');
            message = new Buffer('{name:'+message+'}');
            producer.produce(config.get('topicName'), 0, message, key);
        });
        producer.connect();
    })
}

utils.saveImageToDB = function(image, filename, type) {
    return new Promise(function (resolve, reject) {
            let noOfTries = 0;
            updateDocument(filename, image, type, noOfTries)
                .then(imageName => {
                    resolve(imageName);
                })
                .catch(err => {
                    console.log("Couldnt update document.");
                    reject(err);
                })

    });
};



utils.getImageAndWatermarkFromDB = function(imageName) {
    return Promise.all([
        this.getImageFromDB(imageName),
        this.getImageFromDB('watermark')
    ]);
}


utils.getImageFromDB = function(imageName) {
    return new Promise(function (resolve, reject) {
        cloudantDb
            .get(imageName)
            .then(doc => {
                let imageBase64;
                if(imageName==='watermark'){
                    imageBase64 = decodeBase64Image(doc.data);
                }else{
                    imageBase64 = decodeBase64Image(doc.data.original);
                }
                // console.log(doc)
                resolve({
                    imageData:imageBase64,
                    imageName:imageName
                });
            })
            .catch( err =>{
                // console.log(err);
                reject(err);
            })

    })
};

function updateDocument(documentName, image, type, noOfTries) {
    let imageBase64 = decodeBase64Image(image);
    let fileType = imageBase64.type.match(/\/(.*?)$/)[1];
    return new Promise(function (resolve, reject) {
        cloudantDb.get(documentName).then(imageDoc => {
            imageDoc[type] = {
                // base64string: image,
                type: imageBase64.type,
                data: imageBase64.data,
                fileType: fileType
            };
            cloudantDb.insert(imageDoc, documentName,
                function (error, response) {
                    if (!error) {
                        console.log("Successfully saved " + type + " image in DB");
                        resolve(documentName);
                    } else {
                        if(noOfTries<=5){
                            noOfTries++;
                            console.log("("+noOfTries+"/5) Trying to update document again.");
                            setTimeout(function(){
                                updateDocument(documentName,image,type, noOfTries)
                                    .then(imageName => {
                                        resolve(imageName);
                                    })
                                    .catch(err => {
                                        //TODO check better recursions only supports one time fail update
                                        console.log("Couldnt update document.");
                                        reject(err);
                                    })
                            }, 100);
                        }else {
                            console.error("("+noOfTries+"/5) Stop trying.", error);
                            reject(error);
                        }
                    }
                });
        }).catch(err => {
            console.error("Couldnt get document (image)", err);
            reject(err);
        });
    });
}



function decodeBase64Image(dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = matches[2];
    return response;
}


module.exports = utils;