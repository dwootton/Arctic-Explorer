  class TimeChart {
    /**
     *
     */
     constructor(data, window){



        this.map = window;
        this.first = true;
        this.margin = {top: 20, right: 30, bottom: 100, left: 50};
        let fullWidth = 800;
        let fullHeight = 400;

        this.width = fullWidth - this.margin.left - this.margin.right;
        this.height = fullHeight - this.margin.top - this.margin.bottom;
        let that = this;

        this.startDate = new Date(1990,0);

        data.then(function(myData){


          let data = myData.psijson;
          let plottingData = that.bindDateToData(data, that.startDate)

          that.allData = plottingData;
          that.plottingData = plottingData;

          that.concentrationScale = d3.scaleLinear()
            .domain([0,1])
            .range([that.height,0]).nice();

          // Sets the scale for the x axis
          that.timeScale = d3.scaleTime()
            .domain(d3.extent(data, function(d) { 
              return d.date; 
            }))
            .range([0, that.width]).nice(); 

          that.xAxis = d3.axisBottom(that.timeScale).ticks(12);
          that.yAxis = d3.axisLeft(that.concentrationScale).ticks(12 * that.height / that.width);

          let lineGenerator = d3.line()
            .x((d) => timeScale(d.date))
            .y((d) => concentrationScale(d.data))
            .curve(d3.curveMonotoneX);

        that.svg = d3.select('#chart')
          .append('svg')
            .attr('height', fullHeight)
            .attr('width', fullWidth);

        that.svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          //.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
          .attr("width", that.width)
          .attr("height", that.height);

        that.zoomWindow = that.svg.append("rect")
          .attr("clip-path", "url(#clip)")
          .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
          .attr("width", that.width)
          .attr("height", that.height)
          .style("opacity", 1)
          .style("fill", "whitesmoke");

        that.svg.append("g")
          .attr("class", "x axis ")
          .attr('id', "axis--x")
          .attr("transform", "translate(" + that.margin.left + "," + (that.height + that.margin.top) + ")")
          .call(that.xAxis);

        that.svg.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
          .attr('id', "axis--y")
          .call(that.yAxis);

        that.line = that.svg.append("g").attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
        that.dot = that.svg.append("g").attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");

        that.svg.append("text")
                  .attr("x", (that.width + that.margin.left - that.margin.right) / 2)          
                  .attr("y", 0 + (that.margin.top*2 / 3))
                  .attr("text-anchor", "middle")  
                  .style("font-size", "16px") 
                  .text("Average Sea Ice Concentration");

        that.appendLabels();
        
        let ref = that;

        let zoomed = function(){
          let new_yScale = d3.event.transform.rescaleY(ref.concentrationScale);
          let new_xScale = d3.event.transform.rescaleX(ref.timeScale);
          
          // re-scale axes
          ref.svg.select(".y.axis")
              .call(ref.yAxis.scale(new_yScale));

          ref.svg.select(".x.axis")
              .call(ref.xAxis.scale(new_xScale));

          // re-draw line
          let plotLine = d3.line()
              .curve(d3.curveMonotoneX)
              .x(function (d) {
                  return new_xScale(d.date);
              })
              .y(function (d) {
                  return new_yScale(d.data);
              });

          ref.line.select('path').attr("d", plotLine);

          ref.dot.selectAll('circle')          
            .attr("cx", function(d) {
              return new_xScale(d.date);
            })
            .attr("cy", function(d) {
              return new_yScale(d.data);
            })
            .attr("r", function(d){
              return 5;
            });
          

          
        }

        that.div = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);

        var zoom = d3.zoom().on('zoom', zoomed);

        that.zoomWindow.call(zoom);

        that.update();

        /*
        let chart = svg
          .append("g")
            .attr("transform","translate(" + this.margin.left+"," + this.margin.top+")");


        console.log('HEIGHT AND WIDTH!!!!',this.height,this.width);
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
          

          
          that.chart = chart;

          that.timeChart();
        })
        */
        
     })
   }
   appendLabels(){
    this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -3)
            .attr("x",0 - ((this.height+this.margin.top)/ 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Sea Ice Concentration");

        // Add X Label
        this.svg.append("text")
            .attr("y", this.height+this.margin.top+20)
            .attr("x", ((this.width+this.margin.left)/2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date");
   }
  zoomed(event,ref) {

        // Update Scales
        
    }


    update(){

      let xExtent = d3.extent(this.plottingData, d => d.date);
      let yExtent = d3.extent(this.plottingData, d => d.data);

      console.log('before', xExtent)

      xExtent[0] = new Date(xExtent[0]).setMonth(xExtent[0].getMonth() - 1);
      xExtent[1] = new Date(xExtent[1]).setMonth(xExtent[1].getMonth() + 1);
      console.log('after', xExtent)
      yExtent[1] = yExtent[1] +.05;

      this.timeScale.domain(xExtent).nice();
      this.concentrationScale.domain(yExtent).nice();

      let view = d3.zoomTransform(this.zoomWindow.node());
      let rescaledConcentrationScale = view.rescaleY(this.concentrationScale);
      let rescaledTimeScale = view.rescaleX(this.timeScale)
      let that = this;

      let lineGenerator = d3.line()
            .x(function(d){
              return rescaledTimeScale(d.date)}
              )
            .y(function(d){
              return rescaledConcentrationScale(d.data)})
            .curve(d3.curveMonotoneX);

      this.yAxis.scale(rescaledConcentrationScale);
      this.xAxis.scale(rescaledTimeScale);

      this.svg.transition().duration(750).select('.y.axis').call(this.yAxis);
      this.svg.transition().duration(750).select('.x.axis').call(this.xAxis);

      //let lineSelect = this.line.selectAll('path').data(this.plottingData);
      console.log(this.first);

      if(this.first){
        this.first = false;
        this.line
          .attr("clip-path", "url(#clip)")
          .append('path')
            .datum(this.plottingData)
            .attr('class','line')
            .attr('d', lineGenerator)
            .style('fill','none')
            .style('stroke','black');

        this.dot.selectAll().remove('*');

        let chartCircles = this.dot.append("g")
          .attr("clip-path", "url(#clip)")
          .selectAll(".dot")
          .data(this.plottingData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) {
              return rescaledTimeScale(d.date);
            })
            .attr("cy", function(d) {
              return rescaledConcentrationScale(d.data);
            })
            .attr("stroke", "white")
            .attr("stroke-width", "2px")
            .style("fill", 'orange');

        let toolTipAppearDuration = 200;
        let toolTipDisappearDuration = 400;
        // Appends functionality
        let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

        // Creates tool tip
        chartCircles
            .on("mouseover", function(d) {
               that.div.transition()
                 .duration(toolTipAppearDuration)
                 .style("opacity", .7);
               that.div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY - 70 + "px")
                 .style("left", d3.event.pageX - 30 + "px");
               })

        // Handles tool tip
        chartCircles
             .on("mouseout", function(d) {
               that.div.transition()
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



        

      } else {        
        let lineSelect = this.line.select("path").datum(this.plottingData);
        console.log(lineSelect)

        lineSelect.transition().duration(750)
          .attr("d", lineGenerator)
          .attr('stroke','green');

        //Update all circles under the clipping group
        let scatterSelect = this.dot.select('g').selectAll("circle").data(this.plottingData);
        
        scatterSelect.transition()
          .duration(750)
          .attr("cx", function(d) {
            return rescaledTimeScale(d.date);
          })
          .attr("cy", function(d) {
            return rescaledConcentrationScale(d.data);
          })
          .attr("stroke", "white")
          .attr("stroke-width", "2px")
          .style("fill", 'green');

        //Enter new circles
        let newCircles = scatterSelect.enter()
          .append("circle")
            .attr("cx", function(d) {
              return rescaledTimeScale(d.date);
            })
            .attr("cy", function(d) {
              return rescaledConcentrationScale(d.data);
            })
            .attr("r", 5)
            .attr("stroke", "white")
            .attr("stroke-width", "2px")
            .style("fill", 'red');

        let toolTipAppearDuration = 200;
        let toolTipDisappearDuration = 400;
        // Appends functionality
        let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

        // Creates tool tip
        newCircles
            .on("mouseover", function(d) {
               that.div.transition()
                 .duration(toolTipAppearDuration)
                 .style("opacity", .7);
               that.div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY - 70 + "px")
                 .style("left", d3.event.pageX - 30 + "px");
               })

        // Handles tool tip
        newCircles
             .on("mouseout", function(d) {
               that.div.transition()
                 .duration(toolTipDisappearDuration)
                 .style("opacity", 0);
               })

        // Handels point selection
        newCircles
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

        // Remove old
        scatterSelect.exit().remove()
      }

      
    

      //lineSelect//.transition().duration(750)
       // .attr('d',lineGenerator)

      //Update all circles
      /*
      let scatterSelect = this.dot.selectAll("circle").data(this.plottingData);
      
      scatterSelect.transition()
        .duration(750)
        .attr("cx", function(d) {
          return new_xScale(d.);
        })
        .attr("cy", function(d) {
          return new_yScale(d.y);
        })
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .style("fill", function() {
          return d.color = color(d.key);
         });

      //Enter new circles
      scatterSelect.enter()
        .append("circle")
          .attr("cx", function(d) {
            return new_xScale(d.x);
          })
          .attr("cy", function(d) {
            return new_yScale(d.y);
          })
          .attr("r", 5)
          .attr("stroke", "white")
          .attr("stroke-width", "2px")
          .style("fill", function() {
            return d.color = color(d.key);
          })
          .on("click", function(d,i) {
            let s = d3.select(this);
            remove(s,i, d.name);
          });

      // Remove old
      scatterSelect.exit().remove()
      */
    }
    

     filterDataFromHeatMap(query, allData) {
        let returnData = [];
        let counter = 0;

        for(let i = 0; i < allData.length; i++){
          //console.log('query: ', query[counter]);
          console.log('data: ', allData[i]);

            let inArray = !!query.find(item => {return item.getTime() == allData[i].date.getTime()});

            if(inArray){
              //query[counter] && allData[i].date.getMonth() == query[counter].getMonth() && allData[i].date.getFullYear() == query[counter].getFullYear()){
              console.log('query: ', query);
              console.log('data: ', allData[i]);
                returnData.push(allData[i]);
                //counter += 1;
            }
        }
        return returnData;
     };
/*
     selectData(){
        this.plottingData = newData;
        timeChart();
     }
  */
  
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

    selectData(dates){
      //dates = [new Date(1990,0), new Date(1994,2), new Date(2001,1)]
      //console.log('before',dates);

      this.plottingData = this.filterDataFromHeatMap(dates, this.allData);
      //console.log('after:' , this.plottingData)
      this.update();
    }

/*
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
      // Append x axis
        this.chart.append("g")
            .attr("class", "x axis")
            //.attr("transform", "translate(0," + (height-margin.bottom) + ")")
            .call(d3.axisBottom(timeScale)); // Create an axis component with d3.axisBottom

        // Append y axis
        this.chart.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(concentrationScale)); // Create an axis component with d3.axisLeft

      // Add Y Label
        this.chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left)
            //.attr("x",0 - ((this.height-this.margin.bottom)/ 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Sea Ice Concentration");

        // Add X Label
        this.chart.append("text")
            //.attr("y", this.height - (this.margin.bottom + this.margin.top)/1.5)
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
  */
}


