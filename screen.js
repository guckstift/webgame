import {createGl} from "./helper.js";
import {screenGroup} from "./group.js";
import Renderer from "./renderer.js";
import event from "./event.js";

export class Screen
{
	constructor()
	{
		this.gl = createGl({alpha: false, antialias: false});
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.clearColor(0, 0, 0, 0);
		this.gl.enable(this.gl.BLEND);
		
		this.canvas = this.gl.canvas;
		this.canvas.style.position = "fixed";
		this.canvas.style.left = "0";
		this.canvas.style.top = "0";
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		
		this.renderer = new Renderer(this);
		
		this.onResize = this.onResize.bind(this);
		this.onFrame = this.onFrame.bind(this);
		this.onResize();
		
		window.addEventListener("resize", this.onResize);
		window.document.body.appendChild(this.canvas);
		window.requestAnimationFrame(this.onFrame);
	}
	
	get size()
	{
		return [this.canvas.width, this.canvas.height];
	}
	
	set bgcolor(rgb)
	{
		this.gl.clearColor(...rgb, 1);
	}
	
	show(sprite)
	{
		this.renderer.show(sprite);
	}
	
	hide(sprite)
	{
		this.renderer.hide(sprite);
	}
	
	onResize()
	{
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		screenGroup.scale.x = 2 / this.canvas.width;
		screenGroup.scale.y = -2 / this.canvas.height;
	}
	
	onFrame(now)
	{
		window.requestAnimationFrame(this.onFrame);
		
		this.last = this.last || now;
		this.delta = now - this.last;
		this.last = now;
		
		event.triggerFrame(this.delta);
		
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.renderer.render();
	}
}

export default new Screen();
