import screen from "./screen.js";
import {createTexture} from "./helper.js";

let lastPack = undefined;
let packs = [];
let packId = 0;

export default function pack(img)
{
	let bbox = getImgBox(img);
	let frame = {img, bbox};
	let pack = getFreePack();
	let res = pack.packFrame(frame);
	
	if(!res) {
		pack = getFreePack();
		res = pack.packFrame(frame);
	}
	
	if(!res) {
		throw "Image could not be packed!";
	}
	
	return frame;
}

function getFreePack()
{
	if(!lastPack || lastPack.full) {
		lastPack = new Pack();
		packs.push(lastPack);
	}
	
	return lastPack;
}

function getImgPixels(img)
{
	let canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	
	let ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	
	let pixels = ctx.getImageData(0, 0, img.width, img.height);
	
	return pixels.data;
}

function getImgBox(img)
{
	let top = 0, left = 0, found;
	let pixels = getImgPixels(img);
	
	found = false;
	for(let y=0; y < img.height; y++) {
		for(let x=0; x < img.width; x++) {
			let col = pixels.subarray(4 * (y * img.width + x));
			
			if(col[3] > 0) {
				top = y;
				found = true;
				break;
			}
		}
		if(found) {
			break;
		}
	}
	
	found = false;
	for(let x=0; x < img.width; x++) {
		for(let y=top; y < img.height; y++) {
			let col = pixels.subarray(4 * (y * img.width + x));
			
			if(col[3] > 0) {
				left = x;
				found = true;
				break;
			}
		}
		if(found) {
			break;
		}
	}
	
	let width = img.width - left, height = img.height - top;
	
	found = false;
	for(let y = img.height - 1; y >= top; y--) {
		for(let x = left; x < img.width; x++) {
			let col = pixels.subarray(4 * (y * img.width + x));
			
			if(col[3] > 0) {
				height = y + 1 - top;
				found = true;
				break;
			}
		}
		if(found) {
			break;
		}
	}
	
	found = false;
	for(let x = img.width - 1; x >= left; x--) {
		for(let y = top; y < img.height; y++) {
			let col = pixels.subarray(4 * (y * img.width + x));
			
			if(col[3] > 0) {
				width = x + 1 - left;
				found = true;
				break;
			}
		}
		if(found) {
			break;
		}
	}
	
	return {left, top, width, height};
}

class Pack
{
	constructor()
	{
		this.tex = createTexture(screen.gl);
		this.width = 2048;
		this.height = 2048;
		this.extents = Array(this.width).fill(0);
		this.left = 0;
		this.full = false;
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.ctx = this.canvas.getContext("2d");
		this.packId = packId++;
		
		let gl = screen.gl;
		
		gl.bindTexture(gl.TEXTURE_2D, this.tex);
		
		gl.texImage2D(
			gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
		);
	}

	findPos(srcw, srch)
	{
		let destw = this.width;
		let desth = this.height;
		let left = this.left;
		let extents = this.extents;
		
		while(left + srcw <= destw) {
			let top = Math.max(...extents.slice(left, left + srcw));
			
			if(top + srch <= desth) {
				return [left, top];
			}
		
			left += 1;
		}
	
		left = 0;
	
		while(left + srcw <= destw) {
			let top = Math.max(...extents.slice(left, left + srcw));
			
			if(top + srch <= desth) {
				return [left, top];
			}
		
			left += 1;
		}
	}

	packFrame(frame)
	{
		let destw = this.width;
		let desth = this.height;
		let extents = this.extents;
		let width = frame.bbox.width;
		let height = frame.bbox.height;
		let found = this.findPos(width, height);
		let gl = screen.gl;
	
		if(!found) {
			this.full = true;
			return false;
		}
		
		frame.pos = found;
		frame.packId = this.packId;
		extents.fill(found[1] + height, found[0], found[0] + width);
		this.left = found[0] + width;
		
		this.ctx.drawImage(
			frame.img,
			frame.bbox.left, frame.bbox.top, frame.bbox.width, frame.bbox.height,
			frame.pos[0], frame.pos[1], frame.bbox.width, frame.bbox.height
		);
		
		gl.bindTexture(gl.TEXTURE_2D, this.tex);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
		
		return true;
	}
}
