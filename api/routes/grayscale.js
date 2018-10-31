let grayscale = {};
const jimp = require('jimp');

grayscale.grayscaleImage = function (image, filename, imageType){
    let folder = filename;
    filename = filename.concat('-grayscale.').concat(imageType);
    return jimp.read(image)
        .then (picture => {
            console.log("successfully saved "+ filename);
            return picture
                .greyscale()
                .write(__dirname+"/img/output/"+folder+"/"+filename);
        })
        .catch(err => {
        console.log(err);
    })
};


module.exports = grayscale;