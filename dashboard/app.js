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
        tabs: document.querySelectorAll('.tab-btn')
    };

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
        if (tab && ['Introduction', 'Scope Definitions', 'Specs', 'Directory Structure', 'Reference Docs'].includes(tab)) {
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
        if (tabName === 'Specs') {
            dom.sidebar.classList.remove('hidden');
            dom.specsHeader.classList.remove('hidden');
            renderSpecsGrid();
        } else {
            dom.sidebar.classList.add('hidden');
            dom.specsHeader.classList.add('hidden');
            renderSimpleView(tabName);
        }
    }

    function renderSimpleView(sectionName) {
        dom.grid.innerHTML = '';
        const items = rawData[sectionName] || [];

        if (items.length === 0) {
            dom.grid.innerHTML = '<div class="text-content"><h3>No content found.</h3></div>';
            return;
        }

        // Special handling for text-block sections (Introduction, Directory Structure, Reference Docs)
        if (['Introduction', 'Directory Structure', 'Reference Docs'].includes(sectionName)) {
            const container = document.createElement('div');
            container.className = 'text-content';
            // Assuming first item has the merged HTML
            if (items[0] && items[0].html) {
                container.innerHTML = items[0].html;
            }
            dom.grid.appendChild(container);
            return;
        }

        const container = document.createElement('div');
        container.className = 'text-content';

        items.forEach(item => {
            // Each item might be a dictionary of multiple definitions (from a table)
            Object.entries(item).forEach(([key, value]) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '1.5rem';

                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-title">${key}</div>
                    </div>
                    <div class="card-body">
                        <p style="white-space: pre-wrap;">${value}</p>
                    </div>
                `;
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
                    const scope = Array.isArray(item.Scope) ? item.Scope : (item.Scope ? [item.Scope] : []);

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
                    renderSpecsGrid();
                });

                label.appendChild(input);
                label.appendChild(document.createTextNode(value));
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
        renderSpecsGrid();
    });

    function renderSpecsGrid() {
        dom.grid.innerHTML = '';

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
                    renderCard(item.original, dom.grid, item.creators, item.consumers, h2Title);
                });
            }
        }
    }

    function renderCard(itemData, container, creators, consumers, sectionTitle) {
        const card = document.createElement('div');
        card.className = 'card';

        // Use H2 section title as the main card title
        const displayTitle = sectionTitle || 'Item';

        // Tags
        const creatorTags = creators.map(c => `<span class="tag">${c}</span>`).join('');
        const consumerTags = consumers.map(c => `<span class="tag">${c}</span>`).join('');

        // Build Body Content
        // We want to exclude Creator/Consumer from general fields, but show everything else.
        let bodyContent = '';

        // Special handling for Description to put it at top? Or just iterate?
        // Let's iterate but skip processed fields.
        const skipKeys = ['Creator', 'Consumer', 'Description']; // Description handled separately if we want, or in loop

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
                
                ${creators.length ? `
                <div class="field-group" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <span class="field-label">Creators</span>
                    <div class="tag-container">${creatorTags}</div>
                </div>` : ''}
                ${consumers.length ? `
                <div class="field-group">
                    <span class="field-label">Consumers</span>
                    <div class="tag-container">${consumerTags}</div>
                </div>` : ''}
            </div>
        `;
        container.appendChild(card);
    }
});
