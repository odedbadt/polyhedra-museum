function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function load_model(model_url, callback) {
  const xhr = new XMLHttpRequest();

  // Configure it: GET-request to the URL /example/data
  xhr.open('GET', model_url+ '#'+Date.now(), true);

  // Setup a function to handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // Parse the JSON response
      var model = JSON.parse(xhr.responseText);
      // Log or use the response data
      console.log(model);
      callback(model);
    }
  };

  // Send the request
  xhr.send();
}

function load_image(image_url, callback) {
  // Load an image and use it as a texture
  var img = new Image();
  img.src = image_url; // Replace with the path to your image

  img.onload = function () {
    callback(img)
  };
}

function create_vertex_buffer(gl, vertices) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW
  );
  return vertexBuffer;
}

function create_color_buffer(gl, colors) {
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  return colorBuffer;
}

function create_normal_buffer(gl, normals) {
  if (!normals) {
    return null;
  }
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  return normalBuffer;
}

function create_texture_buffer(gl, textureCoords) {
  if (!textureCoords) {
    return null;
  }
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  return textureCoordBuffer;
}

function compile_vertex_shader(gl) {
  const vsSource = `
  attribute vec4 aVertexColor;
  attribute vec3 aVertexPosition;
  attribute vec3 aNormalDirection;
  attribute vec2 aTextureCoord;
  varying vec2 vTextureCoord;
  varying float fBrightness;

  varying lowp vec4 vColor;
  uniform float alpha;
  vec3 lightDirection = vec3(1.0,1.0,1.0);

  mat3 rotator_base = mat3(
    1.0,0.0,0.0,
    0.0,cos(-radians(45.0)),-sin(-radians(45.0)), 
    0.0,sin(-radians(45.0)),cos(-radians(45.0))
    
    );

  mat3 rotator_alpha = mat3(
    cos((alpha)),0.0,-sin((alpha)),
    0.0,1.0,0.0,
    sin((alpha)),0.0,cos((alpha))
    );
  mat3 rotator = rotator_alpha*rotator_base;

  void main(void) {
  
    vec3 after_rotation = rotator * aVertexPosition/ 2.0;
    vec3 normal_after_rotation = rotator * aNormalDirection;
    gl_Position = vec4(after_rotation, after_rotation[2]/10.0+1.0);

    vColor = (0.5+dot(normalize(normal_after_rotation), lightDirection)*0.1)*aVertexColor;
    vTextureCoord = aTextureCoord;
    fBrightness = (0.5+dot(normalize(normal_after_rotation), lightDirection)*0.5);

  }
`;
// -1 => 0.9
// 1  => 1.1
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      "Vertex shader compilation failed: " +
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }

  return vertexShader;
}
function compile_fragment_shader(gl) {
  const fsSource = `
  precision mediump float;
  varying vec2 vTextureCoord;
  varying float fBrightness;
  uniform sampler2D uTexture;

  void main(void) {
    gl_FragColor = (fBrightness)*texture2D(uTexture, vTextureCoord);
  }
`;

// Create shaders
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
console.error(
  "Fragment shader compilation failed: " +
  gl.getShaderInfoLog(fragmentShader)
);
return;
}
return fragmentShader;
}
function link_shaders(gl, vertexShader, fragmentShader) {
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program: " +
      gl.getProgramInfoLog(shaderProgram)
    );
    return;
  }
  const alpha_uniform = gl.getUniformLocation(shaderProgram, "rotator");
  gl.useProgram(shaderProgram);
  gl.useProgram(shaderProgram);
  return shaderProgram;

}
function build_shaders(gl) {
  // Vertex shader source code
  const vertexShader = compile_vertex_shader(gl);
  const fragmentShader = compile_fragment_shader(gl);
  return link_shaders(gl, vertexShader, fragmentShader);

  // Fragment shader source code
  


}
function bind_data_to_shaders(gl, shaderProgram, vertexBuffer, colorBuffer, normalBuffer,textureCoordBuffer) {
  const vertexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(vertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
  // Bind vertex color attribute
  const vertexColorPosition = gl.getAttribLocation(shaderProgram, "aVertexColor");
  var textureLocation = gl.getUniformLocation(shaderProgram, "uTexture");

  gl.uniform1i(textureLocation, 0); // Set the texture unit to 0

  gl.enableVertexAttribArray(vertexColorPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(vertexColorPosition, 4, gl.FLOAT, false, 0, 0);

  if (normalBuffer) {
    const normalPosition = gl.getAttribLocation(
      shaderProgram,
      "aNormalDirection"
    );
    gl.enableVertexAttribArray(normalPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(normalPosition, 3, gl.FLOAT, false, 0, 0);
  }


  if (textureCoordBuffer) {
    const textureCoordPosition = gl.getAttribLocation(
      shaderProgram,
      "aTextureCoord"
    );
    gl.enableVertexAttribArray(textureCoordPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.vertexAttribPointer(textureCoordPosition, 2, gl.FLOAT, false, 0, 0);
  }
}
function initGL(gl, mesh) {

  // Define cube vertices and colors
  console.log('building', mesh.vertices.length)

  const shaderProgram = build_shaders(gl);


  console.log('binding', mesh.vertices.length)
  const vertexBuffer = create_vertex_buffer(gl, mesh.vertices)
  const colorBuffer = create_color_buffer(gl, mesh.colors)
  const normalBuffer = create_normal_buffer(gl, mesh.normals)
  const textureCoordBuffer = create_texture_buffer(gl, mesh.texture)
  bind_data_to_shaders(gl, shaderProgram, vertexBuffer, colorBuffer, normalBuffer, textureCoordBuffer);
  gl.disable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST);

  return shaderProgram

  // Bind vertex position attribute

}
function add_to_random_texture() {
  const texture_canvas = document.getElementById("textureCanvas");
  const context = texture_canvas.getContext('2d');
  // const colors = [
  //   'red', 'green' ,'blue', 'yellow', 'magenta',
  //   'purple', 'cyan', 'orange', 'pink'
  // ];
  // for (i = 0; i < 10; ++i) {
  //   const x = Math.random()*100;
  //   const y = Math.random()*100;
  //   context.beginPath();
  //   context.fillStyle = colors[Math.floor(Math.random()*colors.length)];
  //   context.moveTo(x,y);
  //   context.arc(x,y,2,0,Math.PI*2)
  //   context.fill();
  // }
  return context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);
}
function init_palette() {
  const palette_canvas = document.getElementById("paletteCanvas");
  const palette_context = palette_canvas.getContext('2d');
  var img = new Image();
  img.src = "palette.png"; // Replace with the path to your image
  img.onload =  () => {
    palette_context.drawImage(img, 0, 0, 25, 100, 0, 0, 100, 400);
  }


}
function init_and_draw(gl, model, width, height, texture) {

  const shaderProgram = initGL(gl, model);

  if (isPowerOf2(width) && isPowerOf2(height)) {
    // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set
    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  // Set the clear color and clear the canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the program and draw the triangle
  gl.useProgram(shaderProgram);
  gl.drawArrays(gl.TRIANGLES, 0, model.vertices.length / 3 /* divide by number of coordinates per vertex */);

  const alpha_uniform = gl.getUniformLocation(shaderProgram, 'alpha')
  // Draw the cube
  var alpha = 0;
  const texture_canvas = document.getElementById("textureCanvas");
  const texture_context = texture_canvas.getContext('2d');
  
  function _draw() {

    var imageData = texture_context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imageData
    ); 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    gl.uniform1f(alpha_uniform, alpha);
    gl.drawArrays(gl.TRIANGLES, 0, model.vertices.length / 3 /* divide by number of coordinates per vertex */);
        
  }
  //_draw();
  init_palette();
  const gl_canvas = document.getElementById("webglCanvas");

  var is_on = true
  function _alhpa_go_draw() {
    alpha = alpha + .1;
    _draw()


  }
  var interval_id = setInterval(_alhpa_go_draw, 100)
  gl_canvas.onclick = () => {
    console.log('C');
    is_on = !is_on;
    if (is_on) {
      interval_id = setInterval(_alhpa_go_draw, 100)
    } else {
      clearInterval(interval_id);
    }
  }
  texture_context.lineWidth = 5;
  texture_context.fillStyle = "black";
  texture_context.fillRect(0,0,400,400);
  texture_context.fillStyle = "white";
  texture_context.beginPath();
  texture_context.moveTo(400,0);
  texture_context.lineTo(0, 400);
  texture_context.lineTo(400, 400);
  texture_context.closePath();
  texture_context.fill();      
  texture_context.strokeStyle = "white";
  texture_context.lineWidth = 2;
  texture_context.beginPath();
  texture_context.arc(0,0,20,0,Math.PI*2)
  texture_context.stroke();
  texture_context.beginPath();
  texture_context.arc(400,0,20,0,Math.PI*2)
  texture_context.stroke();  
  texture_context.beginPath();
  texture_context.arc(0,400,20,0,Math.PI*2)
  texture_context.stroke();  


  texture_context.beginPath();
  texture_context.strokeStyle = "white";
  texture_context.moveTo(400,0);
  texture_context.lineTo(0,400);
  texture_context.stroke();      
  var pen_color = "white"

  texture_canvas.onmousedown = (event) => {
    if (event.buttons) {
      var x = event.offsetX;
      var y = event.offsetY;
      texture_context.beginPath();
      texture_context.fillStyle = "white";
      texture_context.strokeStyle = pen_color;
      texture_context.lineWidth = 5;
      texture_context.moveTo(x,y);
      _draw();
    }
  }  
  texture_canvas.onmousemove = (event) => {
    if (event.buttons) {
      var x = event.offsetX;
      var y = event.offsetY;
      texture_context.fillStyle = pen_color;
      texture_context.lineTo(x,y);
      texture_context.stroke();      
    }
  }
  texture_canvas.onmouseup = (event) => {
    if (event.buttons) {
      var x = event.offsetX;
      var y = event.offsetY;
      texture_context.fillStyle = pen_color;
      texture_context.stroke();      
    }
  }  
  const palette_canvas = document.getElementById("paletteCanvas");
  const palette_context = palette_canvas.getContext('2d');
  palette_canvas.onclick = (event) => {
    const color = palette_context.getImageData(event.offsetX, event.offsetY, 1, 1).data; 
    pen_color = `rgb(${color[0]},${color[1]},${color[2]})`;
    console.log(pen_color);
  }



};
function ignite(url) {
  const canvas = document.getElementById("webglCanvas");  
  const gl = canvas.getContext("webgl");
  const texture_canvas = document.getElementById("textureCanvas");

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  load_model(url, (model) => init_and_draw(
      gl, model, texture_canvas.width, texture_canvas.height, texture));
};
