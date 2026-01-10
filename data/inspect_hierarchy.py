from bs4 import BeautifulSoup
import re

def inspect_hierarchy(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # Find all headers and tables in order
    elements = soup.find_all(re.compile(r'^h[1-6]|^table'))
    
    for el in elements:
        if el.name.startswith('h'):
            text = el.get_text(strip=True)
            print(f"[{el.name}] {text}")

if __name__ == "__main__":
    inspect_hierarchy("doc_export.html")
