var map;
var attrArray = ["Total ranked players", "Average height of ranked players", "Average weight of ranked players", "Average rank of players", "Average stars of ranked players"];
var expressed = attrArray[0];
var chartWidth = window.innerWidth * 0.7,
    chartHeight = 280,
    leftPadding = 40,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

var yScale = d3.scaleLinear()
    .range([270, 0])
    .domain([0, 200]);

var stateArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
var expressed2 = stateArray[0];
var filteredPlayers = [];

var playerIndex = "";

var singlePlayer = [];

var expressed3 = filteredPlayers[0];

function createMap(){

    map = L.map('map', {
        center: [40, -100],
        zoom: 4
    });

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    getData(map);


    var promises = [];    
    promises.push(d3.csv("data/FinalData_States.csv"));
    promises.push(d3.csv("data/FinalData_Players.csv"));
    Promise.all(promises).then(callback);
    
    function callback(data){    
        csvData = data[0];
        csvData2 = data[1];   
        var colorScale = makeColorScale(csvData);
        setChart(csvData, colorScale);
        createDropdown(csvData);
        secondDropdown();
        thirdDropdown(filteredPlayers);
        playerStats(singlePlayer);
        
       
    };

};

function calcPropRadius(attValue) {

    var minRadius = 2;
    if(attValue > 0) {
        var radius = 1.0083 * Math.pow(attValue/1,0.5715) * minRadius
    }
    else {
        radius = 0
    }
    return radius;
};

function pointToLayer(feature, latlng, attributes){

    var totalPlayers = attributes[2],
        avgHeight = attributes[3],
        avgWeight = attributes[4],
        avgRank = attributes[5];
        avgStars = attributes[6];
    

    var options = {
        fillColor: "#cccccc",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    
    var attValue = Number(feature.properties[totalPlayers]);

   
    options.radius = calcPropRadius(attValue);

    
    var layer = L.circleMarker(latlng, options);

    
    var popupContent = "<p><b>State:</b> " + feature.properties.name + "</p><p><b>" + "Total Ranked Players:" + "</b> " + feature.properties[totalPlayers] + "</p><p><b>" + "Average Height:" + "</b> " + feature.properties[avgHeight] + "</p><p><b>" + "Average Weight:" + "</b> " + feature.properties[avgWeight] + "</p><p><b>" + "Average Rank:" + "</b> " + feature.properties[avgRank] + "</p><p><b>" + "Average Stars:" + "</b> " + feature.properties[avgStars] + "</p>";

   
    layer.bindPopup(popupContent);


    return layer;
};

function createPropSymbols(data, attributes){

    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function onEachFeature(feature, layer) {

    var popupContent = "";
    if (feature.properties) {
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

function processData(data){
    var attributes = [];

    var properties = data.features[0].properties;

    for (var attribute in properties){
            attributes.push(attribute);
    };

    return attributes;
};

function getData(){
        
        fetch("data/StateData.geojson")
            .then(function(response){
                return response.json();
            })
            .then(function(json){
                
                var attributes = processData(json);
                createPropSymbols(json, attributes);
            })
    };
        

    function makeColorScale(data){
        var colorClasses = [
            "#ffffcc",
            "#a1dab4",
            "#41b6c4",
            "#2c7fb8",
            "#253494"
        ];

        
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        
        colorScale.domain(domainArray);

        return colorScale;
    };

    function setChart(csvData, colorScale){
    
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
    
        var chartBackground = chart.append("rect")
			.attr("class", "chartBackground")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);
        
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "bar " + d.state;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", function (event, d) {
				highlight(d);
			})
			.on("mouseout", function (event, d) {
				dehighlight(d);
			})
			.on("mousemove", moveLabel);
		;
        
        var yAxis = d3.axisLeft()
			.scale(yScale);
        
        var axis = chart.append("g")
			.attr("class", "axis")
			.attr("transform", translate)
			.call(yAxis);

        var chartFrame = chart.append("rect")
			.attr("class", "chartFrame")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);

        var desc = bars.append("desc")
			.text('{"stroke": "none", "stroke-width": "0px"}')
        
        updateChart(bars, csvData.length, colorScale);
    };
    
    function createDropdown(csvData){
       
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
       
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });
    };

    function changeAttribute(attribute, csvData){
       
        expressed = attribute;
        
        var colorScale = makeColorScale(csvData);
        
        var maxValue = 0;

        if (attribute === attrArray[0]) {
            maxValue = 200
        } else if (attribute === attrArray[1]) {
            maxValue = 100
        } else if (attribute === attrArray[2]) {
            maxValue = 350
        } else if (attribute === attrArray[3]) {
            maxValue = 1200
        } else if (attribute === attrArray[4]) {
            maxValue = 5
        };

        yScale = d3.scaleLinear()
			.range([270, 0])
			.domain([0, maxValue]);
        
        var yAxis = d3.axisLeft()
			.scale(yScale);

        var axis = d3.select(".axis")
			.transition()
			.duration(1000)
			.call(yAxis);
        
        var bars = d3.selectAll(".bar")
			
			.sort(function (a, b) {
				return b[expressed] - a[expressed];
			})
			.transition() 
			.delay(function (d, i) {
				return i * 20
			})
			.duration(500);

    updateChart(bars, csvData.length, colorScale);
    };

    function updateChart(bars, n, colorScale){
       
        bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            
            .attr("height", function(d, i){
                return 270 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
    
            })
          
            .style("fill", function(d){            
                var value = d[expressed];           
                if(value) {                
                    return colorScale(value);            
                } else {                
                    return "#ccc";            
                } 
        });
        var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in each state");
        
    };

    function highlight(props) {
		
        console.log(props.name)
		var selected = d3.selectAll("." + props.state)
			.style("stroke", "red")
			.style("stroke-width", "2");

		setLabel(props);
	};

	function dehighlight(props) {
		var selected = d3.selectAll("." + props.state)
			.style("stroke", function () {
				return getStyle(this, "stroke")
			})
			.style("stroke-width", function () {
				return getStyle(this, "stroke-width")
			});

		function getStyle(element, styleName) {
			var styleText = d3.select(element)
				.select("desc")
				.text();

			var styleObject = JSON.parse(styleText);

			return styleObject[styleName];
		};

		d3.select(".infolabel").remove();
	};

	function setLabel(props) {

		var labelAttribute = "<h1>" + props[expressed] +
			"</h1></b>";

		var infolabel = d3.select("body")
			.append("div")
			.attr("class", "infolabel")
			.attr("id", props.name + "_label")
			.html(labelAttribute);

		var stateName = infolabel.append("div")
			.attr("class", "labelname")
			.html(props.name);
	};

	function moveLabel(event) {

		var labelWidth = d3.select(".infolabel")
			.node()
			.getBoundingClientRect()
			.width;

		var x1 = event.clientX + 10,
			y1 = event.clientY - 75,
			x2 = event.clientX - labelWidth - 10,
			y2 = event.clientY + 25;

		var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
		var y = event.clientY < 75 ? y2 : y1;

		d3.select(".infolabel")
			.style("left", x + "px")
			.style("top", y + "px");
	};
    /*
    function filterPlayersByState(csvData2) {

        filteredPlayers.length = 0;
        
        csvData2.forEach(function(player) {
            if (player.STATE === expressed2) {
                filteredPlayers.push({NAME: player.NAME, POS: player.POS, HEIGHT: player.HEIGHT, WEIGHT: player.WEIGHT, SCHOOL: player.SCHOOL, CITY: player.CITY, STATE: player.STATE, RANK: player.RANK, STARS: player.STARS});
            }
        });
        console.log(filteredPlayers);
    }
    */


    function secondDropdown(){
        //add select element
        var secondDrop = d3.select("body")
            .append("select")
            .attr("class", "seconddrop")
            .on("change", function(){
                changeAttribute2(this.value)
            });
            
        //add initial option
        var titleOption = secondDrop.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select State");

        //add attribute name options
        var attrOptions = secondDrop.selectAll("attrOptions")
            .data(stateArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });
    };

    
    
    function changeAttribute2(attribute2){

        thirdDropdown.clear();

        expressed2 = attribute2;

        filteredPlayers.length = 0;
        
        csvData2.forEach(function(player) {
            if (player.STATE === expressed2) {
                filteredPlayers.push({NAME: player.NAME, POS: player.POS, HEIGHT: player.HEIGHT, WEIGHT: player.WEIGHT, SCHOOL: player.SCHOOL, CITY: player.CITY, STATE: player.STATE, RANK: player.RANK, STARS: player.STARS});
            }
        });
        thirdDropdown(filteredPlayers);
    };

    function thirdDropdown() {

        var thirdDrop;

        thirdDrop.clear();
        
        thirdDrop = d3.select("body")
            .append("select")
            .attr("class", "thirddrop")
            .on("change", function(){
                changeAttribute3(this.value);
            });

            
        var titleOption = thirdDrop.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Player");

        var attrOptions = thirdDrop.selectAll("attrOptions")
            .data(filteredPlayers)
            .enter()
            .append("option")
            .attr("value", function(d){ return d.NAME })
            .text(function(d){ return d.NAME });
    }

    function changeAttribute3 (attribute3){
        
        singlePlayer.length = 0;
        expressed3 = attribute3;
        
        filteredPlayers.forEach(function(player) {
            if (player.NAME === expressed3) {
                singlePlayer.push({NAME: player.NAME, POS: player.POS, HEIGHT: player.HEIGHT, WEIGHT: player.WEIGHT, SCHOOL: player.SCHOOL, CITY: player.CITY, STATE: player.STATE, RANK: player.RANK, STARS: player.STARS});
            }
    });
    playerStats(singlePlayer);
}

