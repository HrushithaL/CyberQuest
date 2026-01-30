def analyze_difficulty(score: int, mistakes: list):
    if score >= 80:
        return {"next_difficulty": "hard", "reason": "High score"}
    if score >= 50:
        return {"next_difficulty": "medium", "reason": "Average performance"}
    return {"next_difficulty": "easy", "reason": "Needs learning"}
