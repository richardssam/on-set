#!/usr/bin/env python3
"""
Script to extract and list all unique values under Creator and Consumer categories
from the data.js file.
"""

import json
import re

def load_data_from_js(file_path):
    """Load the ON_SET_DATA from the data.js file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the JSON object from the JavaScript file
    # Find the start of the object after "const ON_SET_DATA = "
    match = re.search(r'const ON_SET_DATA = ({.*});', content, re.DOTALL)
    if match:
        json_str = match.group(1)
        return json.loads(json_str)
    else:
        raise ValueError("Could not find ON_SET_DATA in the file")

def extract_creators_and_consumers(data):
    """Extract all unique Creator and Consumer values from the data structure."""
    creators = set()
    consumers = set()
    
    # Navigate through the data structure
    if "Data Sets" in data:
        for dataset in data["Data Sets"]:
            if "subsections" in dataset:
                for subsection in dataset["subsections"]:
                    if "items" in subsection:
                        for item in subsection["items"]:
                            # Extract Creator values
                            if "Creator" in item:
                                creators.update(item["Creator"])
                            
                            # Extract Consumer values
                            if "Consumer" in item:
                                consumers.update(item["Consumer"])
    
    return sorted(creators), sorted(consumers)

def main():
    # Path to the data.js file
    data_file = "data.js"
    
    # Load the data
    print(f"Loading data from {data_file}...")
    data = load_data_from_js(data_file)
    
    # Extract creators and consumers
    creators, consumers = extract_creators_and_consumers(data)
    
    # Print results
    print("\n" + "="*80)
    print("CREATOR VALUES")
    print("="*80)
    for i, creator in enumerate(creators, 1):
        print(f"{creator}")
    
    print(f"\nTotal unique Creator values: {len(creators)}")
    
    print("\n" + "="*80)
    print("CONSUMER VALUES")
    print("="*80)
    for i, consumer in enumerate(consumers, 1):
        print(f"{consumer}")
    
    print(f"\nTotal unique Consumer values: {len(consumers)}")
    print("="*80)

if __name__ == "__main__":
    main()
