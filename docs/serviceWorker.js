if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker
			.register('serviceWorker.js')
			.then(
				function(registration) {
					// Registration successful.
					console.log('ServiceWorker registration successful with scope: ', registration.scope);
				},
				function(error) {
					// Registration failed.
					console.log('ServiceWorker registration failed: ', error);
				});
		});
}