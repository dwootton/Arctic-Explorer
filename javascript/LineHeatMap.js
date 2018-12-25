class LineHeatMap {
	constructor(mapPath, icemap){
		//console.log(icemap);
		this.iceMap = icemap;
		this.timeSelector = icemap.timeSelector;
		
		this.mapPath = mapPath;
		this.visibleHeight = 275;
		this.visibleWidth = 1000;
		this.fullHeight = 1000;
		this.fullWidth = 3500;

		this.margin = { top: 50, right: 0, bottom: 100, left: 50 };
		this.rectHeight = 16;
		this.rectWidth = 16;
		/* Appends Div for the tool tip*/
		this.div = d3.select("body").append("div")
            .attr("class", "HMtooltip")
            .style("opacity", 0);

		d3.select('#lineMap')
			.attr('height', this.visibleHeight)
			.attr('width',this.visibleWidth);

		

	    this.svg = d3.select('#lineMap').select('svg')
	                    .attr('width',this.fullWidth)
	                    .attr('height',this.fullHeight)
	    
	               
	}

	update(data) {

		this.heatMapData = jQuery.extend(true, [], data);

		// Remove Old Heat Maps
		d3.select('#lineMap').select('svg').selectAll('g').remove();

		this.heatMapLayer = this.svg.append("g")
	             .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	    this.drawPathLegend();

	    this.drawHeatMap();
	    
	    
	}

	bindDateAndPointToData(fullData,startDate,point){
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

	drawHeatMap(){

		for(let i = 0; i < this.heatMapData.length; i++){
	        if(this.heatMapData[i] !== undefined){
	            this.heatMapData[i].val = this.bindDateAndPointToData(this.heatMapData[i], new Date(1990,0),i);
	        } 
	    }
	    console.log(this.heatMapData)
	    let query = this.timeSelector.getCurrentQuery();
	    console.log(query)

    	let selectedData = this.filterDataToQuery(query);

    	let xScaleWidth = query.length*(this.rectWidth);
	    console.log(xScaleWidth);

	    //Set up xScale
	    let xScale = d3.scaleLinear()
	            .domain([0,query.length-1])
	            .range([0, xScaleWidth]).nice();

	    let yScale = (point) => {
	        return (point+1)*this.rectHeight;
	    }

	    //Set up Color Scale
	    let colorScale = d3.scaleSequential(d3.interpolateBlues)
	        .domain([1, 0]);

	    // Set Names for the Tool Tip
	    this.monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

	    let navCoordinates = this.mapPath.getNavCoordinates();

	    let rects = this.heatMapLayer.selectAll("rect")
	              .data(selectedData);

	    rects.exit().remove();

	    rects.enter().append('rect')
	        .attr('width', this.rectWidth)
	        .attr('height', this.rectHeight)
	        .attr('x', function(d){
	        	let index = query.map(Number).indexOf(+d.date);
	            return xScale(index);
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
	        .on("mouseover", (d) => {
                 this.mapPath.changeMapNavLine(.2)
                 this.div.transition()
                 	.duration(600)
                 	.style("opacity", .7);
                 this.div.html(this.monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 	.style("top", d3.event.pageY - 70 + "px")
                 	.style("left", d3.event.pageX - 30 + "px");
                 let currentCoordinate = navCoordinates[d.point]
                 d3.select('#highlighter')
                	.transition().duration(100).attr('cx',currentCoordinate[0]).attr('cy',currentCoordinate[1]);
             })
             .on("mouseout",(d)=> {
                 this.mapPath.changeMapNavLine(0.9)
                 this.div.transition()
                 	.duration(300)
                 	.style("opacity", 0);
                 d3.select('#highlighter').transition().duration(1000).attr('cx',-10).attr('cy',-10);
               })

             .on("click", (d) =>{
             	// Find index of the clicked Date
                let monthsSinceStart = d.date.getMonth() + d.date.getYear()*12;
                let startDate = new Date(1990,0);
                monthsSinceStart -= startDate.getMonth() + startDate.getYear()*12;
                // Update Map View
                this.iceMap.renderMap(monthsSinceStart);
             })

        rects
	        .attr('width', this.rectWidth)
	        .attr('height', this.rectHeight)
	        .attr('x', function(d){
	        	let index = query.map(Number).indexOf(+d.date);
	            return xScale(index);
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

	    // 

	    // TO DO: Make xScale 
	    //let x_axis = d3.axisBottom(xScale).tickValues([]);
	    let vals = this.heatMapLayer.append("g")
	    	.selectAll("text")
	    	.data(query)
	    	.enter()
	    	.append("text")
	    		.attr('transform', (d,i)=> {
	    			return "translate("+ (10+xScale(i)) + ","+ (10) +") rotate(270)";
	    		})
	    		.attr('font-size','0.50em')
	    		.text((d)=>{
	    			return this.monthNames[d.getMonth()] + " "+ d.getFullYear();
	    		});
	    		
	    		console.log(vals);

	    /*(this.heatMapLayer.append("g")
	       .call(x_axis)
	       .selectAll("text")
	        .attr("y", -10)
	        .attr("x", 0)
	        .attr("dy", ".35em");
			*/

	    this.appendLabels();

	    /* Stop Event Propogation */ 
	    if (d3.event) {
	        d3.event.preventDefault();
	        d3.event.stopPropagation();
	      }
	}

	appendLabels() {
        this.heatMapLayer.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -45)
                .attr("x",0 - ((this.visibleHeight - 20)/ 2))
                .attr("dy", ".8em")
                .style("text-anchor", "middle")
                .text("Distance along path");

            // Add X Label
        this.heatMapLayer.append("text")
                .attr("y", -45)
                .attr("x", ((this.visibleWidth + 20)/2))
                .attr("dy", ".8em")
                .style("text-anchor", "middle")
                .text("Date");

    }


	filterDataToQuery(query) {
	    let returnData = [];
	    let counter = 0;

	    for(let i = 0; i < this.heatMapData.length; i++){
	        for(let innerCounter = 0; innerCounter < this.heatMapData[i].val.length; innerCounter++){
	            let inArray = !!query.find(item => {return item.getTime() == this.heatMapData[i].val[innerCounter].date.getTime()});
	            if(inArray){
	                returnData.push(this.heatMapData[i].val[innerCounter]);
	            }
	        }
	    }
	    return returnData;
	};

	drawPathLegend(heatMapData){
		let pathScale = d3.scaleLinear()
	        .domain([0, 1])
	        .range([0, this.heatMapData.length*this.rectHeight]);

	    let pathGroup = d3.select('#lineMap').select('svg').append('g')
        	.attr("transform", "translate(" + this.margin.left/2 + "," + this.margin.top + ")");

       	/* Append Linearized Path Line */
	    pathGroup.append('rect')
	        .attr('width', 2)
	        .attr('height', function(d){
	            return pathScale(1);
	        })
	        .attr('x',12)
	        .attr('fill', 'steelblue');

	    /* Append Nodes Along Path Legend*/
	    let scaledPointDistances = this.mapPath.getPointDistancesAlongPath();
	    let currentSelectedCircle = this.mapPath.getSelectedCircle();
	    console.log("Your scaled point distances are:", scaledPointDistances)
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
	        //moves accoridng ot 1 or two digit number
	            if(i > 8){
	                return -8.5;
	            }
	            return -4})
	        .attr('y', +5)
	        .attr('fill','black');


	}
}
