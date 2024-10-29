from transformers import pipeline
import re
import torch

# Initialize global model variables
sentiment_model = None
emotion_model = None

def get_device():
    """Determine the best available device."""
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"  # For Apple Silicon
    return "cpu"

def initialize_models():
    """Initialize the models with the appropriate device."""
    global sentiment_model, emotion_model
    device = get_device()
    
    try:
        sentiment_model = pipeline(
            "sentiment-analysis", 
            model="nlptown/bert-base-multilingual-uncased-sentiment",
            device=device
        )
        emotion_model = pipeline(
            "text-classification", 
            model="SamLowe/roberta-base-go_emotions",
            device=device
        )
        return device
    except Exception as e:
        print(f"Error loading models to {device}: {str(e)}")
        print("Falling back to CPU...")
        sentiment_model = pipeline("sentiment-analysis", 
                                 model="nlptown/bert-base-multilingual-uncased-sentiment")
        emotion_model = pipeline("text-classification", 
                               model="SamLowe/roberta-base-go_emotions")
        return "cpu"

# Initialize models at module level
current_device = initialize_models()

# Dictionaries for Twitch, AMP, FaZe Clan, and League of Legends slang and emotes
twitch_slang = {
    "Kappa": ":)", "PogChamp": ":O", "LUL": ":D", "TriHard": ":)", "BibleThump": ":(", 
    "ResidentSleeper": ":|", "Jebaited": ":P", "Kreygasm": ":D", "NotLikeThis": ":(", 
    "HeyGuys": "Hello", "monkaS": ":/", "KEKW": ":D", "PepeHands": ":(", "POGGERS": ":O", 
    "4Head": ":D", "5Head": ":)", "DansGame": ":(", "WutFace": ":O", "SwiftRage": ">:(", 
    "BabyRage": ":("
}

kai_amp_slang = {
    "Rizz": "charisma", "GYATT": "god damn", "Unspoken Rizz": "natural charm", "AMP": "Any Means Possible"
}

faze_clan_slang = {
    "FaZe Up": "pride", "Trickshotting": "complex gaming move", "Sniping": "long-range shooting"
}

league_slang = {
    "GG": "good game", "FF": "forfeit", "MIA": "missing in action", "Gank": "surprise attack", 
    "Farm": "killing minions", "Carry": "leading player", "Support": "assisting teammate", 
    "Tank": "damage absorber", "DPS": "damage per second", "CC": "crowd control"
}

# Combine all slang into one dictionary
all_slang = {**twitch_slang, **kai_amp_slang, **faze_clan_slang, **league_slang}

def normalize_slang(text):
    """Replace slang terms with their normalized equivalents."""
    for slang, replacement in all_slang.items():
        text = re.sub(r'\b{}\b'.format(slang), replacement, text)
    return text

def reinitialize_models_on_cpu():
    """Reinitialize models on CPU in case of GPU failure."""
    global sentiment_model, emotion_model
    sentiment_model = pipeline("sentiment-analysis", 
                             model="nlptown/bert-base-multilingual-uncased-sentiment")
    emotion_model = pipeline("text-classification", 
                           model="SamLowe/roberta-base-go_emotions")
    return "cpu"

def analyze_sentiment(text: str):
    """
    Analyze sentiment and emotions in text using GPU-accelerated models.
    
    Args:
        text (str): Input text to analyze
        
    Returns:
        dict: Dictionary containing sentiment and emotion analysis results
    """
    global sentiment_model, emotion_model
    
    try:
        # Normalize slang before analysis
        text = normalize_slang(text)

        # Process text in batches if it's very long to avoid GPU memory issues
        max_length = 512  # Maximum sequence length for BERT
        if len(text.split()) > max_length:
            # Split into smaller chunks and average results
            chunks = [' '.join(text.split()[i:i + max_length]) 
                     for i in range(0, len(text.split()), max_length)]
            
            # Analyze sentiment for each chunk
            sentiment_results = [sentiment_model(chunk)[0] for chunk in chunks]
            # Average sentiment scores
            avg_sentiment_score = sum(r['score'] for r in sentiment_results) / len(sentiment_results)
            # Take the most common sentiment label
            sentiment_label = max(set(r['label'] for r in sentiment_results), 
                                key=lambda x: sum(1 for r in sentiment_results if r['label'] == x))
            
            # Analyze emotions for each chunk
            emotion_results = [emotion_model(chunk) for chunk in chunks]
            # Combine emotion results
            emotion_counts = {}
            for chunk_results in emotion_results:
                for result in chunk_results:
                    label = result['label']
                    score = result['score']
                    if label not in emotion_counts:
                        emotion_counts[label] = 0
                    emotion_counts[label] += score
            
            # Average the emotion scores
            emotion_counts = {k: v/len(chunks) for k, v in emotion_counts.items()}
            
        else:
            # For shorter text, process normally
            sentiment_result = sentiment_model(text)[0]
            sentiment_label = sentiment_result['label']
            avg_sentiment_score = sentiment_result['score']
            
            emotion_result = emotion_model(text)
            emotion_counts = {}
            for result in emotion_result:
                label = result['label']
                score = result['score']
                if label not in emotion_counts:
                    emotion_counts[label] = 0
                emotion_counts[label] += score

        # Combine results into a final output
        analysis = {
            "sentiment": {
                "label": sentiment_label,
                "score": avg_sentiment_score
            },
            "emotions": emotion_counts,
            "device_used": current_device
        }

        return analysis
    
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        # Attempt to fall back to CPU if GPU processing fails
        if current_device != "cpu":
            print("Attempting to fall back to CPU...")
            new_device = reinitialize_models_on_cpu()
            return analyze_sentiment(text)
        raise