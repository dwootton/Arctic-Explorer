class MapPath {
	constructor(icemap, lineHeatMap) {
		console.log(icemap.timeSelector)
		lineHeatMap = new LineHeatMap(this, icemap);
		this.lineHeatMap = lineHeatMap;
		this.timeSelector = icemap.timeSelector;
		this.projection = icemap.projection;
		this.svg = icemap.svg;
		this.icemap = icemap;
		this.width = parseInt(this.svg.attr("width"));
    	this.height = parseInt(this.svg.attr("height"));

    	/* Sets up Data */ 
    	this.data = icemap.data;
    	this.processDataForHeatMap()

		// Create the map Highlighter and hide it
		this.mapHighlight = this.svg.append('circle')
		        .attr('id','highlighter')
		        .attr('cx',-10)
		        .attr('cy',-10)
		        .attr('r',10)
		        .attr('fill-opacity', 0.1)
		        .attr('stroke-width', 2)
		        .attr('stroke', 'gold');
		/* Define Event Handelers */ 
		let keydown = () => {
	      if (!this.selected) return;
	      switch (d3.event.keyCode) {
	        case 8: // backspace
	        case 46: { // delete
	          var i = points.indexOf(selected);
	          points.splice(i, 1);
	          selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
	          this.redraw();
	          break;
	        }
	      }
	    }
	    let mousedown = () => {
	    	console.log(this)
	      	this.pathPoints.push(this.selected = this.dragged = d3.mouse(this.spline.node()));
	      	this.redraw();
	    }

	    let mousemove = () => {
	      if (!this.dragged) return;
	      let selectedNode = d3.mouse(this.spline.node());
	      this.dragged[0] = Math.max(0, Math.min(this.width, selectedNode[0]));
	      this.dragged[1] = Math.max(0, Math.min(this.height, selectedNode[1]));
	      this.redraw();
	    }

	    let mouseup = () => {
	      if (!this.dragged) return;
	      mousemove();
	      this.dragged = null;

	      // Grab the closest elements along line
	      let closestElements = this.getClosestElements() // Note: Undefined values in array corrrespond to all 0's

	      // Grab other
	      let allData = this.grabDataAtPoints(closestElements);

	      this.lineHeatMap.update(allData);
	      //drawLineHeatMap(allData);
	    }


		this.spline = this.svg
		    .on("mousedown", mousedown)
		    .on("mouseup", mouseup)
		    .append('g');

		this.dragged = null; 
		this.lineGenerator = d3.line()
	        .x(function(d){
	            return d[0];
	        })
	        .y(function(d){
	            return d[1];
	        });
	        
	    this.pathPoints = [[200,200],[400,400]];

	    /*
		this.spline.append("path")
	    	.datum(this.pathPoints)
		    .attr("class", "line")
		    .call(this.redraw);
		    */

		this.selected = this.pathPoints[0];
		this.pointDistances = null;
		this.navCoordinates = null;

		d3.select(window)
	        .on("mousemove", mousemove)
	        .on("mouseup", mouseup)
	        .on("keydown", keydown);

    	this.spline.node().focus();
	}

	/* Getters */
    getNavCoordinates(){
    	return this.navCoordinates;
    }

    getPointDistancesAlongPath(){
    	return this.scaledPointDistances;
    }

    getSelectedCircle(){
    	return this.currentSelectedCircle;
    }

	redraw() {
	    console.log("Your pathpoints are:", this.pathPoints);
	    console.log(this.spline);
	    this.spline.selectAll("path").remove();
	    /* Generate Path Line */
	    let myLine = this.spline.append("path")
	 	  	.datum(this.pathPoints)
	 	  	.attr("class","line")
	      	.attr("d", this.lineGenerator)
	      	.attr('id','navLine');

	    console.log(myLine);

      	this.pointDistances = this.calculatePointDistances(this.pathPoints);

      	/* Generate Nodes Along Path */ 
      	let groups = this.spline
      		.selectAll("g")
      		.data(this.pathPoints);

      	/* Group Enter */
        let eneteredGroups = groups.enter().append('g')
            .attr('transform', function(d){
                return 'translate(' + d[0] + ',' + d[1] + ')';
            })
            .on("mousedown", (d) => {this.selected = this.dragged = d; this.redraw();})

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
	        	// Places number depending on how long it is
	            if(i < 9){
	                return -4;
	            } else {
	                return -8.5;
	            }
	        })
	        .text(function(d,i){
	            return i+1;
	        });
	    /* Group Exit*/
    	groups.exit().remove();

    	/* Check if any groups are selected*/
        groups
            .classed("selectedNavGroup", (d,i) => {
                if(d === this.selected){
                    this.currentSelectedCircle = i;
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
	            } 
	        })

	    /* Stop Propogation */
	    if (d3.event) {
	        d3.event.preventDefault();
	        d3.event.stopPropagation();
	    }
    }

    changeMapNavLine(opacity){
	    this.spline.transition().duration(500).attr('opacity',opacity);
	}

    calculatePointDistances(points){
	    let distances = [0];

	    for(let i = 1; i < points.length; i++){
	        let distX = points[i][0] - points[i-1][0]

	        let distY = points[i][1] - points[i-1][1]
	        let eulcledianDistance = Math.sqrt(distX*distX +  distY*distY);
	        distances[i] = distances[i-1]+eulcledianDistance;

	    }
	    return distances;
	}

	fixHoleInIce(){
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

	processDataForHeatMap() {
				/* Processes Data for Views on the HeatMap */ 
	    this.heatmapData = Object.keys(this.data).map(key => {
	        let latlong = this.parseLatLong(key);
	        return {x:this.projection([latlong[1], latlong[0]])[0],
	                y:this.projection([latlong[1], latlong[0]])[1],
                    val: this.data[key]};
	    });

	    /* Fixes the hole in the Arctic Circle For Data in HeatMap*/
	    // Note: A similar technique was applied from some of the images from the NSIDC
	    this.patchData = this.fixHoleInIce();
	    this.heatmapData = this.heatmapData.concat(this.patchData);
	}
	/* Event Code */
	

    

    grabDataAtPoints(elements){
	    let foundData = [];
	    for(let i = 0; i < elements.length; i++){
	        let element = elements[i];
	        if(element !== undefined){
	            let foundElement = this.heatmapData.find(function(point) {
	                return point.x === element.x && point.y === element.y;
	            })
	            foundData.push(foundElement);
	        } else { // the element corresponds to a area
	            let oceanElement = {
	                val: Array.apply(null, Array(336)).map(Number.prototype.valueOf,0) //Array(336) as length of data
	            }
	            foundData.push(oceanElement);
	        }
	    }
	    return foundData;
	}

    getClosestElements(){
      let navPath = document.getElementById('navLine');
      this.navCoordinates = this.findCoordinatesAlongPath(navPath);
      let closestElements = [];

      for(let i = 0; i < this.navCoordinates.length; i++){
         let navCoordinate = {
             x: this.navCoordinates[i][0],
             y: this.navCoordinates[i][1]
         }
         let bins = this.icemap.getCurrentBins();

         // find the closest hexagon 
         let closestHex = this.findClosestPoint(bins,navCoordinate,100); // After 100, report ocean

         // grab the closest element in the closest hexagon
         let closestPoint = this.findClosestPoint(closestHex, navCoordinate,50)

         closestElements.push(closestPoint);
      }

      return closestElements;
    }

    findClosestPoint(points,goalPoint,threshold){
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


    findCoordinatesAlongPath(path){
        let totalLength = path.getTotalLength();
        this.scaledPointDistances = this.scalePointDistances(this.pointDistances, totalLength);
        let coordinates = []

        for(let lengthCounter = 0; lengthCounter < totalLength; lengthCounter += 25){
             let pt = path.getPointAtLength(lengthCounter);
             pt.x = Math.round(pt.x);
             pt.y = Math.round(pt.y);
             coordinates.push([pt.x,pt.y]);
        }
        return coordinates;
    }

    scalePointDistances(distances, totalLength){
        let scaledDistances = [];
        for(let i = 0; i < distances.length; i++){
            scaledDistances.push(distances[i]/totalLength);
        }
        return scaledDistances;
    }

    parseLatLong(key) {
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
}