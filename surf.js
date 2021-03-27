/*
todo:
~make view adjustable
	~object orientation
	~viewing distance
	~divergence
~make user input be able to be baked into shader
	~in particular an epxression defining the surface
~make user defined variables correspond to uniforms
~fix vertex mesh generation
~fix axial distortion
~distance buffer
*/

const vss = `\
#version 300 es

in vec2 vertParam;
out mediump vec2 surfParam;
out mediump vec3 spaceCoord;
uniform mat4 view;

void main()
{
	vec2 vp = vertParam;
	surfParam = vp;
	//spaceCoord = 0.1*(view*vec4(vp.y*cos(vp.x), vp.x, vp.y*sin(vp.x), 1.0)).xyz;
	spaceCoord = (view*vec4(cos(vp.y)*cos(vp.x), cos(vp.y)*sin(vp.x), sin(vp.y), 1.0)).xyz;
	//spaceCoord = (view*vec4(sin(vp.y)*sin(vp.x), cos(vp.y)*sin(vp.x), cos(vp.x), 1.0)).xyz;
	gl_Position = vec4(spaceCoord, 1.0);
}
`

const fss = `\
#version 300 es

in mediump vec2 surfParam;
in mediump vec3 spaceCoord;
out mediump vec4 fragColor;

void main()
{
	fragColor = vec4(1.0-surfParam.y, surfParam.x, surfParam.y, 1.0);
}
`

var rot = [false, false, false];

function main() {

	const canvas = document.querySelector("#glcanvas");

	var w = canvas.clientWidth;
	var h = canvas.clientHeight;

	canvas.width = w;
	canvas.height = h;

	const gl = canvas.getContext("webgl2");
	
	var hl = -1.5, hu = 3.1;
	var vl = -0.8, vu = 1.5;
	var hres = 31, vres = 15;
	var hdi = (hu - hl)/hres;
	var vdi = (vu - vl)/vres;

	var vertices = [];
	
	var j = 0, k = 0, s = 1;
	while(true)
	{
		while(true)
		{
			vertices.push(hl + j*hdi);
			vertices.push(vl + k*vdi);
			vertices.push(hl + j*hdi);
			vertices.push(vl + (k + 1)*vdi);
			j += s;
			if(j > hres || j < 0) break;
		}
		k += 1;
		if(k >= vres) break;
		s = -s;
		j += s;
	}

	if (gl === null) {
		//alert("webgl initialization failure");
		return;
	}

	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vss);
	gl.compileShader(vs);

	//alert("plum");

	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
		//alert("vertex shader compilation error: " + gl.getShaderInfoLog(vs));
		return;
	}

	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, fss);
	gl.compileShader(fs);

	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
		//alert("fragment shader compilation error: " + gl.getShaderInfoLog(fs));
		return;
	}

	//alert("peach");

	var sp = gl.createProgram();
	gl.attachShader(sp, vs);
	gl.attachShader(sp, fs);
	gl.linkProgram(sp);

	if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
		//alert("program initialization error: " + gl.getProgramInfoLog(sp));
		return null;
	}

	gl.deleteShader(vs);
	gl.deleteShader(fs);

	//alert("pork");
	
	var vertArr = gl.createVertexArray();
	var vertBuf = gl.createBuffer();

	gl.enable(gl.DEPTH_TEST);

	gl.bindVertexArray(vertArr);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.enableVertexAttribArray(0);

	gl.useProgram(sp);
	
	var viewLoc = gl.getUniformLocation(sp, "view");

	var ang = 0;
	var last = 0;
	function render(now) {
		var diti = (last - now)*0.001;
		last = now;
		//var view = [Math.cos(now), Math.sin(now), 0, 0, -Math.sin(now), Math.cos(now), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		if(/*rot[0] == */true) ang += diti;
		var view = [
		1, 0, 0, 0,
		0, Math.cos(ang), -Math.sin(ang), 0,
		0, Math.sin(ang), Math.cos(ang), 0,
		0, 0, 0, 1];
		//var view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		gl.uniformMatrix4fv(viewLoc, gl.TRUE, new Float32Array(view));
		gl.drawArrays(gl.TRIANGLE_STRIP , 0, 2*vres*(hres + 1));

		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);

	//alert("pin");
}

window.onload = main;

function logKeyDown(e)
{
	rot[0] = true;
}

function logKeyUp(e)
{
	rot[0] = false;
}

document.addEventListener('keyup', logKeyUp);
document.addEventListener('keydown', logKeyDown);
