from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class WebScraper:
    def __init__(self, url):
        self.url = url
        self.driver = webdriver.Chrome()

    def navigate_to_url(self):
        self.driver.get(self.url)

    def extract_data(self, xpath):
        try:
            element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            return element.text
        except TimeoutException:
            return "Data not found"

    def close_browser(self):
        self.driver.quit()

# Example usage:
scraper = WebScraper("https://www.example.com")
scraper.navigate_to_url()
data = scraper.extract_data("/html/body/div[1]/h1")
print(data)
scraper.close_browser()