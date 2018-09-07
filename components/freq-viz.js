const React = require('react');
const D3Component = require('idyll-d3-component');
const d3 = require('d3');

const size = 600;
const width = size;
const height = 255;

const beatsRange = [200, 350];

class CustomD3Component extends D3Component {

  initialize(node, props) {
    const canvas = d3.select(node).append('canvas').style('border-bottom', 'solid 1px black').node();

    const axis = d3.select(node)
      .append('div')
      .style('width', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .style('justify-content', 'space-around')
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')
      .style('text-transorm', 'uppercase')
      .style('margin-bottom', '15px');

    axis.append('div')
      .text('← Bass')

    axis.append('div')
      .text('Frequency')
      .style('font-weight', 'bold')

    axis.append('div')
    .text('Treble →')

    let scale = 1;
    const maxWidth = 0.9 * window.innerWidth;
    if (maxWidth < width) {
      scale = maxWidth / width;
    }

    canvas.width = this.width = width * scale;
    canvas.height = this.height = height;
    const context = this._context = canvas.getContext("2d");

    this.gradient = context.createLinearGradient(this.width / 2, this.height / 3, this.width / 2, this.height);
    this.gradient.addColorStop(0, "#7ED321");
    this.gradient.addColorStop(1, "#4A90E2");

    this.drawFFT = this.drawFFT.bind(this);
    this.update = this.update.bind(this);
  }

  drawFFT(fft, values) {
    this._context.clearRect(0, 0, this.width, this.height);
    var barWidth = Math.ceil(this.width / fft.size);
    for (var i = 0, len = values.length; i < len; i++){
      var x = this.width * (i / len);
      var y = (values[i] + 140) * 2;
      this._context.fillStyle = this.props.showBeats ? (i >= beatsRange[0]  && i < beatsRange[1] ?  this.gradient : '#ddd') : this.gradient;
      this._context.fillRect(x, (this.height - y), barWidth, this.height);
    }
  }

  update(props) {
    const oldProps = this.props;
    if (this._context && props.fft && props.inView && (!oldProps.fft || !oldProps.inView)) {
        // Start the update loop
      const loop = () => {
        const fftValues = (this.props.fft || props.fft).getValue();
        this.drawFFT(this.props.fft || props.fft, fftValues);
        requestAnimationFrame(loop);
      }
      loop();
    }
  }
}

module.exports = CustomD3Component;
