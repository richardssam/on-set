from bs4 import BeautifulSoup
import re

with open('/Users/sam/on-set/data/doc_export.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

# Find all potential top-level elements
# We look for H1 "Introduction" and H1 "Scope Definitions"
elements = soup.find_all(['h1', 'h2', 'p', 'ul', 'ol', 'table', 'div'])

in_intro = False
tags_found = []

for el in elements:
    text = el.get_text(" ", strip=True)
    
    if el.name == 'h1':
        if "Introduction" in text:
            in_intro = True
            print("Found Start: Introduction")
            continue
        elif "Scope Definitions" in text:
            in_intro = False
            print("Found End: Scope Definitions")
            break
            
    if in_intro:
        print(f"Tag: {el.name} | Class: {el.get('class')} | Text Preview: {text[:50]}...")
        tags_found.append(el.name)

print(f"\nUnique tags found in Introduction: {set(tags_found)}")
