<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
session_start();
require("config.php");
require("functions.php");
$headers = getallheaders(); 
if(!isset($headers["X-Requested-With"]) || $headers["X-Requested-With"] != "XMLHttpRequest") { 
	die();
}

if(isset($_POST['mode']) && $_POST['mode'] == "unload") {
	removeSession();
	session_regenerate_id();
	session_destroy();	
	die();
}

$errors = array();
$nicks = array();
$newmsgs = array();
$topic = array();

$isauto = (isset($_POST['mode']) && $_POST['mode'] == "auto");

$nicks = getNicks();
if(!isset($_POST['nick']))
	$_POST['nick'] = "";

$nick = dbEscape($_POST['nick']);

if(!isset($_SESSION['nick']) || $nick != $_SESSION['nick'] && !$isauto)
{
	if(!validateNick($nick))
		$errors['nick'] = "Invalid nick!";

	else if(!nickAvailable($nick, $nicks))
		$errors["nick"] = "That nick is already in use";

	else
		updateSession($nick);
}

if(isset($_POST['message']) && strlen($_POST['message']) > 0 && empty($errors)) {
	$message = dbEscape($_POST['message']);
	$nick = dbEscape($_POST['nick']);
	$msg = postMsg($nick, $message);
}

$lastseen = intval($_POST['lastseen']);
$topic = dbFirstResultAssoc("SELECT * FROM topic ORDER BY id DESC");

print json_encode(array("topic" => $topic, 
						"msgs" => getMsgs($lastseen), 
						"errors" => $errors, 
						"sessid" => sessionExists(session_id()),
						"nicks" => $nicks,
					));
