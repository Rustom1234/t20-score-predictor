from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle

# Load the pre-trained model pipeline
model = pickle.load(open('pipe.pkl', 'rb'))

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    input_df = pd.DataFrame([data])
    result = model.predict(input_df)[0]
    return jsonify({'predicted_score': int(result)})

if __name__ == '__main__':
    app.run(debug=True)
