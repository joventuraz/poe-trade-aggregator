function dView(result, searchpart, display)
{
	var overrides = [];
	var icon = document.createElement("img");
	icon.src = result.item.icon;
	overrides['icon'] = icon;

	overrides['whisper-button'] = buildCopyButton('Whisper', result.listing.whisper);
	overrides['copy-item-button'] = buildCopyButton('Copy Item', atob(result.item.extended.text));
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
		overrides['item.sockets'] = '';
		if(result.item.sockets)
		{
			var itemSockets = result.item.sockets;
			var socketPanel = document.createElement('span');
			socketPanel.classList.add('socket-panel');		
			
			var socketInfo = document.createElement('span');
			socketInfo.append(document.createTextNode('( '));
			
			var totalSockets = document.createElement('span');
			var socketText = itemSockets.length + 'S';
			totalSockets.append(document.createTextNode(socketText));
			totalSockets.classList.add('s-' + socketText);
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
			var linkText = maxLinks + 'L';
			maxLinksBox.append(document.createTextNode(linkText));
			maxLinksBox.classList.add('l-' + linkText);
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
		if(result.item.additionalProperties)
		{
			for(var k = 0; k < result.item.additionalProperties.length; k++)
			{
				var property = result.item.additionalProperties[k];
				if(property != null && property.name)
				{
					var propertyName = property.name;
					var overrideKey = 'item.additionalProperties.' + propertyName;
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

	display.insertBefore(newNode, lastItem);
	lastItem = newNode;

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

function makeModList(compositeMods)
{
	var modlist = '';
	var veiledHashes = [];
	if(compositeMods != null && compositeMods.length > 0)
	{
		var modlist = document.createElement('ul');
		for(var i = 0; i < compositeMods.length; i++)
		{
			var compositeMod = compositeMods[i];
			var li = document.createElement('li');
			li.classList.add('m-' + compositeMod.modType);
			var aDiv = document.createElement('span');
			aDiv.classList.add('mod-display-text');
			aDiv.append(document.createTextNode(compositeMod.displayText));
			li.append(aDiv);
			if(compositeMod.mods && compositeMod.mods.length && compositeMod.mods.length > 0)
			{
				var itemMods = compositeMod.mods;
				for(var j = 0; j < itemMods.length; j++)
				{
					var itemMod = itemMods[j];
					var modBox = document.createElement('span');
					if(itemMod.modType != null  && itemMod.modType.length > 0)
					{
						modBox.classList.add(itemMod.modType);
					}
					if(itemMod.modTier != '' || itemMod.modName != ' ' || itemMod.modRangeString != null)
					{
						modBox.classList.add('mod-box');
						if(itemMod.modTier  != null && itemMod.modTier  != '')
						{
							var modTier = document.createElement('span');
							modTier.classList.add('mod-tier');
							modTier.append(document.createTextNode(' (' + itemMod.modTier + ') '));
							modBox.classList.add(itemMod.modTier);
							modBox.append(modTier);
						}
						if(itemMod.modName  != null && itemMod.modName  != '')
						{
							var modName = document.createElement('span');
							modName.classList.add('mod-name');
							modName.append(document.createTextNode(itemMod.modName));
							modBox.append(modName);
						}
						if(itemMod.modRangeString  != null && itemMod.modRangeString  != '')
						{
							var modRange = document.createElement('span');
							modRange.classList.add('mod-range');
							modRange.append(document.createTextNode(' ' + itemMod.modRangeString));
							modBox.append(modRange);
						}
						li.append(modBox);
					}
				}
			}
			modlist.append(li);
		}
	}	
	
	return modlist;	
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