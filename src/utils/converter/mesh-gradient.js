import createContext from 'gl';
import sharp from 'sharp';

import { color as colorFn, loggers } from '../modules/index.js';

let glWarningShown = false;

function createSvgFallback(colors, width, height) {
	let defs = '';
	let rects = '';

	colors.forEach((c, i) => {
		const id = `g${i}`;
		const cx = (25 + (i * 50) / colors.length) % 100;
		const cy = (30 + (i * 40) / colors.length) % 100;
		const r = 40 + (i * 10) % 30;

		defs += `<radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="${r}%"><stop offset="0%" stop-color="${c}" stop-opacity="1"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
		rects += `<rect width="100%" height="100%" fill="url(#${id})"/>`;
	});

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${defs}</defs><rect width="100%" height="100%" fill="${colors[0]}"/>${rects}</svg>`;

	return sharp(Buffer.from(svg)).png().toBuffer();
}

function hexToNormalized(hex) {
	hex = hex.replace('#', '');

	if (hex.length === 3) {
		hex = hex.split('').map((c) => c + c).join('');
	}

	const n = parseInt(hex, 16);

	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (255 & n) / 255];
}

const VERT = `
precision highp float;
attribute vec2 a_position;
attribute vec2 a_uv;
varying vec3 v_color;

uniform float u_time;
uniform float u_seed;
uniform vec3 u_baseColor;

uniform vec3 u_layer0_color;
uniform vec2 u_layer0_noiseFreq;
uniform float u_layer0_noiseSpeed;
uniform float u_layer0_noiseSeed;
uniform float u_layer0_noiseFloor;
uniform float u_layer0_noiseCeil;

uniform vec3 u_layer1_color;
uniform vec2 u_layer1_noiseFreq;
uniform float u_layer1_noiseSpeed;
uniform float u_layer1_noiseSeed;
uniform float u_layer1_noiseFloor;
uniform float u_layer1_noiseCeil;

uniform vec3 u_layer2_color;
uniform vec2 u_layer2_noiseFreq;
uniform float u_layer2_noiseSpeed;
uniform float u_layer2_noiseSeed;
uniform float u_layer2_noiseFloor;
uniform float u_layer2_noiseCeil;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity){
  return blend*opacity+base*(1.0-opacity);
}

void main(){
  float time = u_time * 5e-6;
  vec2 noiseCoord = a_uv * vec2(0.14, 0.29);

  v_color = u_baseColor;

  float n0 = smoothstep(u_layer0_noiseFloor, u_layer0_noiseCeil,
    snoise(vec3(noiseCoord.x * u_layer0_noiseFreq.x + time * 6.5, noiseCoord.y * u_layer0_noiseFreq.y, time * u_layer0_noiseSpeed + u_layer0_noiseSeed)) / 2.0 + 0.5);
  v_color = blendNormal(v_color, u_layer0_color, pow(n0, 4.0));

  float n1 = smoothstep(u_layer1_noiseFloor, u_layer1_noiseCeil,
    snoise(vec3(noiseCoord.x * u_layer1_noiseFreq.x + time * 6.8, noiseCoord.y * u_layer1_noiseFreq.y, time * u_layer1_noiseSpeed + u_layer1_noiseSeed)) / 2.0 + 0.5);
  v_color = blendNormal(v_color, u_layer1_color, pow(n1, 4.0));

  float n2 = smoothstep(u_layer2_noiseFloor, u_layer2_noiseCeil,
    snoise(vec3(noiseCoord.x * u_layer2_noiseFreq.x + time * 7.1, noiseCoord.y * u_layer2_noiseFreq.y, time * u_layer2_noiseSpeed + u_layer2_noiseSeed)) / 2.0 + 0.5);
  v_color = blendNormal(v_color, u_layer2_color, pow(n2, 4.0));

  float vertNoise = snoise(vec3(
    a_uv.x * 3.0 + time * 3.0,
    a_uv.y * 4.0,
    time * 10.0 + u_seed
  )) * 0.4;
  vertNoise *= 1.0 - pow(abs(a_uv.y * 2.0 - 1.0), 2.0);
  vertNoise = max(0.0, vertNoise);

  vec2 pos = a_position;
  pos.y += vertNoise * 0.3;

  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec3 v_color;
void main(){
  gl_FragColor = vec4(v_color, 1.0);
}
`;

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader));
	}

	return shader;
}

