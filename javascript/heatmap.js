async function heatmap(data) {
    let svg = d3.select("#heatmap table");
    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

    let startYear = 1990;
    let endYear = 1993; // noninclusive

    let months = ["Jan", "Feb", "Mar", "Apr", 
                  "May", "Jun", "Jul", "Aug", 
                  "Sep", "Oct", "Nov", "Dec"];

    data = (await data).psijson;

    let years = [];
    for (let i = startYear; i < endYear; i++) {
        let slice = data.splice(0, 12);
        years.push({
            year: i, 
            months: months.map((m, i) => ({name: m, psi: slice[i]})),
        });
    }

    console.log(years);

    let extent = d3.extent(data);
    let scale = d3.scaleSequential(d3.interpolateBlues)
        .domain([extent[1], extent[0]]);

    let head = svg.append("thead").append("tr");

    head.append("th");

    head.selectAll("th.month")
        .data(months).enter()
        .append("th")
        .text(d => d)
        .attr("class", "month");

    let rows = svg.append("tbody").selectAll("tr")
        .data(years)
        .enter()
        .append("tr");

    rows.append("th").attr("class", "year").text(d => d.year);

    rows.selectAll("td.month")
        .data(year => year.months)
        .enter()
        .append("td")
        .style("background-color", d => scale(d.psi));


    let selection = null;
    d3.select("body").on("mouseup", function() {
        if (selection !== null) {
            console.log("End: " + selection);
            selection = null;
        }
    });
    d3.selectAll("th.month").on("mouseover", d => {
        if (selection !== null) {
            console.log("Add: " + d);
            selection.push(d);
        }
    });
    d3.selectAll("th.month").on("mousedown", (d) => {
        console.log("Start: " + d);
        selection = [d];
    });
    d3.selectAll("th.year").on("click", d => console.log(d));
}
