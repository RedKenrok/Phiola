if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker
			.register('serviceWorker.js')
			.then(
				function(registration) {
					console.log('ServiceWorker registration successful with scope: ', registration.scope);
				},
				function(error) {
					console.log('ServiceWorker registration failed: ', error);
				});
		});
}