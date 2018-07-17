(function(w, d) {
    var gl, baseTexture, canvas, fbo, feedback;
    var blur, goop, render;

    var baseProgram, blurProgram, goopProgram;
    var baseVs, baseFs, feedbackFs, blurFs, goopFs;

    var imgTex, renderTex;

    var animationFrameId;

    var mvx = .08;
    var mvy = .06;
    canvas = d.getElementById("sketch");

    // i think if this ran in after the dom is ready it would already be the right size
    // it initializes all the GL stuff to some small size and then just draws the canvas
    // bigger after it figures out what size it will be, stretching the framebuffer contents
    canvas.width = w.innerWidth;
    canvas.height = w.innerHeight;

    d.addEventListener('mousemove', function(e) {
        mvx = map(e.clientX, 0, w.innerWidth, 0.0, 1.0);
        mvy = map(e.clientY, 0, w.innerHeight, 1.0, 0.0);
    }, false);

    d.addEventListener('scroll', function(e) {
        var scroll = w.scrollY;
        var cHeight = canvas.height;
        var _docHeight = (document.height !== undefined) ? document.height : document.body.offsetHeight;

        gl.useProgram(goopProgram);
        gl.uniform1f(gl.getUniformLocation(goopProgram, "u_scroll"), scroll / _docHeight);

        console.log("scroll uniform", scroll / cHeight);
/*
        if (scroll > cHeight) {
            console.log("stopping webGL animation")

            w.cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        } else {
            if (animationFrameId === 0) {
                console.log("resuming webGL animation")
                loop();
            }
        }
*/
    })

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
        console.log("img.onload");

        getImgAsTexture();
        getNewImg();
        loop();
    };

    initGl();
    initFbosAndShaders();

    function initGl() {
        console.log("init")
        gl = getWebGLContext(canvas);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    }

    function initFbosAndShaders() {
        console.log("initFbosAndShaders");


        baseTexture = new pxBB(gl);
        fbo = new pxFbo(gl);
        feedback = new pxFbo(gl);

        renderTex = new pxBB(gl);

        blur = new pxFbo(gl);
        goop = new pxFbo(gl);
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
        animationFrameId = w.requestAnimationFrame(loop);

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
        console.log("getImgAsTexture");
        imgTex = createAndSetupTexture(gl);
        imgTex.image = img;
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgTex.image);
    }

    function getNewImg() {
        console.log("getNewImg");
        feedback.start();
        baseTexture.draw(baseProgram, imgTex);
    }

    function map(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }
})(window, document)