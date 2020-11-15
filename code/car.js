// Computer Graphics assignment, based off Directional ligt demo
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  //'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform vec3 u_LightPosition;\n' +
  'varying vec3 v_LightPosition;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'uniform bool u_isPoint;\n' +
  'void main() {\n' +

  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isPoint)\n' +
  '  {\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' +
  '  v_LightPosition = u_LightPosition;\n' +
  '  }else{\n' +
  '     v_Normal = (u_NormalMatrix * a_Normal).xyz;\n' +
  '     v_LightPosition = u_LightPosition;\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
  '     vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
  '     float nDotL = max(dot(normal, u_LightPosition), 0.0);\n' +
  //Calculate the color due to diffuse reflection
  '     vec3 diffuse = (1.0,1.0,1.0) * a_Color.rgb * nDotL;\n' +
  '     vec3 ambient = vec3(0.1,0.1,0.1) * a_Color.rgb;\n' +
  '     v_Color = vec4(diffuse + ambient, a_Color.a);\n' + '\n' +
  '  }\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +


  'varying vec3 v_LightPosition;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'uniform bool u_isPoint;\n' +


  'void main() {\n' +
  'if(u_isPoint){\n' +
  ' vec3 normal = normalize(v_Normal);\n' +
  // Normalize normal because it's interpolated and not 1.0 (length)
  // Calculate the light direction and make it 1.0 in length
  ' vec3 lightDirection = normalize(v_LightPosition - v_Position);\n' +
  // The dot product of the light direction and the normal
  ' float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  // Calculate the final color from diffuse and ambient reflection
  ' vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  ' vec3 ambient = (0.1,0.1,0.1) * v_Color.rgb;\n' +
  ' gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  ' }else{\n' +
  'gl_FragColor = v_Color;\n' +
  ' }\n' +
  '}\n';



var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 1.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var wheelRotation = 0.0;
var wheelAngle = 0.0;
var carRotation = 0.0;
var doorRotation = 0.0;
var speed = 0;
var x = 0;
var z = 0;
var keys = {}
var zoom = 20;
var zCam = 0;
var doorOpen = false
var toggleLook = false;
var planeSize = 120;
var isPoint = true;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');

  // Trigger using lighting or not
  var u_isPoint = gl.getUniformLocation(gl.program, 'u_isPoint');

  // if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
  //   !u_ProjMatrix || !u_LightColor || !u_LightPosition ||
  //   !u_isPoint) {
  //   console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
  //   return;
  // }






  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isPoint);
  document.onkeydown = function (ev) {
    keys[ev.keyCode] = true
  };
  document.onkeyup = function (ev) {
    keys[ev.keyCode] = false
  };

  setInterval(function () {
    keydown(gl, u_ModelMatrix, u_NormalMatrix, u_isPoint, canvas, u_ViewMatrix, u_ProjMatrix, u_LightColor, u_LightPosition)
  }, 1000 / 60)
}

function keydown(gl, u_ModelMatrix, u_NormalMatrix, u_isPoint, canvas, u_ViewMatrix, u_ProjMatrix, u_LightColor, u_LightPosition) {
  for (key in keys) {
    if (keys[key]) {
      switch (parseInt(key)) {
        case 87:
          if (speed < 1.5) {
            speed += 0.075;
          }
          wheelAngle = 0;
          break;
        case 83:
          if (speed > -1.5) {
            speed -= 0.075;
          }
          wheelAngle = 0;
          break;
        case 65:
          if (speed > 0) {
            carRotation = (carRotation + 2.5) % 360
          }
          if (wheelAngle < 35) {
            wheelAngle += ANGLE_STEP
          }
          if(speed < 0){
             carRotation = (carRotation - 2.5) % 360
          }
          break;
        case 68:
          if (speed > 0) {
            carRotation = (carRotation - 2.5) % 360
          }
          if (wheelAngle > -35) {
            wheelAngle -= ANGLE_STEP
          }
          if(speed < 0){
             carRotation = (carRotation + 2.5) % 360
          }
          break;
        case 69:
          doorOpen = true
          break;
        case 81:
          doorOpen = false
          break;
        case 37:
          zCam = zCam += 1 % 360
          break;
        case 38:
          zoom -= 0.5
          break;
        case 39:
          zCam = zCam -= 1 % 360
          break;
        case 40:
          zoom += 0.5
          break;
        case 75:
          toggleLook = false;
          break;
        case 76:
          toggleLook = true;
          break;
        case 84:
          isPoint = true
          break;
        case 82:
          isPoint = false
          break;

        default: return; // Skip drawing at no effective action
      }

    }
    if (speed != 0) {
      if (Math.abs(x + 0.2 * speed * Math.sin(carRotation / 180 * Math.PI)) < planeSize / 2) {
        x += 0.2 * speed * Math.sin(carRotation / 180 * Math.PI)
      }
      if (Math.abs(z + 0.2 * speed * Math.cos(carRotation / 180 * Math.PI)) < planeSize / 2) {
        z += 0.2 * speed * Math.cos(carRotation / 180 * Math.PI)
      }
    }

    if (speed > 0) {
      speed -= 0.0025
    } else if (speed < 0) {
      speed += 0.0025
    }
    if (Math.abs(speed) < 0.01) {
      speed = 0
    }
    wheelRotation += speed * 15 % 360
    if (doorOpen) {
      if (doorRotation < 55) {
        doorRotation += 1
      }
    } else {
      if (doorRotation > 0) {
        doorRotation -= 1
      }
    }

  }

  // Calculate the view matrix and the projection matrix
  if (toggleLook) {
    viewMatrix.setLookAt(zoom * Math.cos(zCam / 180 * Math.PI), zoom, zoom * Math.sin(zCam / 180 * Math.PI), x, 0.25, z, 0, 1, 0);
  } else {
    viewMatrix.setLookAt(zoom * Math.cos(zCam / 180 * Math.PI), zoom, zoom * Math.sin(zCam / 180 * Math.PI), 0, 0, 0, 0, 1, 0);
  }


  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1, 1, 1);
  // Set the light direction (in the world coordinate)
  var lightPosition = new Vector3([zoom * Math.cos((360 - zCam) / 180 * Math.PI), zoom / 2, zoom * Math.sin((360 - zCam) / 180 * Math.PI)]);
  if (!isPoint) {
    lightPosition = lightPosition.normalize()
    console.log("")
  }
  gl.uniform3fv(u_LightPosition, lightPosition.elements);

  projMatrix.setPerspective(95, canvas.width / canvas.height, 1, 1000);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isPoint);
}


