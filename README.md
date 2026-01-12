# VES On-set VFX Data Collection and usage web site.

On-set VFX Data Collection and usage web site. This processes the google doc https://docs.google.com/document/d/13TsptYa5uNO52btOw1nat1cLSBG88t27W3BXHBZPvoc/edit?tab=t.0#heading=h.h7s96q27odn9 into a format that is easily filterable, since the document is huge and can be overwhelming.

## Setup
1.  Ensure you have Python 3 installed.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Data Import
The dashboard data is generated from a Google Doc export.

### Option 1: Automatic Download (Recommended)
Run the converter with the Google Doc ID:
```bash
python3 data/convert_doc.py --doc-id 13TsptYa5uNO52btOw1nat1cLSBG88t27W3BXHBZPvoc
```
This will automatically download the HTML export and update `data.js`.

### Option 2: Manual Import
1.  **Export the Google Doc**:
    *   Open the source Google Doc.
    *   Go to **File > Download > Web Page (.html, zipped)**.
2.  **Prepare the File**:
    *   Unzip the downloaded file.
    *   Rename the HTML file inside to `doc_export.html`.
    *   Place it in the `data/` directory of this repository.
3.  **Run the Converter**:
    ```bash
    python3 data/convert_doc.py
    ```

## Running the Dashboard
Simply open `dashboard/index.html` in your web browser. No server is required.

## Authors

Web page and import script by Sam Richards.
On-set document by Sheena Duggal with contributions from Sam Richards, Jim Geduldick, and Jake Morrison, and technical support from Jean-Francois Panisset