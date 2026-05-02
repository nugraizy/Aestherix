const ZEN_CURSOR_ENABLED_KEY = 'aestherix.dashboard.cursor.enabled';

const setupZenCursor = () => {
	if (typeof window === 'undefined' || !document?.body) {
		return false;
	}

	if (!window.matchMedia('(pointer: fine)').matches) {
		return false;
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return false;
	}

	const cursor = document.createElement('div');
	const cursorText = document.createElement('div');
	let isCursorVisible = true;

	cursor.id = 'zen-cursor';
	cursor.className = 'zen-cursor rounded blur cursor-normal';
	cursorText.id = 'zen-cursor-text';
	cursorText.className = 'zen-cursor-text';
	document.body.appendChild(cursor);
	document.body.appendChild(cursorText);
	document.documentElement.classList.add('zen-cursor-enabled');
	document.body.classList.add('zen-cursor-enabled');
	document.body.style.cursor = 'none';

	try {
		window.sessionStorage.setItem(ZEN_CURSOR_ENABLED_KEY, '1');
	} catch {
		// Ignore storage errors
	}

	const setCursorVisibility = (isVisible) => {
		if (isCursorVisible === isVisible) {
			return;
		}

		isCursorVisible = isVisible;
		cursor.style.opacity = isVisible ? '1' : '0';

		if (!isVisible) {
			cursorText.style.scale = '0';
		}
	};

	const moveCursor = (event) => {
		const mouseY = event.clientY;
		const mouseX = event.clientX;
		const tooltipGap = 24;

		setCursorVisibility(true);

		cursor.style.translate = `${mouseX}px ${mouseY}px`;

		if (mouseX > window.innerWidth - cursorText.clientWidth - tooltipGap) {
			cursorText.style.left = `${mouseX - cursorText.clientWidth - tooltipGap}px`;
		} else {
			cursorText.style.left = `${mouseX + tooltipGap}px`;
		}

		if (mouseY > window.innerHeight - cursorText.clientHeight - tooltipGap) {
			cursorText.style.top = `${mouseY - cursorText.clientHeight - tooltipGap}px`;
		} else {
			cursorText.style.top = `${mouseY + tooltipGap}px`;
		}
	};

	const handleWindowBlur = () => {
		setCursorVisibility(false);
	};

	const handleWindowFocus = () => {
		if (!document.hidden) {
			setCursorVisibility(true);
		}
	};

	const handleVisibilityChange = () => {
		setCursorVisibility(!document.hidden);
	};

	const handleDocumentMouseOut = (event) => {
		if (!event.relatedTarget && !event.toElement) {
			setCursorVisibility(false);
		}
	};

	const handleDocumentMouseEnter = () => {
		if (!document.hidden && document.hasFocus()) {
			setCursorVisibility(true);
		}
	};

	window.addEventListener('mousemove', moveCursor);
	window.addEventListener('pointermove', moveCursor);
	window.addEventListener('blur', handleWindowBlur);
	window.addEventListener('focus', handleWindowFocus);
	document.addEventListener('visibilitychange', handleVisibilityChange);
	document.addEventListener('mouseout', handleDocumentMouseOut);
	document.addEventListener('mouseenter', handleDocumentMouseEnter);

	window.addEventListener('beforeunload', () => {
		window.removeEventListener('mousemove', moveCursor);
		window.removeEventListener('pointermove', moveCursor);
		window.removeEventListener('blur', handleWindowBlur);
		window.removeEventListener('focus', handleWindowFocus);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('mouseout', handleDocumentMouseOut);
		document.removeEventListener('mouseenter', handleDocumentMouseEnter);
	});

	return true;
};

setupZenCursor();
