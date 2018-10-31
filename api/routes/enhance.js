let enhance = {};
const jimp = require('jimp');

enhance.enhanceImage = function (image, filename, imageType){
    let folder = filename;
    filename = filename.concat('-enhance.').concat(imageType);
    return jimp.read(image)
        .then (picture => {
            console.log("successfully saved "+ filename);
            return picture
                .contrast(0.5)
                .brightness(0.5)
                .write(__dirname+"/img/output/"+folder+"/"+filename);
        })
        .catch(err => {
        console.log(err);
    })
};


module.exports = enhance;