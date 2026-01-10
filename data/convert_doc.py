import json
from bs4 import BeautifulSoup
import re

def clean_text(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse_google_doc_html(html_path, output_css_path=None):
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # Extract styles
    style_content = ""
    for style in soup.find_all("style"):
        style_content += style.get_text()
    
    if style_content and output_css_path:
        # Write to requested location
        os.makedirs(os.path.dirname(output_css_path), exist_ok=True)
        with open(output_css_path, "w", encoding="utf-8") as f:
            f.write(style_content)
            print(f"Extracted styles to {output_css_path}")

    # Structure
    output = {
        "Introduction": [],
        "Scope Definitions": [],
        "Specs": [],
        "Directory Structure": [],
        "Reference Docs": []
    }
    
    current_h1_obj = None
    current_h2_obj = None
    in_reference_docs = False
    
    # We iterate through all relevant elements in order
    # Note: re.compile matches tags
    elements = soup.find_all(re.compile(r'^h[1-2]|^table|^p|^ul|^ol'))
    
    for el in elements:
        text = clean_text(el.get_text(separator=' ', strip=True))
        


        # Check for Directory Structure (ASCII Tree)
        if any(char in text for char in ['│', '├', '└']) or "directories," in text and "files" in text:
             output["Directory Structure"].append({"html": str(el)})
             continue

        if el.name == 'h1':
            if text in ["Introduction", "Scope Definitions", "17. Reference Documents"]:
                if "17." in text: # specific check for Ref docs to normalize key if needed, or just use text
                     current_h1_obj = {"title": "Reference Docs", "special": True}
                else:
                     current_h1_obj = {"title": text, "special": True}
                current_h2_obj = None
            else:
                current_h1_obj = {
                    "title": text,
                    "subsections": []
                }
                output["Specs"].append(current_h1_obj)
                current_h2_obj = None
                
        elif el.name == 'h2':
            if current_h1_obj and not current_h1_obj.get("special"):
                current_h2_obj = {
                    "title": text,
                    "items": []
                }
                current_h1_obj["subsections"].append(current_h2_obj)
            else:
                current_h2_obj = None 

        elif el.name in ['p', 'ul', 'ol']:
            if current_h1_obj and current_h1_obj.get("special"):
                 # Handle special sections content (Intro, Scope, Ref Docs)
                 target_list = output[current_h1_obj["title"]]
                 
                 # For Reference Docs, we want to keep links working.
                 # The 'clean_text' might strip some html if applied too aggressively, 
                 # but here we use decode_contents which preserves tags.
                 
                 for span in el.find_all('span'):
                    span.unwrap()

                 content = el.decode_contents().strip()
                 if content:
                    target_list.append({"html": f"<{el.name}>{content}</{el.name}>"})

        elif el.name == 'table':
            # Parse table
            table_data = {}
            rows = el.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 2:
                    key = clean_text(cols[0].get_text(separator=' ', strip=True))
                    
                    ul = cols[1].find('ul')
                    if ul:
                        value = sorted(list(set([clean_tag(li.get_text(separator=' ', strip=True)) for li in ul.find_all('li')])))
                    else:
                        value = clean_text(cols[1].get_text(separator=' ', strip=True))
                        # If key is Creator/Consumer, run clean_tag on single value too provided it's string
                        if key in ["Creator", "Consumer"] and isinstance(value, str):
                            value = [clean_tag(value)]
                    
                    if key:
                        table_data[key] = value

            if table_data:
                # Add to structure
                if current_h1_obj:
                    if current_h1_obj.get("special"):
                        # Add directly to Intro/Scope/Ref list
                        output[current_h1_obj["title"]].append(table_data)
                    elif current_h2_obj:
                        # Add to subsection
                        current_h2_obj["items"].append(table_data)
                    else:
                        # Add to root of H1 (orphaned table?)
                        if not current_h1_obj["subsections"]:
                             current_h1_obj["subsections"].append({"title": "General", "items": []})
                        current_h1_obj["subsections"][-1]["items"].append(table_data)

    # Post-process Merge HTML blocks
    for section in ["Introduction", "Reference Docs", "Directory Structure"]:
        if output[section]:
            merged_html = f"<div class='text-block-{section.lower().replace(' ', '-')}'>" + "".join([x["html"] for x in output[section]]) + "</div>"
            output[section] = [{"html": merged_html}]

    return output

def clean_tag(tag):
    # 1. Basic cleaning
    tag = clean_text(tag)
    # Remove trailing/leading punctuation
    tag = tag.strip('.,;:')
    
    # 2. Fix specific typos/variations found in analysis
    corrections = {
        "Previz vendo rs": "Previz vendor",
        "Previz vendor s": "Previz vendor",
        "Sounds department": "Sound department",
        "Stunts department": "Stunt department",
        "Digital intermediate (DI) facility": "DI Vendor",
        "Digital intermediateI vendor": "DI Vendor",
        "Dailies and Digital Intermediate vendor": "Dailies and DI Vendor",
        "Dailies and DI vendor": "Dailies and DI Vendor",
        "DIT": "Digital Imaging Technician",
        "Digital imaging Technician (DIT)": "Digital Imaging Technician",
        "Script supervisor": "Script Supervisor",
        "Assistant directory (AD)": "Assistant Director",
        "First AD": "Assistant Director",
        "AD department": "Assistant Director",
        "Motion capture team": "Motion Capture Vendor",
    }
    
    if tag in corrections:
        tag = corrections[tag]

    # 3. Standardization (Title Case)
    # Capitalize first letter of each word, lower the rest (except known acronyms)
    # Ideally use string.capwords but consistent casing is key.
    # Simple Title Case:
    words = tag.split()
    normalized_words = []
    for w in words:
        if w.upper() in ["VFX", "DI", "GPS", "LED", "UPM", "SFX", "AD"]:
            normalized_words.append(w.upper())
        else:
            normalized_words.append(w.capitalize())
    tag = " ".join(normalized_words)

    # 4. Singularize (Naive)
    # If ends in 's' (and isn't 'lens', 'process', etc), drop 's'
    # Check against known singles? 
    # For now, simplistic: if "Vendors" -> "Vendor", "Departments" -> "Department"
    if tag.endswith("s"):
        if tag.endswith("Vendors"):
            tag = tag[:-1]
        elif tag.endswith("Departments"):
            tag = tag[:-1]
        elif tag.endswith("Performers"):
            tag = tag[:-1]
        elif tag.endswith("Teams"):
            tag = tag[:-1]
            
    return tag

if __name__ == "__main__":
    import os
    
    # Ensure we look in the same directory as the script for input/output
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "doc_export.html")
    output_js_file = os.path.join(script_dir, "data.js")
    css_output_file = os.path.join(script_dir, "../dashboard/doc_styles.css")
    
    print(f"Parsing {input_file}...")
    try:
        json_data = parse_google_doc_html(input_file, css_output_file)
        
        # Write as a JS file with a global variable
        with open(output_js_file, 'w', encoding='utf-8') as f:
            js_content = f"const ON_SET_DATA = {json.dumps(json_data, indent=4)};"
            f.write(js_content)
            
        # Re-save CSS to the correct dashboard location using absolute path from script
        # Note: parse_google_doc_html currently saves inside itself, we should refactor that 
        # but for now let's just make sure the function handles it or we pass the path.
        # Actually simplest is to modify parse_google_doc_html to take the output path.
        # But to be minimally invasive, we'll patch the path inside the function or just move the CSS writing logic out.
        # Let's check parse_google_doc_html again. It writes to "../dashboard/doc_styles.css" relative to CWD.
        # We should update parse_google_doc_html to use exact path.
        
        # Since I cannot easily change the function signature in this replace block without replacing the whole function,
        # I will leave the function as is but update the CSS writing PART inside parse_google_doc_html in a separate edit 
        # OR just update the function here if I included it in the range. 
        # I did include the end of the file, but not the start of parse_google_doc_html. 
        
        print(f"Successfully converted to {output_js_file}")
        
    except FileNotFoundError:
        print(f"Error: {input_file} not found. Make sure you downloaded the HTML export.")
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
