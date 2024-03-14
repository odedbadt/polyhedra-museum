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


vec3 lightDirection = vec3(-1.0,0.4,-1.0);

void main(void) {

  vec4 projected = projector * vec4(rotator * aVertexPosition, 1.0);

  //vec4 projected = vec4(aVertexPosition, 1.0);
  vec3 normal_after_rotation = rotator * aNormalDirection;
  gl_Position = projected;
  //gl_Position = vec4(aVertexPosition, 1.0);
  oVertexColor = aVertexColor;
  vTextureCoord = aTextureCoord;
  vectorIndex = floor(float(gl_VertexID)/3.0);
  fBrightness = 0.7+0.3*dot(normalize(normal_after_rotation), 
                            normalize(lightDirection));
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
  //fragColor = vec4(1.0,0.0,0.0,1.0);
    fragColor = fBrightness * texture(uTexture, vTextureCoord) * vec4(0.5,0.5,0.5,1.0);
  
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
function bind_data_to_shaders(gl, model, shaderProgram) {
  const vertexBuffer = create_vertex_buffer(gl, model.vertices);
  const normalBuffer = create_normal_buffer(gl, model.normals)
  const textureCoordBuffer = create_texture_buffer(gl, model.texture)

  const vertexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(vertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
  if (model.colors) {
    const colorBuffer = create_color_buffer(gl, model.colors)
    const vertexColorPosition = gl.getAttribLocation(
      shaderProgram, "aVertexColor");

    console.log(vertexPosition, vertexColorPosition, gl.getError());

    gl.enableVertexAttribArray(vertexColorPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(vertexColorPosition, 4, gl.FLOAT, false, 0, 0);
  }
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
function build_program(gl, mipmap, vsSource, fsSource) {


  const shaderProgram = build_shaders(gl, vsSource, fsSource);
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

export class Renderer {
  constructor(model, is_spinning, pen_color, pen_radius) {
    this.model = model;
    this.is_spinning = is_spinning || false;
    this.alpha = 0;
    this.pen_color = pen_color || 'black'
    this.pen_radius = pen_radius || 5
  }
  set_model(model) {    
    this.model = model;
    this.draw_model();    
  }
  init_and_draw() {
    const texture_canvas = document.getElementById("textureCanvas");
    const texture_context = texture_canvas.getContext('2d', { willReadFrequently: true });
    const main_canvas = document.getElementById("mainCanvas");
    const main_gl = main_canvas.getContext("webgl2");
    const main_texture = main_gl.createTexture();

    const imageData = texture_context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);
    bindTextureToProgram(main_gl, main_texture, imageData);

    const mips = isPowerOf2(texture_canvas.width) && isPowerOf2(texture_canvas.height);
    this.main_shader_program = build_program(main_gl, mips,
      VS_SOURCE, FS_SOURCE);

    main_gl.bindTexture(main_gl.TEXTURE_2D, main_texture);

    //glMatrix.mat4.perspective(projectionMatrix, Math.PI * 0.15, 1, 1, 10.0);
    //Matrix.mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix)

    this.init_palette();
    this.init_texture_sketcher();
    this.init_pen_selector();
    this.draw_model()
    main_canvas.addEventListener("click", (event) => {
      this.is_spinning = !this.is_spinning;
      if (this.is_spinning) {
        this.interval_id = setInterval(this.spin_and_draw.bind(this), 100);
      } else if (this.interval_id) {
        clearInterval(this.interval_id);
      }
    })
    
  };
  init_palette() {
    const palette_canvas = document.getElementById("paletteCanvas");
    const palette_context = palette_canvas.getContext('2d');
    var img = new Image();
    img.src = "/static/palette.png"; // Replace with the path to your image
    img.onload = () => {
      palette_context.drawImage(img, 0, 0, 25, 200, 0, 0, palette_canvas.width, palette_canvas.height);
    }
    palette_canvas.onclick = (event) => {
      const color = palette_context.getImageData(event.offsetX, event.offsetY, 1, 1).data;
      this.pen_color = `rgb(${color[0]},${color[1]},${color[2]})`;
      this.draw_pen_selector()
    }
  }
  draw_pen_selector() {
    const pen_canvas = document.getElementById("penCanvas");
    const pen_context = pen_canvas.getContext('2d', { willReadFrequently: true });

    pen_context.clearColor = 'black'
    pen_context.clearRect(0, 0, pen_canvas.width, pen_canvas.height)
    pen_context.fillStyle = this.pen_color
    pen_context.strokeStyle = 'white'
    pen_context.beginPath()
    pen_context.moveTo(100, 0)
    pen_context.lineTo(100, 250)
    pen_context.lineTo(50, 250)
    pen_context.lineTo(100, 0)
    pen_context.fill()
    pen_context.stroke()
    pen_context.beginPath()

    pen_context.ellipse(100 - this.pen_radius, this.pen_radius * 10, this.pen_radius, this.pen_radius, 0, 0, Math.PI * 2)
    pen_context.fill()
    pen_context.stroke()
  }
  init_pen_selector() {
    this.draw_pen_selector();
    const pen_canvas = document.getElementById("penCanvas");
    pen_canvas.addEventListener("mousemove", (event) => {
      if (event.buttons) {
        const pen_canvas_y = event.clientY - pen_canvas.getBoundingClientRect().top;
        this.pen_radius = pen_canvas_y/10
        this.draw_pen_selector()
      }
    });
  }
  init_texture_sketcher() {
    const texture_canvas = document.getElementById("textureCanvas");
    const texture_context = texture_canvas.getContext('2d', { willReadFrequently: true });
    texture_context.fillStyle = "white";
    texture_context.fillRect(0, 0, texture_canvas.width, texture_canvas.height);
    texture_context.fill()
    const frame_texture = function () {
      texture_context.lineWidth = 3;
      texture_context.fillStyle = "black";
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
    //frame_texture()
  
    const texture_canvas_left = texture_canvas.getBoundingClientRect().left;
    const texture_canvas_top = texture_canvas.getBoundingClientRect().top;
    texture_canvas.addEventListener("mousedown", (event) => {
      const canvas_x = event.clientX - texture_canvas_left;
      const canvas_y = event.clientY - texture_canvas_top;
      texture_context.beginPath();
      texture_context.moveTo(canvas_x, canvas_y);
    });
    texture_canvas.addEventListener("mousemove", (event) => {
      const canvas_x = event.clientX - texture_canvas_left;
      const canvas_y = event.clientY - texture_canvas_top;
      if (event.buttons) {
        texture_context.strokeStyle = this.pen_color;
        texture_context.lineWidth = this.pen_radius;
        texture_context.lineCap = 'round';
        texture_context.lineTo(canvas_x, canvas_y);
        texture_context.stroke();
        // texture_context.beginPath();
        // texture_context.ellipse(canvas_x, canvas_y, this.pen_radius, this.pen_radius, 0, 0, Math.PI * 2)
        // texture_context.fill();
        //frame_texture();
        this.draw_model();
  
      }
  
    })
  }
  draw_model() {
    const texture_canvas = document.getElementById("textureCanvas");
    const texture_context = texture_canvas.getContext('2d', { willReadFrequently: true });
    const main_canvas = document.getElementById("mainCanvas");
    const main_gl = main_canvas.getContext("webgl2");
    const main_texture = main_gl.createTexture();
    
    const imageData = texture_context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);
    bindTextureToProgram(main_gl, main_texture, imageData);
    const mips = isPowerOf2(texture_canvas.width) && isPowerOf2(texture_canvas.height);
    this.main_shader_program = build_program(main_gl, mips,
      VS_SOURCE, FS_SOURCE);
    const x_axis = [1, 0, 0];
    const y_axis = [0, 1, 0];

    const main_rotator_unifom = main_gl.getUniformLocation(this.main_shader_program, 'rotator');

    let rotation_matrix_4x4 = glMatrix.mat4.create();
    glMatrix.mat4.rotate(rotation_matrix_4x4, rotation_matrix_4x4, this.alpha, y_axis);
    glMatrix.mat4.rotate(rotation_matrix_4x4, rotation_matrix_4x4, Math.PI / 3, x_axis);
    
    const viewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(viewMatrix, [0, 0, 6], [0, 0, 0], [0, 1, 0]);
    const projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, Math.PI * 0.15, 1, 1, 10.0);

    glMatrix.mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix)
    var main_projector_location = main_gl.getUniformLocation(this.main_shader_program, "projector");
    if (main_projector_location != -1) {
      console.log('Projector bound');
      main_gl.uniformMatrix4fv(main_projector_location, false, projectionMatrix);
    } else {
      console.log('Projector loc', main_projector_location);
    }

    let rotationMatrix3x3 = glMatrix.mat3.create();
    glMatrix.mat3.fromMat4(rotationMatrix3x3, rotation_matrix_4x4);
    if (main_rotator_unifom != -1) {
      main_gl.uniformMatrix3fv(main_rotator_unifom, false, rotationMatrix3x3);
    }
    bind_data_to_shaders(main_gl, this.model, this.main_shader_program)

    main_gl.useProgram(this.main_shader_program);
    main_gl.clearColor(0, 0, 0, 1);
    main_gl.clear(main_gl.COLOR_BUFFER_BIT |
                  main_gl.DEPTH_BUFFER_BIT |
                  main_gl.STENCIL_BUFFER_BIT);
    main_gl.drawArrays(main_gl.TRIANGLES, 0,
      this.model.vertices.length / 3);
  };
  spin_and_draw() {
    if (this.is_spinning) {
      this.alpha = this.alpha + .03;
    }
    this.draw_model();
  }
}

