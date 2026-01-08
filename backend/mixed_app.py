import streamlit as st
import requests

API_URL = "https://t20-score-predictor-8ege.onrender.com/predict"

teams = [
    'Australia','India','Bangladesh','New Zealand','South Africa',
    'England','West Indies','Afghanistan','Pakistan','Sri Lanka'
]

cities = [
    'Colombo','Mirpur','Johannesburg','Dubai','Auckland','Cape Town','London',
    'Pallekele','Barbados','Sydney','Melbourne','Durban','St Lucia','Wellington',
    'Lauderhill','Hamilton','Centurion','Manchester','Abu Dhabi','Mumbai',
    'Nottingham','Southampton','Mount Maunganui','Chittagong','Kolkata','Lahore',
    'Delhi','Nagpur','Chandigarh','Adelaide','Bangalore','St Kitts','Cardiff',
    'Christchurch','Trinidad'
]

st.title('Cricket Score Predictor')

col1, col2 = st.columns(2)
with col1:
    batting_team = st.selectbox('Select batting team', sorted(teams))
with col2:
    bowling_team = st.selectbox('Select bowling team', sorted(teams))

city = st.selectbox('Select city', sorted(cities))

col3, col4, col5 = st.columns(3)
with col3:
    current_score = st.number_input('Current Score', min_value=0.0, step=1.0)
with col4:
    overs = st.number_input('Overs Done (works for over > 5)', min_value=0.0, step=0.1)
with col5:
    wickets = st.number_input('Wickets Out', min_value=0, max_value=10, step=1)

last_five = st.number_input("Runs scored in last 5 overs", min_value=0.0, step=1.0)

if st.button('Predict Score'):
    if overs <= 0:
        st.error("Overs must be > 0.")
    else:
        payload = {
            "batting_team": batting_team,
            "bowling_team": bowling_team,
            "city": city,
            "current_score": current_score,
            "overs": overs,
            "wickets": wickets,
            "last_five": last_five
        }

        try:
            r = requests.post(API_URL, json=payload, timeout=15)
            if r.status_code != 200:
                st.error(f"API error ({r.status_code}): {r.text}")
            else:
                pred = r.json().get("predicted_score")
                st.header(f"Predicted Score - {int(pred)}")
        except requests.exceptions.RequestException as e:
            st.error(f"Request failed: {e}")


