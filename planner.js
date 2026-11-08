(function () {
    const data = window.EcoTekkContent;
    const form = document.getElementById('et-form');
    const categorySelect = document.getElementById('category');
    const deviceSelect = document.getElementById('device');
    const brandSelect = document.getElementById('brand');
    const modelSelect = document.getElementById('model');
    const caseSelect = document.getElementById('case');
    const output = document.getElementById('et-output');

    if (!form || !data || !categorySelect || !deviceSelect || !brandSelect || !modelSelect || !caseSelect || !output) return;

    const models = {
        Samsung: [{ value: 'Galaxy A15 5G', device: 'Phone' }],
        Xiaomi: [{ value: 'Redmi Note 13 5G', device: 'Phone' }],
        Acer: [{ value: 'Aspire Lite AL14-51M', device: 'Laptop / computer' }],
        Lenovo: [{ value: 'IdeaPad Slim 3 15IAH8', device: 'Laptop / computer' }]
    };

    // Only add model-specific steps when an official support source documents them.
    const modelGuides = {
        'Samsung|Galaxy A15 5G|power': {
            title: 'Samsung Galaxy A15 5G — forced restart',
            steps: ['If the phone is frozen, press and hold the Side button and Volume Down together for more than 7 seconds, until it restarts.', 'If it still will not start, check the charger and cable for damage and follow Samsung support guidance. Do not factory-reset it just to test whether it powers on.'],
            source: 'Samsung support: Galaxy device will not start or is in a boot loop',
            url: 'https://www.samsung.com/us/support/troubleshoot/TSG10013514/'
        },
        'Samsung|Galaxy A15 5G|software': {
            title: 'Samsung Galaxy A15 5G — check for a third-party app problem',
            steps: ['To test whether a downloaded app is causing freezing, use Samsung’s Safe mode procedure: open the power menu, touch and hold Power off, then choose Safe mode.', 'If the issue disappears in Safe mode, review recently installed apps. Restart normally to leave Safe mode.'],
            source: 'Samsung Philippines: How to use Safe Mode on a Galaxy phone',
            url: 'https://www.samsung.com/ph/support/mobile-devices/how-to-use-safe-mode-on-samsung-galaxy-device/'
        },
        'Xiaomi|Redmi Note 13 5G|screen': {
            title: 'Redmi Note 13 5G — frozen or unresponsive screen',
            steps: ['If the screen is frozen, press and hold the Power button for more than 10 seconds to attempt a restart.', 'Do not choose Recovery mode or factory reset as an initial step. Xiaomi notes that a factory reset erases device data; contact an authorized service center if the restart does not help.'],
            source: 'Xiaomi: Why is the screen of the REDMI Note 13 5G frozen and unresponsive?',
            url: 'https://www.mi.com/global/support/faq/details/KA-367246/'
        },
        'Xiaomi|Redmi Note 13 5G|power': {
            title: 'Redmi Note 13 5G — phone will not turn on',
            steps: ['Check the phone and original charging accessories for heat or damage. If the phone is unusually hot, unplug it and arrange service inspection.', 'Xiaomi documents holding the Power button for more than 10 seconds for a force restart. If the phone remains unresponsive, use Xiaomi support rather than attempting an unverified reset.'],
            source: 'Xiaomi: Phone can’t turn on',
            url: 'https://www.mi.com/global/support/faq/details/KA-07080/'
        },
        'Acer|Aspire Lite AL14-51M|software': {
            title: 'Acer Aspire Lite AL14-51M — verify the exact support package',
            steps: ['Open Acer’s official AL14-51M product support page and confirm the operating system before downloading drivers or firmware.', 'Do not install a BIOS package for another Aspire model or hardware variant. If the problem requires a BIOS update, follow Acer’s exact package instructions or ask Acer support.'],
            source: 'Acer Philippines: Aspire AL14-51M product support',
            url: 'https://www.acer.com/ph-en/support/product-support/Aspire_AL14-51M'
        },
        'Lenovo|IdeaPad Slim 3 15IAH8|software': {
            title: 'Lenovo IdeaPad Slim 3 15IAH8 — BIOS access',
            steps: ['Lenovo documents F2 or Fn+F2 as the BIOS key for IdeaPad systems; press it immediately after powering on. The exact key and recovery options can vary by model.', 'Check the full machine type on Lenovo Support before changing BIOS settings or applying firmware. Do not change boot or security settings unless you know what they do.'],
            source: 'Lenovo Support: How to select boot device / access BIOS on IdeaPad',
            url: 'https://pcsupport.lenovo.com/ph/en/products/laptops-and-netbooks/ideapad-s-series-netbooks/ideapad-slim-3-15iah8/solutions/ht104668-how-to-select-boot-device-from-bios-boot-menu-ideapad-thinkpad-thinkstation-thinkcentre-ideacentre'
        }
    };

    function el(tag, className, value) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined) node.textContent = value;
        return node;
    }

    function link(label, url, ghost) {
        const anchor = el('a', 'et-btn' + (ghost ? ' ghost' : ''), label + ' →');
        anchor.href = url;
        return anchor;
    }

    function block(title, lines) {
        const section = el('section', 'et-result');
        section.append(el('h3', '', title));
        const list = el('ul', '');
        lines.forEach(line => list.append(el('li', '', line)));
        section.append(list);
        return section;
    }

    function safeArea(value) {
        return (value || '').trim().slice(0, 90);
    }

    function googleMaps(query, area) {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query + (area ? ' ' + area : ''));
    }

    function updateModels() {
        const brand = brandSelect.value;
        const device = deviceSelect.value;
        modelSelect.replaceChildren();
        const first = el('option', '', brand ? 'Choose a model (optional)' : 'Choose a brand first');
        first.value = '';
        modelSelect.append(first);
        const available = (models[brand] || []).filter(model => !device || model.device === device);
        available.forEach(model => {
            const option = el('option', '', model.value);
            option.value = model.value;
            modelSelect.append(option);
        });
        modelSelect.disabled = !brand || available.length === 0;
        if (!available.length && brand) {
            const option = el('option', '', 'No sample models for this device type');
            option.value = '';
            modelSelect.append(option);
        }
    }

    function updateTopics() {
        const category = categorySelect.value;
        const device = deviceSelect.value;
        const previous = caseSelect.value;
        caseSelect.replaceChildren();
        const first = el('option', '', 'Choose a topic');
        first.value = '';
        caseSelect.append(first);
        Object.entries(data).forEach(([id, item]) => {
            if (category && item.category !== category) return;
            if (device && item.device !== device) return;
            const option = el('option', '', item.problem);
            option.value = id;
            caseSelect.append(option);
        });
        if ([...caseSelect.options].some(option => option.value === previous)) caseSelect.value = previous;
    }

    function render(id, area) {
        const item = data[id];
        if (!item) return;
        output.replaceChildren();
        output.append(el('span', 'et-eyebrow', 'Your device-to-action plan'));
        output.append(el('h2', '', item.headline));
        output.append(el('p', 'et-lead', item.summary));

        const brand = brandSelect.value;
        const model = modelSelect.value;
        const exactGuide = brand && model ? modelGuides[[brand, model, item.category].join('|')] : null;
        if (exactGuide) {
            const specific = el('section', 'et-result');
            specific.append(el('h3', '', 'Model-specific guidance: ' + exactGuide.title));
            const steps = el('ul', '');
            exactGuide.steps.forEach(step => steps.append(el('li', '', step)));
            specific.append(steps);
            const source = el('a', 'et-small', 'Official source: ' + exactGuide.source);
            source.href = exactGuide.url;
            source.target = '_blank';
            source.rel = 'noopener noreferrer';
            specific.append(source);
            output.append(specific);
        } else if (brand || model) {
            output.append(el('p', 'et-note', 'No verified brand/model-specific procedure is available for this category yet. The general checks below are shared guidance; use the manufacturer’s official support page before model-dependent repairs or firmware changes.'));
        }

        output.append(block('1 / General checks that apply to this issue', item.checks));
        const people = el('section', 'et-result');
        people.append(el('h3', '', '2 / Who can help'), el('p', '', item.who), el('p', 'et-small', 'Ask before booking or traveling. EcoTekk has not independently verified a provider.'));
        const questions = el('ul', '');
        item.ask.forEach(question => questions.append(el('li', '', question)));
        people.append(el('h3', '', 'Questions worth asking'), questions);
        output.append(people);

        const outcome = el('section', 'et-result');
        outcome.append(el('h3', '', '3 / Another useful possibility'), el('p', '', item.reuse), el('h3', '', 'If recycling is appropriate'), el('p', '', item.recover));
        output.append(outcome);
        output.append(block('4 / When to act', [item.when, 'Before visiting a service: confirm current hours, fees, booking requirements and acceptance for your exact device.']));

        const actions = el('div', 'et-actions');
        actions.append(link('Find relevant help on Maps', googleMaps(item.query, area)), link('Use EcoTekk drop-off finder', 'home.html', true), link('Open preparation checklist', 'checklist.html?case=' + encodeURIComponent(id), true));
        output.append(actions);
        output.append(el('p', 'et-note', 'Model-specific instructions are shown only where a manufacturer or official support source documents them. The Maps button opens an external search, not a verified EcoTekk partner list.'));

        try {
            sessionStorage.setItem('ecotekk-last-case', id);
            sessionStorage.setItem('ecotekk-last-area', area);
        } catch (_) {}
    }

    brandSelect.addEventListener('change', function () { updateModels(); });
    deviceSelect.addEventListener('change', function () { updateModels(); updateTopics(); });
    categorySelect.addEventListener('change', updateTopics);

    // Category-first: topics remain filtered as the user changes any selection.
    updateModels();
    updateTopics();

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const id = caseSelect.value;
        if (!data[id]) return;
        const area = safeArea(document.getElementById('area').value);
        render(id, area);
        const params = new URLSearchParams({ category: categorySelect.value, device: deviceSelect.value, case: id });
        if (brandSelect.value) params.set('brand', brandSelect.value);
        if (modelSelect.value) params.set('model', modelSelect.value);
        if (history.replaceState) history.replaceState(null, '', 'explore.html?' + params.toString());
        output.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });

    const params = new URLSearchParams(location.search);
    if (params.has('device')) deviceSelect.value = params.get('device');
    if (params.has('category')) categorySelect.value = params.get('category');
    if (params.has('brand')) brandSelect.value = params.get('brand');
    updateModels();
    if (params.has('model')) modelSelect.value = params.get('model');
    updateTopics();
    if (params.has('case') && data[params.get('case')]) {
        caseSelect.value = params.get('case');
        render(caseSelect.value, safeArea(document.getElementById('area').value));
    }
})();
