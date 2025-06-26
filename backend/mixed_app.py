"""
from flask import Flask, request, jsonify
import pandas as pd
import pickle

# Load the pre-trained model pipeline
model = pickle.load(open('pipe.pkl', 'rb'))

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    # Get JSON data from request
    data = request.json
    
    # Create DataFrame from received data
    input_df = pd.DataFrame([data])

    # Use the model to make predictions
    result = model.predict(input_df)[0]
    
    # Send back the prediction as JSON
    return jsonify({'predicted_score': int(result)})

if __name__ == '__main__':
    app.run(debug=True)
    """
    
import streamlit as st
import pickle
import pandas as pd
import numpy as np

pipe = pickle.load(open('pipe.pkl', 'rb'))

teams = [
    'Australia',
    'India',
    'Bangladesh',
    'New Zealand',
    'South Africa',
    'England',
    'West Indies',
    'Afghanistan',
    'Pakistan',
    'Sri Lanka'
]

cities = ['Colombo',
     'Mirpur',
     'Johannesburg',
     'Dubai',
     'Auckland',
     'Cape Town',
     'London',
     'Pallekele',
     'Barbados',
     'Sydney',
     'Melbourne',
     'Durban',
     'St Lucia',
     'Wellington',
     'Lauderhill',
     'Hamilton',
     'Centurion',
     'Manchester',
     'Abu Dhabi',
     'Mumbai',
     'Nottingham',
     'Southampton',
     'Mount Maunganui',
     'Chittagong',
     'Kolkata',
     'Lahore',
     'Delhi',
     'Nagpur',
     'Chandigarh',
     'Adelaide',
     'Bangalore',
     'St Kitts',
     'Cardiff',
     'Christchurch',
     'Trinidad']

st.title('Cricket Score Predictor')


col1, col2 = st.columns(2)

with col1:
    batting_team = st.selectbox('Select batting team', sorted(teams))

with col2:
    bowling_team = st.selectbox('Select bowling team', sorted(teams))

city = st.selectbox('Select city', sorted(cities))

col3,col4,col5 = st.columns(3)

with col3:
    current_score = st.number_input('Current Score')

with col4:
    overs = st.number_input('Overs Done (works for over > 5)')

with col5:
    wickets = st.number_input('Wickets Out')

last_five = st.number_input("Runs scored in last 5 overs")

if st.button('Predict Score'):
    balls_left = 120 - (overs * 6)
    wickets_left = 10 - wickets
    crr = current_score/overs

    input_df = pd.DataFrame(
        {'batting_team': [batting_team], 'bowling_team': [bowling_team], 'city': city, 'current_score': [current_score],
         'balls_left': [balls_left], 'wickets_left': [wickets], 'current_run_rate': [crr], 'last_five': [last_five]})
    result = pipe.predict(input_df)
    st.header("Predicted Score - " + str(int(result[0])))