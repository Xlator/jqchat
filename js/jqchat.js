$(document).ready(function() {

// Set up defaults for AJAX requests
	$.ajaxSetup({
		type: "POST",
		dataType: "json",
		url: "chat.php"
	})

	Chat = { 

// ### Auto-update method		
		autoupdate: function(mode) {
			if(mode == "start") { 
				Chat.autoupdateloop = setInterval(
					function() { 
						Chat.update("auto"); 
					}, 2000);

				if(messagebox.val().length == 0) {
					submit.val("Send").prop("disabled",true);
				}
			}

			if(mode == "stop") {
				clearInterval(Chat.autoupdateloop);
				submit.prop("disabled",false);
				if(messagebox.val().length == 0) // Fix the submit button text situationally
					submit.val("Update");

				else
					submit.val("Send");
			}
		},
		
// ### AJAX send method
		send: function(nick, message, lastseen, mode)
		{
			return $.ajax(
			{
				data: 
				{
					nick: nick,
					message: message,
					lastseen: lastseen,
					mode: mode,
				}
			}).promise();
		},

// ### Page update method
		update: function(mode) { 

			Chat.mode = mode;

			// Grab the id of the last seen message
			Chat.lastseen = chatarea.find('li:last-child').data('msgid') || -1;

			var nick = $('input.nick').val(),
				message = $('input.message').val();

			Chat.message = message;	// Make the message accessible to other methods

			if(nick == "" && Chat.lastseen == -1) {
				Chat.register();
			}

			else // Remove the registration form if it is showing
				$('form#register').remove();

			if(message.length == 0 || mode == "auto") // If there is no message, just update the page
				var message = "";

			else if(nick.length < 3) { // If nick is too short, cancel submission and alert the user
				alert("Your nickname must be at least 3 characters long");
				var message = "";
			}	

			else {
				window.myMessages.push(message); // Add the message to our history
			}

			// Send the request to the server; initiate insertion when done
			this.chat = Chat.send(nick, message, Chat.lastseen, mode).done(this.insert);
			
		},

// ### Message insertion method			
		insert: function(response) {

			if(response.errors.nick) { // If the AJAX request returned any errors...
				nickbox.val(""); 
				// alert(response.errors.nick);
				return false;
			}

			// Get the date of the last message seen before updating
			lastdate = response.msgs[0].timestamp.split(" ")[0]; 
			response.msgs.splice(0,1); // Remove the message from the array
			
			$.each(response.msgs, function(index, message) { // Iterate over the messages
				var datetime = message.timestamp.split(" "), // Split date and time
				date = datetime[0],
				time = datetime[1];

				li = Chat.buildLine(message.message,time,message.nick,message.id);
				// Build the message <li> and add it to the page	
				chatarea.children('ul').append(li);

				if(date != lastdate) { // If the date has changed, add an extra li with a status message
					$('<li />', { text: "Day changed to " + date }).addClass("date").insertBefore(li);	
				}

				lastdate=date; // Update the lastdate
				lastmsgid=message.id // Cache the id of the message
			});

			topic = $('header#topic');
			if(topic.text() != response.topic.topic) { // If the topic text has changed...
				$('header#topic').text(response.topic.topic); // Update the topic ...

				if(Chat.lastseen != -1) { // ... and add a topic change message to the chat stream (unless the page is currently blank)
					topicmsg = Chat.buildLine("changed the topic to \”"+response.topic.topic+"\"",
											  response.topic.timestamp.split(" ")[1], response.topic.setby,
											  lastmsgid, "status");
					chatarea.children('ul').append(topicmsg);
				}
			}

			if(Chat.mode != "auto") { // If we aren't auto-refreshing
				submit.val("Update"); // Reset the submit button text
				chatarea.prop('scrollTop',chatarea.prop('scrollHeight')); // Scroll to the bottom
				if(Chat.message != "") { // Clear the message input box after submission
					messagebox.val("");
				}
			}
			if(Chat.lastseen == -1) { // Remove the loading screen and show the content on page load
				$('body').children().show();
				$('div.loading').remove();	
			}
		},

// ### Chat line builder method
		buildLine: function(message,time,nick,id,liclass) {
			li = $('<li />').attr("data-msgid", id);
			$('<span />', { text: nick }).addClass("nick").prependTo(li);
			$('<span />', { text: time } ).addClass("time").prependTo(li);
			$('<p />', { text: message }).appendTo(li);	

			if(liclass != undefined) // Add a class to the li if we sent one as an argument
				li.addClass(liclass);

			return li;
		},

// ### Chat registration/login method
		register: function() {
			var forms = $('form').add('#autoupdate').hide(),
				regform = $('form#register');

			regform.show().children('.submit').on('click', function(e) {
				e.preventDefault();
				nick = $('input.regnick').val();
				if(Chat.validateNick(nick)) {
					$('input.nick').val(nick);
					$('div#autoupdate').children('input[type=checkbox]').click();
					Chat.autoupdate("start");
					forms.show();	
				}
			});
		},
		validateNick: function(nick) {
			return Boolean(nick.match(/^[A-Za-z0-9\-_^]{3,10}$/));
		}
	}	


	// Input fields
	var nickbox = $('input.nick'),
		messagebox = $('input.message'),
		submit = $('input.submit'),
		autobox = $('div#autoupdate').children('input[type=checkbox]'),
		chatarea = $('div#chatarea');
	
	// Message history for this session
	window.myMessages = new Array;
	window.myMsgIndex = -1;

	Chat.update();
	
	if(autobox.prop('checked') == true) {
		Chat.autoupdate("start");
	}

	autobox.on('click', function(e) {
		if($(this).prop('checked') == true) {
			Chat.autoupdate("start");
		}
		else
			Chat.autoupdate("stop");
	});

	submit.on('click', function (e) {
		e.preventDefault();
		Chat.update(); // Send our message (if any) and update the page
	});
	
	messagebox.on('keyup', function() { // Change submit button text when a message is entered

		if($(this).val().length > 0) { 
			submit.val("Send"); 
			if(autobox.prop('checked') == true) {
				submit.prop('disabled',false);
			}
		}
		else { 
			if(autobox.prop('checked') == true) {
				submit.prop('disabled',true);
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

// ### Delete session on browser/tab close or leaving the page
	$(window).on('unload', function() { 
		$.ajax({
			async: false, // Needed to make the request fire
			data: { mode:  "unload" }
		});
	});
});
