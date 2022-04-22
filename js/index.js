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
				console.log('json data is ', jsondata);
				config.data = jsondata;
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
	console.log('initiating line chart..');
    var dataSrc = [...config.data];

    var margin = {top: 42, right: 42, bottom: 42, left: 42}, 
	width = $('.chart').width() - margin.left - margin.right, 
	height = $('.chart').height() - margin.top - margin.bottom, 
	n = dataSrc.length;


    var xScale = d3.scalePoint().domain([0, width]).range([0, width]).padding(0.5);
	var yScale = d3.scaleLinear().range([height, 0]);
	var maxVal = 0, minVal = 0, minVal0 = 0;
	
	xScale.domain((dataSrc.map( function(d){ return d['Week']; })));
	
	yScale.domain( d3.extent(dataSrc, (function(d,i){
		var nums = [];
		
		for(var j = 0; j < config.content.headerArr.length-1; j++){
			var k = j + 1;
			nums.push(parseFloat(d['Weight'])) 
		}
	
		if(i === 0){ minVal = _.min(nums);maxVal = _.max(nums); }
		if(_.min(nums) < minVal){ minVal = _.min(nums); }
		if(_.max(nums) > maxVal){ maxVal = _.max(nums); }
		
		if(nums.some( v => v < 0 )){ return +_.min(nums); }else{ return +_.max(nums); }
		
	}))).nice();
	
	minVal0 = minVal;
	if(minVal < 0){ minVal0 = (minVal*config.content.scaleIncrease); }
	if(minVal > 0){ minVal0 = 0; }
	
	yScale.domain([minVal0, maxVal*config.content.scaleIncrease]);

	var div0 = d3.select('#curChart').append('div')
	.attr('class','tooltip')
	.style('opacity',0);
	
	var svg = d3.select("#curChart").append("svg")
	.attr("viewbox", '0 0 '+(width)+' '+(height))
	.attr('width','100%').attr('height','100%');
	
	var g = svg.append("g")
	.attr("transform", "translate(42,0)")
	.attr('width',width+'px').attr('height',height+'px')
	.attr('class','mainPart');

	var formatValue = d3.format(",.2~s");

	var xaxis = g.append("g").attr("class", "xaxis")
	.attr("transform", "translate(0," + (height+6) + ")")
	.call(d3.axisBottom(xScale).ticks(3).tickSizeOuter(0));
	
	var yaxis = g.append("g").attr("class", "yaxis")
	.call(d3.axisLeft(yScale).ticks(3).tickFormat(function(d) { return formatAdjuster(formatValue(d))}).tickSize(-width).tickSizeOuter(0));
	
	$('.xaxis .tick').each(function(curtick){
		$(this).addClass('tick'+curtick);
	});
	


}



