//var cookieDurationDays = 91; 
initialiseLocalData(); 
 
 /*
function setCookie(cname, cvalue, exdays) { 
	var d = new Date(); 
	d.setTime(d.getTime() + (exdays*24*60*60*1000)); 
	var expires = "expires="+ d.toUTCString();
	var maxAge = "Max-Age="+ (exdays*24*60*60).toString(); 
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"; 
} 
 
function getCookie(cname) { 
	var name = cname + "="; 
	var decodedCookie = decodeURIComponent(document.cookie); 
	var ca = decodedCookie.split(';'); 
	for(var i = 0; i <ca.length; i++) { 
		var c = ca[i]; 
		while (c.charAt(0) == ' ') { 
			c = c.substring(1); 
		} 
		if (c.indexOf(name) == 0)  
		{ 
			return c.substring(name.length, c.length); 
		} 
	} 
	return ""; 
} 
*/
 
function initialiseLocalData() { 
	//console.log('checkCookie'); 
	var searchslist = window.localStorage.getItem('searches'); 
	if (searchslist != "" && searchslist != null ) { 
		console.log('searchslist: ' + searchslist); 
		document.getElementById('searches').value = searchslist; 
	}  
	var league = window.localStorage.getItem('league'); 
	if (league != "" && league != null) { 
		console.log('league: ' + league); 
		document.getElementById('league').value = league; 
	} 
	var soundId = window.localStorage.getItem('notification-sound'); 
	if (soundId != "" && soundId != null) { 
		console.log('soundId: ' + soundId); 
		document.getElementById('notification-sound').value = soundId; 
	}  
}  
 
//------------------------------------------------------------------------------------------------------------ 
 
var sounds = {};
populateSdounds();
function populateSdounds(){
	//this function should also populate sounds with all mp3 or whatever from the ./sounds folder
	sounds['woop'] = new Audio('http://poe.trade//static/notification.mp3');
	sounds['woop'].volume = 0.5;
	sounds['gong'] = new Audio('https://web.poecdn.com/audio/trade/gong.mp3');
	sounds['gong'].volume = 0.5;
}

function soundHandler(soundId, volume){ 
	//console.log(soundId,volume );
	if(soundId != null && soundId.length > 0){
		if (sounds[soundId] == null){
			//this will cuase error if file doesnt exist but i dont know how to check if it exists
			sounds[soundId] =  new Audio('./js/sounds/' + soundId + '.mp3'); 
		}
		if (volume != null){
			sounds[soundId].volume = volume;
		}
		sounds[soundId].play();
	}
} 
