
var lastItem = null;
var sockets = [];
var openSockets = 0;
var socketsToOpen = 0;

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
	stopSockets();
	
	var socketCounterBox = document.getElementById('socket-count');
	socketCounterBox.classList.add('active');
	var league = document.getElementById('league').value;
	var socketUrl = "wss://pathofexile.com/api/trade/live/" + league + '/';
	var searchesString = document.getElementById('searches').value;
	var searches = searchesString.split(',');
	
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
		console.log(result);
		var overrides = [];
		var icon = document.createElement("img");
		icon.src = result.item.icon;
		overrides['icon'] = icon;
		
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

		overrides['whisper-button'] = whisperButton;
		if(result.listing.account.name)
		{
			var profileLink = document.createElement('a');
			profileLink.href = 'https://www.pathofexile.com/account/view-profile/' + result.listing.account.name;
			profileLink.appendChild(document.createTextNode(result.listing.account.name));
			profileLink.target = '_blank';
			overrides['account-profile'] = profileLink;
		}

		overrides['item.corrupted'] = '';
		overrides['item.mirrored'] = '';
		overrides['item.stacksize'] = '';
		if(searchpart != null)
		{
			var searchLink = document.createElement('a');
			var league = document.getElementById('league').value;
			searchLink.href = 'https://www.pathofexile.com/trade/search/' + league + '/' + searchpart;
			searchLink.appendChild(document.createTextNode(searchpart));
			searchLink.target = '_blank';
			overrides['searchpart'] = searchLink;
		}
		
		if(result.item)
		{
			var resultItem = result.item;
			var itemKeys = Object.keys(resultItem);
			var itemKeyPanel = document.createElement('div');
			var keyTitle = document.createElement('div');
			keyTitle.append(document.createTextNode('keys'));
			itemKeyPanel.append(keyTitle);
			keyTitle.onclick = showHide;
			var itemKeyBody = document.createElement('div');

			itemKeyBody.classList.add('hidden');
			itemKeyPanel.append(itemKeyBody);
			keyTitle.showHideTarget = itemKeyBody;
			var showHideTarget = showHideTarget;
			for (var keyIndex = 0; keyIndex < itemKeys.length; keyIndex++)
			{
				var ikey = itemKeys[keyIndex];
				var keyHeader = document.createElement('div');
				keyHeader.classList.add('key-header');
				keyHeader.append(document.createTextNode(ikey));
				keyHeader.onclick = showHide;
				itemKeyBody.append(keyHeader);

				var keyValue = document.createElement('div');
				keyValue.classList.add('key-value');
				keyValue.classList.add('hidden');
				keyValue.append(document.createTextNode(JSON.stringify(resultItem[ikey])));
				itemKeyBody.append(keyValue);
				keyHeader.showHideTarget = keyValue;
			}
			overrides['itemKeyPanel'] = itemKeyPanel;
			console.log();
			overrides['item.sockets'] = '';
			if(result.item.sockets)
			{
				var itemSockets = result.item.sockets;
				var socketPanel = document.createElement('span');
				socketPanel.classList.add('socket-panel');		
				
				var socketInfo = document.createElement('span');
				socketInfo.append(document.createTextNode('( '));
				
				var totalSockets = document.createElement('span');
				totalSockets.append(document.createTextNode(itemSockets.length + 'S'));
				socketInfo.append(totalSockets);
				
				socketInfo.append(document.createTextNode(' / '));
				socketInfo.classList.add('data-value');
				socketPanel.append(socketInfo);
				
				var currentSocketGroup = 0;
				var startSocketGroup = document.createElement('span');
				startSocketGroup.append(document.createTextNode('{'));

				var socketLink = document.createElement('span');
				socketLink.classList.add('socket-link');
				socketLink.append(document.createTextNode('='));
				
				var endSocketGroup = document.createElement('span');
				endSocketGroup.append(document.createTextNode('}'));
				socketPanel.append(startSocketGroup.cloneNode(true));
				var isFirstInGroup = true;
				var maxLinks = 1;
				var linkCounter = 1;
				for(var s = 0; s < itemSockets.length; s++)
				{
					var itemSocket = itemSockets[s];
					var itemSocketGroup = itemSocket.group;

					if(itemSocketGroup != currentSocketGroup)
					{
						socketPanel.append(endSocketGroup.cloneNode(true));
						socketPanel.append(startSocketGroup.cloneNode(true));
						currentSocketGroup = itemSocketGroup;
						isFirstInGroup = true;
						linkCounter = 1;
					}
					if(linkCounter > maxLinks)
					{
						maxLinks = linkCounter;
					}
					
					if(isFirstInGroup)
					{
						isFirstInGroup = false;
					}
					else
					{
						socketPanel.append(socketLink.cloneNode(true));					
					}
					var itemSocketColor = itemSocket.sColour;
					var socketNode = document.createElement('span');
					var socketCssClass = 'socket-' + itemSocketColor;
					socketNode.classList.add(socketCssClass);
					socketNode.append(document.createTextNode(itemSocketColor));
					socketPanel.append(socketNode);
					linkCounter++;
				}
				socketPanel.append(endSocketGroup.cloneNode(true));

				
				var maxLinksBox = document.createElement('span');
				maxLinksBox.append(document.createTextNode(maxLinks + 'L'));
				socketInfo.append(maxLinksBox);				
				socketInfo.append(document.createTextNode(')'));
				overrides['item.sockets'] = socketPanel;		
			}
			if(result.item.implicitMods)
			{
				overrides['item.implicitMods'] = makeModList(getMods(result.item, 'implicit'));
			}
			if(result.item.fracturedMods)
			{				
				overrides['item.fracturedMods'] = makeModList(getMods(result.item, 'fractured'));
			}
			if(result.item.explicitMods)
			{
				overrides['item.explicitMods'] = makeModList(getMods(result.item, 'explicit'));		
			}
			if(result.item.craftedMods)
			{
				overrides['item.craftedMods'] = makeModList(getMods(result.item, 'crafted'));					
			}
			if(result.item.enchantMods)
			{
				overrides['item.enchantMods'] = makeModList(getMods(result.item, 'enchant'));		
			}
			if(result.item.veiledMods)
			{
				overrides['item.veiledMods'] = makeModList(getMods(result.item, 'veiled'));
			}
			if(result.item.properties)
			{
				for(var k = 0; k < result.item.properties.length; k++)
				{
					var property = result.item.properties[k];
					if(property != null && property.name)
					{
						var propertyName = property.name;
						var overrideKey = 'item.properties.' + propertyName;
						var propertyValues = '';
						if(property.values)
						{
							var propValues = property.values;
							propertyValues = outputPropertyValues(propValues);
						}
						overrides[overrideKey] = propertyValues;
					}
				}				
			}					

			if(result.item.corrupted)
			{
				overrides['item.corrupted'] = '(Corrupted)';					
			}
			
			if(result.item.duplicated)
			{
				overrides['item.mirrored'] = '(Mirrored)';					
			}
			
			if (result.item.stackSize) {
				overrides['item.stacksize'] = '(stack:' + result.item.stackSize + '/' + result.item.maxStackSize + ')';
			}
		}
		var itemNamePlate = document.createElement('span');
		itemNamePlate.append(document.createTextNode(result.item.name));
		overrides['item.name'] = itemNamePlate;
		
		var template = document.getElementById('item-template');
		var newNode = template.cloneNode(true);
		newNode.id = 'tmp-id';
		var fields = newNode.querySelectorAll('.template-field');
		newNode.id = '';
		if(fields != null && fields.length > 0)
		{
			for(var fieldIndex = 0; fieldIndex < fields.length; fieldIndex++)
			{
				var field = fields[fieldIndex];
				var resultPath = field.getAttribute('tf');
				var aTmpResult = null;
				if(overrides[resultPath])
				{
					aTmpResult = overrides[resultPath];
				}
				else
				{
					aTmpResult = findValue(field, result,resultPath,0);
				}	
				if(aTmpResult != null && aTmpResult != '' && aTmpResult != 'null')
				{
					var defaultFields = field.querySelectorAll('.default-text'); 
					for(var p = 0; p < defaultFields.length; p++)
					{
						var defaultField = defaultFields[p];
						defaultField.parentNode.removeChild(defaultField);
					}					
					var dataTargets = field.querySelectorAll('.data-target'); 
					if(dataTargets != null  && dataTargets.length > 0)
					{
						for(var p = 0; p < dataTargets.length; p++)
						{
							var dataTarget = dataTargets[p];
							if(typeof aTmpResult === 'string' ||
									aTmpResult instanceof String ||
									typeof aTmpResult === 'number')
							{
								var textWrapper = document.createElement('span');
								textWrapper.append(document.createTextNode(aTmpResult));
								
								dataTarget.append(textWrapper);
							}
							else
							{
								dataTarget.append(aTmpResult.cloneNode(true));
							}
						}	
					}
					else
					{
						field.append(aTmpResult);
					}
				}
				else
				{
					var presentFields = field.querySelectorAll('.if-present'); 
					for(var p = 0; p < presentFields.length; p++)
					{
						var presentField = presentFields[p];
						presentField.parentNode.removeChild(presentField);
					}									
				}				
			}
		}
		if(result.item.frameType)
		{
			var rarity = frameType[result.item.frameType];
			var rarityElements = newNode.querySelectorAll('.item-rarity');
			if(rarityElements != null)
			{
				for(var i = 0; i < rarityElements.length; i++)
				{
					rarityElements[i].classList.add('r-'+rarity);
				}
			}
		}

		new_display = display_item(result.item)
		display.insertBefore(new_display, lastItem);
		display.insertBefore(render_item(result.item), lastItem);
		display.insertBefore(newNode, lastItem);
		lastItem = new_display;
	}
} 

