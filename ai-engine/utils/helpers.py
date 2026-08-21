import math

def calculate_similarity_percentage(l2_distance: float) -> float:
    """
    Converts FAISS L2 distance (squared Euclidean distance) to a similarity percentage.
    Lower L2 distance means higher similarity.
    This is a heuristic function; adjust scaling based on actual model output distribution.
    """
    if l2_distance < 0:
        return 100.0
    
    # Assuming L2 distances for this model typically range from 0 to 2
    # We map 0 -> 100%, and larger distances approach 0%.
    # Using an exponential decay function.
    similarity = math.exp(-l2_distance) * 100
    
    # Cap at 100%
    return min(max(round(similarity, 2), 0.0), 100.0)
