import joblib
from app.ml.feature_engineering import build_case_features

MODEL_PATH = "app/data/models/risk_model.pkl"


def predict_client_risk(cases: list, selected_name: str):
    saved = joblib.load(MODEL_PATH)
    model = saved["model"]
    feature_cols = saved["feature_cols"]

    features = build_case_features(cases, selected_name)

    X = [[features[col] for col in feature_cols]]
    prediction = model.predict(X)[0]

    confidence = 0.0
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)[0]
        confidence = max(probs)

    return {
        "overall_risk": prediction,
        "confidence": round(float(confidence), 4),
        **features,
    }