export async function createMeshGradient({ colors, width = 800, height = 600, seed = 42 }) {
	const gl = createContext(width, height, { preserveDrawingBuffer: true });

	if (!gl) {
		if (!glWarningShown) {
			glWarningShown = true;
			loggers.warning(
				colorFn('WebGL context creation failed (no GPU/OpenGL available). Using SVG fallback.', 'yellow') +
				'\n  To fix: run with xvfb + software rendering. See doc/INSTALL.md or use:\n' +
				'  LIBGL_ALWAYS_SOFTWARE=1 xvfb-run -a -s "-screen 0 1024x768x24 +extension GLX" node .'
			);
		}

		return createSvgFallback(colors, width, height);
	}

	const rgbColors = colors.map(hexToNormalized);
	const baseColor = rgbColors[0];
	const layerColors = rgbColors.slice(1, 4);

	while (layerColors.length < 3) {
		layerColors.push(rgbColors[layerColors.length % rgbColors.length]);
	}

	const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
	const fsShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
	const program = gl.createProgram();

	gl.attachShader(program, vs);
	gl.attachShader(program, fsShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(program));
	}

	gl.useProgram(program);

	const xSegCount = Math.ceil(Math.min(width, 1024) * 0.06);
	const ySegCount = Math.ceil(Math.min(height, 600) * 0.16);
	const vertCount = (xSegCount + 1) * (ySegCount + 1);
	const indexCount = xSegCount * ySegCount * 6;

	const positions = new Float32Array(vertCount * 4);

	for (let y = 0; y <= ySegCount; y++) {
		for (let x = 0; x <= xSegCount; x++) {
			const i = (y * (xSegCount + 1) + x) * 4;

			positions[i] = (x / xSegCount) * 2 - 1;
			positions[i + 1] = (y / ySegCount) * 2 - 1;
			positions[i + 2] = x / xSegCount;
			positions[i + 3] = y / ySegCount;
		}
	}

	const indices = new Uint16Array(indexCount);
	let idx = 0;

	for (let y = 0; y < ySegCount; y++) {
		for (let x = 0; x < xSegCount; x++) {
			const tl = y * (xSegCount + 1) + x;
			const tr = tl + 1;
			const bl = tl + (xSegCount + 1);
			const br = bl + 1;

			indices[idx++] = tl;
			indices[idx++] = bl;
			indices[idx++] = tr;
			indices[idx++] = tr;
			indices[idx++] = bl;
			indices[idx++] = br;
		}
	}

	const vbo = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	const ibo = gl.createBuffer();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	const aPos = gl.getAttribLocation(program, 'a_position');

	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

	const aUv = gl.getAttribLocation(program, 'a_uv');

	gl.enableVertexAttribArray(aUv);
	gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

	const timeValue = 1253106 + seed * 1000;

	gl.uniform1f(gl.getUniformLocation(program, 'u_time'), timeValue);
	gl.uniform1f(gl.getUniformLocation(program, 'u_seed'), seed);
	gl.uniform3fv(gl.getUniformLocation(program, 'u_baseColor'), baseColor);

	for (let i = 0; i < 3; i++) {
		const prefix = `u_layer${i}_`;
		const e = i + 1;

		gl.uniform3fv(gl.getUniformLocation(program, `${prefix}color`), layerColors[i]);
		gl.uniform2fv(gl.getUniformLocation(program, `${prefix}noiseFreq`), [2 + e / 4, 3 + e / 4]);
		gl.uniform1f(gl.getUniformLocation(program, `${prefix}noiseSpeed`), 11 + 0.3 * e);
		gl.uniform1f(gl.getUniformLocation(program, `${prefix}noiseSeed`), seed + 10 * e);
		gl.uniform1f(gl.getUniformLocation(program, `${prefix}noiseFloor`), 0.1);
		gl.uniform1f(gl.getUniformLocation(program, `${prefix}noiseCeil`), 0.63 + 0.07 * e);
	}

	gl.viewport(0, 0, width, height);
	gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

	const pixels = new Uint8Array(width * height * 4);

	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.getExtension('STACKGL_destroy_context')?.destroy();

	return sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
		.flip()
		.png()
		.toBuffer();
}
