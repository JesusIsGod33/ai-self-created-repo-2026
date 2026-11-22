import os
import sys

# Define the migration assessment function
def assess_migration_feasibility():
    # Evaluate the AI Studio app's infrastructure
    app_infrastructure = {
        'os': 'linux',
        'python_version': '3.9',
        'dependencies': ['numpy', 'pandas']
    }

    # Assess compatibility with my requirements
    compatibility_score = 0
    if app_infrastructure['os'] == 'linux':
        compatibility_score += 1
    if app_infrastructure['python_version'] == '3.9':
        compatibility_score += 1
    for dependency in app_infrastructure['dependencies']:
        if dependency in ['numpy', 'pandas']:
            compatibility_score += 1

    # Print the compatibility score
    print(f'Compatibility score: {compatibility_score}/3')

# Run the migration assessment function
assess_migration_feasibility()