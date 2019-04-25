function ListingManager(listingString)
{
	this.searches = [];
	if(listingString != null && listingString.length > 0)
	{
		var listedSearches = listingString.split(',');
		for (var i = 0; i < listedSearches.length; i++)
		{
			this.searches.push(new SearchListing(listedSearches[i]));
		}
	}
}

function SearchListing(listingString)
{
	this.searchUrlPart = '';
	this.searchComment = '';
	this.soundId = '';
	this.soundVolume = 0.5;
	
	var searchParts = listingString.split('[');
	for (var i = 0; i < searchParts.length; i++)
	{
		var searchPart = searchParts[i].replace('[','').replace(']','');
		if(i == 0)
		{
			this.searchUrlPart = searchPart;
		}
		else if(i == 1)
		{
			this.searchComment = searchPart;
		}
		else if(i == 2)
		{
			this.soundId = searchPart;
		}
		else if(i == 3)
		{
			if(searchPart != null)
			{
				this.soundVolume = parseFloat(searchPart);
			}
		}
	}
}
