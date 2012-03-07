<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Chatter</title>
	<script type=text/javascript src=http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js></script>	
	<script src="js/jqchat.js" type="text/javascript"></script>
	<link href="css/jqchat.css" rel="stylesheet" />
</head>
<body>
	<div class=loading></div>
	<div id=autoupdate>
	    <input type="checkbox" class="autobox" name="autoupdate" />
		<label for="autoupdate">Auto-refresh?</label>
	</div>
	<header id="topic"></header>
	<div id="chatarea">
		<form id=register> 
		    <input type="text" class="regnick" placeholder="Choose a nick"> 
		    <input type="submit" class="submit" value="Start chatting!" name="" />
		</form>
		<ul>
		</ul>
	</div>
	<form id=chatcontrols>
		<input type="text" class="nick" placeholder="Nickname" />
		<input type="text" class="message" placeholder= "Your message" />
		<input type="submit" class="submit" value="Update" />
	</form>
</body>
</html>