function playerStats(singlePlayer) {
    var list = d3.select("body")
        .append("svg")
        .attr("width", 200)
        .attr("height", 400)
        .attr("class", "list");

    var listBackground = list.append("rect")
        .attr("class", "listBackground")
        .attr("width", 190)
        .attr("height", 390)
    
    var names = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 25)
        .attr("fill", "#000")
        .text(function(d){return "Name: " + d.NAME});

    var positions = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 75)
        .attr("fill", "#000")
        .text(function(d){return "Position: " + d.POS});

    var heights = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 125)
        .attr("fill", "#000")
        .text(function(d){return "Height: " + d.HEIGHT});

    var weights = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 175)
        .attr("fill", "#000")
        .text(function(d){return "Weight: " + d.WEIGHT});

    var schools = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 225)
        .attr("fill", "#000")
        .text(function(d){return "School: " + d.SCHOOL});

    var cities = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 275)
        .attr("fill", "#000")
        .text(function(d){return "City: " + d.CITY})
    
    var ranks = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 325)
        .attr("fill", "#000")
        .text(function(d){return "Rank: " + d.RANK})
    
    var stars = list.append("text")
        .data(singlePlayer)
        .attr("x", 5)
        .attr("y", 375)
        .attr("fill", "#000")
        .text(function(d){return "Stars: " + d.STARS})
    

    var listFrame = list.append("rect")
        .attr("class", "listFrame")
        .attr("width", 190)
        .attr("height", 390)
};






document.addEventListener('DOMContentLoaded',createMap)
