from flask import Flask, request, render_template, jsonify
import os
from werkzeug.utils import secure_filename
import tensorflow as tf
from tensorflow.lite.python.interpreter import Interpreter
from PIL import Image
import numpy as np

app = Flask(__name__)

# Define the directory where the TFLite model is saved
model_path = 'D:/NABILA ASSHAFA PUTRI/MENCOBA TA 2 - Copy/model/tf_lite_model.tflite'

# Load the TFLite model
interpreter = Interpreter(model_path=model_path)
interpreter.allocate_tensors()

# Get input and output tensors
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Define the upload folder
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Define your categories
kategori = ["Bercak Daun", "Keriting Daun", "Tidak Diketahui", "Daun Sehat", "Virus Kuning"]

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Define the route for home page
@app.route('/')
def home():
    return render_template('index.html')

# Define the route for prediction
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    try:
        # Load and preprocess the image
        image = Image.open(file_path)
        image = image.resize((224, 224))  # Resize to 224x224
        image = np.array(image) / 255.0  # Normalize pixel values
        image = np.expand_dims(image, axis=0)  # Add batch dimension

        # Set the tensor to the right dtype and shape
        input_tensor_index = input_details[0]['index']
        interpreter.set_tensor(input_tensor_index, image.astype(np.float32))

        # Run the interpreter
        interpreter.invoke()

        # Get the prediction
        output_tensor_index = output_details[0]['index']
        prediction = interpreter.get_tensor(output_tensor_index)

        # Get the predicted class label as a Python integer
        predicted_class_index = int(np.argmax(prediction))

        # Map the predicted class index to the category name
        predicted_category = kategori[predicted_class_index]
        
        return render_template('predict.html', predictions=[predicted_category])
    
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({'error': 'Error processing image'}), 500

if __name__ == '__main__':
    app.run(debug=True)
