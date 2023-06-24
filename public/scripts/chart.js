    document.addEventListener("DOMContentLoaded", () => {
        /**
         * Create and render the empty SVG root when the page first loads
         * while wait for the JSON files to download
         */
        const svgW = 960;
        const svgH = 600;
        const paddingH = 50;

        const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("left", "-100px")
        .style("top", "-100px");

        const title = d3.select("#chart-container")
        .append("h1")
        .text("United States Educational Attainment")
        .attr("id", "title");

        const description = d3.select("#chart-container")
        .append("p")
        .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)")
        .attr("id", "description");

        const svg = d3.select("#chart-container")
        .append("svg")
        .attr("id", "svg")
        .attr("width", svgW)
        .attr("height", svgH);

        const counties = svg
        .append("g")
        .attr("class", "counties");

        const states = svg
        .append("g")
        .attr("class", "states");

        const source = d3.select("#chart-container")
        .append("div")
        .attr("id", "source")
        .html(`Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx" target="_blank">USDA Economic Research Service</a>`);

        const req = new XMLHttpRequest();

        const urlCountyData = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
        const urlEducationData = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

        req.open("GET", urlCountyData, true);
        req.send();
        req.onload = () => {
            const countyData = JSON.parse(req.responseText);

            req.open("GET", urlEducationData, true);
            req.send();
            req.onload = () => {
                const educationData = JSON.parse(req.responseText);

                educationData.forEach(elem => {
                    elem.education = elem.bachelorsOrHigher;
                    delete elem.bachelorsOrHigher;
                });

                const educationLookup = {};

                educationData.forEach(elem => {
                    educationLookup[elem.fips] = elem;
                });

                const featuresStates = topojson.feature(countyData, countyData.objects.states).features;
                const featuresCounties = topojson.feature(countyData, countyData.objects.counties).features;

                featuresCounties.forEach(elem => {
                    elem.properties = educationLookup[elem.id];
                });

                const minEdu = d3.min(educationData, ({ education }) => education);
                const maxEdu = d3.max(educationData, ({ education }) => education);

                const colorScale = d3.scaleQuantize()
                .domain([minEdu, maxEdu]) // both are inclusive
                .range([
                    "#CEE8F0",
                    "#A9D6E5",
                    "#7DC1D8",
                    "#51ADCB",
                    "#3490AF",
                    "#276C83",
                    "#1A4858",
                ]);

                counties.selectAll("path")
                .data(featuresCounties)
                .enter()
                .append("path")
                .attr("class", "county")
                .attr("data-fips", feature => feature.properties.fips)
                .attr("data-education", feature => feature.properties.education)
                .attr("fill", feature => colorScale(feature.properties.education))
                .attr("d", d3.geoPath())
                .on("mouseover", (event, feature) => {
                    tooltip
                    .html(`<p>${feature.properties.area_name}, ${feature.properties.state}: ${feature.properties.education}%</p>`)
                    .attr("data-education", feature.properties.education)
                    .style("opacity", 1)
                    .style("position", "absolute")
                    .style("top", event.pageY - 30 + "px")
                    .style("left", event.pageX + 15 + "px");
                })
                .on("mouseout", () => {
                    tooltip
                    .style("opacity", 0)
                    .style("top", "-100px")
                    .style("left", "-100px");
                });

                states.selectAll("path")
                .data(featuresStates)
                .enter()
                .append("path")
                .attr("class", "state")
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("d", d3.geoPath());

                const legendW = 250;
                const legendH = 8;
                const legendCellW = legendW / colorScale.range().length;
        
                const legend = svg.append("g")
                .attr("id", "legend")
                .attr("transform", `translate(${svgW / 2 + legendCellW * 3}, ${paddingH / 2})`);
        
                legend.selectAll("rect")
                .data(colorScale.range())
                .enter()
                .append("rect")
                .attr("x", (_, i) => i * legendCellW)
                .attr("y", 0)
                .attr("width", legendCellW)
                .attr("height", legendH)
                .attr("fill", d => d);

                const legendScale = d3.scaleLinear()
                .domain([minEdu / 100, maxEdu / 100])
                .range([0, legendW]);

                const getTickValues = (min, max, Categorynum) => {
                    let ticks = [];
                    const range = (max - min) / Categorynum;
                    let tick = min;

                    while (ticks.length <= Categorynum) { // The last tick value is inclusive
                        ticks.push(Number.parseFloat(tick.toFixed(1)) / 100);
                        tick += range;
                    }
                    return ticks;
                };

                const legendAxisGenerator = d3.axisBottom(legendScale)
                .tickValues(getTickValues(minEdu, maxEdu, colorScale.range().length))
                .tickFormat(d3.format("0.0%"));

                const legendAxis = legend.append("g")
                .attr("id", "legend-axis")
                .attr("transform", `translate(0, ${legendH})`)
                .call(legendAxisGenerator);

                legendAxis.selectAll("g").attr("class", "tick");
            };
        };
    });