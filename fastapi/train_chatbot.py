import os
import json
import pickle
import re
from nltk.stem.porter import PorterStemmer
from sklearn.neural_network import MLPClassifier
import numpy as np

# Instantiate PorterStemmer
stemmer = PorterStemmer()

def tokenize(text):
    # Regex-based word tokenizer to avoid downloading flaky NLTK punkt data
    return re.findall(r'\w+', text.lower())

def stem(word):
    return stemmer.stem(word.lower())

def bag_of_words(tokenized_sentence, all_words):
    # Perform stemming on tokenized words
    tokenized_sentence = [stem(w) for w in tokenized_sentence]
    bag = np.zeros(len(all_words), dtype=np.float32)
    for idx, w in enumerate(all_words):
        if w in tokenized_sentence:
            bag[idx] = 1.0
    return bag

def train_chatbot():
    base_dir = os.path.dirname(__file__)
    intents_path = os.path.join(base_dir, "intents.json")
    model_export_path = os.path.join(base_dir, "chatbot_model.pkl")

    print("Loading intents.json...")
    with open(intents_path, "r") as f:
        intents_data = json.load(f)

    all_words = []
    classes = []
    xy = []

    # Process intents
    for intent in intents_data["intents"]:
        tag = intent["tag"]
        classes.append(tag)
        for pattern in intent["patterns"]:
            w = tokenize(pattern)
            all_words.extend(w)
            xy.append((w, tag))

    # Stem and lower each word and remove duplicates
    all_words = [stem(w) for w in all_words]
    all_words = sorted(list(set(all_words)))
    classes = sorted(list(set([tag for (_, tag) in xy])))

    print(f"Dataset summary: {len(xy)} patterns, {len(classes)} classes, {len(all_words)} unique stems.")

    X_train = []
    y_train = []

    for (pattern_sentence, tag) in xy:
        bag = bag_of_words(pattern_sentence, all_words)
        X_train.append(bag)
        label = classes.index(tag)
        y_train.append(label)

    X_train = np.array(X_train)
    y_train = np.array(y_train)

    # Train MLPClassifier
    print("Training MLPClassifier...")
    clf = MLPClassifier(
        hidden_layer_sizes=(128, 64), 
        activation="relu", 
        solver="adam", 
        max_iter=1200, 
        random_state=42,
        early_stopping=False
    )
    clf.fit(X_train, y_train)

    # Calculate training loss
    train_loss = clf.loss_
    print(f"Final training loss: {train_loss:.6f}")
    
    # Save training outputs
    model_data = {
        "model": clf,
        "vocabulary": all_words,
        "classes": classes,
        "intents": intents_data["intents"]
    }

    with open(model_export_path, "wb") as f:
        pickle.dump(model_data, f)
        
    print(f"Chatbot model saved successfully to {model_export_path}")

if __name__ == "__main__":
    train_chatbot()
