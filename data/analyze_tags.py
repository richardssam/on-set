import json
import re

# Read the JS file and extract the JSON part
with open("data.js", "r") as f:
    content = f.read()
    # Strip "const ON_SET_DATA = " and ";"
    json_str = content.replace("const ON_SET_DATA = ", "").strip().rstrip(";")
    data = json.loads(json_str)

creators = set()
consumers = set()

for section, items in data.items():
    if section == "Scope Definitions": continue
    for item in items:
        # Creators
        c_list = item.get("Creator", [])
        if isinstance(c_list, str): c_list = [c_list]
        for c in c_list: creators.add(c)
            
        # Consumers
        c_list = item.get("Consumer", [])
        if isinstance(c_list, str): c_list = [c_list]
        for c in c_list: consumers.add(c)

print("--- CREATORS ---")
for c in sorted(creators):
    print(f"'{c}'")

print("\n--- CONSUMERS ---")
for c in sorted(consumers):
    print(f"'{c}'")
