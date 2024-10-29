from transformers import pipeline
import re

# Load pre-trained models
sentiment_model = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
emotion_model = pipeline("text-classification", model="SamLowe/roberta-base-go_emotions")

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
    # Replace slang terms with their normalized equivalents
    for slang, replacement in all_slang.items():
        text = re.sub(r'\b{}\b'.format(slang), replacement, text)
    return text

def analyze_sentiment(text: str):
    # Normalize slang before analysis
    text = normalize_slang(text)

    # Analyze sentiment
    sentiment_result = sentiment_model(text)[0]
    sentiment_label = sentiment_result['label']
    sentiment_score = sentiment_result['score']
    
    # Analyze emotions
    emotion_result = emotion_model(text)

    # Prepare a dictionary to hold accumulated emotion scores
    emotion_counts = {}
    
    for result in emotion_result:
        label = result['label']  # Emotion label
        score = result['score']  # Corresponding score
        
        # Accumulate emotion scores
        if label not in emotion_counts:
            emotion_counts[label] = 0
        emotion_counts[label] += score  # Accumulate emotion scores

    # Combine results into a final output
    analysis = {
        "sentiment": {
            "label": sentiment_label,
            "score": sentiment_score
        },
        "emotions": emotion_counts  # Return all accumulated emotions and their scores
    }

    return analysis
