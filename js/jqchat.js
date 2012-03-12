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
			// focus the nick input upon page load
			var nickreginput = $('input.regnick');
			nickreginput[0].focus();
			
			$('form#chatcontrols').hide(); // Hide the chat form
			$('form#register').show().children("label").hide().end()
			.children(".regsubmit").on("click", function(e) {
				e.preventDefault();
				nick = nickreginput.val();

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
					Chat.submitConditions("noTextAuto","on");
					messagebox.focus();
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
			
		 	if(nickchange != null) {
				if(nickchange[1].validateNick() && nickchange[1].nickAvailable() && nickchange[1] != nick)
					nickbox.val(nickchange[1]);
				else {
					message = "";
				}					
			}
			// console.log(message);
			if(message == "/names") {
				nicklist = Chat.nicks.slice(0); // Copy the nicklist
				nicklist.push(nick);
				nicklist.sort();
				$('<li />').text("Users: "+nicklist.join(", ")).addClass("status").appendTo('#chatarea ul');
				chatarea.scrollBottom();
				message = "";
			}

			if(message.split(" ")[0] in ['/quit','/join','/names']) {
				message = "";
			}

			if (message != "" && message.trim() != "") {
				Chat.message = message;	// Make the message accessible to other methods
				Chat.myMessages.push(message);
				Chat.send(nick, message);

			}
			messagebox.val("");
			
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
						rowtext = "is now known as " + message.message;
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
			if(Chat.autoscroll)
				chatarea.scrollBottom();
		},

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
		
		submitConditions: function(condition, action) {
			if(!Chat.conditionSwitch) { Chat.conditionSwitch = new Array; }
			submit = $('input.submit');
			if(Chat.conditionSwitch.length > 0) {
				for(i=0;i<Chat.conditionSwitch.length;i++) {
					if(Chat.conditionSwitch[i] == condition) {	

						if(action == "off") {
							// console.log("Submit conditions: " +condition + " off");
							Chat.conditionSwitch.remove(i);
							if(Chat.conditionSwitch.length == 0)
								submit.prop('disabled', false);
							return true;
						}

						else if(action == "on") {
							// console.log("Submit conditions: " +condition + " already on");
							return false;
						}
					}
				}
			}
			if(action == "on") {
				// console.log("Submit conditions: " +condition + " on");
				Chat.conditionSwitch.push(condition);
				submit.prop('disabled',true);
				return true;
			}
			else if(action == "off") {
				// console.log("Submit conditions: " +condition + " already off");
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
	Chat.myMessages = new Array;
	Chat.myMsgIndex = -1;

	
	submit.on('click', function (e) {
		e.preventDefault();
		Chat.update(); // Send our message (if any) and update the page
	});
	
	messagebox.on('keyup', function() { // Change submit button text when a message is entered
		// console.log($(this).val().trim());
		if($(this).val().trim().length > 0) { 
			Chat.submitConditions("noTextAuto", "off");
		}
		else { 
			Chat.submitConditions("noTextAuto", "on");
		}
	})

	.on('keydown', function(e) { // Allows browsing through message history with up/down arrows

		if(Chat.myMessages.length != 0) {

			if(e.keyCode == 38) { // Up arrow
				if(Chat.myMsgIndex == -1) 
					Chat.myMsgIndex = Chat.myMessages.length-1; // Get last message id
				else if(Chat.myMsgIndex != 0)
					Chat.myMsgIndex--; // Move back in the message history
				messagebox.val(Chat.myMessages[Chat.myMsgIndex]); // Insert message into message input
			}

			if(e.keyCode == 40) { // Down arrow
				if(Chat.myMsgIndex != Chat.myMessages.length) {
					Chat.myMsgIndex++; // Get next message id
					messagebox.val(Chat.myMessages[Chat.myMsgIndex]);
				}
				else 
					messagebox.val(""); // Clear the input when we go past the end of the history
				
			}
		}
	});
	
	nickbox.on('focus', function(e) {
		if($(this).val().validateNick() && $(this).val().nickAvailable())
			Chat.lastvalidnick = $(this).val(); // Store the last valid nick
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
			if($this.val() != Chat.lastvalidnick) 
				Chat.send(Chat.lastvalidnick, '/nick '+$this.val());
		}
	});

	Chat.autoscroll = true;
	chatarea.on('scroll', function() {
		$this = $(this);
		Chat.autoscroll = Boolean($this.scrollTop() > $this.prop('scrollHeight') - $this.height() - 25);
		// console.log(Chat.autoscroll);
	});

// ### Delete session on browser/tab close or leaving the page
	$(window).on('unload', function() { 
		$.ajax({
			async: false, // Needed to make the request fire
			data: { mode:  "unload" }
		});
	});
});
