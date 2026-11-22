# Import necessary libraries
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re
from collections import Counter
import string

class NLPToolkit:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()

    def tokenize_text(self, text):
        # Tokenize the text into words
        tokens = word_tokenize(text)
        return tokens

    def remove_stopwords(self, tokens):
        # Remove stopwords from the tokens
        filtered_tokens = [token for token in tokens if token.lower() not in self.stop_words]
        return filtered_tokens

    def lemmatize_tokens(self, tokens):
        # Lemmatize the tokens
        lemmatized_tokens = [self.lemmatizer.lemmatize(token) for token in tokens]
        return lemmatized_tokens

    def remove_punctuation(self, tokens):
        # Remove punctuation from the tokens
        filtered_tokens = [re.sub('['+string.punctuation+']', '', token) for token in tokens]
        return filtered_tokens

    def count_word_frequency(self, tokens):
        # Count the frequency of each word
        word_freq = Counter(tokens)
        return word_freq

    def preprocess_text(self, text):
        # Preprocess the text
        tokens = self.tokenize_text(text)
        tokens = self.remove_stopwords(tokens)
        tokens = self.lemmatize_tokens(tokens)
        tokens = self.remove_punctuation(tokens)
        return tokens

# Example usage
nlp_toolkit = NLPToolkit()
text = "This is an example sentence. It has multiple words and punctuation."
preprocessed_text = nlp_toolkit.preprocess_text(text)
print(preprocessed_text)
word_freq = nlp_toolkit.count_word_frequency(preprocessed_text)
print(word_freq)