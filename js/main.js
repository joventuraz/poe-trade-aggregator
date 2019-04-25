
var lastItem = null;
var sockets = [];
var openSockets = 0;
var socketsToOpen = 0;
var maxItemsDisplayed = 300;
var allDisplayedItems = [];
var hasActiveSockets = false;

function ItemRequest(searchInfo, listings)
{	
	this.listings = listings;
	this.searchInfo = searchInfo;
}

function RequestManager()
{
	this.itemRequests = [];
	this.queueBox = document.getElementById('queue-count');
	this.addRequest = function(newRequest)
	{		
		var listings = newRequest.listings;
		var filteredListing = [];
			
		for(var i = 0; i < listings.length; i++)
		{
			filteredListing.push(newRequest.listings[i]);
			if(filteredListing.length == 10)
			{
				var tmpRequest = new ItemRequest(newRequest.searchInfo, filteredListing);
				this.itemRequests.push(tmpRequest);		
				filteredListing = [];
			}
		}
		
		if(filteredListing.length > 0)
		{
			var tmpRequest = new ItemRequest(newRequest.searchInfo, filteredListing);
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
			itemUrl += '?query=' + itemRequest.searchInfo.searchUrlPart;
			this.processItem(itemUrl, itemRequest.searchInfo);			
		}
	};
	this.processItem = function (itemUrl, searchInfo)
	{
		callAjax(itemUrl, addItem, searchInfo);
		soundHandler(searchInfo.soundId, searchInfo.soundVolume);
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
		var soundId = document.getElementById('notification-sound').value;
		window.localStorage.setItem('notification-sound', soundId);

		var listingManager = new ListingManager(searchesString);
		var providedSearches = listingManager.searches;
		if(providedSearches != null && providedSearches.length > 0)
		{
			for(var i = 0; i < providedSearches.length; i++)
			{
				var searchInfo = providedSearches[i];
				var searchSocket = new WebSocket(socketUrl + searchInfo.searchUrlPart);
				searchSocket.searchInfo = searchInfo;
				searchSocket.onopen = function(event)
				{
					openSockets++;
					document.getElementById('socket-count').value = openSockets + '/' + providedSearches.length;
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
						document.getElementById('socket-count').value = 0;
					}
					document.getElementById('socket-count').value = openSockets + '/' + socketsToOpen;
				};
				searchSocket.onmessage = function (event) 
				{
					var json = JSON.parse(event.data);
					var itemRequest = new ItemRequest(this.searchInfo, json.new);
					requestManager.addRequest(itemRequest);
				}
				sockets.push(searchSocket);
			}
		}
		
	}
} 

function callAjax(url, callback, searchInfo){
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            callback(xmlhttp.responseText, searchInfo);
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
function addItem(data, searchInfo) 
{
	var json = JSON.parse(data);
	var results = json.result;

	var display = document.getElementById('display-window');
	for(var resultIndex = 0; resultIndex < results.length; resultIndex++)
	{	
		var result = results[resultIndex];
		//dView(result, searchpart, display);
		nView(result, searchInfo, display);
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

	var inputElement = document.createElement('input');
	inputElement.type = "button"
	inputElement.className = "button"
	inputElement.value = buttonText;
	inputElement.addEventListener('click', function(){
	    copyTextToClipboard(copyValue);
	});

	return inputElement;
}


function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a
  // flash, so some of these are just precautions. However in
  // Internet Explorer the element is visible whilst the popup
  // box asking the user for permission for the web page to
  // copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
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

function nView(result, searchInfo, display)
{
	var searchpart = searchInfo.searchUrlPart;
	var searchName = searchInfo.searchComment;
	var new_row = document.createElement('div');
	new_row.className = 'row';
	new_row.appendChild(render_item(result.item));
	new_row.appendChild(display_item(result.item));


	var right_div = document.createElement('div');
	right_div.className = 'right';
	
	if (result.listing.price){
		right_div.appendChild(document.createTextNode(result.listing.price.type + " " + result.listing.price.amount + " "+ result.listing.price.currency))
	}
	right_div.appendChild(buildCopyButton('Whisper', result.listing.whisper));
	right_div.appendChild(buildCopyButton('Copy Item', atob(result.item.extended.text)));
	
	if(result.listing.account.name)
	{
		var profileLink = document.createElement('a');
		profileLink.href = 'https://www.pathofexile.com/account/view-profile/' + result.listing.account.name;
		profileLink.appendChild(document.createTextNode(result.listing.account.name));
		profileLink.target = '_blank';
		right_div.appendChild(profileLink);
	}

	if(searchpart != null)
	{
		var searchLink = document.createElement('a');
		var league = document.getElementById('league').value;
		searchLink.href = 'https://www.pathofexile.com/trade/search/' + league + '/' + searchpart;	
		if(searchName != null)
		{
			searchLink.appendChild(document.createTextNode(', ' + searchName + ' (' + searchpart + ')' ));
		}
		else
		{
			searchLink.appendChild(document.createTextNode(', ' + searchpart));
		}
		searchLink.target = '_blank';
		right_div.appendChild(searchLink);
	}


	new_row.appendChild(right_div);
	
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
