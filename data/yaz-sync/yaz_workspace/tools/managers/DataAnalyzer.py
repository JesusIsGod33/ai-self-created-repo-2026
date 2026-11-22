import os
import pandas as pd

class DataAnalyzer:
    def __init__(self, file_path):
        self.file_path = file_path

    def analyze_data(self):
        try:
            # Check if the file exists
            if not os.path.isfile(self.file_path):
                print(f"The file {self.file_path} does not exist. Creating a new file...")
                # Create a new CSV file
                data = {
                    'Name': ['John', 'Anna', 'Peter', 'Linda'],
                    'Age': [28, 24, 35, 32],
                    'Country': ['USA', 'UK', 'Australia', 'Germany']
                }
                df = pd.DataFrame(data)
                df.to_csv(self.file_path, index=False)
                print("CSV file created successfully.")
            # Read the data from the file
            data = pd.read_csv(self.file_path)
            # Print the first few rows of the data
            print(data.head())
            # Print the data types of each column
            print(data.dtypes)
            # Print the summary statistics of the data
            print(data.describe())
        except Exception as e:
            print(f"An error occurred: {e}")

    def filter_data(self, column, value):
        try:
            # Read the data from the file
            data = pd.read_csv(self.file_path)
            # Filter the data based on the specified column and value
            filtered_data = data[data[column] == value]
            # Print the filtered data
            print("Filtered Data:")
            print(filtered_data)
        except Exception as e:
            print(f"An error occurred: {e}")

    def sort_data(self, column, ascending=True):
        try:
            # Read the data from the file
            data = pd.read_csv(self.file_path)
            # Sort the data based on the specified column
            sorted_data = data.sort_values(by=column, ascending=ascending)
            # Print the sorted data
            print("Sorted Data:")
            print(sorted_data)
        except Exception as e:
            print(f"An error occurred: {e}")

# Example usage:
if __name__ == "__main__":
    file_path = "data.csv"  # Replace with your file path
    analyzer = DataAnalyzer(file_path)
    analyzer.analyze_data()
    analyzer.filter_data('Country', 'USA')
    analyzer.sort_data('Age', ascending=False)