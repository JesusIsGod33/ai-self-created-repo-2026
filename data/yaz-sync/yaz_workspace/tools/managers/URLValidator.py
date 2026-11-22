import urllib.parse

def validate_url(url):
    try:
        result = urllib.parse.urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

def get_url_from_user():
    while True:
        url = input("Enter the URL: ")
        if validate_url(url):
            return url
        else:
            print("Error: Invalid URL '{}': No scheme supplied. Perhaps you meant https://?".format(url))

url = get_url_from_user()
print("You entered a valid URL: {}".format(url))