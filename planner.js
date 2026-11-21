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
    let pendingBrand = '';   // brand suggested by auto-detection or the URL, applied once brands unlock
    let pendingModel = '';
    const brandHint = document.getElementById('brand-hint');

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

        
    // Prefer the full EcoTekkDevices catalog (device-database.js) when available.
    // This gives every brand the complete model list and brand-level diagnostic steps.
    (function mergeFullCatalog() {
        if (!window.EcoTekkDevices || !window.EcoTekkDevices.brands) return;
        Object.entries(window.EcoTekkDevices.brands).forEach(([brand, data]) => {
            if (!data.models || !data.models.length) return;
            if (!models[brand]) models[brand] = [];
            const existing = new Set(models[brand].map(e => (e.value || '').toLowerCase()));
            data.models.forEach(m => {
                const key = (m.value || '').toLowerCase();
                if (!key || existing.has(key)) return;
                // Normalize specs to a readable string for the simple models shape
                let specsStr = '';
                if (typeof m.specs === 'string') specsStr = m.specs;
                else if (m.specs && typeof m.specs === 'object') {
                    specsStr = Object.entries(m.specs)
                        .filter(([, v]) => v && v !== 'Unknown')
                        .map(([k, v]) => k + ': ' + v)
                        .join(' · ');
                }
                models[brand].push({
                    value: m.value,
                    device: m.device || 'Phone',
                    specs: specsStr || (m.value + ' — see detailed specs in result'),
                    source: m.source || (data.supportUrl || '')
                });
                existing.add(key);
            });
        });
    })();

