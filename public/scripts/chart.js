document.addEventListener("DOMContentLoaded", () => {
    const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
    const req = new XMLHttpRequest();

    req.open("GET", url, true);
    req.send();
    req.onload = () => {
        const response = JSON.parse(req.responseText);
        const { monthlyVariance: dataset } = response;
        const { baseTemperature } = response;

        dataset.forEach(d => {
            --d.month;
            d.temperature = baseTemperature + d.variance;
        });

        const minX = d3.min(dataset, d => d.year);
        const maxX = d3.max(dataset, d => d.year);
        const minY = d3.min(dataset, d => d.month);
        const maxY = d3.max(dataset, d => d.month);
        const minTemp = d3.min(dataset, d => d.temperature);
        const maxTemp = d3.max(dataset, d => d.temperature);

        const svgW = 1200;
        const svgH = 500;
        const paddingW = 80; // SVG area
        const paddingH = 60; // SVG area
        const domainPadding = 1; // 1 year
        const cellW = svgW / (maxX - minX + 1)
        const cellH = (svgH - 2 * paddingH) / 12;

        const monthScale = d3.scaleQuantize()
        .domain([0, 11])
        .range([
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]);

        const colorScale = d3.scaleQuantize()
        .domain([minTemp, maxTemp]) // both are inclusive
        .range([
            "#005F73",
            "#0A9396",
            "#94D2BD",
            "#F7F0DE",
            "#FFDB99",
            "#FDA349",
            "#FC6722",
            "#DE2817",
            "#9B2226",
        ]);

        const xScale = d3.scaleLinear()
        .domain([minX, maxX + domainPadding])
        .range([paddingW, svgW - paddingW]);

        const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([svgH - paddingH - cellH, paddingH]);

        const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("left", "-100px")
        .style("top", "-100px");

        const svg = d3.select("#chart-container")
        .append("svg")
        .attr("id", "svg")
        .attr("width", svgW)
        .attr("height", svgH);

        svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.month))
        .attr("width", cellW )
        .attr("height", cellH)
        .attr("fill", d => colorScale(d.temperature))
        .attr("class", "cell")
        .attr("data-year", d => d.year)
        .attr("data-month", d => d.month)
        .attr("data-temp", d => d.temperature)
        .on("mouseover", (event, d) => {
            tooltip
            .html(`${d.year} - ${monthScale(d.month)}<br>
            Temperature: ${d.temperature.toFixed(1)}℃<br>
            Variance: ${d.variance.toFixed(1)}℃`)
            .attr("data-year", d.year)
            .attr("data-month", d.month)
            .attr("data-temp", d.temperature)
            .style("opacity", 1)
            .style("position", "absolute")
            .style("top", event.pageY + "px")
            .style("left", event.pageX + "px");
        })
        .on("mouseout", () => {
            tooltip
            .style("opacity", 0)
            .style("top", "-100px")
            .style("left", "-100px");
        });

        const yearFormat = d3.format("d");
        const xAxisGenerator = d3.axisBottom(xScale).tickFormat(yearFormat);
        const yAxisGenerator = d3.axisLeft(yScale).tickFormat(monthScale);

        const xAxis = svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${svgH - paddingH})`)
        .call(xAxisGenerator);

        const yAxis = svg
        .append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${paddingW}, ${cellH / 2})`)
        .call(yAxisGenerator);

        xAxis.selectAll("g").attr("class", "tick");
        yAxis.selectAll("g").attr("class", "tick");

        svg
        .append("text")
        .text("Monthly Global Land-Surface Temperature")
        .attr("id", "title")
        .attr("x", svgW / 2)
        .attr("y", paddingH / 2)
        .style("text-anchor", "middle")
        .style("font-size", "1.5rem");

        svg
        .append("text")
        .text(`${minX} - ${maxX}: base temperature ${baseTemperature}℃`)
        .attr("id", "description")
        .attr("x", svgW / 2)
        .attr("y", (paddingH / 2) + 20)
        .style("text-anchor", "middle")
        .style("font-size", "0.9rem");

        const legendH = colorScale.range().length * cellH;

        const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${svgW - paddingW + 15}, ${(svgH / 2) + (legendH / 2)})`);

        legend.selectAll("rect")
        .data(colorScale.range())
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (_, i) => -(++i * cellH))
        .attr("height", cellH)
        .attr("width", cellW)
        .attr("fill", d => d);

        const legendScale = d3.scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, -(cellH * colorScale.range().length)]);

        const getLegendValues = (minTemp, maxTemp, tickNum) => {
            const values = [];
            const range = (maxTemp - minTemp) / tickNum;
            let value = minTemp;

            while (value <= maxTemp) {
                values.push(value);
                value += range;
            }
            return values;
        };

        const legendAxisGenerator = d3.axisRight(legendScale)
        .tickValues(getLegendValues(minTemp, maxTemp, colorScale.range().length))
        .tickFormat(d3.format(".2f"));

        const legendAxis = legend
        .append("g")
        .attr("id", "legend-axis")
        .attr("transform", `translate(${cellW},0)`)
        .call(legendAxisGenerator);

        legendAxis.selectAll("g").attr("class", "tick");
    };
});