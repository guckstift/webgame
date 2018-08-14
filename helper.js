export function createShader(gl, vertSrc, fragSrc)
{
	let prog = gl.createProgram();
	let vert = gl.createShader(gl.VERTEX_SHADER);
	let frag = gl.createShader(gl.FRAGMENT_SHADER);
	
	gl.shaderSource(vert, vertSrc);
	gl.shaderSource(frag, fragSrc);
	gl.compileShader(vert);
	gl.compileShader(frag);
	
	if(!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
		throw "Error: Vertex shader compilation failed: " + gl.getShaderInfoLog(vert);
	}
	
	if(!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
		throw "Error: Fragment shader compilation failed: " + gl.getShaderInfoLog(frag);
	}
	
	gl.attachShader(prog, vert);
	gl.attachShader(prog, frag);
	gl.linkProgram(prog);
	
	if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw "Error: Shader program linking failed: " + gl.getProgramInfoLog(prog);
	}
	
	let numAttributes = gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES);
	let numUniforms = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
	
	for(let i=0; i<numAttributes; i++) {
		let info = gl.getActiveAttrib(prog, i);
		let loca = gl.getAttribLocation(prog, info.name);
		prog[info.name] = loca;
	}
	
	for(let i=0; i<numUniforms; i++) {
		let info = gl.getActiveUniform(prog, i);
		let loca = gl.getUniformLocation(prog, info.name);
		prog[info.name] = loca;
	}
	
	return prog;
}
