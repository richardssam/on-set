# on-set
On-set VFX Data Collection and usage web site.

## Setup
1.  Ensure you have Python 3 installed.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Data Import
The dashboard data is generated from a Google Doc export.

1.  **Export the Google Doc**:
    *   Open the source Google Doc.
    *   Go to **File > Download > Web Page (.html, zipped)**.
2.  **Prepare the File**:
    *   Unzip the downloaded file.
    *   Rename the HTML file inside to `doc_export.html`.
    *   Place it in the `data/` directory of this repository (replacing any existing file).
3.  **Run the Converter**:
    ```bash
    python3 data/convert_doc.py
    ```
    This script parses the HTML and updates `data/data.js` (content) and `dashboard/doc_styles.css` (Google Doc styling).

## Running the Dashboard
Simply open `dashboard/index.html` in your web browser. No server is required.