// Model-specific troubleshooting lives entirely on this page. Steps are self-contained
    // and tailored to the exact brand + model + issue category. No primary redirect to
    // manufacturer sites — the guidance below is the EcoTekk result.
    const modelGuides = {
        // —— Samsung phones ——
        'Samsung|Galaxy A15 5G|power': {
            title: 'Samsung Galaxy A15 5G — force restart & power recovery',
            steps: [
                'If the phone is frozen or unresponsive, press and hold the Side button and Volume Down together for more than 7 seconds until the screen goes black and the device restarts.',
                'If it still will not start, leave it connected to a known-good Samsung-compatible charger and cable for at least 20–30 minutes, then try the force restart again.',
                'Inspect the USB-C port for lint or debris (do not insert metal tools). Try a different compatible cable and adapter.',
                'Do not perform a factory reset merely to test whether the phone powers on — that erases your data and is not a first-step diagnostic.'
            ]
        },
        'Samsung|Galaxy A15 5G|software': {
            title: 'Samsung Galaxy A15 5G — Safe mode & app isolation',
            steps: [
                'Open the power menu, touch and hold “Power off”, then choose Safe mode. The phone restarts with third-party apps disabled.',
                'If the freezing, crashing or battery drain disappears in Safe mode, a recently installed app is the likely cause. Uninstall recent apps one by one after returning to normal mode.',
                'To leave Safe mode, simply restart the phone normally.',
                'Also check Settings → Apps for apps using excessive battery or that have “Force stop” available.'
            ]
        },
        'Samsung|Galaxy A15 5G|charge': {
            title: 'Samsung Galaxy A15 5G — charging path checks',
            steps: [
                'Use only undamaged, Samsung-compatible USB-C cables and adapters. Third-party fast-charge bricks sometimes negotiate poorly.',
                'Clean the USB-C port gently with a soft, dry brush or wooden toothpick — never metal.',
                'Try wireless charging if you have a compatible pad; if wireless works but wired does not, the port or cable is the suspect.',
                'In Samsung Members (if installed) run the battery / charging diagnostic under Support → Phone diagnostics.'
            ]
        },
        'Samsung|Galaxy S24 Ultra|power': {
            title: 'Samsung Galaxy S24 Ultra — force restart & S Pen checks',
            steps: [
                'Press and hold Side + Volume Down for more than 7 seconds to force a restart.',
                'If the device is completely dead, charge for 30 minutes with the original or a 45 W-capable PD charger, then force-restart again.',
                'Because this model has an integrated S Pen, check that the pen is fully seated and not triggering continuous input that could prevent normal wake.',
                'Avoid factory reset as a first diagnostic step.'
            ]
        },
        'Samsung|Galaxy S24 Ultra|software': {
            title: 'Samsung Galaxy S24 Ultra — Safe mode & One UI diagnostics',
            steps: [
                'Open the power menu → touch and hold Power off → Safe mode.',
                'If the issue vanishes in Safe mode, remove recently installed apps after a normal restart.',
                'Open Samsung Members → Support → Phone diagnostics and run the relevant tests (battery, sensors, display, touch).',
                'Check for One UI / Android updates under Settings → Software update before considering more invasive recovery.'
            ]
        },
        'Samsung|Galaxy S24+|power': {
            title: 'Samsung Galaxy S24+ — force restart',
            steps: [
                'Hold Side + Volume Down for more than 7 seconds until the device restarts.',
                'If unresponsive, charge 20–30 minutes with a compatible PD charger, then retry the force restart.',
                'Do not open Recovery or perform a wipe as an initial test.'
            ]
        },
        'Samsung|Galaxy S24|power': {
            title: 'Samsung Galaxy S24 — force restart',
            steps: [
                'Hold Side + Volume Down for more than 7 seconds to force restart.',
                'Charge with a known-good cable/adapter for 20+ minutes if the phone is completely dead, then force-restart again.',
                'Avoid factory reset as a first diagnostic.'
            ]
        },
        'Samsung|Galaxy A25 5G|power': {
            title: 'Samsung Galaxy A25 5G — force restart',
            steps: [
                'Press and hold Side + Volume Down for more than 7 seconds.',
                'If still dead, charge 20–30 minutes and retry. Inspect the USB-C port for debris.',
                'Do not factory-reset to test power-on.'
            ]
        },
        'Samsung|Galaxy A54 5G|power': {
            title: 'Samsung Galaxy A54 5G — force restart',
            steps: [
                'Hold Side + Volume Down for more than 7 seconds to force a restart.',
                'Charge fully with a compatible cable if the phone shows no signs of life, then retry.',
                'Use Samsung Members diagnostics when the phone is responsive again.'
            ]
        },
        // —— Xiaomi / Redmi ——
        'Xiaomi|Redmi Note 13 5G|power': {
            title: 'Redmi Note 13 5G — force restart & power recovery',
            steps: [
                'Hold the Power button for more than 10 seconds to attempt a force restart.',
                'If the phone remains dead, leave it on the original or a compatible charger for at least 30 minutes, then try the 10-second hold again.',
                'Check for unusual heat; if the device is hot, unplug it and stop using it until inspected.',
                'Do not enter Recovery or perform a factory reset as an initial troubleshooting step — that erases data.'
            ]
        },
        'Xiaomi|Redmi Note 13 5G|screen': {
            title: 'Redmi Note 13 5G — frozen or unresponsive screen',
            steps: [
                'Press and hold Power for more than 10 seconds to force a restart.',
                'If the screen stays black after restart, charge the phone for 20–30 minutes and try again.',
                'Avoid Recovery mode or factory reset as a first action.',
                'Once responsive, check for system updates and clear the cache of the launcher or recent heavy apps if freezes return.'
            ]
        },
        'Xiaomi|Redmi Note 13 Pro 5G|power': {
            title: 'Redmi Note 13 Pro 5G — force restart',
            steps: [
                'Hold Power for more than 10 seconds for a force restart.',
                'If unresponsive, charge 30 minutes with a compatible charger, then retry.',
                'Inspect the USB-C port; this model supports high-wattage charging — use a good quality cable.'
            ]
        },
        // —— Apple ——
        'Apple|iPhone 15|power': {
            title: 'iPhone 15 — force restart sequence',
            steps: [
                'Quickly press and release Volume Up, then quickly press and release Volume Down, then press and hold the Side button until the Apple logo appears (usually 10–20 seconds).',
                'If still unresponsive, connect a known-good USB-C cable and charger for at least 15–30 minutes, then repeat the force-restart sequence.',
                'Do not attempt DFU mode or recovery mode as a first step — those are more invasive and can erase data.',
                'If the phone shows the battery icon but will not boot, leave it charging longer and retry the sequence.'
            ]
        },
        'Apple|iPhone 15|charge': {
            title: 'iPhone 15 — charging checks',
            steps: [
                'Use a certified USB-C cable and a charger that supports USB Power Delivery.',
                'Clean the USB-C port carefully with a soft, non-metal tool; lint is a common cause of intermittent charging.',
                'Try a different cable and wall adapter. Wireless MagSafe charging can help isolate whether the port or the battery path is at fault.',
                'If the phone only charges when held at a certain angle, the port or cable is likely the issue.'
            ]
        },
        'Apple|iPhone 16|power': {
            title: 'iPhone 16 — force restart sequence',
            steps: [
                'Quickly press and release Volume Up → Volume Down → then hold the Side button until the Apple logo appears.',
                'If dead, charge 15–30 minutes with a known-good USB-C PD charger, then repeat the sequence.',
                'Avoid Recovery / DFU as an initial diagnostic.'
            ]
        },
        'Apple|iPhone 16|charge': {
            title: 'iPhone 16 — charging checks',
            steps: [
                'Use a certified USB-C cable and PD-capable charger.',
                'Clean the USB-C port of debris. Test with another cable and adapter.',
                'Try MagSafe wireless charging to separate port problems from battery problems.'
            ]
        },
        'Apple|MacBook Air 13-inch M3|power': {
            title: 'MacBook Air 13-inch (M3) — power recovery',
            steps: [
                'Connect the original or a known-good USB-C power adapter. Leave it connected for at least 10–15 minutes even if nothing appears on screen.',
                'Press and hold the power button for 10 seconds to force a shutdown, release, wait a few seconds, then press the power button again to start.',
                'If still no response, try a different USB-C port and cable. Apple silicon Macs do not have a classic SMC reset; the long power-button hold is the main user-level recovery.',
                'Do not open the case or disconnect the battery.'
            ]
        },
        // —— Google Pixel ——
        'Google|Pixel 8|power': {
            title: 'Google Pixel 8 — force restart & no-power recovery',
            steps: [
                'Hold the Power button for about 60 seconds to force a full restart.',
                'If completely unresponsive, leave the phone on a known-good charger for at least 30 minutes, then hold Power again for 60 seconds.',
                'Try a different cable and charger. Clean the USB-C port of lint.',
                'Do not perform a factory reset as a first diagnostic — it erases all data.'
            ]
        },
        'Google|Pixel 8|screen': {
            title: 'Google Pixel 8 — frozen or black screen',
            steps: [
                'Hold Power for about 60 seconds to force restart.',
                'If the screen remains black, charge 30 minutes and retry the 60-second hold.',
                'Once responsive, check storage space, app updates, and try Safe mode (hold Power → long-press Power off → Safe mode) to isolate third-party apps.'
            ]
        },
        'Google|Pixel 9|power': {
            title: 'Google Pixel 9 — force restart',
            steps: [
                'Hold Power for approximately 60 seconds until the device restarts.',
                'If dead, charge 30+ minutes with a compatible charger, then repeat the long press.',
                'Avoid factory reset as an early step.'
            ]
        },
        // —— OPPO ——
        'OPPO|A78|power': {
            title: 'OPPO A78 — force restart & logo stuck recovery',
            steps: [
                'Remove any thick case that might be pressing the Power or Volume buttons.',
                'Check for liquid exposure indicators; if liquid is suspected, stop and seek service.',
                'Charge for at least 15 minutes, then hold Power + Volume Up for about 10 seconds to force a restart.',
                'If the phone stays stuck on the logo or keeps rebooting, do not choose wipe/reset options yet — those erase data.'
            ]
        },
        'OPPO|A78 5G|power': {
            title: 'OPPO A78 5G — force restart & logo stuck recovery',
            steps: [
                'Remove any case that could be holding buttons down.',
                'Charge 15+ minutes, then hold Power + Volume Up for about 10 seconds.',
                'If liquid damage is possible, stop and arrange professional inspection.',
                'Skip wipe/reset options as a first action.'
            ]
        },
        // —— Dell laptops ——
        'Dell|Inspiron 15 3530|power': {
            title: 'Dell Inspiron 15 3530 — power & pre-boot diagnostics',
            steps: [
                'Confirm the outlet works and the AC adapter LED (if present) is lit. Try a different known-good outlet.',
                'Hard reset: unplug the AC adapter, hold the power button for 15–20 seconds, reconnect power, then press power normally.',
                'At the Dell logo screen, tap F12 repeatedly to open the one-time boot menu, then select Diagnostics (or ePSA) if available. Note any error codes.',
                'In Windows, open SupportAssist → Troubleshooting → Scan Hardware for a full hardware check.',
                'Do not open the chassis or disconnect the internal battery unless you are qualified.'
            ]
        },
        'Dell|XPS 13|power': {
            title: 'Dell XPS 13 — power recovery & diagnostics',
            steps: [
                'Connect a known-good USB-C power adapter. Leave it connected for several minutes.',
                'Hard reset: unplug power, hold power button 15–20 seconds, reconnect, then power on.',
                'Tap F12 at the Dell logo for the boot menu and run Diagnostics if listed.',
                'Use SupportAssist in Windows for further hardware scans.'
            ]
        },
        // —— Lenovo ——
        'Lenovo|IdeaPad 3|power': {
            title: 'Lenovo IdeaPad — power & Novo button recovery',
            steps: [
                'Many IdeaPad models have a small Novo button (pinhole) near the power button or on the side. With the laptop off, press the Novo button with a paperclip to open the Novo Button Menu → System Recovery or BIOS Setup.',
                'Hard reset: unplug AC, hold power 15–20 seconds, reconnect, then power on.',
                'In Windows, open Lenovo Vantage → Hardware Scan if available.',
                'Do not flash BIOS or open the case as a first step.'
            ]
        },
        // —— ASUS ——
        'ASUS|Vivobook 15|power': {
            title: 'ASUS Vivobook 15 — power recovery',
            steps: [
                'Hard reset: unplug the charger, hold the power button for 15–20 seconds, reconnect power, then press power normally.',
                'At the ASUS logo, try F2 for BIOS or Esc for boot menu if needed.',
                'In Windows, open MyASUS → System Diagnosis for hardware checks when the system is running.'
            ]
        },
        'ASUS|ROG Ally|power': {
            title: 'ASUS ROG Ally — power & recovery',
            steps: [
                'Hold the power button for 10+ seconds to force shutdown, wait a few seconds, then press power to start.',
                'If unresponsive, leave it on the original charger for 30 minutes, then try again.',
                'For deeper recovery, hold Volume Down + Power to reach the boot menu / recovery options when available.',
                'Avoid factory reset of Windows as a first diagnostic.'
            ]
        },
        // —— HP ——
        'HP|Pavilion 15|power': {
            title: 'HP Pavilion 15 — power & hardware diagnostics',
            steps: [
                'Hard reset: unplug AC, remove the battery if it is user-removable (many modern Pavilions are not), hold power 15–20 seconds, reconnect power, then start.',
                'At the HP logo, tap Esc (or F2) to open the Startup Menu, then F2 for System Diagnostics or F10 for BIOS.',
                'Run the HP Hardware Diagnostics tests and note any failure codes.'
            ]
        },
        // —— Nintendo ——
        'Nintendo|Switch|power': {
            title: 'Nintendo Switch — force restart & power recovery',
            steps: [
                'Hold the power button for 12 seconds to force a full shutdown, then press it once to turn the console back on.',
                'If the console is completely unresponsive, leave it on the official dock or charger for 30–60 minutes, then try the 12-second hold again.',
                'Check that the AC adapter and dock (if used) are undamaged.',
                'Do not attempt to open the console or use unofficial recovery tools.'
            ]
        },
        'Nintendo|Switch OLED|power': {
            title: 'Nintendo Switch OLED — force restart',
            steps: [
                'Hold Power for 12 seconds to force shutdown, then press Power once to restart.',
                'If dead, charge via the official dock or charger for 30+ minutes before retrying.',
                'Inspect the USB-C port on the console and dock for debris.'
            ]
        },
        // —— Sony ——
        'Sony|PlayStation 5 Slim|power': {
            title: 'PlayStation 5 Slim — safe restart & power checks',
            steps: [
                'Hold the power button on the console until you hear a second beep (about 7 seconds) to enter Safe Mode, or hold longer for a full power-off.',
                'If the console will not power on, ensure the power cord is firmly seated at both ends and try a different outlet.',
                'Leave the console powered off and unplugged for 5–10 minutes, then reconnect and try again.',
                'Do not open the console or attempt unofficial firmware.'
            ]
        },
        // —— Printers ——
        'HP|DeskJet 2776|power': {
            title: 'HP DeskJet 2776 — power & reset',
            steps: [
                'Turn the printer off using the power button, unplug the power cord from the wall and the printer, wait 60 seconds, then reconnect and power on.',
                'If the printer still will not power on, try a different wall outlet and inspect the power adapter for damage.',
                'Once powered, run any built-in self-test or alignment page from the control panel if available.'
            ]
        },
        'Epson|EcoTank L3250|power': {
            title: 'Epson EcoTank L3250 — power & basic recovery',
            steps: [
                'Power off, unplug both ends of the power cord, wait 60 seconds, then reconnect and power on.',
                'Ensure the power outlet is working. Try another outlet if needed.',
                'Once on, check the ink levels and run a nozzle check from the printer’s maintenance menu if print quality is also an issue.'
            ]
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

    // Brands offered for each device type. Anything with a documented sample model for a device is also added,
    // so a brand can never appear for a device type it has no entry for, and vice versa.
    const BRANDS_BY_DEVICE = {
        'Phone': ['Samsung', 'Xiaomi', 'Apple', 'Google', 'OPPO', 'vivo', 'realme', 'Motorola', 'Huawei'],
        'Tablet': ['Samsung', 'Xiaomi', 'Apple', 'Huawei', 'Lenovo', 'Microsoft'],
        'Laptop / computer': ['Acer', 'Apple', 'ASUS', 'Dell', 'Google', 'HP', 'Huawei', 'Lenovo', 'Microsoft', 'MSI', 'Samsung'],
        'Smartwatch': ['Samsung', 'Xiaomi', 'Apple', 'Google', 'Huawei', 'Garmin'],
        'TV / monitor': ['Samsung', 'Sony', 'Xiaomi', 'Acer', 'ASUS', 'Dell', 'HP', 'Lenovo', 'MSI'],
        'Printer': ['Canon', 'Epson', 'HP'],
        'Router': ['TP-Link', 'ASUS', 'Huawei', 'Xiaomi'],
        'Game console': ['Nintendo', 'Sony', 'Microsoft'],
        'Camera': ['Canon', 'Sony'],
        'Audio device': ['JBL', 'Sony', 'Samsung', 'Apple', 'Google', 'Huawei', 'Xiaomi'],
        'Cables / chargers': ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'vivo', 'realme', 'Huawei', 'Motorola', 'Google', 'Acer', 'ASUS', 'Dell', 'HP', 'Lenovo'],
        'Batteries': []
    };

    function brandsFor(device) {
        const list = (BRANDS_BY_DEVICE[device] || []).slice();
        Object.entries(models).forEach(([brand, entries]) => {
            if (entries.some(entry => entry.device === device) && !list.includes(brand)) list.push(brand);
        });
        return list;
    }

    // Brand is locked until BOTH the problem category and the device type are chosen, then it only lists brands
    // that make that device type.
    function updateBrands() {
        const category = categorySelect.value;
        const device = deviceSelect.value;
        const previous = brandSelect.value;
        brandSelect.replaceChildren();
        const first = el('option', '', '');
        first.value = '';
        brandSelect.append(first);

        function lock(label, hint) {
            first.textContent = label;
            brandSelect.disabled = true;
            brandSelect.value = '';
            if (brandHint) brandHint.textContent = hint;
            updateModels();
        }

        if (!category || !device) {
            const missing = [!category ? 'the problem' : '', !device ? 'the device type' : ''].filter(Boolean).join(' and ');
            lock('Choose a problem and device type first', 'Brand unlocks after you choose ' + missing + '.');
            return;
        }
        const list = brandsFor(device);
        if (!list.length) {
            lock('No brand needed for this device type', 'Brands are not used for ' + device.toLowerCase() + '. Continue with the topic below.');
            return;
        }
        first.textContent = 'Choose a brand (optional)';
        list.forEach(brand => {
            const option = el('option', '', brand);
            option.value = brand;
            brandSelect.append(option);
        });
        brandSelect.disabled = false;
        if (list.includes(previous)) brandSelect.value = previous;
        else if (pendingBrand && !userTouchedBrand && list.includes(pendingBrand)) brandSelect.value = pendingBrand;
        if (brandHint) brandHint.textContent = 'Showing ' + list.length + ' brand' + (list.length === 1 ? '' : 's') + ' that make ' + device.toLowerCase() + ' devices.';
        updateModels();
        if (pendingModel && !userTouchedModel && brandSelect.value === pendingBrand) {
            const match = [...modelSelect.options].find(option => option.value.toLowerCase() === pendingModel.toLowerCase());
            if (match) modelSelect.value = match.value;
        }
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
                summary: 'This device category does not yet have a dedicated EcoTekk topic. The steps below stay on this page and are tailored once you choose brand and model.',
                checks: [
                    'Record the exact model number and operating-system or firmware version.',
                    'Use the brand and model selectors so EcoTekk can show unique first-aid steps for that combination on this page.',
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
        const category = item.category;
        const device = item.device || deviceSelect.value;

        // 1) Exact model + category guide (fully on-page)
        const exactKey = brand && model ? [brand, model, category].join('|') : null;
        const exactGuide = exactKey ? modelGuides[exactKey] : null;

        // 2) Brand-level diagnostic steps from the full device catalog (unique per brand)
        let brandDiag = null;
        if (brand && window.EcoTekkDevices && window.EcoTekkDevices.brands && window.EcoTekkDevices.brands[brand]) {
            const b = window.EcoTekkDevices.brands[brand];
            if (b.diagnosticSteps && b.diagnosticSteps.length) {
                brandDiag = {
                    title: b.diagnosticTitle || (brand + ' brand diagnostics'),
                    steps: b.diagnosticSteps
                };
            }
        }

        // 3) Dynamic unique guide when we have brand/model but no exact match
        function buildDynamicGuide() {
            if (!brand) return null;
            const label = model ? (brand + ' ' + model) : brand;
            const steps = [];
            // Brand-specific safe first actions by device family
            if (/phone|tablet/i.test(device || '')) {
                if (/samsung/i.test(brand)) {
                    steps.push('Force restart: hold Side + Volume Down for more than 7 seconds.');
                    steps.push('If the device is responsive, open Samsung Members → Support → Phone diagnostics and run the tests that match this issue (battery, charging, display, touch, sensors).');
                    steps.push('To isolate apps: open the power menu, touch and hold Power off, then choose Safe mode. If the problem disappears, a third-party app is likely involved.');
                } else if (/xiaomi|redmi|poco/i.test(brand)) {
                    steps.push('Force restart: hold the Power button for more than 10 seconds.');
                    steps.push('Leave the device on a compatible charger for 20–30 minutes if it appears completely dead, then retry the long-press.');
                    steps.push('Avoid Recovery / factory reset as a first step — that erases data.');
                } else if (/apple/i.test(brand)) {
                    if (/iphone/i.test(model || '') || /phone/i.test(device || '')) {
                        steps.push('Force restart: quickly press and release Volume Up, then Volume Down, then hold the Side button until the Apple logo appears.');
                    } else {
                        steps.push('Force shutdown: hold the power button for 10 seconds, release, wait a few seconds, then press power again.');
                    }
                    steps.push('Charge for 15–30 minutes with a known-good cable and adapter before repeating the force-restart sequence.');
                } else if (/google|pixel/i.test(brand)) {
                    steps.push('Force restart: hold the Power button for about 60 seconds.');
                    steps.push('If unresponsive, charge 30 minutes with a known-good charger, then hold Power again for 60 seconds.');
                    steps.push('Once responsive, try Safe mode (hold Power → long-press Power off → Safe mode) to test for third-party app issues.');
                } else if (/oppo|vivo|realme|oneplus/i.test(brand)) {
                    steps.push('Remove any case that might be pressing buttons. Charge for at least 15 minutes.');
                    steps.push('Force restart: hold Power + Volume Up (or Power + Volume Down on some models) for about 10 seconds.');
                    steps.push('Do not choose wipe/reset options as a first diagnostic step.');
                } else if (/huawei|honor/i.test(brand)) {
                    steps.push('Force restart: hold Power for 10–20 seconds (or Power + Volume Down on some models).');
                    steps.push('Charge 20–30 minutes if the device is dead, then retry.');
                    steps.push('Avoid factory reset as an early step.');
                } else if (/motorola/i.test(brand)) {
                    steps.push('Force restart: hold the Power button for about 10–15 seconds until the device restarts.');
                    steps.push('If dead, charge 20–30 minutes then retry the long press.');
                } else {
                    steps.push('Force restart using the power button (hold 10–20 seconds). Exact button combinations vary by model.');
                    steps.push('Charge with a known-good cable and adapter for 20–30 minutes if the device shows no signs of life.');
                    steps.push('Do not open the device or perform a factory reset as a first step.');
                }
            } else if (/laptop|computer/i.test(device || '')) {
                if (/dell/i.test(brand)) {
                    steps.push('Hard reset: unplug AC, hold power button 15–20 seconds, reconnect power, then press power.');
                    steps.push('At the Dell logo, tap F12 for the boot menu and run Diagnostics / ePSA if available. Note any error codes.');
                    steps.push('In Windows, open SupportAssist → Troubleshooting → Scan Hardware.');
                } else if (/lenovo/i.test(brand)) {
                    steps.push('Hard reset: unplug AC, hold power 15–20 seconds, reconnect, then power on.');
                    steps.push('Many Lenovo models have a Novo button (pinhole). With the laptop off, press it with a paperclip for the recovery / BIOS menu.');
                    steps.push('In Windows, open Lenovo Vantage → Hardware Scan if available.');
                } else if (/hp/i.test(brand)) {
                    steps.push('Hard reset: unplug AC, hold power 15–20 seconds, reconnect, then start.');
                    steps.push('At the HP logo, tap Esc (or F2) for the Startup Menu, then F2 for System Diagnostics.');
                    steps.push('Run the HP Hardware Diagnostics and record any failure codes.');
                } else if (/asus/i.test(brand)) {
                    steps.push('Hard reset: unplug charger, hold power 15–20 seconds, reconnect, then power on.');
                    steps.push('At the ASUS logo try F2 for BIOS. In Windows open MyASUS → System Diagnosis.');
                } else if (/acer/i.test(brand)) {
                    steps.push('Hard reset: unplug AC, hold power 15–20 seconds, reconnect, then start.');
                    steps.push('In Windows open Acer Care Center or AcerSense for system checks if installed.');
                } else if (/apple/i.test(brand)) {
                    steps.push('Connect a known-good USB-C power adapter and leave it for 10–15 minutes.');
                    steps.push('Hold the power button for 10 seconds to force shutdown, wait a few seconds, then press power to start.');
                    steps.push('Apple silicon Macs do not use a classic SMC reset; the long power-button hold is the primary recovery.');
                } else {
                    steps.push('Hard reset: unplug power, hold the power button 15–20 seconds, reconnect power, then start.');
                    steps.push('Try the manufacturer’s pre-boot diagnostics key (often F2, F12 or Esc) at the logo screen.');
                    steps.push('Do not open the chassis or disconnect the battery unless qualified.');
                }
            } else if (/watch|smartwatch/i.test(device || '')) {
                steps.push('Charge the watch on its exact model charger for at least 30–60 minutes.');
                steps.push('Force restart using the documented button sequence for this brand (usually a long press of the side button(s)).');
                steps.push('Check that the paired phone’s Bluetooth and the watch app are up to date.');
            } else if (/console|switch|playstation/i.test(device || '') || /nintendo|sony|microsoft/i.test(brand)) {
                steps.push('Force shutdown with a long press of the power button (typically 10–12 seconds), wait, then power on again.');
                steps.push('Leave the console on its official charger or dock for 30–60 minutes if it appears completely dead.');
                steps.push('Do not open the console or use unofficial recovery tools.');
            } else if (/printer/i.test(device || '')) {
                steps.push('Power off, unplug both ends of the power cord, wait 60 seconds, then reconnect and power on.');
                steps.push('Try a different wall outlet and inspect the power adapter for damage.');
                steps.push('Once powered, run any built-in self-test or nozzle check from the control panel.');
            } else {
                steps.push('Power-cycle the device: turn it off, wait 30–60 seconds, then turn it on again.');
                steps.push('Try a different power source or cable if applicable.');
                steps.push('Stop if the device is unusually hot, swollen, wet, or physically damaged — seek qualified help.');
            }
            // Always-safe closing steps
            steps.push('Record the exact model name/number and any error messages or behaviour (when it happens, after which action) before seeking further help.');
            steps.push('Back up important data if the device becomes responsive. Do not open the device or install unofficial firmware as a first step.');
            return {
                title: label + ' — ' + (category || 'issue') + ' troubleshooting (EcoTekk guide)',
                steps: steps
            };
        }

        const dynamicGuide = (!exactGuide && (brand || model)) ? buildDynamicGuide() : null;
        const guideToShow = exactGuide || dynamicGuide;

        if (guideToShow) {
            const specific = el('section', 'et-result');
            specific.append(el('h3', '', guideToShow.title));
            const steps = el('ul', '');
            guideToShow.steps.forEach(step => steps.append(el('li', '', step)));
            specific.append(steps);
            if (exactGuide) {
                specific.append(el('p', 'et-small', 'These steps are tailored to the exact model and issue you selected and are shown directly on EcoTekk.'));
            } else {
                specific.append(el('p', 'et-small', 'These steps are generated for your selected brand' + (model ? ' and model' : '') + ' and device type. They stay on this page so you can follow them without leaving EcoTekk.'));
            }
            output.append(specific);
        }

        // Brand-level diagnostic suite (unique per brand, from device catalog)
        if (brandDiag && (!exactGuide || brandDiag.steps.length)) {
            const brandSec = el('section', 'et-result');
            brandSec.append(el('h3', '', 'Brand diagnostics: ' + brandDiag.title));
            const ul = el('ul', '');
            brandDiag.steps.forEach(s => ul.append(el('li', '', s)));
            brandSec.append(ul);
            brandSec.append(el('p', 'et-small', 'These brand-level checks apply across many ' + brand + ' devices and complement the model-specific steps above.'));
            output.append(brandSec);
        }

        // Specs (no forced external link as the solution)
        const selectedModel = (models[brand] || []).find(entry => entry.value === model);
        if (selectedModel) {
            const specs = el('section', 'et-result');
            specs.append(el('h3', '', 'Selected model specifications'));
            specs.append(el('p', '', typeof selectedModel.specs === 'string' ? selectedModel.specs : (selectedModel.specs && JSON.stringify(selectedModel.specs)) || 'Specifications on file for this model.'));
            output.append(specs);
        }

        // Also try full catalog for richer specs
        if (brand && model && window.EcoTekkDevices && window.EcoTekkDevices.brands && window.EcoTekkDevices.brands[brand]) {
            const fullModels = window.EcoTekkDevices.brands[brand].models || [];
            const full = fullModels.find(m => m.value === model || (m.value && m.value.toLowerCase() === model.toLowerCase()));
            if (full && full.specs && typeof full.specs === 'object') {
                const specs = el('section', 'et-result');
                specs.append(el('h3', '', 'Detailed specifications'));
                const list = el('ul', '');
                Object.entries(full.specs).forEach(([k, v]) => {
                    if (v && v !== 'Unknown') list.append(el('li', '', k.charAt(0).toUpperCase() + k.slice(1) + ': ' + v));
                });
                if (list.children.length) {
                    specs.append(list);
                    output.append(specs);
                }
            }
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
        actions.append(link('Open tech help tracker', 'techhelp.html'), link('Use EcoTekk drop-off finder', 'home.html', true), link('Open preparation checklist', 'checklist.html?case=' + encodeURIComponent(id), true));
        output.append(actions);
        output.append(el('p', 'et-note', 'Troubleshooting steps above are generated on EcoTekk for your selected device type, brand and model. They are practical first-aid guidance, not a substitute for professional repair when hardware damage, liquid exposure or battery swelling is present.'));

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
        if (info.brand && !pageParams.has('brand') && !userTouchedBrand) pendingBrand = info.brand;
        if (info.model && !pageParams.has('model') && !userTouchedModel) {
            addDetectedModelOption(info.brand, info.model, info.device);
            pendingModel = info.model;
        }
        updateBrands();   // applies the detected brand/model only once a category is chosen and the brand fits the device
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
    deviceSelect.addEventListener('change', function () { userTouchedDevice = true; updateBrands(); updateTopics(); });
    categorySelect.addEventListener('change', function () { updateBrands(); updateTopics(); });

    // Category-first: topics remain filtered as the user changes any selection.
    updateBrands();
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
    if (params.has('brand')) pendingBrand = params.get('brand');
    if (params.has('model')) pendingModel = params.get('model');
    updateBrands();
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
