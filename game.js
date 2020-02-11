// C++ Vertex Shader written in GLSL:
var vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec2 vertPosition;',
    'attribute vec3 vertColor;',
    'uniform mat4 uModelMatrix;',
    'varying vec3 fragColor;',
    '',
    'void main()',
    '{',
    '   fragColor = vertColor;',
    '   gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '}'
].join('\n');

// C++ Fragment Shader written in GLSL:
var fragmentShaderText = [
    'precision mediump float;',
    '',
    'varying vec3 fragColor;',
    'void main()',
    '{',
    '   gl_FragColor = vec4(fragColor, 1.0);',
    '}'
].join('\n');

// Global Variables
let ANGLE_PER_SECOND = 15.0;

// Initialized on page load:
var InitDemo = function(){

    console.log("This is a test.");
    var last = Date.now();      // Get Current Time when Initialized

    var canvas = document.getElementById("gameCanvas");
    var gl = WebGLUtils.setupWebGL(canvas);

    if (!gl){
        console.log("WebGL not supported: attempting to use experimental WebGL.");
        gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        alert("Your browser does not appear to support WebGL. Please use a newer browser.");
    }

    // Define the background colour for the canvas:
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /**
     * 1. CREATE SHADERS
     */
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR: Vertex Shader could not be compiled.', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR: Fragment Shader could not be compiled.', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    // Dynamically resize the canvas window to the browser window size:
    /*
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0,0,window.innerWidth, window.innerHeight);
    */

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error('ERROR: Program linking was unsuccessful.', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
        console.error('ERROR: Program validation was unsuccessful.', gl.getProgramInfoLog(program));
        return;
    }

    /**
     * 2. Create the Shapes:
     *      - define vertices and colours
     *      - make buffers for vertices and colours
     */

    // Define the triangle vertices:
    let triangleVertices =
        [ //x, y,           R, G, B
            0.0, 0.5,       1.0, 1.0, 1.0       // Vertex 1
            -0.5, -0.5,     0.7, 0.0, 1.0,      // Vertex 2
            0.5, -0.5,      0.1, 1.0, 0.6       // Vertex 3
        ];

    // Define the circular disk vertices (will be made up of triangles)
    var circleVertices =
        [ // x, y           R, G, B
                                                // Vertex 1
        ];
    // Use a loop to define all the vertices of the circle:
    for (var i = 0.0; i <= 360; i++){
        var j = i * Math.PI / 180;
        // Create a Vertex on Outer Circle Circumference:
        var vert1 =
            [
                Math.sin(j), // x
                Math.cos(j), // y
                0.6,         // R
                0.6,         // G
                0.7          // B
            ];
        // Create a Vertex on the Center of the Circle:
        var vert2 =
            [
                0.0,        // x
                0.0,        // y
                0.4,        // R
                0.4,        // G
                0.5         // B
            ];
        // Append created vertices to vertex array
        circleVertices = circleVertices.concat(vert1);
        circleVertices = circleVertices.concat(vert2);
        // Repeat 360 times
    }

    // Create a buffer for the triangle and circle:
    // var triangleVertexBuffer = gl.createBuffer();
    var circleVertexBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);

    // Get a Handle:
    var positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
    var colorAttributeLocation = gl.getAttribLocation(program, 'vertColor');

    // For Vertices:
    gl.vertexAttribPointer(
        positionAttributeLocation, //Attribute Location
        2,  //Number of elements per attribute (ie. number of elements per vertex of the triangle)
        gl.FLOAT, // Type of elements
        false,
        5 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
        0 //Offset from the beginning of a single vertex to this attribute
    );
    // For Colours:
    gl.vertexAttribPointer(
        colorAttributeLocation, //Attribute Location
        3,  //Number of elements per attribute (ie. number of elements per vertex of the triangle)
        gl.FLOAT, // Type of elements
        false,
        5 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
        2 * Float32Array.BYTES_PER_ELEMENT //Offset from the beginning of a single vertex to this attribute
        );

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);

    /**
     * 3. Main Render Loop:
     */

    gl.useProgram(program);
    // Draw the Circle Array:
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 2 * 360 + 2);

    /**
     * ANIMATION:
     */

    function updateAngle(angle){
        var now = Date.now();
        var time = now - last;
        last = now;
        return (angle + (ANGLE_PER_SECOND * time) / 1000.0) % 360;
    }

    var angle = 0.0;
    var modelMatrix = [[],[],[],[]];
    var uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');

    // Main Draw Function:
    function draw(angle, modelMatrix, uModelMatrix){

        var radian = Math.PI * angle / 180.0;
        // var modelMatrix = Matrix4.prototype.setRotate(radian, 0, 0, 1);
        // var uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
        // gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 2 * 360 + 2);

    }

    // Main Render Loop:
    function tick(){

        angle = updateAngle(angle);

        //Each frame, clears the canvas then draws the circle:
        draw(angle, modelMatrix, uModelMatrix);

        requestAnimationFrame(tick);

    }
    tick();

};