function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,  // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v1-v2-v3 front //red
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,　    // v4-v7-v6-v5 back

    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v0-v1-v2-v3 front //green
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v0-v3-v4-v5 right
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v0-v5-v6-v1 up
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v1-v6-v7-v2 left
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v7-v4-v3-v2 down
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,　    // v4-v7-v6-v5 back

    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v0-v1-v2-v3 front //blue
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v0-v3-v4-v5 right
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v0-v5-v6-v1 up
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v1-v6-v7-v2 left
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v7-v4-v3-v2 down
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,　    // v4-v7-v6-v5 back

    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,     // v0.5-v0.5-v2-v3 front
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,     // v0.5-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,     // v0.5-v5-v6-v0.5 up
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,     // v0.5-v6-v7-v2 left
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,     // v7-v4-v3-v2 down
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,　    // v4-v7-v6-v5 back

    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,     // v0-v1-v2-v3 front
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,     // v0-v3-v4-v5 right
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,     // v0-v5-v6-v1 up
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,     // v1-v6-v7-v2 left
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,     // v7-v4-v3-v2 down
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,　    // v4-v7-v6-v5 back

    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,     // v0-v1-v2-v3 front
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,     // v0-v3-v4-v5 right
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,     // v0-v5-v6-v1 up
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,     // v1-v6-v7-v2 left
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,     // v7-v4-v3-v2 down
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,　    // v4-v7-v6-v5 back

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,     // v0-v1-v2-v3 front
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,     // v0-v3-v4-v5 right
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,     // v0-v5-v6-v1 up
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,     // v1-v6-v7-v2 left
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,     // v7-v4-v3-v2 down
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,　    // v4-v7-v6-v5 back

    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,     // v0-v1-v2-v3 front
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,     // v0-v3-v4-v5 right
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,     // v0-v5-v6-v1 up
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,     // v1-v6-v7-v2 left
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,     // v7-v4-v3-v2 down
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1　    // v4-v7-v6-v5 back
  ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,   // v4-v7-v6-v5 back

    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // right
    8, 9, 10, 8, 10, 11,    // up
    12, 13, 14, 12, 14, 15,    // left
    16, 17, 18, 16, 18, 19,    // down
    20, 21, 22, 20, 22, 23,     // back

    24, 25, 26, 24, 26, 27,    // front
    28, 29, 30, 28, 30, 31,    // right
    32, 33, 34, 32, 34, 35,    // up
    36, 37, 38, 36, 38, 39,    // left
    40, 41, 42, 40, 42, 43,    // down
    44, 45, 46, 44, 46, 47,     // back

    48, 49, 50, 48, 50, 51,    // front
    52, 53, 54, 52, 54, 55,    // right
    56, 57, 58, 56, 58, 59,    // up
    60, 61, 62, 60, 62, 63,    // left
    64, 65, 66, 64, 66, 67,    // down
    68, 69, 70, 68, 70, 71,     // back

    72, 73, 74, 72, 74, 75,    // front
    76, 77, 78, 76, 78, 79,    // right
    80, 81, 82, 80, 82, 83,    // up
    84, 85, 86, 84, 86, 87,    // left
    88, 89, 90, 88, 90, 91,    // down
    92, 93, 94, 92, 94, 95,     // back

    96, 97, 98, 96, 98, 99,    // front
    100, 101, 102, 100, 102, 103,    // right
    104, 105, 106, 104, 106, 107,    // up
    108, 109, 110, 108, 110, 111,    // left
    112, 113, 114, 112, 114, 115,    // down
    116, 117, 118, 116, 118, 119,     // back

    120, 121, 122, 120, 122, 123,    // front
    124, 125, 126, 124, 126, 127,    // right
    128, 129, 130, 128, 130, 131,    // up
    132, 133, 134, 132, 134, 135,    // left
    136, 137, 138, 136, 138, 139,    // down
    140, 141, 142, 140, 142, 143,     // back

    144, 145, 146, 144, 146, 147,    // front
    148, 149, 150, 148, 150, 151,    // right
    152, 153, 154, 152, 154, 155,    // up
    156, 157, 158, 156, 158, 159,    // left
    160, 161, 162, 160, 162, 163,    // down
    164, 165, 166, 164, 166, 167,     // back

    168, 169, 170, 168, 170, 171,    // front
    172, 173, 174, 172, 174, 175,    // right
    176, 177, 178, 176, 178, 179,    // up
    180, 181, 182, 180, 182, 183,    // left
    184, 185, 186, 184, 186, 187,    // down
    188, 189, 190, 188, 190, 191     // back
  ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isPoint) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isPoint, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isPoint, isPoint); // Will apply lighting

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  

  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)


  //platform
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -0.5, 0); // Scale
  modelMatrix.scale(planeSize, 0.25, planeSize); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 96);
  modelMatrix = popMatrix();

  //move car to position
  modelMatrix.setTranslate(x, 0, z)
  modelMatrix.rotate(carRotation, 0, 1, 0)

  //modelMatrix.rotate(carRotation,0,1,0)
  // Model the chair seat
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 1, 0); // Scale
  modelMatrix.scale(2.0, 0.5, 2.0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  // Model the chair back
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 2.25, -0.75);  // Translation
  modelMatrix.scale(2.0, 2.0, 0.5); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();


  //model bonnet
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 1.25, 4);  // Translation
  modelMatrix.scale(3.0, 1.75, 5, 0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  //model boot
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 1.25, -3);  // Translation
  modelMatrix.scale(3.0, 1.75, 3, 0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  //model floor
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 0.25, 1.0);  // Translation
  modelMatrix.scale(3.0, 0.25, 11.0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  //model roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 4, 0);  // Translation
  modelMatrix.scale(3.0, 0.25, 4.0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0, 2.5, -1.875);  // Translation
  modelMatrix.scale(3, 1.25, 0.25); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.375, 3, -1.875);  // Translation
  modelMatrix.scale(0.25, 2.25, 0.25); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.375, 3, -1.875);  // Translation
  modelMatrix.scale(0.25, 2.25, 0.25); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.375, 3, 1.875);  // Translation
  modelMatrix.scale(0.25, 2.25, 0.25); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.375, 3, 1.875);  // Translation
  modelMatrix.scale(0.25, 2.25, 0.25); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 0);
  modelMatrix = popMatrix();

  //end of roof

  //model right door
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.375, 1.25, 0);  // Translation
  modelMatrix.translate(0, 0, 1.5)
  modelMatrix.rotate(doorRotation, 0, 1, 0);
  modelMatrix.translate(0, 0, -1.5)
  modelMatrix.scale(0.25, 1.75, 3.0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 144);
  modelMatrix = popMatrix();

  //model left door
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.375, 1.25, 0);  // Translation
  modelMatrix.translate(0, 0, 1.5)
  modelMatrix.rotate(-doorRotation, 0, 1, 0);
  modelMatrix.translate(0, 0, -1.5)
  modelMatrix.scale(0.25, 1.75, 3.0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 108);
  modelMatrix = popMatrix();

  //model fl wheel
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5, 0.5, 5);  // Translation
  modelMatrix.rotate(wheelAngle, 0, 1, 0)
  modelMatrix.scale(0.5, 1.75, 1.75); // Scale
  modelMatrix.rotate(wheelRotation, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 180);
  modelMatrix = popMatrix();

  //model fr wheel
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5, 0.5, 5);  // Translation
  modelMatrix.rotate(wheelAngle, 0, 1, 0)
  modelMatrix.scale(0.5, 1.75, 1.75); // Scale
  modelMatrix.rotate(wheelRotation, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 216);
  modelMatrix = popMatrix();
  //model bl wheel
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5, 0.5, -3);  // Translation
  modelMatrix.scale(0.5, 1.75, 1.75); // Scale
  modelMatrix.rotate(wheelRotation, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 252);
  modelMatrix = popMatrix();

  //model br wheel
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5, 0.5, -3);  // Translation
  modelMatrix.scale(0.5, 1.75, 1.75); // Scale
  modelMatrix.rotate(wheelRotation, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, 36, 72);
  modelMatrix = popMatrix();



}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, offset) {
  pushMatrix(modelMatrix);

  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, offset);

  modelMatrix = popMatrix();
}
