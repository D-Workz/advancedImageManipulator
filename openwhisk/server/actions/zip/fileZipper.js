const fs = require('fs');
const archiver = require('archiver');
const config = require('config');
const nano = require('nano')(config.get("DBUrl"));

function main(params){
    let filename = params['filename'];
    let filePath = __dirname+"/"+filename+"/";
    return new Promise(function (resolve, reject) {
        let images = nano.use('images');
        images.get(filename)
            .then(imageDoc =>{
                if(imageDoc.greyscale && imageDoc.enhance){
                    let zip = archiver('zip', {
                        zlib: {level: 9} // Sets the compression level.
                    });



                    zip.on('close', function () {
                        console.log(zip.pointer() + ' total bytes');
                        console.log('archiver has been finalized and the output file descriptor has closed.');
                    });

                    zip.on('end', function () {
                        console.log('Data has been drained');
                        let zipStream = fs.createReadStream(__dirname + '/'+filename+'.zip');
                        resolve({
                            zipStream
                        })
                        // resolve({filepath:__dirname + '/'+filename+'.zip'})
                    });

                    zip.on('warning', function(err) {
                        if (err.code === 'ENOENT') {
                            // log warning
                        } else {
                            // throw error
                            throw err;
                        }
                    });

                    zip.on('error', function(err) {
                        reject(err);
                        throw err;

                    });

                    // I have to write the images ones to disc since I dont know how to decode tthe correctly straight into zip.

                    fs.mkdirSync(filePath);
                    fs.writeFileSync(filePath+"greyscale."+imageDoc.greyscale.fileType,new Buffer(imageDoc.greyscale.data, 'base64'))
                    fs.writeFileSync(filePath+"enhance."+imageDoc.enhance.fileType,new Buffer(imageDoc.enhance.data, 'base64'))
                    zip.directory(filePath,false);
                    let output = fs.createWriteStream(__dirname + '/'+filename+'.zip');
                    zip.pipe(output);
                    zip.finalize();
                }else{
                    let response = {
                        status: "404",
                        err:"Images not found.",
                        message:"Couldn't find all images, upload an image first."
                    };
                    reject(response);
                }
            })
            .catch( err => {
                let response = {
                    status: "404",
                    err:err,
                    message:"Couldn't find images to zip, upload an image first."
                };
                reject(response);
            });

    });
}


module.exports.main=main;