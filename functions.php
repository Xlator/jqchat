
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
	$nicksresult = dbResultArray("SELECT nick FROM sessions WHERE sessionid != '".session_id()."'");
	$nicks = array();
	foreach($nicksresult as $n)
		$nicks[] = $n['nick'];
	return $nicks;
}

function nickAvailable($nick) { // Takes nick and nick list, returns true if our chosen nick is available
	return !dbResultExists("SELECT nick FROM sessions WHERE nick = '$nick' AND sessionid !='".session_id()."'");
}

function sessionExists($sessionid) {
	return (bool) dbFirstResult("SELECT nick FROM sessions WHERE sessionid='$sessionid'");
}

function updateSession($nick) { // Takes nick, registers or updates session in db and $_SESSION
	if(!sessionExists(session_id())) 
		dbQuery("INSERT INTO sessions (sessionid, nick) VALUES ('".session_id()."','$nick')");
	
	else 
		dbQuery("UPDATE sessions SET nick='$nick' WHERE sessionid='".session_id()."'");
	
	$_SESSION['nick'] = $nick;
}

function removeSession() {
	return (bool) dbQuery("DELETE FROM sessions WHERE sessionid='".session_id()."'");
}

function getMsgs($lastseen) { // Takes the ID of the last seen post, returns array of posts (including last seen for comparison purposes)

// If the log was empty, insert a blank row to avoid losing the first result when comparing dates.
	if($lastseen == -1) 
		$blank = "UNION SELECT '','','',''";
	else
		$blank = "";

	return dbResultArray("SELECT * FROM (
		SELECT * FROM chatlog WHERE id >= $lastseen ORDER BY id DESC LIMIT 0,".MAX_POSTS."
	) AS x $blank ORDER BY id ASC"); // Only select the last MAX_POSTS posts (defined in config.php)
}

function postMsg($nick, $message) {
	if(preg_match("#^/topic (.*)#", $message, $topic)) 
		return dbQueryId("INSERT INTO topic (topic, setby) VALUES ('$topic[1]','$nick')");
		
	return dbQueryId("INSERT INTO chatlog (nick, message) VALUES ('$nick','$message')");	
}
