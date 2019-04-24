
var lastItem = null;
var sockets = [];
var openSockets = 0;
var socketsToOpen = 0;
var maxItemsDisplayed = 300;
var allDisplayedItems = [];
var hasActiveSockets = false;
var cookieDurationDays = 91;

function ItemRequest(searchpart, listings)
{
	this.listings = listings;
	this.searchpart = searchpart;
}
function RequestManager()
{
	this.itemRequests = [];
	this.queueBox = document.getElementById('queue-count');
	this.addRequest = function(newRequest)
	{		
		var listings = newRequest.listings.length;
		var filteredListing = [];
		
		for(var i = 0; i < listings; i++)
		{
			filteredListing.push(newRequest.listings[i]);
			if(filteredListing.length == 10)
			{
				var tmpRequest = new ItemRequest(newRequest.searchpart, filteredListing);
				this.itemRequests.push(tmpRequest);		
				filteredListing = [];
			}
		}
		
		if(filteredListing.length > 0)
		{
			var tmpRequest = new ItemRequest(newRequest.searchpart, filteredListing);
			this.itemRequests.push(tmpRequest);
		}			

		this.queueBox.value = requestManager.itemRequests.length;
	}
	this.getNextItem = function()
	{
		if(this.itemRequests.length > 0)
		{
			var itemRequest = this.itemRequests.shift();
			this.queueBox.value = this.itemRequests.length;		
			var getItemUrl = 'https://www.pathofexile.com/api/trade/fetch/';	
			var itemUrl = getItemUrl + itemRequest.listings;
			itemUrl += '?query=' + itemRequest.searchpart;
			this.processItem(itemUrl, itemRequest.searchpart);			
		}
	};
	this.processItem = function (itemUrl, searchpart)
	{
		callAjax(itemUrl, addItem, searchpart);
		var soundSelect = document.getElementById('notification-sound');
		var soundId = soundSelect.value;
		if(soundId != null && soundId.length > 0)
		{
			document.getElementById(soundId).play();
		}
	};
}
var requestManager = new RequestManager();
function getItems()
{
	requestManager.getNextItem();
}
setInterval(getItems, 500);
function startSockets() 
{	
	if(hasActiveSockets)
	{
		return false;
	}
	else
	{
		hasActiveSockets = true;
		var socketCounterBox = document.getElementById('socket-count');
		socketCounterBox.classList.add('active');
		
		var league = document.getElementById('league').value;
		setCookie('league', league, cookieDurationDays);
		var socketUrl = "wss://pathofexile.com/api/trade/live/" + league + '/';
		var searchesString = document.getElementById('searches').value;
		setCookie('searches', searchesString, cookieDurationDays);
		var searches = searchesString.split(',');
		var soundId = document.getElementById('notification-sound').value;
		setCookie('notification-sound', soundId, cookieDurationDays);
		
		for(var i = 0; i < searches.length; i++)
		{
			socketsToOpen = searches.length;
			var search = searches[i].trim();
			var tmp = socketUrl + search;
			var searchSocket = new WebSocket(tmp);
			searchSocket.searchpart = search;
			sockets.push(searchSocket);
			searchSocket.onopen = function(event)
			{
				openSockets++;
				document.getElementById('socket-count').value = openSockets + '/' + socketsToOpen;
			};
			searchSocket.onerror = function(event)
			{
				var errorMsg = this.searchpart + ' has experienced an error.';
				alert(errorMsg);
			};
			searchSocket.onclose = function(event)
			{
				openSockets--;
				if(openSockets < 1)
				{
					document.getElementById('socket-count').value;
				}
				document.getElementById('socket-count').value = openSockets + '/' + socketsToOpen;
			};
			searchSocket.onmessage = function (event) 
			{
				var json = JSON.parse(event.data);
				var itemRequest = new ItemRequest(this.searchpart,json.new);
				requestManager.addRequest(itemRequest);
			}
		}	
	}
} 

