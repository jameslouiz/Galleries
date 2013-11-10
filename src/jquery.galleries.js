(function ($) {

    //used to fix method calling issues on un-instantiated objects
    $.bind = function (object, method) {
        var args = Array.prototype.slice.call(arguments, 2);
        return function () {
            var args2 = [this].concat(args, $.makeArray(arguments));
            return method.apply(object, args2);
        };
    };

    var Gallery = function (element, options) {
        this.init(element, options)
    }

    Gallery.Defaults = {
        className: '',
        preloader: false,
        delay: 0,
        callbacks: {
            onInit: null,
            beforeLoad: null,
            afterLoad: null
        }
    }

    Gallery.prototype = {

        /**
         * Initialise each element and setup params
         * @param element - Object to bind gallery to
         * @param options - Object of options to be extended
         */
        init: function(element, options)
        {
            this.$element = $(element);
            this.options = $.extend({}, Gallery.Defaults, options);

            if (typeof window.galleryStack !== 'object') {
                window.galleryStack = $([])
            }

            this.$element.addClass('unloaded');

            // Setup vars
            this.stack = window.galleryStack;
            this.target = $('#preview');
            this.src = this.$element.attr('href');

            this.callHook('onInit');
        },

        /**
         * A helper method to run callbacks
         * @param hook STRING name of callback to run
         */
        callHook: function(hook)
        {
            if (typeof this.options.callbacks[hook] === 'function') {
                this.options.callbacks[hook]();
            }
        },

        /**
         * Show the preloader before an image is requested that isnt already in the stack
         */
        showPreload : function()
        {
            if (this.options.preloader) {
                this.target.find(this.preloader).fadeIn(200);
            }
        },

        /**
         * Hide the preloader after the image has been loaded
         */
        hidePreload : function()
        {
            if (this.options.preloader) {
                this.target.find(this.preloader).fadeOut(200);
            }
        },

        /**
         * Gets the image from either the stack of preloaded images or makes a new request to load from remote
         */
        get : function()
        {
            // If the source is the same don't bother updating target
            if (this.src != this.target.find('img').attr('src')) {

                var inStack = this.checkStack(this.src),
                    img = this.pullStack(this.src),
                    img = img[0];

                if (inStack) {
                    this.set(img);
                } else {
                    this.load(this.src);
                }
            }
        },

        /**
         * Push requested images to the stack so we don't have to make another request
         * @param img OBJECT Image to push into the stack
         * @param src STRING Source of image to be pushed to target
         */
        save : function(img, src)
        {
            var inStack = this.checkStack(src);

            if (!inStack) {
                window.galleryStack.push(img);
            }
        },

        /**
         * Pulls image from stack that has matching source to whats requested
         * @param src STRING Image source to be pulled from stack
         * @returns {*} Array of images with a source of src
         */
        pullStack : function(src)
        {
            var arr = $.grep( window.galleryStack, function(n) {
                return n.getAttribute('src') == src
            });
            return arr;
        },

        /**
         * Helper method to check for element in stack
         * @param src STRING of image to check exists in the stack
         * @returns {boolean}
         */
        checkStack : function(src)
        {
            var arr = this.pullStack(src)
            return !arr.length ? false : true;
        },

        /**
         * Makes an external request for the image
         * @param src STRING of image to load externally
         */
        load : function(src)
        {
            var img = new Image(),
                gal = this;


            this.callHook('beforeLoad');
            this.showPreload();

            img.onload = function(){

                setTimeout(function(){
                    gal.set(img);
                    gal.hidePreload();
                    gal.save(img, src);
                    gal.callHook('afterLoad');

                    gal.$element
                        .removeClass('unloaded')
                        .addClass('loaded');

                }, gal.delay);
            };
            img.src = src;
        },

        /**
         * Injects image into DOM
         * @param img
         */
        set : function(img)
        {
            this.target.html(img);

            this.callHook('onChange');
        }

    }


    // GALLERY PLUGIN DEFINITION
    // ========================

    var old = $.fn.gallery;

    $.fn.gallery = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('jl.gallery'),
                options = typeof option == 'object' && option;

            if (!data) $this.data('jl.gallery', (data = new Gallery(this, options)))

            if (option == 'get') data.get();
        })
    }

    $.fn.gallery.Constructor = Gallery;


    // Gallery NO CONFLICT
    // ==================

    $.fn.gallery.noConflict = function () {
        $.fn.gallery = old;
        return this
    }


    // BUTTON DATA-API
    // ===============

    $(document).on('click', '[data-stage]', function (e) {
        $(this).gallery('get');

        e.preventDefault()
    })



})(jQuery);