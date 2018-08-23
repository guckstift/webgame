import {loadImage, getImageBox} from "./helper.js";
import screen from "./screen.js";
import packer from "./packer.js";

let imageCache = {};
let zeroTex = screen.gl.createTexture();
let gl = screen.gl;

gl.bindTexture(gl.TEXTURE_2D, zeroTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

export default function image(url)
{
	if(imageCache[url]) {
		return imageCache[url];
	}
	
	return imageCache[url] = new Image(url);
}

class Image
{
	constructor(url)
	{
		this.onLoad = this.onLoad.bind(this);
		this.url = url;
		this.bbox = {x:0, y:0, w:0, h:0};
		this.tmpTexId = -1;
		this.ready = new Promise(res => this.img = loadImage(url, () => this.onLoad(res)));
		
		this.frame = {
			pos: {x:0, y:0},
			texbox: new Float32Array(4),
			tex: zeroTex,
		};
	}
	
	get width()
	{
		return this.img.width;
	}
	
	get height()
	{
		return this.img.height;
	}
	
	onLoad(res)
	{
		this.bbox = getImageBox(this.img);
		this.frame = packer.pack(this);
		res();
	}
}
