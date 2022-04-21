var config = {
    name: "Personal Weight Chart",
    url_path: window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1), 
    index: "index.html",
    link: {
        urlCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6poUY8Fm4eFNf_WmUpG29e_YRuGJwIG29OSwzwJKOqOnkmdW8f50ITtU421YeaocasGno2oAXiukx/pub?output=csv",
        urlJson:"https://docs.google.com/spreadsheets/d/142APkNRjc4K-nAFkdWNRsJZragzqZukZFqzQMChVt98/gviz/tq?tqx=out:csv"
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
				
				var jsondata = csvJson(data);
				console.log('raw data is ', data);
				console.log('json data is ', jsondata);
                
				config.data = parseFeed(JSON.parse(data));
				
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

	console.log('sheet feed is ', sheet);

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



function csvJson(csv) {
  var splitFinder = /[\r\n]+/;
  var lines = csv.split(splitFinder),
    head2 = [],
    result = [];
  if (lines[0].indexOf("\t") > -1) {
    var headers = lines[0].split("\t");
  } else if (lines[0].indexOf(",") > -1) {
    var headers = lines[0].split(",");
  }
  for (var i = 0; i < headers.length; i++) {
    head2.push(headers[i].replace(/\./g, "").replace(/\s/g, ""));
  }
  headers = head2;
  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    if (lines[i].indexOf("\t") > -1) {
      var currentline = lines[i].split("\t");
    } else if (lines[i].indexOf(",") > -1) {
      var currentline = lines[i].split(",");
    }
    for (var j = 0; j < headers.length; j++) {
      if (
        currentline[j] &&
        currentline[j] != null &&
        currentline[j] != undefined
      ) {
        obj[headers[j]] = currentline[j].replace(/,/g, "");
      }
    }
    result.push(obj);
  }
  return result;
}

