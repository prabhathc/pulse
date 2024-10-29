import re

def preprocess_message(content: str) -> str:
    # Remove URLs
    content = re.sub(r"http\S+", "", content)
    return content
