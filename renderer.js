import {createShader, getShaderVariables} from "./helper.js";

const spriteBlockSize = 15;
const spriteStartCount = 1024;
const quadVerts = new Float32Array([0,0,1, 0,1,1, 1,0,1, 1,1,1]);

export default class Renderer
{
	constructor(screen)
	{
		let gl = this.gl = screen.gl;
		
		this.glia = gl.getExtension("ANGLE_instanced_arrays");
		this.maxTexUnits = 1;// gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
		this.fragSrc = fragSrcTpl.replace("$maxTexUnits$", this.maxTexUnits);
		this.fragSrc = this.fragSrc.replace("$texColorLoop$", this.getTexColorLoopSrc());
		this.shader = createShader(gl, vertSrc, this.fragSrc);
		this.vars = getShaderVariables(gl, this.shader);
		
		this.drawlist = Array(spriteStartCount);
		this.drawcount = 0;
		this.spriteData = new Float32Array(this.drawlist.length * spriteBlockSize);
		this.spriteBuf = gl.createBuffer();
		this.vertBuf = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.spriteData.length * 4, gl.STREAM_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
		gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
	}
	
	render()
	{
		let gl = this.gl;
		let glia = this.glia;
		let neededSpriteDataLength = this.drawlist.length * spriteBlockSize;
		let spriteDataTake = this.drawcount * spriteBlockSize;
		let textures = [];
		
		if(this.spriteData.length < neededSpriteDataLength) {
			this.spriteData = new Float32Array(neededSpriteDataLength);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
			gl.bufferData(gl.ARRAY_BUFFER, this.spriteData.length * 4, gl.STREAM_DRAW);
		}
		
		for(let i=0; i<this.drawcount; i++) {
			let sprite = this.drawlist[i];
			let offs = i * spriteBlockSize;
			
			let tex = sprite._img.frame.tex;
			let texid = textures.indexOf(tex);
	
			if(texid < 0) {
				texid = textures.length;
				textures.push(tex);
				gl.activeTexture(gl.TEXTURE0 + texid);
				gl.bindTexture(gl.TEXTURE_2D, tex);
			}
			
			this.spriteData.set(sprite.globalMatrix, offs + 0);
			this.spriteData.set(sprite.globalTint, offs + 10);
			this.spriteData.set(sprite._img.frame.texbox, offs + 6);
			this.spriteData[offs + 14] = texid;
		}
		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.spriteData.subarray(0, spriteDataTake));
	
		gl.useProgram(this.shader);
		
		gl.uniform1iv(this.vars.texs, textures);
	
		gl.enableVertexAttribArray(this.vars.vert);
		gl.enableVertexAttribArray(this.vars.tabc);
		gl.enableVertexAttribArray(this.vars.tdef);
		gl.enableVertexAttribArray(this.vars.texbox);
		gl.enableVertexAttribArray(this.vars.tint);
		gl.enableVertexAttribArray(this.vars.texid);
		
		glia.vertexAttribDivisorANGLE(this.vars.vert,   0);
		glia.vertexAttribDivisorANGLE(this.vars.tabc,   1);
		glia.vertexAttribDivisorANGLE(this.vars.tdef,   1);
		glia.vertexAttribDivisorANGLE(this.vars.texbox, 1);
		glia.vertexAttribDivisorANGLE(this.vars.tint,   1);
		glia.vertexAttribDivisorANGLE(this.vars.texid,  1);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
		gl.vertexAttribPointer(this.vars.vert, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
		gl.vertexAttribPointer(this.vars.tabc,   3, gl.FLOAT, false, 4 * spriteBlockSize, 4 *  0);
		gl.vertexAttribPointer(this.vars.tdef,   3, gl.FLOAT, false, 4 * spriteBlockSize, 4 *  3);
		gl.vertexAttribPointer(this.vars.texbox, 4, gl.FLOAT, false, 4 * spriteBlockSize, 4 *  6);
		gl.vertexAttribPointer(this.vars.tint,   4, gl.FLOAT, false, 4 * spriteBlockSize, 4 * 10);
		gl.vertexAttribPointer(this.vars.texid,  1, gl.FLOAT, false, 4 * spriteBlockSize, 4 * 14);
		
		glia.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, this.drawcount);
	}
	
	getTexColorLoopSrc()
	{
		return `
			for(float i = 0.0; i < ${this.maxTexUnits}.0; i++) {
				if(i == vtexid) {
					gl_FragColor = texture2D(texs[int(i)], texcoord);
					break;
				}
			}
		`;
		
		/*
		let res = "";
		
		for(let i=0; i<this.maxTexUnits; i++) {
			if(i > 0) {
				res += "else ";
			}
			
			res += `if(vtexid == ${i}.0) {gl_FragColor = texture2D(texs[${i}], texcoord);}`
			res += "\n";
		}
		
		return res;
		*/
	}
	
	show(sprite)
	{
		if(sprite._renderer !== this) {
			if(this.drawcount === this.drawlist.length) {
				this.drawlist.length *= 2;
			}
			
			sprite._renderer = this;
			this.drawlist[this.drawcount] = sprite;
			this.drawcount ++;
			this.reorder(sprite);
		}
	}
	
	hide(sprite)
	{
		if(sprite._renderer === this) {
			sprite._renderer = null;
			let index = this.drawlist.indexOf(sprite);
			this.drawlist[index] = this.drawlist[this.drawcount - 1];
			this.drawcount --;
			this._reorderAt(sprite, index);
		}
	}
	
	_reorderAt(sprite, index)
	{
		while(index > 0) {
			let prev = this.drawlist[index - 1];
			
			if(prev._zindex > sprite._zindex) {
				this.drawlist[index - 1] = sprite;
				this.drawlist[index] = prev;
				index --;
			}
			else {
				break;
			}
		}
		
		while(index < this.drawcount - 1) {
			let next = this.drawlist[index + 1];
			
			if(next._zindex < sprite._zindex) {
				this.drawlist[index + 1] = sprite;
				this.drawlist[index] = next;
				index ++;
			}
			else {
				break;
			}
		}
	}
	
	reorder(sprite)
	{
		this._reorderAt(sprite, this.drawlist.indexOf(sprite));
	}
}

const vertSrc = `
	precision highp float;
	
	attribute vec3 vert;
	attribute vec3 tabc;
	attribute vec3 tdef;
	attribute vec4 texbox;
	attribute vec4 tint;
	attribute float texid;

	varying vec2 texcoord;
	varying vec4 vtint;
	varying float vtexid;

	void main()
	{
		gl_Position = vec4(dot(tabc, vert), dot(tdef, vert), 0, 1);
		texcoord = texbox.xy + vert.xy * texbox.zw;
		vtint = tint;
		vtexid = texid;
	}
`;

const fragSrcTpl = `
	precision highp float;
	
	uniform sampler2D texs[$maxTexUnits$];
	
	varying vec2 texcoord;
	varying vec4 vtint;
	varying float vtexid;

	void main()
	{
		$texColorLoop$
		
		gl_FragColor *= vtint;
	}
`;
