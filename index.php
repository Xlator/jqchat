<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
	<title>Chatter - <?php print $_SERVER['HTTP_HOST'] ?></title>
	<script type=text/javascript src=http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js></script>	
	<script src="js/jqchat.js" type="text/javascript"></script>
	<link href="css/jqchat.css" rel="stylesheet" />
	<!--[if IE]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
</head>
<body>
	<header id="topic"></header>
	<div id="chatarea">
	<div class=loading></div>
		<form id=register> 
		    <input type="text" class="regnick" name="regnick" placeholder="Choose a nick"> 
		    <input type="submit" class="regsubmit" value="Start chatting!" name="" /><br />
			<label for="regnick" name="regInvalidNick" class="regerror">Invalid nick! 3-10 characters, A-Za-z0-9^_-</label>
			<label for="regnick" name="regNickTaken" class="regerror">Nick already in use!</label>
		</form>
		<ul>
		</ul>
	</div>
	<form id=chatcontrols>
		<input type="text" class="nick" placeholder="Nickname" name="nick" />
		<input type="text" class="message" placeholder= "Your message" />
		<input type="submit" class="submit" value="Send" />
	</form>
	
<div id=nickerrors>
	<span name="invalidNick" class="nickerror">Invalid nick! 3-10 characters, A-Za-z0-9^_-</span>
	<span name="nickTaken" class="nickerror">Nick already in use!</span>
</div>
</body>
</html>
