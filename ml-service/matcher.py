from rapidfuzz import fuzz
from db import drug_collection

def match_drug(word, threshold=75):

    drugs = list(drug_collection.find({}, {"_id": 0}))

    best_match = None
    best_score = 0

    for drug in drugs:
        score_brand = fuzz.ratio(word.lower(), drug["brand"].lower())
        score_salt = fuzz.ratio(word.lower(), drug["salt"].lower())

        score = max(score_brand, score_salt)

        if score > best_score:
            best_score = score
            best_match = drug

    if best_score >= threshold:
        return best_match

    return None


def match_multiple(words):

    matched = []

    for word in words:
        result = match_drug(word)
        if result:
            matched.append(result)

    return matched