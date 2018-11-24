var url;
var uploadedImage;
var valBtnStart = true;
let interval;
$(document).ready(function() {
    var $startBtn = $("#startBtn");
     $startBtn.click(function () {
        $('#loader').css("display","block");
         var start = new Date;
         if(valBtnStart){
             $startBtn.val('stop');
             valBtnStart = false;
             interval = setInterval(function() {
                 $('#timer').text((new Date - start) / 1000 + " Seconds");
             }, 1000);
         }else {
             $startBtn.val('start');
             valBtnStart = true;
             clearInterval(interval);
         }
         startImageManipulation(function (response) {
            $('#loader').css("display","none");
            $('#error').css("display","none");
            $('#content').css("display","block");
        })
    })
});




function startImageManipulation(callback) {
    url = "http://localhost:3001/images/start";
    $.ajax({
        url: url,
        type: "get",
        data: {
            image: uploadedImage
        },
        success: function (data){
            callback(data);
        }
    });
    
}