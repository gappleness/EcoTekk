(function () {
    const data = window.EcoTekkContent;
    const form = document.getElementById('et-form');
    const categorySelect = document.getElementById('category');
    const deviceSelect = document.getElementById('device');
    const brandSelect = document.getElementById('brand');
    const modelSelect = document.getElementById('model');
    const caseSelect = document.getElementById('case');
    const output = document.getElementById('et-output');
    const pageParams = new URLSearchParams(location.search);
    let userTouchedDevice = false;
    let userTouchedBrand = false;
    let userTouchedModel = false;

    if (!form || !data || !categorySelect || !deviceSelect || !brandSelect || !modelSelect || !caseSelect || !output) return;

    const models = {
        Samsung: [
            { value: 'Galaxy A15 5G', device: 'Phone', specs: '5G smartphone · 6.5-inch display · 50MP main camera · model variants differ', source: 'https://www.samsung.com/ph/smartphones/galaxy-a/galaxy-a15-5g/' },
            { value: 'Galaxy A25 5G', device: 'Phone', specs: 'Exynos platform · 6.5-inch FHD+ Super AMOLED 120Hz · 50MP OIS main camera · configurations vary', source: 'https://www.samsung.com/ph/smartphones/galaxy-a/galaxy-a25-5g-blue-256gb-sm-a256ezbhphl/' },
            { value: 'Galaxy S24 FE', device: 'Phone', specs: 'Galaxy S series phone · Exynos platform · AMOLED display · camera and memory vary by region', source: 'https://www.samsung.com/ph/smartphones/galaxy-s24-fe/' },
            { value: 'Galaxy Tab S9 FE', device: 'Tablet', specs: 'Android tablet · 10.9-inch display family · S Pen support · configuration varies', source: 'https://www.samsung.com/ph/tablets/galaxy-tab-s/galaxy-tab-s9-fe/' },
            { value: 'Galaxy Watch7', device: 'Smartwatch', specs: 'Wear OS smartwatch · 40mm and 44mm sizes · sensors and battery vary by size', source: 'https://www.samsung.com/ph/watches/galaxy-watch/galaxy-watch7/' },
            { value: 'Crystal UHD DU7000', device: 'TV / monitor', specs: '4K UHD smart TV family · screen sizes and regional features vary', source: 'https://www.samsung.com/ph/tvs/uhd-4k-tv/du7000-ua55du7000gxxp/' }
        ],
        Xiaomi: [
            { value: 'Redmi Note 13 5G', device: 'Phone', specs: '5G smartphone · 6.67-inch AMOLED 120Hz · 108MP main camera · configurations vary', source: 'https://www.mi.com/global/product/redmi-note-13-5g/specs/' },
            { value: 'Redmi Note 13 Pro 5G', device: 'Phone', specs: '5G smartphone · 200MP main camera with OIS · AMOLED display · configurations vary', source: 'https://www.mi.com/global/product/redmi-note-13-pro-5g/specs/' },
            { value: 'Redmi Pad SE', device: 'Tablet', specs: 'Android tablet family · 11-inch display · Snapdragon platform · memory varies', source: 'https://www.mi.com/global/product/redmi-pad-se/specs/' },
            { value: 'Xiaomi Smart Band 9', device: 'Smartwatch', specs: 'Fitness band · AMOLED display · battery and sensors depend on use', source: 'https://www.mi.com/global/product/xiaomi-smart-band-9/' }
        ],
        Apple: [
            { value: 'iPhone 15', device: 'Phone', specs: '6.1-inch Super Retina XDR OLED · A16 Bionic · dual 48MP/12MP rear camera · USB-C', source: 'https://www.apple.com/ph/iphone-15/specs/' },
            { value: 'iPhone 16', device: 'Phone', specs: '6.1-inch Super Retina XDR OLED · A18 chip · dual camera system · USB-C', source: 'https://www.apple.com/ph/iphone-16/specs/' },
            { value: 'iPad 10th generation', device: 'Tablet', specs: '10.9-inch Liquid Retina display · A14 Bionic · USB-C · storage varies', source: 'https://support.apple.com/en-ph/111840' },
            { value: 'Apple Watch Series 10', device: 'Smartwatch', specs: 'Apple Watch family · 42mm and 46mm cases · health and connectivity features vary', source: 'https://www.apple.com/ph/apple-watch-series-10/specs/' },
            { value: 'MacBook Air 13-inch M3', device: 'Laptop / computer', specs: '13.6-inch Liquid Retina display · Apple M3 · unified memory and storage configurable', source: 'https://support.apple.com/en-ph/118551' },
            { value: 'Mac mini M4', device: 'Laptop / computer', specs: 'Compact desktop computer · Apple M4 family · memory and storage configurable', source: 'https://www.apple.com/mac-mini/specs/' }
        ],
        Google: [
            { value: 'Pixel 8', device: 'Phone', specs: '6.2-inch OLED 120Hz · Google Tensor G3 · 50MP + 12MP rear cameras · USB-C', source: 'https://store.google.com/product/pixel_8_specs' },
            { value: 'Pixel 9', device: 'Phone', specs: 'Google Tensor G4 phone · 6.3-inch Actua display · camera and memory details vary by configuration', source: 'https://store.google.com/product/pixel_9_specs' },
            { value: 'Pixel Tablet', device: 'Tablet', specs: 'Android tablet · 11-inch display · Google Tensor G2 · charging speaker dock compatibility', source: 'https://store.google.com/product/pixel_tablet_specs' }
        ],
        OPPO: [
            { value: 'A78', device: 'Phone', specs: 'Snapdragon 680 · 6.43-inch FHD+ AMOLED 90Hz · 5000mAh typical battery · 67W SUPERVOOC', source: 'https://www.oppo.com/ph/smartphones/series-a/a78/specs/' },
            { value: 'A78 5G', device: 'Phone', specs: 'Dimensity 700 · 6.56-inch HD+ LCD 90Hz · 5000mAh typical battery · 33W SUPERVOOC', source: 'https://www.oppo.com/ph/smartphones/series-a/a78-5g/specs/' },
            { value: 'Reno11 5G', device: 'Phone', specs: '5G smartphone · MediaTek Dimensity platform · AMOLED display · regional configurations vary', source: 'https://www.oppo.com/ph/smartphones/series-reno/reno11-5g/specs/' },
            { value: 'Pad Air', device: 'Tablet', specs: 'Android tablet family · 11-inch display · Snapdragon platform · configuration varies', source: 'https://www.oppo.com/en/accessories/oppo-pad-air/specs/' }
        ],
        vivo: [
            { value: 'V30 5G', device: 'Phone', specs: '5G smartphone · Snapdragon 7 Gen 3 · AMOLED display · memory varies by region', source: 'https://www.vivo.com/ph/products/param/v30' },
            { value: 'Y28', device: 'Phone', specs: 'Android smartphone · large-capacity battery family · exact chipset and display depend on regional variant', source: 'https://www.vivo.com/ph/products' },
            { value: 'Pad3', device: 'Tablet', specs: 'Android tablet family · specifications and availability vary by market', source: 'https://www.vivo.com/en/products' }
        ],
        realme: [
            { value: '12 Pro+ 5G', device: 'Phone', specs: '5G smartphone · Snapdragon 7s Gen 2 · periscope portrait camera · configurations vary', source: 'https://www.realme.com/ph/realme-12-pro-plus/specs' },
            { value: 'C67', device: 'Phone', specs: 'Android smartphone · 108MP camera family · regional 4G/5G variants differ', source: 'https://www.realme.com/ph/' },
            { value: 'Pad 2', device: 'Tablet', specs: 'Android tablet family · 11.5-inch display class · configurations vary', source: 'https://www.realme.com/in/realme-pad-2/specs' }
        ],
        Motorola: [
            { value: 'moto g84 5G', device: 'Phone', specs: '5G smartphone · Snapdragon 695 · pOLED display · regional configurations vary', source: 'https://www.motorola.com/ph/smartphones-moto-g-84-5g/p' },
            { value: 'motorola edge 50 fusion', device: 'Phone', specs: '5G smartphone · Snapdragon platform · pOLED display · configuration varies', source: 'https://www.motorola.com/ph/' }
        ],
        Huawei: [
            { value: 'nova 12i', device: 'Phone', specs: 'Android-based Huawei phone · 108MP main camera · regional software and network support vary', source: 'https://consumer.huawei.com/ph/phones/nova-12i/specs/' },
            { value: 'MatePad 11.5', device: 'Tablet', specs: 'Tablet family · 11.5-inch display · regional editions and configurations vary', source: 'https://consumer.huawei.com/ph/tablets/matepad-11-5/specs/' },
            { value: 'WATCH FIT 3', device: 'Smartwatch', specs: 'Smartwatch · rectangular AMOLED display · health and battery features vary by use', source: 'https://consumer.huawei.com/ph/wearables/watch-fit3/specs/' }
        ],
        Acer: [
            { value: 'Aspire Lite AL14-51M', device: 'Laptop / computer', specs: '14-inch Aspire Lite family · Intel platform; exact CPU, memory and display vary by SKU', source: 'https://www.acer.com/ph-en/support/product-support/Aspire_AL14-51M' },
            { value: 'Nitro V 15', device: 'Laptop / computer', specs: '15.6-inch gaming laptop family · CPU/GPU, display and memory vary by SKU', source: 'https://www.acer.com/ph-en/laptops/nitro/nitro-v-15' },
            { value: 'Aspire TC desktop', device: 'Laptop / computer', specs: 'Desktop PC family · processor, graphics, memory and storage vary by configuration', source: 'https://www.acer.com/ph-en/desktops-and-all-in-ones/aspire-tc' }
        ],
        Lenovo: [
            { value: 'IdeaPad Slim 3 15IAH8', device: 'Laptop / computer', specs: '15-inch IdeaPad Slim 3 family · Intel platform · exact CPU, memory and display vary by machine type', source: 'https://pcsupport.lenovo.com/ph/en/products/laptops-and-netbooks/ideapad-s-series-netbooks/ideapad-slim-3-15iah8' },
            { value: 'LOQ 15', device: 'Laptop / computer', specs: '15-inch gaming laptop family · CPU/GPU and panel vary by machine type', source: 'https://www.lenovo.com/ph/en/c/laptops/loq/' },
            { value: 'Tab M11', device: 'Tablet', specs: 'Android tablet · 11-inch display family · configuration varies by region', source: 'https://www.lenovo.com/ph/en/p/tablets/android-tablets/lenovo-tab-series/' }
        ],
        Dell: [
            { value: 'Inspiron 15 3530', device: 'Laptop / computer', specs: '15.6-inch laptop family · Intel processor options; RAM, display and storage vary by configuration', source: 'https://www.dell.com/support/product-details/en-us/product/inspiron-15-3530-laptop/' },
            { value: 'XPS 13', device: 'Laptop / computer', specs: '13-inch premium laptop family · processor, display and memory vary by generation', source: 'https://www.dell.com/en-us/shop/dell-laptops/xps-13-laptop/spd/xps-13-9340-laptop' }
        ],
        ASUS: [
            { value: 'Vivobook 15', device: 'Laptop / computer', specs: '15.6-inch laptop family · processor, display, memory and storage vary by exact SKU', source: 'https://www.asus.com/ph/laptops/for-home/vivobook/' },
            { value: 'ROG Zephyrus G14', device: 'Laptop / computer', specs: 'Compact gaming laptop family · CPU/GPU and display vary by generation', source: 'https://rog.asus.com/ph/laptops/rog-zephyrus/rog-zephyrus-g14-series/' },
            { value: 'ROG Ally', device: 'Game console', specs: 'Windows handheld gaming device · AMD Ryzen Z1 family · screen and storage vary by version', source: 'https://rog.asus.com/ph/gaming-handhelds/rog-ally/rog-ally-2023/' }
        ],
        HP: [
            { value: 'Pavilion 15', device: 'Laptop / computer', specs: '15-inch laptop family · processor, memory, display and storage vary by product number', source: 'https://support.hp.com/ph-en' },
            { value: 'Victus 15', device: 'Laptop / computer', specs: 'Gaming laptop family · CPU/GPU and display vary by product number', source: 'https://www.hp.com/ph-en/shop/victus-laptops' },
            { value: 'DeskJet 2776', device: 'Printer', specs: 'All-in-one inkjet printer · print/scan/copy · wireless features depend on setup', source: 'https://support.hp.com/ph-en/product/details/hp-deskjet-2700-all-in-one-printer-series/ của' }
        ],
        MSI: [
            { value: 'Katana 15', device: 'Laptop / computer', specs: 'Gaming laptop family · processor, graphics and display vary by SKU', source: 'https://www.msi.com/Laptop/Katana-15-HX-B14WX' },
            { value: 'Modern 14', device: 'Laptop / computer', specs: '14-inch laptop family · processor, memory and display vary by SKU', source: 'https://www.msi.com/Business-Productivity/Modern-14-H-DX' }
        ],
        Microsoft: [
            { value: 'Surface Laptop 6', device: 'Laptop / computer', specs: 'Surface laptop · Intel Core Ultra platform · display and configuration vary by size', source: 'https://www.microsoft.com/en-ph/surface' },
            { value: 'Surface Pro 10', device: 'Tablet', specs: 'Windows detachable tablet · Intel Core Ultra platform · keyboard sold separately', source: 'https://www.microsoft.com/en-ph/surface' }
        ],
        Nintendo: [
            { value: 'Switch OLED', device: 'Game console', specs: 'Hybrid game console · 7-inch OLED screen · docked and handheld play modes', source: 'https://www.nintendo.com/us/gaming-systems/switch/oled-model/' },
            { value: 'Switch Lite', device: 'Game console', specs: 'Handheld-only Nintendo Switch system · integrated controls · handheld-compatible games', source: 'https://www.nintendo.com/us/gaming-systems/switch/lite/' }
        ],
        Sony: [
            { value: 'PlayStation 5 Slim', device: 'Game console', specs: 'PlayStation 5 console family · disc and digital editions · storage and accessories vary', source: 'https://www.playstation.com/en-ph/ps5/' },
            { value: 'BRAVIA X80L', device: 'TV / monitor', specs: '4K Google TV family · screen sizes and regional features vary', source: 'https://www.sony.com.ph/electronics/televisions/x80l-series' },
            { value: 'WH-1000XM5', device: 'Audio device', specs: 'Wireless noise-cancelling headphones · Bluetooth audio · battery and features depend on settings', source: 'https://www.sony.com.ph/electronics/headband-headphones/wh-1000xm5' },
            { value: 'Alpha 6400', device: 'Camera', specs: 'APS-C mirrorless camera · interchangeable E-mount lenses · kit configuration varies', source: 'https://www.sony.com.ph/electronics/interchangeable-lens-cameras/ilce-6400-body-kit' }
        ],
        Canon: [
            { value: 'EOS R50', device: 'Camera', specs: 'APS-C mirrorless camera · RF/RF-S lens mount · kit lens varies', source: 'https://www.canon.com.ph/cameras/eos-r50' },
            { value: 'PIXMA G3010', device: 'Printer', specs: 'Wireless refillable ink-tank all-in-one printer · print/scan/copy', source: 'https://ph.canon/en/support' }
        ],
        Epson: [
            { value: 'EcoTank L3250', device: 'Printer', specs: 'Wireless all-in-one ink-tank printer · print/scan/copy', source: 'https://www.epson.com.ph/For-Home/Printers/Ink-Tank-Printers/Epson-EcoTank-L3250/p/C11CJ67503' }
        ],
        'TP-Link': [
            { value: 'Archer AX23', device: 'Router', specs: 'Wi-Fi 6 router · dual-band AX1800 class · regional hardware versions may differ', source: 'https://www.tp-link.com/ph/home-networking/wifi-router/archer-ax23/' },
            { value: 'Deco X20', device: 'Router', specs: 'Wi-Fi 6 mesh system · multi-unit kits available · hardware version varies', source: 'https://www.tp-link.com/ph/home-networking/deco/deco-x20/' }
        ],
        Garmin: [
            { value: 'Forerunner 265', device: 'Smartwatch', specs: 'GPS running smartwatch · AMOLED display · 42mm and 46mm variants', source: 'https://www.garmin.com/en-PH/p/886785' }
        ],
        JBL: [
            { value: 'Flip 6', device: 'Audio device', specs: 'Portable Bluetooth speaker · IP67-rated design · battery and audio settings affect runtime', source: 'https://www.jbl.com/bluetooth-speakers/FLIP-6-.html' }
        ]
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
        },
        'Apple|iPhone 15|power': {
            title: 'iPhone 15 — force restart and charging checks',
            steps: ['Quickly press and release Volume Up, then quickly press and release Volume Down.', 'Press and hold the Side button until the Apple logo appears. This does not erase personal data.', 'If it still will not start, follow Apple’s black-screen guidance and charge using an undamaged compatible USB-C cable and adapter. Seek service if the problem continues.'],
            source: 'Apple Support: If your iPhone will not turn on or the screen is black',
            url: 'https://support.apple.com/en-ph/116940'
        },
        'Google|Pixel 8|power': {
            title: 'Google Pixel 8 — blank screen or no power',
            steps: ['Press and hold the Power button for 5–7 seconds to try to turn it on.', 'If the battery may be fully drained, connect a compatible USB-C PD charger. Google notes that a deeply drained Pixel may show no response for up to 25 minutes.', 'If there is still no display, follow Google’s screen/no-power checks or arrange an authorized repair. Do not use a manual reset as an initial test because it erases data.'],
            source: 'Google Pixel Help: Fix a Pixel phone that will not charge or turn on',
            url: 'https://support.google.com/pixelphone/answer/7167687'
        },
        'Google|Pixel 8|screen': {
            title: 'Google Pixel 8 — frozen or unresponsive screen',
            steps: ['If the screen is frozen, hold the Power button for about 60 seconds to restart the phone.', 'If the issue returns, check Android and app updates, available storage, and whether the problem disappears in Safe Mode.', 'A factory reset removes device data; back up first and use it only after less destructive checks or with support guidance.'],
            source: 'Google Pixel Help: Fix a Pixel phone that freezes',
            url: 'https://support.google.com/pixelphone/answer/6377386'
        },
        'OPPO|A78|power': {
            title: 'OPPO A78 — stuck on logo or will not turn on',
            steps: ['Remove a case if it may be pressing the Power or Volume buttons, and check for signs of liquid exposure. If liquid exposure is suspected, stop and contact an OPPO service centre.', 'If there is no liquid exposure or visible damage, OPPO advises charging for at least 15 minutes before trying its force-restart method: hold Power and Volume Up for about 10 seconds.', 'If the phone remains stuck or repeatedly restarts, use OPPO support rather than selecting a wipe/reset option.'],
            source: 'OPPO Support: What to do if your OPPO phone is stuck on the OPPO logo',
            url: 'https://support.oppo.com/en/answer/?aid=neu10940'
        },
        'OPPO|A78 5G|power': {
            title: 'OPPO A78 5G — stuck on logo or will not turn on',
            steps: ['Remove a case if it may be pressing the Power or Volume buttons, and check for signs of liquid exposure. If liquid exposure is suspected, stop and contact an OPPO service centre.', 'If there is no liquid exposure or visible damage, OPPO advises charging for at least 15 minutes before trying its force-restart method: hold Power and Volume Up for about 10 seconds.', 'If the phone remains stuck or repeatedly restarts, use OPPO support rather than selecting a wipe/reset option.'],
            source: 'OPPO Support: What to do if your OPPO phone is stuck on the OPPO logo',
            url: 'https://support.oppo.com/en/answer/?aid=neu10940'
        },
        'Dell|Inspiron 15 3530|power': {
            title: 'Dell Inspiron 15 3530 — power diagnostics',
            steps: ['Check the outlet, AC adapter and charging indicator for obvious damage or unusual heat. Do not continue using damaged power equipment.', 'Use Dell SupportAssist or the Dell preboot diagnostics available for the exact service tag to check for hardware errors.', 'Dell documents model-dependent diagnostics such as LCD-BIST and M-BIST; use the Inspiron 15 3530 manual/support page to confirm which tests apply. Do not open the laptop or disconnect its internal battery unless qualified.'],
            source: 'Dell Support: Inspiron 15 3530 support and diagnostics',
            url: 'https://www.dell.com/support/product-details/en-us/product/inspiron-15-3530-laptop/'
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
        let matches = 0;
        Object.entries(data).forEach(([id, item]) => {
            if (category && item.category !== category) return;
            if (device && item.device !== device) return;
            const option = el('option', '', item.problem);
            option.value = id;
            caseSelect.append(option);
            matches++;
        });
        if (matches === 0 && category && device) {
            const id = 'generic-' + device.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + category;
            data[id] = {
                category, device,
                problem: category === 'reuse' ? 'It works but is no longer needed' : 'I need help troubleshooting it',
                headline: 'Start with safe, device-appropriate checks.',
                summary: 'This device category does not yet have a dedicated EcoTekk guide. Use the manufacturer’s exact model support page for device-specific steps.',
                checks: [
                    'Record the exact model number and operating-system or firmware version before looking up instructions.',
                    'Check the manufacturer’s official support page and try only reversible, user-level checks for this exact model.',
                    'Back up important data where possible. Stop using the device if it is unusually hot, physically damaged, wet, or has a swollen battery.',
                    'Do not open the device, install unofficial firmware, or perform a factory reset as an initial troubleshooting step.'
                ],
                who: 'The device manufacturer’s support team or a qualified repair technician',
                query: device.toLowerCase() + ' repair service',
                reuse: 'If it is working, consider continued use, repair, donation or refurbishment before recycling.',
                recover: 'Use an authorized e-waste collection or recycling service that accepts this device category.',
                when: 'Seek qualified help if basic checks fail or there are signs of physical or electrical damage.',
                ask: ['Do you support this exact model?', 'Will diagnosis or repair affect stored data or settings?', 'What are the assessment fee, repair estimate and warranty?']
            };
            const option = el('option', '', data[id].problem);
            option.value = id;
            caseSelect.append(option);
        }
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

        const selectedModel = (models[brand] || []).find(entry => entry.value === model);
        if (selectedModel) {
            const specs = el('section', 'et-result');
            specs.append(el('h3', '', 'Selected model specifications'));
            specs.append(el('p', '', selectedModel.specs));
            const specSource = el('a', 'et-small', 'View manufacturer specifications / support page');
            specSource.href = selectedModel.source;
            specSource.target = '_blank';
            specSource.rel = 'noopener noreferrer';
            specs.append(specSource);
            output.append(specs);
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

    const detectStatus = document.getElementById('detect-status');

    // Android browsers that support User-Agent Client Hints may expose the exact
    // hardware model. iOS browsers deliberately do not expose an exact iPhone/iPad
    // model, and desktop browsers generally do not expose a computer model.
    const androidModelCodes = {
        'SM-A155F': ['Samsung', 'Galaxy A15'],
        'SM-A155M': ['Samsung', 'Galaxy A15'],
        'SM-A156E': ['Samsung', 'Galaxy A15 5G'],
        'SM-A156B': ['Samsung', 'Galaxy A15 5G'],
        'SM-A256E': ['Samsung', 'Galaxy A25 5G'],
        'SM-A256B': ['Samsung', 'Galaxy A25 5G'],
        'SM-A546E': ['Samsung', 'Galaxy A54 5G'],
        'SM-A556E': ['Samsung', 'Galaxy A55 5G'],
        'SM-S921B': ['Samsung', 'Galaxy S24'],
        'SM-S926B': ['Samsung', 'Galaxy S24+'],
        'SM-S928B': ['Samsung', 'Galaxy S24 Ultra'],
        'SM-S931B': ['Samsung', 'Galaxy S25'],
        'SM-S936B': ['Samsung', 'Galaxy S25+'],
        'SM-S938B': ['Samsung', 'Galaxy S25 Ultra'],
        'SM-X510': ['Samsung', 'Galaxy Tab S9 FE'],
        'SM-X516B': ['Samsung', 'Galaxy Tab S9 FE 5G'],
        'SM-X210': ['Samsung', 'Galaxy Tab A9+'],
        'Pixel 8': ['Google', 'Pixel 8'],
        'Pixel 8 Pro': ['Google', 'Pixel 8 Pro'],
        'Pixel 9': ['Google', 'Pixel 9'],
        'Pixel 9 Pro': ['Google', 'Pixel 9 Pro'],
        'Pixel 9 Pro XL': ['Google', 'Pixel 9 Pro XL']
    };

    function addDetectedModelOption(brand, model, device) {
        if (!brand || !model) return;
        if (!models[brand]) models[brand] = [];
        let entry = models[brand].find(item => item.value.toLowerCase() === model.toLowerCase());
        if (!entry) {
            entry = {
                value: model,
                device: device || deviceSelect.value || 'Phone',
                specs: 'The browser identified this model name or hardware model code. Check the manufacturer page for the exact regional specifications and hardware variant.',
                source: brand === 'Apple' ? 'https://support.apple.com/' :
                    brand === 'Samsung' ? 'https://www.samsung.com/ph/support/' :
                    brand === 'Google' ? 'https://support.google.com/pixelphone/' :
                    'https://www.google.com/search?q=' + encodeURIComponent(brand + ' official support ' + model)
            };
            models[brand].push(entry);
        }
    }

    function applyDetectedDevice(info) {
        if (info.device && !pageParams.has('device') && !userTouchedDevice) {
            deviceSelect.value = info.device;
        }
        if (info.brand && !pageParams.has('brand') && !userTouchedBrand &&
            [...brandSelect.options].some(option => option.value === info.brand || option.textContent === info.brand)) {
            brandSelect.value = info.brand;
        }
        updateModels();
        if (info.model && !pageParams.has('model') && !userTouchedModel) {
            addDetectedModelOption(info.brand, info.model, info.device);
            updateModels();
            const match = [...modelSelect.options].find(option => option.value.toLowerCase() === info.model.toLowerCase());
            if (match) modelSelect.value = match.value;
        }
        updateTopics();
        if (detectStatus) detectStatus.textContent = info.message;
    }

    async function detectDevice() {
        const ua = navigator.userAgent || '';
        const platform = navigator.userAgentData?.platform || navigator.platform || '';
        let rawModel = '';
        let info = { device: '', brand: '', model: '', message: 'This browser does not provide enough information to identify the device model.' };

        if (navigator.userAgentData?.getHighEntropyValues) {
            try {
                const hints = await navigator.userAgentData.getHighEntropyValues(['model']);
                rawModel = (hints.model || '').trim();
            } catch (_) {
                // Browser denied or does not support high-entropy model hints.
            }
        }

        if (/iPhone|iPod/i.test(ua)) {
            info = {
                device: 'Phone', brand: 'Apple', model: '',
                message: 'Detected: Apple iPhone. iOS/Safari hides the exact iPhone model from websites, so EcoTekk cannot reliably tell which iPhone you have.'
            };
        } else if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
            info = {
                device: 'Tablet', brand: 'Apple', model: '',
                message: 'Detected: Apple iPad. Apple does not expose the exact iPad model to websites.'
            };
        } else if (/Android/i.test(ua) || /Android/i.test(platform)) {
            const uaModel = ua.match(/;\s*([^;)]+?)\s*(?:Build\/|\))/i);
            rawModel = rawModel || (uaModel ? uaModel[1].trim() : '');
            info.device = /Mobile/i.test(ua) ? 'Phone' : 'Tablet';

            const code = Object.keys(androidModelCodes).find(key => rawModel.toLowerCase().includes(key.toLowerCase()));
            if (code) {
                [info.brand, info.model] = androidModelCodes[code];
                info.message = 'Automatically detected: ' + info.brand + ' ' + info.model + '. Check Settings → About phone/tablet to confirm the regional variant.';
            } else {
                const catalogMatch = Object.entries(models).flatMap(([brand, entries]) => entries.map(entry => ({ brand, entry })))
                    .find(({ brand, entry }) => rawModel && (rawModel.toLowerCase().includes(entry.value.toLowerCase()) || entry.value.toLowerCase().includes(rawModel.toLowerCase())));
                if (catalogMatch) {
                    info.brand = catalogMatch.brand;
                    info.model = catalogMatch.entry.value;
                    info.device = catalogMatch.entry.device;
                    info.message = 'Automatically detected: ' + info.brand + ' ' + info.model + '.';
                } else {
                    const upper = rawModel.toUpperCase();
                    if (/^(SM-|SAMSUNG)/.test(upper)) info.brand = 'Samsung';
                    else if (/^(REDMI|XIAOMI|POCO)/i.test(rawModel)) info.brand = 'Xiaomi';
                    else if (/^CPH/i.test(rawModel)) info.brand = 'OPPO';
                    else if (/^V[0-9A-Z]/i.test(rawModel)) info.brand = 'vivo';
                    else if (/^RMX/i.test(rawModel)) info.brand = 'realme';
                    else if (/^M[0-9A-Z]{3,}/i.test(rawModel)) info.brand = 'Xiaomi';
                    else if (/PIXEL/i.test(rawModel)) info.brand = 'Google';
                    info.model = rawModel || '';
                    info.message = rawModel
                        ? 'Android hardware identifier detected: ' + rawModel + (info.brand ? ' (' + info.brand + ').' : '.') + ' This identifier may be a manufacturer code rather than the retail model name.'
                        : 'Detected: Android device. This browser hides the exact model identifier, so the model cannot be auto-filled.';
                }
            }
        } else if (/CrOS/i.test(ua)) {
            info = { device: 'Laptop / computer', brand: 'Google', model: '', message: 'Detected: Chromebook. ChromeOS does not reliably expose the exact Chromebook model to websites.' };
        } else if (/Windows|Win/i.test(platform + ' ' + ua)) {
            info = { device: 'Laptop / computer', brand: '', model: '', message: 'Detected: Windows computer. Browsers do not provide the PC manufacturer or exact model.' };
        } else if (/macOS|Macintosh|MacIntel/i.test(platform + ' ' + ua)) {
            info = { device: 'Laptop / computer', brand: 'Apple', model: '', message: 'Detected: Mac computer. The browser does not reveal whether it is a MacBook, iMac or Mac mini, or its exact model.' };
        } else if (/Linux/i.test(platform + ' ' + ua)) {
            info = { device: 'Laptop / computer', brand: '', model: '', message: 'Detected: Linux computer. The browser does not expose the manufacturer or exact model.' };
        }

        applyDetectedDevice(info);
    }

    brandSelect.addEventListener('change', function () { userTouchedBrand = true; updateModels(); });
    modelSelect.addEventListener('change', function () { userTouchedModel = true; });
    deviceSelect.addEventListener('change', function () { userTouchedDevice = true; updateModels(); updateTopics(); });
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

    const params = pageParams;
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

    // Run automatically when Explore opens; no detection button is required.
    detectDevice().catch(function () {
        if (detectStatus) detectStatus.textContent = 'Automatic detection is unavailable in this browser. Please choose the device and model manually.';
    });
})();
