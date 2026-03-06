from rapidfuzz import fuzz
from db import drug_collection

def match_drug(word, threshold=75):

    drugs = list(drug_collection.find({}))


    best_match = None
    best_score = 0

    for drug in drugs:
        brand = (drug.get("brand") or drug.get("brandName") or "").lower()
        salt = (drug.get("salt") or drug.get("saltName") or "").lower()

        if not brand and not salt:
         continue

        score_brand = fuzz.ratio(word.lower(), brand) if brand else 0
        score_salt = fuzz.ratio(word.lower(), salt) if salt else 0
 

        score = max(score_brand, score_salt)

        if score > best_score:
            best_score = score
            best_match = drug

    if best_score >= threshold:
        return best_match

    return None

def normalize_drug(drug: dict):
    if not drug:
        return None
    d = dict(drug)
    if "_id" in d:
        d["_id"] = str(d["_id"])
    return d



def match_multiple(words):
    matched = []
    for word in words:
        result = match_drug(word)
        if result:
            matched.append(normalize_drug(result))
    return matched