function callAjax(url, callback, param){
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            callback(xmlhttp.responseText, param);
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function clearDisplay()
{
	var display = document.getElementById('display-window');
	display.innerHTML = '';
	allDisplayedItems = [];
	lastItem = null;
}

function stopSockets() 
{
			
	if(sockets != null && sockets.length > 0)
	{
		for(var i = 0; i < sockets.length; i++)
		{
	  		sockets[i].close();
		}
	}	
	requestManager.itemRequests = [];
	document.getElementById('queue-count').value = requestManager.itemRequests.length;
	var socketCounterBox = document.getElementById('socket-count');
	socketCounterBox.classList.remove('active');
	hasActiveSockets = false;
} 

var frameType = ["Normal","Magic","Rare","Unique","Gem","Currency","DivinationCard","Quest","Prophecy","Relic"];

function addItem(data, searchpart) 
{
	var json = JSON.parse(data);
	var results = json.result;

	var display = document.getElementById('display-window');
	for(var resultIndex = 0; resultIndex < results.length; resultIndex++)
	{	
		var result = results[resultIndex];

		var whisperButton = document.createElement("label");
		whisperButton.classList.add('whisper-button');
		
		whisperButton.innerHTML = 'Whisper';
		var whisperText = document.createElement("input");
		whisperText.btn = whisperButton;
		whisperText.value = result.listing.whisper;
		whisperText.classList.add('whisper');
		whisperText.onclick = function()
		{
			this.btn.classList.add('copied');
			 var copyText = this;
			 copyText.select();
			 document.execCommand("copy");
			 var whisperMsg = document.getElementById('whisper-message');
			 whisperMsg.classList.add('active');
			 
			 setTimeout(function(){whisperMsg.classList.remove('active');}, 500);
			 
		};
		if(!(typeof result.item.note === 'undefined'))
		{
			whisperButton.title = result.item.note;
		}
		whisperButton.append(whisperText);

		if(result.listing.account.name)
		{
			var profileLink = document.createElement('a');
			profileLink.href = 'https://www.pathofexile.com/account/view-profile/' + result.listing.account.name;
			profileLink.appendChild(document.createTextNode(result.listing.account.name));
			profileLink.target = '_blank';
		}

		if(searchpart != null)
		{
			var searchLink = document.createElement('a');
			var league = document.getElementById('league').value;
			searchLink.href = 'https://www.pathofexile.com/trade/search/' + league + '/' + searchpart;
			searchLink.appendChild(document.createTextNode(searchpart));
			searchLink.target = '_blank';
		}

		new_row = document.createElement('div');
		new_row.appendChild(render_item(result.item))
		new_row.appendChild(display_item(result.item))
		new_row.appendChild(buildCopyButton('Whisper', result.listing.whisper));
		new_row.appendChild(buildCopyButton('Copy Item', atob(result.item.extended.text)));
		new_row.appendChild(profileLink)
		new_row.appendChild(searchLink)



		display.insertBefore(new_row, lastItem);
		lastItem = new_row;
		
		allDisplayedItems.push(lastItem);
		if(allDisplayedItems.length > maxItemsDisplayed)
		{
			var oldestItem = allDisplayedItems.shift();
			if(oldestItem != null)
			{
				oldestItem.parentNode.removeChild(oldestItem);
				oldestItem = null;			
			}
		}
	}
} 






function ItemMod(modName, modTier, modRangeString)
{
	this.modName = modName;
	this.modTier = modTier;
	this.modRangeString = modRangeString;
}

function CompositeMod(modType, displayText)
{
	this.modType = modType;
	this.displayText = displayText;
	this.compositeModKey = '';
	this.mods = [];
}

function getMods(item, modType)
{

	var veiled_hashes = [];

	var fullMods = [];
	if(item[modType + 'Mods'])
	{
		var basicModText = item[modType + 'Mods'];
		if(basicModText != null && basicModText.length && basicModText.length > 0)
		{
			var hashToMod = [];
			for(var i = 0; i < basicModText.length; i++)
			{
				var displayText = basicModText[i];
				if(modType === 'veiled')
				{
					displayText = 'Veiled ' + displayText;
				}
				fullMods.push(new CompositeMod(modType,displayText));
			}
			if(item.extended)
			{
				if(item.extended.hashes)
				{
					var hashes = item.extended.hashes;
					if(hashes[modType])
					{
						for(var i = 0; i < hashes[modType].length; i++)
						{		
							fullMods[i].compositeModKey = hashes[modType][i][0];
							hashToMod[fullMods[i].compositeModKey] = fullMods[i];
						}
					}
				}
				if(item.extended.mods)
				{
					if(item.extended.mods[modType])
					{
						var moreModInfoListing = item.extended.mods[modType];
						if(moreModInfoListing != null && moreModInfoListing.length > 0)
						{
							for(var i = 0; i < moreModInfoListing.length; i++)
							{		
								var moreModInfo = moreModInfoListing[i];
								var modName = moreModInfo.name;
								var modTier = moreModInfo.tier;
								
								if(moreModInfo.magnitudes)
								{
									var modMagnitudes = moreModInfo.magnitudes;
									if(modMagnitudes != null && modMagnitudes.length > 0)
									{
										var keyToCompositeMods = [];
										for(var v = 0; v < modMagnitudes.length; v++)
										{	
											var modHashKey = modMagnitudes[v].hash;
											var modMin = modMagnitudes[v].min;
											var modMax = modMagnitudes[v].max;
											var modRange = '';
											if(modMin != modMax)
											{
												modRange = '('+ modMin + '-' + modMax + ')';
												var itemMod = keyToCompositeMods[modHashKey];
												if(itemMod == null)
												{
													var itemMod = new ItemMod(modName, modTier, modRange);
													hashToMod[modHashKey].mods.push(itemMod);
													keyToCompositeMods[modHashKey] = itemMod;
												}
												else
												{
													itemMod.modRangeString += ' - ' + modRange;
												}
											}
										}
									}
									else if (modType == "veiled")
									{
										var modHashKey = veiled_hashes[i]
										var modRange = '';
										var itemMod = new ItemMod(modName, modTier, modRange);
										hashToMod[modHashKey].mods.push(itemMod);
									}
								}
							}
						}
					}
				}
			}
		}			
	}
	return fullMods;
}



function buildCopyButton(buttonText, copyValue)
{
	var button = document.createElement("label");
	button.classList.add('button');
	
	button.innerHTML = buttonText;
	var copyText = document.createElement("textarea");
	copyText.btn = button;
	copyText.value = copyValue;
	copyText.classList.add('copy-text');
	copyText.onclick = function()
	{
		this.btn.classList.add('copied');
		this.select();
		document.execCommand("copy");		 
	};
	button.append(copyText);

	return button;
}

function showHide()
{
	var target = this.showHideTarget;
	if(target.classList.contains('hidden'))
	{
		target.classList.remove('hidden');
	}
	else
	{
		target.classList.add('hidden');
	}
}

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
