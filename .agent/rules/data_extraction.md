---
description: Rules for extracting data from Google Docs using convert_doc.py
---

# Data Extraction Rules

When modifying `data/convert_doc.py` to extract new sections from the Google Doc:

1.  **Identify the Section:**
    *   Inspect `data/doc_export.html` (downloaded via `--doc-id`) to find the exact `<h1>` text of the section you want to extract (e.g., "Feedback", "Reference Documents").

2.  **Update `parse_google_doc_html`:**
    *   **Special Section Handling:** Add the section title to the list of "special" sections in the detection logic:
        ```python
        if text in ["Introduction", "Scope Definitions", "17. Reference Documents", "Feedback", "New Section"]:
           # ...
        ```
    *   **Initialize Output List:** Ensure the new section key is initialized in the `output` dictionary at the start of the function:
        ```python
        output = {
            # ... existing keys
            "Feedback": [],
            "New Section": []
        }
        ```
    *   **HTML Merging:** Add the section to the post-processing loop that merges HTML blocks to ensure it renders as a single block:
        ```python
        for section in ["Introduction", "Reference Docs", "Feedback", "New Section"]:
            # ...
        ```
    *   **Return Data:** Ensure the new section is added to the `data` dictionary returned at the end of the function:
        ```python
        data = {
            # ...
            "Feedback": output["Feedback"],
            "New Section": output["New Section"]
        }
        ```

3.  **Regenerate Data:**
    *   Run the script: `.venv/bin/python3 data/convert_doc.py --doc-id <ID>`
    *   Verify `data/data.js` contains the new key and content.
