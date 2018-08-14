class Event
{
	constructor()
	{
		this.clear();
		this.keys = {};
		this.mouse = {left: false, right: false, middle: false, pos: [0, 0]};
		
		addEventListener("keydown", e => {
			let key = e.key;
			if(this.cbs.keydown[key] && !this.keys[key]) {
				this.keys[key] = true;
				this.cbs.keydown[key].forEach(cb => cb({}));
			}
		});
		
		addEventListener("keyup", e => {
			let key = e.key;
			this.keys[key] = false;
			if(this.cbs.keyup[key]) {
				this.cbs.keyup[key].forEach(cb => cb({}));
			}
		});
		
		addEventListener("mousemove", e => {
			this.mouse.pos = [e.clientX, e.clientY];
			this.cbs.mousemove.forEach(cb => cb({pos: this.mouse.pos}));
		});
		
		addEventListener("mousedown", e => {
			this.mouse.pos = [e.clientX, e.clientY];
			let button = ["left", "middle", "right"][e.button];
			this.mouse[button] = true;
			this.cbs.mousedown[button].forEach(cb => cb({pos: this.mouse.pos}));
		});
		
		addEventListener("mouseup", e => {
			this.mouse.pos = [e.clientX, e.clientY];
			let button = ["left", "middle", "right"][e.button];
			this.mouse[button] = false;
			this.cbs.mouseup[button].forEach(cb => cb({pos: this.mouse.pos}));
		});
	}
	
	keydown(key, cb)
	{
		this.cbs.keydown[key] = this.cbs.keydown[key] || [];
		this.cbs.keydown[key].push(cb);
	}
	
	keyup(key, cb)
	{
		this.cbs.keyup[key] = this.cbs.keyup[key] || [];
		this.cbs.keyup[key].push(cb);
	}
	
	mousemove(cb)
	{
		this.cbs.mousemove.push(cb);
	}
	
	mousedown(button, cb)
	{
		this.cbs.mousedown[button].push(cb);
	}
	
	mouseup(button, cb)
	{
		this.cbs.mouseup[button].push(cb);
	}
	
	frame(cb)
	{
		this.cbs.frame.push(cb);
	}
	
	triggerFrame(delta)
	{
		this.cbs.frame.forEach(cb => cb(delta));
	}
	
	clear()
	{
		this.cbs = {
			keydown: {},
			keyup: {},
			mousemove: [],
			mousedown: {
				left: [],
				right: [],
				middle: [],
			},
			mouseup: {
				left: [],
				right: [],
				middle: [],
			},
			frame: [],
		};
	}
}

let event = new Event();

export default event;