function loadLine(finalClass){

	if(config.rowEval){
		var firstRow = config.rowEval[Object.keys(config.rowEval)[0]];
		if(dataSrc.length > 8 && (firstRow === "num" || firstRow === "date")){
			var tempNum = dataSrc.length-1;
			var midNum = (tempNum/2).toFixed(0);
			$('.xaxis .tick').addClass('hidden');
			$('.xaxis .tick0').removeClass('hidden');
			$('.xaxis .tick'+midNum).removeClass('hidden').addClass('midnum');
			$('.xaxis .tick'+tempNum).removeClass('hidden').addClass('tickLast');
		}
	}else{
		if(dataSrc.length > 8){
			var tempNum = dataSrc.length-1;
			var midNum = (tempNum/2).toFixed(0);
			$('.xaxis .tick').addClass('hidden');
			$('.xaxis .tick0').removeClass('hidden');
			$('.xaxis .tick'+midNum).removeClass('hidden').addClass('midnum');
			$('.xaxis .tick'+tempNum).removeClass('hidden').addClass('tickLast');
		}
	}
	
	$('.xaxis text, .yaxis text').attr("font-size","14px");
	
	g.selectAll('line').attr('stroke','rgb(0,0,0)');
	g.selectAll('.yaxis line').attr("stroke-linecap","round").attr("stroke-dasharray", "1, 3");
	g.select('.yaxis .domain').attr('opacity',0);
	
	var lines = g.append('g').attr('class', 'lines').attr('id','lines0'), 
	lines1 = g.append('g').attr('class', 'lines').attr('id', 'lines1'),
	lines2 = g.append('g').attr('class', 'lines').attr('id', 'lines2');
	
	var pointscontainer0 = g.append('g').attr('class', 'pointscontainer0').attr('id', 'pointscontainer0');
	var pointscontainer1 = g.append('g').attr('class', 'pointscontainer1').attr('id', 'pointscontainer1');
	var pointscontainer2 = g.append('g').attr('class', 'pointscontainer2').attr('id', 'pointscontainer2');
	
	var line0 = d3.line().defined(d => !isNaN(d[header002]))
	.x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header002]); });
	
	var path0 = lines.selectAll('path').data(dataSrc).enter().append('path')
	.attr('d',function(d,i){if(i === 0){return line0(dataSrc);}else{return;}})
	.attr('class','line line0')
	.attr('stroke-width', config.content.lineStroke+'px')
	.attr('stroke', config.fillLines.fill0)
	.attr('fill','rgba(0,0,0,0)');

	var point0 = pointscontainer0.selectAll("circles").data(dataSrc).enter().append("circle")
	.attr('fill', config.fillLines.fill0)
	.attr('stroke','#fff')
	.attr('stroke-width','2px')
	.attr('opacity','0')
	.attr("class", function(d,i){ return 'point hide point'+((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, ''); })
	.attr('fill', config.fillLines.fill0)
	.attr("cx", function(d,i) { return xScale(d[header001]); })
	.attr("cy", function(d) { return yScale(d[header002]); })
	.attr('data-head', function(d){ return (d[header001]); })
	.attr('data-value', function(d){ return header002+': <b>'+adjustcommas(d[header002])+'</b>'; })
	.attr('data-index',function(d,i){ return i;}).attr('id','point0').attr("r", 5);
	
	var line1, path1, point1, line2, path2, point2;
	if(config.content.headerArr[2]){
		line1 = d3.line().defined(d => !isNaN(d[header003])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header003]); });
		path1 = lines1.selectAll('path').data(dataSrc).enter().append('path')
		.attr('d',function(d,i){if(i === 0){return line1(dataSrc);}else{return;}})
		.attr('class','line line1')
		.attr('stroke-width', config.content.lineStroke+'px')
		.attr('stroke', config.fillLines.fill1)
		.attr('fill','rgba(0,0,0,0)');
		
		point1 = pointscontainer1.selectAll("circles").data(dataSrc).enter().append("circle")
		.attr('fill', config.fillLines.fill1)
		.attr('stroke','#fff')
		.attr('stroke-width','2px')
		.attr('opacity','0')
		.attr("class", (function(d){ return 'point hide point'+(((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, '')); }))
		.attr('id','point1')
		.attr("r", 5)
		.attr("cx", function(d) { return xScale(d[header001]); })
		.attr("cy", function(d) { return yScale(d[header003]); })
		.attr('data-head', function(d){ return (d[header001]); })
		.attr('data-value', function(d){ return header003+': <b>'+adjustcommas(d[header003])+'</b>'; })
		.attr('data-index',function(d,i){ return i;});
	}
	if(config.content.headerArr[3]){
		line2 = d3.line().defined(d => !isNaN(d[header004])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header004]); });
		path2 = lines2.selectAll('path').data(dataSrc).enter().append('path')
		.attr('d',function(d,i){if(i === 0){return line2(dataSrc);}else{return;}})
		.attr('class','line line2')
		.attr('stroke-width', config.content.lineStroke+'px')
		.attr('stroke', config.fillLines.fill2)
		.attr('fill','rgba(0,0,0,0)');
		
		point2 = pointscontainer2.selectAll("circles").data(dataSrc).enter().append("circle")
		.attr('fill', config.fillLines.fill2)
		.attr('stroke','#fff')
		.attr('stroke-width','2px')
		.attr('opacity','0')
		.attr("class", (function(d){ return 'point hide point'+(((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, '')); }))
		.attr('id','point2')
		.attr("r", 5)
		.attr("cx", function(d) { return xScale(d[header001]); })
		.attr("cy", function(d) { return yScale(d[header004]); })
		.attr('data-head', function(d){ return (d[header001]); })
		.attr('data-value', function(d){ return header004+': <b>'+adjustcommas(d[header004])+'</b>'; })
		.attr('data-index',function(d,i){ return i;});
	}
	if(config.content.headerArr[4]){
		line3 = d3.line().defined(d => !isNaN(d[header005])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header005]); });
		path3 = lines3.selectAll('path').data(dataSrc).enter().append('path')
		.attr('d',function(d,i){if(i === 0){return line3(dataSrc);}else{return;}})
		.attr('class','line line3')
		.attr('stroke-width', config.content.lineStroke+'px')
		.attr('stroke', config.fillLines.fill2)
		.attr('fill','rgba(0,0,0,0)');
		
		point3 = pointscontainer3.selectAll("circles").data(dataSrc).enter().append("circle")
		.attr('fill', config.fillLines.fill3)
		.attr('stroke','#fff')
		.attr('stroke-width','2px')
		.attr('opacity','0')
		.attr("class", (function(d){ return 'point hide point'+(((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, '')); }))
		.attr('id','point3')
		.attr("r", 5)
		.attr("cx", function(d) { return xScale(d[header001]); })
		.attr("cy", function(d) { return yScale(d[header005]); })
		.attr('data-head', function(d){ return (d[header001]); })
		.attr('data-value', function(d){ return header005+': <b>'+adjustcommas(d[header005])+'</b>'; })
		.attr('data-index',function(d,i){ return i;});
	}
	if(config.content.headerArr[5]){
		line4 = d3.line().defined(d => !isNaN(d[header006])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header006]); });
		path4 = lines4.selectAll('path').data(dataSrc).enter().append('path')
		.attr('d',function(d,i){if(i === 0){return line4(dataSrc);}else{return;}})
		.attr('class','line line4')
		.attr('stroke-width', config.content.lineStroke+'px')
		.attr('stroke', config.fillLines.fill4)
		.attr('fill','rgba(0,0,0,0)');
		
		point4 = pointscontainer4.selectAll("circles").data(dataSrc).enter().append("circle")
		.attr('fill', config.fillLines.fill4)
		.attr('stroke','#fff')
		.attr('stroke-width','2px')
		.attr('opacity','0')
		.attr("class", (function(d){ return 'point hide point'+(((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, '')); }))
		.attr('id','point4')
		.attr("r", 5)
		.attr("cx", function(d) { return xScale(d[header001]); })
		.attr("cy", function(d) { return yScale(d[header006]); })
		.attr('data-head', function(d){ return (d[header001]); })
		.attr('data-value', function(d){ return header006+': <b>'+adjustcommas(d[header006])+'</b>'; })
		.attr('data-index',function(d,i){ return i;});
	}
	if(config.content.headerArr[6]){
		line5 = d3.line().defined(d => !isNaN(d[header007])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header007]); });
		path5 = lines5.selectAll('path').data(dataSrc).enter().append('path')
		.attr('d',function(d,i){if(i === 0){return line5(dataSrc);}else{return;}})
		.attr('class','line line5')
		.attr('stroke-width', config.content.lineStroke+'px')
		.attr('stroke', config.fillLines.fill5)
		.attr('fill','rgba(0,0,0,0)');
		
		point5 = pointscontainer5.selectAll("circles").data(dataSrc).enter().append("circle")
		.attr('fill', config.fillLines.fill5)
		.attr('stroke','#fff')
		.attr('stroke-width','2px')
		.attr('opacity','0')
		.attr("class", (function(d){ return 'point hide point'+(((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, '')); }))
		.attr('id','point5')
		.attr("r", 5)
		.attr("cx", function(d) { return xScale(d[header001]); })
		.attr("cy", function(d) { return yScale(d[header007]); })
		.attr('data-head', function(d){ return (d[header001]); })
		.attr('data-value', function(d){ return header007+': <b>'+adjustcommas(d[header007])+'</b>'; })
		.attr('data-index',function(d,i){ return i;});
	}
	
	if(config.content.headerArr[7]){
		line6 = d3.line().defined(d => !isNaN(d[header008])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header007]); });
		path6 = lines6.selectAll('path').data(dataSrc).enter().append('path')
		.attr('d',function(d,i){if(i === 0){return line6(dataSrc);}else{return;}})
		.attr('class','line line6')
		.attr('stroke-width', config.content.lineStroke+'px')
		.attr('stroke', config.fillLines.fill6)
		.attr('fill','rgba(0,0,0,0)');
		
		point6 = pointscontainer6.selectAll("circles").data(dataSrc).enter().append("circle")
		.attr('fill', config.fillLines.fill6)
		.attr('stroke','#fff')
		.attr('stroke-width','2px')
		.attr('opacity','0')
		.attr("class", (function(d){ return 'point hide point'+(((""+d[header001]+"").toLowerCase().replace(/\s/g, "")).replace(/\W/g, '')); }))
		.attr('id','point6')
		.attr("r", 5)
		.attr("cx", function(d) { return xScale(d[header001]); })
		.attr("cy", function(d) { return yScale(d[header007]); })
		.attr('data-head', function(d){ return (d[header001]); })
		.attr('data-value', function(d){ return header007+': <b>'+adjustcommas(d[header007])+'</b>'; })
		.attr('data-index',function(d,i){ return i;});
	}

	function do_animation(path) {  
		if(path && path.node()){
			var totalLength = path.node().getTotalLength();  
			path.attrTween("stroke-dasharray", tweenDash);
		}
	};

	function tweenDash() {
	   var len = this.getTotalLength(), len2 = d3.interpolateString("0," + len, len + "," + len);
	   return function (m) { return len2(m); };
	}

	var overlay = g.append("rect").attr("class", "overlay disabled").attr("width", width+'px').attr("height", height+'px');
		
	var hoverLine =  g.append("rect")
	.attr('id','hoverline')
	.attr('opacity', 0)
	.attr('width','1px')
	.attr('height',height+'px')
	.attr('stroke','rgba(180,180,180,1)')
	.attr("stroke-dasharray", 12)
	.attr("stroke-linecap","round")
	.attr('stroke-width','0')
	.attr('fill','rgb(180,180,180)')
	.attr('x',0)
	.attr('y',0);
	
	if(config.content.tooltip === true){
		setTimeout( function(){ $('.overlay').removeClass('disabled'); }, 8800);
		d3.select('.overlay').on("mouseover mousemove touchmove touchstart", mousemove);
		d3.select('.overlay').on("mouseout touchend",noHover );
	}
	// custom invert function
	xScale.invert = (function(){
		var domain = xScale.domain();
		var range = [xScale.range()[0] - 40, xScale.range()[1] - 40];
		var scale = d3.scaleQuantize().domain(range).range(domain);

		return function(x){ return scale(x) }
	})()

	function hoverHandle(){
		var dataValue = $(this).attr('data-value');
		var dataIndex = parseInt($(this).attr('data-index'))-1;
		$('.point0').eq(dataIndex).removeClass('hide');
		$('.point1').eq(dataIndex).removeClass('hide');
		$('.point2').eq(dataIndex).removeClass('hide');
	}

	function noHover(){
		div0.style("opacity", 0);
		hoverLine.attr('opacity', 0);
	}

	function mousemove(){
		noHover();
		var xy = d3.mouse(this);
		
		var curx = xy[0]-42, cury = xy[1];
		
		if(xScale.invert(curx)){
			var b = (xScale.invert(curx).toLowerCase().replace(/\s/g, "")).replace(/\W/g, '');
			var nx = xScale(b) + (xScale.bandwidth()/2);
			var point0X = $('.pointscontainer0 .point'+b).attr('cx'),
			point0Y = $('.pointscontainer0 .point'+b).attr('cy');
			
			hoverLine.attr('opacity', 1).attr('x', point0X);

			var tempCode = '';
			var dataVal0 = $('#point0.point'+b).attr('data-value'), dataHead0 = $('#point0.point'+b).attr('data-head');
			
			if(dataHead0 && (dataHead0 != undefined) && (dataHead0 != null)){ tempCode += '<b>'+upperCaseWord(dataHead0)+'</b><br>'; }
			if(dataVal0 && (dataVal0 != undefined) && (dataVal0 != null)){ tempCode += '<span class="lineNo lineNo0"></span>'+dataVal0+'<br>'; }else{ tempCode += 'No Values Here'; }
			
			if(config.content.headerArr[2] && config.content.headerArr[2].data){ var dataVal1 = $('#point1.point'+b).attr('data-value');if(dataVal1 && (dataVal1 != undefined) && (dataVal1 != null)){ tempCode += '<span class="lineNo lineNo1"></span> '+dataVal1+'<br>'; }}
			if(config.content.headerArr[3] && config.content.headerArr[3].data){ var dataVal2 = $('#point2.point'+b).attr('data-value');if(dataVal2 && (dataVal2 != undefined) && (dataVal2 != null)){ tempCode += '<span class="lineNo lineNo2"></span> '+dataVal2+'<br>'; }}
			
			div0.html(tempCode);
			
			var moreleft = (($('.tooltip').width()/2)+100), moretop = (($('.tooltip').height()/2) + 12);
			if(cury < ($('.tooltip').height()-6)){
				moretop = ($('.tooltip').height()/2) - 40; 
			}
			
			if(curx > (($('.overlay').width()/2) - 20) ){
				moreleft = ((-1*$('.tooltip').width()/2)); 
			}
			
			div0.html(tempCode)
			.style("opacity", 0.98)
			.style('left',(curx+moreleft)+'px')
			.style('top',(cury-moretop)+'px'); 
		}
	}

	function resize(){
		
		adjustChartHeight();

		width = $('#curChart').width() - margin.left - margin.right;
		height = $('#curChart').height() - margin.top - margin.bottom; 

		svg = d3.select("svg").attr("viewbox", '0 0 '+(width)+' '+(height)).attr('width','100%').attr('height','100%');
		g.attr('width',width+'px').attr('height',height+'px');
	
		xScale = d3.scalePoint().domain([0, width]).range([0, width]).padding(0.5);
		yScale = d3.scaleLinear().range([height, 0]);
	
		xScale.domain((dataSrc.map( function(d){ return d[header001]; })));
		yScale.domain( d3.extent(dataSrc, (function(d,i){
			var nums = [];
			for(var j = 0; j < config.content.headerArr.length-1; j++){
				var k = j + 1;
				if(config.content.headerArr[k]){ nums.push(parseFloat(d[config.content.headerArr[k].data])) }
			}

			if(i === 0){ minVal = _.min(nums);maxVal = _.max(nums); }
			if(_.min(nums) < minVal){ minVal = _.min(nums); }
			if(_.max(nums) > maxVal){ maxVal = _.max(nums); }
		
			return +_.max(nums);
		}))).nice();
		
		minVal0 = minVal;
		if(minVal < 0){ minVal0 = (minVal*config.content.scaleIncrease); }
		if(minVal > 0){ minVal0 = 0; }
		
		yScale.domain([minVal0, maxVal*config.content.scaleIncrease]);

		xaxis = g.select(".xaxis").attr("transform", "translate(0," + (height+6) + ")").call(d3.axisBottom(xScale).ticks(3).tickSizeOuter(0));
		yaxis = g.select(".yaxis").call(d3.axisLeft(yScale).ticks(3).tickFormat(function(d) { return formatAdjuster(formatValue(d))}).tickSize(-width).tickSizeOuter(0));

		g.selectAll('line').attr('stroke','rgb(0,0,0)');
		g.selectAll('.yaxis line').attr("stroke-linecap","round").attr("stroke-dasharray", "1, 3");

		lines = svg.selectAll('#lines0'), lines1 = svg.selectAll('#lines1'), lines2 = svg.selectAll('#lines2');
		
		var tempNum = dataSrc.length-1;
		var midNum = (tempNum/2).toFixed(0);
		if(dataSrc.length > 8 && (firstRow === "num" || firstRow === "date" )){
			$('.xaxis .tick').attr('opacity',0);
			$('.xaxis #tick0').attr('opacity',1);
			$('.xaxis #tick'+midNum).attr('opacity',1);
			$('.xaxis #tick'+tempNum).attr('opacity',1);
		}
		
		g.select('.yaxis .domain').attr('opacity',0);
		
		line0 = d3.line().defined(d => !isNaN(d[header002])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header002]); });
		path0 = lines.selectAll('.line0').transition().duration(20).attr('d', function(d,i){ if(i === 0){ return line0(dataSrc); }else{ return; }}).attr('stroke-width', config.content.lineStroke+'px');

		point0 = g.selectAll('#point0').attr("cx", function(d,i) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header002]); });
		
		if(config.content.tooltip === true){
			point0.select('#point0').on('mouseover',hoverHandle).on('mouseout',noHover);
		}
		
		if(config.content.headerArr[2]){	
			var line1 = d3.line().defined(d => !isNaN(d[header003])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header003]); });
			var path1 = lines1.select('.line1').transition().duration(20).attr('d',function(d,i){if(i === 0){ return line1(dataSrc);}else{return;}}).attr('stroke-width', config.content.lineStroke+'px');
			var point1 = g.selectAll("#point1").attr("cx", function(d) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header003]); });
			
			if(config.content.tooltip === true){
				point1.select('#point1').on('mouseover',hoverHandle).on('mouseout',noHover);
			}
		}
		if(config.content.headerArr[3]){
			var line2 = d3.line().defined(d => !isNaN(d[header004])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header004]); });
			var path2 = lines2.selectAll('.line2').transition().duration(20).attr('d',function(d,i){if(i === 0){ return line2(dataSrc);}else{return;}}).attr('stroke-width', config.content.lineStroke+'px');
			var point2 = g.selectAll("#point2").attr("cx", function(d) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header004]); });
			
			if(config.content.tooltip === true){
				point2.select('#point2').on('mouseover',hoverHandle).on('mouseout',noHover);
			}
		}
		if(config.content.headerArr[4]){
			var line3 = d3.line().defined(d => !isNaN(d[header005])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header005]); });
			var path3 = lines3.selectAll('.line3').transition().duration(20).attr('d',function(d,i){if(i === 0){ return line3(dataSrc);}else{return;}}).attr('stroke-width', config.content.lineStroke+'px');
			var point3 = g.selectAll("#point3").attr("cx", function(d) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header005]); });
			
			if(config.content.tooltip === true){
				point3.select('#point3').on('mouseover',hoverHandle).on('mouseout',noHover);
			}
		}
		if(config.content.headerArr[5]){
			var line4 = d3.line().defined(d => !isNaN(d[header006])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header006]); });
			var path4 = lines4.selectAll('.line4').transition().duration(20).attr('d',function(d,i){if(i === 0){ return line4(dataSrc);}else{return;}}).attr('stroke-width', config.content.lineStroke+'px');
			var point4 = g.selectAll("#point4").attr("cx", function(d) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header006]); });
			
			if(config.content.tooltip === true){
				point4.select('#point4').on('mouseover',hoverHandle).on('mouseout',noHover);
			}
		}
		if(config.content.headerArr[6]){
			var line5 = d3.line().defined(d => !isNaN(d[header007])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header007]); });
			var path5 = lines5.selectAll('.line5').transition().duration(20).attr('d',function(d,i){if(i === 0){ return line5(dataSrc);}else{return;}}).attr('stroke-width', config.content.lineStroke+'px');
			var point5 = g.selectAll("#point5").attr("cx", function(d) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header007]); });
			
			if(config.content.tooltip === true){
				point5.select('#point5').on('mouseover',hoverHandle).on('mouseout',noHover);
			}
		}
		if(config.content.headerArr[7]){
			var line6 = d3.line().defined(d => !isNaN(d[header008])).x(function(d){ return xScale(d[header001]); }).y(function(d){ return yScale(+d[header008]); });
			var path6 = lines2.selectAll('.line6').transition().duration(20).attr('d',function(d,i){if(i === 0){ return line6(dataSrc);}else{return;}}).attr('stroke-width', config.content.lineStroke+'px');
			var point6 = g.selectAll("#point6").attr("cx", function(d) { return xScale(d[header001]); }).attr("cy", function(d) { return yScale(d[header008]); });
			
			if(config.content.tooltip === true){
				point6.select('#point6').on('mouseover',hoverHandle).on('mouseout',noHover);
			}
		}
		
		
		
		xScale.invert = (function(){
			var domain = xScale.domain();
			var range = [xScale.range()[0] - 40, xScale.range()[1] - 40] ;
			var scale = d3.scaleQuantize().domain(range).range(domain);

			return function(x){ return scale(x) }
		})()
		g.selectAll('line').attr('stroke','rgb(0,0,0)');
		g.selectAll('.yaxis line').attr("stroke-linecap","round").attr("stroke-dasharray", "1, 3");
		overlay = g.select(".overlay").attr("width", width+'px').attr("height", height+'px').on("mouseover", mousemove ).on("mouseout",noHover ).on("mousemove", mousemove );
		hoverLine.attr('height',height+'px');
	}
	g.selectAll('line').attr('stroke','rgb(0,0,0)');
	g.selectAll('.yaxis line').attr("stroke-linecap","round").attr("stroke-dasharray", "1, 3");
	d3.select(window).on('resize', resize);	
	
	
	setTimeout(function(){
		$('.chartLegend .legendBox').on({
			"mouseover": function(){
				if(svg && g){
					var curline = $(this).attr('data-line');
					d3.selectAll('.line').transition().duration(10).attr("opacity",0.5).attr('stroke-width','1px');
					d3.selectAll('.'+curline).transition().duration(10).attr("opacity",1).attr('stroke-width','4px');
					$('.chartLegend .legendBox').addClass('fade');
					$(this).removeClass('fade');
					SCMPUtils.ga.hover("scmp_multimedia", config.name, "Legend hover: "+curline);
				}
			},
			"mouseout": function() {
				if(svg && g){
					d3.selectAll('.line').transition().duration(10).attr("opacity",1).attr('stroke-width','3px');
					$('.chartLegend .legendBox').removeClass('fade');
				}
			}
		});
	},300);	
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

