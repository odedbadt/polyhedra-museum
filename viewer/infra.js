const VS_SOURCE = `#version 300 es
uniform int numVerts;
in vec4 aVertexColor;
in vec3 aVertexPosition;
in vec3 aNormalDirection;
in vec2 aTextureCoord;
in float aVectorIndex;
out vec2 vTextureCoord;
out float vectorIndex;
out float fBrightness;
out vec4 oVertexColor;

out lowp vec4 vColor;
uniform mat3 rotator;
uniform mat4 projector;
uniform mat4 view;


vec3 lightDirection = vec3(1.0,0.0,1.0);

void main(void) {

  vec4 projected =  projector * vec4(rotator * aVertexPosition, 1.0);
  vec3 normal_after_rotation = rotator * aNormalDirection;
  gl_Position = projected;
  //gl_Position = vec4(aVertexPosition, 1.0);
  oVertexColor = aVertexColor;
  vTextureCoord = aTextureCoord;
  vectorIndex = floor(float(gl_VertexID)/3.0);
  fBrightness = (0.5 +1.8*dot(normalize(normal_after_rotation), normalize(lightDirection))*0.2);
}
`
const FS_SOURCE = `#version 300 es
precision mediump float;
in vec2 vTextureCoord;
in float fBrightness;
in float vectorIndex;
in vec4 oVertexColor;

out vec4 fragColor;
uniform sampler2D uTexture;

void main(void) {
  float fVectorIndex = min(float(vectorIndex),256.0)/256.0;

    fragColor = fBrightness * texture(uTexture, vTextureCoord)* oVertexColor;
  
}
`

const FS_SOURCE2 = `#version 300 es
precision mediump float;
in vec2 vTextureCoord;
in float fBrightness;
uniform sampler2D uTexture;
in float vectorIndex;

out vec4 fragColor;

void main(void) {
  float fVectorIndex = min(vectorIndex,256.0)/256.0;
  fragColor = vec4(fVectorIndex,0.0,1.0,1.0);
  if (vectorIndex <= 256.0) {
     fragColor = vec4(0.0,1.0,0.0,1.0);
  } else {
     fragColor = vec4(0.0,0.0,1.0,1.0);
  }
  //fragColor = vec4(vTextureCoord,1.0,1.0);
  fragColor = vec4(fVectorIndex,fVectorIndex,fVectorIndex,1.0);

}
`
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}
colors = ["red", "blue", "green"]
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

