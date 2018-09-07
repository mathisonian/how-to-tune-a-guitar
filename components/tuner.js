const React = require('react');
const D3Component = require('idyll-d3-component');
const d3 = Object.assign({}, require("d3"), require("d3-transition"));

const size = 500;

// string info
const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
const inTuneFreq= [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

class Tuner extends D3Component {

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
        left: 50
    }
    this.width = size - margin.left - margin.right,
    this.height = size / 2 - margin.top - margin.bottom,
    this.radius = this.width / 2;
    // scales
    this.r = d3.scaleLinear()
        .domain([0, 1])
        .range([0, this.radius]);
    this.angle = d3.scaleLinear()
        .domain([-50, 50]) // plus or minus cents
        .range([180, 0]); // left to right
    // generate chart
    const chart = svg.append('g')
        .attr('class', 'chart tuner')
        .attr("transform", `translate(${margin.left}, ${margin.top + 40})`);
    // target zone
    let targetRangeCents = 3; // size of target zone in cents
    let targetZone = d3.arc()
        .innerRadius(30)
        .outerRadius(this.radius)
        .startAngle((d) => { return d; })
        .endAngle((d) => { return -d; });
    // generate polar axis (semicirle)
    chart.append('circle')
        .attr('class', 'axis axis-arc')
        .attr('r', this.radius)
        .attr("transform", `translate(${this.radius}, ${this.height})`)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('fill', '#FEFEFE');
    chart.append('path')
        .datum( (90 - this.angle(targetRangeCents / 2)) / 180 * Math.PI) // argument = radians difference from verticle
        .attr('class', 'target-zone')
        .attr("transform", `translate(${this.radius}, ${this.height + 1})`)
        .style("fill", "#7ED321")
        .attr('opacity', 0.8)
        .attr("d", targetZone);
    const axis = chart.append('g')
        .attr('class', 'axis axis-polar')
        .attr('transform', `translate(${this.radius}, ${this.height})`)
        .selectAll('g')
            .data(d3.range(0, 189, 9))
            .enter().append('g')
                .attr("transform", function(d) { return `rotate(${-d})`; });
    axis.append("text")
        .attr("x", this.radius + 6)
        .attr("dy", ".35em")
        .style("text-anchor", (d) => { return d > 90 ? "end" : null; })
        .attr('alignment-baseline', 'center')
        .attr("transform", (d) => { return d > 90 ? `rotate(180, ${this.radius + 6}, 0)` : d === 90 ? `rotate(90, ${this.radius + 11}, 0)` : null; })
        .text((d) => { return parseInt(this.angle.invert(d)); });
    axis.append("line")
        .attr("x1", this.radius)
        .attr('x2', this.radius - 7)
        .attr("stroke", "#999");
    // create tuner needle
    this.needle = chart.append('line')
        .attr('id', 'tuner-needle')
        .attr('x1', this.radius) // circle edge at this.radius + 30
        .attr('x2', this.radius) // needle starts up
        .attr('y1', this.height)
        .attr('y2', this.height - this.radius + 20) // needle starts up
        .attr('stroke', '#D0021B')
        .attr('stroke-width', 2);
        // .attr("transform", `rotate(${-this.angle(this.calculateCents(props.selectedString, props.currFreq))}, ${this.radius}, ${this.height})`);
    chart.append('circle')
        .attr('class', 'needle-base')
        .attr('r', 30)
        .attr("transform", `translate(${this.radius}, ${this.height})`)
        .attr('stroke', '#666')
        .attr('fill', 'white');
    // create current string indicator
    this.stringIndicator = chart.append('text')
        .attr('id', 'current-string')
        .attr("x", this.radius - 12)
        .attr("y", this.height + 8)
        .attr("fill", "#D0021B")
        .style("font-weight", "bold")
        .style('font-size', '28pt')
        .text(strings[props.selectedString]);
    // orienting text for when current frequency is out of the range [-50, 50]
    this.outOfRangeMessage = chart.append('text')
        .attr('id', 'out-of-range-message')
        .attr("x", this.radius - 80)
        .attr("y", this.height - 80)
        .attr("fill", "red")
        .style('font-size', '14pt')
        .attr('visibility', 'hidden');
  }

  update(props) {
    // store previous properties and calculate new value for cents
    const oldProps = this.props,
        newCents = this.calculateCents(props.selectedString, props.currFreq),
        oldCents = this.calculateCents(oldProps.selectedString, oldProps.currFreq),
        centsDiff = newCents - oldCents,
        radius = this.radius,
        height = this.height;
    let dur,
        easeFunc,
        startAngle,
        endAngle;
    // transition differently depending on whether string has changed
    if (props.selectedString !== oldProps.selectedString) {
        // the string changed:
        // update current string display
        this.stringIndicator.text(strings[props.selectedString]);
        // use elastic easing over 250ms
        dur = 200;
        easeFunc = d3.easeCubic;
    } else {
        // string is the same: update based on direction and magnitude of change
        const oldCents = this.calculateCents(oldProps.selectedString, oldProps.currFreq);
        const centsDiff = newCents - oldCents;
        dur = 5 * Math.abs(centsDiff) < 200 ? 200 : 5 * Math.abs(centsDiff);
        if (centsDiff > 0) {
            easeFunc = this.tunerEaseUp;
        } else {
            easeFunc = this.tunerEaseDown;
        }
    }

    // choose new needle position and update out of range message
    if (newCents > 50) {
        // too sharp
        this.outOfRangeMessage.text('the string is too sharp')
            .attr('visibility', 'visible');
        endAngle = 0;
    } else if (newCents < -50) {
        // too flat
        this.outOfRangeMessage.text('the string is too flat')
            .attr('visibility', 'visible');
        endAngle = 180;
    } else { // in range
        this.outOfRangeMessage.text('')
            .attr('visibility', 'hidden');
        endAngle = this.angle(newCents);
    }
    // determine starting needle position
    if (oldCents > 50) {
        startAngle = 0;
    } else if (oldCents < - 50) {
        startAngle = 180;
    } else {
        startAngle = this.angle(oldCents);
    }

    // update needle rotation
    this.needle.transition()
        .duration(dur)
        .attrTween('x2', function() {
            return function(t) {
                // get current angle (in radians)
                const theta = (easeFunc(t) * (endAngle - startAngle) + startAngle) / 180 * Math.PI;
                // calculate x coordinate of line end based on current angle
                return radius + (radius - 20) * Math.cos(theta);
            }
        })
        .attrTween('y2', function() {
            return function(t) {
                // get current angle (in radians)
                const theta = (easeFunc(t) * (endAngle - startAngle) + startAngle) / 180 * Math.PI;
                // calculate y coordinate of line end based on current angle
                return height - (radius - 20) * Math.sin(theta);
            }
        });
        // .attr('transform', rotation);
  }

  componentWillReceiveProps(newProps) {
    // update display
    this.update(newProps);
    
    // update props
    this.props.updateProps({ selectedString: newProps.selectedString, currFreq: newProps.currFreq });
  }

  // convert difference between current frequency and target frequency of current string into cents
  // see http://hyperphysics.phy-astr.gsu.edu/hbase/Music/cents.html
  calculateCents = function(selectedString, currFreq) {
    let freqRatio = currFreq / inTuneFreq[selectedString];
    let cents = 1200 * Math.log(freqRatio) / Math.log(2);
    return cents;
  }

  // custom easing functions to imitate the behavior of a tuner needle
  // due to the impact of articulation, the needle will always start sharp of the tartget value
  // and easy into the target value from above
  tunerEaseUp = function(time) {
      // parameters
      let overshoot = 1.25;
      let overshootTime = 0.1;
      // overshoots target value and eases back
      return time <= overshootTime ? overshoot * Math.pow((time / overshootTime), 3) : overshoot - (overshoot - 1) * Math.sqrt((time - overshootTime) / (1 - overshootTime));
  }
  tunerEaseDown = function(time) {
    // parameters
    let undershoot = 0.75;
    let undershootTime = 0.1;
    // overshoots target value and eases back
    return time <= undershootTime ? undershoot * Math.pow((time / undershootTime), 3) : undershoot + (1 - undershoot) * Math.sqrt((time - undershootTime) / (1 - undershootTime));
}
}

module.exports = Tuner;
