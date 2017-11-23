const version = 'nl.rondekker.phiola-v0';
const cacheURLs = [
	// Pages
	'/',
	// Scripts
	'/serviceWorker.js',
	'/scripts/navigation.js',
		// Project
		'/scripts/project/gyroscope.js',
		'/scripts/project/bluetooth.js',
		'/scripts/project/math.js',
		'/scripts/project/phiola.js',
		'/scripts/project/synthesizer.js',
		// Project libs
		'/scripts/project/flocking.min.js',
		'/scripts/project/fulltilt.min.js',
		'/scripts/project/gyronorm.min.js',
	// Styles
	'/styles/flexboxgrid2.min.css',
	'/styles/space.css',
	'/styles/custom.css',
	// Miscellaneous
	'/manifest.json',
	// External
		// Scripts
		'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
		// Styles
		'https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css',
		// Font
		'https://fonts.googleapis.com/css?family=Open+Sans',
		'https://fonts.gstatic.com/s/opensans/v15/cJZKeOuBrn4kERxqtaUH3VtXRa8TVwTICgirnJhmVJw.woff2',
		// Font icon
		'https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/css/material-design-iconic-font.min.css',
		'https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/fonts/Material-Design-Iconic-Font.woff2?v=2.2.0',
];
const networkFist = [
	'www.google-analytics.com'
];

// Cache on install.
self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(version).then(function(cache) {
			return cache.addAll(cacheURLs);
		})
	);
});

self.addEventListener('fetch', function(event) {
	let requestURL = new URL(event.request.url);
	// If host name is empty or part of network first list do not retrieve from cache fetch from network instead.
	if (requestURL.host === '' || networkFist.indexOf(requestURL.host) >= 0) {
		event.respondWith(fetch(event.request));
		return;
	}
	// Respond with matching cached item.
	event.respondWith(
		caches.match(event.request)
			.then(function(response) {
				return response || caches.open(version)
					.then(function(cache) {
						return fetch(event.request).then(function(requestResponse) {
							cache.put(event.request, requestResponse.clone());
							return requestResponse;
						});
					});
			})
			// If request not in cached, and no network connection go to fallback.
			.catch(function() {
				console.error('Request not cached, and no network connection.');
				return caches.match('/');
			})
	);
});

// On activation.
self.addEventListener('activate', function(event) {
	// Remove old cache.
	event.waitUntil(
		caches.keys()
			.then(function(keyList) {
				return Promise.all(keyList.map(function(key){
					if (version !== key) {
						return caches.delete(key);
					}
				}));
			})
	);
});