var config = {
    name: "Personal Weight Chart",
    url_path: window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1), 
    index: "index.html",
    link: {
        urlCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6poUY8Fm4eFNf_WmUpG29e_YRuGJwIG29OSwzwJKOqOnkmdW8f50ITtU421YeaocasGno2oAXiukx/pub?output=csv",
        urlJson:"https://spreadsheets.google.com/feeds/cells/142APkNRjc4K-nAFkdWNRsJZragzqZukZFqzQMChVt98/1/public/full?alt=json"
    },

    data: []

};



$(document).ready(function() {
	getData();
});


function getData(){
	var xhrmethod = $.ajax({
		type: "GET",
		url: config.link.urlJson, 
		dataType: "text",
		cache: false,
		success: function(data){
			if(data){
                
				config.data = parseFeed(JSON.parse(data));
				console.log('data is ', config.data);
			}else{
				if(xhrmethod){ xhrmethod.abort(); }
				// setTimeout(getData, 800);
			}
		}
	}).done(function(){
		if(config.data && config.data != [] && config.data != '[]'){
			initLineChart();
		}else{
			xhrmethod.abort();
			// setTimeout(getData, 1000);
		}
	}).fail(function(xhr, status, err){ 
		xhrmethod.abort();
		// setTimeout(getData, 1000);
	});	
}


function initLineChart(){
    var dataSrc = [...config.data];

    var margin = {top: 42, right: 42, bottom: 42, left: 42}, 
	width = $('.chart').width() - margin.left - margin.right, 
	height = $('.chart').height() - margin.top - margin.bottom, 
	n = dataSrc.length;


    var xScale = d3.scalePoint().domain([0, width]).range([0, width]).padding(0.5);
	var yScale = d3.scaleLinear().range([height, 0]);
	
	xScale.domain((dataSrc.map( function(d){ return d['week']; })));




}


function parseFeed(sheet) {

	try {
		if (sheet && sheet.feed) {
			if (sheet.feed.title && sheet.feed.title["$t"])
				data.title = sheet.feed.title["$t"];
			if (sheet.feed.updated && sheet.feed.updated["$t"])
				data.last_updated = sheet.feed.updated["$t"];
  
			if (sheet.feed.entry && sheet.feed.entry.length) {
				data.entries = [];
				sheet.feed.entry.forEach(function(row) {
					var entry = {};
					for (key in row) {
						if (key.indexOf("gsx$") === 0) {
						var field = key.substr(4);
						if (row[key]["$t"])
							entry[field] = row[key]["$t"];
						}
					}
					data.entries.push(entry);
				});
			}
		}
	} catch (err) {
		console.error("Google sheet data parsing error: " + err)
	}
}

