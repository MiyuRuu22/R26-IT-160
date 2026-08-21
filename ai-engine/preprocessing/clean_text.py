import re
import string

def remove_punctuation(text: str) -> str:
    """Removes punctuation from text."""
    translator = str.maketrans('', '', string.punctuation)
    return text.translate(translator)

def to_lowercase(text: str) -> str:
    """Converts text to lowercase."""
    return text.lower()

def remove_stopwords(text: str) -> str:
    """Removes common English stopwords (simplified offline version)."""
    # Using a hardcoded list to avoid NLTK download issues, keeping it simple and local.
    stopwords = set([
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours",
        "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself",
        "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which",
        "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be",
        "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
        "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for",
        "with", "about", "against", "between", "into", "through", "during", "before", "after",
        "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under",
        "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all",
        "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
        "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
        "should", "now"
    ])
    words = text.split()
    filtered_words = [word for word in words if word.lower() not in stopwords]
    return " ".join(filtered_words)

def clean_text(text: str) -> str:
    """Applies a full cleaning pipeline."""
    if not text:
        return ""
    text = to_lowercase(text)
    text = remove_punctuation(text)
    text = remove_stopwords(text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text
