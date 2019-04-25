/*code to handle extended mods*/

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
							try{
							fullMods[i].compositeModKey = hashes[modType][i][0];
							hashToMod[fullMods[i].compositeModKey] = fullMods[i];}
							catch{
								console.log("unknown extended error")
								console.log(item)
							}
							if (modType == "veiled"){
								veiled_hashes.push(hashes[modType][i][0]);
							}
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
										        modRange = '['+ modMin + '-' + modMax + ']';
										       
										    }
					 
										    if(modMin != 0 || modMax != 0)
										    {
										        var itemMod = keyToCompositeMods[modHashKey];
										       
										        if(itemMod == null)
										        {
										            var itemMod = new ItemMod(modName, modTier, modRange);
												try{
										            hashToMod[modHashKey].mods.push(itemMod);}
												catch(err){ console.log("no mod for hash:"); console.log(item);}
										            keyToCompositeMods[modHashKey] = itemMod;
										        }
										        else
										        {
										            if(modRange != '')
										            {
										                itemMod.modRangeString = itemMod.modRangeString.substring(0,itemMod.modRangeString.length - 1) + ' to ' + modRange.substring(1,modRange.length);
										            }
										        }  
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
	return fullMods;
}









/*Beginning of render code*/




function create_text_span(class_name, text){
	var span = document.createElement('span');
	span.className = class_name
	var text_obj = document.createTextNode(text);
	span.appendChild(text_obj);
	return span
}




function append_vaal_gem_info(item, content_div)
{
	var separator = document.createElement('div');
	separator.className = "separator";
	content_div.appendChild(separator);

	vaal_header = document.createElement('div');
	vaal_header.className = "vaalHeader";

	vaal_header_type_line = document.createElement('div');
	vaal_header_type_line.className = "itemName typeLine"
	
	vaal_header_type_line.appendChild(create_text_span("lc", item.typeLine))	
	vaal_header.appendChild(vaal_header_type_line)

	content_div.appendChild(vaal_header)
	
	var separator = document.createElement('div');
	separator.className = "separator";
	content_div.appendChild(separator);


	parse_properties(item.vaal, content_div)

	parse_mods(item.vaal.explicitMods, "explicitMod", content_div, false);

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


//RETOOLING MODS FOR EXTENDED











//Takes in a potential mod list, mod_class, and box_content to append to

function parse_mods_extended(item, mod_type, box_content, add_separator = true, veiled_mods = false){
	
	mods_extended = getMods(item, mod_type)
	mod_class = mod_type + "Mod"
	
	mods_extended.forEach(function(element) {
		mods = element.mods

		tier_strings = []
		range_strings = []
		name_strings = []
		affix_classes = []
		var mod_index = 0;
		for (mod_index = 0; mod_index < mods.length; mod_index ++){
			if (mods[mod_index].modTier != ""){
			tier_strings.push(mods[mod_index].modTier)}
			if (mods[mod_index].modRangeString != ""){
			range_strings.push(mods[mod_index].modRangeString)}
			if (mods[mod_index].modName != ""){
			name_strings.push(mods[mod_index].modName)
			}

			if( mods[mod_index].modTier[0] == "P" && !affix_classes.includes("pr")){
				affix_classes.push("pr");
			}
			else if( mods[mod_index].modTier[0] == "S" && !affix_classes.includes("su")){
				affix_classes.push("su");
			}
		}
		
		left_string = tier_strings.join(" + ") + " "
		left_hover = range_strings.join(" + ")
		right_string = ""
		right_hover = name_strings.join(" + ")
		
		if (mod_class == "enchantMod"){
			last_char = right_hover[right_hover.length -1]
			if (last_char == "1" || last_char == "2" || last_char == "3")
			{
				//inverted tier
				//left_hover = "E" + last_char
			}
			right_hover = ""
		
		}
		box_content.appendChild(create_mod(mod_class, element.displayText, left_string, left_hover, right_string, right_hover, affix_classes.join(" "), veiled_mod = veiled_mods))
	});
	if (add_separator && mods_extended.length > 0){
		var separator = document.createElement('div');
		separator.className = "separator";
		box_content.appendChild(separator);
		}
	

}




























//




//Takes in a mod class, and 5 text fields, one for the main text, one for the auxilliary left and right text, and one for the hover on left and right
function create_mod(mod_class,text, left_text = "", left_hover = "", right_text = "", right_hover = "", affix_classes = "", veiled_mod = false)
{
	left_span = document.createElement('span');
	right_span = document.createElement('span');
	center_span = document.createElement('span');

	left_hover_span = document.createElement('span');
	right_hover_span = document.createElement('span');

	left_span.className = "lc l " + affix_classes;
	right_span.className = "lc r " + affix_classes;
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

function append_gem_bar(experience, content_div){

	var separator = document.createElement('div');
	separator.className = "separator";
	content_div.appendChild(separator);

	additional_property_span = document.createElement('div');
	additional_property_span.className = 'additionalProperty';
	
	format_span = document.createElement('div');
	format_span.className = 'lc s';

	experience_span = document.createElement('span');
	experience_span.className = 'experienceBar';
	
	fill_span = document.createElement('span');
	fill_span.className = 'fill';

	progress = Math.floor(experience.progress * 100);
	
	gem_bar_span = document.createElement('span');
	gem_bar_span.setAttribute('style', "width: " + progress + "%;");

	fill_span.appendChild(gem_bar_span);
	experience_span.appendChild(fill_span);

	text_span = document.createElement('span');
	text_span.className = 'colourDefault';
	text_span.appendChild(document.createTextNode(experience.values[0][0]));
	

	additional_property_span.appendChild(format_span);

	format_span.appendChild(experience_span);
	format_span.appendChild(text_span);

	content_div.appendChild(additional_property_span);

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

	
	parse_mods_extended(item, "enchant", content_div);
	parse_mods_extended(item, "implicit", content_div);
	
	parse_mods_extended(item, "fractured", content_div, false);
	parse_mods_extended(item, "explicit", content_div, false);
	parse_mods_extended(item, "crafted", content_div, false);
	parse_mods_extended(item, "veiled", content_div, false, true);

	/*handle gem exp*/
	if (typeof item.additionalProperties != 'undefined'){
		item.additionalProperties.forEach(function(entry){
			if (entry.name == "Experience")
			{
				append_gem_bar(entry, content_div);
			}
			else{
			console.log(item.additionalProperties);
			}
		});
	}

	//if vaal gem then add the remaining information
	if (typeof item.vaal != 'undefined')
	{
		append_vaal_gem_info(item, content_div);
	}

	//if prophecy then add the prophecyText
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
	

	var middle_wrapper = document.createElement('div');
	middle_wrapper.className = "middle"
	middle_wrapper.appendChild(box_container)
	return middle_wrapper


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
	var left_wrapper = document.createElement('div');
	left_wrapper.className = "left"
	
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
	
	if (item.stackSize)
	{
		icon_div.appendChild(create_text_span("stackSize", item.stackSize))
	}
	left_wrapper.appendChild(item_container);
	
	return left_wrapper

}



