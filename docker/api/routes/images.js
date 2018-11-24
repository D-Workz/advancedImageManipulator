const express = require('express');
const router = express.Router();
const config = require('config');
const request = require('request');
const watermark = require('./watermark')




router.get('/start', function (req, res, next) {

    invokeImageManipulationOnOpenwhisk(0)
        .then( response => {
            console.log(response);
        })
        .catch( error => {
            console.log(error);
        })
});



function invokeImageManipulationOnOpenwhisk(offset) {

    watermark.watermarkImage()
        .then(name =>{
            console.log(name);
        })
    // let url ="https://"+ config.get('IBM_ApiKey') +config.get('IBM_ActionURL');
    // return new Promise(function (resolve, reject) {
    //     request({
    //         url: url + "hello-world1/helloworld?blocking=true",
    //         method: "POST",
    //
    //         json: {
    //             "offset": offset,
    //         }
    //     }, function (error, response, body) {
    //         if(error){
    //             console.log(error);
    //             reject(error);
    //         }else {
    //             resolve(response);
    //         }
    //
    //     });
    //
    // });
}


module.exports = router;
