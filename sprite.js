import {Group} from "./group.js";
import PointProxy from "./pointproxy.js";
import screen from "./screen.js";
import image from "./image.js";

const defPoint = [0, 0];
const defScale = [1, 1];

export default function sprite(...args)
{
	return new Sprite(...args);
}

export class Sprite extends Group
{
	constructor(img, pos)
	{
		super();
		
		if(typeof img === "string") {
			img = image(img);
		}
		
		this._renderer = null;
		this._zindex = 0;
		this._pureAnchor = new Float32Array(defPoint);
		this._anchor = new Float32Array(defPoint);
		this._anchorRev = 0;
		this._anchorProxy = new PointProxy(this._pureAnchor, () => this._updateAnchor());
		this._pureScale = new Float32Array(defScale);
		this._pureScaleProxy = new PointProxy(this._pureScale, () => this._updateScale());
		this.img = img;
		
		if(pos) this.pos = pos;
	}
	
	_updateAnchor()
	{
		let a = this._pureAnchor;
		this._anchor[0] = (a[0] * this.img.width - this.img.bbox.x) / this.img.bbox.w;
		this._anchor[1] = (a[1] * this.img.height - this.img.bbox.y) / this.img.bbox.h;
		this._anchorRev ++;
	}
	
	_updateScale()
	{
		this._scale[0] = this._pureScale[0] * this._img.bbox.w;
		this._scale[1] = this._pureScale[1] * this._img.bbox.h;
		this._scaleRev ++;
	}
	
	get zindex()
	{
		return this._zindex;
	}
	
	set zindex(i)
	{
		this._zindex = i;
		
		if(this._renderer) {
			this._renderer.reorder(this);
		}
	}
	
	get img()
	{
		return this._img;
	}
	
	set img(img)
	{
		if(typeof img === "string") {
			img = image(img);
		}
		
		this._img = img;
		
		this._img.ready.then(() => {
			this._updateAnchor();
			this._updateScale();
		});
	}
	
	get anchor()
	{
		return this._anchorProxy;
	}
	
	set anchor(p)
	{
		this._pureAnchor.set(p);
		this._updateAnchor();
	}
	
	get scale()
	{
		return this._pureScaleProxy;
	}
	
	set scale(p)
	{
		this._pureScale.set(p);
		this._updateScale();
	}
	
	get rev()
	{
		return this._posRev + this._anchorRev + this._scaleRev + this._angleRev;
	}
	
	get matrix()
	{
		let m = this._matrix;
		let rev = this.rev;
		
		if(rev > this._matrixRev) {
			let anchor = this._anchor;
			let scalex = this._scale[0];
			let scaley = this._scale[1];
			let angle = this._angle;
			let pos = this._pos;
		    let sinr = Math.sin(angle);
		    let cosr = Math.cos(angle);
		    let c = scalex * anchor[0];
		    let f = scaley * anchor[1];
		    m[0] = scalex * cosr;
		    m[1] = -scaley * sinr;
		    m[2] = -c * cosr + f * sinr + pos[0];
		    m[3] = scalex * sinr;
		    m[4] = scaley * cosr;
		    m[5] = -c * sinr - f * cosr + pos[1];
			this._matrixRev = rev;
		}
		
		return m;
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
}
