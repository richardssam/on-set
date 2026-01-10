document.addEventListener('DOMContentLoaded', () => {
    let rawData = {};
    let specsFlatList = []; // Nested specs flattened for easy filtering

    // State
    const state = {
        currentTab: 'Introduction',
        filters: {
            creators: new Set(),
            consumers: new Set(),
            scope: new Set(),
            search: ''
        }
    };

    // Lookup for scope descriptions
    const scopeDescriptions = new Map();

    // Helper: Normalize Scope values (Title Case, singularize simple "s")
    function normalizeScope(val) {
        if (!val) return '';
        let str = val.trim();
        // Capitalize first letter
        str = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

        // Simple plural handling: if ends in 's' and length > 4 (e.g. "Shots" -> "Shot")
        // NOTE: this is a heuristic. "Process" -> "Proces" would be bad, but "Shots" -> "Shot" is good.
        // Let's rely on specific renames for better safety or just basic case overlap.
        // User asked for "capital changes, or puralization differences".
        // Let's do case + simple singularize.
        if (str.endsWith('s') && str.length > 4 && !str.endsWith('ss')) {
            return str.slice(0, -1);
        }
        return str;
    }

    const dom = {
        grid: document.getElementById('content-grid'),
        sidebar: document.getElementById('sidebar'),
        specsHeader: document.getElementById('specs-header'),
        filterContainer: document.getElementById('filter-container'),
        creatorFilters: document.getElementById('creator-filters'),
        consumerFilters: document.getElementById('consumer-filters'),
        scopeFilters: document.getElementById('scope-filters'),
        searchInput: document.getElementById('search-input'),
        stats: document.getElementById('stats-display'),
        stats: document.getElementById('stats-display'),
        tabs: document.querySelectorAll('.tab-btn'),
        printBtn: document.getElementById('print-btn'),
        tooltip: document.getElementById('tooltip')
    };

    // Tooltip Logic
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            const text = target.dataset.tooltip;
            if (text) {
                dom.tooltip.textContent = text; // Or innerHTML if we want basic formatting
                dom.tooltip.classList.remove('hidden');
                dom.tooltip.classList.add('visible');
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (dom.tooltip.classList.contains('visible')) {
            // Offset from mouse
            const offset = 15;
            let left = e.clientX + offset;
            let top = e.clientY + offset;

            // Simple boundary detection (optional but good)
            if (left + 350 > window.innerWidth) {
                left = e.clientX - 350 - offset;
            }
            if (top + dom.tooltip.offsetHeight > window.innerHeight) {
                top = e.clientY - dom.tooltip.offsetHeight - offset;
            }

            dom.tooltip.style.left = `${left}px`;
            dom.tooltip.style.top = `${top}px`;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            dom.tooltip.classList.remove('visible');
            dom.tooltip.classList.add('hidden');
        }
    });

    // URL Synchronization
    function updateUrlParams() {
        const params = new URLSearchParams();
        params.set('tab', state.currentTab);

        if (state.filters.search) {
            params.set('search', state.filters.search);
        }

        if (state.filters.creators.size > 0) {
            params.set('creators', Array.from(state.filters.creators).join(','));
        }

        if (state.filters.consumers.size > 0) {
            params.set('consumers', Array.from(state.filters.consumers).join(','));
        }

        if (state.filters.scope.size > 0) {
            params.set('scope', Array.from(state.filters.scope).join(','));
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    function loadStateFromUrl() {
        const params = new URLSearchParams(window.location.search);

        const tab = params.get('tab');
        if (tab && ['Introduction', 'Scope Definitions', 'Data Sets', 'Directory Structure', 'Reference Docs'].includes(tab)) {
            state.currentTab = tab;
        }

        const search = params.get('search');
        if (search) {
            state.filters.search = search;
            dom.searchInput.value = search;
        }

        const creators = params.get('creators');
        if (creators) {
            creators.split(',').forEach(c => state.filters.creators.add(c));
        }

        const consumers = params.get('consumers');
        if (consumers) {
            consumers.split(',').forEach(c => state.filters.consumers.add(c));
        }

        const scope = params.get('scope');
        if (scope) {
            scope.split(',').forEach(c => state.filters.scope.add(c));
        }
    }

    // Initialize
    if (typeof ON_SET_DATA !== 'undefined') {
        rawData = ON_SET_DATA;

        // Parse Scope Definitions first
        if (rawData['Scope Definitions']) {
            rawData['Scope Definitions'].forEach(item => {
                // Determine layout (raw dictionary vs header/body objects if any)
                // Data format seems to be array of objects. Some are HTML headers, others are dictionaries.
                // Based on data.js inspection, it's mixed. But definitions seem to be single key-value items in the array or rows.
                // Wait, based on user's data.js view: items can be { "Take": "Definition..." }.

                Object.entries(item).forEach(([key, value]) => {
                    // Skip if key is "html" (used for header rendering in simple view)
                    if (key === 'html') return;

                    // Normalize key for lookup
                    const normalized = normalizeScope(key);
                    if (normalized) {
                        scopeDescriptions.set(normalized.toLowerCase(), value);
                    }
                });
            });
        }

        processSpecs(); // Prepare filterable list

        loadStateFromUrl(); // Load state before rendering

        renderFilters(); // Will check boxes based on state
        switchTab(state.currentTab); // Switch to loaded tab
    } else {
        console.error('Error: ON_SET_DATA not found. Make sure data.js is loaded.');
        dom.stats.textContent = 'Error loading data. Please check console.';
    }

    // Tabs Event Listeners
    dom.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchTab(btn.dataset.tab);
        });
    });

    function switchTab(tabName) {
        state.currentTab = tabName;
        updateUrlParams();

        // Update active class on buttons
        dom.tabs.forEach(btn => {
            if (btn.dataset.tab === tabName) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Visibility Logic
        if (tabName === 'Data Sets') {
            dom.sidebar.classList.remove('hidden');
            dom.specsHeader.classList.remove('hidden');
            renderDataSetsGrid();
        } else {
            dom.sidebar.classList.add('hidden');
            dom.specsHeader.classList.add('hidden');
            renderSimpleView(tabName);
        }
    }

    // Render Simple List / Text View (Introduction, Directory Structure, Reference Docs, Scope Definitions)
    function renderSimpleView(sectionName) {
        dom.grid.innerHTML = '';
        dom.sidebar.classList.add('hidden');
        dom.specsHeader.classList.add('hidden');
        dom.filterContainer.classList.add('hidden');
        
        // Reset Grid Layout
        dom.grid.classList.remove('text-view-mode');
        
        // Add Section Title
        const title = document.createElement('h1');
        title.textContent = sectionName;
        title.className = 'section-main-title';
        title.style.gridColumn = '1 / -1';
        title.style.marginBottom = '2rem';
        title.style.color = 'var(--text-primary)';
        dom.grid.appendChild(title);

        const items = rawData[sectionName] || [];

        // Special handling for text-block sections
        const isTextBlock = ['Introduction', 'Directory Structure', 'Reference Docs'].includes(sectionName);

        if (isTextBlock) {
             dom.grid.classList.add('text-view-mode');
             const container = document.createElement('div');
             container.className = 'text-content';
             items.forEach(item => {
                 if (item.html) {
                     const contentDiv = document.createElement('div');
                     contentDiv.innerHTML = item.html;
                     container.appendChild(contentDiv);
                 }
             });
             dom.grid.appendChild(container);
             return;
        }

        if (sectionName === 'Scope Definitions') {
             const definedTerms = new Set();
             const definedDefinitions = new Set();
             items.forEach(item => {
                 Object.entries(item).forEach(([key, value]) => {
                     if (key !== 'html') {
                         definedTerms.add(key.toLowerCase());
                         definedDefinitions.add(value.trim()); 
                     }
                 });
             });

             items.forEach(item => {
                Object.entries(item).forEach(([key, value]) => {
                    if (key === 'html') {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = value;
                        const text = tmp.textContent.trim();
                        if (definedTerms.has(text.toLowerCase()) || definedDefinitions.has(text)) return;
                        
                        const div = document.createElement('div');
                        div.className = 'text-content intro-block'; 
                        div.style.gridColumn = '1 / -1';
                        div.style.maxWidth = '800px'; 
                        div.style.margin = '0 auto 2rem auto';
                        div.innerHTML = value;
                        dom.grid.appendChild(div);
                        return;
                    }
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.style.marginBottom = '1.5rem';
                    card.innerHTML = `<div class="card-header"><div class="card-title" data-tooltip="${key}">${key}</div></div><div class="card-body"><p style="white-space: pre-wrap;">${value}</p></div>`;
                    dom.grid.appendChild(card);
                });
             });
             return;
        }

        items.forEach(item => {
            if (item.html) {
                const div = document.createElement('div');
                div.className = 'text-content';
                if (!dom.grid.classList.contains('text-view-mode')) {
                    div.style.gridColumn = '1 / -1';
                }
                div.innerHTML = item.html;
                dom.grid.appendChild(div);
                return;
            }
            Object.entries(item).forEach(([key, value]) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '1.5rem';
                card.innerHTML = `<div class="card-header"><div class="card-title">${key}</div></div><div class="card-body"><p style="white-space: pre-wrap;">${value}</p></div>`;
                dom.grid.appendChild(card);
            });
        });
    }

    // Process nested specs into flat list for filtering (but keep hierarchy ref)
    function processSpecs() {
        specsFlatList = [];
        const specs = rawData['Specs'] || [];

        specs.forEach(h1 => {
            h1.subsections.forEach(h2 => {
                h2.items.forEach(item => {
                    const creators = Array.isArray(item.Creator) ? item.Creator : (item.Creator ? [item.Creator] : []);
                    const consumers = Array.isArray(item.Consumer) ? item.Consumer : (item.Consumer ? [item.Consumer] : []);
                    let rawScope = Array.isArray(item.Scope) ? item.Scope : (item.Scope ? [item.Scope] : []);

                    // Normalize Scope
                    const scope = rawScope.map(s => normalizeScope(s)).filter(s => s.length > 0);

                    specsFlatList.push({
                        h1Title: h1.title,
                        h2Title: h2.title,
                        creators: creators,
                        consumers: consumers,
                        scope: scope,
                        original: item
                    });
                });
            });
        });
    }

    function renderFilters() {
        const allCreators = new Set();
        const allConsumers = new Set();
        const allScope = new Set();

        specsFlatList.forEach(item => {
            item.creators.forEach(c => allCreators.add(c));
            item.consumers.forEach(c => allConsumers.add(c));
            item.scope.forEach(c => allScope.add(c));
        });

        // Helper to render a group with "See more"
        const renderGroup = (container, items, type) => {
            container.innerHTML = '';
            const sortedItems = Array.from(items).sort();

            // Constants
            const LIMIT = 5;
            const hasMore = sortedItems.length > LIMIT;

            // Render items
            sortedItems.forEach((value, index) => {
                const label = document.createElement('label');
                label.className = 'checkbox-label';
                if (index >= LIMIT) {
                    label.classList.add('hidden-filter-item');
                    label.style.display = 'none';
                }

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.value = value;

                if (state.filters[type].has(value)) {
                    input.checked = true;
                }

                input.addEventListener('change', (e) => {
                    if (e.target.checked) state.filters[type].add(value);
                    else state.filters[type].delete(value);

                    updateUrlParams();
                    renderDataSetsGrid();
                });

                label.appendChild(input);
                label.appendChild(document.createTextNode(value));
                if (type === 'scope') {
                    // Try to match description
                    // The value is already normalized (e.g. "Take")
                    const desc = scopeDescriptions.get(value.toLowerCase());
                    if (desc) {
                        // label.title = desc; // Removed native tooltip
                        label.dataset.tooltip = desc;
                    }
                }

                container.appendChild(label);
            });

            // Render Toggle Button
            if (hasMore) {
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'filter-toggle';
                toggleBtn.textContent = 'See more';
                let expanded = false;

                toggleBtn.addEventListener('click', () => {
                    expanded = !expanded;
                    const hiddenItems = container.querySelectorAll('.hidden-filter-item');
                    hiddenItems.forEach(item => {
                        item.style.display = expanded ? 'flex' : 'none';
                    });
                    toggleBtn.textContent = expanded ? 'See less' : 'See more';
                });

                container.appendChild(toggleBtn);
            }
        };

        renderGroup(dom.creatorFilters, allCreators, 'creators');
        renderGroup(dom.consumerFilters, allConsumers, 'consumers');
        renderGroup(dom.scopeFilters, allScope, 'scope');
    }

    dom.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.toLowerCase();
        updateUrlParams();
        renderDataSetsGrid();
    });

    function renderDataSetsGrid() {
        dom.grid.innerHTML = '';
        dom.grid.classList.remove('text-view-mode'); // Restore grid layout

        // Add Section Title
        const title = document.createElement('div');
        title.innerHTML = '<h1 style="color: var(--text-primary);">Data Sets</h1>';
        title.style.gridColumn = '1 / -1';
        dom.grid.appendChild(title);

        // 1. Filter the flattened list
        const filteredItems = specsFlatList.filter(item => {
            if (state.filters.search) {
                const jsonStr = JSON.stringify(item.original).toLowerCase();
                if (!jsonStr.includes(state.filters.search)) return false;
            }
            if (state.filters.creators.size > 0 && !item.creators.some(c => state.filters.creators.has(c))) return false;
            if (state.filters.consumers.size > 0 && !item.consumers.some(c => state.filters.consumers.has(c))) return false;
            if (state.filters.scope.size > 0 && !item.scope.some(c => state.filters.scope.has(c))) return false;
            return true;
        });

        dom.stats.textContent = `Showing ${filteredItems.length} items`;

        // 2. Group by H1 -> H2 for display
        // We rebuild the tree structure dynamically based on filtered items
        const grouped = {};

        filteredItems.forEach(item => {
            if (!grouped[item.h1Title]) grouped[item.h1Title] = {};
            if (!grouped[item.h1Title][item.h2Title]) grouped[item.h1Title][item.h2Title] = [];
            grouped[item.h1Title][item.h2Title].push(item);
        });

        // 3. Render
        // Sort H1 keys? Original order preserved if object keys insertion order (usually true in modern JS)
        // But better to rely on original order if possible. 
        // For simplicity, iterating object keys.

        for (const [h1Title, h2Group] of Object.entries(grouped)) {
            // H1 Header
            const h1El = document.createElement('div');
            h1El.className = 'section-h1';
            h1El.innerHTML = `<h2>${h1Title}</h2>`;
            dom.grid.appendChild(h1El);

            for (const [h2Title, items] of Object.entries(h2Group)) {
                // H2 Header - Removed as per user request (moved into card)
                // const h2El = document.createElement('div');
                // h2El.className = 'section-h2';
                // // Remove numbering from Title if desirable? Keeping as is.
                // h2El.innerHTML = `<h3>${h2Title}</h3>`;
                // dom.grid.appendChild(h2El);

                // Cards
                items.forEach(item => {
                    renderCard(item.original, dom.grid, item.creators, item.consumers, item.scope, h2Title);
                });
            }
        }
    }

    function renderCard(itemData, container, creators, consumers, scope, sectionTitle) {
        const card = document.createElement('div');
        card.className = 'card';

        // Use H2 section title as the main card title
        const displayTitle = sectionTitle || 'Item';

        // Tags
        const creatorTags = creators.map(c => `<span class="tag">${c}</span>`).join('');
        const consumerTags = consumers.map(c => `<span class="tag">${c}</span>`).join('');
        const scopeTags = scope.map(s => {
            const desc = scopeDescriptions.get(s.toLowerCase()) || '';
            const tooltipAttr = desc ? ` data-tooltip="${desc.replace(/"/g, '&quot;')}"` : '';
            return `<span class="tag"${tooltipAttr}>${s}</span>`;
        }).join('');

        // Build Body Content
        // We want to exclude Creator/Consumer from general fields, but show everything else.
        let bodyContent = '';

        // Special handling for Description to put it at top? Or just iterate?
        // Let's iterate but skip processed fields.
        const skipKeys = ['Creator', 'Consumer', 'Description', 'Scope']; // Description handled separately if we want, or in loop

        // If Description exists, add it first?
        if (itemData.Description) {
            bodyContent += `<div class="field-item" style="color: var(--text-secondary); margin-bottom: 1rem;"><p>${itemData.Description}</p></div>`;
        }

        Object.entries(itemData).forEach(([key, value]) => {
            if (skipKeys.includes(key)) return;

            let valueHtml = '';
            if (Array.isArray(value)) {
                valueHtml = `<ul style="margin: 0; padding-left: 1.2rem;">${value.map(v => `<li>${v}</li>`).join('')}</ul>`;
            } else {
                valueHtml = `<p>${value}</p>`;
            }

            bodyContent += `
                <div class="field-group">
                    <span class="field-label">${key}</span>
                    <div class="field-value">${valueHtml}</div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${displayTitle}</div>
            </div>
            <div class="card-body">
                ${bodyContent}
                
                <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${scope.length ? `
                        <div class="field-group">
                            <span class="field-label">Scope</span>
                            <div class="tag-container">${scopeTags}</div>
                        </div>` : ''}
                    
                    ${creators.length ? `
                        <div class="field-group">
                            <span class="field-label">Creators</span>
                            <div class="tag-container">${creatorTags}</div>
                        </div>` : ''}
                    
                    ${consumers.length ? `
                        <div class="field-group">
                            <span class="field-label">Consumers</span>
                            <div class="tag-container">${consumerTags}</div>
                        </div>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    }
    // Handle Print Button
    if (dom.printBtn) {
        dom.printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
