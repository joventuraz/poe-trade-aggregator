var cookieDurationDays = 91;

function setCookie(cname, cvalue, exdays) 
{
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) 
{
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) 
	{
		var c = ca[i];
		while (c.charAt(0) == ' ') 
		{
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) 
		{
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function checkCookie() 
{
	console.log('checkCookie');
	var searchslist = getCookie('searches');
	console.log(searchslist);
	if (searchslist != "") 
	{
		document.getElementById('searches').value = searchslist;
	} 
	var league = getCookie('league');
	console.log(league);
	if (league != "") 
	{
		document.getElementById('league').value = league;
	}
	var soundId = getCookie('notification-sound');
	console.log(soundId);
	if (soundId != "") 
	{
		document.getElementById('notification-sound').value = soundId;
	} 
} 

checkCookie();