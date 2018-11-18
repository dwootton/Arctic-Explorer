async function heatmap(psidata) {
    let table = d3.select("#heatmap table");
    let width = parseInt(table.attr("width"));
    let height = parseInt(table.attr("height"));

    let head = table.append("thead").append("tr");
    let tbody = table.append("tbody");
    head.append("th");

    let startYear = 1990;
    let endYear = 1993; // noninclusive

    let months = ["Jan", "Feb", "Mar", "Apr", 
                  "May", "Jun", "Jul", "Aug", 
                  "Sep", "Oct", "Nov", "Dec"];

    let mousedown = false;
    let selectedMonths = ["Jan", "Jul"];
    let selectedYears = [1991];

    d3.select("#heatmap #clear").on("click", () => {
        selectedMonths = [];
        selectedYears = [];
        window.renderHeatmap();
    });

    psidata = (await psidata).psijson;

    window.renderHeatmap = () => {
        let data = psidata.slice();

        let hasSelection = selectedMonths.length !== 0 || selectedYears.length !== 0;
        let years = [];
        for (let i = startYear; i < endYear; i++) {
            let slice = data.splice(0, 12);
            years.push({
                year: i, 
                selected: selectedYears.includes(i),
                months: months.map((m, n) => ({
                    name: m, 
                    selected: selectedYears.includes(i) || selectedMonths.includes(m), 
                    psi: slice[n]
                })),
            });
        }

        console.log(years);

        let extent = d3.extent(data);
        let scale = d3.scaleSequential(d3.interpolateBlues)
            .domain([extent[1], extent[0]]);
        let greyscale = d3.scaleSequential(d3.interpolateGreys)
            .domain([extent[1], extent[0]]);

        table.classed("hasSelection", hasSelection);

        let colHeaders = head.selectAll("th.month")
            .data(months);
        colHeaders.enter()
            .append("th")
            .text(d => d)
            .attr("class", "month")
            .on("mousedown", (d) => {
                selectedMonths = [d];
                mousedown = true;
                window.renderHeatmap();
            })
            .on("mouseover", d => {
                if (mousedown) {
                    selectedMonths.push(d);
                    window.renderHeatmap();
                }
            })
            .merge(colHeaders)
            .classed("selected", d => selectedMonths.includes(d));

        let rows = tbody.selectAll("tr")
            .data(years);
        let newRows = rows.enter()
            .append("tr");
        newRows.append("th")
            .text(d => d.year)
            .on("mousedown", d => {
                selectedYears = [d.year];
                mousedown = true;
                window.renderHeatmap();
            })
            .on("mouseover", d => {
                if (mousedown) {
                    selectedYears.push(d.year);
                    window.renderHeatmap();
                }
            });
        rows = newRows
            .merge(rows);
        rows
            .classed("selectedYear", d => d.selected)
            .select("th")
            .attr("class", d => `year ${d.selected ? "selected" : ""}`);

        let cells = rows.selectAll("td.month")
            .data(year => year.months)
        cells.enter()
            .append("td")
            .attr("class", "month")
            .merge(cells)
            .style("background-color", d => hasSelection && !d.selected ? greyscale(d.psi) : scale(d.psi));

    };

    d3.select("body").on("mouseup", function() {
        if (mousedown) {
            mousedown = false;
            window.renderHeatmap();
        }
    });

    window.renderHeatmap();
}
