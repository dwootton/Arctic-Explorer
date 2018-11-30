
// Spline drawing from: https://bl.ocks.org/mbostock/4342190
// For gussian blur: https://bl.ocks.org/mbostock/1342359
// For Heatmap: http://bl.ocks.org/tjdecke/5558084


let fixedData;
let heatmap;
let mapHighlight;
let navCoordinates;
let pointDistances;
let scaledPointDistances;
let currentSelectedCircle;

async function icemap(currentHeatMap) {
    heatmap = currentHeatMap;
    let svg = d3.select("#map svg");
    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));



    let scale = d3.scaleSequential(d3.interpolateBlues)
        .domain([1, 0]);

    // ocean is ice-free
    svg.style("background-color", scale(0));
    let hexLayer = svg.append('g');   
    let projection = d3.geoGringortenQuincuncial()
        .translate([(400/700) * width, height / 2])
        .scale([600]);

    let path = d3.geoPath()
        .projection(projection);

	svg
        .append("path")
        .datum(d3.geoGraticule())
        .attr("class", "graticule") // styles provided in css file
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "grey");	


    // Load in GeoJSON data
    let world = await d3.json("data/clipped-simplified.json");

    // Bind data and create one path per GeoJSON feature
    let geojson = topojson.feature(world, world.objects.countries)

    let countries = svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        // here we use the familiar d attribute again to define the path
        .attr("d", d => path(d.geometry))
        .attr("fill", "#D2B48C");

    svg.append("defs")
          .append("filter")
            .attr("id", "blur")
          .append("feGaussianBlur")
            .attr("stdDeviation", 1);

    //countries.attr("filter", "url(#blur)");


    let data = (await d3.json("data/lat_long_data.json")).positions;

    let zippeddata = Object.keys(data).map(key => {
        let latlong = parseLatLong(key);
        return {lat: latlong[0], lon: latlong[1], psi: data[key]};
    });

    let psiLength = zippeddata[0].psi.length;

    // Hex 
    fixedData = Object.keys(data).map(key => {
            let latlong = parseLatLong(key);

            return {x:projection([latlong[1], latlong[0]])[0],
                    y:projection([latlong[1], latlong[0]])[1],
                    val: data[key]};
        });

    // fixes the hole in the point heatmap
    let addedData = fixHoleInIce();
    fixedData = fixedData.concat(addedData);

    let margin = {left : 10,
                  right : 10,
                  bottom : 10,
                  top : 10};

    // stores the previous colors of the hexagons to allow for transitions
    let prevColors = [];
    let bins;

    window.render = m => {

        console.log("beginning render");
        const t0 = performance.now();	

        d3.selectAll('.navigationLine')
            .remove()

        let xyData = Object.keys(data).map(key => {
            let latlong = parseLatLong(key);
            let value = 0;
            if(typeof data[key][m] === "number"){
                value = data[key][m];
            }
            return {x:projection([latlong[1], latlong[0]])[0],
                    y:projection([latlong[1], latlong[0]])[1],
                    val: value};
        });
        // Data to add
        
        // fixes the visible hole on the ice map
        addedData = addedData.map(element => {
            return {
                'x':element.x,
                'y':element.y,
                'val': 2.2// 1.8 was chosen after experimention to best determine the color that fits in to the hole
            }
        });

        xyData = xyData.concat(addedData);
        
        let hexGenerator = d3.hexbin(xyData)
            .x(function(d){
                return d.x;
            })
            .y(function(d){
                return d.y;
            })
            .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
            .radius(5); // Set hex radius here, 5 is a good radius

        bins = hexGenerator(xyData);

        bins.forEach(function(d) {
            d.min = d3.min(d, function(p) { 
                if(typeof p.val ==="number"){
                    return p.val;
                }
                return 0;
                });
            d.max = d3.max(d, function(p) {
                if(typeof p.val ==="number"){
                    return p.val;
                }
                return 0;
                
            });
            d.mean = d3.mean(d, function(p) { 
                if(typeof p.val ==="number"){
                    return p.val;
                }
                return 0;
                });
          });

        hexLayer.selectAll('g').remove();

        let hex = hexLayer.append('g').selectAll("path")
          .data(bins);


        hex.exit().remove();

        let newHex = hex
          .enter().append("path")
            .attr('class', 'hexagon')
            .attr("d", function(d) { return "M" + d.x + "," + d.y + hexGenerator.hexagon(); })
            .attr('stroke-width','1px')
            .attr('stroke-opacity',"1.0")
            .attr('fill-opacity','1.0')
            .attr("fill", function(d,i){

                if(!prevColors[i]){
                    prevColors[i] = scale(d.mean);
                }  
                return prevColors[i];
            })
            .attr('stroke', function(d,i){

                if(!prevColors[i]){
                    prevColors[i] = scale(d.mean);
                }  
                return prevColors[i];
            })
            .transition()
            .duration(800)
            .attr("fill", function(d,i){
                prevColors[i] = scale(d.mean);
                return scale(d.mean);
            })
            .attr('stroke', function(d,i){
                prevColors[i] = scale(d.mean);
                return scale(d.mean);
            })
        const t1 = performance.now()
        console.log("ending render: your time was", t1-t0);
    };

    window.render(0);
    mapHighlight = svg.append('circle')
        .attr('id','highlighter')
        .attr('cx',-10)
        .attr('cy',-10)
        .attr('r',10)
        .attr('fill-opacity', 0.1)
        .attr('stroke-width', 2)
        .attr('stroke', 'gold');
    drawSpline(svg, bins)
    modeSelection();
}

