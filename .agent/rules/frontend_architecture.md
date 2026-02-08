---
description: Rules for frontend architecture and adding new tabs
---

# Frontend Architecture Rules

The dashboard uses a simple architecture where `data/data.js` populates a global `ON_SET_DATA` object, which is then rendered by `dashboard/app.js`.

## Adding a New Tab

1.  **Update `dashboard/index.html`:**
    *   Add a new button element to the `<nav>` section.
    *   Use the `data-tab` attribute to match the key in `ON_SET_DATA` exactly.
    *   Example:
        ```html
        <button class="tab-btn" data-tab="Feedback">Feedback</button>
        ```

2.  **Update `dashboard/app.js`:**
    *   Locate the rendering logic (usually within `renderContent` or similar function).
    *   Start by handling text-based sections. Add the new section name to the array of text sections if it contains simple HTML content:
        ```javascript
        if (['Introduction', 'Reference Docs', 'Feedback'].includes(sectionName)) {
            // ... rendering logic
        }
        ```
    *   If the section requires complex rendering (like "Data Sets" or "Directory Structure"), add a specific `else if` block to handle its structure.

3.  **Styling:**
    *   Update `dashboard/styles.css` if the new content requires specific styling (e.g., `.text-block-feedback`).
