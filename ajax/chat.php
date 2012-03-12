<?php
header("Content-Type: application/json; charset=utf-8");
/* header("Access-Control-Allow-Origin: *"); */ 
session_start();
require("functions.php");
require("config.php");
$sessid = session_id();
if(isset($_POST['mode']) && $_POST['mode'] == "unload") {
	removeSession();
	session_regenerate_id();
	session_destroy();
	die();
}
else
	session_write_close();

$headers = getallheaders();  
if(!isset($headers["X-Requested-With"]) || $headers["X-Requested-With"] != "XMLHttpRequest") {  
	die(); 
} 
if(isset($_POST['mode'])) { 
	switch($_POST['mode']) {
	case "init": 
		print json_encode(array("nicks" => getNicks(), "topic" => getTopic())); 
		flush(); 
		die(); 
		break; 

	case "register": 
		$nick = dbEscape($_POST['nick']);
		updateSession($nick); 
		if(dbRowCount("SELECT * FROM chatlog") == 0)
			dbQuery("INSERT INTO chatlog SET type='date'");
		dbQuery("INSERT INTO chatlog (nick, type) VALUES('$nick','join')");
		die(); 
		break; 
	default: 
		die(); 
		break; 
	} 
} 

if(!isset($_POST['direction']))
	die();

switch($_POST['direction']) {
	case "us":
	$nick = dbEscape($_POST['nick']);
	$message = dbEscape($_POST['message']);
	postMsg($nick, $message);
	die();
	break;

	case "ds":
	$lastseen = intval($_POST['lastseen']);
	downstream($lastseen);
	die();
	break;
}
