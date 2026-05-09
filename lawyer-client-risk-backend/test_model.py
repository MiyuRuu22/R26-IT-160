import joblib

model = joblib.load("app/data/models/risk_model.pkl")

print(model)