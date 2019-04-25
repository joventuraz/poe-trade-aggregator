
var lastItem = null;
var sockets = [];
var openSockets = 0;
var socketsToOpen = 0;
var maxItemsDisplayed = 300;
var allDisplayedItems = [];
var hasActiveSockets = false;

function ItemRequest(searchpart, name, sound, volume, listings)
{
	this.listings = listings;
	this.searchpart = searchpart;
	this.name = name;
	this.sound = sound;
	this.volume = volume;
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
				var tmpRequest = new ItemRequest(newRequest.searchpart, newRequest.name, newRequest.sound, newRequest.volume, filteredListing);
				this.itemRequests.push(tmpRequest);		
				filteredListing = [];
			}
		}
		
		if(filteredListing.length > 0)
		{
			var tmpRequest = new ItemRequest(newRequest.searchpart, newRequest.name, newRequest.sound, newRequest.volume, filteredListing);
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
			this.processItem(itemUrl, itemRequest.searchpart, itemRequest.name, itemRequest.sound, itemRequest.volume);			
		}
	};
	this.processItem = function (itemUrl, searchpart, name, sound, volume)
	{
		callAjax(itemUrl, addItem, searchpart, name);
		soundHandler(sound, volume);
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
		window.localStorage.setItem('league', league);
		var socketUrl = "wss://pathofexile.com/api/trade/live/" + league + '/';
		var searchesString = document.getElementById('searches').value;
		window.localStorage.setItem('searches', searchesString);
		var searches = searchesString.split(',');
		var soundId = document.getElementById('notification-sound').value;
		window.localStorage.setItem('notification-sound', soundId);
		
		for(var i = 0; i < searches.length; i++)
		{
			socketsToOpen = searches.length;
			searches[i] = searches[i].trim();
			var splitSeach = searches[i].split('[');
			var search = splitSeach[0];
			var tmp = socketUrl + search;
			var searchSocket = new WebSocket(tmp);
			searchSocket.searchpart = search;
			if (splitSeach.length >1 )
			{
				searchSocket.searchName = splitSeach[1].slice(0, -1);
			}
			else
			{
				searchSocket.searchName ='';
			}
			if (splitSeach.length >2 && splitSeach[2] != ']')
			{
				searchSocket.searchSound = splitSeach[2].slice(0, -1);
			}
			else
			{
				searchSocket.searchSound =document.getElementById('notification-sound').value;
			}
			if (splitSeach.length >3 )
			{
				searchSocket.searchVolume = parseFloat(splitSeach[3]);
				if (searchSocket.searchVolume > 1 | searchSocket.searchVolume < 0)
				{
					searchSocket.searchVolume = 0.5;
				}
			}
			else
			{
				searchSocket.searchVolume = 0.5;
			}
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
				var itemRequest = new ItemRequest(this.searchpart, this.searchName, this.searchSound, this.searchVolume, json.new);
				requestManager.addRequest(itemRequest);
			}
		}	
	}
} 

function callAjax(url, callback, param1, parm2){
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            callback(xmlhttp.responseText, param1, parm2);
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
function addItem(data, searchpart, searchName) 
{
	var json = JSON.parse(data);
	var results = json.result;

	var display = document.getElementById('display-window');
	for(var resultIndex = 0; resultIndex < results.length; resultIndex++)
	{	
		var result = results[resultIndex];
		//dView(result, searchpart, display);
		nView(result, searchpart, searchName, display);
	}
} 

function ItemMod(modName, modTier, modRangeString)
{
	this.modName = modName;
	this.modTier = modTier;
	this.modRangeString = modRangeString;
	this.modType = '';
	if(modTier != null)
	{
		if(modTier.startsWith('P'))
		{
			this.modType='prefix';
		}
		else if(modTier.startsWith('S'))
		{
			this.modType='suffix';
		}
		else if(modTier.startsWith('R'))
		{
			this.modType='crafted';
		}
	}
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
	var veiledHashes = [];
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
												
											}

											if(modMin != 0 || modMax != 0)
											{
												var itemMod = keyToCompositeMods[modHashKey];
												
												if(itemMod == null)
												{
													var itemMod = new ItemMod(modName, modTier, modRange);
													try
													{
														hashToMod[modHashKey].mods.push(itemMod);
													}
													catch(err)
													{
														console.log();
													}
													keyToCompositeMods[modHashKey] = itemMod;
												}
												else
												{
													if(modRange != '')
													{
														itemMod.modRangeString += ' - ' + modRange;
													}
												}	
											}										
										}
									}
									else if (modType == "veiled")
									{
										var modHashKey = veiledHashes[i]
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

function toggleNDisplay(){
	result_div = document.getElementById('display-window');
	if(result_div.className == "results")
	{
		result_div.className = "results compact"
	}
	else
	{
		result_div.className = "results"
	}

}

function nView(result, searchpart, searchName, display)
{
	var new_row = document.createElement('div');
	new_row.className = 'row';
	new_row.appendChild(render_item(result.item))
	new_row.appendChild(display_item(result.item))

	if (result.listing.price){
		new_row.appendChild(document.createTextNode(result.listing.price.type + " " + result.listing.price.amount + " "+ result.listing.price.currency))
	}
	new_row.appendChild(buildCopyButton('Whisper', result.listing.whisper));
	new_row.appendChild(buildCopyButton('Copy Item', atob(result.item.extended.text)));
	
	if(result.listing.account.name)
	{
		var profileLink = document.createElement('a');
		profileLink.href = 'https://www.pathofexile.com/account/view-profile/' + result.listing.account.name;
		profileLink.appendChild(document.createTextNode(result.listing.account.name));
		profileLink.target = '_blank';
		new_row.appendChild(profileLink);
	}

	if(searchpart != null)
	{
		var searchLink = document.createElement('a');
		var league = document.getElementById('league').value;
		searchLink.href = 'https://www.pathofexile.com/trade/search/' + league + '/' + searchpart;
		searchLink.appendChild(document.createTextNode(', ' + searchpart));
		searchLink.target = '_blank';
		new_row.appendChild(searchLink);
	}

	if(searchName != null)
	{
		new_row.appendChild(document.createTextNode(', ' + searchName));
	}

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
