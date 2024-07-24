// Periksa apakah elemen dengan id 'originalPrompt' sudah ada sebelum mendeklarasikan ulang
if (typeof originalPrompt === 'undefined') {
    var originalPrompt = window.prompt;

    window.prompt = function() {
        console.log('Prompt hijacked!');
        return originalPrompt.apply(this, arguments);
    };
}

// Setting up Webcam.js
Webcam.set({
    width: 350,
    height: 350,
    image_format: 'jpeg',
    jpeg_quality: 90,
});

Webcam.attach('#camera', function(err) {
    if (err) {
        console.error("Webcam attach error:", err);
        alert('Webcam tidak dapat diakses: ' + err);
    } else {
        console.log("Webcam attached successfully.");
    }
});

// Function to take snapshot and convert to data URI
function take_snapshot() {
    Webcam.snap(function(data_uri) {
        document.getElementById('result-img').src = data_uri;
        document.getElementById('camera').style.display = 'none';
        document.getElementById('result-img').style.display = 'block';

        // Save data URI to hidden input
        document.getElementById('snapshot-input').value = data_uri;
    });
}

// Convert Data URI to Blob
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// Handle file input change
document.getElementById('file-input').addEventListener('change', function() {
    var file = this.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        document.getElementById('result-img').src = e.target.result;
        document.getElementById('camera').style.display = 'none';
        document.getElementById('result-img').style.display = 'block';

        // Clear snapshot input if file is uploaded
        document.getElementById('snapshot-input').value = '';
    };

    reader.readAsDataURL(file);
});

// Handle form submit
document.getElementById('upload-form').addEventListener('submit', function(event) {
    var snapshot = document.getElementById('snapshot-input').value;
    if (snapshot) {
        // If snapshot is available, convert it to a file and append to the form data
        event.preventDefault();
        console.log("Submitting snapshot");

        var blob = dataURItoBlob(snapshot);
        var file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });

        var formData = new FormData();
        formData.append('file', file);

        console.log('FormData snapshot:', file);

        // Send the form data to the server
        fetch('/predict', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    throw new Error(`Unexpected response content-type: ${contentType}`);
                });
            }
        })
        .then(data => {
            console.log(data);
            alert('Prediction successful: ' + JSON.stringify(data));
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Prediction failed: ' + error.message);
        });
    } else {
        console.log("Submitting file upload");
    }
});
