'use strict';
$(document).ready(function() {
	// Get the navigation bars height to offset with.
	const offset = $('.navigation > .content').height() - 1;
	// For each heading link.
	$('a[href*="#"]:not([href="#"]):not([href="#show"]):not([href="#hide"])').on('click', function(event) {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			// Get target of the link.
			let target = $(this.hash);
			target = (target.length ? target : $('[name=' + this.hash.slice(1) +']'));
			if (target.length) {
				// Cancel standard link click.
				event.preventDefault();
				// Bound the maximum target y by the document size minus the window size.
				let targetY = target.offset().top - offset,
					documentHeight = $(document).height(),
					windowHeight = $(window).height();
				if (targetY + windowHeight > documentHeight) {
					targetY = documentHeight - windowHeight;
				}
				// Apply scroll animation.
				$('html,body').animate({ scrollTop: targetY }, 5e2);
			}
		}
	});
});
