  class TimeChart {
    /**
     *
     */
     constructor(data, window){
        let svg = d3.select('#chart svg');
        let that = this;
        console.log("timechart window",window)
        this.map = window;
        this.startDate = new Date(1990,0);

        data.then(function(myData){
          let data = myData.psijson;
          let plottingData = that.bindDateToData(data, that.startDate)

          //that.map = window;
          that.data = data; 
          that.plottingData = plottingData;
          that.margin = {top: 20, right: 30, bottom: 100, left: 50};
          that.height = svg.attr("height");
          that.width = svg.attr("width");
          that.chart = svg.append("g").attr("transform","translate(" + that.margin.left+"," + that.margin.top+")")

          that.timeChart();
        })
        
     }

     filterDataFromHeatMap(query, allData) {
        let returnData = [];
        let counter = 0;

        for(let i = 0; i < allData.length; i++){
            if(query[counter] && allData[i].date.getMonth() == query[counter].getMonth() && allData[i].date.getFullYear() == query[counter].getFullYear()){
                returnData.push(allData[i]);
                counter += 1;
            }
        }
        return returnData;
     };

     selectData(){
        this.plottingData = newData;
        timeChart();
     }

     bindDateToData(data,startDate){
        let returnData = [];
        let currentDate = new Date(startDate);


        // add data and date to the return array.
        for(let i = 0; i < data.length; i++){
            returnData.push({
                'data': data[i],
                'date': new Date(currentDate)}
            );
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return returnData;
    }

    timeChart() {
        let chart = this.chart;
        let that = this;

              // Process the Data
              // myQuery is currently a 
              let myQuery = [new Date(1990,0),new Date(1991,1), new Date(1992,2), new Date(1993,3), new Date(1994,4), new Date(1995,5), new Date(1996,6), new Date(1997,7), new Date(1998,8), new Date(1999,9), new Date(2000,10), new Date(2001,11)]; 
              //let myQuery = this.generateDates(new Date(1990,0), new Date(2017,11))
              console.log(myQuery);
              let plottingData = that.filterDataFromHeatMap(myQuery,that.plottingData);
              console.log(that.data);

              // Draw the chart
              that.drawChart(plottingData, chart);

              // Append the title
              chart.append("text")
                  .attr("x", (that.width + that.margin.left - that.margin.right) / 2)          
                  .attr("y", 0 - (that.margin.top / 4))
                  .attr("text-anchor", "middle")  
                  .style("font-size", "16px") 
                  .text("Average Sea Ice Concentration");
      }

    drawChart(data, chart){
        let svg = d3.select('#chart svg');
        let width = parseInt(svg.attr("width"));
        let height = parseInt(svg.attr("height"));
        let margin = {top: 20, right: 30, bottom: 100, left: 50};
        let drawDuration = 1000;

        let dataMax = d3.max(data, d => d.data);

        // Sets the scale for the y axis
        let concentrationScale = d3.scaleLinear()
            .domain([0,dataMax+.1])
            .range([height-margin.bottom, margin.top]);

        // Sets the scale for the x axis
        let timeScale = d3.scaleTime()
          .domain(d3.extent(data, function(d) { 
            return d.date; 
          }))
          .range([0, width-margin.right-margin.left]); 

        let chartData = chart.data(data);

        // Remove older elements
        chartData.exit().remove();

        // Creates line generator function for the path
        let lineGenerator = d3.line()
            .x((d, i) => timeScale(d.date))
            .y((d) => concentrationScale(d.data))
            .curve(d3.curveMonotoneX);

        // Append x axis
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height-margin.bottom) + ")")
            .call(d3.axisBottom(timeScale)); // Create an axis component with d3.axisBottom

        // Append y axis
        chart.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(concentrationScale)); // Create an axis component with d3.axisLeft

        // Append the path 
        let path = chart.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d",lineGenerator);

        // Add the circles and draw animation
        chart.append('g')
            .selectAll(".dot")
            .data(data)
          .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function(d, i) { return timeScale(d.date) })
            .attr("cy", function(d) { return concentrationScale(d.data) })
            .attr("r", 0);

        // Append div for useage with the tool tip
        let div = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);

        // Sets up tool tip information 
        let circleDelay = (1.0*drawDuration)/data.length;
        let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
        d3.selectAll("circle")
            .transition()
            .delay(function(d,i){return i*circleDelay})
            .duration(100) 
            .attr("r", function(d,i){return 4})
        let toolTipAppearDuration = 200;
        let toolTipDisappearDuration = 400;
        let that = this;
        // Appends functionality
        let chartCircles = d3.selectAll("circle");

        // Creates tool tip
        chartCircles
            .on("mouseover", function(d) {
               div.transition()
                 .duration(toolTipAppearDuration)
                 .style("opacity", .7);
               div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY - 70 + "px")
                 .style("left", d3.event.pageX - 30 + "px");
               })

        // Handles tool tip
        chartCircles
             .on("mouseout", function(d) {
               div.transition()
                 .duration(toolTipDisappearDuration)
                 .style("opacity", 0);
               })

        // Handels point selection
        chartCircles
             .on("click", function(element){
                d3.selectAll("circle").classed("selected", false);
                d3.select(this).classed("selected", true);
                console.log((element.date.getYear()*12))
                console.log(that.startDate)
                let monthsSinceStart = element.date.getMonth() + element.date.getYear()*12;

                monthsSinceStart -= that.startDate.getMonth() + that.startDate.getYear()*12;
                console.log(monthsSinceStart);
                that.map.render(monthsSinceStart)
             });

        // Add animations to the chart
        let totalLength = path.node().getTotalLength();

        // Set Properties of Dash Array and Dash Offset and initiate Transition
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
          .transition() 
            .delay(100)
            .duration(drawDuration) 
            .ease(d3.easeLinear) 
            .attr("stroke-dashoffset", 0);

        this.appendLabels();
    }

    appendLabels(){
      // Add Y Label
        this.chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left)
            .attr("x",0 - ((this.height-this.margin.bottom)/ 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Sea Ice Concentration");

        // Add X Label
        this.chart.append("text")
            .attr("y", this.height - (this.margin.bottom + this.margin.top)/1.5)
            .attr("x", (this.width - this.margin.right)/2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date");
    }

    generateDates(start,end){
      let current = start;
      let returnDates = []
      while(current < end){
        if((current.getMonth()+1)%9 == 0){
          returnDates.push(new Date(current));
        }
        
        current.setMonth(current.getMonth() + 1);
      }
      return returnDates;
    }

  }  


