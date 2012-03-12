<?php

/* --------- Database connection/query helper functions --------- */

function dbConn() { // Returns database link
	return mysqli_connect(DBHOST,DBUSER,DBPASS,DBNAME);
}

function dbQuery($query) { // Returns result of query, logs error and returns false on failure
	$db = dbConn();
	$result = mysqli_query($db,$query);
	if($result !== false) {
		return($result);
	}
	error_log("MySQL Query Error: " . mysqli_error($db)); 
	return(false);
}

function dbQueryId($query) { // Returns insert id of query
	$db = dbConn();
	$result = mysqli_query($db,$query);
	if($result != false) {
		return(mysqli_insert_id($db));
	}
	error_log("MySQL Query Error: " . mysqli_error($db));
	return(false);
}


function dbFirstResult($query) { // Returns first row of query result as indexed array
	$result = dbQuery($query);
	if($result === false) { return(false); }
	$row = mysqli_fetch_array($result);
	return $row[0];
}

function dbFirstResultAssoc($query) { // Returns first row of query result as associative array
	$result = dbQuery($query);
	if($result === false) { return(false); }
	$row = mysqli_fetch_assoc($result);
	return $row;
}


function dbResultArray($query) { // Returns query result as associative array
	$result = dbQuery($query);
	if($result === false) { return(false); }
	$output = array();
	while($row = mysqli_fetch_assoc($result)) {
		$output[] = $row;
	}
	return($output);
}

function dbResultExists($query) { // Returns true if a result is found, false if it isn't
	$result = dbQuery($query);
	$row = mysqli_fetch_array($result);
	if(!empty($row)) { return(true); }
	return(false);
}

function dbRowCount($query) { // Returns the number of rows in the query result
	$result = dbQuery($query);
	if($result === false) { return(false); }
	return(mysqli_num_rows($result));
}

function dbEscape($string) { // Returns escaped string to prevent SQL injection attacks
	$db = dbConn();
	return(mysqli_real_escape_string($db,$string));
}

function dbEscapeArray($array) { // Returns escaped array to prevent SQL injection attacks
	return(array_map("dbEscape",$array));
}


/* --------- Chat functions --------- */

function validateNick($nick) { // Takes a nick, returns true if valid, else false
	return (bool) preg_match("/^[A-Za-z0-9\-_^]{3,10}$/", $nick);
}

function getNicks() { // Returns array of nicks (except our own)
	global $sessid;
	$nicksresult = dbResultArray("SELECT nick FROM sessions WHERE sessionid != '$sessid'");
	$nicks = array();
	foreach($nicksresult as $n)
		$nicks[] = $n['nick'];
	return $nicks;
}

function getTopic() { // Returns the latest topic as an array
	return dbResultArray("SELECT * FROM topic ORDER BY timestamp DESC LIMIT 0,1");
}

function nickAvailable($nick) { // Takes nick and nick list, returns true if our chosen nick is available
	global $sessid;
	return !dbResultExists("SELECT nick FROM sessions WHERE nick = '$nick' AND sessionid !='$sessid'");
}

function sessionExists($sessionid) { // Returns true if session exists in db, otherwise false
	return dbResultExists("SELECT nick FROM sessions WHERE sessionid='$sessionid'");
}

function updateSession($nick) { // Takes nick, registers or updates session in db and $_SESSION
	global $sessid;
	if(!sessionExists($sessid))
		dbQuery("INSERT INTO sessions (sessionid, nick, regtime) VALUES ('$sessid','$nick',CURRENT_TIMESTAMP())");
}
	

function removeSession() { // Removes a session from the db (used on closing/leaving the page), returns true on success
	$sessionid = session_id();
	// Insert a quit message
	dbQuery("INSERT INTO chatlog (nick, type) 
			 SELECT nick, 'quit' FROM sessions WHERE sessionid = '$sessionid'");
	return (bool) dbQuery("DELETE FROM sessions WHERE sessionid='$sessionid'");
}

function getMsgs($lastseen) { // Takes the ID of the last seen post, returns array of posts 
	return dbResultArray("SELECT * FROM chatlog WHERE id > $lastseen");
}

function postMsg($nick, $message) { // Posts a message to the chatlog
	$type = "message";
	if(preg_match("#^/topic (.*)#", $message, $topic)) {
		$type = "topic";
		$message = $topic[1];
	}

	if(preg_match("#^/me (.*)#", $message, $emote)) {
		$type = "emote";
		$message = $emote[1];
	}

	if(preg_match("#^/nick (.*)#", $message, $newnick)) {
		$type = "nick";
		$message = $newnick[1];
		var_dump(validateNick($message));
		var_dump(nickAvailable($message));
	}
		
	if(!isset($error)) {
		// If the date has changed since the last post, insert a message of type 'date' into the chatlog
		if(dbResultExists("SELECT * FROM (SELECT timestamp FROM chatlog ORDER BY timestamp DESC LIMIT 0,1) x WHERE DATE(timestamp) != CURDATE()"))
			dbQuery("INSERT INTO chatlog (type) VALUES ('date')");

		dbQuery("INSERT INTO chatlog (nick, message, type) VALUES ('$nick','$message','$type')");
	}
}

function downstream($lastseen) { // Long polling function; polls db, sleeps for 30 ms if no new data is found, then loops.
	$starttime = time();
	while(time() - $starttime < EXECTIME) {
		$result = getMsgs($lastseen);
		if(!empty($result)) {
			print json_encode(array("msgs" => $result, "nicks" => getNicks(), "topic" => getTopic()));
			die();
		}
		usleep(30000);
	}
}
