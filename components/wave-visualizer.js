const React = require('react');
const D3Component = require('idyll-d3-component');
const d3 = require('d3');

const size = 600;
const width = size;
const height = 255;

class CustomD3Component extends D3Component {

  initialize(node, props) {
    const canvas = d3.select(node).append('canvas').node();

    let scale = 1;
    const maxWidth = 0.9 * window.innerWidth;
    if (maxWidth < width) {
      scale = maxWidth / width;
    }

    canvas.width = this.width = width * scale;
    canvas.height = this.height = height;
    const context = this._context = canvas.getContext("2d");

    this.gradient = context.createLinearGradient(this.width / 2, 0, this.width / 2, this.height);
    this.gradient.addColorStop(0, "#50E3C2");
    this.gradient.addColorStop(1, "#4A90E2");

    this.drawWaveform = this.drawWaveform.bind(this);
    this.update = this.update.bind(this);

    if (props.inView) {
      this.update(props, true);
    }
  }

  drawWaveform(values) {
    this._context.clearRect(0, 0, this.width, this.height);
    this._context.beginPath();
    this._context.lineJoin = "round";
    this._context.lineWidth = 6;
    this._context.strokeStyle = this.gradient;
    this._context.moveTo(0, (values[0] / 255) * this.height);
    for (var i = 1, len = values.length; i < len; i++){
      var val = (values[i] + 1) / 2;
      var x = this.width * (i / len);
      var y = val * this.height;
      i > 2 ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
    }
    this._context.stroke();
  }

  update(props, force) {
    const oldProps = this.props;
    if (force || (this.context && props.waveform && props.inView && (!oldProps.waveform || !oldProps.inView))) {
        // Start the update loop
      const loop = () => {
        const waveValues = props.waveform.getValue();
        this.drawWaveform(waveValues);
        requestAnimationFrame(loop);
      }
      loop();
    }
  }
}

module.exports = CustomD3Component;
