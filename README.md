# T20 Cricket Score Predictor

A machine learning-based web application that predicts the final first-innings score of a T20 cricket match in real time, given the current match state (teams, venue, overs, wickets, etc.).

The project combines feature engineering on ball-by-ball data, an XGBoost regression model, and a Streamlit user interface, deployed end-to-end on Render.

Website link: `https://t20-score-predictor-web-service.onrender.com/`

---

## Overview

The goal of this project is to estimate a realistic final T20 score using only information available mid-innings. Instead of simple run-rate extrapolation, the model incorporates match context such as wickets remaining, venue effects, and recent scoring momentum.

---

## Process

### Data and Feature Engineering

- Trained on historical T20 ball-by-ball match data
- Key engineered features:
  - current_score
  - balls_left
  - wickets_left
  - current_run_rate
  - last_five (runs scored in the previous five overs)
- Categorical variables (batting_team, bowling_team, city) are one-hot encoded

### Model

- XGBoost regressor wrapped in a scikit-learn pipeline
- Pipeline stages:
  1. One-hot encoding for categorical features
  2. Feature scaling
  3. Gradient-boosted tree regression
- Trained to predict the final innings total

### Backend API (Flask)

- Exposes a /predict endpoint
- Accepts the current match state as JSON
- Computes derived features such as balls remaining, wickets remaining, and run rate
- Returns a predicted final score

### Frontend (Streamlit)

- Interactive UI for entering live match information
- Sends requests to the Flask API
- Displays the predicted final score

---

## API Usage

### Endpoint

POST /predict

### Example Request

{
  "batting_team": "India",
  "bowling_team": "Australia",
  "city": "Melbourne",
  "current_score": 78,
  "overs": 10.2,
  "wickets": 3,
  "last_five": 42
}

### Example Response

{
  "predicted_score": 171
}

---

## Deployment

The application is deployed on Render as two separate services.

### Flask API

- Runs using Gunicorn
- Loads the trained model pipeline
- Handles all prediction logic

### Streamlit UI

- Deployed as a standalone web service
- Acts purely as a frontend
- Communicates with the Flask API for predictions

On the free Render tier, services may cold start, causing a short delay on the first request.

---

## Tech Stack

- Python
- Pandas
- NumPy
- scikit-learn
- XGBoost
- Flask
- Gunicorn
- Streamlit
- Render