function compile_vertex_shader(gl, vsSource) {
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
function compile_fragment_shader(gl, fsSource) {
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Version: ' + gl.getParameter(gl.VERSION));
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
  gl.useProgram(shaderProgram);
  return shaderProgram;

}
function build_shaders(gl, fSource, vsSource) {
  // Vertex shader source code
  const vertexShader = compile_vertex_shader(gl, fSource);
  const fragmentShader = compile_fragment_shader(gl, vsSource);
  gl.disable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST);
  return link_shaders(gl, vertexShader, fragmentShader);

  // Fragment shader source code
  


}
function bind_data_to_shaders (gl, shaderProgram, vertexBuffer, colorBuffer, normalBuffer,textureCoordBuffer) {
  const vertexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(vertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
  const vertexColorPosition = gl.getAttribLocation(
    shaderProgram, "aVertexColor");
  
  console.log(vertexPosition, vertexColorPosition, gl.getError());

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
  const vectorIndexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVectorIndex"
  );

}
function build_program(gl, model, mipmap, vsSource, fsSource) {

  // Define cube vertices and colors
  console.log('building', model.vertices.length)

  const shaderProgram = build_shaders(gl, vsSource, fsSource);


  console.log('binding', model.vertices.length)
  const vertexBuffer = create_vertex_buffer(gl, model.vertices);
  const colorBuffer = create_color_buffer(gl, model.colors)
  const normalBuffer = create_normal_buffer(gl, model.normals)
  const textureCoordBuffer = create_texture_buffer(gl, model.texture)
  bind_data_to_shaders(gl, shaderProgram, vertexBuffer, 
    colorBuffer, normalBuffer, textureCoordBuffer);
  if (mipmap) {
    // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set
    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  return shaderProgram
}

function init_palette() {
  const palette_canvas = document.getElementById("paletteCanvas");
  const palette_context = palette_canvas.getContext('2d');
  var img = new Image();
  img.src = "palette.png"; // Replace with the path to your image
  img.onload =  () => {
    palette_context.drawImage(img, 0, 0, 25, 200, 0, 0, palette_canvas.height, palette_canvas.width);
  }
}

function bindTextureToProgram(gl, texture, imageData) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    imageData
  );
  return texture;
}
function init_and_draw(model) {
  var viewMatrix = glMatrix.mat4.create();
  glMatrix.mat4.lookAt(viewMatrix, [0,0,6], [0,0,0], [0,1,0]);
  var projectionMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(projectionMatrix, Math.PI / 4, 1, 1, 10.0);
  glMatrix.mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix)
  const texture_canvas = document.getElementById("textureCanvas");  
  const texture_context = texture_canvas.getContext('2d', { willReadFrequently: true });
  const pen_canvas = document.getElementById("penCanvas");  
  const pen_context = pen_canvas.getContext('2d', { willReadFrequently: true });
  const main_canvas = document.getElementById("mainCanvas");  
  const main_gl = main_canvas.getContext("webgl2");
  const main_texture = main_gl.createTexture();

  const imageData = texture_context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);
  bindTextureToProgram(main_gl, main_texture, imageData); 

  main_gl.bindTexture(main_gl.TEXTURE_2D, main_texture);
  const mips = isPowerOf2(texture_canvas.width) && isPowerOf2(texture_canvas.height);
  const main_shader_program = build_program(main_gl, model, mips,
    VS_SOURCE, FS_SOURCE);
    

  const x_axis = [1,0,0];
  const y_axis = [0,1,0];
  const z_axis = [0,0,1];

  const main_rotator_unifom = main_gl.getUniformLocation(main_shader_program, 'rotator');
  var main_projector_location = main_gl.getUniformLocation(main_shader_program, "projector");
  
  main_gl.uniformMatrix4fv(main_projector_location, false, projectionMatrix);
  var pen_radius = 5
  var pen_color = "red"

  init_palette();
  const draw_pen_selector = () => {
    pen_context.clearRect(0,0,600,200)
    pen_context.fillStyle=pen_color
    pen_context.beginPath()
    pen_context.moveTo(0,100)
    pen_context.lineTo(250,100)
    pen_context.lineTo(250,50)
    pen_context.lineTo(0,100)
    pen_context.fill()
    pen_context.ellipse(pen_radius*10,pen_radius+100, pen_radius, pen_radius, 0, 0, Math.PI*2)
    pen_context.fill()
}
  draw_pen_selector()
  pen_canvas.addEventListener("mousemove", (event) => {
    if (event.buttons) {
      const pen_canvas_x = event.clientX - pen_canvas.getBoundingClientRect().left;
      pen_radius = pen_canvas_x/5/2
      pen_context.beginPath()
      draw_pen_selector()
      pen_context.fillStyle=pen_color

    }
  })

  texture_context.fillStyle = "white";
  texture_context.fillRect(0,0,texture_canvas.width,texture_canvas.height);
  texture_context.fill()
  const frame_texture = function() {
    texture_context.lineWidth = 3;
    texture_context.fillStyle = "white";
    texture_context.beginPath();  
    texture_context.moveTo(texture_canvas.width, 0);
    texture_context.lineTo(texture_canvas.width, texture_canvas.height);
    texture_context.lineTo(0, texture_canvas.height);
    texture_context.lineTo(texture_canvas.width, 0);
    texture_context.fill();      

    texture_context.strokeStyle = "blue";
    texture_context.beginPath();  
    texture_context.moveTo(texture_canvas.width, 0);
    texture_context.lineTo(0, texture_canvas.height);
    texture_context.lineTo(0, 0);
    texture_context.lineTo(texture_canvas.width, 0);
    texture_context.stroke();      
  }
  frame_texture()
  
  const texture_canvas_left = texture_canvas.getBoundingClientRect().left;
  const texture_canvas_top = texture_canvas.getBoundingClientRect().top;
  texture_canvas.addEventListener("mousemove", (event) => {
    const canvas_x = event.clientX - texture_canvas_left;
    const canvas_y = event.clientY - texture_canvas_top;
  if (event.buttons) {
    texture_context.strokeStyle = pen_color;
    texture_context.lineWidth = pen_radius;
    texture_context.line_cap = 'round'; 
    texture_context.fillStyle = pen_color;
    texture_context.beginPath();      
    texture_context.ellipse(canvas_x,canvas_y, pen_radius, pen_radius, 0, 0, Math.PI*2)
    texture_context.fill()
    frame_texture()
  }
  });

  const palette_canvas = document.getElementById("paletteCanvas");
  const palette_context = palette_canvas.getContext('2d');
  palette_canvas.onclick = (event) => {
    const color = palette_context.getImageData(event.offsetX, event.offsetY, 1, 1).data; 
    pen_color = `rgb(${color[0]},${color[1]},${color[2]})`;
    console.log(pen_color);
  }
  var is_spinning = true;
  var alpha = 0;
  function _spin_and_draw() {
    alpha = alpha + .1;
    _draw();
  }
  var interval_id = setInterval(_spin_and_draw, 100)
  main_canvas.addEventListener("click", (event) => {
    is_spinning = !is_spinning;
    if (is_spinning) {
      interval_id = setInterval(_spin_and_draw, 100)
    } else if (interval_id) {
      clearInterval(interval_id);
    }
  })

  function _draw() {
    const imageData = texture_context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);
    bindTextureToProgram(main_gl, main_texture, imageData); 
    
    let rotation_matrix_4x4 = glMatrix.mat4.create();
    //glMatrix.mat4.rotate(rotation_matrix_4x4, rotation_matrix_4x4, alpha, y_axis);

    //glMatrix.mat4.rotate(rotation_matrix_4x4, rotation_matrix_4x4, Math.PI/3, x_axis);

    let rotationMatrix3x3 = glMatrix.mat3.create();
    glMatrix.mat3.fromMat4(rotationMatrix3x3, rotation_matrix_4x4);

    main_gl.uniformMatrix3fv(main_rotator_unifom, false, rotationMatrix3x3);
    main_gl.useProgram(main_shader_program);
    main_gl.drawArrays(main_gl.TRIANGLES, 0, 
      model.vertices.length / 3);
  }
};
function locate_url_for_name(model_name) {
  return document.location.href.replace('/viewer/', '/models/'+ model_name)
}
function ignite(model_name) {
  load_model(locate_url_for_name(model_name), (model) => init_and_draw(model));
};
