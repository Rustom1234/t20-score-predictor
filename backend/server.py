from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle

# Load the pre-trained model pipeline
model = pickle.load(open('backend/pipe.pkl', 'rb'))

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    return 'Cricket Score Predictor API is live. POST to /predict'

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json or {}

    batting_team = data.get('batting_team')
    bowling_team = data.get('bowling_team')

    # accept either key
    city = data.get('city') or data.get('venue')

    current_score = float(data.get('current_score', data.get('runs', 0)))
    overs = float(data.get('overs', 0))
    wickets = int(data.get('wickets', 0))

    # validate required categoricals
    missing = [k for k, v in {
        "batting_team": batting_team,
        "bowling_team": bowling_team,
        "city": city
    }.items() if v is None]

    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing": missing,
            "received_keys": sorted(list(data.keys()))
        }), 400

    balls_left = max(0, int(round(120 - overs * 6)))
    wickets_left = max(0, 10 - wickets)
    current_run_rate = (current_score / overs) if overs > 0 else 0.0

    # IMPORTANT: last_five is part of training features
    last_five = float(data.get('last_five', 0))

    input_df = pd.DataFrame([{
        'batting_team': batting_team,
        'bowling_team': bowling_team,
        'city': city,
        'current_score': current_score,
        'balls_left': balls_left,
        'wickets_left': wickets_left,
        'current_run_rate': current_run_rate,
        'last_five': last_five
    }])

    pred = model.predict(input_df)[0]
    return jsonify({'predicted_score': int(pred)})


if __name__ == '__main__':
    app.run(debug=True)
