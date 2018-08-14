import {createShader} from "./helper.js";
import screen from "./screen.js";
import image from "./image.js";

let vertSrc = `
	uniform vec2 uScreenSize;
	uniform vec2 uSize;
	uniform vec2 uPos;
	uniform vec2 uScale;
	uniform vec2 uAnchor;
	uniform float uAngle;
	
	attribute vec2 aCoord;
	
	varying vec2 vTexCoord;

	vec2 rotate(vec2 v, float a)
	{
		a *= 3.14159265359 / 180.0;
		
		return vec2(
			v.x * cos(a) - v.y * sin(a),
			v.y * cos(a) + v.x * sin(a)
		);
	}
	
	void main()
	{
		vec2 pos = aCoord;
		
		pos -= uAnchor;
		pos *= uSize;
		pos *= uScale;
		pos = rotate(pos, uAngle);
		pos += uPos;
		pos /= uScreenSize;
		pos *= vec2(2, -2);
		pos += vec2(-1, 1);
		
		gl_Position = vec4(pos, 0, 1);
		
		vTexCoord = aCoord;
	}
`;

let fragSrc = `
	precision highp float;
	
	uniform sampler2D uTex;
	uniform vec2 uSize;
	uniform vec2 uScale;
	uniform bool uEllipse;
	uniform vec4 uTint;
	
	varying vec2 vTexCoord;

	void main()
	{
		gl_FragColor = texture2D(uTex, vTexCoord);
		gl_FragColor *= uTint;
		
		if(uEllipse) {
			float dist = distance(vTexCoord, vec2(0.5));
			vec2 scaleVec = uSize * uScale;
			float scale = (scaleVec.x + scaleVec.y) / 2.0;
		
			gl_FragColor.a *= clamp(0.5 + (1.0 - dist * 2.0) * scale / 2.0, 0.0, 1.0);
		}
	}
`;

let gl = screen.gl;
let prog = createShader(gl, vertSrc, fragSrc);
let buf = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);

class Sprite
{
	constructor(img, pos, anchor)
	{
		this.img = img;
		this.pos = pos || [0, 0];
		this.anchor = anchor || [0, 0];
		this.scale = [1, 1];
		this.angle = 0;
		this.speed = [0, 0];
		this.zindex = 0;
		this.ellipse = false;
		this.tint =  [1, 1, 1, 1];
	}
	
	set img(img)
	{
		if(typeof img === "string") {
			img = image(img);
		}
		
		this._img = img;
	}
	
	get img()
	{
		return this._img;
	}
	
	set zindex(i)
	{
		this._zindex = i;
		screen.reorder(this);
	}
	
	get zindex()
	{
		return this._zindex;
	}
	
	show()
	{
		screen.show(this);
		return this;
	}
	
	hide()
	{
		screen.hide(this);
		return this;
	}
	
	draw(delta)
	{
		if(this.img.ready) {
			let gl = screen.gl;
		
			this.pos[0] += this.speed[0] * delta / 1000.0;
			this.pos[1] += this.speed[1] * delta / 1000.0;
		
			gl.useProgram(prog);
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.enableVertexAttribArray(prog.aCoord);
			gl.vertexAttribPointer(prog.aCoord, 2, gl.FLOAT, false, 0, 0);
			gl.uniform2f(prog.uScreenSize, innerWidth, innerHeight);
			gl.uniform2f(prog.uSize, this.img.width, this.img.height);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.img.tex);
			gl.uniform1i(prog.uTex, 0);
			gl.uniform2fv(prog.uPos, this.pos);
			gl.uniform2fv(prog.uScale, this.scale);
			gl.uniform2fv(prog.uAnchor, this.anchor);
			gl.uniform1f(prog.uAngle, this.angle);
			gl.uniform1i(prog.uEllipse, this.ellipse);
			gl.uniform4fv(prog.uTint, this.tint);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
	}
}

export default function sprite(...args)
{
	return new Sprite(...args);
}
