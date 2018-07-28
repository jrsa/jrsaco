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

    var config = {
        param_mapping: {
            scroll: {
                prog: "goop",
                u: "u_scroll",
            },
            mouse: {
                prog: "goop",
                u: "mouse_vert",
            },
        },
        names: {
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
        },
    };

    // object-oriented interface on some of the stuff in webgl-utils these are
    // NOT constructors, they are objects meant to be cloned by Object.create
    var jarsGl = {
        program: {
            use: function (gl) {
                gl.useProgram(this.id);
            },
            unf: function (gl, u) {
                this.use(gl);
                setUniforms(this.setters, u);
            }
        },
        framebuffer: {
            allocate: function (gl, w, h) {
                this.fbo = gl.createFramebuffer();

                // i hate this
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA,
                    gl.UNSIGNED_BYTE, null);

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D, this.texture, 0);

                // this shouldn't be here but it will be for now
                this.bb = new px.BB(gl);
            },
            bind: function (gl, ) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
            },
            draw: function(gl, pgm) {
                this.bb.draw(pgm, this.texture);
            },
            // this isn't used and shouldn't exist, the draw function should
            // just handle multiple arguments
            draw2: function (gl, pgm, texture2) {
                this.bb.draw2(pgm, this.texture, texture2);
            },
        },
    };

    // gl stuff in here
    var scene = {
        init: function (cnvs) {
            this.gl = getWebGLContext(cnvs);

            this.blur_fbo = Object.create(jarsGl.framebuffer);
            this.goop_fbo = Object.create(jarsGl.framebuffer);

            this.programs = {};

            for (k in config.names) {
                var p = Object.create(jarsGl.program);
                p.id = createProgramFromScripts(this.gl,
                    [config.names[k].vs, config.names[k].fs]);

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
                    dest.bind(that.gl);
                } else {
                    that.gl.bindFramebuffer(that.gl.FRAMEBUFFER, null);
                }
                src.draw(that.gl, prog);
            };
            blit(this.blur_fbo, this.goop_fbo, this.programs.goop.id);
            blit(this.goop_fbo, this.blur_fbo, this.programs.blur.id);
            blit(this.blur_fbo);
        },
        resize: function () {
            var w = this.gl.drawingBufferWidth;
            var h = this.gl.drawingBufferHeight;

            this.blur_fbo.allocate(this.gl, w, h);
            this.goop_fbo.allocate(this.gl, w, h);

            this.gl.viewport(0, 0, w, h)
            this.programs.blur.unf(this.gl, {resolution: [w, h]});
        },
        updateParameters: function (params) {
            var pname, uname, uniforms;
            for (prm in params) {
                if (prm in config.param_mapping) {
                    pname = config.param_mapping[prm].prog;
                    uname = config.param_mapping[prm].u;
                    uniforms = {};
                    uniforms[uname] = params[prm];
                    this.programs[pname].unf(this.gl, uniforms);
                }
            }
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
                var _docHeight = (document.height !== undefined) ?
                    document.height : document.body.offsetHeight;

                scene.updateParameters({scroll: scroll / _docHeight});
            },
            mousemove: function (e) {
                var x = util.map(e.clientX, 0, this.w.innerWidth, 0.0, 1.0);
                var y = util.map(e.clientY, 0, this.w.innerHeight, 1.0, 0.0);

                scene.updateParameters({mouse: [x, y]});
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
