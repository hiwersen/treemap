document.addEventListener("DOMContentLoaded", () => {
    const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
    const req = new XMLHttpRequest();

    req.open("GET", url, true);
    req.send();
    req.onload = () => {
        const response = JSON.parse(req.responseText);
        const { monthlyVariance: dataset } = response;
        const { baseTemperature } = response;

        const monthScale = d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
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

        const colorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4, 5, 6, 7, 8, 9])
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

        const getCategory = (min, max, categoryNumber, num) => {
            if (min > max) return "min cannot be greater than max";
            if (num < min || num > max) return "num out of range";
            if (num === max) return categoryNumber;

            const range = (max - min) / categoryNumber;
            let nextCategory = min + range;
            let category = 1;

            do {
                if (num < nextCategory) return category;
                category++;
                nextCategory = min + range * category;
            } while (category <= categoryNumber)
        };

        dataset.forEach((d, _, dataset) => {
            let { month } = d;
            --month;
            const monthName = monthScale(month);
            d.month = [month, monthName];

            const varianceMin = d3.min(dataset, d => d.variance);
            const varianceMax = d3.max(dataset, d => d.variance);
            const { variance } = d;
            const temperature = Number((baseTemperature + variance).toFixed(3)); // rouding might cause problem
            const temperatureCategory = getCategory(
                varianceMin, 
                varianceMax, 
                colorScale.domain().length, 
                d.variance);
            const temperatureColor = colorScale(temperatureCategory);
            d.temperature = [temperature, temperatureColor];
        });

        const minX = d3.min(dataset, d => d.year);
        const maxX = d3.max(dataset, d => d.year);
        const minY = d3.min(dataset, d => d.month[0]);
        const maxY = d3.max(dataset, d => d.month[0]);

        const svgW = 1200;
        const svgH = 500;
        const padding = 65; // SVG area padding
        const cellW = svgW / (maxX - minX + 1)
        const cellH = (svgH - 2 * padding) / 12;

        const xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([padding * 1.5, svgW - padding]);

        const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([svgH - padding - cellH, padding]);

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
        .attr("width", svgW)
        .attr("height", svgH)
        .attr("id", "svg");

        svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.month[0]))
        .attr("width", cellW )
        .attr("height", cellH)
        .attr("fill", d => d.temperature[1])
        .attr("class", "cell")
        .attr("data-year", d => d.year)
        .attr("data-month", d => d.month[0])
        .attr("data-temp", d => d.temperature[0])
        .on("mouseover", (event, d) => {
            tooltip
            .attr("data-year", d.year)
            .html(`${d.year} - ${d.month[1]}<br>
            Temperature: ${d.temperature[0].toFixed(1)}℃<br>
            Variance: ${d.variance.toFixed(1)}℃`)
            .style("opacity", 1)
            .style("position", "absolute")
            .style("top", event.pageY + "px")
            .style("left", event.pageX + "px");
        })
        .on("mouseout", () => {
            tooltip
            .style("opacity", 0)
            // Move the tooltip out of the svg area so that other .dots can reliably be hovered,
            // without the tooltip overlapping them
            .style("top", "-100px")
            .style("left", "-100px");
        });

        const yearFormat = d3.format("d");
        const xAxisGenerator = d3.axisBottom(xScale).tickFormat(yearFormat);
        const yAxisGenerator = d3.axisLeft(yScale).tickFormat(monthScale);
        //const legendAxisGenerator = d3.axisRigth();

        const xAxis = svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${svgH - padding})`)
        .call(xAxisGenerator);

        const yAxis = svg
        .append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${padding * 1.5}, ${cellH / 2})`)
        .call(yAxisGenerator);
        
        xAxis.selectAll("g").attr("class", "tick");
        yAxis.selectAll("g").attr("class", "tick");

        svg
        .append("text")
        .text("Monthly Global Land-Surface Temperature")
        .attr("id", "title")
        .attr("x", svgW / 2)
        .attr("y", padding / 2)
        .style("text-anchor", "middle")
        .style("font-size", "1.6rem");

        svg
        .append("text")
        .text(`${minX} - ${maxX}: base temperature ${baseTemperature}℃`)
        .attr("id", "description")
        .attr("x", svgW / 2)
        .attr("y", (padding / 2) + 20)
        .style("text-anchor", "middle")
        .style("font-size", "1.1rem");

        const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${svgW - padding + 15}, ${(svgH / 2) - (colorScale.domain().length * cellH / 2)})`);

        legend.selectAll("g")
        .data(colorScale.domain())
        .enter()
        .append("g")
        .attr("transform", (_, i) => `translate(0, ${i * cellH})`);

        legend.selectAll("g")
        .append("rect")
        .attr("height", cellH)
        .attr("width", cellW)
        .attr("fill", d => colorScale(d));

        legend.selectAll("g")
        .append("text")
        .text("text here")
        .attr("transform", `translate(${cellW * 2}, ${cellH / 2})`)
        .style("text-anchor", "start")
        .style("font-size", "0.8rem");
    };
});