import {createTexture} from "./helper.js";
import screen from "./screen.js";
import sprite from "./sprite.js";
import pack from "./packer.js";

let imageCache = {};

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
		this.img = document.createElement("img");
		this.img.src = this.url = url;
		this.stdSprite = sprite(this);
		this.ready = false;
		
		this.img.addEventListener("load", () => {
			let gl = screen.gl;
			this.tex = createTexture(screen.gl);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
			this.ready = true;
			pack(this.img);
		});
	}
	
	get width()
	{
		return this.img.width;
	}
	
	get height()
	{
		return this.img.height;
	}
	
	get size()
	{
		return [this.width, this.height];
	}
	
	show()
	{
		screen.show(this.stdSprite);
	}
	
	hide()
	{
		screen.hide(this.stdSprite);
	}
}
