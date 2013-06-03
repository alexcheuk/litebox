(function($){

	var template = {
		lightbox : '<div class="litebox-overlay"><div class="litebox"><div class="litebox-wrapper"><div class="litebox-content"></div></div><div class="litebox-message"></div></div></div>',
		title: '<div class="litebox-title"></div>',
		bottom: '<div class="litebox-bottom"></div>',
		placeholder: '<div class="litebox-placeholder"></div>'
	}

	var element = {
		lightbox : $(template.lightbox),
		title : $(template.title),
		bottom : $(template.bottom),
		placeholder: $(template.placeholder)
	}

	var isOpen = false,
		messageTimer = null;

	element['content'] = element.lightbox.find('.litebox-content');
	element['box'] = element.lightbox.find('.litebox');
	element['message'] = element.lightbox.find('.litebox-message');

	var _ = {
		tryClose: function(e){
			if(e.target.className=="litebox-overlay"){
				$.litebox.close();
			}
		},
	}

	$.fn.litebox = function(opt) {
		return this.each(function() {
			$(this).data('litebox', {
				target: $(this).attr('href'),
				options: opt
			}).on('click', function(e){
				$.litebox.trigger(this);
			});
		});

	};

	$.litebox = function(){
		$.litebox.open.apply(this, arguments);
	};

	$.extend($.litebox, {
		isOpen: false,
		current: {},
		defaults : {
			width: "auto",
			height: "auto",
			target: null,
			closeOnOverlay: true,
			messageDuration: 5000,
			buttons: null,
			title: null,

			beforeOpen: function(){},
			onOpen: function() {},
			onClose: function() {}
		},

		trigger: function(handle){
			if(this.isOpen) return;

			var data = $(handle).data('litebox');
			this.current.handle = handle;

			this.open(data.target, data.options);
		},

		open: function(target, opts){
			if(this.isOpen || !target) return;

			var options = this.current.options = $.extend({}, this.defaults, opts);
				options.beforeOpen.apply(this.current.handle);
				options = this.current.options = $.extend({}, this.defaults, opts);

			var target = this.current.target = target instanceof jQuery ? target : $(target);
			
			var width = (options.width == "auto") ? target.innerWidth() : options.width;
			var height = (options.height == "auto") ? target.innerHeight() :options.height;

			var title = options.title || this.current.handle.title;

			if(title){
				element.box.prepend(element.title.html(title));
			}else{
				element.title.remove();
			}

			if(options.buttons){
				element.bottom.empty();

				for(var i = 0, len = options.buttons.length; i < len; i++){
					var button = options.buttons[i];
					var buttonElem = $('<div class="litebox-btn">'+button.label+'</div>');
					if(button.color){
						buttonElem.css('background-color', button.color);
					}
					buttonElem.on('click', $.proxy(button.callback, this));
					element.bottom.append(buttonElem);
				}

				element.box.append(element.bottom);
			}else{
				element.bottom.remove();
			}

			$(document.body).append(element.lightbox.show());

			var calcHeight = height+32+element.title.innerHeight()+element.bottom.innerHeight(),
				calcWidth = (width+32);

			element.box
				.css('width',calcWidth+'px')
				.css('margin-left','-'+(calcWidth/2)+'px')
				.css('height',calcHeight+'px')
				.css('margin-top','-'+((calcHeight/2)+20)+'px')
				.css('opacity', 0);

			element.content
				.css('height', height+'px')
				.css('width', width+'px');
			
			element.placeholder.insertAfter(target);
			target.appendTo(element.content).show();

			element.box.animate({
				'margin-top' : '-'+(calcHeight/2)+'px',
				'opacity' : 1
			}, 200);

			if(options.closeOnOverlay){
				element.lightbox
					.off('click', $.proxy(_.tryClose, this))
					.on('click', $.proxy(_.tryClose, this));
			}

			this.isOpen = true;
		},

		close: function(){
			if(!this.isOpen) return;

			var that = this;
			var target = this.current.target;
			var options = this.current.options;

			element.box.animate({
				'margin-top' : (parseInt(element.box.css('margin-top')) + 30) + "px",
				'opacity' : 0
			}, 200, function(){
				target.insertAfter(element.placeholder).hide();
				element.placeholder.remove();

				element.lightbox.fadeOut(200);

				options.onClose.apply(that.current.handle);
				that.isOpen = false;
			});

			this.hideMessage();
		},

		update: function(){
			if(!this.isOpen) return;

			var that = this;
			var options = this.current.options;
			var target = this.current.target,
				width = target.innerWidth(),
				height = target.innerHeight();

			var calcHeight = height+32+element.title.innerHeight()+element.bottom.innerHeight(),
				calcWidth = (width+32);

			element.box.animate({
				'width' : calcWidth+'px',
				'margin-left' : '-'+(calcWidth/2)+'px',
				'height' : calcHeight+'px',
				'margin-top' : '-'+(calcHeight/2)+'px'
			}, 200);

			element.content
				.css('height', height+'px')
				.css('width', width+'px');
		},

		showMessage: function(errorMsg, colorType){
			var that = this;
			this.hideMessage();

			element.message.text(errorMsg.toString()).animate({
				'bottom' : (element.message.innerHeight()*-1) + 'px'
			},200);

			var duration = this.current.options.messageDuration;

			if(duration){
				if(messageTimer) clearTimeout(messageTimer);
				messageTimer = setTimeout(function(){
					that.hideMessage();
				}, duration);
			}
		},

		hideMessage: function(){
			element.message.animate({
				'bottom' : 0 + 'px'
			},200);
		},

		setTitle: function(title){
			this.defaults.title = title;
		}

	});



})(jQuery);