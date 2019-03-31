/* Upload the photos using ajax request.
*
* @param formData
*/
function uploadFiles(formData) {
   $.ajax({
       url: '/upload_photos',
       method: 'post',
       data: formData,
       processData: false,
       contentType: false,
       xhr: function () {
           var xhr = new XMLHttpRequest();

           // Add progress event listener to the upload.
           xhr.upload.addEventListener('progress', function (event) {
               var progressBar = $('.progress-bar');

               if (event.lengthComputable) {
                   var percent = (event.loaded / event.total) * 100;
                   progressBar.width(percent + '%');

                   if (percent === 100) {
                       progressBar.removeClass('active');
                   }
               }
           });

           return xhr;
       }
   }).done(handleSuccess).fail(function (xhr, status) {
       alert(status);
   });
}

/**
* Handle the upload response data from server and display them.
*
* @param data
*/
function handleSuccess(data) {
    if (data.length > 0) {
        var html = '';
        for (var i=0; i < data.length; i++) {
            var img = data[i];

            if (img.status) {
                html += '<div class="col-xs-6 col-md-4"><a href="#" class="thumbnail"><img src="' + img.imageURL + '" alt="' + img.filename  + '"></a></div>';
            } else {
                html += '<div class="col-xs-6 col-md-4"><a href="#" class="thumbnail">Invalid file type - ' + img.filename  + '</a></div>';
            }
        }

       $('#album').html(html);
   } else {
       alert('No images were uploaded.')
   }
}

$('#photos-input').click(function () {
  $('.progress-bar').width('0%');
});

$('#photos-input').on('change', function (event) {
   if($('#photos-input').get(0).files.length > 0){
     event.preventDefault();

     // Get the files from input, create new FormData.
     var files = $('#photos-input').get(0).files;
        console.log("File data", files);
         var formData = new FormData();

     if (files.length === 0) {
         alert('Select atleast 1 file to upload.');
         return false;
     }

     if (files.length > 1) {
         alert('You can only upload up to 1 files.');
         return false;
     }

     // Append the file to the formData.
     for (var i=0; i < files.length; i++) {
         var file = files[i];
         formData.append('image', file, file.name);
     }

     uploadFiles(formData);
   } else {
     $('.progress-bar').width('0%');
   }
});


$('#setProfile').click(function(){
  console.log("User profile will be to set, or get event");
});