/* Used to fill the hole in the ice by creating a square patch*/
        function fixHoleInIce(){
            let returnData =[];
            for(let xIndex = 255.0; xIndex <315.0; xIndex+=2){
                for(let yIndex = 250; yIndex <315; yIndex+=2){
                    let pt = {
                        x:xIndex,
                        y:yIndex,
                        val: Array.apply(null, Array(336)).map(Number.prototype.valueOf,1)
                    };
                    returnData.push(pt)
                }
            }
            return returnData;
        }

function grabAllData(elements){
    let foundData = [];
    for(let i = 0; i < elements.length; i++){
        let element = elements[i];

        if(element !== undefined){
            let foundElement = fixedData.find(function(point) {
                return point.x === element.x && point.y === element.y;
            })
            foundData.push(foundElement);
        } else { // the element corresponds to a area 
            let oceanElement = {
                val: Array.apply(null, Array(336)).map(Number.prototype.valueOf,0)
            }
            foundData.push(oceanElement);
        }        
    }
    return foundData;
    // next steps, plot all points. 
    // plot along path 
}
let div = d3.select("body").append("div")   
            .attr("class", "HMtooltip")               
            .style("opacity", 0);
        



let heatMapSVG;
function drawLineHeatMap(myData){
    let allData = jQuery.extend(true, [], myData);
    d3.select('#lineMap').attr('height', 300).attr('width',650);


    let width = 3500;
    let height = 1000; 
    let margin = { top: 50, right: 0, bottom: 100, left: 50 };
    let rectHeight = rectWidth = 10;
    d3.select('#lineMap').select('svg').selectAll('g').remove();
    let svg = d3.select('#lineMap').select('svg')
                    .attr('width',width)
                    .attr('height',height)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    heatMapSVG = svg;

    let pathGroup = d3.select('#lineMap').select('svg').append('g')
        .attr("transform", "translate(" + margin.left/2 + "," + margin.top + ")");

    let pathScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, allData.length*rectHeight]);

    pathGroup.append('rect')
        .attr('width', 2)
        .attr('height', function(d){
            return pathScale(1);
        })
        .attr('x',12)
        .attr('fill', 'steelblue');

    let pathGroups = pathGroup.selectAll('circle')
        .data(scaledPointDistances);

    pathGroups.exit().remove();

    let newPathGroups = pathGroups.enter().append('g')
        .attr('transform', function(d){
            return 'translate(' + 12+','+pathScale(d)+')';
        });

    newPathGroups
        .append('circle')
        .attr('r', 10)
        .attr('fill',function(d,i){
            if(currentSelectedCircle === i){
                return '#F5B000';
            } 
            return 'white'});

    newPathGroups.append('text')
        .text(function(d,i){
            return i+1;
        })
        .attr('x', function(d,i){
            if(i > 8){
                return -8.5;
            }
            return -4})
        .attr('y', +5)
        .attr('fill','black');

    for(let i = 0; i < allData.length; i++){
        if(allData[i] !== undefined){
            allData[i].val = bindDateAndPointToData(allData[i], new Date(1990,0),i);
        } 
    }
    let query = heatmap.getCurrentQuery();
    let selectedData = filterDataToQuery(query,allData);
    //let groupedSelectedData = groupData(query,selectedData);

    // Currently data is not grouped by point. Group by point and then visualize array as heatmap
    

    let xScaleWidth = query.length*(rectWidth);
    console.log(xScaleWidth);
    if(xScaleWidth < 200){
        xScaleWidth = 200;
    }
    //Set up xScale
    let xScale = d3.scaleTime()
            .domain(d3.extent(query))
            .range([0, xScaleWidth]).nice(); 

    let yScale = function(point){
        return (point+1)*rectHeight;
    }

    //Set up Color Scale
    let colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([1, 0]);

    let rects = svg.selectAll("rect")
              .data(selectedData);

    rects.exit().remove();

            let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];


    rects.enter().append('rect')
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('x', function(d){
            return xScale(d.date);
        })
        .attr('y', function(d){
            return yScale(d.point);
        })
        .attr('fill', function(d){
            if(d.data === "_NaN_"){
                return colorScale(1);
            }
            return colorScale(d.data);
        })
        .on("mouseover", function(d) {
               changeMapNavLine(.2)
               div.transition()
                 .duration(600)
                 .style("opacity", .7);
               div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY - 70 + "px")
                 .style("left", d3.event.pageX - 30 + "px");
                 let currentCoordinate = navCoordinates[d.point]

                d3.select('#highlighter')
                .transition().duration(100).attr('cx',currentCoordinate[0]).attr('cy',currentCoordinate[1]);
                })
             .on("mouseout", function(d) {
                changeMapNavLine(0.9)
               div.transition()
                 .duration(300)
                 .style("opacity", 0);
               d3.select('#highlighter').transition().duration(1000).attr('cx',-10).attr('cy',-10);
               })

             .on("click", function(d){
                let monthsSinceStart = d.date.getMonth() + d.date.getYear()*12;
                let startDate = new Date(1990,0);            
                monthsSinceStart -= startDate.getMonth() + startDate.getYear()*12;
                window.render(monthsSinceStart)
             })


    rects
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('x', function(d){
            return xScale(d.date);
        })
        .attr('y', function(d){

            return yScale(d.point);
        })
        .attr('fill', function(d){
            if(d.data === "_NaN_"){
                return colorScale(1);
            }
            return colorScale(d.data);
        })


    // Append Axis
    let x_axis = d3.axisBottom(xScale).ticks((query.length/15+1));

    svg.append("g")
       .call(x_axis)
       .selectAll("text")
        .attr("y", -10)
        .attr("x", 0)
        .attr("dy", ".35em");

    /*
    let xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient("top");

    */

    appendLabels(svg);

    //Set up Append Rects 
    if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }

}
function appendLabels(svg){
        let height = 300;
        let width = 800;
        let margin = {
            top:20,
            left:20
        }
        svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -45)
                .attr("x",0 - ((height- margin.top)/ 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Distance along path");

            // Add X Label
        svg.append("text")
                .attr("y", -35)
                .attr("x", ((width+margin.left)/2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Date");
    }

function groupData(query,selectedData){
    let counter = 0;
    let groupedArray = [];
    while(counter < selectedData.length){
        let newArr = [];
        for(let i = 0; i < query.length; i++){
            newArr.push(selectedData[counter])
            counter++;
        }
        groupedArray.push(newArr)
    }
    return groupedArray;
}

function bindDateAndPointToData(fullData,startDate,point){
        let data = fullData.val;
        let returnData = [];
        let currentDate = new Date(startDate);

        // add data and date to the return array.
        for(let i = 0; i < data.length; i++){
            returnData.push({
                'x': fullData.x,
                'y': fullData.y,
                'data': data[i],
                'date': new Date(currentDate),
                'point': point}
            );
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return returnData;
    }

function filterDataToQuery(query,allData) {
    let returnData = [];
    let counter = 0;

    for(let i = 0; i < allData.length; i++){
        for(let innerCounter = 0; innerCounter < allData[i].val.length; innerCounter++){
            let inArray = !!query.find(item => {return item.getTime() == allData[i].val[innerCounter].date.getTime()});
            if(inArray){
                returnData.push(allData[i].val[innerCounter]);
            }
        }
    }
    return returnData;
};

function changeMapNavLine(opacity){
    splineSVG.transition().duration(500).attr('opacity',opacity);
}




/* New Line Creation for Line Spline*/
function drawSpline(svg, bins){


    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

        let vis = svg
    .on("mousedown", mousedown)
    .on("mouseup", mouseup)
    .append('g');
    splineSVG = vis;

    let line = d3.line()
        .x(function(d){
            return d[0];
        })
        .y(function(d){
            return d[1];
        });

    let points = [[400,400]];
  

    vis.append("path")
    .datum(points)
    .attr("class", "line")
    .call(redraw);

    //WORK ON LINE DRAWING!!!!!!!// 
    /*
    let i = 0;
    let xPosition = [];
    let yPosition = [];

    */
    var dragged = null,
    selected = points[0];

    d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);

    vis.node().focus();

    function redraw() {
        console.log(points);
      vis.selectAll("path").datum(points).attr("d", line).attr('id','navLine');

      pointDistances = calculatePointDistances(points);


      let groups = vis.selectAll("g").data(points);

      let eneteredGroups = groups.enter().append('g')
        .attr('transform', function(d){
            return 'translate(' + d[0] + ',' + d[1] + ')';
        })
          .on("mousedown", function(d) { selected = dragged = d; redraw(); })
    eneteredGroups
        .append('circle')
        .attr('class','navCircle')
          .attr("r", 1e-6)
        .transition()
          .duration(750)
          .attr("r", 10)
          .attr('fill','white');

    eneteredGroups
        .append('text')
        .attr('y', +5)
        .attr('x', function(d,i){
            if(i < 9){
                return -4;
            } else {
                return -8.5;
            }
        })
        .text(function(d,i){
            return i+1;
        });

    groups.exit().remove();



        groups
            .classed("selectedNavGroup", function(d,i) { 
                if(d === selected){
                    currentSelectedCircle = i;
                    return true;
                }
                return false; })
        .attr('transform', function(d){
            return 'translate(' + d[0] + ',' + d[1] + ')';
        })
          .attr("x", function(d) { 
            if(d){
                return d[0];
            }
             })
          .attr("y", function(d) { 
            if(d){
                return d[1];
            } })

          
      if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    }
    /* Event Code */
    function mousedown() {
      points.push(selected = dragged = d3.mouse(vis.node()));
      redraw();
    }

    function mousemove() {
      if (!dragged) return;
      var m = d3.mouse(vis.node());
      dragged[0] = Math.max(0, Math.min(width, m[0]));
      dragged[1] = Math.max(0, Math.min(height, m[1]));
      redraw();
    }

    function mouseup() {
      if (!dragged) return;
      mousemove();
      dragged = null;

      // Grab the closest elements along line
      let closestElements = getClosestElements() // Note: Undefined values in array corrrespond to all 0's

      // Grab other 
      let allData = grabAllData(closestElements);
      drawLineHeatMap(allData);


    }


    function getClosestElements(){
      
      let navPath = document.getElementById('navLine');
      navCoordinates = findCoordinatesAlongPath(navPath);
      let closestElements = [];

      for(let i = 0; i < navCoordinates.length; i++){
        // grab the hexagon
        //let element = document.elementFromPoint(navCoordinates[i][0], navCoordinates[i][1]);
        
        let navCoordinate = {
            x: navCoordinates[i][0],
            y: navCoordinates[i][1]
        }

        let closestHex = findClosestPoint(bins,navCoordinate,100);
        // grab the closest element in hexagon
        let closestPoint = findClosestPoint(closestHex, navCoordinate,50)

        // As some of the values were given 2 to fill in the hole
            closestElements.push(closestPoint);
      }
      return closestElements;
    }

    function scalePointDistances(distances, totalLength){
        let scaledDistances = [];
        for(let i = 0; i < distances.length; i++){
            scaledDistances.push(distances[i]/totalLength);
        }
        return scaledDistances;
    }

    function findCoordinatesAlongPath(path){
        
        let totalLength = path.getTotalLength();
        scaledPointDistances = scalePointDistances(pointDistances, totalLength );
        let navCoordinates = []

        for(let lengthCounter = 0; lengthCounter < totalLength; lengthCounter += 25){
             let pt = path.getPointAtLength(lengthCounter);
             pt.x = Math.round(pt.x);
             pt.y = Math.round(pt.y);
             navCoordinates.push([pt.x,pt.y]);
        }
        return navCoordinates;
    }

    function findClosestPoint(points,goalPoint,threshold){
        let distances = [];

        if(points === undefined){ //if there are no close points, return ocean;
            return undefined;
        }

        for(let i = 0; i < points.length; i++){

            let distX = goalPoint.x - points[i].x 

            let distY = goalPoint.y - points[i].y 

            let eulcledianDistance = Math.sqrt(distX*distX +  distY*distY);
            if(eulcledianDistance < threshold){
                distances.push(eulcledianDistance);
            } else {
                distances.push(10000000);
            }
            
        }

        let min = Math.min(...distances);
        if(min ===10000000){
            return undefined; // return ocean point
        }
        let closestIndex = distances.indexOf(min);

        return points[closestIndex];
    }


    function keydown() {
      if (!selected) return;
      switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
          var i = points.indexOf(selected);
          points.splice(i, 1);
          selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
          redraw();
          break;
        }
      }
    }
}

function calculatePointDistances(points){
    let distances = [0];

    for(let i = 1; i < points.length; i++){
        let distX = points[i][0] - points[i-1][0]

        let distY = points[i][1] - points[i-1][1]
        let eulcledianDistance = Math.sqrt(distX*distX +  distY*distY);
        distances[i] = distances[i-1]+eulcledianDistance;

    }
    return distances;
}

function parseLatLong(key) {
    let halves = key.split("x");
    if (halves.length !== 2) {
        return null;
    }
    if (!halves[0].startsWith("l")) {
        return null;
    }
    let lat = parseFloat(halves[0].replace("l", " ").replace("_", "."));
    let long = parseFloat(halves[1].replace("neg", "-").replace("_", "."));
    return [lat, long];
}
