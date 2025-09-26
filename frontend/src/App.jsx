import MeshGradient from 'mesh-gradient.js';
import { useEffect } from 'react';

function App() {
	const params = new URLSearchParams(window.location.search);

	const colors = params.get('colors');
	const [width, height] = params.get('dimensions').split('x');

	const gradient = new MeshGradient();
	const canvasId = 'my-canvas';
	const COLORS = colors ? colors.split(',').map((c) => '#' + c) : ['#295C96', '#D0CBC7', '#899FB6'];

	useEffect(() => {
		gradient.initGradient('#' + canvasId, COLORS);
		gradient.setCanvasSize(width, height);

		const value = Math.floor(Math.random() * 1000);
		gradient.changePosition(value);
	}, []);

	return (
		<div className="App">
			<canvas id={canvasId} />
		</div>
	);
}

export default App;