function outputPropertyValues(propValues)
{
	var returnValue = '{';
	var isFirst = true;
	for(var index = 0; index < propValues.length; index++)
	{
		var value = propValues[index];
		if(isFirst)
		{
			isFirst = !isFirst;
		}
		else
		{
			returnValue += ',';
		}
		if(value != null)
		{
			returnValue += value[0];
		}
	}
	returnValue += '}';
	return returnValue;
}

function findValue(field, object, objectPath, depth)
{
	var objectValue = object;
	var objectParts = objectPath.split('.');
	if(objectParts != null && objectParts.length > 0)
	{
		for(var i = 0; i < objectParts.length; i++)
		{
			var varName = objectParts[i];
			if(objectValue != null)
			{
				objectValue = objectValue[varName];		

				if(typeof objectValue === 'undefined')
				{
					objectValue = '';
					break;
				}
			}
			else
			{
				objectValue = '';
				break;
			}
		}
	}
	return objectValue;
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

function makeModList(compositeMods)
{
	var modlist = '';
	if(compositeMods != null && compositeMods.length > 0)
	{
		var modlist = document.createElement('ul');
		for(var i = 0; i < compositeMods.length; i++)
		{
			var compositeMod = compositeMods[i];
			var li = document.createElement('li');
			li.classList.add('m-' + compositeMod.modType);
			li.append(document.createTextNode(compositeMod.displayText));
			if(compositeMod.mods && compositeMod.mods.length && compositeMod.mods.length > 0)
			{
				var itemMods = compositeMod.mods;
				for(var j = 0; j < itemMods.length; j++)
				{
					var itemMod = itemMods[j];
					var span = document.createElement('span');
					span.classList.add('prefix');
					span.append(document.createTextNode('|' + itemMod.modName + ' ' + itemMod.modTier + ' ' + itemMod.modRangeString));
					li.append(span);
				
				}
			}
			modlist.append(li);
		}
	}	
	
	return modlist;	
}

function getMods(item, modType)
{
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
										for(var v = 0; v < modMagnitudes.length; v++)
										{	
											var modHashKey = modMagnitudes[v].hash;
											var modMin = modMagnitudes[v].min;
											var modMax = modMagnitudes[v].max;
											var modRange = '('+ modMin + '-' + modMax + ')';
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
	}
	console.log(fullMods);
	return fullMods;
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









































function create_text_span(class_name, text){
	var span = document.createElement('span');
	span.className = class_name
	var text_obj = document.createTextNode(text);
	span.appendChild(text_obj);
	return span
}








//Creates the header for the popupbox 
function create_header(item)
{	

	item_name = item.name;
	var item_header = document.createElement('div');
	item_header.appendChild(create_text_span("l", ""))
	if(item_name != ""){
		item_header.className = "itemHeader doubleLine";
		item_header_name = document.createElement('div');
		item_header_name.className = "itemName";
		
		item_header_name.appendChild(create_text_span("lc", item.name))
		
		item_header.appendChild(item_header_name)
		
	}
	else{
		item_header.className = "itemHeader";
	}
	
	item_header_type = document.createElement('div');
	item_header_type.className = "itemName typeLine";
	
	item_type = item.typeLine
	if (typeof item.vaal != 'undefined')
	{
		item_type = item.vaal.baseTypeName
	}

	item_header_type.appendChild(create_text_span("lc", item_type))

	item_header.appendChild(item_header_type);
	item_header.appendChild(create_text_span("r", ""));
	
	return item_header
}



//Takes in a mod class, and 5 text fields, one for the main text, one for the auxilliary left and right text, and one for the hover on left and right
function create_mod(mod_class,text, left_text = "", left_hover = "", right_text = "", right_hover = "", veiled_mod = false)
{
	left_span = document.createElement('span');
	right_span = document.createElement('span');
	center_span = document.createElement('span');

	left_hover_span = document.createElement('span');
	right_hover_span = document.createElement('span');

	left_span.className = "lc l pr";
	right_span.className = "lc r pr";
	left_hover_span.className = "d";
	right_hover_span.className = "d";
	
	center_span.className = "lc s";
	
	
	
	if (veiled_mod){
		text = text.toLowerCase()
		center_span.className = "lc " + text.substring(0, text.length - 2) + " " + text + " s"
	}

	left_hover_span.appendChild(document.createTextNode(left_hover))
	right_hover_span.appendChild(document.createTextNode(right_hover))
	
	left_span.appendChild(document.createTextNode(left_text))
	right_span.appendChild(document.createTextNode(right_text))
	
	left_span.appendChild(left_hover_span);
	right_span.appendChild(right_hover_span);
	
	mod_text = document.createTextNode(text.replace(/\n/g, '<br/>'))
	center_span.appendChild(mod_text)

	mod_div = document.createElement('div');
	mod_div.className = mod_class;

	mod_div.appendChild(left_span);
	mod_div.appendChild(center_span);
	mod_div.appendChild(right_span);
	
	return mod_div
}

//Takes in a potential mod list, mod_class, and box_content to append to
function parse_mods(potential_mod_list, mod_class, box_content, add_separator = true, veiled_mods = false){

	if (typeof potential_mod_list != 'undefined')
	{
		potential_mod_list.forEach(function(element) {
			box_content.appendChild(create_mod(mod_class, element, "","","","",veiled_mod = veiled_mods))
		});
		if (add_separator){
			var separator = document.createElement('div');
			separator.className = "separator";
			box_content.appendChild(separator);
		}
	}

}

var property_value_classes = ["colourDefault","colourAugmented","colourUnmet","colourPhysicalDamage","colourFireDamage","colourColdDamage","colourLightningDamage","colourChaosDamage"]
function parse_properties(item, content_div){

	if (typeof item.properties != 'undefined')
	{

		item.properties.forEach(function(element){
			property_div = document.createElement('div');
			property_div.className = "displayProperty"
			property_span = document.createElement('span');
			property_span.className = "lc"
			
			if(element.displayMode == 0){
				property_span.appendChild(create_text_span("", element.name))
				if (element.values.length > 0){
				property_span.appendChild(document.createTextNode(": "))
				}
				
				element.values.forEach(function(value_entry){
					property_span.appendChild(create_text_span(property_value_classes[value_entry[1]], value_entry[0]))
					property_span.appendChild(document.createTextNode(","));
				});

				if (element.values.length > 0){
					property_span.innerHTML = property_span.innerHTML.substring(0, property_span.innerHTML.length - 1)

				}
					

			}
			else if (element.displayMode == 3){

				span_array = [];
				element.values.forEach(function(value_entry){
					var wrap = document.createElement('div');
					wrap.appendChild(create_text_span(property_value_classes[value_entry[1]], value_entry[0]));
					span_array.push(wrap.innerHTML);
				});
				
				span_html = element.name;
				for(replace_index = 0; replace_index < span_array.length; replace_index++){
					span_html = span_html.replace("%" + replace_index, span_array[replace_index]);
				}
				
				property_span_inner = document.createElement('span');
				property_span_inner.innerHTML = span_html;
				property_span.appendChild(property_span_inner);
				
			}
			else{
			console.log(element);
			}


			property_div.appendChild(property_span)
			content_div.appendChild(property_div)
	

		});

		
		var separator = document.createElement('div');
		separator.className = "separator";
		content_div.appendChild(separator);
	}
}

function parse_requirements(item, content_div){
	add_separator = false
	
	if (typeof item.ilvl != 'undefined' && item.ilvl > 0)
	{
		add_separator = true
			property_div = document.createElement('div');
			property_div.className = "displayProperty"
			property_span = document.createElement('span');
			property_span.className = "lc"
			
			
			property_span.appendChild(create_text_span("", "Item Level"))
			property_span.appendChild(document.createTextNode(": "))
			
			
			property_span.appendChild(create_text_span(property_value_classes[0], item.ilvl))

					

			property_div.appendChild(property_span)
			content_div.appendChild(property_div)
	
	}

	
	if (typeof item.requirements != 'undefined')
	{
		add_separator = true
		property_div = document.createElement('div');
		property_div.className = "requirements"
		property_span = document.createElement('span');
		property_span.className = "lc"
		property_span.appendChild(document.createTextNode("Requires "));
			
		item.requirements.forEach(function(element){

			if(element.displayMode == 0){
				property_span.appendChild(create_text_span("", element.name + " "))
				if (element.values.length != 1){
					console.log(element);
				}
				value_entry = element.values[0]
				property_span.appendChild(create_text_span(property_value_classes[value_entry[1]], value_entry[0]))
				


			}
			else if (element.displayMode == 1){
				if (element.values.length != 1){
					console.log(element);
				}
				value_entry = element.values[0]
				property_span.appendChild(create_text_span(property_value_classes[value_entry[1]], value_entry[0]))

				property_span.appendChild(create_text_span("", " "+ element.name))


			}
			else{
			console.log(element);
			}

			property_span.appendChild(document.createTextNode(", "))
	

		});

		
		if (item.requirements.length > 0){
			property_span.innerHTML = property_span.innerHTML.substring(0, property_span.innerHTML.length - 2)

		}
					
		property_div.appendChild(property_span)
		content_div.appendChild(property_div)

	}
	if (add_separator){

		var separator = document.createElement('div');
		separator.className = "separator";
		content_div.appendChild(separator);
}
	

}


//takes in text and replaces markup with spans, intended for use on innerhtml of content wrappers
var markup = ["default", "augmented", "unmet", "physicaldamage", "firedamage", "colddamage", "lightningdamage","chaosdamage", "uniqueitem", "rareitem", "magicitem", "whiteitem", "gemitem", "currencyitem", "questitem", "crafted", "divination", "corrupted", "bold", "italic", "normal", "prophecy", "size:31"]


function poe_markup_sub(text, key){

var index = text.indexOf("<" + key + ">{")
if (index == -1)
{
	return text
}
else{
	var replace_end = text.substring(index, text.length).indexOf("}")
	var text_to_replace = text.substring(index + key.length + 3, index + replace_end)
	var wrap = document.createElement('div')
	wrap.appendChild(create_text_span("PoEMarkup " + key.replace(":",""), text_to_replace))
	
	text = text.replace("<" + key + ">{" + text_to_replace + "}", wrap.innerHTML)

	text = text.replace( /&lt;/g, '<').replace( /&gt;/g, '>');
	return text
}

}


function poe_markup(text){
	text = text.replace( /&lt;/g, '<').replace( /&gt;/g, '>');
	do{
		old_text = text
		markup.forEach(function(markup_key){
			text = poe_markup_sub(text, markup_key)
		});
	
	}
	while(text != old_text)
	return text
}




var frame_type_popup = ["normalPopup", "magicPopup", "rarePopup", "uniquePopup", "gemPopup", "currencyPopup", "divinationCard", 0, "prophecyPopup", "relicPopup"];
//Takes in a json result from pathofexile.com/trade/api/fetch and builds a div for display
function display_item(item)
{
	var box_container = document.createElement('div');
	box_container.className =  "itemPopupContainer newItemPopup " + frame_type_popup[item.frameType]
		

	var box_content = document.createElement('div');
	box_content.className = "itemBoxContent";


	box_content.appendChild(create_header(item));
	var content_div = document.createElement('div');
	content_div.className = "content";
	
	
	parse_properties(item, content_div);
	parse_requirements(item, content_div);

	parse_mods(item.enchantMods, "enchantMod", content_div);
	parse_mods(item.implicitMods, "implicitMod", content_div);
	parse_mods(item.fracturedMods, "fracturedMod", content_div, false);
	parse_mods(item.explicitMods, "explicitMod", content_div, false);
	parse_mods(item.craftedMods, "craftedMod", content_div, false);
	parse_mods(item.veiledMods, "veiledMod", content_div, false, true);

	if (typeof item.prophecyText != 'undefined'){
		var prophecy_div = document.createElement('div');
		prophecy_div.className = 'prophecyText colourDefault';
		prophecy_div.appendChild(create_text_span('lc', item.prophecyText));
		content_div.appendChild(prophecy_div);
	}

	//Add in text at end for unidentified, corrupted, mirrored
	if (!item.identified){
		var corrupted_div = document.createElement('div');
		corrupted_div.className = 'unmet';
		corrupted_div.appendChild(create_text_span('lc', 'Unidentified'));
		content_div.appendChild(corrupted_div);
	}
	if (item.duplicated){
		var mirrored_div = document.createElement('div');
		mirrored_div.className = 'augmented';
		mirrored_div.appendChild(create_text_span('lc', 'Mirrored'));
		content_div.appendChild(mirrored_div);
	}
	if (item.corrupted){
		var corrupted_div = document.createElement('div');
		corrupted_div.className = 'unmet';
		corrupted_div.appendChild(create_text_span('lc', 'Corrupted'));
		content_div.appendChild(corrupted_div);
	}


	box_content.appendChild(content_div);

	//final pass for poe markup for div cards and resonators
	content_div.innerHTML = poe_markup(content_div.innerHTML);
	box_container.appendChild(box_content);

	return box_container


}

socket_dict = {"W" : "socketGen", "R" : "socketStr", "G" : "socketDex", "B" : "socketInt", "A" : "socketAbyss", "DV" : "socketDelve"}
function create_socket_div(item){
	socket_div = document.createElement('div');
	
	socket_number = 0
	if (typeof item.sockets != 'undefined')
	{
		socket_number = item.sockets.length
		for(socket_index = 0; socket_index < socket_number - 1; socket_index ++)
		{
			if (item.sockets[socket_index].group == item.sockets[socket_index + 1].group){
				socket_link = document.createElement('div');
				socket_link.className = "socketLink socketLink" + socket_index
				socket_div.appendChild(socket_link)				
			}

			new_socket = document.createElement('div');

			socket_add = ""
			if (socket_index == 2 || socket_index == 3){
				socket_add = "socketRight "
			}
			
			new_socket.className = "socket " + socket_add + socket_dict[item.sockets[socket_index]["sColour"]]
			socket_div.appendChild(new_socket)
			
		}
		socket_index = socket_number - 1;
		new_socket = document.createElement('div');

		socket_add = ""
		if (socket_index == 2 || socket_index == 3){
			socket_add = "socketRight "
		}
		
		new_socket.className = "socket " + socket_add + socket_dict[item.sockets[socket_index]["sColour"]]
		socket_div.appendChild(new_socket)
	}

	socket_div.className = "sockets numSockets" + socket_number

	return socket_div	

}


function render_item(item){
	var results_wrapper = document.createElement('div');
	results_wrapper.className = "results"
	
	var item_container = document.createElement('div');
	item_container.className = "results newItemContainer itemRender iW" + item.w + " iH" + item.h
	
	var icon_container = document.createElement('div');
	icon_container.className = "iconContainer";

	var icon_div = document.createElement('div');
	icon_div.className = "icon";
	
	var icon_image = document.createElement('img');
	icon_image.src = item.icon;
	
	item_container.appendChild(icon_container)
	icon_container.appendChild(icon_div)
	icon_div.appendChild(icon_image)
	icon_div.appendChild(create_socket_div(item))
	
	results_wrapper.appendChild(item_container);
	
	return results_wrapper

}



