var http = require("http");
var https = require("https");
var timers = require("timers");

var title = "Fohn";
var numberTopStories = 10;
var intervalInMsec = 5000;

// No changes should be requred

var	topstories = [];
var newsstore = {};

https.get("https://hacker-news.firebaseio.com/v0/topstories.json", 
		function(res){

			var a = "";	
			res.on(
				'error', function(e){console.log("get: Got error: " + e.message)}
				).on(
				'data',function(chunk){ a = a + chunk.toString();}
				).on(
				'end', function(){
							topstories = JSON.parse(a).slice(0,numberTopStories);
							getnewsitems();
						}
				);
		}
		);


function cleanolditems(){
	var cleaned = 0
	var oldnews = Object.keys(newsstore);
	for(a in oldnews){
		if (topstories.indexOf(Number(oldnews[a])) < 0){
			delete newsstore[oldnews[a]];
			cleaned++;
		}
	}
	console.log("cleanolditems: cleaned " + cleaned);
}

function getnewsitems(){
	var newitems = 0
	for(a in topstories){
		if(! newsstore[topstories[a]]){
			console.log("getnewsitems: Requesting for " + topstories[a] + " https://hacker-news.firebaseio.com/v0/item/" + topstories[a] + ".json");
			https.get("https://hacker-news.firebaseio.com/v0/item/" + topstories[a] + ".json", 
					function(res){

						var b = "";	
						res.on(
							'error', function(e){console.log("getnewsitems: Got error: " + e.message)}
							).on(
							'data',function(chunk){ b = b + chunk.toString();}
							).on(
							'end', function(){
										var item = JSON.parse(b);
										item["fetched"] = (new Date()).getTime();
										newsstore[item["id"]] = item;
									}
							);
					}
					);
			newitems++;
		}
	}
	console.log("getnewsitems: Fetched new items: " + newitems);
}

function formatItem(item){
	return '<li class="'+ newsstore[topstories[item]].fetched +'">' + newsstore[topstories[item]].title + ' <a href="' + newsstore[topstories[item]].url + '">'+ newsstore[topstories[item]].url+'</a></li>\n'
	//return '<li class="'+ newsstore[topstories[item]].fetched +'">' + newsstore[topstories[item]].title + ' <a href="' + newsstore[topstories[item]].url + '">'+ newsstore[topstories[item]].url.match(/\/\/.+\//)+'</a></li>\n'
}

timers.setInterval(function(){
	console.log("setInterval: refetching news");	
	https.get("https://hacker-news.firebaseio.com/v0/topstories.json", 
			function(res){

				var a = "";	
				res.on(
					'error', function(e){console.log("setInterval: Got error: " + e.message)}
					).on(
					'data',function(chunk){ a = a + chunk.toString();}
					).on(
					'end', function(){
								topstories = JSON.parse(a).slice(0,numberTopStories);
								cleanolditems();
								getnewsitems();
							}
					);
			}
	);
},intervalInMsec);

var server = http.createServer(function(request, response){
	var a = '<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title><head><body><ol>';
	for (b in topstories){
		if ( newsstore[topstories[b]] != undefined)
			a = a + formatItem(b);
	}
	a = a + "</ol></body></html>";
	response.write(a);	
	response.end();
});

server.listen(8000);
