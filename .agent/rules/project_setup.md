---
description: Rules for project setup, environment, and running the server
---

# Project Setup Rules

## Python Environment

*   **Virtual Environment:** This project uses a Python virtual environment located at `.venv`.
*   **Execution:** Always use the python executable within the venv when running scripts:
    *   `.venv/bin/python3 data/convert_doc.py ...`
    *   Or activate it first: `source .venv/bin/activate`

## Running the Dashboard

*   **Local Server:** To ensure all features work correctly (especially file downloads like `directory_structure.yaml`), the dashboard **must** be served via HTTP, not opened as a file.
*   **Command:** Run the Python HTTP server from the project root:
    ```bash
    python3 -m http.server 8000
    ```
*   **Access:** Open `http://localhost:8000/dashboard/` in your browser.

## File Locations

*   **Data Script:** `data/convert_doc.py`
*   **Output Data:** `data/data.js`
*   **Dashboard Code:** `dashboard/app.js`, `dashboard/index.html`, `dashboard/styles.css`
