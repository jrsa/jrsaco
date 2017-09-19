var gl, baseTexture, canvas, fbo, feedback;
var blur, goop, normal, emboss, contrast, render;
var drySignal;

var baseProgram, feedbackProgram;
var blurProgram, goopProgram, normalProgram, embossProgram, contrastProgram;

var baseVs, baseFs, feedbackFs, translateVs;
var blurFs, goopFs, normalFs, embossFs, contrastFs;

var imgTex, renderTex;

var mvx = 0.0;
var mvy = 0.0;

canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.addEventListener('mousedown', function(e) {
    getNewImg();
}, false);

document.addEventListener('mousemove', function(e) {
    mvx = map(e.clientX, 0, window.innerWidth, 0.98, 1.1);
    mvy = map(e.clientY, 0, window.innerHeight, 0.98, 1.1);
}, false);

// create backing canvas
var backCanvas = document.createElement('canvas');
backCanvas.width = canvas.width;
backCanvas.height = canvas.height;
var backCtx = backCanvas.getContext('2d');

// Create gradient
var grd = backCtx.createRadialGradient(canvas.width/2, canvas.height/2, 5, canvas.width, canvas.height, canvas.width);
grd.addColorStop(0., "red");
grd.addColorStop(.1, "yellow");
grd.addColorStop(.2, "green");
grd.addColorStop(.4, "blue");
grd.addColorStop(1., "purple");
// Fill with gradient
backCtx.fillStyle = grd;
backCtx.fillRect(0, 0, canvas.width, canvas.height);

var dataURL = backCanvas.toDataURL();

var img = new Image();
img.src = dataURL;
img.onload = function(){
  imageLoaded = true;
  getImgAsTexture();
  getNewImg();
  loop();
}

initGl();
initFbosAndShaders();

function initGl(){
    gl = getWebGLContext(canvas);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
}

function initFbosAndShaders(){
    baseTexture = new pxBB();
    fbo = new pxFbo();
    feedback = new pxFbo();

    drySignal = new pxBB();
    renderTex = new pxBB();

    blur = new pxFbo();
    goop = new pxFbo();
    normal = new pxFbo();
    contrast = new pxFbo();
    emboss = new pxFbo();
    render = new pxFbo();

    //set up fbo's
    fbo.allocate(canvas.width, canvas.height);
    feedback.allocate(canvas.width, canvas.height);

    blur.allocate(canvas.width, canvas.height);
    goop.allocate(canvas.width, canvas.height);
    normal.allocate(canvas.width, canvas.height);
    emboss.allocate(canvas.width, canvas.height);
    contrast.allocate(canvas.width, canvas.height);
    render.allocate(canvas.width, canvas.height);

    //create shaders
    baseVs = createShaderFromScriptElement(gl, "baseVs");
    translateVs = createShaderFromScriptElement(gl, "translateVs");
    baseFs = createShaderFromScriptElement(gl, "baseFs");
    feedbackFs = createShaderFromScriptElement(gl, "feedbackFs");

    blurFs = createShaderFromScriptElement(gl, "blurFs");
    goopFs = createShaderFromScriptElement(gl, "goopFs");
    normalFs = createShaderFromScriptElement(gl, "normalFs");
    embossFs = createShaderFromScriptElement(gl, "embossFs");
    contrastFs = createShaderFromScriptElement(gl, "contrastFs");

    //create program
    baseProgram = createProgram(gl, [baseVs, baseFs]);
    feedbackProgram = createProgram(gl, [baseVs, feedbackFs]);

    blurProgram = createProgram(gl, [translateVs, blurFs]);
    goopProgram = createProgram(gl, [baseVs, goopFs]);
    normalProgram = createProgram(gl, [baseVs, normalFs]);
    embossProgram = createProgram(gl, [baseVs, embossFs]);
    contrastProgram = createProgram(gl, [baseVs, contrastFs]);
}

//DRAW JAVASCRIPT

function loop(){
    window.requestAnimationFrame(loop);

    goop.start();

    gl.useProgram(goopProgram);

    feedback.draw(goopProgram);

    blur.start();

    gl.useProgram(blurProgram);

    gl.uniform2f(gl.getUniformLocation(blurProgram, "resolution"), canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(blurProgram, "mouse_vert"), mvx, mvy);

    goop.draw(blurProgram);

    render.start();

    gl.useProgram(feedbackProgram);

    gl.uniform2f(gl.getUniformLocation(feedbackProgram, "resolution"), canvas.width, canvas.height);

    blur.draw(feedbackProgram);

    //return fbo to itself
    feedback.start();
    render.draw(baseProgram);

    normal.start();

    gl.useProgram(normalProgram);
    gl.uniform2f(gl.getUniformLocation(normalProgram, "resolution"), canvas.width, canvas.height);

    blur.draw(normalProgram);

    emboss.start();


    blur.draw2(embossProgram, normal.texture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    emboss.draw(baseProgram);
}

//UTILS JAVASCRIPT

function getImgAsTexture(){
  //create camera texture
  imgTex = createAndSetupTexture(gl);
  imgTex.image = img;
  gl.bindTexture(gl.TEXTURE_2D, imgTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgTex.image);
}

function getNewImg(){
   //gets a new frame
   feedback.start();
   baseTexture.draw(baseProgram, imgTex);
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

