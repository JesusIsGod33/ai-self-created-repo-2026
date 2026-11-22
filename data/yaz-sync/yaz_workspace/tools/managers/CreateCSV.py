import pandas as pd

# Data for the CSV file
data = {
    'Name': ['John', 'Anna', 'Peter', 'Linda'],
    'Age': [28, 24, 35, 32],
    'Country': ['USA', 'UK', 'Australia', 'Germany']
}

# Create a DataFrame
df = pd.DataFrame(data)

# Create a CSV file
df.to_csv('data.csv', index=False)

print("CSV file created successfully.")