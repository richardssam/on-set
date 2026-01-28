import json
import re
import os
import csv
import sys

def parse_title_parts(title):
    # Match strings like "1. Title", "1.1 Title", "0. Title"
    # Capture group 1: numbers/dots, group 2: rest
    # Regex breakdown:
    # ^([\d\.]+)\s* - Start with digits/dots, followed by optional whitespace
    # (.*)$ - Capture the rest
    
    match = re.match(r'^([\d\.]+)\s+(.*)$', title)
    if match:
        number_part = match.group(1).rstrip('.') # Remove trailing dot from number if desired, typically "1." -> "1"
        text_part = match.group(2).strip()
        return number_part, text_part
    else:
        # No number found
        return "", title.strip()

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'data.js')
    
    if not os.path.exists(data_path):
        current_dir = os.getcwd()
        data_path = os.path.join(current_dir, 'data', 'data.js')
    
    if not os.path.exists(data_path):
        data_path = "/Users/sam/git/on-set/data/data.js"

    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.", file=sys.stderr)
        return

    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            print("Error: Could not find JSON object in data.js", file=sys.stderr)
            return
            
        json_str = content[start_idx:end_idx+1]
        data = json.loads(json_str)
        
        if "Data Sets" not in data:
            print("Error: 'Data Sets' key not found in data.", file=sys.stderr)
            return
            
        # Initialize CSV writer to stdout
        writer = csv.writer(sys.stdout)
        writer.writerow(['Number', 'Title']) # Header
        
        for section in data["Data Sets"]:
            if "title" in section:
                num, text = parse_title_parts(section["title"])
                writer.writerow([num, text])
                
                if "subsections" in section:
                    for subsection in section["subsections"]:
                        if "title" in subsection and subsection["title"]:
                             sub_num, sub_text = parse_title_parts(subsection["title"])
                             writer.writerow([sub_num, sub_text])
                            
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
