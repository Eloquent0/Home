const menuButton = document.querySelector('.toggle-btn');
const glowButton = document.querySelector('.glow-btn');
const gear = document.querySelector('.gear');
const menu = document.querySelector('.menu');

function toggleMenu() {
	if (!menu || !gear) return;

	menu.classList.toggle('active');
	gear.classList.toggle('spin');
	document.body.classList.toggle('dark');
}

function glow() {
	document.body.classList.toggle('glow');
}

if (menuButton) {
	menuButton.addEventListener('click', toggleMenu);
}

if (glowButton) {
	glowButton.addEventListener('click', glow);
}
