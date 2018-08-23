import PointProxy from "./pointproxy.js";

const defPoint = [0, 0];
const defScale = [1, 1];
const defMatrix = [1, 0, 0, 0, 1, 0];
const defTint = [1, 1, 1, 1];

export default function group(...args)
{
	return new Group(...args);
}

export class Group
{
	constructor(_rootGroup = false)
	{
		this._parent = _rootGroup ? null : screenGroup;
		this._children = [];
		this._tint = new Float32Array(defTint);
		this._pos = new Float32Array(defPoint);
		this._scale = new Float32Array(defScale);
		this._matrix = new Float32Array(defMatrix);
		this._globalMatrix = new Float32Array(defMatrix);
		this._globalTint = new Float32Array(defTint);
		this._angle = 0;
		this._tintRev = 0;
		this._posRev = 0;
		this._scaleRev = 0;
		this._angleRev = 0;
		this._matrixRev = 0;
		this._globalMatrixRev = 0;
		this._globalTintRev = 0;
		this._tintProxy = new PointProxy(this._tint, () => this._tintRev ++);
		this._posProxy = new PointProxy(this._pos, () => this._posRev ++);
		this._scaleProxy = new PointProxy(this._scale, () => this._scaleRev ++);
	}
	
	add(child)
	{
		if(this._children.indexOf(child) === -1) {
			if(child._parent) {
				child._parent.remove(child);
			}
			
			this._children.push(child);
			child._parent = this;
			child._globalMatrixRev = 0;
			child._globalTintRev = 0;
		}
		
		return this;
	}
	
	remove(child)
	{
		child = this._children.indexOf(child)
		
		if(child > -1) {
			this._children.splice(child, 1);
			child._parent = null;
			child._globalMatrixRev = 0;
			child._globalTintRev = 0;
		}
		
		return this;
	}
	
	get parent()
	{
		return this._parent;
	}
	
	set parent(parent)
	{
		if(this._parent) {
			this._parent.remove(this);
		}
		
		this._parent = parent;
		this._globalMatrixRev = 0;
		this._globalTintRev = 0;
	}
	
	get tint()
	{
		return this._tintProxy;
	}
	
	set tint(tint)
	{
		this._tint.set(tint);
		this._tintRev ++;
	}
	
	get pos()
	{
		return this._posProxy;
	}
	
	set pos(p)
	{
		this._pos.set(p);
		this._posRev ++;
	}
	
	get scale()
	{
		return this._scaleProxy;
	}
	
	set scale(p)
	{
		this._scale.set(p);
		this._scaleRev ++;
	}
	
	get angle()
	{
		return this._angle;
	}
	
	set angle(a)
	{
		this._angle = a;
		this._angleRev ++;
	}
	
	get rev()
	{
		return this._posRev + this._scaleRev + this._angleRev;
	}
	
	get globalRev()
	{
		return this.rev + (this._parent ? this._parent.globalRev : 0);
	}
	
	get globalTintRev()
	{
		return this._tintRev + (this._parent ? this._parent.globalTintRev : 0);
	}
	
	get matrix()
	{
		let m = this._matrix;
		let rev = this.rev;
		
		if(rev > this._matrixRev) {
			let scalex = this._scale[0];
			let scaley = this._scale[1];
			let angle = this._angle;
			let pos = this._pos;
		    let sinr = Math.sin(angle);
		    let cosr = Math.cos(angle);
		    m[0] = scalex * cosr;
		    m[1] = -scaley * sinr;
		    m[2] = pos[0];
		    m[3] = scalex * sinr;
		    m[4] = scaley * cosr;
		    m[5] = pos[1];
			this._matrixRev = rev;
		}
		
		return m;
	}
	
	get globalMatrix()
	{
		let globalRev = this.globalRev;
		
		if(this._parent) {
			if(globalRev > this._globalMatrixRev) {
				let m = this.matrix;
				let p = this._parent.globalMatrix;
				let g = this._globalMatrix;
				g[0] = m[0] * p[0] + m[3] * p[1];
				g[1] = m[1] * p[0] + m[4] * p[1];
				g[2] = m[2] * p[0] + m[5] * p[1] + p[2];
				g[3] = m[0] * p[3] + m[3] * p[4];
				g[4] = m[1] * p[3] + m[4] * p[4];
				g[5] = m[2] * p[3] + m[5] * p[4] + p[5];
				this._globalMatrixRev = globalRev;
			}
			
			return this._globalMatrix;
		}
		else {
			return this.matrix;
		}
	}
	
	get globalTint()
	{
		let globalTintRev = this.globalTintRev;
		
		if(this._parent) {
			if(globalTintRev > this._globalTintRev) {
				let t = this._tint;
				let p = this._parent.globalTint;
				let g = this._globalTint;
				g[0] = t[0] * p[0];
				g[1] = t[1] * p[1];
				g[2] = t[2] * p[2];
				g[3] = t[3] * p[3];
				this._globalTintRev = globalTintRev;
			}
			
			return this._globalTint;
		}
		else {
			return this._tint;
		}
	}
}

export const screenGroup = new Group(true);

screenGroup.pos.x = -1;
screenGroup.pos.y = 1;
