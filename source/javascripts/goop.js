(function(w, d) {
    var gl, baseTexture, canvas, fbo, feedback;
    var blur, goop, normal, emboss, contrast, render;
    var drySignal;

    var baseProgram, feedbackProgram;
    var blurProgram, goopProgram, normalProgram, embossProgram, contrastProgram;

    var baseVs, baseFs, feedbackFs, translateVs;
    var blurFs, goopFs, normalFs, embossFs, contrastFs;

    var imgTex, renderTex;

    var mvx = .08;
    var mvy = .06;

    canvas = d.createElement("canvas");
    d.body.appendChild(canvas);
    canvas.width = w.innerWidth;
    canvas.height = w.innerHeight;

    d.addEventListener('mousemove', function(e) {
        mvx = map(e.clientX, 0, w.innerWidth, 0.1, .90);
        mvy = map(e.clientY, 0, w.innerHeight, 0.1, .90);
        console.log(mvx, mvy)
    }, false);

    w.addEventListener('resize', function(e) {
        gl.viewport(0, 0, canvas.width, canvas.height)
    }, true);

    // create backing canvas
    var backCanvas = d.createElement('canvas');
    backCanvas.width = canvas.width;
    backCanvas.height = canvas.height;
    var backCtx = backCanvas.getContext('2d');

    // Create gradient
    var grd = backCtx.createLinearGradient(canvas.width / 2, canvas.height / 2, 5, canvas.width, canvas.height, canvas.width);
    grd.addColorStop(0., "red");
    // grd.addColorStop(.1, "yellow");
    // grd.addColorStop(.2, "green");
    grd.addColorStop(.5, "blue");
    grd.addColorStop(1., "purple");
    // Fill with gradient
    backCtx.fillStyle = grd;
    backCtx.fillRect(0, 0, canvas.width, canvas.height);

    var dataURL = backCanvas.toDataURL();

    var img = new Image();
    // img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
    img.src = dataURL;
    img.onload = function() {
        getImgAsTexture();
        getNewImg();
        loop();
    };

    initGl();
    initFbosAndShaders();

    function initGl() {
        gl = getWebGLContext(canvas);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    }

    function initFbosAndShaders() {
        baseTexture = new pxBB(gl);
        fbo = new pxFbo(gl);
        feedback = new pxFbo(gl);

        drySignal = new pxBB(gl);
        renderTex = new pxBB(gl);

        blur = new pxFbo(gl);
        goop = new pxFbo(gl);
        normal = new pxFbo(gl);
        contrast = new pxFbo(gl);
        emboss = new pxFbo(gl);
        render = new pxFbo(gl);

        //set up fbo's
        fbo.allocate(canvas.width, canvas.height);
        feedback.allocate(canvas.width, canvas.height);

        blur.allocate(canvas.width, canvas.height);
        goop.allocate(canvas.width, canvas.height);
        render.allocate(canvas.width, canvas.height);

        baseVs = createShaderFromScriptElement(gl, "baseVs");
        baseFs = createShaderFromScriptElement(gl, "baseFs");
        blurFs = createShaderFromScriptElement(gl, "blurFs");
        goopFs = createShaderFromScriptElement(gl, "goopFs");

        baseProgram = createProgram(gl, [baseVs, baseFs]);
        blurProgram = createProgram(gl, [baseVs, blurFs]);
        goopProgram = createProgram(gl, [baseVs, goopFs]);
    }

    function loop() {
        w.requestAnimationFrame(loop);

        goop.start();
        gl.useProgram(goopProgram);
        gl.uniform2f(gl.getUniformLocation(goopProgram, "mouse_vert"), mvx, mvy);
        feedback.draw(goopProgram);

        blur.start();
        gl.useProgram(blurProgram);
        gl.uniform2f(gl.getUniformLocation(blurProgram, "resolution"), canvas.width, canvas.height);
        goop.draw(blurProgram);

        render.start();
        gl.useProgram(baseProgram);
        blur.draw(baseProgram);

        feedback.start();
        render.draw(baseProgram);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        feedback.draw(baseProgram);
    }


    function getImgAsTexture() {
        imgTex = createAndSetupTexture(gl);
        imgTex.image = img;
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgTex.image);
    }

    function getNewImg() {
        feedback.start();
        baseTexture.draw(baseProgram, imgTex);
    }

    function map(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }
})(window, document)