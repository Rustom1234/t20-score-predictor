import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import pickle

# Step 1: Reading in the CSV file
df = pd.read_csv('t20info.csv')

# Step 2: Cleaning and preprocessing
cities = np.where(df['city'].isnull(), df['venue'].str.split().apply(lambda x: x[0]), df['city'])
df['city'] = cities

balls_in_each_city = df['city'].value_counts()
eligible_cities = balls_in_each_city[balls_in_each_city > 600].index.tolist()
df = df[df['city'].isin(eligible_cities)]

df['current_score'] = df.groupby('match_id')['runs'].cumsum()
df['over'] = df['ball'].apply(lambda x: str(x).split('.')[0])
df['ball_no'] = df['ball'].apply(lambda x: str(x).split('.')[1])
df['balls_bowled'] = (df['over'].astype(int) * 6 + df['ball_no'].astype(int))
df['balls_left'] = np.maximum(0, 120 - df['balls_bowled'])

df['player_dismissed'] = df['player_dismissed'].apply(lambda x: 1 if x != '0' else 0).astype(int)
df['player_dismissed'] = df.groupby('match_id')['player_dismissed'].cumsum()
df['wickets_left'] = 10 - df['player_dismissed']

df['current_run_rate'] = (df['current_score'] * 6) / df['balls_bowled']
groups = df.groupby('match_id')
match_ids = df['match_id'].unique()
last_five = []
for id in match_ids:
    last_five.extend(groups.get_group(id).rolling(window=30)['runs'].sum().tolist())
df['last_five'] = last_five

# Step 3: Creating the final dataset for training
final_df = df.groupby('match_id')['runs'].sum().reset_index().merge(df, on='match_id')
final_df = final_df[['batting_team', 'bowling_team', 'city', 'current_score', 'balls_left', 'wickets_left', 'current_run_rate', 'last_five', 'runs_x']]
final_df.dropna(inplace=True)
final_df = final_df.sample(frac=1).reset_index(drop=True)

# Step 4: Splitting data
X = final_df.drop(columns=['runs_x'])
y = final_df['runs_x']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=1)

# Step 5: Setting up the pipeline
trf = ColumnTransformer([
    ('trf', OneHotEncoder(sparse_output=False, drop='first'), ['batting_team', 'bowling_team', 'city'])
], remainder='passthrough')

pipe = Pipeline(steps=[
    ('step1', trf),
    ('step2', StandardScaler()),
    ('step3', XGBRegressor(n_estimators=1000, learning_rate=0.2, max_depth=12, random_state=1))
])

# Step 6: Training the pipeline
pipe.fit(X_train, y_train)

# Step 7: Evaluating model performance
y_pred = pipe.predict(X_test)
print("R2 Score:", r2_score(y_test, y_pred))
print("Mean Absolute Error:", mean_absolute_error(y_test, y_pred))

import pickle
pickle.dump(pipe,open('pipe.pkl','wb'))
