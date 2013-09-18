;(function( $, window, document, undefined ) {

    var template = {
        lightbox: '<div class="litebox-overlay"><div class="litebox"><div class="litebox-wrapper"><div class="litebox-content"></div><div class="litebox-overlay-loader"><div class="litebox-overlay-loader-txt"><i class="icon-spinner icon-spin icon-2x"></i><br/><br/>Loading ...</div></div></div><div class="litebox-message"></div></div></div>',
        title: '<div class="litebox-title"></div>',
        bottom: '<div class="litebox-bottom"></div>',
        placeholder: '<div class="litebox-placeholder"></div>'
    }

    var element = {
        lightbox: $(template.lightbox),
        title: $(template.title),
        bottom: $(template.bottom),
        placeholder: $(template.placeholder)
    }

    var isOpen = false,
        messageTimer = null;

    element['content'] = element.lightbox.find('.litebox-content');
    element['box'] = element.lightbox.find('.litebox');
    element['message'] = element.lightbox.find('.litebox-message');
    element['wrapper'] = element.lightbox.find('.litebox-wrapper');
    element['loader'] = element.lightbox.find('.litebox-overlay-loader');

    var _ = {
        tryClose: function(e) {
            if (e.target.className == "litebox-overlay") {
                $.litebox.close();
            }
        },

        centerLitebox: function(dimensions, isUpdating){
            var boxCSS = {
                'width': dimensions.boxWidth,
                'margin-left': (dimensions.boxWidth / 2) * -1,
                'height': dimensions.boxHeight,
                'margin-top': (dimensions.boxHeight / 2) * -1,
                'opacity': (isUpdating ? 1 : 0)
            };

            var contentCSS = {
                'width': dimensions.contentWidth,
                'height': dimensions.contentHeight,
                'opacity': 1
            }

            if(isUpdating){
                element.box.stop().animate(boxCSS, 200);
                element.content.stop().animate(contentCSS, 200);
            }else{
                boxCSS['margin-top'] -= 20;

                element.box.css(boxCSS);

                element.content.css({
                    'width' : contentCSS.width,
                    'height' : contentCSS.height
                });

                element.box.animate({
                    'margin-top': boxCSS['margin-top'] + 20,
                    'opacity': 1
                }, 200);
            }
            
        },

        calculateContent: function(options){
            var width = (options.width == "auto") ? "auto" : options.width;
            var height = (options.height == "auto") ? "100%" : options.height;

            var boxWidth = element.box.outerWidth();
            var boxHeight = element.box.outerHeight();

            var viewportWidth = $(window).width();
            var viewportHeight = $(window).height();

            element.box.css({
                height: 'auto',
                width: 'auto'
            });

            element.content.css({
                'height' : height,
                'width' : width
            });         

            width = element.content.innerWidth();
            height = element.content.innerHeight();

            var calcHeight = height + 32 + element.title.innerHeight() + element.bottom.innerHeight(),
                calcWidth = (width + 32);

            if(calcHeight > viewportHeight-20){
                calcHeight = viewportHeight-20;
                height = calcHeight - 32 - element.title.innerHeight() - element.bottom.innerHeight();
            }

            if(calcWidth > viewportWidth-20){
                calcWidth = viewportWidth-20;
                width = calcWidth - 32;
            }

            return {contentWidth: width, contentHeight: height, boxWidth: calcWidth, boxHeight: calcHeight};
        }
    }

    $.fn.litebox = function(opt) {
        return this.each(function() {
            $(this).data('litebox', {
                target: $(this).attr('href') || $(this).attr('litebox-target'),
                options: opt
            }).on('click', function(e) {
                $.litebox.trigger(this);
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
        });

    };

    $.litebox = function() {
        $.litebox.open.apply($.litebox, arguments);
    };

    $.extend($.litebox, {
        isOpen: false,
        current: {
            handle: null
        },
        defaults: {
            width:                      "auto",
            height:                     "auto",
            minWidth:                   100,
            minHeight:                  100,
            maxWidth:                   5000,
            maxHeight:                  5000,

            target:                     null,
            closeOnOverlay:             true,
            messageDuration:            5000,
            buttons:                    null,
            title:                      null,
            backgroundColor:            "white",
            preLoading:                 false,

            beforeOpen:                 $.noop,
            onOpen:                     $.noop,
            onClose:                    $.noop
        },

        trigger: function(handle) {
            if (this.isOpen) return;

            var data = $(handle).data('litebox');

            this.current.handle = handle;
            this.open(data.target, data.options);
        },

        open: function(target, opts) {
            if (this.isOpen || !target) return;

            // Get litebox options
            var options = this.current.options = $.extend({}, this.defaults, opts);

            var target = this.current.target = target instanceof jQuery ? target : $(target);

            var title = (options.title) ? options.title : (this.current.handle) ? this.current.handle.title : null;

            // Run beforeOpen Event
            if(opts.beforeOpen){
                opts.beforeOpen.apply(target, [this.current]);
            }

            if (title) {
                element.box.prepend(element.title.html(title));
            } else {
                element.title.remove();
            }

            if (options.buttons) {
                element.bottom.empty();

                var that = this;

                for (var i = options.buttons.length-1; i >= 0; i--) {
                    var button = options.buttons[i];
                    var buttonElem = $('<div class="litebox-btn">' + button.label + '</div>');
                    if (button.color) {
                        buttonElem.css('background-color', button.color);
                    }

                    if (button.orientation) {
                        buttonElem.css('float', button.orientation);
                    }

                    if (button.callback){
                        buttonElem.on('click', (function(button) {
                            return function(event) {
                                button.callback.apply(target, [event, that.current]);
                            }
                        })(button));
                    }else if (button.submit && button.submit.form){
                        buttonElem.on('click', (function(button) {
                            return function(event) {
                                for(var i in button.submit.data){
                                    button.submit.form.append("<input type='hidden' name='"+i+"'/>");
                                }
                                button.submit.form.submit();
                            }
                        })(button));
                    }

                    element.bottom.append(buttonElem);
                }

                element.box.append(element.bottom);
            } else {
                element.bottom.remove();
            }

            element.wrapper.css('background-color', options.backgroundColor);
            element.content.css('background-color', options.backgroundColor);

            // Add litebox to the DOM
            $(document.body).append(element.lightbox.show().css('opacity', 1));
            // Place placeholder at where target used to be
            element.placeholder.insertAfter(target);
            // Add target into litebox's content
            target.appendTo(element.content);

            if (options.preLoading) {
                element['loader'].show();
                target.hide();
            } else {
                target.show();
            }

            var dimensions = _.calculateContent(options);

            if(dimensions){
                _.centerLitebox(dimensions);
            }

            if (options.closeOnOverlay) {
                element.lightbox.off('click', $.proxy(_.tryClose, this))
                    .on('click', $.proxy(_.tryClose, this));
            }

            options.onOpen.apply(target, [this.current]);

            this.isOpen = true;
        },

        close: function() {
            if (!this.isOpen) return;

            var that = this;
            var target = this.current.target;
            var options = this.current.options;

            element.box.animate({
                'margin-top': (parseInt(element.box.css('margin-top')) + 30) + "px",
                'opacity': 0
            }, 200, function() {
                target.insertAfter(element.placeholder).hide();
                element.placeholder.remove();

                element.lightbox.fadeOut(200);

                options.onClose.apply(that.current.handle);
                that.isOpen = false;

                element.lightbox.remove();
            });

            this.hideMessage();
        },

        update: function(onComplete) {
            if (!this.isOpen) return;

            var that = this;
            var options = this.current.options;
            var target = this.current.target;

            var dimensions = _.calculateContent(options);

            if(dimensions){
                _.centerLitebox(dimensions, true);
            }

            if (onComplete) onComplete.apply(target, [this.current]);
        },

        showMessage: function(errorMsg, colorType) {
            var that = this;
            this.hideMessage();

            element.message
                .text(errorMsg.toString())
                .css('background-color', (colorType || '#c00'))
                .animate({
                        'bottom': (element.message.innerHeight() * -1) + 'px'
                }, 200);

            var duration = this.current.options.messageDuration;

            if (duration) {
                if (messageTimer) clearTimeout(messageTimer);
                messageTimer = setTimeout(function() {
                    that.hideMessage();
                }, duration);
            }
        },

        hideMessage: function() {
            element.message.animate({
                'bottom': '5px'
            }, 200);
        },

        showBtnLoader: function(btnLabel){
                var btns = element.bottom.find('.litebox-btn');

                btns.each(function(){
                        if($(this).text().toLowerCase() == btnLabel.toLowerCase()){
                                if($(this).find('i.icon-spinner').length == 0)
                                                $(this).append('<i class="icon-spinner icon-spin"></i>');
                        }
                });
        },

        hideBtnLoader: function(btnLabel){
                var btns = element.bottom.find('.litebox-btn');

                btns.each(function(){
                        if($(this).text().toLowerCase() == btnLabel.toLowerCase()){
                                        $(this).find('i.icon-spinner').remove();
                        }
                });
        },

        showOverlayLoader: function(){
                element.loader.show();
        },

        hideOverlayLoader: function(){
                element.loader.hide();
        },

        finishLoading: function() {
            element.loader.hide();
            this.current.target.show();
            this.update();
        },

        setTitle: function(title) {
            this.defaults.title = title;
        }

    });


})( jQuery, window, document ); 