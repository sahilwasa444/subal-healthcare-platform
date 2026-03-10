import re

from rapidfuzz import fuzz

from db import drug_collection


MIN_WORD_LENGTH = 3


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


def normalize_word(word: str):
    cleaned = re.sub(r"[^a-zA-Z0-9]", "", (word or "")).strip().lower()
    if len(cleaned) < MIN_WORD_LENGTH or cleaned.isdigit():
        return ""
    return cleaned


def match_multiple(words):
    matched = []
    unmatched_words = []
    seen_matched_ids = set()
    seen_unmatched_words = set()

    for word in words:
        normalized_word = normalize_word(word)
        if not normalized_word:
            continue

        result = match_drug(normalized_word)
        if result:
            normalized_drug = normalize_drug(result)
            drug_id = normalized_drug.get("_id")
            if drug_id not in seen_matched_ids:
                matched.append(normalized_drug)
                seen_matched_ids.add(drug_id)
            continue

        if normalized_word not in seen_unmatched_words:
            unmatched_words.append(normalized_word)
            seen_unmatched_words.add(normalized_word)

    return {
        "matched_drugs": matched,
        "unmatched_words": unmatched_words,
    }
