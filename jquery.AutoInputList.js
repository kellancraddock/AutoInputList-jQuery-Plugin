/**
* autoinputlist - A jQuery plugin
* Description: This plugin creates faux autoinputlists
* Author: Kellan Craddock
* @argument {object} a jquery object of elements to turn into autoinputlists
* @returns false
*/

(function($) {

	//Create plugin obj
	$.fn.autoinputlist = function(options) {
		return this.each(function(i) {
			$.fn.autoinputlist.createInstance($(this), options);
		});
	}
	
	$.fn.autoinputlist.defaults = {
		dataUrl: false,
		delineator: ', '
	}
	
	//Aquire plugin instance
	$.fn.autoinputlist.createInstance = function(element, options) {
		if (element.data('autoinputlist')) {
			//Existing Instance
			return element.data('autoinputlist');
		} else {
			//New Instance
			var instance = new $.fn.autoinputlist.instance(element, options);
			element.data('autoinputlist').init(element, options);
			return element.data('autoinputlist');
		}
	}
	
	//Instance
	$.fn.autoinputlist.instance = function(element, options) {
	
		var self = this;
		this.options;
		this.element = element;
		
		//Initialize 
		this.init = function(element, options) {
			//Extend the default options obj
			self.options = $.extend({}, $.fn.autoinputlist.defaults, options);
			//Create default elements
			self.element.css({'display': 'none'});
			self.element.after('<ul class="autoinputlist"><li class="auto_input"><input type="text" name="auto_input"></li></ul>');
			self.options.autoinputlist = self.element.next('.autoinputlist');
			self.options.autoInput = self.options.autoinputlist.children('.auto_input');
			self.options.autoOutput = $('<p></p>').css({'position': 'absolute', 'left': '-9999px', 'paddingLeft': '4px', 'paddingRight': '4px'});
			self.options.autoList = $('<ul class="auto_list closed"></ul>');
			self.options.autoinputlist.after(self.options.autoList);
			
			$('body').append(self.options.autoOutput);
			
			self.options.autoinputlist.bind('click', function() {
				self.options.autoInput.children('input').focus();
			});
			//Bind keyup events
			self.options.autoInput.children('input').bind('keyup', function(e) {
				//if keycode is numeric or alphabetic
				if (e.keyCode >= 48 && e.keyCode <= 90) {
					self.setInputWidth();
					self.suggest();
				//else if keycode is delete or backspace
				} else if (e.keyCode == 46 || e.keyCode == 8) {
					if ($(this).val() == '') {
						self.options.autoList.empty().removeClass('open').addClass('closed');
					}
				} 
			});
			
			//Bind keypress events
			self.options.autoInput.children('input').bind('keypress keydown', function(e) {
				if (e.keyCode == 13 || e.keyCode == 9) {
					e.preventDefault();
					var hover  = self.options.autoList.children('li.hover');
					//If there is a match
					if (hover.length) {
						self.options.autoInput.children('input').val(self.options.autoList.children('li.hover').text());
						self.setInputWidth();
						self.addItem(self.options.autoList.children('li.hover').data('value'));
						self.updateOutput();
					} else {
						self.addItem(self.options.autoOutput.text());
						self.updateOutput();
					}
				}
			});
			
			self.options.autoInput.bind('keyup', function(e){
				//If keypress is tab or enter
				var $autoInput = $(this);
				if (e.keyCode == 13 || e.keyCode == 9) {
					
					e.preventDefault();
				//If keypress is delete or backspace
				} else if (e.keyCode == 46 || e.keyCode == 8) {
					//If the value of input is blank
					if ($autoInput.children('input').val() == '' || $autoInput.children('input').val() == undefined) {
						if ($autoInput.prev('.auto_item').hasClass('selected')) {
							$autoInput.prev('.auto_item.selected').remove();
							self.updateOutput();
						} else {
							$autoInput.prev('.auto_item').addClass('selected');
						}
					//Else just a normal backspace or delete keyup
					} else {
						self.setInputWidth();
						self.suggest();
					}
				//If keyup is arrows
				} else if (e.keyCode >= 37 && e.keyCode <= 40) {
					self.moveList(e.keyCode);
				}
			});
		}
		
		this.addItem = function(value) {
			if (self.options.autoInput.children('input').val() != '') {
				//Clear the auto list
				self.options.autoList.removeClass('open').addClass('closed').empty();
				//Remove selected class from list
				self.options.autoInput.siblings('.auto_item').removeClass('selected');
				//Take the value from the input and add it to the list
				var $li = $('<li class="auto_item">' + self.options.autoInput.children('input').val() + '</li>').data('value', value);
				var $closeBtn = $('<span>X</span>');
				
				$closeBtn.bind('click', function() {
					$(this).parent('.auto_item').remove();
					self.updateOutput();
					//Clear the auto list
					self.options.autoList.removeClass('open').addClass('closed').empty();
				});
				//Bind events to auto_item
				$li.append($closeBtn).bind('mouseover', function() {
					self.options.autoInput.siblings('.auto_item').removeClass('selected');
					$(this).addClass('selected');					
				});
				self.options.autoInput.before($li);
				self.options.autoInput.children('input').val('');
			}
		}
		
		this.setInputWidth = function() {
			var input = self.options.autoInput.children('input');
			self.options.autoOutput.text(input.val());
			input.width(self.options.autoOutput.outerWidth());
		}
		
		this.suggest = function() {
			if (self.options.dataUrl && self.options.autoOutput.text() != '') {
				$.ajax({
					url: self.options.dataUrl,
					data: 'query=' + self.options.autoOutput.text(),
					dataType: 'json',
					type: 'post', 
					success: function(returnData) {
	        			self.updateSuggestList(returnData);
	      			}
	      		});
      		}
		}
		
		this.updateSuggestList = function(data) {
			self.options.autoList.removeClass('closed').addClass('open').empty();
			$(data).each(function() {
				var item = $('<li>' + this.first_name + ' ' + this.last_name + '</li>')
					.data('value', this.email)
					.bind('mouseover', function() {
						$(this).siblings('li').removeClass('hover');
						$(this).addClass('hover');
					}).bind('click', function(){
						self.options.autoInput.children('input').val(self.options.autoList.children('li.hover').text());
						self.setInputWidth();
						self.addItem($(this).data('value'));
						self.updateOutput();
					})
				self.options.autoList.append(item);
			});
			self.options.autoList.children('li').eq(0).addClass('hover');
		}
		
		this.moveList = function(code) {
			var li  = self.options.autoList.children('li');
			var hover  = self.options.autoList.children('li.hover');
			//Move down
			if (code == 40) {
				if (hover.length) {
					hover.next('li').trigger('mouseover');
				} else {
					li.eq(0).trigger('mouseover');
				}
			//Move up
			} else if (code == 38) {
				if (hover.length) {
					hover.prev('li').trigger('mouseover');
				} else {
					li.last().trigger('mouseover');
				} 
			}
			self.options.autoInput.children('input').val(self.options.autoList.children('li.hover').text());
			self.setInputWidth();
		}
		
		//Set the value of the original input
		this.updateOutput = function() {
			var string = '';
			self.options.autoinputlist.children('.auto_item').each(function(i) {
				if (i == 0) {
					string += $(this).data('value');
				} else {
					string += self.options.delineator + $(this).data('value');
				}
			});
			self.element.val(string);
		}
		
	    //Set plugin instance to data
	    element.data('autoinputlist', this);
	}
	
})(jQuery);