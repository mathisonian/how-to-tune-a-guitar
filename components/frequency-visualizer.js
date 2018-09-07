const React = require('react');
const D3Component = require('idyll-d3-component');
const d3 = require('d3');

const size = 500;

// string info
const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
const inTuneFreq= [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];


class FrequencyVisualizer extends D3Component {

  initialize(node, props) {
    // create svg
    const svg = this.svg = d3.select(node).append('svg');
    svg.attr('viewBox', `0 0 ${size} ${size / 2}`)
      .style('width', '100%')
      .style('height', 'auto');

    // margins, width, and height
    const margin = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 75
    }
    this.width = size - margin.left - margin.right,
    this.height = size / 2 - margin.top - margin.bottom;
    // scales
    let xScale = d3.scaleLog()
        .base(2)
        .domain([2, 1000]) // frequency range
        .range([0, this.width]);
    let xBin = d3.scaleQuantize()
        .domain([2, 1000])
        .range(d3.range(2, 1002, 2).map((e) => { return xScale(e)}));
    let yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([this.height, 0]);
    // define line function
    // let lineFunc = d3.line()
    //     .x((d) => { return xScale(d.freq)})
    //     .y((d) => { return yScale(d.intensity)});
    // define axes functions
    let xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(10, ".1s");
    let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(5, ".1s");
    // generate chart
    let chart = svg.append('g')
        .attr('class', 'chart frequency-visualizer')
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    // generate axes
    chart.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${this.height})`)
        .call(xAxis);
    chart.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis);
    // create plot of fake data
    let fakeData = [ // overtone frequencies for A string
        {'freq': 110, 'intensity': .9},
        {'freq': 220, 'intensity': .25},
        {'freq': 330, 'intensity': .15},
        {'freq': 440, 'intensity': .25},
        {'freq': 550, 'intensity': .25}
    ];
    // this.line = chart.append('path')
    //     .attr('id', 'freq-data')
    //     .datum(fakeData)
    //     .attr("fill", "none")
    //     .attr("stroke", "#49bc55")
    //     .attr("stroke-linejoin", "round")
    //     .attr("stroke-linecap", "round")
    //     .attr("stroke-width", 1.5)
    //     .attr("d", lineFunc);
    this.bars = chart.selectAll('rect.bar')
        .data(fakeData)
        .enter().append('rect')
            .attr('class', 'bar')
            .attr("fill", "#49bc55")
            .attr("stroke", "none")
            .attr('x', (d) => { return xBin(d.freq); })
            .attr('y', (d) => { return yScale(d.intensity); })
            .attr('width', 3)
            .attr('height', (d) => { return this.height - yScale(d.intensity); });
  }

  update(props) {
    const oldProps = this.props;

    if (props.fft && props.inView && (!oldProps.fft || !oldProps.inView)) {
        // Start the update loop

		function loop(){
            //get the fft data and draw it
			var fftValues = props.fft.getValue();
            console.log(fftValues);

			requestAnimationFrame(loop);
		}
		loop();
    }
    // // update
    // this.bars.data(props.frequencies)
    //     .enter().append('rect')
    //         .transition()
    //             .duration(100)
    //             .delay(50)
    //             .attr('x', (d) => { return xBin(d.freq); })
    //             .attr('y', (d) => { return yScale(d.intensity); })
    //             .attr('this.width', 3)
    //             .attr('height', (d) => { return this.height - yScale(d.intensity); });
    // // enter
    // this.bars.enter().append('rect')
    //     .attr('class', 'bar')
    //     .attr("fill", "#49bc55")
    //     .attr("stroke", "none")
    //     .attr('x', (d) => { return xBin(d.freq); })
    //     .attr('y', (d) => { return yScale(d.intensity); })
    //     .attr('width', 3)
    //     .attr('height', (d) => { return this.height - yScale(d.intensity); });
    // // exit
    // this.bars.exit().remove();
  }
}

module.exports = FrequencyVisualizer;