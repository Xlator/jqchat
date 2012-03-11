$.fn.scrollBottom = function()
{
	$(this).scrollTop($(this).prop('scrollHeight') - $(this).height());
	return($(this));
} 

String.prototype.validateNick = function() {
	return Boolean(this.match(/^[A-Za-z0-9\-_^]{3,10}$/));
}

String.prototype.nickAvailable = function() {
	return Boolean($.inArray(this.toString(), Chat.nicks) === -1);
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
}

$(document).ready(function() {
// Set up defaults for AJAX requests
	$.ajaxSetup({
		type: "POST",
		dataType: "json",
		url: "ajax/chat.php",
	})

	Chat = { 
		lastseen: -1,
// ### Initialise chat
		init: function() {
			$.ajax({
				data: {
				mode: "init",
				},
				success: function(response) {
					if(response.topic.length > 0)
						$('header#topic').text(response.topic[0].topic);
					Chat.nicks = response.nicks;
					Chat.regform();
				}
			});
		},

// ### Session registration method
		register: function(nick) {
			$.ajax({data: {
				nick: nick,
				mode: "register",
				}
			});
		},

// ### Show and handle the registration form
		regform: function() {
			$('form#chatcontrols').hide(); // Hide the chat form
			$('form#register').show().children("label").hide().end()
			.children(".regsubmit").on("click", function(e) {
				e.preventDefault();
				nick = $('input.regnick').val();

				if(!nick.validateNick()) {
					$('label.regerror').hide();
					$('label[name=regInvalidNick]').show();
				}

				else if(!nick.nickAvailable()) {
					$('label.regerror').hide();
					$('label[name=regNickTaken]').show();
				}
				
				else {
					$(this).parent().hide();
					$('input.nick').val(nick);
					Chat.register(nick);
					$('form#register').hide();
					$('form#chatcontrols').show();
					Chat.poll();
				}
			});
		},

// ### Long polling method
		poll: function() {
			$.ajax({
				data: {
					direction: "ds",
					lastseen: Chat.lastseen,
				},

				complete: function(response) {
					if(response.responseText.length > 2) {
						resp = $.parseJSON(response.responseText);

						if(resp != null) {
							msgs = resp.msgs;
							Chat.lastseen = msgs[msgs.length-1].id;
							Chat.insert(resp);
						}

					}
					Chat.poll();
				}
			});
		},
			
			
		
// ### Message send method
		send: function(nick, message)
		{
			$.ajax(
			{
				data: 
				{
					nick: nick,
					message: message,
					direction: "us",
				},
				async: true,
			});
		},

// ### Page update method
		 update: function(mode) { 
		 	var nick = $('input.nick').val(),
		  		message = $('input.message').val(),
		 		nickchange = message.match(/^\/nick (.*)/);
			
		 	if(nickchange != null)
		 		nickbox.val(nickchange[1]);

			if(message.split(" ")[0] in ['/quit','/join',]) {
				messagebox.val("");
				message = "";
			}

			else {
				Chat.message = message;	// Make the message accessible to other methods
				Chat.send(nick, message);
				messagebox.val("");
			}
			
		 },

// ### Message insertion method			
		insert: function(response) {
			Chat.nicks = response.nicks;
			Chat.msgs = response.msgs;

			
			$.each(response.msgs, function(index, message) { // Iterate over the messages
				var datetime = message.timestamp.split(" "), // Split date and time
				date = datetime[0],
				time = datetime[1];
				
				rownick = message.nick;
				rowclass = "status";
				switch(message.type) {
					case "date":
						rowclass = "date";
						rowtext = "Day changed to " + date;
						rownick = "";
						break;
					case "nick":
						rowtext = "is now known as " + message.text;
						break;
					case "topic":
						rowtext = "changed the topic to \”"+message.message+"\"";
						if(Chat.lastseen != -1) {
							$('header#topic').text(message.message);
						}
						break;
					case "join":
						rowtext = "has joined";
						break;
					case "quit":
						rowtext = "has quit";
						break;
					case "emote":
						rowclass = "emote";
						rownick = "* "+rownick;
						rowtext = message.message;
						break;
					default:
						rowclass = undefined;
						rowtext = message.message;
						break;
				}

				li = Chat.buildLine(rowtext, time, rownick, message.id, rowclass);
				// Build the message <li> and add it to the page	
				chatarea.children('ul').append(li);
			});
		},
		// 		if(date != lastdate) { // If the date has changed, add an extra li with a status message
		// 			$('<li />', { text: "Day changed to " + date }).addClass("date").insertBefore(li);	
		// 		}

		// 		lastdate=date; // Update the lastdate
		// 		lastmsgid=message.id // Cache the id of the message
		// 	});


		// 	// if(Chat.mode != "auto") { // If we aren't auto-refreshing
		// 	// 	submit.val("Update"); // Reset the submit button text
		// 	// 	// chatarea.prop('scrollTop',chatarea.prop('scrollHeight')); // Scroll to the bottom
		// 	// 	if(Chat.message != "") { // Clear the message input box after submission
		// 	// 		messagebox.val("");
		// 	// 	}
		// 	// 	chatarea.scrollBottom();
		// 	// }
		// 	// if(Chat.lastseen == -1) { // Remove the loading screen and show the content on page load
		// 	// 	$('body').children().show();
		// 	// 	$('div.loading').remove();	
		// 	// }

		// 	if(Chat.autoscroll)
		// 		chatarea.scrollBottom();
		// },

// // ### Chat line builder method
		buildLine: function(message,time,nick,id,liclass) {
			if(liclass == "date") 
				li = $('<li />').text(message);

			else {
				li = $('<li />').attr("data-msgid", id);
				$('<span />', { text: nick }).addClass("nick").prependTo(li);
				$('<span />', { text: time } ).addClass("time").prependTo(li);
				$('<p />', { text: message }).appendTo(li);	
			}
				if(liclass != undefined) // Add a class to the li if we sent one as an argument
					li.addClass(liclass);
			return li;
		},

// // ### Chat registration/login method
		// register: function() {
		// 	Chat.send().done(function(response) { Chat.nicks = response.nicks; })

		// 	var forms = $('form#chatcontrols').hide(),
		// 		regform = $('form#register');
		// 	$('label.regerror').hide();
		// 	regform.show().children('.regsubmit').on('click', function(e) {
		// 		e.preventDefault();
		// 		nick = $('input.regnick').val();

		// 		if(!nick.validateNick()) {
		// 			$('label.regerror').hide();
		// 			$('label[name=regInvalidNick]').show();
		// 		}	

		// 		else if(!nick.nickAvailable()) {
		// 			$('label.regerror').hide();
		// 			$('label[name=regNickTaken]').show();
		// 		}

		// 		else {
		// 			$(this).parent().hide();
		// 			$('input.nick').val(nick);
		// 			if($('input.autobox').prop('checked') == true) 
		// 				Chat.poll();
		// 			forms.show();	
		// 		}
		// 	});
		// },
		
		submitConditions: function(condition, action) {
			if(!Chat.conditionSwitch) { Chat.conditionSwitch = new Array; }
			submit = $('input.submit');
			if(Chat.conditionSwitch.length > 0) {
				for(i=0;i<Chat.conditionSwitch.length;i++) {
					if(Chat.conditionSwitch[i] == condition) {	

						if(action == "off") {
							console.log("Submit conditions: " +condition + " off");
							Chat.conditionSwitch.remove(i);
							if(Chat.conditionSwitch.length == 0)
								submit.prop('disabled', false);
							return true;
						}

						else if(action == "on") {
							console.log("Submit conditions: " +condition + " already on");
							return false;
						}
					}
				}
			}
			if(action == "on") {
				console.log("Submit conditions: " +condition + " on");
				Chat.conditionSwitch.push(condition);
				submit.prop('disabled',true);
				return true;
			}
			else if(action == "off") {
				console.log("Submit conditions: " +condition + " already off");
				return false;
			}
		},
	}


	Chat.init();
	// Input fields
	var nickbox = $('input.nick'),
		messagebox = $('input.message'),
		submit = $('input.submit'),
		autobox = $('div#autoupdate').children('input[type=checkbox]'),
		chatarea = $('div#chatarea');
	
	$('span.nickerror').hide();
		
	// Message history for this session
	window.myMessages = new Array;
	window.myMsgIndex = -1;

	
	// if(autobox.prop('checked') == true)
	// 	Chat.autoupdate("start");
	
	// else
	// 	Chat.update();

	// autobox.on('click', function(e) {
	// 	if($(this).prop('checked') == true) {
	// 		Chat.autoupdate("start");
	// 	}
	// 	else
	// 		Chat.autoupdate("stop");
	// });

	submit.on('click', function (e) {
		e.preventDefault();
		Chat.update(); // Send our message (if any) and update the page
	});
	
	messagebox.on('keyup', function() { // Change submit button text when a message is entered

		if($(this).val().length > 0) { 
			submit.val("Send"); 
			if(autobox.prop('checked') == true) {
				Chat.submitConditions("noTextAuto", "off");
			}
		}
		else { 
			if(autobox.prop('checked') == true) {
				Chat.submitConditions("noTextAuto", "on");
			}
			else {submit.val("Update"); }
		}
	})
	.on('keydown', function(e) { // Allows browsing through message history with up/down arrows

		if(myMessages.length != 0) {
			if(e.keyCode == 38) { // Up arrow
				if(myMsgIndex == -1) 
					window.myMsgIndex = window.myMessages.length; // Get last message id
				else if(myMsgIndex != 0)
					myMsgIndex--; // Move back in the message history
				messagebox.val(window.myMessages[window.myMsgIndex]); // Insert message into message input
			}

			if(e.keyCode == 40) { // Down arrow
				if(window.myMsgIndex != window.myMessages.length-1) {
					myMsgIndex++; // Get next message id
					messagebox.val(window.myMessages[window.myMsgIndex]);
				}
				else 
					messagebox.val(""); // Clear the input when we go past the end of the history
				
			}
		}
	});
	
	nickbox.on('focus', function(e) {
		Chat.oldnick = $(this).val(); // Store old nick to revert to if new is invalid
		console.log(Chat.oldnick);
	})
	.on('blur', function(e) {
		$this = $(this);
		$('span.nickerror').css('display','block').hide();
		if(!$this.val().validateNick()) {
			$this.addClass("invalidNick");
			$('span[name=invalidNick]').show();
			Chat.submitConditions("invalidNick", "on");
		}
		else if(!$this.val().nickAvailable()) {
			$this.addClass("invalidNick");
			$('span[name=nickTaken]').show();
			Chat.submitConditions("invalidNick", "on");
		}
		else {
			$this.removeClass("invalidNick");
			Chat.submitConditions("invalidNick", "off");
			Chat.send(Chat.oldnick, '/nick '+$this.val());
		}
	});

	Chat.autoscroll = true;
	chatarea.on('scroll', function() {
		$this = $(this);
		Chat.autoscroll = Boolean($this.scrollTop() > $this.prop('scrollHeight') - $this.height() - 25);
	});

// ### Delete session on browser/tab close or leaving the page
	$(window).on('unload', function() { 
		$.ajax({
			async: false, // Needed to make the request fire
			data: { mode:  "unload" }
		});
	});
});
