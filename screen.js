import event from "./event.js";

class Screen
{
	constructor()
	{
		this.drawlist = [];
		this.last = 0;
		this.canvas = document.createElement("canvas");
		
		this.gl = this.canvas.getContext("webgl", {
			alpha: false,
			antialias: false,
			depth: true,
		});
		
		let gl = this.gl;

		gl.enable(gl.BLEND);
		gl.clearColor(0, 0, 0, 0);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		addEventListener("resize", () => this.onResize());
		this.onResize();
		
		addEventListener("load", () =>
		{
			document.documentElement.style.height = "100%";
			document.documentElement.style.overflow = "hidden";
			document.body.style.height = "100%";
			document.body.style.margin = "0";
			document.body.appendChild(this.canvas);
			requestAnimationFrame(now => this.onFrame(now));
		});
	}

	onResize()
	{
		this.canvas.width = innerWidth;
		this.canvas.height = innerHeight;
		this.gl.viewport(0, 0, innerWidth, innerHeight);
	}

	onFrame(now)
	{
		this.last = this.last || now;
		let delta = now - this.last;
		this.last = now;
		event.triggerFrame(delta);
	
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.drawlist.forEach(item => item.draw(delta));
	
		requestAnimationFrame(now => this.onFrame(now));
	}
	
	get size()
	{
		return [innerWidth, innerHeight];
	}
	
	set bgcolor(rgb)
	{
		this.gl.clearColor(...rgb, 1);
	}
	
	show(drawable)
	{
		if(!this.drawlist.includes(drawable)) {
			this.drawlist.push(drawable);
			this.reorder(drawable);
		}
	}
	
	hide(drawable)
	{
		if(this.drawlist.includes(drawable)) {
			this.drawlist.splice(this.drawlist.indexOf(drawable), 1);
		}
	}
	
	reorder(drawable)
	{
		let index = this.drawlist.indexOf(drawable);
		
		while(index > 0) {
			let prev = this.drawlist[index - 1];
			
			if(prev.zindex > drawable.zindex) {
				this.drawlist[index - 1] = drawable;
				this.drawlist[index] = prev;
				index --;
			}
			else {
				break;
			}
		}
		
		while(index < this.drawlist.length - 1) {
			let next = this.drawlist[index + 1];
			
			if(next.zindex < drawable.zindex) {
				this.drawlist[index + 1] = drawable;
				this.drawlist[index] = next;
				index ++;
			}
			else {
				break;
			}
		}
	}
}

export default new Screen();
