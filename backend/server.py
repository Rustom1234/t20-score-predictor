from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle

# Load the pre-trained model pipeline
model = pickle.load(open('pipe.pkl', 'rb'))

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    return 'Cricket Score Predictor API is live. POST to /predict'

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json or {}
    # Required inputs from client
    batting_team   = data.get('batting_team')
    bowling_team   = data.get('bowling_team')
    city           = data.get('city')
    current_score  = data.get('current_score', 0)
    overs          = data.get('overs', 0)
    wickets        = data.get('wickets', 0)

    # Compute the features your pipeline expects
    balls_left      = max(0, 120 - int(overs * 6))
    wickets_left    = max(0, 10 - int(wickets))
    current_run_rate= (current_score / overs) if overs > 0 else 0
    last_five       = 0  # no longer collecting this from client

    # Build a DataFrame with exactly the columns the pipeline was trained on
    input_df = pd.DataFrame([{
        'batting_team':     batting_team,
        'bowling_team':     bowling_team,
        'city':             city,
        'current_score':    current_score,
        'balls_left':       balls_left,
        'wickets_left':     wickets_left,
        'current_run_rate': current_run_rate,
        'last_five':        last_five
    }])

    # Predict and return
    pred = model.predict(input_df)[0]
    return jsonify({'predicted_score': int(pred)})

if __name__ == '__main__':
    app.run(debug=True)
