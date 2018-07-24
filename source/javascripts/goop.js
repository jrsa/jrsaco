// note: `sketch.domhandlers` and `sketch.draw()` are manually bound back to
// `sketch` before being installed as callbacks. i'm not certain about
// support for this in old(er) browsers but it works for me (lol)

// thanks douglas hofstadter (i mean crockford)
if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        var F = function () {};
        F.prototype = o;
        return new F();
    }
}

(function () {
    // independent stuff in here
    var util = {
        map: function (value, low1, high1, low2, high2) {
            return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
        },
    };

    // object-oriented interface on some of the stuff in webgl-utils these are
    // NOT constructors, they are objects meant to be cloned by Object.create
    var jarsGl = {
        program: {
            use: function (gl) {
                console.log("using a program");
                // gl.useProgram(this.id);
            },
            unf: function (gl, u) {
                setUniforms(this.setters, u);
            }
        },
    };

    // gl stuff in here
    var scene = {
        init: function (cnvs) {
            var that = this, sourceFilenames, i;
            this.gl = getWebGLContext(cnvs);

            this.blur_fbo = new pxFbo(this.gl);
            this.goop_fbo = new pxFbo(this.gl);

            this.programs = {};

            sourceFilenames = {
                passthrough: {
                    vs: "baseVs",
                    fs: "baseFs",
                },
                blur: {
                    vs: "baseVs",
                    fs: "blurFs",
                },
                goop: {
                    vs: "baseVs",
                    fs: "goopFs",
                },
            };

            for (k in sourceFilenames) {
                var p = Object.create(jarsGl.program);
                p.id = createProgramFromScripts(this.gl, [sourceFilenames[k].vs, sourceFilenames[k].fs]);
                p.setters = createUniformSetters(this.gl, p.id);
                this.programs[k] = p;
            }
        },
        render: function () {
            var that = this;
            var blit = function (src, dest, prog) {
                if (typeof(dest) === 'undefined') {
                    dest = null;
                }
                if (typeof(prog) === 'undefined') {
                    prog = that.programs.passthrough.id;
                }
                if (dest) {
                    dest.bind();
                } else {
                    that.gl.bindFramebuffer(that.gl.FRAMEBUFFER, null);
                }
                src.draw(prog);
            };
            blit(this.blur_fbo, this.goop_fbo, this.programs.goop.id);
            blit(this.goop_fbo, this.blur_fbo, this.programs.blur.id);
            blit(this.blur_fbo);
        },
        resize: function () {
            var w = this.gl.drawingBufferWidth;
            var h = this.gl.drawingBufferHeight;

            this.blur_fbo.allocate(w, h);
            this.goop_fbo.allocate(w, h);

            this.gl.viewport(0, 0, w, h)
            this.gl.useProgram(this.programs.blur.id);
            this.gl.uniform2f(this.gl.getUniformLocation(this.programs.blur.id, "resolution"), w, h);
        },
        updateParameters: function (p) {
        },
    };

    // dom stuff in here
    var sketch = {
        domhandlers: {
            resize: function (e) {
                var width = this.$canvas.clientWidth;
                var height = this.$canvas.clientHeight;
                scene.resize(width, height);
                if (this.$canvas.width != width ||
                    this.$canvas.height != height) {
                   this.$canvas.width = width;
                   this.$canvas.height = height;
                }
            },
            scroll: function (e) {
                var scroll = e.pageY;
                var cHeight = this.$canvas.height;
                var _docHeight = (document.height !== undefined) ? document.height : document.body.offsetHeight;

                // this.gl.useProgram(this.goop_program);
                // this.gl.uniform1f(this.gl.getUniformLocation(this.goop_program, "u_scroll"), scroll / _docHeight);
            },
            mousemove: function (e) {
                var x = util.map(e.clientX, 0, this.w.innerWidth, 0.0, 1.0);
                var y = util.map(e.clientY, 0, this.w.innerHeight, 1.0, 0.0);

                // this.gl.useProgram(this.goop_program);
                // this.gl.uniform2f(this.gl.getUniformLocation(this.goop_program, "mouse_vert"), x, y);
            },
        },
        init: function (w, d) {
            var that = this;

            this.w = w;

            this.$canvas = d.getElementById("sketch");
            this.$canvas.width = w.innerWidth;
            this.$canvas.height = w.innerHeight;

            // bind dom handlers to this object
            for(k in this.domhandlers) {
                var h = that.domhandlers[k];
                that.domhandlers[k] = h.bind(that);
            }

            d.addEventListener('mousemove', this.domhandlers.mousemove, false);
            d.addEventListener('scroll', this.domhandlers.scroll);
            w.addEventListener('resize', this.domhandlers.resize, true);

            scene.init(this.$canvas);

            this.domhandlers.resize();
            this.animate();
        },
        animate: function () {
            this.frame = this.w.requestAnimationFrame(this.animate.bind(this));
            scene.render();
        },
    };

    sketch.init(this, this.document);
})()
